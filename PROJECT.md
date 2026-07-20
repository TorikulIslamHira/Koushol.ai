# Koushol — Interactive Learning Platform

Project Spec & Engineering Rules — v1.8
Status: Phases 1-5 done — see Section 8
Last updated: 2026-07-19

This document is the single source of truth for architecture, folder structure, coding rules, data model, and roadmap. Any AI agent or developer working on this repo must read this file first and follow it strictly. If a decision here needs to change, update this file in the same commit — never let the code and this document drift apart.

## 1. Project Overview

Koushol is a web-first (mobile-installable later) interactive learning platform.

Students enroll in courses, structured as **Course → Modules → Topics**: they read every topic in an unlocked module freely, then take that module's quiz to unlock the next module (progress locks sequentially), and earn certificates.

Teachers build courses by hand — name the course, add modules, add hand-written topics inside each module — then an AI engine drafts a quiz for a module from its topics' content, which the teacher reviews and can edit before saving.

A Master/Admin role has full permissions plus an analytics dashboard (sales, revenue, student activity, teacher performance).

An optional TTS ("listen to this course") audio player will be added later using Sarvam AI (Bengali-capable TTS).

Design identity: dark green (#0C8A4B) + gold (#D4A017) accents, Space Grotesk (display) + Inter (body) fonts. See `docs/design-system.md` — do not invent a new palette without updating that file.

**Content direction (decided 2026-07-19)**: course content focuses on **career/professional skills** (e.g. HR, IT, marketing, finance — workplace skill-building for working adults), not academic/language learning. The Phase 1 seed data ("Bangla Grammar Basics") predates this decision and is test fixture content only, not a template for real courses going forward.

**Pricing stays flexible per-course** (teachers set their own price, as already built) — explicitly not moving to a flat platform-wide price, confirmed 2026-07-19.

## 2. Tech Stack (locked decisions)

| Layer | Choice | Notes |
|---|---|---|
| Frontend | React + Tailwind (Vite, TypeScript) | Web-first, installable PWA later |
| Icons | [lucide-react](https://lucide.dev) | Added during the UI/UX redesign (started 2026-07-19) — the `ui-ux-pro-max` skill's pre-delivery checklist flags emoji-as-icons (🔒, ↑↓, ✕) as unprofessional; Lucide is its recommended SVG icon set |
| Backend / DB / Auth | Supabase (Postgres) | Already connected; free tier to start |
| AI-assisted quiz generation | Groq API (Llama 3.3 70B, model configurable via `GROQ_MODEL` secret) | Phase 3, restructured 2026-07-19: AI now drafts a quiz for a module from its topics' content (was originally a whole-course "raw notes → chapters + quizzes" generator, removed in the Module/Topic restructure). Switched from the originally-planned Claude API on 2026-07-19 — teacher wanted to test on a free tier before committing to a paid provider. Groq's chat-completions API is OpenAI-compatible; the Edge Function (`supabase/functions/generate-module-quiz/`) is written against it directly (no SDK). Swapping back to Claude later is a contained change (endpoint + request/response shape) — update this row in the same commit if that happens. |
| TTS | Sarvam AI (Bulbul, speaker `anushka` by default, model configurable via `SARVAM_MODEL` secret) | Phase 4. Language is an explicit per-generation teacher choice, not hardcoded to Bengali — see `docs/data-model.md` § TTS audio. |
| Payments | bKash / Nagad / SSLCommerz | Phase 6, no monthly fee, %-based |
| Hosting | Vercel or Netlify | Free tier to start |
| Domain | Already purchased | — |
| Routing | React Router v7 | Client-side routing for the SPA |
| PWA | `vite-plugin-pwa` (Workbox) | Phase 7. Build-time only — generates the manifest + service worker, precaches just the app shell (never Supabase API responses, which are cross-origin anyway). |

Do not introduce a new framework, database, or third-party service without adding it to this table first and stating the reason.

## 3. User Roles & Permissions

| Capability | Student | Teacher | Master/Admin |
|---|---|---|---|
| Browse & enroll in courses | ✅ | ✅ | ✅ |
| View modules/topics / take quizzes | ✅ | ✅ | ✅ |
| Earn certificates | ✅ | — | — |
| Create/edit own courses (modules, topics) | ❌ | ✅ | ✅ |
| Trigger AI quiz generation for a module | ❌ | ✅ (own courses) | ✅ (any course) |
| Publish/unpublish a course | ❌ | ✅ (own, needs admin approval) | ✅ |
| View own student list & progress | ❌ | ✅ (own courses only) | ✅ (all) |
| View sales/revenue analytics | ❌ | ✅ (own courses only) | ✅ (platform-wide) |
| Manage users / change roles | ❌ | ❌ | ✅ |
| Access system settings | ❌ | ❌ | ✅ |

Permission checks must be enforced both in Supabase Row Level Security (RLS) policies and in frontend route guards. Frontend-only checks are never sufficient — treat them as UX convenience, not security. Every table in `supabase/migrations/` enforces this at the DB layer; `src/features/auth/components/RequireAuth.tsx` is the (non-authoritative) frontend guard.

New accounts self-signing-up always get `role = 'student'` (see the `handle_new_auth_user` trigger in `supabase/migrations/20260719010000_create_users.sql`). Promoting someone to teacher/admin is an admin-only action — there is no self-service path, matching the table above.

## 4. Folder Structure (strict)

```
Koushol.ai/
├── PROJECT.md                    ← this file
├── public/                        ← static files served as-is (favicon, robots.txt, sitemap.xml)
├── docs/
│   ├── design-system.md
│   ├── data-model.md
│   └── decisions/
│       └── cost-notes.md
├── supabase/
│   ├── migrations/                ← one file per schema change, timestamped
│   ├── functions/                 ← Edge Functions (Deno) — anything needing a secret
│   │   ├── generate-module-quiz/  ← Groq API call, drafts a module's quiz from its topics (Phase 3)
│   │   └── generate-topic-audio/  ← Sarvam AI TTS call (Phase 4)
│   └── seed.sql                   ← local dev sample data only, never run on prod
└── src/
    ├── app/                        ← root App.tsx, Layout.tsx, providers/
    │   └── providers/
    ├── components/
    │   └── ui/                    ← generic, business-logic-free primitives
    ├── features/                  ← one folder per domain
    │   ├── auth/
    │   │   ├── components/
    │   │   └── hooks/
    │   ├── courses/
    │   │   ├── components/
    │   │   └── hooks/
    │   ├── chapters/
    │   │   ├── components/
    │   │   └── hooks/
    │   ├── quizzes/
    │   │   ├── components/
    │   │   └── hooks/
    │   ├── enrollment/
    │   │   ├── components/
    │   │   └── hooks/
    │   └── admin/                  ← platform-wide, admin-only (Phase 5) — no components/ yet
    │       └── hooks/
    ├── pages/                      ← one file per route, matches the URL it renders
    ├── lib/                        ← supabase client, constants, utils
    ├── i18n/                       ← react-i18next config + locales/en.json, locales/bn.json (Phase 8)
    ├── types/                      ← shared TS types (database row shapes)
    └── styles/                     ← global.css (Tailwind + design tokens)
```

Rules:
- No file lives directly in `src/` — everything belongs in a subfolder above.
- A component goes in `components/ui/` only if it has zero knowledge of Koushol's business logic (it could be copy-pasted into a different app unchanged). Otherwise it goes in `features/<domain>/components/`.
- Every top-level folder under `src/` gets a short `README.md` explaining what belongs there and what doesn't, once it has 3+ files in it. Every `features/<domain>/` folder gets its own README regardless of size.
- Any new Supabase table requires a migration file in `supabase/migrations/` — never edit the schema directly through the dashboard for anything beyond local prototyping.

## 5. Naming Conventions

- Components: `PascalCase.tsx` (e.g. `CourseCard.tsx`)
- Hooks: `useCamelCase.ts` (e.g. `useEnrollment.ts`)
- Utils/lib functions: `camelCase.ts`
- Supabase tables: `snake_case`, plural (e.g. `modules`, `topics`, see Section 7)
- Supabase columns: `snake_case`
- Route/page files: match the URL path they render

## 6. Documentation Rules (non-negotiable)

- Every exported function/component gets a one-line doc comment stating what it does and why it exists — not a restatement of its name.
- Every Supabase migration file starts with a comment block: what changed, why, and what it depends on.
- Every new feature folder gets a `README.md` before the PR is considered done.
- `PROJECT.md` (this file) must be updated in the same commit whenever: a new tech choice is made, a folder structure rule changes, or a role/permission changes.
- No PR/commit merges silently changes the data model — it must be reflected in `docs/data-model.md`.

## 7. Data Model (high level — expanded in `docs/data-model.md`)

- `users` (id, role: student/teacher/admin, name, email, created_at)
- `courses` (id, teacher_id, title, description, status: draft/published, price, created_at)
- `modules` (id, course_id, order_index, title)
- `topics` (id, module_id, order_index, title, content)
- `quizzes` (id, module_id, questions jsonb) — one quiz per module
- `enrollments` (id, student_id, course_id, unlocked_module_index, enrolled_at)
- `module_progress` (id, student_id, module_id, quiz_score, completed_at)
- `certificates` (id, student_id, course_id, issued_at)
- `sales` (id, course_id, student_id, amount, payment_provider, status, created_at)

All tables get RLS enabled from the first migration — never ship a table without a policy, even in prototyping. See `supabase/migrations/` for the exact policies (every table already has them, including `certificates` and `sales`, which are schema-only placeholders until Phases 5–6).

## 8. Development Phases / Roadmap

| Phase | Scope | Status |
|---|---|---|
| 1 | Student flow: browse, enroll, modules/topics, quiz, manual course content, Supabase auth+DB | ✅ Done — migrations + seed applied to the live Supabase project, verified end-to-end locally (signup, browse, enroll, read, quiz, unlock) on 2026-07-19 |
| 2 | Teacher flow: create/edit courses manually, publish, own-course analytics | ✅ Done — verified end-to-end on 2026-07-19 (create → module → topic → quiz → publish → shows in student catalog → delete) |
| 3 | AI-assisted quiz generation: teacher-written topics → Groq (Llama 3.3) → draft module quiz | ✅ Done, restructured 2026-07-19 — teacher builds modules/topics by hand, AI drafts a quiz per module from its topics on request, teacher reviews/edits before saving. Replaced the original whole-course "raw notes → chapters + quizzes" generator. See `docs/data-model.md` § AI-assisted quiz generation. |
| 4 | TTS audio player (Sarvam AI) for topic content | ✅ Done — deployed and verified end-to-end on 2026-07-19 (teacher generates audio with an explicit language choice → real WAV audio confirmed in DB → plays back on the student-facing topic page). One live-API guess was wrong and fixed on first real call (default speaker name) — see `docs/data-model.md` § TTS audio. |
| 5 | Master/Admin dashboard: platform-wide analytics, sales, user management | ✅ Done — deployed and verified end-to-end on 2026-07-19 (teacher submits for review → direct-API publish attempt genuinely rejected by RLS, not just hidden by UI → admin approves via `/admin/courses` → status confirmed `published` in DB → course appears in the student catalog). Also resolves the Phase 2 self-service-publish simplification noted in `docs/data-model.md`. Sales/revenue is a placeholder pointing at Phase 6, since the `sales` table has no real data yet. |
| 6 | Payment integration (bKash/Nagad/SSLCommerz) | Planned |
| 7 | PWA packaging + mobile installability | ✅ Done, 2026-07-24 — `vite-plugin-pwa` (Workbox `generateSW`), `registerType: 'autoUpdate'` so returning visitors pick up new deploys automatically rather than being pinned to a stale cached bundle. Precaches only the built app shell (JS/CSS/HTML/icons) — Supabase API calls are cross-origin and untouched, so cached course data is never stale. **Known gap**: icons are SVG-only (`public/icon.svg`); Chrome/Edge/Android install flows support that directly, but iOS's separate "Add to Home Screen" `apple-touch-icon` mechanism generally wants a real PNG, which this repo doesn't have yet — flagged in `index.html` and `vite.config.ts` rather than silently shipped as "done" for iOS. Verified via `npm run build` (confirmed `dist/manifest.webmanifest`, `dist/sw.js`, and the auto-injected `<link rel="manifest">` + register-SW script in `dist/index.html`), `tsc -b`, `npm run lint`. |
| 8 | Full system language toggle (English/Bangla UI, not just content) | ✅ Done, 2026-07-19 — `react-i18next` infrastructure (default Bangla, EN/বাং switcher in nav, choice persisted via localStorage, `<html lang>` kept in sync) plus every page's static UI chrome translated phase by phase (public → student → teacher → admin), same pattern as the UI/UX redesign. Dynamic/user-generated DB content (course/chapter/quiz content) is intentionally left untranslated — out of scope. Backend/Supabase error messages (login errors, RLS rejections) are staying in English for now — a separate follow-up, not part of this pass. Verified via `tsc -b`, `npm run build`, and `npm run lint`. See `docs/design-system.md` § Language. |
| 9 | Certificates: issuance on module/course completion, PDF download, public verification page (`/verify/:certificateId`) | ✅ Done — `src/features/certificates/`. Student self-issues via a new RLS `INSERT` policy that checks `unlocked_module_index` covers every module (DB-enforced, not just trusted client-side); PDF generated client-side with `jspdf` (dynamically imported so its ~400KB isn't in the main bundle); public verification calls a `security definer` RPC (`verify_certificate`) rather than a blanket table grant, so an anonymous visitor can only look up one certificate by id, not dump the table. See `supabase/migrations/20260721000000_certificate_issuance.sql`. Verified via `tsc -b`, `npm run build`, `npm run lint`. |
| 10 | Course discovery & trust: catalog search/filter (title, price, category), student ratings & reviews, verified-teacher badge, per-course SEO structured data | ✅ Done — `src/features/reviews/`, `src/features/verification/`. Reviews/badge use narrow `security definer` RPCs / RLS rather than blanket public grants (same pattern as Phase 9's certificate verification). Also fixed a latent Phase 1 gap while adding the verified-badge column: `users_update_own`'s `WITH CHECK` had no column-level restriction, so a signed-in user could previously self-elevate `role` via a direct API call — a new `BEFORE UPDATE` trigger now reverts any non-admin attempt to change `role` or `is_verified_teacher`. "Notify me" waitlist deferred to Phase 17 — it needs a public teacher-profile page as its entry point, which doesn't exist yet. See `supabase/migrations/20260722000000_discovery_and_trust.sql`. Verified via `tsc -b`, `npm run build`, `npm run lint`. |
| 11 | Student engagement: notes/bookmarks while reading a topic | ✅ Done (partial), 2026-07-24 — `src/features/notes/`. Private per-student notes on `ModulePage`, own-row-only RLS (no teacher/admin visibility — a private study aid, not a public/moderated feature). **Deferred, not part of this pass** (scoped down at the user's request): discussion Q&A per module/topic, progress streaks & badges, course/platform leaderboard, practice/retake mode, study-time tracking — these will get their own pass(es) later, likely split further given their differing complexity. See `supabase/migrations/20260724000000_topic_notes.sql`. Verified via `tsc -b`, `npm run build`, `npm run lint`. |
| 12 | Notifications: email/push for a pending quiz, a newly unlocked module, or course updates from a teacher | Planned |
| 13 | Teacher tools: deeper analytics (per-module drop-off/engagement, not just completion count + avg score), course prerequisites ("finish course A before enrolling in B"), draft-vs-published content versioning (edit a published course without affecting enrolled students until republished), in-app student↔teacher messaging, payout/earnings dashboard | Planned |
| 14 | Content richness: video support per topic (alongside text + TTS audio), downloadable resources/attachments per topic, bulk topic import (paste a long document, assisted split into topics — teacher still reviews/edits, same "AI assists, doesn't replace" principle as Phase 3's quiz generation), offline access (ties into Phase 7's PWA work) | Planned |
| 15 | Monetization extras (beyond Phase 6's base payment integration): coupon/discount codes, course bundles / multi-course learning paths, corporate/B2B bulk seat purchasing | Planned |
| 16 | Admin: content moderation queue for flagged reviews/discussion posts (depends on Phase 10's reviews and Phase 11's discussion existing first) | Planned |
| 17 | Growth & sharing: public teacher profile page, certificate social share | ✅ Done (partial), 2026-07-23 — `/teachers/:teacherId` (`src/pages/TeacherProfilePage.tsx`) shows a teacher's name, bio, verified badge, and published courses; teachers edit their own bio from `/teach`. Certificate download now also offers a "Share on LinkedIn" button pointing at the public `/verify/:id` page. **Deferred, not part of this pass**: referral program (needs Phase 6 payments first — a "credit" means nothing without a real payment/discount ledger) and course preview/trailer (needs Phase 14 video support). The waitlist entry point this page was meant to unblock (Phase 10) can be picked up now that this page exists. See `supabase/migrations/20260723000000_teacher_profile.sql`. Verified via `tsc -b`, `npm run build`, `npm run lint`. |
| 18 | Quiz enhancements: timed quiz option, full quiz attempt history (not just the latest attempt), randomized question order per attempt | Planned |
| 19 | AI doubt-solving assistant: in-topic Q&A chatbot for students, extending the existing Groq infrastructure from Phase 3 into a conversational (not one-shot) use case | Planned |
| 20 | Alternate business models: monthly all-course subscription alongside per-course purchase, time-limited course access windows — depends on Phase 6 | Planned |
| 21 | Onboarding: first-time student walkthrough tour, step-by-step teacher onboarding checklist (course creation → publish) | ✅ Done — `src/features/onboarding/`. Student tour is a one-time modal sequence on first `/dashboard` visit (localStorage-dismissed). Teacher checklist on `/teach` derives its steps live from real course/module/topic/quiz data (no new table), auto-hides once every step is done. Verified via `tsc -b`, `npm run build`, `npm run lint`. |
| 22 | Teacher productivity: course cloning/templates (deep-copy a course's modules/topics/quiz as a starting point for a new one) | ✅ Done — `src/features/courses/hooks/useCloneCourse.ts`, wired into a "Clone" action on `/teach`. Pure app-level inserts under the teacher's own account, no new schema/RLS — "create your own course/module/topic/quiz" is already exactly what the existing owner-only insert policies allow. Deliberately doesn't copy enrollments, progress, reviews, certificates, or topic_audio. New course is created as `draft` with title `"Copy of {original}"`. Verified via `tsc -b`, `npm run build`, `npm run lint`. |

Cross-cutting, not numbered as a phase: **UI/UX redesign** (2026-07-19, using the `ui-ux-pro-max` skill) — ✅ done across all five sub-phases (foundation, public pages, student flow, teacher flow, admin flow), verified visually via Playwright at each step. See `docs/design-system.md`.

Do not start a later phase's UI/logic before the current phase is functionally complete and reflected as "done" in this table.

## 9. Cost Guardrails

Any code that calls a paid API (Claude, Sarvam AI, Supabase Pro features) must:
- Log estimated cost per call in a comment or console log during development.
- Never run in an uncapped loop (e.g. auto-regenerating AI content on every keystroke).
- Respect the budget ranges documented in `docs/decisions/cost-notes.md`: AI course gen $0 on Groq's free tier for now, TTS ~৳43–65/course.
- **Run server-side, in a Supabase Edge Function (`supabase/functions/`), never in browser code.** A paid API's key is a secret; anything shipped to the client (including Vite env vars prefixed `VITE_`) is readable by anyone who opens dev tools. See `supabase/functions/generate-module-quiz/` for the pattern: the frontend calls `supabase.functions.invoke(...)`, which forwards the user's own JWT so the function can re-use existing RLS policies for authorization instead of duplicating them.

No paid API was called in Phase 1 or 2 — this section became load-bearing starting Phase 3.

## 10. Handoff Notes for Claude Code

Read this file, then `docs/design-system.md` and `docs/data-model.md`, before writing any code.

Phase 1 decisions that were previously open, resolved 2026-07-19:
- **Quiz-passing threshold: 70%** — `QUIZ_PASS_THRESHOLD` in `src/lib/constants.ts`.
- **Topic preview access: the first topic (order_index 0) of the first module (order_index 0) of any published course is a free public preview**; the rest require enrollment. Enforced in RLS (`topics_select_free_preview` policy) and mirrored in the UI.
- **Phase 1 content source: SQL seed migration** (`supabase/seed.sql`) with two sample courses, so the student flow is testable end to end without a teacher UI.

Still not decided — ask before building: certificate design (Phase 1 doesn't need it yet; the `certificates` table is schema-only with no issuance code).

**Legal pages (`/terms`, `/privacy`, added 2026-07-19) are drafts, not reviewed by a lawyer.** They're grounded in what the code actually does (verified against the real data model and Edge Functions, not generic filler) and carry a visible on-page disclaimer, but do not treat them as final legal protection — get them reviewed before real users/payments depend on them. Update both in the same commit whenever a new third-party processor is added (see PROJECT.md Section 2) or Phase 6 payments ships.

**`public/sitemap.xml` only lists static routes** (`/`, `/courses`, `/terms`, `/privacy`) — individual course pages aren't included because Koushol is a client-side-only SPA with no server rendering, so there's no request-time hook to enumerate published courses into a sitemap. Revisit if/when server rendering lands.

Keep commits scoped to one phase-item at a time; do not bundle unrelated changes.
