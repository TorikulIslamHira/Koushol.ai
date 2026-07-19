# Koushol — Interactive Learning Platform

Project Spec & Engineering Rules — v1.7
Status: Phases 1-5 done — see Section 8
Last updated: 2026-07-19

This document is the single source of truth for architecture, folder structure, coding rules, data model, and roadmap. Any AI agent or developer working on this repo must read this file first and follow it strictly. If a decision here needs to change, update this file in the same commit — never let the code and this document drift apart.

## 1. Project Overview

Koushol is a web-first (mobile-installable later) interactive learning platform.

Students enroll in courses, read chapters, take quizzes, unlock progress sequentially, and earn certificates.

Teachers write raw topic notes; an AI engine converts those notes into a structured interactive course (chapters + quizzes).

A Master/Admin role has full permissions plus an analytics dashboard (sales, revenue, student activity, teacher performance).

An optional TTS ("listen to this course") audio player will be added later using Sarvam AI (Bengali-capable TTS).

Design identity: dark green (#0C8A4B) + gold (#D4A017) accents, Space Grotesk (display) + Inter (body) fonts. See `docs/design-system.md` — do not invent a new palette without updating that file.

## 2. Tech Stack (locked decisions)

| Layer | Choice | Notes |
|---|---|---|
| Frontend | React + Tailwind (Vite, TypeScript) | Web-first, installable PWA later |
| Backend / DB / Auth | Supabase (Postgres) | Already connected; free tier to start |
| AI course generation | Groq API (Llama 3.3 70B, model configurable via `GROQ_MODEL` secret) | Phase 3. Switched from the originally-planned Claude API on 2026-07-19 — teacher wanted to test on a free tier before committing to a paid provider. Groq's chat-completions API is OpenAI-compatible; the Edge Function (`supabase/functions/generate-course/`) is written against it directly (no SDK). Swapping back to Claude later is a contained change (endpoint + request/response shape) — update this row in the same commit if that happens. |
| TTS | Sarvam AI (Bulbul, speaker `anushka` by default, model configurable via `SARVAM_MODEL` secret) | Phase 4. Language is an explicit per-generation teacher choice, not hardcoded to Bengali — see `docs/data-model.md` § TTS audio. |
| Payments | bKash / Nagad / SSLCommerz | Phase 6, no monthly fee, %-based |
| Hosting | Vercel or Netlify | Free tier to start |
| Domain | Already purchased | — |
| Routing | React Router v7 | Client-side routing for the SPA |

Do not introduce a new framework, database, or third-party service without adding it to this table first and stating the reason.

## 3. User Roles & Permissions

| Capability | Student | Teacher | Master/Admin |
|---|---|---|---|
| Browse & enroll in courses | ✅ | ✅ | ✅ |
| View chapters / take quizzes | ✅ | ✅ | ✅ |
| Earn certificates | ✅ | — | — |
| Create/edit own courses (raw notes) | ❌ | ✅ | ✅ |
| Trigger AI course generation | ❌ | ✅ (own courses) | ✅ (any course) |
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
├── docs/
│   ├── design-system.md
│   ├── data-model.md
│   └── decisions/
│       └── cost-notes.md
├── supabase/
│   ├── migrations/                ← one file per schema change, timestamped
│   ├── functions/                 ← Edge Functions (Deno) — anything needing a secret
│   │   ├── generate-course/       ← Groq API call for AI course generation (Phase 3)
│   │   └── generate-chapter-audio/ ← Sarvam AI TTS call (Phase 4)
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
- Supabase tables: `snake_case`, plural (e.g. `course_chapters` → actually `chapters`, see Section 7)
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
- `chapters` (id, course_id, order_index, title, content, is_ai_generated)
- `quizzes` (id, chapter_id, questions jsonb)
- `enrollments` (id, student_id, course_id, unlocked_chapter_index, enrolled_at)
- `chapter_progress` (id, student_id, chapter_id, quiz_score, completed_at)
- `certificates` (id, student_id, course_id, issued_at)
- `sales` (id, course_id, student_id, amount, payment_provider, status, created_at)

All tables get RLS enabled from the first migration — never ship a table without a policy, even in prototyping. See `supabase/migrations/` for the exact policies (every table already has them, including `certificates` and `sales`, which are schema-only placeholders until Phases 5–6).

## 8. Development Phases / Roadmap

| Phase | Scope | Status |
|---|---|---|
| 1 | Student flow: browse, enroll, chapters, quiz, manual course content, Supabase auth+DB | ✅ Done — migrations + seed applied to the live Supabase project, verified end-to-end locally (signup, browse, enroll, chapter, quiz, unlock) on 2026-07-19 |
| 2 | Teacher flow: create/edit courses manually, publish, own-course analytics | ✅ Done — verified end-to-end on 2026-07-19 (create → chapter → quiz → publish → shows in student catalog → delete) |
| 3 | AI course generation: teacher notes → Groq (Llama 3.3) → structured chapters + quiz | ✅ Done — deployed and verified end-to-end on 2026-07-19 (raw notes → generate → review proposal → add to course → chapter + quiz confirmed in DB with `is_ai_generated = true`). See `docs/data-model.md` § AI course generation. |
| 4 | TTS audio player (Sarvam AI) for chapter content | ✅ Done — deployed and verified end-to-end on 2026-07-19 (teacher generates audio with an explicit language choice → real WAV audio confirmed in DB → plays back on the student-facing chapter page). One live-API guess was wrong and fixed on first real call (default speaker name) — see `docs/data-model.md` § TTS audio. |
| 5 | Master/Admin dashboard: platform-wide analytics, sales, user management | ✅ Done — deployed and verified end-to-end on 2026-07-19 (teacher submits for review → direct-API publish attempt genuinely rejected by RLS, not just hidden by UI → admin approves via `/admin/courses` → status confirmed `published` in DB → course appears in the student catalog). Also resolves the Phase 2 self-service-publish simplification noted in `docs/data-model.md`. Sales/revenue is a placeholder pointing at Phase 6, since the `sales` table has no real data yet. |
| 6 | Payment integration (bKash/Nagad/SSLCommerz) | Planned |
| 7 | PWA packaging + mobile installability | Planned |

Do not start a later phase's UI/logic before the current phase is functionally complete and reflected as "done" in this table.

## 9. Cost Guardrails

Any code that calls a paid API (Claude, Sarvam AI, Supabase Pro features) must:
- Log estimated cost per call in a comment or console log during development.
- Never run in an uncapped loop (e.g. auto-regenerating AI content on every keystroke).
- Respect the budget ranges documented in `docs/decisions/cost-notes.md`: AI course gen $0 on Groq's free tier for now, TTS ~৳43–65/course.
- **Run server-side, in a Supabase Edge Function (`supabase/functions/`), never in browser code.** A paid API's key is a secret; anything shipped to the client (including Vite env vars prefixed `VITE_`) is readable by anyone who opens dev tools. See `supabase/functions/generate-course/` for the pattern: the frontend calls `supabase.functions.invoke(...)`, which forwards the user's own JWT so the function can re-use existing RLS policies for authorization instead of duplicating them.

No paid API was called in Phase 1 or 2 — this section became load-bearing starting Phase 3.

## 10. Handoff Notes for Claude Code

Read this file, then `docs/design-system.md` and `docs/data-model.md`, before writing any code.

Phase 1 decisions that were previously open, resolved 2026-07-19:
- **Quiz-passing threshold: 70%** — `QUIZ_PASS_THRESHOLD` in `src/lib/constants.ts`.
- **Chapter preview access: first chapter (order_index 0) of any published course is a free public preview**; the rest require enrollment. Enforced in RLS (`chapters_select_free_preview` policy) and mirrored in the UI.
- **Phase 1 content source: SQL seed migration** (`supabase/seed.sql`) with two sample courses, so the student flow is testable end to end without a teacher UI.

Still not decided — ask before building: certificate design (Phase 1 doesn't need it yet; the `certificates` table is schema-only with no issuance code).

Keep commits scoped to one phase-item at a time; do not bundle unrelated changes.
