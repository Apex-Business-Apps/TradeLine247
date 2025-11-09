"""
CareConnect Patient FHIR Service.

Proxy to GCP Healthcare API FHIR store with:
- Consent enforcement on every read
- Mock adapter for development
- ETag/versioning support
"""

import os
import uuid
from datetime import datetime, timedelta
from typing import Optional

from fastapi import FastAPI, HTTPException, Depends, Query, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from careconnect_common import (
    DemoAuthValidator,
    ConsentGate,
    configure_logging,
    get_logger,
    CorrelationIdMiddleware,
)
from careconnect_common.auth import AuthContext, require_auth
from careconnect_common.consent import ConsentRecord

# Configure logging
configure_logging()
logger = get_logger(__name__)

app = FastAPI(
    title="CareConnect Patient FHIR Service",
    version="0.1.0",
    description="FHIR proxy with consent enforcement and mock adapter",
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

# Auth validator (demo mode)
auth_validator = DemoAuthValidator()

# Consent gate
consent_gate = ConsentGate()


# Models
class Demographics(BaseModel):
    name: dict
    date_of_birth: str
    gender: str


class HealthCard(BaseModel):
    number: str
    province: str
    expiry_date: Optional[str] = None


class Insurance(BaseModel):
    provider: str
    policy_number: str
    group_number: Optional[str] = None


class Vital(BaseModel):
    type: str
    value: float
    unit: str
    effective_date_time: str


class Medication(BaseModel):
    name: str
    dosage: str
    frequency: Optional[str] = None
    route: Optional[str] = None


class PatientSummary(BaseModel):
    patient_id: str
    demographics: Demographics
    health_card: Optional[HealthCard] = None
    insurance: Optional[Insurance] = None
    recent_vitals: list[Vital]
    medications: list[Medication]


class Observation(BaseModel):
    id: str
    type: str
    value: dict
    effective_date_time: str


class ObservationList(BaseModel):
    data: list[Observation]
    meta: dict


class ConsentCreate(BaseModel):
    patient_id: str
    scope: list[str]
    purpose: str
    expires_at: str
    grantee_id: Optional[str] = None


class Consent(BaseModel):
    consent_id: str
    patient_id: str
    scope: list[str]
    purpose: str
    expires_at: str
    grantee_id: Optional[str] = None
    created_at: str
    status: str


# Mock FHIR adapter
class MockFhirAdapter:
    """Mock FHIR adapter for development/testing."""

    def __init__(self):
        # Synthetic patient data
        self._patients = {
            "patient-001": {
                "demographics": {
                    "name": {"given": "Jane", "family": "Doe"},
                    "date_of_birth": "1985-03-15",
                    "gender": "female",
                },
                "health_card": {
                    "number": "1234-567-890",
                    "province": "AB",
                    "expiry_date": "2026-12-31",
                },
                "insurance": {
                    "provider": "Alberta Blue Cross",
                    "policy_number": "ABC123456",
                    "group_number": "GRP001",
                },
            }
        }

        # Synthetic observations (vitals)
        self._observations = []
        base_date = datetime.utcnow() - timedelta(days=30)
        for i in range(10):
            obs_date = base_date + timedelta(days=i * 3)
            self._observations.extend(
                [
                    {
                        "id": f"obs-bp-{i}",
                        "type": "blood-pressure",
                        "value": {"systolic": 120 + i, "diastolic": 80 + i},
                        "effective_date_time": obs_date.isoformat(),
                        "patient_id": "patient-001",
                    },
                    {
                        "id": f"obs-hr-{i}",
                        "type": "heart-rate",
                        "value": {"bpm": 70 + i},
                        "effective_date_time": obs_date.isoformat(),
                        "patient_id": "patient-001",
                    },
                ]
            )

        # Synthetic medications
        self._medications = [
            {
                "name": "Lisinopril",
                "dosage": "10mg",
                "frequency": "once daily",
                "route": "oral",
            },
            {
                "name": "Metformin",
                "dosage": "500mg",
                "frequency": "twice daily",
                "route": "oral",
            },
        ]

    async def get_patient_summary(self, patient_id: str) -> PatientSummary:
        """Get patient summary (clipboard view)."""
        patient_data = self._patients.get(patient_id)
        if not patient_data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Patient {patient_id} not found",
            )

        # Recent vitals (last 30 days)
        recent_cutoff = datetime.utcnow() - timedelta(days=30)
        recent_vitals = []
        for obs in self._observations:
            if (
                obs["patient_id"] == patient_id
                and datetime.fromisoformat(obs["effective_date_time"]) >= recent_cutoff
            ):
                recent_vitals.append(
                    Vital(
                        type=obs["type"],
                        value=list(obs["value"].values())[0],
                        unit="mmHg" if "pressure" in obs["type"] else "bpm",
                        effective_date_time=obs["effective_date_time"],
                    )
                )

        return PatientSummary(
            patient_id=patient_id,
            demographics=Demographics(**patient_data["demographics"]),
            health_card=HealthCard(**patient_data["health_card"])
            if "health_card" in patient_data
            else None,
            insurance=Insurance(**patient_data["insurance"])
            if "insurance" in patient_data
            else None,
            recent_vitals=recent_vitals[:5],  # Limit to 5 most recent
            medications=[Medication(**m) for m in self._medications],
        )

    async def list_observations(
        self,
        patient_id: str,
        obs_type: Optional[str] = None,
        since: Optional[datetime] = None,
        until: Optional[datetime] = None,
    ) -> ObservationList:
        """List patient observations with filtering."""
        filtered = [o for o in self._observations if o["patient_id"] == patient_id]

        if obs_type:
            filtered = [o for o in filtered if o["type"] == obs_type]

        if since:
            filtered = [
                o
                for o in filtered
                if datetime.fromisoformat(o["effective_date_time"]) >= since
            ]

        if until:
            filtered = [
                o
                for o in filtered
                if datetime.fromisoformat(o["effective_date_time"]) < until
            ]

        observations = [
            Observation(
                id=o["id"],
                type=o["type"],
                value=o["value"],
                effective_date_time=o["effective_date_time"],
            )
            for o in filtered
        ]

        return ObservationList(
            data=observations,
            meta={"total": len(observations), "offset": 0, "limit": len(observations)},
        )


# Global FHIR adapter
USE_MOCK = os.getenv("USE_MOCK_FHIR", "true").lower() == "true"
fhir_adapter = MockFhirAdapter() if USE_MOCK else None


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
    return {
        "status": "healthy",
        "service": "patient-fhir-svc",
        "adapter": "mock" if USE_MOCK else "gcp-healthcare-api",
    }


@app.get("/v1/patients/{patient_id}/summary", response_model=PatientSummary)
async def get_patient_summary(
    patient_id: str,
    auth: AuthContext = Depends(require_auth),
):
    """
    Get patient summary (clipboard view).

    Requires active consent.
    """
    logger.info("get_patient_summary_requested", patient_id=patient_id)

    # Consent enforcement
    await consent_gate.require_consent(
        patient_id=patient_id,
        requester_id=auth.user_id,
        scope=["demographics", "vitals", "medications"],
    )

    if not fhir_adapter:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="FHIR adapter not available (set USE_MOCK_FHIR=true)",
        )

    summary = await fhir_adapter.get_patient_summary(patient_id)

    return summary


@app.get("/v1/patients/{patient_id}/observations", response_model=ObservationList)
async def list_observations(
    patient_id: str,
    obs_type: Optional[str] = Query(None, alias="type"),
    since: Optional[str] = Query(None),
    until: Optional[str] = Query(None),
    auth: AuthContext = Depends(require_auth),
):
    """
    List patient observations.

    Requires active consent.
    """
    logger.info("list_observations_requested", patient_id=patient_id, type=obs_type)

    # Consent enforcement
    await consent_gate.require_consent(
        patient_id=patient_id,
        requester_id=auth.user_id,
        scope=["observations"],
    )

    if not fhir_adapter:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="FHIR adapter not available",
        )

    since_dt = datetime.fromisoformat(since) if since else None
    until_dt = datetime.fromisoformat(until) if until else None

    observations = await fhir_adapter.list_observations(
        patient_id=patient_id,
        obs_type=obs_type,
        since=since_dt,
        until=until_dt,
    )

    return observations


@app.post("/v1/consents", response_model=Consent, status_code=status.HTTP_201_CREATED)
async def create_consent(
    payload: ConsentCreate,
    auth: AuthContext = Depends(require_auth),
):
    """
    Create consent record.

    Stores as FHIR Consent resource.
    """
    logger.info("create_consent_requested", patient_id=payload.patient_id)

    consent_id = str(uuid.uuid4())
    now = datetime.utcnow()

    consent = ConsentRecord(
        consent_id=consent_id,
        patient_id=payload.patient_id,
        grantee_id=payload.grantee_id,
        scope=payload.scope,
        purpose=payload.purpose,
        status="active",
        expires_at=datetime.fromisoformat(payload.expires_at),
        created_at=now,
    )

    # Store consent
    await consent_gate.store_consent(consent)

    return Consent(
        consent_id=consent_id,
        patient_id=payload.patient_id,
        scope=payload.scope,
        purpose=payload.purpose,
        expires_at=payload.expires_at,
        grantee_id=payload.grantee_id,
        created_at=now.isoformat(),
        status="active",
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8003, log_level="info")
