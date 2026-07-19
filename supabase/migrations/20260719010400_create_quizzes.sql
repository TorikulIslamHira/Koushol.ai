-- What: Creates public.quizzes (one quiz per chapter, questions stored as jsonb).
-- Why:  Gates progression — a student must pass a chapter's quiz to unlock the next one.
-- Depends on: 20260719010200_create_chapters.sql, 20260719010300_create_enrollments.sql
--       (visibility mirrors chapter visibility: free-preview chapter, or enrolled, or owner/admin).
--
-- Known Phase 1 limitation: questions.jsonb includes each option's correct_index, so an
-- enrolled student's client can technically read the answer key. Grading is client-side
-- for now. Move to a server-side (Edge Function) grader before this matters for real
-- stakes — tracked in docs/data-model.md.

create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters (id) on delete cascade unique,
  questions jsonb not null default '[]'::jsonb
);

create index quizzes_chapter_id_idx on public.quizzes (chapter_id);

alter table public.quizzes enable row level security;

create policy "quizzes_select_free_preview" on public.quizzes
  for select
  using (
    exists (
      select 1 from public.chapters ch
      join public.courses c on c.id = ch.course_id
      where ch.id = quizzes.chapter_id and ch.order_index = 0 and c.status = 'published'
    )
  );

create policy "quizzes_select_enrolled" on public.quizzes
  for select to authenticated
  using (
    exists (
      select 1 from public.chapters ch
      join public.enrollments e on e.course_id = ch.course_id
      where ch.id = quizzes.chapter_id and e.student_id = auth.uid()
    )
  );

create policy "quizzes_select_owner_or_admin" on public.quizzes
  for select to authenticated
  using (
    public.current_user_role() = 'admin'
    or exists (
      select 1 from public.chapters ch
      join public.courses c on c.id = ch.course_id
      where ch.id = quizzes.chapter_id and c.teacher_id = auth.uid()
    )
  );

create policy "quizzes_insert_owner_or_admin" on public.quizzes
  for insert to authenticated
  with check (
    public.current_user_role() = 'admin'
    or exists (
      select 1 from public.chapters ch
      join public.courses c on c.id = ch.course_id
      where ch.id = quizzes.chapter_id and c.teacher_id = auth.uid()
    )
  );

create policy "quizzes_update_owner_or_admin" on public.quizzes
  for update to authenticated
  using (
    public.current_user_role() = 'admin'
    or exists (
      select 1 from public.chapters ch
      join public.courses c on c.id = ch.course_id
      where ch.id = quizzes.chapter_id and c.teacher_id = auth.uid()
    )
  )
  with check (
    public.current_user_role() = 'admin'
    or exists (
      select 1 from public.chapters ch
      join public.courses c on c.id = ch.course_id
      where ch.id = quizzes.chapter_id and c.teacher_id = auth.uid()
    )
  );

create policy "quizzes_delete_owner_or_admin" on public.quizzes
  for delete to authenticated
  using (
    public.current_user_role() = 'admin'
    or exists (
      select 1 from public.chapters ch
      join public.courses c on c.id = ch.course_id
      where ch.id = quizzes.chapter_id and c.teacher_id = auth.uid()
    )
  );
