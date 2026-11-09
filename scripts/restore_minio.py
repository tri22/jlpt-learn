#!/usr/bin/env python3
"""Khôi phục object MinIO từ một thư mục backup."""

import json
import mimetypes
import os
from pathlib import Path

from minio import Minio


def main() -> None:
    endpoint = os.getenv("MINIO_ENDPOINT", "minio:9000")
    bucket = os.getenv("MINIO_BUCKET", "jlpt-media")
    backup_dir = Path(os.getenv("MINIO_BACKUP_DIR", "/restore/minio"))
    metadata_path = backup_dir / "metadata.json"
    metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
    if metadata["bucket"] != bucket:
        raise RuntimeError(
            f"Backup thuộc bucket {metadata['bucket']}, không phải {bucket}"
        )

    client = Minio(
        endpoint,
        access_key=os.environ["MINIO_ROOT_USER"],
        secret_key=os.environ["MINIO_ROOT_PASSWORD"],
        secure=False,
    )
    if not client.bucket_exists(bucket):
        client.make_bucket(bucket)

    for item in client.list_objects(bucket, recursive=True):
        client.remove_object(bucket, item.object_name)

    restored = 0
    for item in metadata["objects"]:
        key = item["key"]
        source = backup_dir / key
        if not source.is_file():
            raise FileNotFoundError(f"Thiếu object trong backup: {source}")
        content_type = mimetypes.guess_type(key)[0] or "application/octet-stream"
        client.fput_object(bucket, key, str(source), content_type=content_type)
        restored += 1

    if restored != metadata["object_count"]:
        raise RuntimeError(
            f"Khôi phục thiếu object: {restored}/{metadata['object_count']}"
        )
    print(f"Đã restore {restored} object vào MinIO bucket {bucket}")


if __name__ == "__main__":
    main()
