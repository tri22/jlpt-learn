#!/usr/bin/env python3
"""Restore MinIO objects from a backup directory."""

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
            f"Backup belongs to bucket {metadata['bucket']}, not {bucket}"
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
            raise FileNotFoundError(f"Backup object is missing: {source}")
        content_type = mimetypes.guess_type(key)[0] or "application/octet-stream"
        client.fput_object(bucket, key, str(source), content_type=content_type)
        restored += 1

    if restored != metadata["object_count"]:
        raise RuntimeError(
            f"Restore is missing objects: {restored}/{metadata['object_count']}"
        )
    print(f"Restored {restored} objects to MinIO bucket {bucket}")


if __name__ == "__main__":
    main()
