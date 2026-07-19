# features/quizzes/

Student-facing: `useQuiz` fetches a chapter's quiz; `QuizPlayer` renders it and grades the attempt client-side against `QUIZ_PASS_THRESHOLD` (`src/lib/constants.ts`, currently 70%).

Teacher-facing (authoring, RLS owner/admin-only): `useQuizMutations` (upserts the one quiz per chapter) and `QuizEditor` (add/remove questions and options, mark the correct answer).

Known Phase 1 limitation: grading is client-side because `quizzes.questions` jsonb includes each `correct_index`, so an enrolled student's browser can technically read the answer key. Fine for MVP trust levels; move grading server-side (Edge Function) before real stakes ride on it — see `docs/data-model.md`.
