"""Placeholder. Xác thực thật (JWT/OAuth) sẽ gắn sau — xem docs/data-contract.md (ACCOUNTS/ROLES)."""

from fastapi import APIRouter

from app.api.responses import fail

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login")
async def login():
    return fail(
        code="not_implemented",
        message="Đăng nhập chưa được triển khai — cần nối với bảng ACCOUNTS/ROLES.",
        status_code=501,
    )
