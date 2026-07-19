-- What: Creates public.chapters (ordered content units within a course).
-- Why:  Students read chapters sequentially; each may later have a quiz gating progress.
-- Depends on: 20260719010100_create_courses.sql.
--
-- Note: full read access for *enrolled* students is added in
-- 20260719010400_create_enrollments.sql (that table doesn't exist yet here).
-- This migration only grants the free-preview-chapter and owner/admin policies.

create table public.chapters (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  order_index integer not null check (order_index >= 0),
  title text not null,
  content text not null default '',
  is_ai_generated boolean not null default false,
  unique (course_id, order_index)
);

create index chapters_course_id_idx on public.chapters (course_id);

alter table public.chapters enable row level security;

-- First chapter (order_index 0) of any published course is a free preview,
-- readable by anyone — see PROJECT.md Section 10 handoff decision.
create policy "chapters_select_free_preview" on public.chapters
  for select
  using (
    order_index = 0
    and exists (
      select 1 from public.courses c
      where c.id = chapters.course_id and c.status = 'published'
    )
  );

create policy "chapters_select_owner_or_admin" on public.chapters
  for select to authenticated
  using (
    public.current_user_role() = 'admin'
    or exists (
      select 1 from public.courses c
      where c.id = chapters.course_id and c.teacher_id = auth.uid()
    )
  );

create policy "chapters_insert_owner_or_admin" on public.chapters
  for insert to authenticated
  with check (
    public.current_user_role() = 'admin'
    or exists (
      select 1 from public.courses c
      where c.id = chapters.course_id and c.teacher_id = auth.uid()
    )
  );

create policy "chapters_update_owner_or_admin" on public.chapters
  for update to authenticated
  using (
    public.current_user_role() = 'admin'
    or exists (
      select 1 from public.courses c
      where c.id = chapters.course_id and c.teacher_id = auth.uid()
    )
  )
  with check (
    public.current_user_role() = 'admin'
    or exists (
      select 1 from public.courses c
      where c.id = chapters.course_id and c.teacher_id = auth.uid()
    )
  );

create policy "chapters_delete_owner_or_admin" on public.chapters
  for delete to authenticated
  using (
    public.current_user_role() = 'admin'
    or exists (
      select 1 from public.courses c
      where c.id = chapters.course_id and c.teacher_id = auth.uid()
    )
  );
