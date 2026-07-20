-- What: Creates public.topic_notes — a student's private note/bookmark for a topic they're
--       reading.
-- Why:  Phase 11 (see PROJECT.md Section 8) — student engagement, "notes/bookmarks while
--       reading a topic" slice only; the rest of Phase 11 (discussion Q&A, streaks/badges,
--       leaderboard, practice mode, study-time tracking) is deferred to a later pass.
-- Depends on: 20260719050000_restructure_modules_topics.sql (topics).
--
-- Notes are private study aids, not a public/social feature — only the owning student can
-- ever read their own notes. No teacher/admin visibility policy, unlike most other tables
-- in this project, since there's no legitimate reason for anyone else to read them.

create table public.topic_notes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.users (id) on delete cascade,
  topic_id uuid not null references public.topics (id) on delete cascade,
  content text not null default '',
  updated_at timestamptz not null default now(),
  unique (student_id, topic_id)
);

create index topic_notes_student_id_idx on public.topic_notes (student_id);

alter table public.topic_notes enable row level security;

create policy "topic_notes_select_own" on public.topic_notes
  for select to authenticated
  using (student_id = auth.uid());

create policy "topic_notes_insert_own" on public.topic_notes
  for insert to authenticated
  with check (student_id = auth.uid());

create policy "topic_notes_update_own" on public.topic_notes
  for update to authenticated
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

create policy "topic_notes_delete_own" on public.topic_notes
  for delete to authenticated
  using (student_id = auth.uid());
