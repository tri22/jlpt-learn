"""Đọc dữ liệu đề thi từ PostgreSQL."""

from html import escape

from app.schemas.exam import (
    KIND_MOCK,
    KIND_REVIEW,
    ExamDetail,
    ExamSummary,
)

def _connect(database_url: str):
    import psycopg

    return psycopg.connect(database_url)


MODE_SUBJECTS = {
    "reading": ("reading", "Đọc hiểu"),
    "listening": ("listening", "Nghe hiểu"),
    "kanji": ("kanji", "Kanji"),
    "vocab": ("vocabulary", "Từ vựng"),
    "grammar": ("grammar", "Ngữ pháp"),
}


def classify_mode(mode: str):
    if mode == "full":
        return KIND_MOCK, None, None
    subject = MODE_SUBJECTS.get(mode, (mode, mode))
    return KIND_REVIEW, subject[0], subject[1]


class ExamRepository:
    def __init__(self, database_url: str):
        self.database_url = database_url

    def list_exams(self) -> list[ExamSummary]:
        with _connect(self.database_url) as connection, connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT e.public_id::text, e.title, e.question_count, e.duration_min,
                       et.code, e.mode
                FROM examinations e
                JOIN exam_types et ON et.id = e.exam_type_id
                WHERE e.published
                ORDER BY e.id
                """
            )
            rows = cursor.fetchall()
        return [
            self._summary(
                exam_id=row[0], title=row[1], question_count=row[2],
                duration=row[3], exam_type=row[4], mode=row[5]
            )
            for row in rows
        ]

    @staticmethod
    def _summary(exam_id, title, question_count, duration, exam_type, mode):
        kind, subject, subject_label = classify_mode(mode)
        return ExamSummary(
                    id=exam_id,
                    title=title,
                    questionCount=int(question_count),
                    durationMinutes=int(duration),
                    mode=mode,
                    kind=kind,
                    subject=subject,
                    subjectLabel=subject_label or exam_type,
                )

    def _find_exam(self, cursor, exam_id: str):
        cursor.execute(
            """
            SELECT e.id, e.public_id::text, e.title, e.question_count,
                   e.duration_min, et.code, e.mode
            FROM examinations e
            JOIN exam_types et ON et.id = e.exam_type_id
            WHERE e.public_id::text = %s OR e.id::text = %s
            LIMIT 1
            """,
            (exam_id, exam_id),
        )
        return cursor.fetchone()

    def get_exam(self, exam_id: str) -> ExamDetail | None:
        with _connect(self.database_url) as connection, connection.cursor() as cursor:
            exam = self._find_exam(cursor, exam_id)
            if exam is None:
                return None
            exam_pk, public_id, title, question_count, duration, exam_type, mode = exam
            kind, subject, subject_label = classify_mode(mode)
            cursor.execute(
                """
                SELECT q.id, q.content, eq.position, s.name,
                       c.id, c.content, (qa.choice_id = c.id), m.kind, m.path
                FROM exam_questions eq
                JOIN questions q ON q.id = eq.question_id
                LEFT JOIN sections s ON s.id = eq.section_id
                LEFT JOIN question_choices c ON c.question_id = q.id
                LEFT JOIN question_answers qa ON qa.question_id = q.id
                LEFT JOIN question_media qm ON qm.question_id = q.id
                LEFT JOIN media m ON m.id = qm.media_id
                WHERE eq.exam_id = %s
                ORDER BY eq.position, c.id, qm.ord
                """,
                (exam_pk,),
            )
            questions = {}
            answer_key = {}
            for qid, content, position, section, choice_id, choice, correct, media_kind, media_path in cursor.fetchall():
                item = questions.setdefault(qid, {
                    "id": qid, "label": str(position), "kind": section,
                    "quizHtml": f"<p>{escape(content or '').replace(chr(10), '<br>')}</p>",
                    "choices": [], "media": set(),
                })
                if choice_id is not None and not any(c["id"] == choice_id for c in item["choices"]):
                    key = chr(ord("A") + len(item["choices"]))
                    item["choices"].append({"id": choice_id, "key": key, "html": choice or ""})
                    if correct:
                        answer_key[str(qid)] = key
                if media_path:
                    item["media"].add((media_kind, media_path))
            for item in questions.values():
                for kind, path in item.pop("media"):
                    tag = f'<audio controls src="{escape(path)}"></audio>' if kind == "audio" else f'<img src="{escape(path)}" alt="">'
                    item["quizHtml"] += tag
            return ExamDetail(
                id=public_id, title=title, questionCount=int(question_count),
                durationMinutes=int(duration), mode=mode, kind=kind,
                subject=subject, subjectLabel=subject_label or exam_type, answerKey=answer_key,
                questions=[self._question(item) for item in questions.values()],
            )

    @staticmethod
    def _question(item):
        item.pop("media", None)
        for choice in item["choices"]:
            choice.pop("id", None)
        return item

    def get_answer_key(self, exam_id: str) -> dict | None:
        exam = self.get_exam(exam_id)
        return None if exam is None else exam.answerKey
