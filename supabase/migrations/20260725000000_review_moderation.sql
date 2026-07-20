-- What: Adds a flag/report mechanism for course_reviews and an admin moderation queue.
-- Why:  Phase 16 (see PROJECT.md Section 8). Scoped to reviews only, since Phase 11's
--       discussion Q&A (the other content type Phase 16 originally mentioned) was deferred
--       and doesn't exist yet — a future migration can extend this when it does.
-- Depends on: 20260722000000_discovery_and_trust.sql (course_reviews).
--
-- Any authenticated user can flag a review (not just its author or an enrolled student —
-- reviews are publicly visible, so reporting should be too), but only for the flag_at /
-- flag_reason columns specifically. A blanket UPDATE RLS policy can't express "only these
-- columns" (same limitation noted in 20260722000000's privilege-protection trigger comment),
-- so this uses a narrow security-definer RPC instead — the same pattern already used for
-- verify_certificate and get_teacher_badge.

alter table public.course_reviews add column flagged_at timestamptz;
alter table public.course_reviews add column flag_reason text;

create or replace function public.flag_review(review_id uuid, reason text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.course_reviews
  set flagged_at = now(), flag_reason = reason
  where id = review_id
$$;

grant execute on function public.flag_review(uuid, text) to authenticated;

-- Admin needs to dismiss a flag (clear it after review) in addition to the delete rights
-- they already have — same trust level as courses_update_admin/users_update_admin elsewhere.
create policy "course_reviews_update_admin" on public.course_reviews
  for update to authenticated
  using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- Explicit admin read, not relying on course_reviews_select_published — a review on a
-- course that's since been unpublished should still be visible in the moderation queue.
create policy "course_reviews_select_admin" on public.course_reviews
  for select to authenticated
  using (public.current_user_role() = 'admin');
