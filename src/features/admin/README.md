# features/admin/

Platform-wide, admin-only data: `useAdminStats` (user/course/enrollment counts), `useAllUsers` + `useUpdateUserRole` (user management — the only path to becoming a teacher/admin, no self-service), and `useAdminCourses` (course review queue, filterable by status).

RLS already restricts every query here to admin callers (see the admin policies in `supabase/migrations/`) — these hooks don't duplicate that check, same principle as `features/teacher`-style hooks relying on owner/admin RLS instead of a separate authorization layer.

Approving/rejecting a course reuses `features/courses/hooks/useCourseMutations` rather than a separate admin-only mutation — the RLS split in `20260719040000_course_publish_approval.sql` is what actually makes `updateCourse({ status: 'published' })` work for an admin and fail for a teacher, not a code-level branch.
