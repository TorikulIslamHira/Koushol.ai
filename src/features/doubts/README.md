# features/doubts

AI doubt-solving assistant — a student can ask questions about a topic's content and get an
answer, scoped to that topic only (not a general-purpose chatbot). The first *conversational*
AI feature in this app; every earlier one (Phase 3's quiz generation, Phase 4's TTS) is
one-shot and naturally self-limiting, so this is also the first one needing an explicit
per-topic message cap rather than just a per-call token cap — see
`supabase/functions/ask-topic-doubt/index.ts`'s `MAX_MESSAGES_PER_TOPIC`.

- `hooks/useTopicChat.ts` — reads a student's own conversation for a topic (own-row-only
  RLS, no teacher/admin visibility — a private study aid) and saves both the question and
  the answer around calling the stateless Edge Function.
- `components/TopicDoubtChat.tsx` — the chat UI on `ModulePage`, shown only when
  `enrollment` is truthy — unlike reading content, this costs a real Groq call per message,
  so it's not offered on the free-preview topic to signed-out visitors.
