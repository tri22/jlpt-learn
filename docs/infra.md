# Hạ tầng: Load Balancer và Rate Limit

## Kiến trúc tầng

```text
Client
  │
  ▼
Nginx :8080
  ├─ limit_req zone=api_general   (IP, mọi API)
  ├─ limit_req zone=api_key       (X-API-Key header)
  ├─ limit_req zone=api_write     (method ghi)
  ├─ limit_req zone=api_auth      (riêng /api/v1/auth/)
  └─ limit_conn per_ip 32         (chặn connection flood)
  │
  ▼
api :8000
  │
  └─ middleware RateLimitMiddleware (Redis token bucket, theo API key → user → IP)
  │
  ▼
Redis :6379  (chỉ nội bộ docker network, có requirepass)
```

## Tầng 1 — Nginx

Nguồn: `infra/nginx/conf.d/rate-limit.conf`.

| Zone | Biến | Mức | Dùng ở đâu |
|---|---|---|---|
| `api_general` | `$binary_remote_addr` | 20 r/s, burst 40 | mọi `/api/*` |
| `api_key` | `$http_x_api_key` | 30 r/s, burst 60 | mọi `/api/*` (bỏ qua nếu không gửi header) |
| `api_write` | `$write_limit_key` | 5 r/s, burst 10 | method POST/PUT/PATCH/DELETE |
| `api_auth` | `$binary_remote_addr` | 1 r/s, burst 5 | `/api/v1/auth/*` |
| `per_ip` | `$binary_remote_addr` | 32 kết nối đồng thời | mọi `/api/*` |

**Về `map`:** `limit_req` không được dùng trong `if`. Để siết riêng method ghi,
`map $request_method $write_limit_key` trả về `$remote_addr` cho method ghi và
chuỗi rỗng cho method khác. Request có key rỗng không bị tính vào zone.

**Về zone `api_key`:** nếu header `X-API-Key` không có, biến rỗng → request không
bị tính vào zone này, nên client thường chỉ chịu giới hạn theo IP.

### Điều chỉnh

```nginx
# ví dụ: nới API chung
limit_req_zone $binary_remote_addr zone=api_general:10m rate=50r/s;
```

### Kiểm chứng

```bash
for i in $(seq 1 100); do curl -s -o /dev/null -w "%{http_code}\n" localhost:8080/api/v1/exams; done | sort | uniq -c
docker compose logs nginx | grep limiting
```

## Tầng 2 — FastAPI

Nguồn: `src/backend/app/core/middleware/rate_limit.py`.

- Token bucket: `capacity = APP_RATE_LIMIT_BURST` (mặc định 10), refill
  `APP_RATE_LIMIT_PER_MINUTE` token mỗi 60 giây (method ghi dùng
  `APP_RATE_LIMIT_WRITE_PER_MINUTE`).
- Bộ đếm lưu trong Redis bằng Lua script — cập nhật atomically.
- Khóa theo thứ tự ưu tiên: `X-API-Key` → user id → IP.
- Nếu Redis lỗi: fallback bộ nhớ trong tiến trình, log warning, **không** chặn
  request. Ưu tiên giữ dịch vụ sống hơn là siết rate limit.
- Response 429 kèm header `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`.

Mặc định rộng hơn Nginx (60/phút so với 20/giây) vì Nginx là lớp lọc thô đã
chặn flood rồi; tầng 2 nhằm công bằng theo danh tính người dùng.

## Redis

Nguồn: `infra/redis/redis.conf`, `infra/redis/start-redis.sh`.

- Không publish cổng ra host — chỉ trong docker network.
- `requirepass` lấy từ biến `REDIS_PASSWORD` (mặc định `jlpt_dev_password`).
- `protected-mode yes` vẫn giữ vì có mật khẩu.
- `maxmemory 256mb`, `maxmemory-policy allkeys-lru` — counter sống ngắn, không cần
  persist (`save ""`, `appendonly no`).

Đổi mật khẩu:

```bash
# trong .env
REDIS_PASSWORD=<mật khẩu mới>
docker compose up -d --force-recreate redis api
```

## Backend upstream

`infra/nginx/conf.d/upstreams.conf`:

- `max_fails=3 fail_timeout=10s` — đánh dấu upstream lỗi trong 10 giây.
- `keepalive 32` — tái sử dụng kết nối tới upstream.

Kiểm tra log backend:

```bash
docker compose logs api --since 1m | grep -c "GET /api/v1/exams -> 200"
```

## Logging và truy vết

- Nginx access log có `rid=$request_id` và `urt=$upstream_response_time`.
- Backend log JSON, mỗi record có `request_id` khớp với header `X-Request-Id`.
- `X-Request-Id` được giữ xuyên suốt từ client → Nginx → backend.

## Ngoài phạm vi (làm sau)

- Nginx `max_fails` chưa dùng health check chủ động (`health_check` cần bản Plus).
- Redis sentinel/cluster khi cần HA.
- Prometheus exporter cho Nginx và FastAPI.
