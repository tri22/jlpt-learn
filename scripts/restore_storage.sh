#!/usr/bin/env bash
set -Eeuo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
backup_dir="${BACKUP:-}"

if [[ -z "$backup_dir" ]]; then
  echo "Usage: make restore BACKUP=backups/<timestamp> CONFIRM=1" >&2
  exit 2
fi
if [[ "${CONFIRM:-}" != "1" ]]; then
  echo "Restore replaces current data. Add CONFIRM=1 to continue." >&2
  exit 2
fi
if [[ "$backup_dir" != /* ]]; then
  backup_dir="$repo_root/$backup_dir"
fi
if [[ ! -s "$backup_dir/postgres.sql" || ! -f "$backup_dir/minio/metadata.json" ]]; then
  echo "Invalid backup: $backup_dir" >&2
  exit 2
fi

echo "Restore PostgreSQL..."
docker compose exec -T postgres psql \
  -v ON_ERROR_STOP=1 \
  -U "${POSTGRES_USER:-jlpt}" \
  -d "${POSTGRES_DB:-jlpt}" \
  -c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;'
docker compose exec -T postgres psql \
  -v ON_ERROR_STOP=1 \
  -U "${POSTGRES_USER:-jlpt}" \
  -d "${POSTGRES_DB:-jlpt}" < "$backup_dir/postgres.sql"

echo "Restore MinIO..."
docker compose build minio-tools >/dev/null
docker compose run --rm -T \
  --entrypoint python \
  -e MINIO_BACKUP_DIR=/restore/minio \
  -v "$backup_dir/minio:/restore/minio:ro" \
  minio-tools /app/restore_minio.py

printf 'Restored from: %s\n' "$backup_dir"
