# Koushol (কৌশল) — Interactive Learning Platform

**Project Spec & Engineering Rules — v1.9**
Status: 16 of 22 planned phases done · Last updated: 2026-07-27

> This document is the single source of truth for architecture, folder structure, coding
> rules, data model, and roadmap. Any AI agent or developer working on this repo must read
> this file first and follow it strictly. If a decision here needs to change, update this
> file in the same commit — never let the code and this document drift apart.

## Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack-locked-decisions)
3. [User Roles & Permissions](#3-user-roles--permissions)
4. [Folder Structure](#4-folder-structure-strict)
5. [Naming Conventions](#5-naming-conventions)
6. [Documentation Rules](#6-documentation-rules-non-negotiable)
7. [Data Model](#7-data-model-high-level--expanded-in-docsdata-modelmd)
8. [Development Phases / Roadmap](#8-development-phases--roadmap)
9. [Cost Guardrails](#9-cost-guardrails)
10. [Handoff Notes for Claude Code](#10-handoff-notes-for-claude-code)

---

## 1. Project Overview

Koushol is a web-first (mobile-installable) interactive learning platform for Bengali
learners, built career-skills first.

**How learning is structured** — Course → Modules → Topics:
- Students enroll in a course, read every topic in an unlocked module freely (topics don't
  gate each other), then pass that module's quiz to unlock the next one. Progress locks
  sequentially — no skipping ahead. Finishing every module earns a certificate.
- Teachers build courses entirely by hand — name the course, add modules, write topics
  inside each module. AI assists at exactly one step: drafting a quiz for a module from its
  own topics' content, which the teacher reviews and can edit before saving.
- A Master/Admin role has full platform permissions plus an analytics dashboard (sales,
  revenue, student activity, teacher performance, content moderation).

**Key features shipped so far**: bilingual UI (English/Bangla), AI-drafted module quizzes,
TTS narration and optional video per topic, PWA installability, certificates with public
verification, ratings & reviews, a verified-teacher badge, public teacher profiles, an
in-topic AI doubt-solving assistant, course cloning, and a review-moderation queue. See
[§8](#8-development-phases--roadmap) for the full phase-by-phase history.

**Design identity**: dark green (`#0C8A4B`) + gold (`#D4A017`) accents, Space Grotesk
(display) + Inter (body) fonts. See `docs/design-system.md` — do not invent a new palette
without updating that file.

**Standing decisions**:
- **Content direction** (2026-07-19): career/professional skills (HR, IT, marketing,
  finance — workplace skill-building for working adults), not academic/language learning.
  The Phase 1 seed data ("Bangla Grammar Basics") predates this and is test fixture content
  only, not a template for real courses.
- **Pricing**: flexible per-course (teachers set their own price) — explicitly not moving
  to a flat platform-wide price (confirmed 2026-07-19).

---

## 2. Tech Stack (locked decisions)

| Layer | Choice | Notes |
|---|---|---|
| Frontend | React + Tailwind (Vite, TypeScript) | Web-first, installable PWA (Phase 7) |
| Icons | [lucide-react](https://lucide.dev) | Added during the UI/UX redesign — the `ui-ux-pro-max` skill's pre-delivery checklist flags emoji-as-icons as unprofessional; Lucide is its recommended SVG icon set |
| Backend / DB / Auth | Supabase (Postgres) | Free tier to start |
| AI-assisted quiz generation | Groq API (Llama 3.3 70B, model configurable via `GROQ_MODEL` secret) | Phase 3, restructured 2026-07-19: drafts a quiz for a module from its topics' content (originally a whole-course generator, removed in the Module/Topic restructure). Switched from the originally-planned Claude API — teacher wanted a free tier first. Edge Function (`supabase/functions/generate-module-quiz/`) talks to Groq's OpenAI-compatible endpoint directly (no SDK). Swapping back to Claude later is a contained change — update this row in the same commit if that happens. |
| AI doubt-solving assistant | Groq API (same model) | Phase 19. First *conversational* Groq use — `supabase/functions/ask-topic-doubt/`, server-enforced per-topic message cap (see [§8 → Phase 19](#8-development-phases--roadmap)). |
| TTS | Sarvam AI (Bulbul, speaker `anushka` by default, model configurable via `SARVAM_MODEL` secret) | Phase 4. Language is an explicit per-generation teacher choice, not hardcoded to Bengali — see `docs/data-model.md` § TTS audio. |
| File storage | Supabase Storage | Phase 14. Private buckets only, RLS mirroring the same free-preview/enrolled/owner-admin visibility every other topic-scoped table uses — never a public bucket, which would bypass RLS entirely. |
| PDF generation | `jspdf` | Phase 9. Client-side, dynamically imported so its ~400KB isn't in the main bundle. |
| PWA | `vite-plugin-pwa` (Workbox) | Phase 7. Build-time only — generates the manifest + service worker, precaches just the app shell (never Supabase API responses, which are cross-origin anyway). |
| Payments | bKash / Nagad / SSLCommerz | Phase 6 (not started — needs real merchant/sandbox credentials), no monthly fee, %-based |
| Hosting | Self-hosted VPS, GitHub Actions self-hosted runner, Cloudflare Tunnel | Auto-deploys on merge to `main` — see `deploy/README.md` |
| Domain | `koushol.xyz` | — |
| Routing | React Router v7 | Client-side routing for the SPA |

Do not introduce a new framework, database, or third-party service without adding it to this
table first and stating the reason.

---

## 3. User Roles & Permissions

| Capability | Student | Teacher | Master/Admin |
|---|:---:|:---:|:---:|
| Browse & enroll in courses | ✅ | ✅ | ✅ |
| View modules/topics / take quizzes | ✅ | ✅ | ✅ |
| Earn certificates | ✅ | — | — |
| Create/edit own courses (modules, topics) | ❌ | ✅ | ✅ |
| Trigger AI quiz generation for a module | ❌ | ✅ own | ✅ any |
| Publish/unpublish a course | ❌ | ✅ own, needs approval | ✅ |
| View own student list & progress | ❌ | ✅ own only | ✅ all |
| View sales/revenue analytics | ❌ | ✅ own only | ✅ platform-wide |
| Report a review / manage the moderation queue | ✅ report | ✅ report | ✅ resolve |
| Manage users / change roles / verified badges | ❌ | ❌ | ✅ |

Permission checks must be enforced both in Supabase Row Level Security (RLS) policies **and**
in frontend route guards. Frontend-only checks are never sufficient — treat them as UX
convenience, not security. Every table in `supabase/migrations/` enforces this at the DB
layer; `src/features/auth/components/RequireAuth.tsx` is the (non-authoritative) frontend guard.

New accounts self-signing-up always get `role = 'student'` (see the `handle_new_auth_user`
trigger in `supabase/migrations/20260719010000_create_users.sql`). Promoting someone to
teacher/admin is an admin-only action — there is no self-service path. As of Phase 10, this
is also enforced at the DB layer: a `BEFORE UPDATE` trigger (`protect_privileged_columns`)
silently reverts any non-admin attempt to change `role` or `is_verified_teacher` directly.

---

## 4. Folder Structure (strict)

```
Koushol.ai/
├── PROJECT.md                    ← this file
├── deploy/                       ← VPS deploy scripts + setup guide (self-hosted runner pipeline)
├── public/                       ← static files served as-is (favicon, manifest icons, robots.txt, sitemap.xml)
├── docs/
│   ├── design-system.md
│   ├── data-model.md
│   └── decisions/
│       └── cost-notes.md
├── supabase/
│   ├── migrations/                ← one file per schema change, timestamped
│   ├── functions/                 ← Edge Functions (Deno) — anything needing a secret
│   │   ├── generate-module-quiz/  ← Groq: drafts a module's quiz from its topics (Phase 3)
│   │   ├── generate-topic-audio/  ← Sarvam AI TTS call (Phase 4)
│   │   └── ask-topic-doubt/       ← Groq: conversational in-topic Q&A (Phase 19)
│   └── seed.sql                   ← local dev sample data only, never run on prod
└── src/
    ├── app/                        ← root App.tsx, Layout.tsx, providers/
    │   └── providers/
    ├── components/
    │   └── ui/                    ← generic, business-logic-free primitives
    ├── features/                  ← one folder per domain
    │   ├── auth/
    │   ├── courses/                ← courses, modules, cloning
    │   ├── chapters/                ← topics: reading, media, authoring (folder name predates the Module/Topic restructure)
    │   ├── quizzes/
    │   ├── enrollment/
    │   ├── certificates/            ← Phase 9
    │   ├── reviews/                 ← Phase 10
    │   ├── verification/            ← Phase 10/17: verified badge, teacher profile bio
    │   ├── notes/                   ← Phase 11: private per-topic notes
    │   ├── doubts/                  ← Phase 19: AI doubt-solving chat
    │   ├── onboarding/              ← Phase 21
    │   └── admin/                  ← platform-wide, admin-only (Phase 5+)
    ├── pages/                      ← one file per route, matches the URL it renders
    ├── lib/                        ← supabase client, constants, utils
    ├── i18n/                       ← react-i18next config + locales/en.json, locales/bn.json (Phase 8)
    ├── types/                      ← shared TS types (database row shapes)
    └── styles/                     ← global.css (Tailwind + design tokens)
```

**Rules**:
- No file lives directly in `src/` — everything belongs in a subfolder above.
- A component goes in `components/ui/` only if it has zero knowledge of Koushol's business
  logic (it could be copy-pasted into a different app unchanged). Otherwise it goes in
  `features/<domain>/components/`.
- Every top-level folder under `src/` gets a short `README.md` explaining what belongs there
  and what doesn't, once it has 3+ files in it. Every `features/<domain>/` folder gets its
  own README regardless of size.
- Any new Supabase table (or Storage bucket) requires a migration file in
  `supabase/migrations/` — never edit the schema directly through the dashboard for anything
  beyond local prototyping.

---

## 5. Naming Conventions

- Components: `PascalCase.tsx` (e.g. `CourseCard.tsx`)
- Hooks: `useCamelCase.ts` (e.g. `useEnrollment.ts`)
- Utils/lib functions: `camelCase.ts`
- Supabase tables: `snake_case`, plural (e.g. `modules`, `topics`, see [§7](#7-data-model-high-level--expanded-in-docsdata-modelmd))
- Supabase columns: `snake_case`
- Route/page files: match the URL path they render

---

## 6. Documentation Rules (non-negotiable)

- Every exported function/component gets a one-line doc comment stating what it does and why
  it exists — not a restatement of its name.
- Every Supabase migration file starts with a comment block: what changed, why, and what it
  depends on.
- Every new feature folder gets a `README.md` before the PR is considered done.
- `PROJECT.md` (this file) must be updated in the same commit whenever: a new tech choice is
  made, a folder structure rule changes, or a role/permission changes.
- No PR/commit silently changes the data model — it must be reflected in `docs/data-model.md`.

---

## 7. Data Model (high level — expanded in `docs/data-model.md`)

| Table | Columns | Notes |
|---|---|---|
| `users` | id, role, name, email, created_at, bio, is_verified_teacher | `role`/`is_verified_teacher` are trigger-protected (see [§3](#3-user-roles--permissions)) |
| `courses` | id, teacher_id, title, description, status, price, category, created_at | |
| `modules` | id, course_id, order_index, title | |
| `topics` | id, module_id, order_index, title, content, video_path | `video_path` → Phase 14 |
| `quizzes` | id, module_id, questions (jsonb) | one quiz per module |
| `enrollments` | id, student_id, course_id, unlocked_module_index, enrolled_at | |
| `module_progress` | id, student_id, module_id, quiz_score, completed_at | |
| `certificates` | id, student_id, course_id, issued_at | Phase 9 issuance + public verification |
| `course_reviews` | id, student_id, course_id, rating, comment, flagged_at, flag_reason, created_at | Phase 10 + 16 moderation |
| `topic_notes` | id, student_id, topic_id, content, updated_at | Phase 11, private |
| `topic_chat_messages` | id, student_id, topic_id, role, content, created_at | Phase 19, private |
| `sales` | id, course_id, student_id, amount, payment_provider, status, created_at | schema-only until Phase 6 |
| `topic-videos` (Storage bucket) | private, path `{topic_id}/{filename}` | Phase 14 |

All tables get RLS enabled from the first migration — never ship a table without a policy,
even in prototyping. See `supabase/migrations/` for the exact policies. Several tables use a
narrow `security definer` RPC instead of a blanket public grant when public read access is
needed (`verify_certificate`, `get_teacher_badge`, `flag_review`) — see `docs/data-model.md`
for why a plain public SELECT policy would leak more than intended.

---

## 8. Development Phases / Roadmap

**16 of 22 planned phases are done** (10 fully, 6 partially with the remainder explicitly
deferred and noted below). Everything still `Planned` is blocked on something outside this
repo — a real payment/email provider account, or a dependency on another unstarted phase.

| # | Phase | Status |
|---|---|:---:|
| 1 | Student flow: browse, enroll, modules/topics, quiz, Supabase auth+DB | ✅ Done |
| 2 | Teacher flow: create/edit courses, publish, own-course analytics | ✅ Done |
| 3 | AI-assisted quiz generation (Groq) | ✅ Done |
| 4 | TTS audio player (Sarvam AI) | ✅ Done |
| 5 | Master/Admin dashboard | ✅ Done |
| 6 | Payment integration (bKash/Nagad/SSLCommerz) | ⏳ Planned — needs merchant credentials |
| 7 | PWA packaging + mobile installability | ✅ Done |
| 8 | Full bilingual UI (English/Bangla) | ✅ Done |
| 9 | Certificates: issuance, PDF download, public verification | ✅ Done |
| 10 | Course discovery & trust: search/filter, reviews, verified badge, SEO | ✅ Done |
| 11 | Student engagement: private per-topic notes | 🟡 Partial — see notes |
| 12 | Notifications (email/push) | ⏳ Planned — needs an email service account |
| 13 | Teacher tools: deep analytics, prerequisites, versioning, messaging, payouts | ⏳ Planned |
| 14 | Content richness: video support per topic | 🟡 Partial — see notes |
| 15 | Monetization extras (coupons, bundles, B2B) | ⏳ Planned — depends on Phase 6 |
| 16 | Admin: content moderation queue | ✅ Done |
| 17 | Growth & sharing: teacher profile page, certificate sharing | 🟡 Partial — see notes |
| 18 | Quiz enhancements: timed quizzes, attempt history, randomized order | ⏳ Planned |
| 19 | AI doubt-solving assistant | ✅ Done |
| 20 | Alternate business models (subscriptions) | ⏳ Planned — depends on Phase 6 |
| 21 | Onboarding: student tour, teacher checklist | ✅ Done |
| 22 | Teacher productivity: course cloning/templates | ✅ Done |

Cross-cutting, not numbered as a phase: **UI/UX redesign** (2026-07-19, using the
`ui-ux-pro-max` skill) — ✅ done across all five sub-phases (foundation, public pages,
student flow, teacher flow, admin flow), verified visually via Playwright at each step. See
`docs/design-system.md`.

Do not start a later phase's UI/logic before the current phase is functionally complete and
reflected as "done" in this table.

### Phase notes

Full rationale for every phase, including what was deliberately deferred and why. Click a
phase to expand.

<details>
<summary><strong>Phase 1</strong> — Student flow</summary>

Done — migrations + seed applied to the live Supabase project, verified end-to-end locally
(signup, browse, enroll, read, quiz, unlock) on 2026-07-19.
</details>

<details>
<summary><strong>Phase 2</strong> — Teacher flow</summary>

Done — verified end-to-end on 2026-07-19 (create → module → topic → quiz → publish → shows
in student catalog → delete).
</details>

<details>
<summary><strong>Phase 3</strong> — AI-assisted quiz generation</summary>

Done, restructured 2026-07-19 — teacher builds modules/topics by hand, AI drafts a quiz per
module from its topics on request, teacher reviews/edits before saving. Replaced the
original whole-course "raw notes → chapters + quizzes" generator. See `docs/data-model.md`
§ AI-assisted quiz generation.
</details>

<details>
<summary><strong>Phase 4</strong> — TTS audio player</summary>

Done — deployed and verified end-to-end on 2026-07-19 (teacher generates audio with an
explicit language choice → real WAV audio confirmed in DB → plays back on the
student-facing topic page). One live-API guess was wrong and fixed on first real call
(default speaker name) — see `docs/data-model.md` § TTS audio.
</details>

<details>
<summary><strong>Phase 5</strong> — Master/Admin dashboard</summary>

Done — deployed and verified end-to-end on 2026-07-19 (teacher submits for review →
direct-API publish attempt genuinely rejected by RLS, not just hidden by UI → admin
approves via `/admin/courses` → status confirmed `published` in DB → course appears in the
student catalog). Also resolves the Phase 2 self-service-publish simplification noted in
`docs/data-model.md`. Sales/revenue is a placeholder pointing at Phase 6, since the `sales`
table has no real data yet.
</details>

<details>
<summary><strong>Phase 6</strong> — Payment integration</summary>

Planned. Blocked on real bKash/Nagad/SSLCommerz merchant or sandbox credentials — not
something buildable without an account from the project owner.
</details>

<details>
<summary><strong>Phase 7</strong> — PWA packaging</summary>

Done, 2026-07-24 — `vite-plugin-pwa` (Workbox `generateSW`), `registerType: 'autoUpdate'` so
returning visitors pick up new deploys automatically rather than being pinned to a stale
cached bundle. Precaches only the built app shell (JS/CSS/HTML/icons) — Supabase API calls
are cross-origin and untouched, so cached course data is never stale.

**Known gap**: icons are SVG-only (`public/icon.svg`); Chrome/Edge/Android install flows
support that directly, but iOS's separate "Add to Home Screen" `apple-touch-icon` mechanism
generally wants a real PNG, which this repo doesn't have yet — flagged in `index.html` and
`vite.config.ts` rather than silently shipped as "done" for iOS.

Verified via `npm run build` (confirmed `dist/manifest.webmanifest`, `dist/sw.js`, and the
auto-injected `<link rel="manifest">` + register-SW script in `dist/index.html`), `tsc -b`,
`npm run lint`.
</details>

<details>
<summary><strong>Phase 8</strong> — Full bilingual UI</summary>

Done, 2026-07-19 — `react-i18next` infrastructure (default Bangla, EN/বাং switcher in nav,
choice persisted via localStorage, `<html lang>` kept in sync) plus every page's static UI
chrome translated phase by phase (public → student → teacher → admin), same pattern as the
UI/UX redesign. Dynamic/user-generated DB content (course/chapter/quiz content) is
intentionally left untranslated — out of scope. Backend/Supabase error messages (login
errors, RLS rejections) are staying in English for now — a separate follow-up, not part of
this pass. Verified via `tsc -b`, `npm run build`, and `npm run lint`. See
`docs/design-system.md` § Language.
</details>

<details>
<summary><strong>Phase 9</strong> — Certificates</summary>

Done — `src/features/certificates/`. Student self-issues via a new RLS `INSERT` policy that
checks `unlocked_module_index` covers every module (DB-enforced, not just trusted
client-side); PDF generated client-side with `jspdf` (dynamically imported so its ~400KB
isn't in the main bundle); public verification calls a `security definer` RPC
(`verify_certificate`) rather than a blanket table grant, so an anonymous visitor can only
look up one certificate by id, not dump the table. See
`supabase/migrations/20260721000000_certificate_issuance.sql`. Verified via `tsc -b`,
`npm run build`, `npm run lint`.
</details>

<details>
<summary><strong>Phase 10</strong> — Course discovery & trust</summary>

Done — `src/features/reviews/`, `src/features/verification/`. Reviews/badge use narrow
`security definer` RPCs / RLS rather than blanket public grants (same pattern as Phase 9's
certificate verification). Also fixed a latent Phase 1 gap while adding the verified-badge
column: `users_update_own`'s `WITH CHECK` had no column-level restriction, so a signed-in
user could previously self-elevate `role` via a direct API call — a new `BEFORE UPDATE`
trigger now reverts any non-admin attempt to change `role` or `is_verified_teacher`. "Notify
me" waitlist deferred to Phase 17 — it needs a public teacher-profile page as its entry
point, which didn't exist yet at the time. See
`supabase/migrations/20260722000000_discovery_and_trust.sql`. Verified via `tsc -b`,
`npm run build`, `npm run lint`.
</details>

<details>
<summary><strong>Phase 11</strong> — Student engagement (partial)</summary>

Done (partial), 2026-07-24 — `src/features/notes/`. Private per-student notes on
`ModulePage`, own-row-only RLS (no teacher/admin visibility — a private study aid, not a
public/moderated feature).

**Deferred, not part of this pass** (scoped down at the user's request): discussion Q&A per
module/topic, progress streaks & badges, course/platform leaderboard, practice/retake mode,
study-time tracking — these will get their own pass(es) later, likely split further given
their differing complexity.

See `supabase/migrations/20260724000000_topic_notes.sql`. Verified via `tsc -b`,
`npm run build`, `npm run lint`.
</details>

<details>
<summary><strong>Phase 12</strong> — Notifications</summary>

Planned. Blocked on an email/push service account (e.g. Resend/SendGrid) — not something
buildable without credentials from the project owner.
</details>

<details>
<summary><strong>Phase 13</strong> — Teacher tools</summary>

Planned. Deeper analytics (per-module drop-off/engagement, not just completion count + avg
score), course prerequisites ("finish course A before enrolling in B"), draft-vs-published
content versioning (edit a published course without affecting enrolled students until
republished), in-app student↔teacher messaging, payout/earnings dashboard. The payout piece
depends on Phase 6; versioning is architecturally the most involved item left in the backlog.
</details>

<details>
<summary><strong>Phase 14</strong> — Content richness (partial)</summary>

Done (partial), 2026-07-26 — private Supabase Storage bucket `topic-videos`, RLS on
`storage.objects` mirroring `topic_audio`'s exact free-preview/enrolled/owner-admin
visibility (path convention `{topic_id}/{filename}`, extracted via
`(storage.foldername(name))[1]::uuid`). Teacher uploads directly from the browser under
their own JWT (RLS-gated, no Edge Function); playback resolves a short-lived signed URL
since the bucket is private. `src/features/chapters/hooks/useTopicVideo.ts`,
`VideoPanel.tsx` (teacher), `TopicVideoPlayer.tsx` (student).

**Deferred, not part of this pass**: downloadable resources/attachments, bulk topic import,
offline access (all originally bundled in this phase — video was the highest-value, most
contained slice).

See `supabase/migrations/20260726000000_topic_video.sql`. Verified via `tsc -b`,
`npm run build`, `npm run lint`.
</details>

<details>
<summary><strong>Phase 15</strong> — Monetization extras</summary>

Planned. Coupon/discount codes, course bundles / multi-course learning paths, corporate/B2B
bulk seat purchasing — all depend on Phase 6's base payment integration existing first.
</details>

<details>
<summary><strong>Phase 16</strong> — Admin: content moderation queue</summary>

Done, 2026-07-25 — any signed-in visitor can report a review (`ReviewList`'s inline
"Report" control) via a new `flag_review` security-definer RPC (narrow, can't be abused to
edit someone else's review — same pattern as `verify_certificate`/`get_teacher_badge`).
Admin queue at `/admin/moderation` (`AdminModerationPage`) can dismiss a flag or delete the
review. Scoped to reviews only — Phase 11's discussion Q&A was deferred and doesn't exist
yet. See `supabase/migrations/20260725000000_review_moderation.sql`. Verified via `tsc -b`,
`npm run build`, `npm run lint`.
</details>

<details>
<summary><strong>Phase 17</strong> — Growth & sharing (partial)</summary>

Done (partial), 2026-07-23 — `/teachers/:teacherId` (`src/pages/TeacherProfilePage.tsx`)
shows a teacher's name, bio, verified badge, and published courses; teachers edit their own
bio from `/teach`. Certificate download now also offers a "Share on LinkedIn" button
pointing at the public `/verify/:id` page.

**Deferred, not part of this pass**: referral program (needs Phase 6 payments first — a
"credit" means nothing without a real payment/discount ledger) and course preview/trailer
(needs Phase 14's video support, since done — could be revisited). The waitlist entry point
Phase 10 needed can now be picked up, since this page exists.

See `supabase/migrations/20260723000000_teacher_profile.sql`. Verified via `tsc -b`,
`npm run build`, `npm run lint`.
</details>

<details>
<summary><strong>Phase 18</strong> — Quiz enhancements</summary>

Planned. Timed quiz option, full quiz attempt history (not just the latest attempt),
randomized question order per attempt.
</details>

<details>
<summary><strong>Phase 19</strong> — AI doubt-solving assistant</summary>

Done, 2026-07-27 — `supabase/functions/ask-topic-doubt/`, `src/features/doubts/`. First
conversational AI feature (every earlier one is one-shot and self-limiting), so it needed a
guardrail one-shot features didn't: `MAX_MESSAGES_PER_TOPIC` caps total messages per student
per topic (server-enforced in the Edge Function, not just client-side), on top of the usual
per-call token/context caps. Answers are scoped to the topic's own content via the system
prompt. Enrolled students only — unlike reading content, this costs a real Groq call per
message, so it's not offered to free-preview signed-out visitors. Reuses the already-set
`GROQ_API_KEY` secret from Phase 3, no new secret needed. See
`supabase/migrations/20260727000000_topic_doubt_chat.sql`. Migration applied and Edge
Function deployed to the live project. Verified via `tsc -b`, `npm run build`,
`npm run lint`.
</details>

<details>
<summary><strong>Phase 20</strong> — Alternate business models</summary>

Planned. Monthly all-course subscription alongside per-course purchase, time-limited course
access windows — both depend on Phase 6.
</details>

<details>
<summary><strong>Phase 21</strong> — Onboarding</summary>

Done — `src/features/onboarding/`. Student tour is a one-time modal sequence on first
`/dashboard` visit (localStorage-dismissed). Teacher checklist on `/teach` derives its steps
live from real course/module/topic/quiz data (no new table), auto-hides once every step is
done. Verified via `tsc -b`, `npm run build`, `npm run lint`.
</details>

<details>
<summary><strong>Phase 22</strong> — Teacher productivity: course cloning</summary>

Done — `src/features/courses/hooks/useCloneCourse.ts`, wired into a "Clone" action on
`/teach`. Pure app-level inserts under the teacher's own account, no new schema/RLS —
"create your own course/module/topic/quiz" is already exactly what the existing owner-only
insert policies allow. Deliberately doesn't copy enrollments, progress, reviews,
certificates, or topic_audio. New course is created as `draft` with title
`"Copy of {original}"`. Verified via `tsc -b`, `npm run build`, `npm run lint`.
</details>

---

## 9. Cost Guardrails

Any code that calls a paid API (Groq, Sarvam AI, Supabase Pro features) must:
- Log estimated cost per call in a comment or console log during development.
- Never run in an uncapped loop (e.g. auto-regenerating AI content on every keystroke).
- Respect the budget ranges documented in `docs/decisions/cost-notes.md`: AI quiz gen $0 on
  Groq's free tier for now, TTS ~৳43–65/course.
- **Run server-side, in a Supabase Edge Function (`supabase/functions/`), never in browser
  code.** A paid API's key is a secret; anything shipped to the client (including Vite env
  vars prefixed `VITE_`) is readable by anyone who opens dev tools. See
  `supabase/functions/generate-module-quiz/` for the pattern: the frontend calls
  `supabase.functions.invoke(...)`, which forwards the user's own JWT so the function can
  re-use existing RLS policies for authorization instead of duplicating them.
- **Conversational features need an extra guardrail one-shot features don't**: Phase 19's
  `ask-topic-doubt` caps total messages per student per topic server-side
  (`MAX_MESSAGES_PER_TOPIC`), since a chat interface invites repeat use in a way a
  once-per-module quiz-generation button doesn't.

No paid API was called in Phase 1 or 2 — this section became load-bearing starting Phase 3.

---

## 10. Handoff Notes for Claude Code

Read this file, then `docs/design-system.md` and `docs/data-model.md`, before writing any code.

**Resolved decisions** (previously open):
- **Quiz-passing threshold: 70%** — `QUIZ_PASS_THRESHOLD` in `src/lib/constants.ts`.
- **Topic preview access**: the first topic (`order_index` 0) of the first module
  (`order_index` 0) of any published course is a free public preview; the rest require
  enrollment. Enforced in RLS (`topics_select_free_preview` policy) and mirrored in the UI.
- **Phase 1 content source**: SQL seed migration (`supabase/seed.sql`) with two sample
  courses, so the student flow is testable end to end without a teacher UI.
- **Live-DB migrations go through the Supabase CLI** (`supabase db push --linked`), always
  with a `--dry-run` first. Every migration in this repo has been applied to and verified
  against the live project, not just written and left untested.
- **Deploy is CI-driven**: pushing to `main` triggers a self-hosted GitHub Actions runner
  (see `deploy/README.md`) that builds and atomically swaps the live release — work happens
  on `dev`, gets reviewed via PR, then merged.

**Still not decided** — ask before building: certificate visual redesign (functionally done
since Phase 9, but the current PDF layout is plain, not custom-branded).

**Legal pages** (`/terms`, `/privacy`, added 2026-07-19) **are drafts, not reviewed by a
lawyer.** They're grounded in what the code actually does (verified against the real data
model and Edge Functions, not generic filler) and carry a visible on-page disclaimer, but do
not treat them as final legal protection — get them reviewed before real users/payments
depend on them. Update both in the same commit whenever a new third-party processor is added
(see [§2](#2-tech-stack-locked-decisions)) or Phase 6 payments ships.

**`public/sitemap.xml` only lists static routes** (`/`, `/courses`, `/terms`, `/privacy`) —
individual course pages aren't included because Koushol is a client-side-only SPA with no
server rendering, so there's no request-time hook to enumerate published courses into a
sitemap. Revisit if/when server rendering lands.

Keep commits scoped to one phase-item at a time; do not bundle unrelated changes.
