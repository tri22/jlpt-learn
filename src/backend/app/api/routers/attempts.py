"""Lần thi: tạo, lấy, nộp bài (skeleton)."""

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_attempt_service
from app.api.responses import ok
from app.schemas.exam import AttemptCreate, AttemptSubmit
from app.services.exam_service import AttemptService

router = APIRouter(prefix="/attempts", tags=["attempts"])


@router.post("")
async def create_attempt(payload: AttemptCreate, service: AttemptService = Depends(get_attempt_service)):
    attempt = service.create(payload.examId)
    return ok(attempt.model_dump(), status_code=201)


@router.get("/{attempt_id}")
async def get_attempt(attempt_id: str, service: AttemptService = Depends(get_attempt_service)):
    attempt = service.get(attempt_id)
    if attempt is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy lần thi")
    return ok(attempt.model_dump())


@router.post("/{attempt_id}/submit")
async def submit_attempt(
    attempt_id: str,
    payload: AttemptSubmit,
    service: AttemptService = Depends(get_attempt_service),
):
    attempt = service.submit(attempt_id, payload)
    if attempt is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy lần thi")
    return ok(attempt.model_dump())
