"""
Structured logging with correlation IDs and OpenTelemetry stubs.
"""

import logging
import uuid
from typing import Any
from contextvars import ContextVar

import structlog
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response

# Context variable for correlation ID
_correlation_id: ContextVar[str] = ContextVar("correlation_id", default="")


def add_correlation_id(correlation_id: str) -> None:
    """Set correlation ID for current context."""
    _correlation_id.set(correlation_id)


def get_correlation_id() -> str:
    """Get correlation ID from current context."""
    return _correlation_id.get()


def _add_correlation_id_processor(
    logger: Any, method_name: str, event_dict: dict
) -> dict:
    """Structlog processor to add correlation ID."""
    corr_id = get_correlation_id()
    if corr_id:
        event_dict["correlation_id"] = corr_id
    return event_dict


def configure_logging(log_level: str = "INFO") -> None:
    """
    Configure structured logging with JSON output.

    Sets up structlog with:
    - JSON rendering
    - Correlation ID injection
    - Timestamp
    - Log level
    """
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            _add_correlation_id_processor,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.stdlib.BoundLogger,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )

    logging.basicConfig(
        format="%(message)s",
        level=getattr(logging, log_level.upper()),
    )


def get_logger(name: str) -> Any:
    """Get structured logger instance."""
    return structlog.get_logger(name)


class CorrelationIdMiddleware(BaseHTTPMiddleware):
    """
    Middleware to extract/generate correlation ID from requests.

    Checks X-Correlation-Id header, generates UUID if missing.
    """

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        correlation_id = request.headers.get("X-Correlation-Id") or str(uuid.uuid4())
        add_correlation_id(correlation_id)

        # Add to request state
        request.state.correlation_id = correlation_id

        response = await call_next(request)

        # Echo correlation ID in response
        response.headers["X-Correlation-Id"] = correlation_id

        return response
