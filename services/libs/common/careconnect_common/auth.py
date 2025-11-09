"""
Authentication and authorization.

Supports OIDC/JWT validation (stub) and demo mode with X-Demo-User header.
"""

from typing import Optional
from fastapi import Request, HTTPException, status
from pydantic import BaseModel


class AuthContext(BaseModel):
    """Authentication context extracted from request."""

    user_id: str
    tenant_id: str
    roles: list[str]
    email: Optional[str] = None


class AuthValidator:
    """Base auth validator (stub for production OIDC/JWT)."""

    async def validate(self, request: Request) -> AuthContext:
        """Validate request and extract auth context."""
        raise NotImplementedError("Production OIDC/JWT validation not implemented")


class DemoAuthValidator(AuthValidator):
    """
    Demo auth validator using headers.

    Accepts:
    - X-Demo-User: user ID
    - X-Tenant: tenant ID (defaults to "demo")
    """

    async def validate(self, request: Request) -> AuthContext:
        user_id = request.headers.get("X-Demo-User")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="X-Demo-User header required in demo mode",
            )

        tenant_id = request.headers.get("X-Tenant", "demo")

        # Demo: all users have "patient" role
        roles = ["patient"]

        # Store in request state
        request.state.user_id = user_id
        request.state.tenant_id = tenant_id
        request.state.roles = roles

        return AuthContext(
            user_id=user_id,
            tenant_id=tenant_id,
            roles=roles,
        )


async def require_auth(request: Request) -> AuthContext:
    """FastAPI dependency to require authentication."""
    if not hasattr(request.state, "user_id"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )

    return AuthContext(
        user_id=request.state.user_id,
        tenant_id=request.state.tenant_id,
        roles=request.state.roles,
    )
