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
10. `20260719030000_create_chapter_audio.sql`

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

## `chapter_audio`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `chapter_id` | `uuid` FK → `chapters.id` cascade, **unique** | one audio row per chapter |
| `segments` | `jsonb` | array of `{ audio_base64, mime_type }` — Sarvam's TTS API caps input length per request, so long content is split into segments and played back in order |
| `language_code` | `text` | e.g. `bn-IN`, `en-IN` — the language the teacher generated this narration in, not inferred from content |
| `generated_at` | `timestamptz` | |

RLS: same visibility as the parent chapter (free-preview chapter, enrolled student, or owning teacher/admin) — same pattern as `quizzes`.

**Why a separate table instead of a column on `chapters`**: every existing `chapters` read in the codebase does `select('*')`, and audio segments can be multi-hundred-KB base64 blobs. Bundling that into `chapters` would silently bloat every course/chapter page load, including ones that never play audio. `chapter_audio` is only fetched where actually needed (`useChapterAudio`, called from the chapter reader and the teacher's audio panel).

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

`supabase/functions/generate-course/index.ts` is a Supabase Edge Function (Deno) — the only place `GROQ_API_KEY` is used. It must never be called with the key from the browser; the frontend (`src/features/courses/hooks/useGenerateCourse.ts`) calls it via `supabase.functions.invoke`, which forwards the signed-in user's JWT instead.

Provider is Groq (`api.groq.com`, OpenAI-compatible chat completions), not Anthropic — see `PROJECT.md` Section 2 for why. Model defaults to `llama-3.3-70b-versatile`, overridable with a `GROQ_MODEL` secret if that model is deprecated (Groq's lineup changes faster than most providers').

**Auth model**: the function builds a Supabase client from the caller's own JWT (not the service role) and does a plain `select` on `courses` — the existing owner/admin RLS policy is what actually enforces "must be this course's teacher or an admin." No separate authorization check was written; it would just duplicate what RLS already guarantees.

**Contract**: `POST { courseId, rawNotes }` → `{ chapters: [{ title, content, questions: [{ question, options, correct_index }] }] }`. Nothing is written to the DB inside the function — the frontend shows the proposal for review, and only writes it via `useApplyGeneratedChapters` (`src/features/courses/hooks/`) if the teacher clicks "Add to course." Applied chapters get `is_ai_generated = true` and are appended after the course's existing chapters (`order_index` starts at the current chapter count, kept contiguous — same rule as `useChapterMutations`).

**CORS**: `Deno.serve` doesn't add CORS headers by default, and the browser's preflight `OPTIONS` request will fail silently (shows as a generic "Failed to send a request to the Edge Function" in the Supabase JS client, not a helpful error) without them. Any new Edge Function called from the browser needs the same `CORS_HEADERS` + `OPTIONS` early-return pattern this function uses — copy it rather than rediscovering this.

**Cost guardrail** (`PROJECT.md` Section 9): one Groq call per invocation, `rawNotes` capped at 20,000 characters, and every call logs token usage (`console.log` in the function, visible via `supabase functions logs generate-course`). Groq's free tier has no real dollar cost, but usage is still logged so a runaway loop would show up before hitting rate limits. See `docs/decisions/cost-notes.md`.

**Deployment**: this function is not applied via `supabase/migrations/` — it's deployed separately with `supabase functions deploy generate-course`, and `GROQ_API_KEY` is set with `supabase secrets set GROQ_API_KEY=...` (dashboard: Edge Functions → generate-course → Secrets). The GitHub↔Supabase integration deploying migrations does not deploy functions.

## TTS audio ("listen to this course") (Phase 4)

`supabase/functions/generate-chapter-audio/index.ts` is a second Edge Function, same shape as `generate-course`: the only place `SARVAM_API_KEY` is used, called via `supabase.functions.invoke` from `src/features/chapters/hooks/useGenerateChapterAudio.ts`, and authorization is the existing chapters owner/admin RLS policy re-used through an RLS-respecting client (no separate auth check written).

**Contract**: `POST { chapterId, languageCode }` → `{ segments: [{ audio_base64, mime_type }], languageCode }`. Unlike `generate-course`, this function *does* write to the DB itself (upserts `chapter_audio`) rather than leaving that to a frontend review step — there's no meaningful "review before committing" step for audio the way there is for AI-written chapter text, so the extra round trip would just be friction.

**Language is an explicit teacher choice, not inferred from content.** Sarvam's Bulbul model is Bengali-focused; some seed course content is English prose (e.g. "Bangla Grammar Basics" *explains* Bangla grammar in English). Defaulting to Bengali regardless of what's actually on the page would silently produce wrong-language or garbled narration. `GenerateAudioPanel` (`src/features/chapters/components/`) shows a language dropdown (`SUPPORTED_AUDIO_LANGUAGES`) every time.

**Chunking**: Sarvam's TTS API caps input length per request, so chapter content is split on sentence boundaries into ≤450-character segments (`chunkText` in the function), capped at `MAX_SEGMENTS = 15` — a chapter needing more than that is rejected with a "shorten the chapter" error rather than silently firing 30+ paid/rate-limited calls. `AudioPlayer` (`src/features/chapters/components/`) plays segments back-to-back as one continuous listen.

**Verified against Sarvam's live API on first real call (2026-07-19)**: the endpoint/request/response shape (`inputs`/`speaker`/`model` fields, `audios[]` response) was correct on the first try. One thing wasn't: the guessed default speaker `'meera'` doesn't exist — Sarvam's 400 response usefully listed the valid names, and the default is now `'anushka'` (confirmed as Sarvam's documented default voice). `SARVAM_MODEL` and `SARVAM_SPEAKER` stay overridable via secrets in case Sarvam's lineup moves on again.

**Cost guardrail** (`PROJECT.md` Section 9): chunk count is capped, one Sarvam call per segment (no retries), and every generation logs segment count + total characters (`console.log`, visible via `supabase functions logs generate-chapter-audio`). See `docs/decisions/cost-notes.md` for the ~৳43–65/course estimate this should stay inside.

**Deployment**: same as `generate-course` — `supabase functions deploy generate-chapter-audio`, and `SARVAM_API_KEY` set with `supabase secrets set SARVAM_API_KEY=...`.

## Seed data

`supabase/seed.sql` creates one demo teacher (`teacher.demo@koushol.ai`, local dev only — never run against a production project) and two published courses ("Bangla Grammar Basics", "Intro to Digital Marketing") with chapters and quizzes, so the full student flow is clickable immediately after `supabase db reset`.
