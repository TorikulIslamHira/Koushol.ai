-- What: Lets a student issue their own certificate once they've genuinely finished a
--       course, and adds a public verification RPC.
-- Why:  Phase 9 (see PROJECT.md Section 8). The certificates table (Phase 1) only allowed
--       admin inserts — issuance was never wired up. This adds a student self-insert path
--       that's checked at the DB layer (not just trusted client-side), and a narrow
--       security-definer function so a public "verify this certificate" page doesn't need
--       a blanket SELECT grant on the whole table (which would let anyone dump every
--       certificate, not just the one they're looking up).
-- Depends on: 20260719010600_create_certificates.sql, 20260719050000_restructure_modules_topics.sql
--       (modules, enrollments.unlocked_module_index).

create policy "certificates_insert_own" on public.certificates
  for insert to authenticated
  with check (
    student_id = auth.uid()
    and exists (
      select 1 from public.enrollments e
      where e.course_id = certificates.course_id
        and e.student_id = auth.uid()
        and (select count(*) from public.modules m where m.course_id = certificates.course_id) > 0
        and e.unlocked_module_index >= (
          select count(*) from public.modules m where m.course_id = certificates.course_id
        )
    )
  );

create or replace function public.verify_certificate(cert_id uuid)
returns table (course_title text, student_name text, issued_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select c.title, u.name, cert.issued_at
  from public.certificates cert
  join public.courses c on c.id = cert.course_id
  join public.users u on u.id = cert.student_id
  where cert.id = cert_id
$$;

grant execute on function public.verify_certificate(uuid) to anon, authenticated;
