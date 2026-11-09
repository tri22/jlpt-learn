"""Chỗ dành cho session DB (SQLAlchemy). Skeleton — chưa gắn engine."""

from app.core.config import get_settings

# Base = declarative_base()  # pragma: no cover
# engine = create_engine(get_settings().database_url)
# SessionLocal = sessionmaker(bind=engine, autoflush=False)


def get_db():
    """Placeholder generator. Sẽ yield Session sau khi có engine thật."""
    raise NotImplementedError("Chưa cấu hình database. Xem docs/data-contract.md.")
    yield  # pragma: no cover
