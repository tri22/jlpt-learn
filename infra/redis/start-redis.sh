#!/usr/bin/env bash
# Read the Redis password from the environment, with a development default.
# Redis is not exposed to the host, so this password protects the Docker network.
set -euo pipefail

REDIS_PASSWORD="${REDIS_PASSWORD:-jlpt_dev_password}"

exec redis-server /usr/local/etc/redis/redis.conf \
    --requirepass "${REDIS_PASSWORD}"
