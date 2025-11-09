"""
Consent gate for FHIR reads.

Enforces active consent before accessing PHI.
"""

from typing import Optional
from datetime import datetime
from fastapi import HTTPException, status
from pydantic import BaseModel


class ConsentRecord(BaseModel):
    """Consent record."""

    consent_id: str
    patient_id: str
    grantee_id: Optional[str]  # Clinician or organization
    scope: list[str]  # Data categories
    purpose: str
    status: str  # active, expired, revoked
    expires_at: datetime
    created_at: datetime


class ConsentGate:
    """
    Consent enforcement gate.

    In-memory store for demo; replace with FHIR Consent resource queries.
    """

    def __init__(self):
        self._consents: dict[str, ConsentRecord] = {}

    async def check_consent(
        self,
        patient_id: str,
        requester_id: str,
        scope: list[str],
    ) -> bool:
        """
        Check if active consent exists for patient→requester with required scope.

        Returns True if consent is active and covers scope.
        """
        # Demo: search for matching consent
        for consent in self._consents.values():
            if (
                consent.patient_id == patient_id
                and consent.status == "active"
                and consent.expires_at > datetime.utcnow()
                and (consent.grantee_id == requester_id or consent.grantee_id is None)
                and all(s in consent.scope for s in scope)
            ):
                return True

        return False

    async def require_consent(
        self,
        patient_id: str,
        requester_id: str,
        scope: list[str],
    ) -> None:
        """
        Require active consent or raise 403.
        """
        has_consent = await self.check_consent(patient_id, requester_id, scope)
        if not has_consent:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error": "consent_required",
                    "message": f"Active consent required for patient {patient_id}",
                },
            )

    async def store_consent(self, consent: ConsentRecord) -> None:
        """Store consent record (demo)."""
        self._consents[consent.consent_id] = consent

    async def get_consent(self, consent_id: str) -> Optional[ConsentRecord]:
        """Retrieve consent by ID."""
        return self._consents.get(consent_id)
