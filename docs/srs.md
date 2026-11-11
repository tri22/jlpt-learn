# Software Requirements Specification (SRS)

## JLPT Learn — Current Functional Baseline

| Attribute | Value |
|---|---|
| Document version | 1.3 |
| Last updated | 2026-11-10 |
| Scope | Functions currently implemented in the repository |
| Product | JLPT practice website currently positioned for the N5 level |

## 1. Purpose and Scope

This document describes the behavior **currently implemented** by JLPT Learn and
serves as a baseline for testing, operations, and further development. Limitations
and incomplete behavior are documented separately and must not be treated as
implemented features.

The system currently allows anonymous learners to:

- browse subject-based review exams and mock exams;
- open an exam, select answers, flag questions for review, and navigate between questions;
- take a timed exam, submit it, or have it graded automatically when time expires;
- view scores and correct answers in the browser;
- restart an exam from the beginning.

The backend also provides independent APIs for creating, reading, and submitting
an attempt. This flow persists data in PostgreSQL but is **not used by the current
exam screen**.

The following are outside this baseline: working registration and login, learner
profiles, attempt history in the UI, content administration, payments, and official
JLPT scaled-score simulation.

## 2. Stakeholders and Actors

| Actor/Stakeholder | Role in the current version |
|---|---|
| Learner | Browses and takes public exams without an account. |
| Operator | Deploys the stack, monitors health/logs, and backs up or restores data. |
| Developer/Tester | Maintains the frontend, API, schema, and data contracts. |

## 3. System Overview

```text
Learner → Nginx → React SPA
                ├→ FastAPI → PostgreSQL
                │          └→ Redis (rate limiting)
                └→ MinIO (/exams/* internal media)
```

- React/Vite provides the SPA and hash-based routing.
- Nginx is the entry point and proxies the UI, `/api/*`, and `/exams/*` media.
- FastAPI reads exams from and stores attempts in PostgreSQL.
- Redis stores the rate-limit token bucket; the backend uses in-process memory if Redis fails.
- MinIO stores internal media in the `jlpt-media` bucket; external media paths are
  preserved as provided by the data.

### 3.1 Operational Assumptions

- PostgreSQL already contains the schema and valid exam data.
- An exam appears in the catalog only when `examinations.published = true`.
- Learners can access external URLs when an exam references external media.
- Nginx is the production entry point; the Vite proxy is used in development.

## 4. Current Functional Requirements

Status labels used in this document:

- **Implemented:** connected from the UI to the data layer or complete within the stated scope.
- **Backend only:** the API exists, but the UI does not use it.
- **Partial:** basic behavior exists with clearly documented limitations.

### 4.1 CRUD Overview Matrix

| Resource | Create | Read | Update | Delete |
|---|---|---|---|---|
| Exam | No create API | Catalog, details, answer key | None | None |
| Attempt | Create anonymous attempt | Read attempt status | Submit/grade and resubmit | None |
| In-progress frontend answer | Created on first answer selection | Display status and result | Change answer, flag question, update timer | Clear all on restart or page reload |
| Media | No uploader | Read through exam details and Nginx/MinIO | None | None |
| Account | None | None | None | None |

### 4.2 Create

| ID | Resource | Current requirement | Status |
|---|---|---|---|
| FR-ATT-001 | Attempt | `POST /api/v1/attempts` shall create an anonymous attempt for a valid public `examId`, use the exam duration, and return HTTP 201. | Backend only |

The frontend does not create exams, media, or accounts. Selecting an answer only
creates temporary browser state and does not create a backend record.

### 4.3 Read

#### 4.3.1 Navigation

| ID | Current requirement | Status |
|---|---|---|
| FR-NAV-001 | The SPA shall recognize `#/`, `#/on-tap`, `#/on-tap/{subject}`, `#/thi-thu`, `#/bai-thi/{exam_id}`, `#/huong-dan`, and `#/gioi-thieu`; other routes shall resolve to the home page. | Implemented |
| FR-NAV-002 | The navigation bar shall provide access to review, subject selection, mock exams, the guide, and the about page. | Implemented |
| FR-NAV-003 | The browser tab title shall change according to the current page, subject, or exam title. | Implemented |
| FR-NAV-004 | The home page shall link to the two primary flows: review and mock exams. | Implemented |
| FR-NAV-005 | The footer shall display the exam count and total question count from the loaded API catalog. | Implemented |

#### 4.3.2 Exam Catalog

| ID | Current requirement | Status |
|---|---|---|
| FR-CAT-001 | The frontend shall load the catalog through `GET /api/v1/exams` when the application starts. | Implemented |
| FR-CAT-002 | The API shall return only published exams, ordered by `examinations.id`, with `id`, `title`, `questionCount`, `durationMinutes`, `mode`, `kind`, `subject`, and `subjectLabel`. | Implemented |
| FR-CAT-003 | An exam with `mode=full` shall be classified as `kind=mock`; other modes shall be classified as `kind=review`. | Implemented |
| FR-CAT-004 | The `vocab`, `grammar`, `kanji`, `reading`, and `listening` modes shall map to their corresponding UI subjects. | Implemented |
| FR-CAT-005 | The review page shall filter `kind=review` exams, filter/group them by subject, and show loading/error states; the empty-state message currently appears only within a selected subject list. | Partial |
| FR-CAT-006 | The mock-exam page shall filter `kind=mock` exams, show the total exam/question counts, and link to each exam. | Implemented |

#### 4.3.3 Exam Details and Media

| ID | Current requirement | Status |
|---|---|---|
| FR-EXAM-001 | When `#/bai-thi/{exam_id}` opens, the frontend shall call `GET /api/v1/exams/{exam_id}` and display loading, error, or exam content. | Implemented |
| FR-EXAM-002 | The API shall find an exam by `public_id`; the details endpoint also accepts a numeric internal ID. | Implemented |
| FR-EXAM-003 | Exam details shall include metadata, questions, choices, and `answerKey`. | Implemented |
| FR-EXAM-004 | Questions shall be ordered by `exam_questions.position`; choices shall receive `A`, `B`, ... keys in choice-ID order. | Implemented |
| FR-EXAM-005 | Question text shall be escaped before HTML is generated, and line breaks shall be converted to `<br>`. | Implemented |
| FR-EXAM-006 | `audio` media shall be embedded with an audio element; all other current media types are embedded with an image element. | Partial |
| FR-EXAM-007 | The API shall return 404 when an exam or answer key is not found. | Implemented |
| FR-SYS-001 | `GET /api/v1/exams/{exam_id}/answer-key` shall return the complete answer key without requiring authentication. | Implemented |

#### 4.3.4 Exam State, Attempts, and System Status

| ID | Current requirement | Status |
|---|---|---|
| FR-TEST-003 | The question navigator shall show answered, unanswered, and flagged questions and allow scrolling to a selected question. | Implemented |
| FR-TEST-006 | Results shall show the correct-answer count, answered-question count, correct/incorrect/unanswered states, and the correct answers. | Implemented |
| FR-ATT-002 | `GET /api/v1/attempts/{attempt_id}` shall return status, score, maximum score, and timestamps; an unknown ID shall return 404. | Backend only |
| FR-SYS-003 | `GET /api/v1/health` shall return liveness, Redis status (`up`, `down`, or `disabled`), application name, and environment. | Implemented |
| FR-SYS-004 | The health endpoint shall be exempt from FastAPI middleware rate limiting. | Implemented |

### 4.4 Update

#### 4.4.1 Update In-Progress Frontend State

| ID | Current requirement | Status |
|---|---|---|
| FR-TEST-001 | A learner shall be able to select or change one answer per question; answers are stored in React state for the current page session. | Implemented |
| FR-TEST-002 | A learner shall be able to flag or unflag a question before grading. | Implemented |
| FR-TEST-004 | The timer shall start at `durationMinutes × 60`, decrease every second, and never fall below 0. | Implemented |
| FR-TEST-005 | Selecting “Submit” or reaching 0 seconds shall lock answer selection and grade locally using the exam payload's `answerKey`. | Implemented |

#### 4.4.2 Update Backend Attempt

| ID | Current requirement | Status |
|---|---|---|
| FR-ATT-003 | `POST /api/v1/attempts/{attempt_id}/submit` shall accept a list of `{questionId, choiceKey}` values and return 404 when the attempt does not exist. | Backend only |
| FR-ATT-004 | On submission, the backend shall map `A`, `B`, ... keys by choice-ID order, upsert by `(attempt_id, question_id)`, and mark each answer correct or incorrect. | Backend only |
| FR-ATT-005 | The backend shall update `status=submitted`, `submitted_at`, `elapsed_sec`, answered/correct/incorrect/unanswered counts, `score`, and `max_score`. | Backend only |
| FR-ATT-006 | Resubmitting the same question shall not create a duplicate row, but currently increments `selection_count` and `change_count`. | Backend only |

### 4.5 Delete or Reset

| ID | Scope | Current requirement | Status |
|---|---|---|---|
| FR-TEST-007 | Frontend | “Restart” shall clear answers, flags, and results and reset the timer. | Implemented |
| FR-TEST-008 | Frontend | In-progress exam data shall be lost after a page reload or navigation to another exam because it exists only in React state. | Implemented by current design |

The system currently provides **no Delete API** for exams, attempts, answers,
media, or accounts. PostgreSQL `ON DELETE` rules only preserve integrity when data
is removed through other operational tools; they are not user-facing features.

### 4.6 Supporting Functions Outside CRUD

| ID | Group | Current requirement | Status |
|---|---|---|---|
| FR-SYS-002 | Authentication | `POST /api/v1/auth/login` shall return HTTP 501 with code `not_implemented`; the system shall not create a fake session. | Implemented |
| FR-OPS-001 | Backup | The backup script shall create a PostgreSQL dump and a copy of MinIO objects/metadata in a UTC timestamped directory. | Implemented |
| FR-OPS-002 | Restore | Restore shall require a valid backup path and `CONFIRM=1` before replacing current data. | Implemented |

## 5. External Interface Requirements

### 5.1 User Interface

| Screen | Primary functions |
|---|---|
| Home | Choose review or mock exams. |
| Review | View all subjects or filter Vocabulary, Grammar, Kanji, Reading, and Listening. |
| Mock exams | View comprehensive exams and open an exam. |
| Exam | Answer, flag, navigate, track time, grade, and restart. |
| Guide | Explain exam usage, the timer, and media. |
| About | Describe the product purpose and content structure. |

### 5.2 HTTP API

Default base path: `/api/v1`.

| Method | Endpoint | Successful result |
|---|---|---|
| GET | `/health` | Application and Redis status |
| GET | `/exams` | Published exam catalog |
| GET | `/exams/{exam_id}` | Exam details, questions, and answers |
| GET | `/exams/{exam_id}/answer-key` | Exam answer key |
| POST | `/attempts` | Create attempt, HTTP 201 |
| GET | `/attempts/{attempt_id}` | Attempt status |
| POST | `/attempts/{attempt_id}/submit` | Store answers and grade attempt |
| POST | `/auth/login` | Always returns HTTP 501 in this baseline |

Primary payloads:

```json
{
  "examId": "<exam-public-id>"
}
```

```json
{
  "answers": [
    { "questionId": 1001, "choiceKey": "A" }
  ]
}
```

Responses created by the application helper use this shape:

```json
{
  "data": {},
  "error": null
}
```

Errors created by `fail()`, rate limiting, or the 500 handler contain `data: null`
and an `error` object. `HTTPException` errors, such as 404, and validation errors,
such as 422, still use FastAPI's default format; the error envelope is therefore
not consistent across all endpoints.

### 5.3 Media

- Internal media uses the public path `/exams/{exam_id}/media/{filename}` and is
  proxied by Nginx to the MinIO `jlpt-media/exams/` bucket path.
- External media URLs are rendered directly from `media.path`.
- The frontend has no uploader or media administration screen.

## 6. Data Requirements

### 6.1 Entities Currently in Use

- `exam_types`, `levels`, `examinations`, `sections`;
- `questions`, `question_choices`, `question_answers`, `exam_questions`;
- `media`, `question_media`;
- `exam_attempts`, `attempt_answers`.

The schema also contains `accounts`, `users`, `roles`, `permissions`, and their
join tables, but the login logic does not use them.

### 6.2 Primary Data Rules

- Public exams and attempts use UUID `public_id` values; the submission payload
  still uses a `bigint questionId`; other database relations use `bigint id` values.
- Each question has at most one correct-answer record in `question_answers`.
- A question appears at most once within an exam.
- An attempt has at most one answer row per question because of the composite primary key.
- Deleting an exam cascades to its sections, question associations, and attempts.

## 7. Current Non-Functional Requirements

### 7.1 Security and Access Control

- NFR-SEC-001: CORS shall be configured through `APP_CORS_ORIGINS`.
- NFR-SEC-002: Nginx shall rate-limit API requests by IP, API key, write method, and auth route group.
- NFR-SEC-003: FastAPI shall separately rate-limit reads and writes by API key → user ID → IP.
- NFR-SEC-004: Redis shall not expose a host port in Docker Compose.
- NFR-SEC-005: The current version is public and has no authorization protecting exams, answer keys, or attempts.

### 7.2 Availability and Error Handling

- NFR-AVL-001: If Redis is unavailable, the application rate limiter shall log a
  warning and switch to an in-process counter.
- NFR-AVL-002: The frontend shall display a message when it cannot reach the API or the API returns an error.
- NFR-AVL-003: Nginx shall use a 5-second connect timeout and 60-second send/read timeouts for the API.
- NFR-AVL-004: An unhandled backend error shall return HTTP 500 without exposing the exception.

### 7.3 Observability and Traceability

- NFR-OBS-001: Every backend response shall include `X-Request-Id`, reusing the
  incoming header or generating a new UUID.
- NFR-OBS-002: The backend shall log JSON; request logs shall contain the method, path, status, and request ID.
- NFR-OBS-003: Nginx access logs shall contain the request ID, request time, and upstream response time.

### 7.4 Compatibility and User Experience

- NFR-UX-001: The UI uses React 19/Vite and requires a browser with modern JavaScript support.
- NFR-UX-002: Selecting answers, flagging questions, navigating, and submitting
  shall use keyboard-operable button/link elements.
- NFR-UX-003: Data-loading errors shall use `role="alert"` on catalog and exam pages.
- NFR-UX-004: Vietnamese and Japanese content shall be stored and rendered as Unicode.

## 8. Baseline Acceptance Criteria

| ID | Criterion |
|---|---|
| AC-001 | Opening `#/on-tap` displays review exams grouped by subject; selecting a subject keeps only exams for that subject. |
| AC-002 | Opening `#/thi-thu` displays only exams with `kind=mock`. |
| AC-003 | Opening a valid exam displays the metadata, question order, and choices returned by the API. |
| AC-004 | An unknown exam causes the API to return 404 and the frontend to show an error instead of an empty exam. |
| AC-005 | Selecting an answer or flagging a question updates the question navigator state. |
| AC-006 | Submitting or reaching the time limit locks the exam and displays the score and correct answers. |
| AC-007 | Restarting returns the exam to its initial state and resets the timer. |
| AC-008 | Creating a valid attempt returns 201; reading and submitting it return the expected PostgreSQL-backed state. |
| AC-009 | An unknown attempt returns 404; login returns 501 with `not_implemented`. |
| AC-010 | Health returns 200 when Redis is down and reports `redis=down`. |
| AC-011 | A request rejected by FastAPI middleware rate limiting returns 429 with `Retry-After` and rate-limit headers. |
| AC-012 | A backup contains the PostgreSQL dump and MinIO metadata/objects; restore refuses to run without `CONFIRM=1`. |

## 9. Current Limitations and Risks

1. The frontend grades with the `answerKey` included in the exam-details response;
   answers can be inspected before submission, and the answer-key endpoint is public.
2. The exam screen does not call the attempt API, so answers, scores, and history
   are lost on page reload.
3. The backend does not automatically submit or lock an attempt when time expires
   and still allows a submitted attempt to be resubmitted.
4. Creating an attempt for an unknown exam currently raises HTTP 500 instead of a
   domain-level 404 error.
5. Submission does not verify that a question belongs to the attempt's exam; an
   invalid or empty `choiceKey` is stored as a null/incorrect selection.
6. `durationMinutes` is accepted by the attempt-creation schema but ignored.
7. HTTP 404/422 errors do not follow the application's `{data, error}` envelope.
8. Choice HTML and generated HTML are rendered through `dangerouslySetInnerHTML`;
   imported data must be trusted or sanitized before it enters the database.
9. `video` media has no dedicated video element, and the order of multiple media
   items for one question is not preserved after the repository stores them in a `set`.
10. Health checks Redis only, not PostgreSQL, MinIO, or exam data.
11. The catalog API does not filter specifically for JLPT/N5; every published exam may appear.
12. Some pages hard-code “90 minutes” and exam-section descriptions, which may diverge from actual metadata.
13. The production Nginx baseline does not configure TLS.

## 10. Requirements-to-Code Traceability

| Requirement group | Primary components |
|---|---|
| FR-NAV, FR-CAT | `src/frontend/src/App.jsx`, `pages/Home.jsx`, `pages/Review.jsx`, `pages/MockTest.jsx` |
| FR-EXAM | `api/routers/exams.py`, `repositories/exam_repository.py`, `hooks/useExams.js` |
| FR-TEST | `pages/Exam.jsx`, `components/QuestionCard.jsx`, `components/ExamSheet.jsx` |
| FR-ATT | `api/routers/attempts.py`, `services/exam_service.py`, `schemas/exam.py` |
| FR-SYS | `api/routers/auth.py`, `api/routers/health.py` |
| FR-OPS | `scripts/backup_storage.sh`, `scripts/restore_storage.sh` |
| NFR-SEC, NFR-AVL | `infra/nginx/`, `core/middleware/rate_limit.py`, `core/config.py` |
| NFR-OBS | `core/logging.py`, `core/middleware/request_id.py`, `infra/nginx/nginx.conf` |
| Data | `infra/postgres/init/schema.sql`, `docs/data-contract.md` |

## 11. Change History

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-11-09 | Created the initial SRS. |
| 1.1 | 2026-11-10 | Rewrote the SRS around current behavior and separated frontend local grading, backend attempts, and actual limitations. |
| 1.2 | 2026-11-10 | Grouped functional requirements by Create, Read, Update, and Delete and separated supporting operations outside CRUD. |
| 1.3 | 2026-11-10 | Translated the complete SRS into English. |
