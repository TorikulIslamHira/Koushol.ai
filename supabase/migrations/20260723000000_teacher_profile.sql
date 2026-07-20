-- What: Adds a teacher bio field and extends the public teacher-badge RPC to also return it.
-- Why:  Phase 17 (see PROJECT.md Section 8) — public teacher profile page. Referral program
--       and course preview/trailer are deferred (see the row's note) — this migration only
--       covers what's needed for the profile page + certificate sharing.
-- Depends on: 20260719010000_create_users.sql, 20260722000000_discovery_and_trust.sql
--       (get_teacher_badge).

alter table public.users add column bio text;

-- Replaces the Phase 10 version — same narrow security-definer pattern (no blanket public
-- SELECT on users, which would leak email/role/etc.), just one more non-sensitive column.
-- Postgres won't let CREATE OR REPLACE change a function's return type, so drop first.
drop function if exists public.get_teacher_badge(uuid);

create function public.get_teacher_badge(teacher_id uuid)
returns table (name text, bio text, is_verified_teacher boolean)
language sql
security definer
set search_path = public
as $$
  select u.name, u.bio, u.is_verified_teacher
  from public.users u
  where u.id = teacher_id and u.role = 'teacher'
$$;

grant execute on function public.get_teacher_badge(uuid) to anon, authenticated;
