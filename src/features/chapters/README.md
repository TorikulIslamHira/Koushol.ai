# features/chapters/

Student-facing: reading a chapter and tracking progress — `ChapterReader` (content display), `ChapterSidebar` (lock-aware nav), and `useChapterProgress` (a student's quiz_score/completed_at for one chapter).

Teacher-facing (authoring, RLS owner/admin-only): `useChapterMutations` (create/update/delete/reorder — always keeps `order_index` contiguous, since the student unlock logic depends on that), `ChapterEditorList` (reorder/delete/add), and `ChapterForm` (edit title/content).

Chapter *content* comes from `features/courses/useCourse`; this folder is specifically the reading/progress/authoring experience once you're on a chapter.
