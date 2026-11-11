"""Smoke tests: ensure the app starts and core endpoints return the expected envelope."""

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.main import create_app
from app.schemas.exam import Attempt, AttemptSubmit, ExamDetail, ExamSummary


@pytest.fixture
def exam_data_dir(tmp_path: Path) -> Path:
    payload = {
        "id": "de-test",
        "title": "Test exam",
        "questionCount": 1,
        "durationMinutes": 30,
        "answerKey": {"1": "A"},
        "questions": [
            {
                "id": 1,
                "label": "Question 1",
                "kind": "Electromagnetism",
                "quizHtml": "<p> question </p>",
                "choices": [{"key": "A", "html": "<div>A</div>"}],
            }
        ],
    }
    (tmp_path / "de-test.json").write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    return tmp_path


class FakeExamService:
    def __init__(self, data_dir: Path):
        self.data = json.loads((data_dir / "de-test.json").read_text(encoding="utf-8"))

    def list_exams(self):
        return [ExamSummary(**self.data)]

    def get_exam(self, exam_id: str):
        return ExamDetail(**self.data) if exam_id == self.data["id"] else None

    def get_answer_key(self, exam_id: str):
        return self.data.get("answerKey") if exam_id == self.data["id"] else None


class FakeAttemptService:
    def __init__(self):
        self.attempts = {}

    def create(self, exam_id: str):
        attempt = Attempt(id=uuid.uuid4().hex, examId=exam_id, startedAt=datetime.now(timezone.utc).isoformat())
        self.attempts[attempt.id] = attempt
        return attempt

    def get(self, attempt_id: str):
        return self.attempts.get(attempt_id)

    def submit(self, attempt_id: str, payload: AttemptSubmit):
        attempt = self.attempts.get(attempt_id)
        if attempt:
            attempt.status = "submitted"
        return attempt


@pytest.fixture
def client(exam_data_dir: Path, monkeypatch: pytest.MonkeyPatch) -> TestClient:
    settings = get_settings()
    monkeypatch.setattr(settings, "rate_limit_enabled", False)

    from app.api.deps import get_attempt_service, get_exam_repository, get_exam_service

    get_exam_repository.cache_clear()
    get_exam_service.cache_clear()

    app = create_app()
    app.dependency_overrides[get_exam_service] = lambda: FakeExamService(exam_data_dir)
    app.dependency_overrides[get_attempt_service] = FakeAttemptService
    with TestClient(app) as test_client:
        yield test_client

    get_exam_repository.cache_clear()
    get_exam_service.cache_clear()


def test_health_returns_envelope(client: TestClient):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    body = response.json()
    assert body["error"] is None
    assert body["data"]["status"] == "ok"


def test_list_exams(client: TestClient):
    response = client.get("/api/v1/exams")
    assert response.status_code == 200
    exams = response.json()["data"]
    assert len(exams) == 1
    assert exams[0]["id"] == "de-test"


def test_get_exam_detail(client: TestClient):
    response = client.get("/api/v1/exams/de-test")
    assert response.status_code == 200
    exam = response.json()["data"]
    assert exam["questionCount"] == 1
    assert exam["questions"][0]["id"] == 1


def test_get_unknown_exam_returns_404(client: TestClient):
    response = client.get("/api/v1/exams/does-not-exist")
    assert response.status_code == 404


def test_login_is_not_implemented(client: TestClient):
    response = client.post("/api/v1/auth/login", json={"username": "a", "password": "b"})
    assert response.status_code == 501
    assert response.json()["error"]["code"] == "not_implemented"


def test_attempt_lifecycle(client: TestClient):
    created = client.post("/api/v1/attempts", json={"examId": "de-test"})
    assert created.status_code == 201
    attempt_id = created.json()["data"]["id"]

    submitted = client.post(f"/api/v1/attempts/{attempt_id}/submit", json={"answers": []})
    assert submitted.status_code == 200
    assert submitted.json()["data"]["status"] == "submitted"


def test_storage_settings_use_postgres_and_minio(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("APP_DATABASE_URL", "postgresql://u:p@postgres:5432/db")
    monkeypatch.setenv("APP_MINIO_ENDPOINT", "minio:9000")
    monkeypatch.setenv("APP_MINIO_BUCKET", "jlpt-media")

    get_settings.cache_clear()
    settings = get_settings()

    assert settings.database_url == "postgresql://u:p@postgres:5432/db"
    assert settings.minio_endpoint == "minio:9000"
    assert settings.minio_bucket == "jlpt-media"
    get_settings.cache_clear()


def test_exam_summary_exposes_exam_mode():
    summary = ExamSummary(
        id="exam-1",
        title="Reading 01",
        questionCount=10,
        durationMinutes=35,
        mode="reading",
    )

    assert summary.mode == "reading"
