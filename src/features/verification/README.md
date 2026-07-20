# features/verification

The verified-teacher badge — an admin-only-settable trust signal shown on a course's detail
page next to the teacher's name.

- `hooks/useTeacherBadge.ts` — public read of `(name, is_verified_teacher)` via the
  `get_teacher_badge` security-definer RPC, not a direct `users` select (which stays locked
  down to avoid leaking email/role/etc. to anyone who knows a teacher's id).
- `components/TeacherBadge.tsx` — renders the name + a checkmark icon if verified.

The admin-side toggle lives in `src/pages/AdminUsersPage.tsx` (next to the existing role
dropdown), using `src/features/admin/hooks/useUpdateVerifiedTeacher.ts`. Setting this column
is enforced admin-only at the DB layer twice over: the existing `users_update_admin` RLS
policy, and a `BEFORE UPDATE` trigger (`protect_privileged_columns`) that silently reverts
any non-admin attempt to change it — see
`supabase/migrations/20260722000000_discovery_and_trust.sql`.
