-- What: Creates public.courses (a teacher's course, draft or published).
-- Why:  Root entity students browse/enroll into; chapters hang off this.
-- Depends on: 20260719010000_create_users.sql (teacher_id references users,
--       public.current_user_role() used in policies).

create type public.course_status as enum ('draft', 'published');

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.users (id) on delete cascade,
  title text not null,
  description text not null default '',
  status public.course_status not null default 'draft',
  price numeric(10, 2) not null default 0 check (price >= 0),
  created_at timestamptz not null default now()
);

create index courses_teacher_id_idx on public.courses (teacher_id);
create index courses_status_idx on public.courses (status);

alter table public.courses enable row level security;

-- Anyone (including anonymous visitors) can browse published courses.
create policy "courses_select_published" on public.courses
  for select
  using (status = 'published');

-- Teachers can always see their own courses (including drafts); admins see all.
create policy "courses_select_owner_or_admin" on public.courses
  for select to authenticated
  using (teacher_id = auth.uid() or public.current_user_role() = 'admin');

-- Teachers create courses for themselves; admins can create for anyone.
create policy "courses_insert_teacher_or_admin" on public.courses
  for insert to authenticated
  with check (
    (public.current_user_role() in ('teacher', 'admin') and teacher_id = auth.uid())
    or public.current_user_role() = 'admin'
  );

create policy "courses_update_owner_or_admin" on public.courses
  for update to authenticated
  using (teacher_id = auth.uid() or public.current_user_role() = 'admin')
  with check (teacher_id = auth.uid() or public.current_user_role() = 'admin');

create policy "courses_delete_owner_or_admin" on public.courses
  for delete to authenticated
  using (teacher_id = auth.uid() or public.current_user_role() = 'admin');
