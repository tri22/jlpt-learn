"""Authentication placeholder; see ACCOUNTS/ROLES in docs/data-contract.md."""

from fastapi import APIRouter

from app.api.responses import fail

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login")
async def login():
    return fail(
        code="not_implemented",
        message="Login is not implemented; it must be connected to the ACCOUNTS/ROLES tables.",
        status_code=501,
    )
