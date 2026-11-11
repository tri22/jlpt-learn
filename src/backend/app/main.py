"""FastAPI entry point."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.deps import get_redis_client
from app.api.routers import attempts, auth, exams, health
from app.core.config import get_settings
from app.core.logging import configure_logging
from app.core.middleware.rate_limit import RateLimitMiddleware
from app.core.middleware.request_id import RequestIdMiddleware

configure_logging()
logger = logging.getLogger("app.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    logger.info(
        "Starting %s (env=%s, database=%s)",
        settings.app_name,
        settings.environment,
        settings.database_url.split("@")[-1],
    )
    yield
    client = get_redis_client()
    if client is not None:
        await client.aclose()
    logger.info("Stopped %s", settings.app_name)


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="JLPT Learn API",
        version="0.1.0",
        description="Skeleton API for exams, attempts, and health with two-layer rate limiting (Nginx + Redis).",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(RateLimitMiddleware, redis_client=get_redis_client())
    app.add_middleware(RequestIdMiddleware)

    app.include_router(health.router, prefix=settings.api_prefix)
    app.include_router(exams.router, prefix=settings.api_prefix)
    app.include_router(attempts.router, prefix=settings.api_prefix)
    app.include_router(auth.router, prefix=settings.api_prefix)

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        logger.exception("Unhandled error: %s %s", request.method, request.url.path)
        return JSONResponse(
            status_code=500,
            content={
                "data": None,
                "error": {"code": "internal_error", "message": "Internal server error", "details": None},
            },
        )

    return app


app = create_app()
