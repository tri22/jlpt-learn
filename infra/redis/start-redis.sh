#!/usr/bin/env bash
# Lấy mật khẩu Redis từ biến môi trường, mặc định là giá trị dev.
# Redis không publish ra host nên mật khẩu này chỉ bảo vệ trong docker network.
set -euo pipefail

REDIS_PASSWORD="${REDIS_PASSWORD:-jlpt_dev_password}"

exec redis-server /usr/local/etc/redis/redis.conf \
    --requirepass "${REDIS_PASSWORD}"
