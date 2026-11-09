#!/usr/bin/env python3
"""Sao lưu toàn bộ object trong một bucket MinIO."""

import json
import os
from datetime import datetime, timezone
from pathlib import Path

from minio import Minio


def main() -> None:
    endpoint = os.getenv("MINIO_ENDPOINT", "minio:9000")
    bucket = os.getenv("MINIO_BUCKET", "jlpt-media")
    backup_dir = Path(os.getenv("MINIO_BACKUP_DIR", "/backup/minio"))
    backup_dir.mkdir(parents=True, exist_ok=True)

    client = Minio(
        endpoint,
        access_key=os.environ["MINIO_ROOT_USER"],
        secret_key=os.environ["MINIO_ROOT_PASSWORD"],
        secure=False,
    )
    if not client.bucket_exists(bucket):
        raise RuntimeError(f"MinIO bucket không tồn tại: {bucket}")

    objects = []
    for item in client.list_objects(bucket, recursive=True):
        target = backup_dir / item.object_name
        target.parent.mkdir(parents=True, exist_ok=True)
        client.fget_object(bucket, item.object_name, str(target))
        objects.append(
            {
                "key": item.object_name,
                "bytes": item.size,
                "etag": item.etag,
                "last_modified": item.last_modified.isoformat(),
            }
        )

    metadata = {
        "version": 1,
        "bucket": bucket,
        "endpoint": endpoint,
        "backed_up_at": datetime.now(timezone.utc).isoformat(),
        "object_count": len(objects),
        "objects": objects,
    }
    (backup_dir / "metadata.json").write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Đã backup {len(objects)} object từ MinIO bucket {bucket}")


if __name__ == "__main__":
    main()
