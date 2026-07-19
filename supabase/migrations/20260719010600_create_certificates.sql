-- What: Creates public.certificates (issued once a student finishes every chapter of a course).
-- Why:  Data model placeholder for Phase 1's roadmap item; issuance logic and certificate
--       design are NOT decided yet (see PROJECT.md Section 10) so this migration only
--       creates the table + locked-down RLS — no app code issues certificates yet.
-- Depends on: 20260719010100_create_courses.sql.

create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.users (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  issued_at timestamptz not null default now(),
  unique (student_id, course_id)
);

create index certificates_student_id_idx on public.certificates (student_id);

alter table public.certificates enable row level security;

create policy "certificates_select_own" on public.certificates
  for select to authenticated
  using (student_id = auth.uid());

create policy "certificates_select_teacher_or_admin" on public.certificates
  for select to authenticated
  using (
    public.current_user_role() = 'admin'
    or exists (
      select 1 from public.courses c
      where c.id = certificates.course_id and c.teacher_id = auth.uid()
    )
  );

-- No student/teacher insert policy yet: issuance flow isn't designed. Only
-- admins (or a future service-role Edge Function, which bypasses RLS) can write.
create policy "certificates_insert_admin" on public.certificates
  for insert to authenticated
  with check (public.current_user_role() = 'admin');
