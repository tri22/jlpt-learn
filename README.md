# JLPT Learn

Nền tảng luyện thi JLPT N5: API FastAPI phục vụ dữ liệu,
frontend React, Nginx làm load balancer kèm rate limit 2 tầng.

## Tài liệu

- [Kiến trúc hệ thống](docs/architecture.md)
- [Hạ tầng: load balancer & rate limit](docs/infra.md)
- [Tài liệu phát triển](docs/development.md)
- [Cấu trúc DB](docs/data-contract.md)
- [Vận hành](docs/operations.md)

## Cấu trúc

```text
.
├── docker-compose.yml        nginx + api + redis + frontend + postgres + minio
├── Makefile                  lệnh vận hành gọn
├── docker-compose.dev.yml    biến thể dev: hot reload frontend + backend
├── .env.example
├── docs/
├── infra/
│   ├── nginx/                nginx.conf + conf.d (upstream, rate limit, proxy)
│   ├── redis/                redis.conf + start-redis.sh
│   └── postgres/init/        schema.sql (Postgres)
├── scripts/                  backup/restore PostgreSQL và MinIO
└── src/
    ├── backend/              FastAPI
    └── frontend/             React + Vite
```

## Quick start

### Full stack (Docker)

```bash
cp .env.example .env
make up
```

- App: <http://localhost:8080>
- API health: <http://localhost:8080/api/v1/health>
- Postgres: `localhost:5433` (user `jlpt`, db `jlpt`) — schema + data được nạp tự động

### Dev mode (hot reload)

```bash
make dev
```

- Frontend: Vite dev server (HMR) — sửa file `.jsx`/`.css` là trình duyệt tự cập nhật.
- Backend: uvicorn `--reload` — sửa file `.py` là server tự restart.
- Vẫn đi qua Nginx ở <http://localhost:8080>, không cần build lại image.

```bash
make dev-logs   # xem log realtime
make dev-down   # dừng
```

Lưu ý: source được bind-mount nên chỉnh sửa trên host là thấy ngay trong container.
Nếu hệ thống file không phát sự kiện (một số mount trên Docker Desktop),
đặt `WATCH_USEPOLLING=true` trong `.env`.

### Chạy riêng từng phần

```bash
# Backend
python -m venv .venv && source .venv/bin/activate
pip install -r src/backend/requirements.txt
cd src/backend && uvicorn app.main:app --reload

# Frontend
cd src/frontend && npm install && npm run dev

```
