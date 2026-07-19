# features/chapters/

Student-facing: reading a chapter and tracking progress — `ChapterReader` (content display), `ChapterSidebar` (lock-aware nav), `useChapterProgress` (a student's quiz_score/completed_at for one chapter), `useChapterAudio` (fetches generated TTS, if any) and `AudioPlayer` (plays it back segment-by-segment).

Teacher-facing (authoring, RLS owner/admin-only): `useChapterMutations` (create/update/delete/reorder — always keeps `order_index` contiguous, since the student unlock logic depends on that), `ChapterEditorList` (reorder/delete/add), `ChapterForm` (edit title/content), `useGenerateChapterAudio` + `GenerateAudioPanel` (Phase 4 — calls the Sarvam TTS Edge Function, teacher picks the target language explicitly).

Chapter *content* comes from `features/courses/useCourse`; this folder is specifically the reading/progress/authoring experience once you're on a chapter.
