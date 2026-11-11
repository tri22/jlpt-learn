# JLPT Learn

JLPT N5 practice platform with a FastAPI data API, React frontend, and Nginx
load balancer with two-layer rate limiting.

## Documentation

- [System architecture](docs/architecture.md)
- [Infrastructure: load balancing and rate limiting](docs/infra.md)
- [Development guide](docs/development.md)
- [Database contract](docs/data-contract.md)
- [Operations](docs/operations.md)

## Structure

```text
.
├── docker-compose.yml        nginx + api + redis + frontend + postgres + minio
├── Makefile                  concise operational commands
├── docker-compose.dev.yml    development variant with frontend/backend hot reload
├── .env.example
├── docs/
├── infra/
│   ├── nginx/                nginx.conf + conf.d (upstream, rate limit, proxy)
│   ├── redis/                redis.conf + start-redis.sh
│   └── postgres/init/        schema.sql (Postgres)
├── scripts/                  PostgreSQL and MinIO backup/restore
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
- PostgreSQL: `localhost:5433` (user `jlpt`, database `jlpt`) — schema is initialized automatically

### Dev mode (hot reload)

```bash
make dev
```

- Frontend: Vite dev server with HMR updates the browser after `.jsx`/`.css` changes.
- Backend: uvicorn `--reload` restarts the server after `.py` changes.
- Traffic still goes through Nginx at <http://localhost:8080>; image rebuilds are not required.

```bash
make dev-logs   # follow logs
make dev-down   # stop
```

Source is bind-mounted, so host changes appear immediately in the containers.
If the filesystem does not emit events for a mount, set `WATCH_USEPOLLING=true`
in `.env`.

### Run components separately

```bash
# Backend
python -m venv .venv && source .venv/bin/activate
pip install -r src/backend/requirements.txt
cd src/backend && uvicorn app.main:app --reload

# Frontend
cd src/frontend && npm install && npm run dev

```
