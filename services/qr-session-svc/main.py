"""
CareConnect QR Session Service.

Handles one-time QR token generation and atomic consumption.
TTL: 5 minutes default.
"""

import base64
import io
import uuid
from datetime import datetime, timedelta
from typing import Optional

import qrcode
from fastapi import FastAPI, HTTPException, Header, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from careconnect_common import (
    DemoAuthValidator,
    IdempotencyMiddleware,
    IdempotencyStore,
    configure_logging,
    get_logger,
    CorrelationIdMiddleware,
)
from careconnect_common.auth import AuthContext, require_auth

# Configure logging
configure_logging()
logger = get_logger(__name__)

app = FastAPI(
    title="CareConnect QR Session Service",
    version="0.1.0",
    description="One-time QR tokens for consent-based sharing",
)

# CORS for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Correlation ID middleware
app.add_middleware(CorrelationIdMiddleware)

# Idempotency middleware
idempotency_store = IdempotencyStore()
app.add_middleware(IdempotencyMiddleware, store=idempotency_store)

# Auth validator (demo mode)
auth_validator = DemoAuthValidator()


# Models
class QrLinkCreate(BaseModel):
    patient_id: str = Field(..., description="Patient UUID")
    consent_scope: list[str] = Field(..., description="Data categories")
    ttl_seconds: int = Field(default=300, ge=60, le=600)


class QrLink(BaseModel):
    token: str
    qr_payload: str
    expires_at: str


class QrLinkConsume(BaseModel):
    clinician_id: str


class QrConsumeResult(BaseModel):
    session_id: str
    patient_id: str
    consent_scope: list[str]


class QrSessionRecord:
    """In-memory QR session store."""

    def __init__(self):
        self._sessions: dict[str, dict] = {}

    def create(
        self, patient_id: str, consent_scope: list[str], ttl_seconds: int
    ) -> QrLink:
        """Create new QR session token."""
        token = str(uuid.uuid4())
        expires_at = datetime.utcnow() + timedelta(seconds=ttl_seconds)

        # Generate QR code
        qr_data = f"careconnect://qr/{token}"
        qr = qrcode.QRCode(version=1, box_size=10, border=4)
        qr.add_data(qr_data)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        qr_payload = base64.b64encode(buf.getvalue()).decode()

        # Store session
        self._sessions[token] = {
            "patient_id": patient_id,
            "consent_scope": consent_scope,
            "expires_at": expires_at,
            "status": "pending",
            "consumed_by": None,
            "session_id": None,
        }

        logger.info(
            "qr_session_created",
            token=token,
            patient_id=patient_id,
            expires_at=expires_at.isoformat(),
        )

        return QrLink(
            token=token,
            qr_payload=qr_payload,
            expires_at=expires_at.isoformat(),
        )

    def consume(self, token: str, clinician_id: str) -> QrConsumeResult:
        """Atomically consume QR token."""
        session = self._sessions.get(token)

        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Token not found or expired",
            )

        if session["expires_at"] < datetime.utcnow():
            del self._sessions[token]
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Token expired",
            )

        if session["status"] == "consumed":
            raise HTTPException(
                status_code=status.HTTP_410_GONE,
                detail="Token already consumed",
            )

        # Atomic consume
        session_id = str(uuid.uuid4())
        session["status"] = "consumed"
        session["consumed_by"] = clinician_id
        session["session_id"] = session_id

        logger.info(
            "qr_session_consumed",
            token=token,
            clinician_id=clinician_id,
            session_id=session_id,
        )

        return QrConsumeResult(
            session_id=session_id,
            patient_id=session["patient_id"],
            consent_scope=session["consent_scope"],
        )

    def get(self, token: str) -> Optional[dict]:
        """Get session by token."""
        return self._sessions.get(token)


# Global session store
qr_sessions = QrSessionRecord()


@app.middleware("http")
async def auth_middleware(request, call_next):
    """Apply auth validation to all requests except health."""
    if request.url.path == "/health":
        return await call_next(request)

    await auth_validator.validate(request)
    return await call_next(request)


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy", "service": "qr-session-svc"}


@app.post("/v1/qr/links", response_model=QrLink, status_code=status.HTTP_201_CREATED)
async def create_qr_link(
    payload: QrLinkCreate,
    idempotency_key: str = Header(..., alias="Idempotency-Key"),
    auth: AuthContext = Depends(require_auth),
):
    """
    Generate one-time QR share link.

    Requires Idempotency-Key header.
    """
    logger.info(
        "create_qr_link_requested",
        patient_id=payload.patient_id,
        ttl_seconds=payload.ttl_seconds,
    )

    link = qr_sessions.create(
        patient_id=payload.patient_id,
        consent_scope=payload.consent_scope,
        ttl_seconds=payload.ttl_seconds,
    )

    return link


@app.post(
    "/v1/qr/links/{token}/consume",
    response_model=QrConsumeResult,
    status_code=status.HTTP_200_OK,
)
async def consume_qr_link(
    token: str,
    payload: QrLinkConsume,
    idempotency_key: str = Header(..., alias="Idempotency-Key"),
    auth: AuthContext = Depends(require_auth),
):
    """
    Consume one-time QR token.

    Atomic operation. Idempotent within TTL.
    """
    logger.info(
        "consume_qr_link_requested",
        token=token,
        clinician_id=payload.clinician_id,
    )

    result = qr_sessions.consume(token, payload.clinician_id)

    return result


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8002, log_level="info")
