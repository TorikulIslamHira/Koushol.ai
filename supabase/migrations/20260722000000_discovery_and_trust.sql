-- What: Adds catalog category, a course_reviews table, a verified-teacher badge column,
--       and a security-definer RPC to expose that badge publicly without a blanket grant
--       on the users table.
-- Why:  Phase 10 (see PROJECT.md Section 8) — course discovery/trust: search/filter by
--       category, student ratings & reviews, a verified-teacher badge, per-course SEO.
-- Depends on: 20260719010100_create_courses.sql, 20260719010000_create_users.sql,
--       20260719010300_create_enrollments.sql.
--
-- Security fix bundled in this migration: users_update_own (20260719010000_create_users.sql)
-- only checks WITH CHECK (id = auth.uid()) — it has no column-level restriction, so a
-- signed-in user could currently call `update({ role: 'admin' })` on their own row and RLS
-- would allow it (a latent gap since Phase 1, never exploited because no UI exposed it).
-- Adding is_verified_teacher without protecting it would make the new badge
-- self-grantable, which defeats its purpose as a trust signal — so this migration also
-- adds a trigger that silently reverts any non-admin attempt to change role or
-- is_verified_teacher, closing both gaps at once.

alter table public.courses add column category text;

alter table public.users add column is_verified_teacher boolean not null default false;

create or replace function public.prevent_privileged_self_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.current_user_role() <> 'admin' then
    if new.role is distinct from old.role then
      new.role := old.role;
    end if;
    if new.is_verified_teacher is distinct from old.is_verified_teacher then
      new.is_verified_teacher := old.is_verified_teacher;
    end if;
  end if;
  return new;
end;
$$;

create trigger protect_privileged_columns
  before update on public.users
  for each row execute function public.prevent_privileged_self_update();

create table public.course_reviews (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.users (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (student_id, course_id)
);

create index course_reviews_course_id_idx on public.course_reviews (course_id);

alter table public.course_reviews enable row level security;

-- Reviews of a published course are a public trust signal — readable even signed out,
-- same spirit as the free-preview topic/quiz policies elsewhere in this project.
create policy "course_reviews_select_published" on public.course_reviews
  for select
  using (
    exists (select 1 from public.courses c where c.id = course_reviews.course_id and c.status = 'published')
  );

create policy "course_reviews_insert_own" on public.course_reviews
  for insert to authenticated
  with check (
    student_id = auth.uid()
    and exists (
      select 1 from public.enrollments e
      where e.course_id = course_reviews.course_id and e.student_id = auth.uid()
    )
  );

create policy "course_reviews_update_own" on public.course_reviews
  for update to authenticated
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

create policy "course_reviews_delete_own_or_admin" on public.course_reviews
  for delete to authenticated
  using (student_id = auth.uid() or public.current_user_role() = 'admin');

-- Narrow public read of a teacher's display name + verified badge, without a blanket
-- SELECT grant on users (which would leak email/role/etc. to anyone) — same pattern as
-- verify_certificate in 20260721000000_certificate_issuance.sql.
create or replace function public.get_teacher_badge(teacher_id uuid)
returns table (name text, is_verified_teacher boolean)
language sql
security definer
set search_path = public
as $$
  select u.name, u.is_verified_teacher
  from public.users u
  where u.id = teacher_id and u.role = 'teacher'
$$;

grant execute on function public.get_teacher_badge(uuid) to anon, authenticated;
