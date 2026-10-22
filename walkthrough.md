# Phase 10 — Submission System / Submission History Walkthrough

This document outlines the changes and verifications performed during Phase 10, completing the transformation of the stateless code evaluation engine into a fully persistent submission system.

## 1. Objective
To persist student submissions (including both the overall evaluation result and individual test results) across all execution states (Accepted, Wrong Answer, Compilation Error, Runtime Error, TLE, OLE) and expose this history to students safely.

## 2. Database Changes
No schema migrations were required. The existing Prisma models (`Submission` and `SubmissionTestResult`) perfectly supported the required fields. We are explicitly mapping the `EvaluationResult` produced by Phase 9's judge into these persistent tables.

## 3. Submission Persistence Flow
The execution pipeline in `student.lab.controller.ts` (`submitLabCode`) was modified. Once `EvaluationService.evaluateCode` resolves, the new `SubmissionService.saveSubmission()` is invoked. This service wraps the creation of the `Submission` and its related `SubmissionTestResult`s inside a strict `prisma.$transaction`. This ensures that partial writes never occur, maintaining absolute data consistency.

## 4. APIs Added
- `GET /api/student/submissions`: Lists the authenticated student's submissions, ordered by `createdAt DESC`. Supports `page`, `limit`, and `labId` query params.
- `GET /api/student/submissions/:id`: Retrieves the full detail of a single submission (including historical source code and test breakdowns), strictly bound to the authenticated student.

## 5. Authorization & Security Behavior
- The server enforces student ownership strictly (`studentId = req.user.id`). It does not accept `studentId` as a query parameter or body variable.
- Cross-student access throws a safe `404 Not Found` to prevent discovery.
- `Hidden` test cases are fully protected; `expectedOutput`, `actualOutput`, and `input` fields are stripped from the DTOs when visibility is `HIDDEN`.

## 6. Frontend UI Additions
- **Submission History (`SubmissionHistoryPage.tsx`)**: A paginated list interface showing verdicts, pass ratios, execution time, and date for all past attempts.
- **Submission Detail (`SubmissionDetailPage.tsx`)**: A deep-dive view into a specific submission, featuring a read-only Monaco Editor containing the exact snapshot of the submitted source code, along with a per-test outcome breakdown.

## 7. Tests Performed & Regression Results
An extensive integration test (`test-phase10.ts`) verified:
- Correct creation of ACCEPTED and WRONG_ANSWER states.
- Compilation errors persist safely without generating bogus test results.
- Cross-student privacy blocks access effectively.
- Hidden tests strictly omit I/O data.

**All automated tests passed successfully**:
- Phase 10 Persistence Tests (7/7 passed)
- Phase 9 Integration Tests (13/13 passed)
- Phase 8 Execution Tests (12/12 passed)

Backend and Frontend typechecks and builds were executed cleanly with no errors.

## 8. Known Limitations
- Faculty submission monitoring/dashboards are explicitly excluded per scope requirements.
- The UI gracefully falls back to empty states if no test results exist (e.g. for `COMPILATION_ERROR`).
