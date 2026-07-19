-- What: Creates public.users (app-level profile: role/name/email) and a trigger that
--       auto-inserts a row here whenever a new Supabase Auth user signs up.
-- Why:  Auth identity (auth.users) is separate from app data. We need a role column
--       (student/teacher/admin) to drive RLS policies across every other table.
-- Depends on: nothing (first migration). auth.users is a Supabase-managed table that
--       already exists in every project.

create extension if not exists pgcrypto;

create type public.user_role as enum ('student', 'teacher', 'admin');

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null default 'student',
  name text not null,
  email text not null,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

-- Security-definer helper: lets policies check "is the caller an admin/teacher?"
-- without re-triggering RLS on public.users (which would otherwise recurse).
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.users where id = auth.uid()
$$;

-- Auto-create a public.users row whenever someone signs up via Supabase Auth.
-- New accounts default to 'student' — role upgrades (teacher/admin) are an
-- admin-only action (see PROJECT.md Section 3), never self-service.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- RLS: everyone can read their own profile; admins can read/update everyone's.
create policy "users_select_own" on public.users
  for select to authenticated
  using (id = auth.uid());

create policy "users_select_admin" on public.users
  for select to authenticated
  using (public.current_user_role() = 'admin');

create policy "users_update_own" on public.users
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "users_update_admin" on public.users
  for update to authenticated
  using (public.current_user_role() = 'admin');

-- No insert/delete policies for regular users: rows are created only by the
-- trigger above (security definer, bypasses RLS) and deleted via auth.users cascade.
