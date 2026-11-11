"""Business logic for exams and attempts."""

import uuid

from app.repositories.exam_repository import ExamRepository
from app.schemas.exam import Attempt, AttemptSubmit


class ExamService:
    def __init__(self, repository: ExamRepository):
        self.repository = repository

    def list_exams(self):
        return self.repository.list_exams()

    def get_exam(self, exam_id: str):
        return self.repository.get_exam(exam_id)

    def get_answer_key(self, exam_id: str):
        return self.repository.get_answer_key(exam_id)


class AttemptService:
    """Persist and grade attempts in PostgreSQL."""

    def __init__(self, database_url: str):
        self.database_url = database_url

    def create(self, exam_id: str) -> Attempt:
        import psycopg
        with psycopg.connect(self.database_url) as connection, connection.cursor() as cursor:
            cursor.execute("SELECT id, public_id::text, duration_min FROM examinations WHERE public_id::text = %s", (exam_id,))
            exam = cursor.fetchone()
            if exam is None:
                raise ValueError("exam_not_found")
            cursor.execute(
                """INSERT INTO exam_attempts (public_id, exam_id, time_limit_sec)
                   VALUES (%s, %s, %s)
                   RETURNING public_id::text, status, started_at, time_limit_sec""",
                (uuid.uuid4(), exam[0], exam[2] * 60),
            )
            row = cursor.fetchone()
        return Attempt(id=row[0], examId=exam[1], status=row[1], startedAt=row[2].isoformat())

    def get(self, attempt_id: str) -> Attempt | None:
        import psycopg
        with psycopg.connect(self.database_url) as connection, connection.cursor() as cursor:
            cursor.execute("""SELECT a.public_id::text, e.public_id::text, a.status, a.score,
                              a.max_score, a.started_at, a.submitted_at
                              FROM exam_attempts a JOIN examinations e ON e.id = a.exam_id
                              WHERE a.public_id::text = %s""", (attempt_id,))
            row = cursor.fetchone()
        return None if row is None else Attempt(
            id=row[0], examId=row[1], status=row[2], score=row[3], maxScore=row[4],
            startedAt=row[5].isoformat() if row[5] else None,
            submittedAt=row[6].isoformat() if row[6] else None,
        )

    def submit(self, attempt_id: str, payload: AttemptSubmit) -> Attempt | None:
        import psycopg
        with psycopg.connect(self.database_url) as connection, connection.cursor() as cursor:
            cursor.execute("SELECT id, exam_id FROM exam_attempts WHERE public_id::text = %s", (attempt_id,))
            attempt = cursor.fetchone()
            if attempt is None:
                return None
            attempt_pk, exam_pk = attempt
            for answer in payload.answers:
                cursor.execute("""SELECT c.id, (qa.choice_id = c.id)
                                  FROM question_choices c
                                  LEFT JOIN question_answers qa ON qa.question_id = c.question_id
                                  WHERE c.question_id = %s ORDER BY c.id""", (answer.questionId,))
                choices = cursor.fetchall()
                key_to_choice = {chr(ord('A') + i): (choice_id, bool(correct)) for i, (choice_id, correct) in enumerate(choices)}
                choice_id, correct = key_to_choice.get(answer.choiceKey, (None, False))
                cursor.execute("""INSERT INTO attempt_answers
                    (attempt_id, question_id, selected_choice_id, is_correct, selection_count, change_count)
                    VALUES (%s, %s, %s, %s, 1, 0)
                    ON CONFLICT (attempt_id, question_id) DO UPDATE SET
                    selected_choice_id = EXCLUDED.selected_choice_id,
                    is_correct = EXCLUDED.is_correct,
                    selection_count = attempt_answers.selection_count + 1,
                    change_count = attempt_answers.change_count + 1""", (attempt_pk, answer.questionId, choice_id, correct))
            cursor.execute("""UPDATE exam_attempts a SET status='submitted', submitted_at=now(),
                answered_count=(SELECT count(*) FROM attempt_answers WHERE attempt_id=a.id),
                correct_count=(SELECT count(*) FROM attempt_answers WHERE attempt_id=a.id AND is_correct),
                incorrect_count=(SELECT count(*) FROM attempt_answers WHERE attempt_id=a.id AND NOT is_correct),
                unanswered_count=(SELECT count(*) FROM exam_questions WHERE exam_id=a.exam_id)
                    - (SELECT count(*) FROM attempt_answers WHERE attempt_id=a.id),
                score=(SELECT count(*) FROM attempt_answers WHERE attempt_id=a.id AND is_correct),
                max_score=(SELECT count(*) FROM exam_questions WHERE exam_id=a.exam_id),
                elapsed_sec=extract(epoch from (now() - a.started_at))::int
                WHERE a.id=%s""", (attempt_pk,))
        return self.get(attempt_id)
