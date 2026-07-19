-- What: Adds a 'pending_approval' course status and splits the combined
--       teacher-or-admin insert/update policies on courses so a teacher can no longer set
--       status = 'published' themselves — only an admin can. Teachers can still move a
--       course to 'draft' or 'pending_approval' on their own.
-- Why:  PROJECT.md Section 3 has always said teacher publish "needs admin approval", but
--       Phase 2 shipped it self-service because the admin dashboard (Phase 5) didn't exist
--       yet — documented as a known simplification in docs/data-model.md, to be revisited
--       once Phase 5 landed. This is that revisit.
-- Depends on: 20260719010100_create_courses.sql (course_status enum, existing policies).

alter type public.course_status add value 'pending_approval';

drop policy "courses_insert_teacher_or_admin" on public.courses;
drop policy "courses_update_owner_or_admin" on public.courses;

-- Teachers can create/update their own courses, but never set status = 'published' directly.
create policy "courses_insert_teacher" on public.courses
  for insert to authenticated
  with check (
    public.current_user_role() = 'teacher'
    and teacher_id = auth.uid()
    and status <> 'published'
  );

create policy "courses_update_teacher" on public.courses
  for update to authenticated
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid() and status <> 'published');

-- Admins are unrestricted: can create/update any course to any status, including approving
-- (pending_approval -> published) or rejecting (pending_approval -> draft).
create policy "courses_insert_admin" on public.courses
  for insert to authenticated
  with check (public.current_user_role() = 'admin');

create policy "courses_update_admin" on public.courses
  for update to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');
