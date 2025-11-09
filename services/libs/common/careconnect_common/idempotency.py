"""
Idempotency middleware and store.

All mutations require Idempotency-Key header.
Stores (tenant, endpoint, key, payload_hash, result_fingerprint).
Replays return same result; mismatch → 409.
"""

import hashlib
import json
from typing import Any, Dict, Optional
from datetime import datetime, timedelta

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from pydantic import BaseModel


class IdempotencyRecord(BaseModel):
    """Idempotency record stored in backend."""

    tenant_id: str
    endpoint: str
    idempotency_key: str
    payload_hash: str
    result_fingerprint: str
    status_code: int
    response_body: str
    created_at: datetime
    expires_at: datetime


class IdempotencyStore:
    """In-memory idempotency store (replace with Redis/database in production)."""

    def __init__(self, ttl_seconds: int = 86400):  # 24h default TTL
        self._store: Dict[str, IdempotencyRecord] = {}
        self._ttl_seconds = ttl_seconds

    def _make_key(self, tenant_id: str, endpoint: str, idempotency_key: str) -> str:
        return f"{tenant_id}:{endpoint}:{idempotency_key}"

    async def get(
        self, tenant_id: str, endpoint: str, idempotency_key: str
    ) -> Optional[IdempotencyRecord]:
        """Retrieve idempotency record if exists and not expired."""
        key = self._make_key(tenant_id, endpoint, idempotency_key)
        record = self._store.get(key)

        if record and record.expires_at > datetime.utcnow():
            return record

        # Expired, remove
        if record:
            del self._store[key]

        return None

    async def store(
        self,
        tenant_id: str,
        endpoint: str,
        idempotency_key: str,
        payload_hash: str,
        status_code: int,
        response_body: str,
    ) -> IdempotencyRecord:
        """Store idempotency record."""
        now = datetime.utcnow()
        expires_at = now + timedelta(seconds=self._ttl_seconds)

        record = IdempotencyRecord(
            tenant_id=tenant_id,
            endpoint=endpoint,
            idempotency_key=idempotency_key,
            payload_hash=payload_hash,
            result_fingerprint=hashlib.sha256(response_body.encode()).hexdigest(),
            status_code=status_code,
            response_body=response_body,
            created_at=now,
            expires_at=expires_at,
        )

        key = self._make_key(tenant_id, endpoint, idempotency_key)
        self._store[key] = record

        return record


class IdempotencyMiddleware(BaseHTTPMiddleware):
    """
    FastAPI middleware enforcing idempotency for mutations.

    Requires Idempotency-Key header for POST/PUT/PATCH.
    """

    def __init__(self, app, store: IdempotencyStore):
        super().__init__(app)
        self.store = store

    @staticmethod
    def _compute_payload_hash(body: bytes) -> str:
        """Compute SHA-256 hash of request body."""
        return hashlib.sha256(body).hexdigest()

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        # Only enforce for mutations
        if request.method not in ["POST", "PUT", "PATCH"]:
            return await call_next(request)

        idempotency_key = request.headers.get("Idempotency-Key")
        if not idempotency_key:
            return Response(
                content=json.dumps(
                    {
                        "error": "missing_idempotency_key",
                        "message": "Idempotency-Key header required for mutations",
                    }
                ),
                status_code=400,
                media_type="application/json",
            )

        # Extract tenant (from auth context, defaults to "default" in demo)
        tenant_id = request.state.tenant_id if hasattr(request.state, "tenant_id") else "default"
        endpoint = f"{request.method} {request.url.path}"

        # Read body once and cache
        body = await request.body()
        payload_hash = self._compute_payload_hash(body)

        # Check for existing record
        existing = await self.store.get(tenant_id, endpoint, idempotency_key)

        if existing:
            # Idempotency key seen before
            if existing.payload_hash != payload_hash:
                # Conflicting payload
                return Response(
                    content=json.dumps(
                        {
                            "error": "idempotency_conflict",
                            "message": "Idempotency-Key reused with different payload",
                        }
                    ),
                    status_code=409,
                    media_type="application/json",
                )

            # Replay: return cached response
            return Response(
                content=existing.response_body,
                status_code=existing.status_code,
                media_type="application/json",
            )

        # New request: process normally
        response = await call_next(request)

        # Cache successful mutations (2xx codes)
        if 200 <= response.status_code < 300:
            response_body = b""
            async for chunk in response.body_iterator:
                response_body += chunk

            await self.store.store(
                tenant_id=tenant_id,
                endpoint=endpoint,
                idempotency_key=idempotency_key,
                payload_hash=payload_hash,
                status_code=response.status_code,
                response_body=response_body.decode(),
            )

            # Recreate response with body
            return Response(
                content=response_body,
                status_code=response.status_code,
                headers=dict(response.headers),
                media_type=response.media_type,
            )

        return response
