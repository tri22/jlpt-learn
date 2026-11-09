# Kiến trúc hệ thống

## Tổng quan

```text
                        ┌──────────────────────────┐
   Người dùng ────────▶ │  Nginx (load balancer)   │  ← điểm vào duy nhất
                        │  • proxy tới backend      │
                        │  • limit_req theo IP      │  ← tầng rate limit 1
                        └────────────┬─────────────┘
                                     │
                    ┌────────────────┴────────────────┐
                                     ▼
                     ┌───────────────────────────┐
                     │ FastAPI api                │
                     │ • middleware, CORS         │
                     │ • rate limit (Redis)       │ ← tầng 2
                     └──────────────┬────────────┘
                                    ▼
                     ┌───────────────────────────┐
                     │ Redis (counter rate limit) │
                     └───────────────────────────┘
                                     │
                     ┌───────────────┴───────────────┐
                     ▼                               ▼
        ┌────────────────────┐          ┌────────────────────┐
        │ PostgreSQL          │          │ React + Vite (SPA) │
        │ (nguồn dữ liệu)     │          │ gọi /api/v1/*      │
        └────────────────────┘          └────────────────────┘
```

## Thành phần

### Load balancer — `infra/nginx/`

- `nginx.conf`: cấu hình http chung, log format có `request_id` và `upstream_response_time`.
- `conf.d/upstreams.conf`: `upstream backend_upstream` tới service `api`, và
  `upstream frontend_upstream`.
- `conf.d/rate-limit.conf`: khai báo các `limit_req_zone` (xem `docs/infra.md`).
- `conf.d/proxy.conf`: định tuyến `/api/`, `/api/v1/auth/`, `/` (SPA), `/healthz`.

Nginx là điểm vào duy nhất từ bên ngoài. Frontend không biết địa chỉ instance backend.

### Backend — `src/backend/app/`

- `main.py`: khởi tạo FastAPI, middleware, đăng ký router, error handler 500.
- `core/config.py`: cấu hình qua biến môi trường, prefix `APP_`.
- `core/logging.py`: log JSON, gắn `request_id`.
- `core/middleware/request_id.py`: sinh/gắn `X-Request-Id` xuyên suốt Nginx → backend.
- `core/middleware/rate_limit.py`: token bucket tầng 2, bộ đếm trên Redis (Lua script),
  fallback in-memory nếu Redis lỗi.
- `api/routers/`: `health`, `exams`, `attempts`, `auth`.
- `repositories/exam_repository.py`: đọc đề thi từ PostgreSQL.
- `services/exam_service.py`: nghiệp vụ đề thi + lần thi (skeleton).
- `db/session.py`: chỗ để gắn SQLAlchemy/Postgres sau này.

### Frontend — `src/frontend/src/`

- `api/client.js`: HTTP client dùng chung, envelope `{data, error}`, xử lý `ApiError`.
- `api/exams.js`, `api/attempts.js`: endpoint theo từng nhóm.
- `hooks/useExams.js`: hook tải danh sách đề và chi tiết đề, có trạng thái loading/error.
- `pages/Home.jsx`, `pages/Exam.jsx`: màn hình danh sách và làm bài.
- Dữ liệu **không** còn import JSON tĩnh — mọi thứ đi qua API.

### Dữ liệu

- `infra/postgres/init/schema.sql`: schema Postgres dùng khi khởi tạo volume.
- Media được lưu và phục vụ từ MinIO.

## Ranh giới trách nhiệm

- Crawler chỉ thu thập và chuẩn hóa dữ liệu; không tự suy đoán đáp án đúng.
- Backend chỉ đọc dữ liệu đã chuẩn hóa; không phụ thuộc HTML thô.
- Frontend không biết instance backend nào đang phục vụ; chỉ gọi `/api/v1/*`.
- Rate limit tầng 1 (Nginx) chặn flood theo IP ở edge; tầng 2 tính theo danh tính
  người dùng (API key → user → IP) nên công bằng hơn khi nhiều người dùng chung IP.

## Giới hạn đã biết

- Backend runtime đọc đề thi và lưu attempt trong PostgreSQL; JSON/SQL dump chỉ là
  nguồn nạp dữ liệu.
- Chưa có xác thực thật: `/api/v1/auth/login` trả 501.
- Media có thể là URL ngoài hoặc không tải được.
