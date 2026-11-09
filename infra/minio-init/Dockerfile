FROM python:3.12-slim

RUN pip install --no-cache-dir minio>=7.2
COPY scripts/backup_minio.py /app/backup_minio.py
COPY scripts/restore_minio.py /app/restore_minio.py
