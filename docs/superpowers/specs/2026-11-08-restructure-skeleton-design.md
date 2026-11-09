# Thiết kế tái cấu trúc: FE + BE + Load Balancer + Rate Limit

Ngày: 2026-11-08. Trạng thái: skeleton (khung xương), chưa triển khai nghiệp vụ.

## 1. Mục tiêu

Tái cấu trúc repo `jlpt_learn` để có đủ khung: frontend, backend API, load balancer, rate limit,
hạ tầng chạy được bằng Docker Compose. Mục tiêu là **skeleton** — thư mục, cấu hình, chạm
đúng endpoint, có thể `docker compose up` thấy luồng hoạt động, nhưng chưa có nghiệp vụ học thi thật.

## 2. Quyết định đã chốt

| Hạng mục | Quyết định |
|---|---|
| Backend | Python FastAPI + uvicorn (đồng bộ với crawler Python sẵn có) |
| Load balancer | Nginx reverse proxy: `upstream` + `limit_req` |
| Rate limit | 2 tầng: Nginx (theo IP, tầng edge) + FastAPI middleware (Redis token bucket, theo user/API key) |
| Redis | Dùng chung cho tầng 2 và làm kho rate-limit counter |
| Frontend | React + Vite (đã có ở `src/frontend`), chuyển sang gọi API `/api/v1/*` |
| Legacy | **Giữ nguyên** `my-react-app/` và `dataset/` — không xóa gì |
| Hạ tầng | `docker-compose.yml`: nginx + backend×2 + redis + frontend |

## 3. Cấu trúc đích

```text
jlpt_learn/
├── docker-compose.yml
├── .env.example
├── Makefile
├── .gitignore
├── docs/
│   ├── architecture.md      (cập nhật)
│   ├── development.md       (cập nhật)
│   ├── data-contract.md     (giữ)
│   ├── operations.md        (cập nhật)
│   └── infra.md             (mới: nginx, redis, rate limit)
├── infra/
│   ├── nginx/
│   │   ├── nginx.conf
│   │   └── conf.d/
│   │       ├── upstreams.conf
│   │       ├── rate-limit.conf
│   │       └── proxy.conf
│   └── redis/redis.conf
├── src/
│   ├── backend/
│   │   ├── Dockerfile
│   │   ├── pyproject.toml
│   │   ├── requirements.txt
│   │   ├── .env.example
│   │   ├── app/
│   │   │   ├── main.py
│   │   │   ├── core/
│   │   │   │   ├── config.py
│   │   │   │   ├── logging.py
│   │   │   │   └── middleware/
│   │   │   │       ├── rate_limit.py
│   │   │   │       └── request_id.py
│   │   │   ├── api/
│   │   │   │   ├── deps.py
│   │   │   │   └── routers/{health,exams,attempts,auth}.py
│   │   │   ├── schemas/{exam,attempt,auth}.py
│   │   │   ├── services/exam_service.py
│   │   │   ├── repositories/exam_repository.py
│   │   │   └── db/session.py
│   │   └── tests/
│   ├── frontend/            (giữ nguyên, + src/api/)
│   └── crawler/             (crawl.py, crawl_jlpt_n5.py, build_exam_json.py)
└── dataset/                 (giữ nguyên)
```

## 4. Luồng request

```text
Client
  │  HTTP :8080
  ▼
Nginx  ── limit_req_zone $binary_remote_addr ──► 429 khi vượt
  │  proxy_pass http://backend_upstream  (round-robin 2 instance)
  ▼
FastAPI backend (api-1, api-2)
  │  middleware: request-id → rate limit (Redis token bucket, theo API key / user)
  │  middleware: CORS
  ▼
Redis (rate-limit counter)  ·  dữ liệu đề thi đọc từ JSON canonical
```

Nginx là điểm vào duy nhất. Frontend chỉ biết `/api/v1/*`, không biết IP backend.

## 5. Tầng rate limit

**Tầng 1 — Nginx (`infra/nginx/conf.d/rate-limit.conf`)**

- `limit_req_zone $binary_remote_addr zone=api_general:10m rate=20r/s` — mặc định mọi API.
- `zone=api_write:10m rate=5r/s` — nhóm method ghi (POST/PUT/PATCH/DELETE).
- `zone=api_auth:10m rate=1r/s burst=5 nodelay` — `/api/v1/auth/*`.
- `limit_req_status 429` + `limit_req_log_level warn`.
- `limit_conn_zone $binary_remote_addr zone=per_ip:10m` + `limit_conn per_ip 32` — chặn connection flood.

**Tầng 2 — FastAPI (`app/core/middleware/rate_limit.py`)**

- Token bucket theo key: `apikey:<key>` nếu có header `X-API-Key`, ngược lại `user:<id>`, ngược lại `ip:<ip>`.
- Lưu counter trong Redis (Lua script cập nhật atomically). Nếu Redis không sẵn sàng → fallback
  bộ nhớ trong tiến trình, log warning, không chặn request.
- Mặc định rộng hơn Nginx (để Nginx là lớp lọc thô): ví dụ 60 req/phút cho API chung.

**Lý do 2 tầng:** Nginx chặn flood ở edge, không tốn worker của backend. Tầng 2 tính theo danh
tính người dùng (không chỉ IP) nên công bằng hơn khi nhiều người dùng chung IP/NAT.

## 6. API contract (skeleton)

| Method | Path | Mô tả |
|---|---|---|
| GET | `/api/v1/health` | Liveness, trả trạng redis + upstream |
| GET | `/api/v1/exams` | Danh sách đề thi (id, title, số câu, thời gian) |
| GET | `/api/v1/exams/{exam_id}` | Chi tiết đề + câu hỏi + lựa chọn + media |
| GET | `/api/v1/exams/{exam_id}/answer-key` | Đáp án (chặn theo role trong tương lai) |
| POST | `/api/v1/attempts` | Tạo lần thi (skeleton) |
| POST | `/api/v1/attempts/{id}/submit` | Nộp bài (skeleton) |
| POST | `/api/v1/auth/login` | Placeholder — trả 501 |

Tất cả response dùng envelope `{ "data": ..., "error": null }` hoặc `{ "data": null, "error": {...} }`.

## 7. Hợp đồng dữ liệu

Nguồn sự thật: JSON đã build ở `src/frontend/src/data/de-N.json`
(shape: `{id, title, questionCount, durationMinutes, answerKey, questions[]}`).
Backend đọc read-only từ `EXAM_DATA_DIR` (mount chung volume trong compose).
`dataset/` giữ nguyên làm dữ liệu thô nguồn để rebuild JSON.

## 8. Ranh giới

- Không migrate DB: `app/db/session.py` là chỗ để sau này gắn SQLAlchemy/Postgres.
- Không viết logic chấm điểm thật: `attempts` router chỉ trả skeleton.
- Không đụng vào `my-react-app/` và `dataset/`.
- Không deploy thật, không ghi secret vào repo (`.env.example` chỉ có giá trị mặc định).

## 9. Cách kiểm chứng

```bash
make up          # docker compose up --build
curl -i localhost:8080/api/v1/health
curl -i localhost:8080/api/v1/exams
curl -i -X POST localhost:8080/api/v1/auth/login   # 429 khi vượt rate
docker compose logs -f nginx
```

## 10. Ngoài phạm vi (làm sau)

- Postgres + Alembic, đồng bộ schema theo `docs/data-contract.md`.
- Redis sentinel/cluster, nginx `upstream` có health check nâng cao.
- Prometheus/Grafana, structured log, tracing.
- Xác thực thật (JWT), phân quyền theo RBAC trong data-contract.
