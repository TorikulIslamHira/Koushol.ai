-- What: Adds courses.raw_notes — the teacher's original unstructured notes, kept so the
--       AI course-generation flow (Phase 3) doesn't force retyping on a regenerate/edit pass.
-- Why:  supabase/functions/generate-course reads/writes this column; the teacher-authoring
--       UI (src/pages/CourseEditorPage.tsx) shows it as the input to "Generate with AI".
-- Depends on: 20260719010100_create_courses.sql.

alter table public.courses
  add column raw_notes text;

comment on column public.courses.raw_notes is
  'Teacher''s original raw topic notes, used as input for AI course generation (Phase 3). Null until the teacher first uses Generate with AI.';
