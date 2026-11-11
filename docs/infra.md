# Infrastructure: Load Balancing and Rate Limiting

## Layered Architecture

```text
Client
  │
  ▼
Nginx :8080
  ├─ limit_req zone=api_general   (IP, all API routes)
  ├─ limit_req zone=api_key       (X-API-Key header)
  ├─ limit_req zone=api_write     (write methods)
  ├─ limit_req zone=api_auth      (/api/v1/auth/ only)
  └─ limit_conn per_ip 32         (connection flood protection)
  │
  ▼
api :8000
  │
  └─ RateLimitMiddleware (Redis token bucket by API key → user → IP)
  │
  ▼
Redis :6379  (internal Docker network only, with requirepass)
```

## Layer 1 — Nginx

Source: `infra/nginx/conf.d/rate-limit.conf`.

| Zone | Key | Limit | Applied to |
|---|---|---|---|
| `api_general` | `$binary_remote_addr` | 20 r/s, burst 40 | every `/api/*` route |
| `api_key` | `$http_x_api_key` | 30 r/s, burst 60 | every `/api/*` route; skipped without the header |
| `api_write` | `$write_limit_key` | 5 r/s, burst 10 | POST/PUT/PATCH/DELETE |
| `api_auth` | `$binary_remote_addr` | 1 r/s, burst 5 | `/api/v1/auth/*` |
| `per_ip` | `$binary_remote_addr` | 32 concurrent connections | every `/api/*` route |

**About `map`:** `limit_req` cannot be used inside `if`. To limit write methods,
`map $request_method $write_limit_key` returns `$remote_addr` for writes and an
empty string for other methods. Requests with an empty key are not counted.

**About `api_key`:** without `X-API-Key`, the key is empty and the request is not
counted in this zone, so the client normally receives only the IP-based limit.

### Tuning

```nginx
# Example: increase the general API limit.
limit_req_zone $binary_remote_addr zone=api_general:10m rate=50r/s;
```

### Verification

```bash
for i in $(seq 1 100); do curl -s -o /dev/null -w "%{http_code}\n" localhost:8080/api/v1/exams; done | sort | uniq -c
docker compose logs nginx | grep limiting
```

## Layer 2 — FastAPI

Source: `src/backend/app/core/middleware/rate_limit.py`.

- Token bucket: `capacity = APP_RATE_LIMIT_BURST` (default 10), refilled with
  `APP_RATE_LIMIT_PER_MINUTE` tokens every 60 seconds; write methods use
  `APP_RATE_LIMIT_WRITE_PER_MINUTE`).
- Counters are stored in Redis and updated atomically through a Lua script.
- Key priority: `X-API-Key` → user ID → IP.
- If Redis fails, the middleware logs a warning and falls back to in-process memory.
- A 429 response includes `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `Retry-After`.

The default is intentionally broader than Nginx because Nginx already provides
coarse flood protection; layer 2 focuses on fairness by caller identity.

## Redis

Source: `infra/redis/redis.conf`, `infra/redis/start-redis.sh`.

- No host port is published; Redis is available only on the Docker network.
- `requirepass` comes from `REDIS_PASSWORD` (default `jlpt_dev_password`).
- `protected-mode yes` remains enabled.
- `maxmemory 256mb` and `maxmemory-policy allkeys-lru` suit short-lived counters;
  persistence is disabled with `save ""` and `appendonly no`.

Change the password:

```bash
# in .env
REDIS_PASSWORD=<new-password>
docker compose up -d --force-recreate redis api
```

## Backend upstream

`infra/nginx/conf.d/upstreams.conf`:

- `max_fails=3 fail_timeout=10s` marks a failing upstream for 10 seconds.
- `keepalive 32` reuses upstream connections.

Check backend logs:

```bash
docker compose logs api --since 1m | grep -c "GET /api/v1/exams -> 200"
```

## Logging and Tracing

- Nginx access logs include `rid=$request_id` and `urt=$upstream_response_time`.
- Backend JSON log records include a `request_id` matching `X-Request-Id`.
- `X-Request-Id` is preserved from client → Nginx → backend.

## Out of Scope

- Active Nginx health checks (`health_check` requires Nginx Plus).
- Redis Sentinel/Cluster for high availability.
- Prometheus exporters for Nginx and FastAPI.
