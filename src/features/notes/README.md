# features/notes

Private per-topic notes for students — the "notes/bookmarks" slice of Phase 11 (the rest of
that phase — discussion Q&A, streaks/badges, leaderboard, practice mode, study-time tracking
— is deferred to a later pass).

- `hooks/useTopicNote.ts` — reads/upserts the current student's own note for a topic. RLS
  restricts every operation to the owning student — unlike most tables in this project,
  there's no teacher/admin read policy here, since notes are a private study aid, not a
  public or moderated feature. See `supabase/migrations/20260724000000_topic_notes.sql`.
- `components/TopicNotes.tsx` — the note-taking panel shown on `ModulePage`, explicit save
  (no autosave), same pattern as reviews/bio editing elsewhere in this app.
