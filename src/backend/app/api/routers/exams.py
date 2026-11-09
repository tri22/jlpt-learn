"""Đề thi: danh sách, chi tiết, đáp án."""

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_exam_service
from app.api.responses import ok
from app.services.exam_service import ExamService

router = APIRouter(prefix="/exams", tags=["exams"])


@router.get("")
async def list_exams(service: ExamService = Depends(get_exam_service)):
    exams = service.list_exams()
    return ok([exam.model_dump() for exam in exams])


@router.get("/{exam_id}")
async def get_exam(exam_id: str, service: ExamService = Depends(get_exam_service)):
    exam = service.get_exam(exam_id)
    if exam is None:
        raise HTTPException(status_code=404, detail=f"Không tìm thấy đề thi: {exam_id}")
    return ok(exam.model_dump())


@router.get("/{exam_id}/answer-key")
async def get_answer_key(exam_id: str, service: ExamService = Depends(get_exam_service)):
    answer_key = service.get_answer_key(exam_id)
    if answer_key is None:
        raise HTTPException(status_code=404, detail=f"Không tìm thấy đề thi: {exam_id}")
    return ok(answer_key)
