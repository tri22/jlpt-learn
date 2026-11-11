# Local Development

## Requirements

- Python 3.11+ and `venv`.
- A modern Node.js release and npm for the frontend.
- Docker and Docker Compose for the full stack.

## Repository Structure

```text
src/backend/    API FastAPI
src/frontend/   SPA React + Vite
infra/          Nginx and Redis configuration
```

## Full Stack with Docker (Recommended)

```bash
cp .env.example .env
make up
```

- Load balancer: <http://localhost:8080>
- API health: <http://localhost:8080/api/v1/health>

Common commands:

```bash
make logs       # follow all stack logs
make ps         # show container status
make down       # stop
make rebuild    # rebuild from scratch
```

## Dev mode: hot reload

```bash
make dev
```

`docker-compose.dev.yml` overrides `docker-compose.yml`:

| Service | Difference from production |
| --- | --- |
| `frontend` | Runs `vite dev` with HMR instead of a static Nginx build. Docker target: `dev`. |
| `api` | `uvicorn --reload --reload-dir /app/app`. Target Docker: `dev`. |

Source directories (`src/frontend/src`, `src/backend/app`) are bind-mounted, so
host changes appear immediately inside the containers:

- Frontend: Vite sends HMR updates over WebSocket and preserves browser state.
- Backend: uvicorn watches files and restarts when they change.

```bash
make dev-logs   # live frontend and backend logs
make dev-down   # stop the development stack
```

Nginx remains the load balancer on `:8080`, two-layer rate limiting remains
enabled, and API traffic still targets the `api` service.

### Vite Development Server in a Container

`vite.config.js` enables `host: true` and `allowedHosts: true` so Nginx can proxy
to it. If the filesystem does not emit events for a bind mount, set this in `.env`:

```
WATCH_USEPOLLING=true
```

## Run Components Separately

### Backend

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r src/backend/requirements.txt

cd src/backend
APP_DATABASE_URL=postgresql://jlpt:jlpt_dev_password@localhost:5433/jlpt \
APP_REDIS_ENABLED=false \
uvicorn app.main:app --reload --port 8000
```

See `src/backend/app/core/config.py` and `.env.example` for `APP_` environment variables.

Test:

```bash
make test-backend       # or: cd src/backend && python -m pytest -q
```

### Frontend

```bash
cd src/frontend
npm install
npm run dev
```

The Vite server runs on port 5173 and proxies `/api` to Nginx through
`VITE_API_PROXY_TARGET`, which defaults to `http://localhost:8080`. Without
Docker, point it at `http://localhost:8000` to call the backend directly.

With Docker (`make dev`), Vite listens on container port 80 and Nginx proxies to
it, so the application remains available at <http://localhost:8080>.

```bash
npm run lint
npm run build
```

### SQL Data (PostgreSQL)

The schema is in `infra/postgres/init/`. Data is restored from a backup.

```bash
make db-reset      # remove the PostgreSQL volume and initialize it again
```

Load it manually into another PostgreSQL instance:

```bash
psql -U jlpt -d jlpt -v ON_ERROR_STOP=1 -f infra/postgres/init/schema.sql
make restore BACKUP=backups/<timestamp> CONFIRM=1
```

See [docs/data-contract.md](data-contract.md) for details.

## Change Workflow

1. Identify the affected data or behavior.
2. Preserve compatibility unless a breaking change is required.
3. Run backend tests (`make test-backend`) after API changes.
4. Run `npm run lint` and `npm run build` after frontend changes.
5. Update documentation and record remaining limitations.

## Do Not Commit

- `.venv/`, `node_modules/`, build output (`dist/`).
- Cookies, tokens, or credentials.
- `.env` files; only `.env.example` is tracked.
- Large ingestion output or downloaded media unless intentionally used as fixtures.
