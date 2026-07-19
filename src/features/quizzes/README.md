# features/quizzes/

`useQuiz` fetches a chapter's quiz; `QuizPlayer` renders it and grades the attempt client-side against `QUIZ_PASS_THRESHOLD` (`src/lib/constants.ts`, currently 70%).

Known Phase 1 limitation: grading is client-side because `quizzes.questions` jsonb includes each `correct_index`, so an enrolled student's browser can technically read the answer key. Fine for MVP trust levels; move grading server-side (Edge Function) before real stakes ride on it — see `docs/data-model.md`.
