-- What: Creates public.chapter_audio (one row per chapter, holding generated TTS audio).
-- Why:  Phase 4 "listen to this course" feature. Kept as its own table (not a column on
--       chapters) so audio payloads never ride along with ordinary chapter reads/writes —
--       every existing `chapters` select('*') in the codebase would otherwise start
--       fetching multi-hundred-KB base64 blobs it doesn't need. RLS mirrors the quizzes
--       table's visibility rule (see 20260719010400_create_quizzes.sql) since audio is the
--       same kind of optional 1:1 companion data for a chapter.
-- Depends on: 20260719010200_create_chapters.sql, 20260719010300_create_enrollments.sql.

create table public.chapter_audio (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters (id) on delete cascade unique,
  -- Sarvam's TTS API caps input length per request, so long chapter content is split into
  -- segments; each element is {audio_base64, mime_type}, played back in order by the
  -- frontend (src/features/chapters/components/AudioPlayer.tsx).
  segments jsonb not null default '[]'::jsonb,
  language_code text not null,
  generated_at timestamptz not null default now()
);

create index chapter_audio_chapter_id_idx on public.chapter_audio (chapter_id);

alter table public.chapter_audio enable row level security;

create policy "chapter_audio_select_free_preview" on public.chapter_audio
  for select
  using (
    exists (
      select 1 from public.chapters ch
      join public.courses c on c.id = ch.course_id
      where ch.id = chapter_audio.chapter_id and ch.order_index = 0 and c.status = 'published'
    )
  );

create policy "chapter_audio_select_enrolled" on public.chapter_audio
  for select to authenticated
  using (
    exists (
      select 1 from public.chapters ch
      join public.enrollments e on e.course_id = ch.course_id
      where ch.id = chapter_audio.chapter_id and e.student_id = auth.uid()
    )
  );

create policy "chapter_audio_select_owner_or_admin" on public.chapter_audio
  for select to authenticated
  using (
    public.current_user_role() = 'admin'
    or exists (
      select 1 from public.chapters ch
      join public.courses c on c.id = ch.course_id
      where ch.id = chapter_audio.chapter_id and c.teacher_id = auth.uid()
    )
  );

create policy "chapter_audio_insert_owner_or_admin" on public.chapter_audio
  for insert to authenticated
  with check (
    public.current_user_role() = 'admin'
    or exists (
      select 1 from public.chapters ch
      join public.courses c on c.id = ch.course_id
      where ch.id = chapter_audio.chapter_id and c.teacher_id = auth.uid()
    )
  );

create policy "chapter_audio_update_owner_or_admin" on public.chapter_audio
  for update to authenticated
  using (
    public.current_user_role() = 'admin'
    or exists (
      select 1 from public.chapters ch
      join public.courses c on c.id = ch.course_id
      where ch.id = chapter_audio.chapter_id and c.teacher_id = auth.uid()
    )
  )
  with check (
    public.current_user_role() = 'admin'
    or exists (
      select 1 from public.chapters ch
      join public.courses c on c.id = ch.course_id
      where ch.id = chapter_audio.chapter_id and c.teacher_id = auth.uid()
    )
  );

create policy "chapter_audio_delete_owner_or_admin" on public.chapter_audio
  for delete to authenticated
  using (
    public.current_user_role() = 'admin'
    or exists (
      select 1 from public.chapters ch
      join public.courses c on c.id = ch.course_id
      where ch.id = chapter_audio.chapter_id and c.teacher_id = auth.uid()
    )
  );
