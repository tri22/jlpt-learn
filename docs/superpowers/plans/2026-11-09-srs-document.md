# JLPT Learn SRS Document Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a Vietnamese software requirements specification for the JLPT Learn N5 platform.

**Architecture:** Document the existing React SPA, FastAPI API, crawler, JSON/Postgres data boundary, Redis rate limiting, and the target behavior needed for a usable practice platform. Mark implemented, partial, and planned requirements separately.

**Tech Stack:** Markdown, React/Vite, FastAPI, Nginx, Redis, PostgreSQL, crawler scripts.

**Spec:** `docs/srs.md`

## Global Constraints

- Scope is JLPT N5 practice; do not promise authentication or PostgreSQL-backed runtime behavior that the repository has not implemented.
- Existing public API envelope is `{data, error}`.
- Crawling must respect source terms and `robots.txt`; no verification-gate bypass.
- Media may be local or external and must not be assumed to be permanently available.
- Requirements must distinguish current baseline from target behavior.

## Review Focus

- Missing exam ID: API must return a clear not-found response rather than an empty exam.
- Failed media: the learner must still be able to continue where possible.
- Attempt expiry and duplicate submit: scoring must be deterministic and protected from accidental data loss.
- Unauthenticated use: the current product must remain usable without claiming persistent user accounts.
- Rate-limit/Redis failure: service must degrade according to the existing fallback behavior.

### Task 1: Write the SRS

**Files:**
- Create: `docs/srs.md`

**Interfaces:**
- Consumes: repository README, architecture/data-contract docs, backend routers/services, frontend routes/pages.
- Produces: a self-contained Vietnamese SRS with requirement IDs and implementation status.

- [ ] Cover intent, scope, stakeholders, actors, assumptions, constraints, and non-goals.
- [ ] Define learner flows for browsing exams, opening an exam, answering, submitting, and reviewing.
- [ ] Define functional requirements for catalog, exam content/media, attempts/scoring, review, API errors, crawler/data quality, and authentication boundary.
- [ ] Define non-functional requirements for performance, availability, security, accessibility, compatibility, observability, and maintainability.
- [ ] Map requirements to current routes/components and label each as implemented, partial, or planned.
- [ ] Add acceptance criteria and an open-issues list for behavior not yet fixed by the codebase.

### Verification

- [ ] Check the document exists and contains all required sections.
- [ ] Run `git diff --check`.
- [ ] Inspect the final diff for invented implementation claims.
