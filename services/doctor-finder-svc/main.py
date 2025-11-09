"""
CareConnect Doctor Finder Service.

Opt-in concierge for provider discovery.
Uses compliant sources only (public directories, APIs with TOS compliance).
No scraping that violates TOS.
"""

import uuid
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, HTTPException, Header, Depends, Query, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

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
    title="CareConnect Doctor Finder Service",
    version="0.1.0",
    description="Provider discovery from compliant sources",
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
class DoctorFinderSubscription(BaseModel):
    region: str
    language: str
    specialty: Optional[str] = None
    constraints: Optional[dict] = None


class DoctorFinderSubscriptionResult(BaseModel):
    subscriber_id: str
    region: str
    language: str
    specialty: Optional[str] = None
    constraints: Optional[dict] = None
    created_at: str


class DoctorMatch(BaseModel):
    provider_id: str
    name: str
    specialty: str
    location: Optional[dict] = None
    accepting_patients: Optional[bool] = None
    languages: Optional[list[str]] = None
    source_url: str


class SourceAllowlist:
    """
    Allowlist of compliant provider sources.

    Only public/official directories with TOS compliance.
    No web scraping that violates terms.
    """

    ALLOWED_SOURCES = [
        # Example compliant sources (demo data)
        {
            "name": "Alberta College of Physicians and Surgeons",
            "url": "https://search.cpsa.ca/physiciansearch",
            "type": "api",  # or 'rss', 'json-feed'
            "robots_txt_allowed": True,
            "tos_compliant": True,
        },
        {
            "name": "BC College of Family Physicians",
            "url": "https://www.cpsbc.ca/physician_search",
            "type": "public_directory",
            "robots_txt_allowed": True,
            "tos_compliant": True,
        },
        # Manual CSV import fallback
        {"name": "Manual CSV Import", "type": "csv", "tos_compliant": True},
    ]

    @classmethod
    def is_allowed(cls, source_url: str) -> bool:
        """Check if source URL is in allowlist."""
        for source in cls.ALLOWED_SOURCES:
            if source.get("url") and source_url.startswith(source["url"]):
                return True
        return False


class DoctorFinderWorker:
    """
    Background worker for provider discovery.

    Polls compliant sources, caches normalized entries.
    Human-in-loop for outreach.
    """

    def __init__(self):
        self._subscriptions: dict[str, dict] = {}
        self._matches: dict[str, list[dict]] = {}  # subscriber_id -> matches

        # Demo: seed with synthetic matches
        self._seed_demo_data()

    def _seed_demo_data(self):
        """Seed demo data for testing."""
        demo_matches = [
            {
                "provider_id": "dr-001",
                "name": "Dr. Sarah Johnson",
                "specialty": "family",
                "location": {"city": "Calgary", "province": "AB"},
                "accepting_patients": True,
                "languages": ["en"],
                "source_url": "https://search.cpsa.ca/physiciansearch",
            },
            {
                "provider_id": "dr-002",
                "name": "Dr. Pierre Dubois",
                "specialty": "family",
                "location": {"city": "Montreal", "province": "QC"},
                "accepting_patients": True,
                "languages": ["en", "fr"],
                "source_url": "https://cmq.org/bottin/",
            },
            {
                "provider_id": "dr-003",
                "name": "Dr. Emily Chen",
                "specialty": "cardiology",
                "location": {"city": "Vancouver", "province": "BC"},
                "accepting_patients": False,
                "languages": ["en"],
                "source_url": "https://www.cpsbc.ca/physician_search",
            },
        ]

        # Store demo matches under a fake subscriber
        self._matches["demo-subscriber"] = demo_matches

    async def create_subscription(
        self, user_id: str, payload: DoctorFinderSubscription
    ) -> DoctorFinderSubscriptionResult:
        """Create new subscription."""
        subscriber_id = str(uuid.uuid4())
        now = datetime.utcnow()

        self._subscriptions[subscriber_id] = {
            "subscriber_id": subscriber_id,
            "user_id": user_id,
            "region": payload.region,
            "language": payload.language,
            "specialty": payload.specialty,
            "constraints": payload.constraints or {},
            "created_at": now,
        }

        logger.info(
            "doctor_finder_subscription_created",
            subscriber_id=subscriber_id,
            region=payload.region,
        )

        return DoctorFinderSubscriptionResult(
            subscriber_id=subscriber_id,
            region=payload.region,
            language=payload.language,
            specialty=payload.specialty,
            constraints=payload.constraints,
            created_at=now.isoformat(),
        )

    async def get_matches(self, subscriber_id: str) -> list[DoctorMatch]:
        """Get matched providers for subscriber."""
        subscription = self._subscriptions.get(subscriber_id)
        if not subscription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Subscription not found",
            )

        # Demo: return filtered matches
        all_matches = self._matches.get("demo-subscriber", [])

        # Filter by region/specialty
        filtered = all_matches
        if subscription.get("specialty"):
            filtered = [
                m for m in filtered if m["specialty"] == subscription["specialty"]
            ]

        # Filter by language
        if subscription.get("language"):
            filtered = [
                m
                for m in filtered
                if subscription["language"] in m.get("languages", [])
            ]

        logger.info(
            "doctor_matches_retrieved",
            subscriber_id=subscriber_id,
            match_count=len(filtered),
        )

        return [DoctorMatch(**m) for m in filtered]


# Global worker
worker = DoctorFinderWorker()


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
    return {"status": "healthy", "service": "doctor-finder-svc"}


@app.post(
    "/v1/doctor-finder/subscribe",
    response_model=DoctorFinderSubscriptionResult,
    status_code=status.HTTP_201_CREATED,
)
async def subscribe(
    payload: DoctorFinderSubscription,
    idempotency_key: str = Header(..., alias="Idempotency-Key"),
    auth: AuthContext = Depends(require_auth),
):
    """
    Opt-in to Doctor Finder concierge.

    Subscribes to receive warm intros for local providers.
    Uses compliant sources only.
    """
    logger.info(
        "doctor_finder_subscribe_requested",
        region=payload.region,
        specialty=payload.specialty,
    )

    result = await worker.create_subscription(auth.user_id, payload)

    return result


@app.get("/v1/doctor-finder/matches")
async def get_matches(
    subscriber_id: str = Query(...),
    auth: AuthContext = Depends(require_auth),
):
    """
    Get matched providers.

    Returns non-PHI data only.
    """
    logger.info("doctor_matches_requested", subscriber_id=subscriber_id)

    matches = await worker.get_matches(subscriber_id)

    return {"data": matches}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8004, log_level="info")
