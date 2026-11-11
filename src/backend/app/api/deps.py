"""Dependency injection cho FastAPI."""

from functools import lru_cache

from app.core.config import Settings, get_settings
from app.repositories.exam_repository import ExamRepository
from app.services.exam_service import AttemptService, ExamService


@lru_cache
def get_redis_client():
    """Return a Redis client, or None when Redis is disabled or unavailable."""
    settings: Settings = get_settings()
    if not settings.redis_enabled:
        return None
    try:
        import redis.asyncio as redis

        client = redis.from_url(settings.redis_url, encoding="utf-8", decode_responses=True)
        return client
    except Exception:  # noqa: BLE001
        return None


@lru_cache
def get_exam_repository() -> ExamRepository:
    return ExamRepository(get_settings().database_url)


@lru_cache
def get_exam_service() -> ExamService:
    return ExamService(get_exam_repository())


@lru_cache
def get_attempt_service() -> AttemptService:
    return AttemptService(get_settings().database_url)
