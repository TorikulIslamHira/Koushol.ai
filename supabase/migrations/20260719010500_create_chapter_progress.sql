-- What: Creates public.chapter_progress (a student's quiz result + completion per chapter).
-- Why:  Records history behind enrollments.unlocked_chapter_index and powers teacher/admin
--       analytics later (Phase 2/5).
-- Depends on: 20260719010200_create_chapters.sql, 20260719010300_create_enrollments.sql.

create table public.chapter_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.users (id) on delete cascade,
  chapter_id uuid not null references public.chapters (id) on delete cascade,
  quiz_score numeric(5, 2) check (quiz_score is null or (quiz_score >= 0 and quiz_score <= 100)),
  completed_at timestamptz,
  unique (student_id, chapter_id)
);

create index chapter_progress_student_id_idx on public.chapter_progress (student_id);
create index chapter_progress_chapter_id_idx on public.chapter_progress (chapter_id);

alter table public.chapter_progress enable row level security;

create policy "chapter_progress_select_own" on public.chapter_progress
  for select to authenticated
  using (student_id = auth.uid());

create policy "chapter_progress_select_teacher_or_admin" on public.chapter_progress
  for select to authenticated
  using (
    public.current_user_role() = 'admin'
    or exists (
      select 1 from public.chapters ch
      join public.courses c on c.id = ch.course_id
      where ch.id = chapter_progress.chapter_id and c.teacher_id = auth.uid()
    )
  );

-- A student may only record progress for themself, on a chapter of a course
-- they're actually enrolled in.
create policy "chapter_progress_insert_own" on public.chapter_progress
  for insert to authenticated
  with check (
    student_id = auth.uid()
    and exists (
      select 1 from public.chapters ch
      join public.enrollments e on e.course_id = ch.course_id
      where ch.id = chapter_progress.chapter_id and e.student_id = auth.uid()
    )
  );

-- Allows retaking a quiz (update own score/completed_at).
create policy "chapter_progress_update_own" on public.chapter_progress
  for update to authenticated
  using (student_id = auth.uid())
  with check (student_id = auth.uid());
