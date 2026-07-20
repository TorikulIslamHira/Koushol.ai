-- What: Creates public.topic_chat_messages — a student's private Q&A conversation with the
--       AI doubt-solving assistant for a topic.
-- Why:  Phase 19 (see PROJECT.md Section 8). Private, like topic_notes — a personal study
--       aid, not a moderated or shared feature, so no teacher/admin visibility policy.
-- Depends on: 20260719050000_restructure_modules_topics.sql (topics).
--
-- A student can insert either role value for their own rows — harmless, since nothing
-- downstream trusts the role column for anything security-relevant (it's purely for
-- rendering the chat UI). The Edge Function (ask-topic-doubt) is what actually calls Groq
-- and enforces the per-topic message cap; this table is just the transcript.

create table public.topic_chat_messages (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.users (id) on delete cascade,
  topic_id uuid not null references public.topics (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index topic_chat_messages_student_topic_idx on public.topic_chat_messages (student_id, topic_id);

alter table public.topic_chat_messages enable row level security;

create policy "topic_chat_messages_select_own" on public.topic_chat_messages
  for select to authenticated
  using (student_id = auth.uid());

create policy "topic_chat_messages_insert_own" on public.topic_chat_messages
  for insert to authenticated
  with check (student_id = auth.uid());

create policy "topic_chat_messages_delete_own" on public.topic_chat_messages
  for delete to authenticated
  using (student_id = auth.uid());
