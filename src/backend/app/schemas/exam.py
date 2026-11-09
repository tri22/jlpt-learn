"""Pydantic schemas cho các resource chính."""

from typing import Any

from pydantic import BaseModel, Field

# Loại đề: đề đơn môn dùng để ôn tập, đề tổng hợp dùng để thi thử.
KIND_REVIEW = "review"
KIND_MOCK = "mock"


class Choice(BaseModel):
    key: str
    label: str | None = None
    html: str = ""


class Question(BaseModel):
    id: int
    label: str
    kind: str | None = None
    quizHtml: str = ""
    choices: list[Choice] = Field(default_factory=list)


class ExamSummary(BaseModel):
    id: str
    title: str
    questionCount: int
    durationMinutes: int
    mode: str = "full"
    # "review" = đề đơn môn để ôn tập, "mock" = đề tổng hợp để thi thử
    kind: str = KIND_REVIEW
    # Môn của đề đơn môn (None với đề tổng hợp)
    subject: str | None = None
    subjectLabel: str | None = None


class ExamDetail(ExamSummary):
    answerKey: dict[str, Any] = Field(default_factory=dict)
    questions: list[Question] = Field(default_factory=list)


class AttemptCreate(BaseModel):
    examId: str
    durationMinutes: int | None = None


class AttemptAnswer(BaseModel):
    questionId: int
    choiceKey: str | None = None


class AttemptSubmit(BaseModel):
    answers: list[AttemptAnswer] = Field(default_factory=list)


class Attempt(BaseModel):
    id: str
    examId: str
    status: str = "in_progress"
    score: int | None = None
    maxScore: int | None = None
    startedAt: str | None = None
    submittedAt: str | None = None


class LoginRequest(BaseModel):
    username: str
    password: str


class HealthResponse(BaseModel):
    status: str
    redis: str
    version: str
