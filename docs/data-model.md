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
11. `20260719040000_course_publish_approval.sql`
12. `20260719050000_restructure_modules_topics.sql`

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
| `status` | `course_status` enum (`draft`/`pending_approval`/`published`) | defaults `draft`. `pending_approval` added in `20260719040000_course_publish_approval.sql`. |
| `price` | `numeric(10,2)` | `>= 0`, in BDT |
| `created_at` | `timestamptz` | |

RLS: anyone (incl. anonymous) can select `status = 'published'`; owning teacher or admin can select/insert/update/delete regardless of status. **Since `20260719040000_course_publish_approval.sql`, a teacher's insert/update policies additionally require `status <> 'published'`** — only an admin's policy can set that value. This means the publish workflow is: teacher moves a course to `pending_approval` (`useCourseMutations.updateCourse`), an admin reviews it (`/admin/courses`) and either approves (→ `published`) or rejects (→ `draft`). A teacher calling the Supabase client directly to force `status = 'published'` themselves gets rejected by RLS, not just hidden by the UI — this was a deliberate fix for a real gap, not just cosmetic (see the Phase 2/5 history below).

**History**: Phase 2 shipped publish as self-service (documented then as a known simplification, since the Phase 5 admin dashboard didn't exist yet to actually review anything). Phase 5 resolved it with the `pending_approval` status and the RLS split above, plus `/admin/courses` as the review queue. `raw_notes` (Phase 3's course-level "Generate with AI from raw notes" input) was dropped in `20260719050000_restructure_modules_topics.sql` when that whole flow was replaced by per-module AI quiz generation — see below.

## `modules`

Added in `20260719050000_restructure_modules_topics.sql`. A course is a top-level container; a module is the first level of structure inside it (title + ordered position), holding topics and one quiz.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `course_id` | `uuid` FK → `courses.id` cascade | |
| `order_index` | `int` | `>= 0`, unique per `(course_id, order_index)` |
| `title` | `text` | |

RLS: `order_index = 0` of a published course is a public free preview (readable by anyone, including anonymous — matched by the first topic's `topics_select_free_preview` too, see below); enrolled students can read every module of their course; owning teacher/admin has full CRUD. Same shape the old `chapters` table's RLS had, one level up.

## `topics`

Renamed from `chapters` in `20260719050000_restructure_modules_topics.sql`, retargeted from `course_id` to `module_id`, and dropped `is_ai_generated` (topics are always hand-written by the teacher now — AI only drafts the module's quiz, not topic content).

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `module_id` | `uuid` FK → `modules.id` cascade | |
| `order_index` | `int` | `>= 0`, unique per `(module_id, order_index)` — position within the module |
| `title` | `text` | |
| `content` | `text` | plain text — no markdown/HTML rendering yet |

RLS: free preview is the first topic (`order_index = 0`) of the first module (`order_index = 0`) of a published course; enrolled students can read every topic of any module in their course (not gated per-topic — a student who's unlocked a module can freely read all its topics, only the module's quiz gates progress to the next module); owning teacher/admin has full CRUD. Joins go through `topics.module_id → modules.course_id → courses.teacher_id` (one hop deeper than the old `chapters.course_id → courses.teacher_id`).

## `quizzes`

Moved from one-per-chapter to one-per-module in `20260719050000_restructure_modules_topics.sql`. When that migration ran against courses that already had multiple chapters (and therefore multiple chapter-quizzes), it merged each course's existing per-chapter question arrays into a single per-module quiz (concatenated in chapter order) — see the migration file's header comment for the exact heuristic and its one documented limitation around partially-completed enrollments.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `module_id` | `uuid` FK → `modules.id` cascade, **unique** | one quiz per module |
| `questions` | `jsonb` | array of `{ question, options[], correct_index }` |

**Known Phase 1 limitation**: `correct_index` is part of the same jsonb payload the client fetches to render the quiz, so any enrolled student's browser can read the answer key by inspecting network traffic. Grading happens entirely client-side (`src/features/quizzes/components/QuizPlayer.tsx`) against `QUIZ_PASS_THRESHOLD` (70%, `src/lib/constants.ts`). This is an accepted tradeoff for an MVP with no real stakes riding on quiz integrity yet. Before that changes (e.g. paid certificates, leaderboard, anything adversarial), move grading to a Supabase Edge Function that holds the answer key server-side and only returns a pass/fail + score.

RLS: same visibility as the parent module (free-preview module, enrolled student, or owning teacher/admin).

## `topic_audio`

Renamed from `chapter_audio` in `20260719050000_restructure_modules_topics.sql` (`chapter_id` → `topic_id`). Stays content-level (per-topic), not per-module — narration is tied to what's actually being read, and a module can have several topics.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `topic_id` | `uuid` FK → `topics.id` cascade, **unique** | one audio row per topic |
| `segments` | `jsonb` | array of `{ audio_base64, mime_type }` — Sarvam's TTS API caps input length per request, so long content is split into segments and played back in order |
| `language_code` | `text` | e.g. `bn-IN`, `en-IN` — the language the teacher generated this narration in, not inferred from content |
| `generated_at` | `timestamptz` | |

RLS: same visibility as the parent topic (free-preview topic, enrolled student, or owning teacher/admin) — same pattern as `quizzes`, but joined two hops deep (`topic_audio.topic_id → topics.module_id → modules.course_id → courses.teacher_id`).

**Why a separate table instead of a column on `topics`**: every existing `topics` read in the codebase does `select('*')`, and audio segments can be multi-hundred-KB base64 blobs. Bundling that into `topics` would silently bloat every course/topic page load, including ones that never play audio. `topic_audio` is only fetched where actually needed (`useTopicAudio`, called from the topic reader and the teacher's audio panel).

## `enrollments`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `student_id` | `uuid` FK → `users.id` cascade | |
| `course_id` | `uuid` FK → `courses.id` cascade | |
| `unlocked_module_index` | `int` | `>= 0`, defaults `0`; the highest `modules.order_index` this student may currently access. Renamed from `unlocked_chapter_index` in `20260719050000_restructure_modules_topics.sql` — same semantics, now module-granularity instead of chapter-granularity. |
| `enrolled_at` | `timestamptz` | |

Unique on `(student_id, course_id)` — one enrollment row per student per course.

RLS: student sees/creates/updates their own rows only (insert requires the target course to be `published`); teacher/admin can select rows for their own courses (all, for admin).

**Unlock mechanism (Phase 1, client-driven)**: passing a module's quiz calls `supabase.from('enrollments').update({ unlocked_module_index: n+1 })` from `src/pages/ModulePage.tsx`. Like the quiz grading note above, this trusts the authenticated client to report a genuine pass — acceptable for MVP, revisit alongside the Edge Function grading migration. A student reads every topic in an unlocked module freely — topics themselves never gate anything, only the module's quiz does.

## `module_progress`

Renamed from `chapter_progress` in `20260719050000_restructure_modules_topics.sql` (`chapter_id` → `module_id`). For pre-existing enrollments at migration time, a row was only backfilled for students who'd finished every chapter of a course under the old scheme — see the migration file's header comment.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `student_id` | `uuid` FK → `users.id` cascade | |
| `module_id` | `uuid` FK → `modules.id` cascade | |
| `quiz_score` | `numeric(5,2)` | `0–100`, nullable |
| `completed_at` | `timestamptz` | null until a passing attempt is recorded |

Unique on `(student_id, module_id)` — retaking a quiz upserts the same row (see `useModuleProgress.recordAttempt`).

RLS: student sees/inserts/updates their own; teacher/admin can select rows for their own courses (all, for admin). Insert requires the student to be enrolled in the module's course.

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

## AI-assisted quiz generation (Phase 3, restructured)

Course building is always manual now: a teacher names the course, adds modules, and adds hand-written topics inside each module. AI assists at exactly one step — drafting a quiz for a module from its topics' content. This replaced the original Phase 3 flow (paste raw notes → AI drafts a whole course of chapters + quizzes), which is gone along with `courses.raw_notes` and `supabase/functions/generate-course/`.

`supabase/functions/generate-module-quiz/index.ts` is the Supabase Edge Function (Deno) — the only place `GROQ_API_KEY` is used. It must never be called with the key from the browser; the frontend (`src/features/quizzes/hooks/useGenerateModuleQuiz.ts`) calls it via `supabase.functions.invoke`, which forwards the signed-in user's JWT instead.

Provider is Groq (`api.groq.com`, OpenAI-compatible chat completions), not Anthropic — see `PROJECT.md` Section 2 for why. Model defaults to `llama-3.3-70b-versatile`, overridable with a `GROQ_MODEL` secret if that model is deprecated (Groq's lineup changes faster than most providers').

**Auth model**: the function builds a Supabase client from the caller's own JWT (not the service role) and does a plain `select` on `modules`/`topics` — the existing owner/admin RLS policies are what actually enforce "must be this module's course's teacher or an admin." No separate authorization check was written; it would just duplicate what RLS already guarantees.

**Contract**: `POST { moduleId }` → `{ questions: [{ question, options, correct_index }] }`. Nothing is written to the DB inside the function — the frontend (`GenerateQuizPanel` → `TeacherModuleEditorPage`) shows the draft pre-filled into the existing `QuizEditor` for review, and only writes it via the normal `useQuizMutations.saveQuiz` upsert if the teacher clicks "Save quiz." The teacher can edit, add, or remove questions before saving — AI drafts, it doesn't have the final say.

**CORS**: `Deno.serve` doesn't add CORS headers by default, and the browser's preflight `OPTIONS` request will fail silently (shows as a generic "Failed to send a request to the Edge Function" in the Supabase JS client, not a helpful error) without them. Any new Edge Function called from the browser needs the same `CORS_HEADERS` + `OPTIONS` early-return pattern this function uses — copy it rather than rediscovering this.

**Cost guardrail** (`PROJECT.md` Section 9): one Groq call per invocation, the topics' concatenated content capped at 20,000 characters, and every call logs token usage (`console.log` in the function, visible via `supabase functions logs generate-module-quiz`). Groq's free tier has no real dollar cost, but usage is still logged so a runaway loop would show up before hitting rate limits. See `docs/decisions/cost-notes.md`.

**Deployment**: this function is not applied via `supabase/migrations/` — it's deployed separately with `supabase functions deploy generate-module-quiz`, and `GROQ_API_KEY` is set with `supabase secrets set GROQ_API_KEY=...` (dashboard: Edge Functions → generate-module-quiz → Secrets). The GitHub↔Supabase integration deploying migrations does not deploy functions.

## TTS audio ("listen to this course") (Phase 4)

`supabase/functions/generate-topic-audio/index.ts` (renamed from `generate-chapter-audio`) is a second Edge Function, same shape as `generate-module-quiz`: the only place `SARVAM_API_KEY` is used, called via `supabase.functions.invoke` from `src/features/chapters/hooks/useGenerateTopicAudio.ts`, and authorization is the existing topics owner/admin RLS policy re-used through an RLS-respecting client (no separate auth check written).

**Contract**: `POST { topicId, languageCode }` → `{ segments: [{ audio_base64, mime_type }], languageCode }`. Unlike `generate-module-quiz`, this function *does* write to the DB itself (upserts `topic_audio`) rather than leaving that to a frontend review step — there's no meaningful "review before committing" step for audio the way there is for AI-drafted quiz questions, so the extra round trip would just be friction.

**Language is an explicit teacher choice, not inferred from content.** Sarvam's Bulbul model is Bengali-focused; some seed course content is English prose (e.g. "Bangla Grammar Basics" *explains* Bangla grammar in English). Defaulting to Bengali regardless of what's actually on the page would silently produce wrong-language or garbled narration. `GenerateAudioPanel` (`src/features/chapters/components/`) shows a language dropdown (`SUPPORTED_AUDIO_LANGUAGES`) every time.

**Chunking**: Sarvam's TTS API caps input length per request, so topic content is split on sentence boundaries into ≤450-character segments (`chunkText` in the function), capped at `MAX_SEGMENTS = 15` — a topic needing more than that is rejected with a "shorten the topic" error rather than silently firing 30+ paid/rate-limited calls. `AudioPlayer` (`src/features/chapters/components/`) plays segments back-to-back as one continuous listen.

**Verified against Sarvam's live API on first real call (2026-07-19)**: the endpoint/request/response shape (`inputs`/`speaker`/`model` fields, `audios[]` response) was correct on the first try. One thing wasn't: the guessed default speaker `'meera'` doesn't exist — Sarvam's 400 response usefully listed the valid names, and the default is now `'anushka'` (confirmed as Sarvam's documented default voice). `SARVAM_MODEL` and `SARVAM_SPEAKER` stay overridable via secrets in case Sarvam's lineup moves on again.

**Cost guardrail** (`PROJECT.md` Section 9): chunk count is capped, one Sarvam call per segment (no retries), and every generation logs segment count + total characters (`console.log`, visible via `supabase functions logs generate-topic-audio`). See `docs/decisions/cost-notes.md` for the ~৳43–65/course estimate this should stay inside.

**Deployment**: same as `generate-module-quiz` — `supabase functions deploy generate-topic-audio`, and `SARVAM_API_KEY` set with `supabase secrets set SARVAM_API_KEY=...`.

## Admin dashboard (Phase 5)

No new tables — `features/admin/` (`useAdminStats`, `useAllUsers`, `useUpdateUserRole`, `useAdminCourses`) reads through the admin RLS policies that already existed on `users`, `courses`, and `enrollments` since Phase 1. The one real schema/security change Phase 5 needed was the course publish-approval split described in the `courses` section above (`20260719040000_course_publish_approval.sql`) — everything else (user list, role changes, stats) was already fully expressible with existing policies; it just didn't have a UI yet.

`useUpdateUserRole` is the only path to becoming a teacher or admin — there is still no self-service role escalation anywhere in the app, matching `PROJECT.md` Section 3.

Sales/revenue is a placeholder note on `/admin` pointing at Phase 6 — the `sales` table is still schema-only (see the `sales` section above), so there's nothing real to show yet.

## Seed data

`supabase/seed.sql` creates one demo teacher (`teacher.demo@koushol.ai`, local dev only — never run against a production project) and two published courses ("Bangla Grammar Basics", "Intro to Digital Marketing"), each with one module holding its topics and a merged quiz, so the full student flow is clickable immediately after `supabase db reset`.
