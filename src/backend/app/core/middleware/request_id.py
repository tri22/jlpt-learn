"""Gắn X-Request-Id vào request và log để truy vết xuyên suốt qua Nginx -> backend."""

import logging
import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger("app.request")

REQUEST_ID_HEADER = "X-Request-Id"


class RequestIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get(REQUEST_ID_HEADER) or uuid.uuid4().hex
        request.state.request_id = request_id

        response: Response = await call_next(request)
        response.headers[REQUEST_ID_HEADER] = request_id

        logger.info(
            "%s %s -> %s",
            request.method,
            request.url.path,
            response.status_code,
            extra={"request_id": request_id},
        )
        return response
