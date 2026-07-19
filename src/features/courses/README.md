# features/courses/

Student-facing (read-only): `useCourses` (published catalog), `useCourse` (one course + its chapters), and the `CourseCard`/`CourseList` display components.

Teacher-facing (authoring, RLS owner/admin-only): `useMyCourses` (own courses, any status), `useCourseMutations` (create/update/delete/publish), `useCourseAnalytics` (enrollment count + per-chapter stats), and the `CourseForm` component.

Enrolling into a course lives in `features/enrollment/`, not here.
