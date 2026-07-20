# features/verification

The verified-teacher badge (admin-only-settable trust signal) and the public teacher
profile page's supporting pieces.

- `hooks/useTeacherBadge.ts` — public read of `(name, bio, is_verified_teacher)` via the
  `get_teacher_badge` security-definer RPC, not a direct `users` select (which stays locked
  down to avoid leaking email/role/etc. to anyone who knows a teacher's id).
- `components/TeacherBadge.tsx` — shown on `CourseDetailPage`: the teacher's name (linking
  to `/teachers/:teacherId`, see `src/pages/TeacherProfilePage.tsx`) + a checkmark if verified.
- `hooks/useUpdateBio.ts` / `components/EditBioForm.tsx` — lets a teacher edit their own
  bio (shown on their public profile). Allowed by the existing `users_update_own` RLS policy
  — `bio` isn't one of the privileged columns `protect_privileged_columns` guards.

The admin-side toggle lives in `src/pages/AdminUsersPage.tsx` (next to the existing role
dropdown), using `src/features/admin/hooks/useUpdateVerifiedTeacher.ts`. Setting this column
is enforced admin-only at the DB layer twice over: the existing `users_update_admin` RLS
policy, and a `BEFORE UPDATE` trigger (`protect_privileged_columns`) that silently reverts
any non-admin attempt to change it — see
`supabase/migrations/20260722000000_discovery_and_trust.sql`.
