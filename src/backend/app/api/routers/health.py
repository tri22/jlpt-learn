"""Health check for liveness and Redis dependency status."""

from fastapi import APIRouter, Depends

from app.api.deps import get_redis_client
from app.api.responses import ok
from app.core.config import get_settings

router = APIRouter(tags=["health"])


@router.get("/health")
async def health():
    settings = get_settings()
    redis_status = "disabled"

    client = get_redis_client()
    if client is not None:
        try:
            await client.ping()
            redis_status = "up"
        except Exception:  # noqa: BLE001
            redis_status = "down"

    return ok(
        {
            "status": "ok",
            "redis": redis_status,
            "version": settings.app_name,
            "environment": settings.environment,
        }
    )
