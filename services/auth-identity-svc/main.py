"""
CareConnect Auth & Identity Service.

Stub OIDC/JWT validation service.
Demo mode: accepts X-Demo-User header.
"""

from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from careconnect_common import (
    DemoAuthValidator,
    configure_logging,
    get_logger,
    CorrelationIdMiddleware,
)
from careconnect_common.auth import AuthContext, require_auth

# Configure logging
configure_logging()
logger = get_logger(__name__)

app = FastAPI(
    title="CareConnect Auth & Identity Service",
    version="0.1.0",
    description="Authentication and identity management (demo stub)",
)

# CORS for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Vite default
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Correlation ID middleware
app.add_middleware(CorrelationIdMiddleware)

# Auth validator (demo mode)
auth_validator = DemoAuthValidator()


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str


class ValidateTokenResponse(BaseModel):
    valid: bool
    user_id: str
    tenant_id: str
    roles: list[str]


@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    """Apply auth validation to all requests except health."""
    if request.url.path == "/health":
        return await call_next(request)

    await auth_validator.validate(request)
    return await call_next(request)


@app.get("/health", response_model=HealthResponse)
async def health():
    """Health check endpoint."""
    logger.info("health_check_requested")
    return HealthResponse(
        status="healthy",
        service="auth-identity-svc",
        version="0.1.0",
    )


@app.post("/v1/auth/validate", response_model=ValidateTokenResponse)
async def validate_token(auth: AuthContext = Depends(require_auth)):
    """
    Validate auth token and return claims.

    In demo mode, accepts X-Demo-User header.
    """
    logger.info(
        "token_validation_requested",
        user_id=auth.user_id,
        tenant_id=auth.tenant_id,
    )

    return ValidateTokenResponse(
        valid=True,
        user_id=auth.user_id,
        tenant_id=auth.tenant_id,
        roles=auth.roles,
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info")
