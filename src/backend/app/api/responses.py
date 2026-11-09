"""Envelope response thống nhất cho toàn bộ API."""

from typing import Any

from fastapi.responses import JSONResponse

from app.schemas.response import ApiError, ApiResponse


def ok(data: Any = None, status_code: int = 200, headers: dict[str, str] | None = None) -> JSONResponse:
    response = ApiResponse[Any](data=data)
    return JSONResponse(
        status_code=status_code,
        content=response.model_dump(mode="json"),
        headers=headers,
    )


def fail(
    code: str,
    message: str,
    status_code: int = 400,
    details: Any = None,
    headers: dict[str, str] | None = None,
) -> JSONResponse:
    response = ApiResponse[None](error=ApiError(code=code, message=message, details=details))
    return JSONResponse(
        status_code=status_code,
        content=response.model_dump(mode="json"),
        headers=headers,
    )
