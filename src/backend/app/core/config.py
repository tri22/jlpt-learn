"""Cấu hình runtime, đọc từ biến môi trường (prefix APP_)."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="APP_", env_file=".env", extra="ignore")

    app_name: str = "jlpt-backend"
    environment: str = "development"
    debug: bool = True

    # API
    api_prefix: str = "/api/v1"
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:8080"]

    # Dữ liệu runtime
    database_url: str = "postgresql://jlpt:jlpt_dev_password@postgres:5432/jlpt"
    minio_endpoint: str = "minio:9000"
    minio_bucket: str = "jlpt-media"

    # Redis
    redis_url: str = "redis://redis:6379/0"
    redis_enabled: bool = True

    # Rate limit tầng ứng dụng (tầng Nginx là lớp lọc thô)
    rate_limit_enabled: bool = True
    rate_limit_per_minute: int = 60
    rate_limit_write_per_minute: int = 20
    rate_limit_burst: int = 10

    # CORS origins dạng chuỗi phân tách bởi dấu phẩy cho biến môi trường
    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
