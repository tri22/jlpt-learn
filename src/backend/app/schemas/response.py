"""Schema response dùng chung cho API."""

from typing import Any, Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class ApiError(BaseModel):
    code: str
    message: str
    details: Any = None


class ApiResponse(BaseModel, Generic[T]):
    data: T | None = None
    error: ApiError | None = None
