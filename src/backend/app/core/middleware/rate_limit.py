"""Application-level rate limiting.

Nginx already filters IP-based floods at the edge. This layer keys by caller
identity (API key -> user ID -> IP), which is fairer when users share an IP/NAT.

The counter is stored in Redis through an atomic Lua script. If Redis is
unavailable, the middleware falls back to in-process memory and logs a warning.
"""

import logging
import time
from collections import defaultdict, deque

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.core.config import get_settings

logger = logging.getLogger("app.rate_limit")

# Returns [allowed, remaining, retry_after_ms].
#
# Token bucket: capacity = burst, refill = limit tokens every 60 seconds.
_TOKEN_BUCKET_LUA = """
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local burst = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local window = 60000

local data = redis.call('HMGET', key, 'tokens', 'ts')
local tokens = tonumber(data[1])
local ts = tonumber(data[2])

if tokens == nil or ts == nil then
    tokens = burst
    ts = now
end

local elapsed = math.max(0, now - ts)
tokens = math.min(burst, tokens + (elapsed / window) * limit)

local allowed = 0
if tokens >= 1 then
    tokens = tokens - 1
    allowed = 1
end

redis.call('HMSET', key, 'tokens', tokens, 'ts', now)
redis.call('PEXPIRE', key, math.ceil(window * 2))

local retry_after = 0
if allowed == 0 then
    local deficit = 1 - tokens
    retry_after = math.ceil((deficit / limit) * window)
end

return {allowed, math.floor(tokens), retry_after}
"""

_in_memory_buckets: dict[str, deque[float]] = defaultdict(deque)


def _client_key(request: Request) -> str:
    """Identify the caller by API key, then user ID, and finally IP."""
    api_key = request.headers.get("X-API-Key")
    if api_key:
        return f"apikey:{api_key[:32]}"
    user = getattr(request.state, "user_id", None)
    if user:
        return f"user:{user}"
    client = request.client
    return f"ip:{client.host if client else 'unknown'}"


def _is_write(request: Request) -> bool:
    return request.method in {"POST", "PUT", "PATCH", "DELETE"}


def _fallback_allow(key: str, limit: int, burst: int) -> tuple[bool, int, int]:
    """In-memory token bucket used when Redis fails."""
    now = time.monotonic()
    bucket = _in_memory_buckets[key]
    window = 60.0
    capacity = max(burst, limit)

    while bucket and now - bucket[0] > window:
        bucket.popleft()

    # Refill tokens according to elapsed time.
    if bucket:
        elapsed = now - bucket[-1]
        refill = (elapsed / window) * limit
        if refill >= 1:
            bucket.append(now)

    if len(bucket) >= capacity:
        retry_after = int(window - (now - bucket[0])) if bucket else 1
        return False, 0, max(retry_after, 1)

    bucket.append(now)
    return True, max(capacity - len(bucket), 0), 0


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, redis_client=None):
        super().__init__(app)
        self._redis = redis_client
        self._settings = get_settings()

    async def dispatch(self, request: Request, call_next):
        settings = self._settings
        if not settings.rate_limit_enabled:
            return await call_next(request)

        # Health checks do not consume quota.
        if request.url.path.rstrip("/").endswith("/health"):
            return await call_next(request)

        limit = (
            settings.rate_limit_write_per_minute
            if _is_write(request)
            else settings.rate_limit_per_minute
        )
        burst = max(settings.rate_limit_burst, 1)
        key = _client_key(request)
        redis_key = f"ratelimit:{key}"

        allowed, remaining, retry_after = await self._check(redis_key, limit, burst)

        if not allowed:
            return JSONResponse(
                status_code=429,
                content={
                    "data": None,
                    "error": {
                        "code": "rate_limited",
                        "message": "Too many requests",
                        "retry_after_ms": retry_after,
                    },
                },
                headers={
                    "Retry-After": str(max(retry_after // 1000, 1)),
                    "X-RateLimit-Limit": str(limit),
                    "X-RateLimit-Remaining": "0",
                },
            )

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        return response

    async def _check(self, redis_key: str, limit: int, burst: int) -> tuple[bool, int, int]:
        if self._redis is not None:
            try:
                raw = await self._redis.eval(
                    _TOKEN_BUCKET_LUA, 1, redis_key, limit, burst, int(time.time() * 1000)
                )
                allowed, remaining, retry_after = (int(v) for v in raw)
                return bool(allowed), remaining, retry_after
            except Exception:  # noqa: BLE001 - a Redis failure must not fail the request
                logger.warning("Redis rate limiting failed; using in-memory fallback", exc_info=True)

        return _fallback_allow(redis_key, limit, burst)
