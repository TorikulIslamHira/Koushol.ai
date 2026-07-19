# Koushol Data Model

Expands `PROJECT.md` Section 7 with actual column types, constraints, and RLS policy summaries. The migrations in `supabase/migrations/` are the executable source of truth — if this doc and a migration ever disagree, the migration wins and this doc is out of date and needs fixing in the same PR that caused the drift.

Applied in order (each file name is timestamp-prefixed, so this is also execution order):

1. `20260719010000_create_users.sql`
2. `20260719010100_create_courses.sql`
3. `20260719010200_create_chapters.sql`
4. `20260719010300_create_enrollments.sql`
5. `20260719010400_create_quizzes.sql`
6. `20260719010500_create_chapter_progress.sql`
7. `20260719010600_create_certificates.sql`
8. `20260719010700_create_sales.sql`
9. `20260719020000_add_courses_raw_notes.sql`

## `users`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | = `auth.users.id`, FK with `on delete cascade` |
| `role` | `user_role` enum (`student`/`teacher`/`admin`) | defaults `student` |
| `name` | `text` | |
| `email` | `text` | |
| `created_at` | `timestamptz` | defaults `now()` |

Populated automatically by the `handle_new_auth_user` trigger on `auth.users` insert — never insert into `public.users` directly from app code. `current_user_role()` is a `security definer` helper function other tables' RLS policies call to check the caller's role without recursing into `users`' own RLS.

RLS: own row select/update; admin select/update all; no client insert/delete.

## `courses`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | `gen_random_uuid()` |
| `teacher_id` | `uuid` FK → `users.id` | |
| `title` | `text` | |
| `description` | `text` | default `''` |
| `status` | `course_status` enum (`draft`/`published`) | defaults `draft` |
| `price` | `numeric(10,2)` | `>= 0`, in BDT |
| `created_at` | `timestamptz` | |
| `raw_notes` | `text`, nullable | Teacher's original notes, input to AI course generation (Phase 3). Added in `20260719020000_add_courses_raw_notes.sql`. |

RLS: anyone (incl. anonymous) can select `status = 'published'`; owning teacher or admin can select/insert/update/delete regardless of status.

**RLS is row-level, not column-level**: the "published" policy above exposes every column, including `raw_notes`, to any reader of a published course — there's no way to hide one column from an otherwise-permitted row in plain Postgres RLS. The student-facing hooks (`useCourses`, `useCourse` without `includeRawNotes`) work around this by explicitly selecting a public column list (`PUBLIC_COURSE_COLUMNS` in `src/features/courses/hooks/useCourses.ts`) instead of `select('*')`. Keep that in mind before adding another teacher-only column — the DB won't stop it from leaking, only the query will.

**Known Phase 2 simplification**: `PROJECT.md` Section 3 lists teacher publish as "needs admin approval", but the admin approval UI is Phase 5 and doesn't exist yet. `src/features/courses/hooks/useCourseMutations.ts` lets a teacher publish/unpublish their own course directly (RLS already allows this — the owner/admin update policy doesn't distinguish which columns changed). Revisit once Phase 5 lands.

## `chapters`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `course_id` | `uuid` FK → `courses.id` cascade | |
| `order_index` | `int` | `>= 0`, unique per `(course_id, order_index)` |
| `title` | `text` | |
| `content` | `text` | plain text for Phase 1 — no markdown/HTML rendering yet |
| `is_ai_generated` | `bool` | defaults `false`; set `true` once Phase 3 lands |

RLS: `order_index = 0` of a published course is a public free preview (readable by anyone, including anonymous); enrolled students can read every chapter of their course (policy added in the `enrollments` migration, since it needs that table to exist); owning teacher/admin has full CRUD.

## `quizzes`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `chapter_id` | `uuid` FK → `chapters.id` cascade, **unique** | one quiz per chapter |
| `questions` | `jsonb` | array of `{ question, options[], correct_index }` |

**Known Phase 1 limitation**: `correct_index` is part of the same jsonb payload the client fetches to render the quiz, so any enrolled student's browser can read the answer key by inspecting network traffic. Grading happens entirely client-side (`src/features/quizzes/components/QuizPlayer.tsx`) against `QUIZ_PASS_THRESHOLD` (70%, `src/lib/constants.ts`). This is an accepted tradeoff for an MVP with no real stakes riding on quiz integrity yet. Before that changes (e.g. paid certificates, leaderboard, anything adversarial), move grading to a Supabase Edge Function that holds the answer key server-side and only returns a pass/fail + score.

RLS: same visibility as the parent chapter (free-preview chapter, enrolled student, or owning teacher/admin).

## `enrollments`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `student_id` | `uuid` FK → `users.id` cascade | |
| `course_id` | `uuid` FK → `courses.id` cascade | |
| `unlocked_chapter_index` | `int` | `>= 0`, defaults `0`; the highest `chapters.order_index` this student may currently access |
| `enrolled_at` | `timestamptz` | |

Unique on `(student_id, course_id)` — one enrollment row per student per course.

RLS: student sees/creates/updates their own rows only (insert requires the target course to be `published`); teacher/admin can select rows for their own courses (all, for admin).

**Unlock mechanism (Phase 1, client-driven)**: passing a chapter's quiz calls `supabase.from('enrollments').update({ unlocked_chapter_index: n+1 })` from `src/pages/ChapterPage.tsx`. Like the quiz grading note above, this trusts the authenticated client to report a genuine pass — acceptable for MVP, revisit alongside the Edge Function grading migration.

## `chapter_progress`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `student_id` | `uuid` FK → `users.id` cascade | |
| `chapter_id` | `uuid` FK → `chapters.id` cascade | |
| `quiz_score` | `numeric(5,2)` | `0–100`, nullable |
| `completed_at` | `timestamptz` | null until a passing attempt is recorded |

Unique on `(student_id, chapter_id)` — retaking a quiz upserts the same row (see `useChapterProgress.recordAttempt`).

RLS: student sees/inserts/updates their own; teacher/admin can select rows for their own courses (all, for admin). Insert requires the student to be enrolled in the chapter's course.

## `certificates`

Schema-only placeholder — **no issuance code exists yet**, and the certificate's visual design is explicitly undecided (see `PROJECT.md` Section 10). Table + RLS exist now so the FK/unique shape doesn't need a breaking migration later.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `student_id` | `uuid` FK → `users.id` cascade | |
| `course_id` | `uuid` FK → `courses.id` cascade | |
| `issued_at` | `timestamptz` | |

Unique on `(student_id, course_id)`. RLS: student/teacher/admin can select relevant rows; only admin (or a future service-role Edge Function, which bypasses RLS entirely) can insert.

## `sales`

Schema-only placeholder for Phase 6 (bKash/Nagad/SSLCommerz) — no payment provider is wired up yet.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `course_id` | `uuid` FK → `courses.id` cascade | |
| `student_id` | `uuid` FK → `users.id` cascade | |
| `amount` | `numeric(10,2)` | `>= 0`, BDT |
| `payment_provider` | `payment_provider` enum (`bkash`/`nagad`/`sslcommerz`) | |
| `status` | `sale_status` enum (`pending`/`completed`/`failed`/`refunded`) | defaults `pending` |
| `created_at` | `timestamptz` | |

RLS: student/teacher/admin can select relevant rows; only admin (or a future service-role webhook handler) can insert.

## AI course generation (Phase 3)

`supabase/functions/generate-course/index.ts` is a Supabase Edge Function (Deno) — the only place `ANTHROPIC_API_KEY` is used. It must never be called with the key from the browser; the frontend (`src/features/courses/hooks/useGenerateCourse.ts`) calls it via `supabase.functions.invoke`, which forwards the signed-in user's JWT instead.

**Auth model**: the function builds a Supabase client from the caller's own JWT (not the service role) and does a plain `select` on `courses` — the existing owner/admin RLS policy is what actually enforces "must be this course's teacher or an admin." No separate authorization check was written; it would just duplicate what RLS already guarantees.

**Contract**: `POST { courseId, rawNotes }` → `{ chapters: [{ title, content, questions: [{ question, options, correct_index }] }] }`. Nothing is written to the DB inside the function — the frontend shows the proposal for review, and only writes it via `useApplyGeneratedChapters` (`src/features/courses/hooks/`) if the teacher clicks "Add to course." Applied chapters get `is_ai_generated = true` and are appended after the course's existing chapters (`order_index` starts at the current chapter count, kept contiguous — same rule as `useChapterMutations`).

**Cost guardrail** (`PROJECT.md` Section 9): one Claude call per invocation, `rawNotes` capped at 20,000 characters, and every call logs estimated token usage + cost (`console.log` in the function, visible via `supabase functions logs generate-course`). See `docs/decisions/cost-notes.md` for the budget this should stay inside.

**Deployment**: this function is not applied via `supabase/migrations/` — it's deployed separately with `supabase functions deploy generate-course`, and `ANTHROPIC_API_KEY` is set with `supabase secrets set ANTHROPIC_API_KEY=...` (dashboard: Edge Functions → generate-course → Secrets). The GitHub↔Supabase integration deploying migrations does not deploy functions.

## Seed data

`supabase/seed.sql` creates one demo teacher (`teacher.demo@koushol.ai`, local dev only — never run against a production project) and two published courses ("Bangla Grammar Basics", "Intro to Digital Marketing") with chapters and quizzes, so the full student flow is clickable immediately after `supabase db reset`.
