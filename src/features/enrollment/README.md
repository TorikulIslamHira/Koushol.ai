# features/enrollment/

Everything about a student joining a course and tracking where they are in it: `useEnrollment` (single course), `useMyEnrollments` (dashboard list), and the `EnrollButton` CTA.

`enrollments.unlocked_chapter_index` is the source of truth for how far a student can go — see `supabase/migrations/20260719010300_create_enrollments.sql`.
