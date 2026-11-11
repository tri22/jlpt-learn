"""Placeholder for a SQLAlchemy database session; no engine is configured yet."""

from app.core.config import get_settings

# Base = declarative_base()  # pragma: no cover
# engine = create_engine(get_settings().database_url)
# SessionLocal = sessionmaker(bind=engine, autoflush=False)


def get_db():
    """Placeholder generator that will yield a Session once an engine is configured."""
    raise NotImplementedError("The database session is not configured. See docs/data-contract.md.")
    yield  # pragma: no cover
