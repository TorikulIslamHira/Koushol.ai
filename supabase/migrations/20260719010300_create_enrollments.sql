-- What: Creates public.enrollments (a student joining a course) and adds the
--       "enrolled students can read all chapters of their course" policy that
--       20260719010200_create_chapters.sql deferred until this table existed.
-- Why:  Enrollment is what unlocks chapters beyond the free-preview first chapter,
--       and tracks how far a student has progressed (unlocked_chapter_index).
-- Depends on: 20260719010100_create_courses.sql, 20260719010200_create_chapters.sql.

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.users (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  unlocked_chapter_index integer not null default 0 check (unlocked_chapter_index >= 0),
  enrolled_at timestamptz not null default now(),
  unique (student_id, course_id)
);

create index enrollments_student_id_idx on public.enrollments (student_id);
create index enrollments_course_id_idx on public.enrollments (course_id);

alter table public.enrollments enable row level security;

create policy "enrollments_select_own" on public.enrollments
  for select to authenticated
  using (student_id = auth.uid());

create policy "enrollments_select_teacher_or_admin" on public.enrollments
  for select to authenticated
  using (
    public.current_user_role() = 'admin'
    or exists (
      select 1 from public.courses c
      where c.id = enrollments.course_id and c.teacher_id = auth.uid()
    )
  );

-- A student can only enroll themself, and only into a published course.
create policy "enrollments_insert_own" on public.enrollments
  for insert to authenticated
  with check (
    student_id = auth.uid()
    and exists (
      select 1 from public.courses c
      where c.id = enrollments.course_id and c.status = 'published'
    )
  );

-- Students advance their own progress (unlocked_chapter_index) after passing a quiz.
create policy "enrollments_update_own" on public.enrollments
  for update to authenticated
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

-- Deferred policy from the chapters migration: an enrolled student can read
-- every chapter of the course they're enrolled in, not just the free preview.
create policy "chapters_select_enrolled" on public.chapters
  for select to authenticated
  using (
    exists (
      select 1 from public.enrollments e
      where e.course_id = chapters.course_id and e.student_id = auth.uid()
    )
  );
