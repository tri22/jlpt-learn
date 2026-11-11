# Operations and Troubleshooting

## Check the Running Stack

```bash
make ps                                  # container status
curl -s localhost:8080/api/v1/health     # {"status":"ok","redis":"up",...}
curl -s localhost:8080/api/v1/exams      # exam catalog
curl -sI localhost:8080/                 # frontend SPA
```

## Initialize and Restore Data

Recreate the schema:

```bash
make db-reset
```

## Common Problems

| Symptom | Resolution |
| --- | --- |
| Nginx keeps restarting | Run `docker compose logs nginx`; this is usually a configuration error. Ensure `limit_req` is not inside `if` and upstream hostnames resolve. |
| Health reports `redis: down` | Check `docker compose logs redis` and ensure `REDIS_PASSWORD` matches between `redis` and `api`. |
| 429 appears too early | Nginx is rejecting requests. Check `docker compose logs nginx \| grep limiting` and tune `infra/nginx/conf.d/rate-limit.conf`. |
| 429 without an Nginx warning | FastAPI is rejecting requests. Inspect `X-RateLimit-Limit` and `X-RateLimit-Remaining`, then tune `APP_RATE_LIMIT_PER_MINUTE`. |
| Frontend remains on “Loading…” | The API is not responding. Check `curl localhost:8080/api/v1/exams` and `docker compose logs api`. |
| Frontend does not update after changes | Run `make rebuild`, or `npm run build` in `src/frontend/` when using the dev server. |
| Media returns 404 | Check the object in MinIO and confirm Nginx proxies `/exams/` to MinIO. |
| PostgreSQL has no tables | The schema runs only when `pgdata` is first created. Run `make db-reset` to initialize it again. |
| Media returns HTML | Do not save it; inspect the URL, redirects, and access status. |
| Frontend build fails | Run `npm run lint`, then `npm run build` in `src/frontend/`, and address the first error. |

## Restore

```bash
make restore BACKUP=backups/<timestamp> CONFIRM=1
```

Rebuild the complete stack with `make rebuild`, then restore the backup.

## Operational Security

- Do not commit `.env`; only `.env.example` is tracked.
- Deployments must obtain `REDIS_PASSWORD` and future secrets from a secret store.
- Keep Redis isolated from the host without a published port.
- Nginx does not currently configure TLS; production deployment requires a certificate and port 443.
