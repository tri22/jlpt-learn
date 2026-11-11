#!/usr/bin/env bash
set -Eeuo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
backup_root="${BACKUP_DIR:-$repo_root/backups}"
backup_dir="$backup_root/$(date -u +%Y%m%dT%H%M%SZ)"

mkdir -p "$backup_dir/minio"

echo "Backup PostgreSQL..."
docker compose exec -T postgres \
  pg_dump \
  -U "${POSTGRES_USER:-jlpt}" \
  -d "${POSTGRES_DB:-jlpt}" \
  --no-owner \
  --no-privileges > "$backup_dir/postgres.sql"

echo "Backup MinIO..."
docker compose build minio-tools >/dev/null
docker compose run --rm -T \
  --entrypoint python \
  -e MINIO_BACKUP_DIR=/backup/minio \
  -v "$backup_dir/minio:/backup/minio" \
  minio-tools /app/backup_minio.py

printf 'Backup created at: %s\n' "$backup_dir"
