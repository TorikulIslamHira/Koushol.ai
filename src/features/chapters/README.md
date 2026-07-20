# features/chapters/

Despite the folder name (kept from before the Module/Topic restructure — renaming it is a
larger, purely-cosmetic diff not worth doing on its own), this holds topic-level content:
reading a topic and its media, and the teacher-side topic editor pieces.

Student-facing: `TopicReader` (content display), `TopicTabs` (topic switcher within the
current module — topics don't gate individually, only the module's quiz does),
`useTopicAudio` + `AudioPlayer` (generated TTS playback), `useTopicVideo` +
`TopicVideoPlayer` (Phase 14 — resolves a short-lived signed URL for the topic's video,
since the `topic-videos` Storage bucket is private and RLS-gated the same way topic content is).

Teacher-facing (authoring, RLS owner/admin-only): `useTopicMutations` (create/update/
delete/reorder — always keeps `order_index` contiguous within a module), `TopicEditorList`
(reorder/delete/add), `TopicForm` (edit title/content), `useGenerateTopicAudio` +
`GenerateAudioPanel` (Phase 4 — calls the Sarvam TTS Edge Function, teacher picks the
target language explicitly), `useTopicVideo` + `VideoPanel` (Phase 14 — upload/replace/
remove, client-side size/type guardrail before upload).

Topic content itself comes from `features/courses/useCourse`; this folder is specifically
the reading/media/authoring experience once you're on a topic.
