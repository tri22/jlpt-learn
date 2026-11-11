# System Architecture

## Overview

```text
                        ┌──────────────────────────┐
   User ───────────────▶ │  Nginx (load balancer)   │  ← single entry point
                        │  • backend proxy          │
                        │  • IP-based limit_req     │  ← rate-limit layer 1
                        └────────────┬─────────────┘
                                     │
                    ┌────────────────┴────────────────┐
                                     ▼
                     ┌───────────────────────────┐
                     │ FastAPI api                │
                     │ • middleware, CORS         │
                     │ • rate limit (Redis)       │ ← layer 2
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
        │ (data source)        │          │ calls /api/v1/*    │
        └────────────────────┘          └────────────────────┘
```

## Components

### Load balancer — `infra/nginx/`

- `nginx.conf`: shared HTTP configuration and a log format with `request_id` and `upstream_response_time`.
- `conf.d/upstreams.conf`: `upstream backend_upstream` targets the `api` service, and
  `upstream frontend_upstream`.
- `conf.d/rate-limit.conf`: declares `limit_req_zone` values; see `docs/infra.md`.
- `conf.d/proxy.conf`: routes `/api/`, `/api/v1/auth/`, `/` (SPA), and `/healthz`.

Nginx is the only external entry point. The frontend does not know backend instance addresses.

### Backend — `src/backend/app/`

- `main.py`: initializes FastAPI, middleware, routers, and the HTTP 500 handler.
- `core/config.py`: configures the application through `APP_` environment variables.
- `core/logging.py`: emits JSON logs with `request_id`.
- `core/middleware/request_id.py`: creates/propagates `X-Request-Id` through Nginx and the backend.
- `core/middleware/rate_limit.py`: layer-2 token bucket backed by Redis through Lua,
  with an in-memory fallback when Redis fails.
- `api/routers/`: `health`, `exams`, `attempts`, `auth`.
- `repositories/exam_repository.py`: reads exams from PostgreSQL.
- `services/exam_service.py`: exam and attempt business logic.
- `db/session.py`: placeholder for a future SQLAlchemy session.

### Frontend — `src/frontend/src/`

- `api/client.js`: shared HTTP client for the `{data, error}` envelope and `ApiError`.
- `api/exams.js`, `api/attempts.js`: endpoints grouped by resource.
- `hooks/useExams.js`: loads the exam catalog/details with loading and error states.
- `pages/Home.jsx`, `pages/Exam.jsx`: catalog entry and exam screens.
- The frontend does **not** import static JSON; all data goes through the API.

### Data

- `infra/postgres/init/schema.sql`: PostgreSQL schema used when the volume is initialized.
- Media is stored and served by MinIO.

## Responsibility Boundaries

- Data ingestion is responsible for collecting and normalizing data, not inferring answers.
- The backend reads normalized data and does not depend on raw HTML.
- The frontend only calls `/api/v1/*` and does not know which backend instance serves it.
- Layer 1 (Nginx) blocks IP floods at the edge; layer 2 keys by caller identity
  (API key → user → IP) for fairness when users share an IP.

## Known Limitations

- The backend reads exams and stores attempts in PostgreSQL; JSON/SQL dumps are
  data-loading sources only.
- Authentication is not implemented: `/api/v1/auth/login` returns 501.
- Media may use external URLs and may be unavailable.
