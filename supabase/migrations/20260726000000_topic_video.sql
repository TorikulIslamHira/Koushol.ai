-- What: Adds a private Storage bucket for topic videos, RLS on storage.objects mirroring
--       topic_audio's exact visibility rules, and a topics.video_path column.
-- Why:  Phase 14 (see PROJECT.md Section 8) — optional video per topic, uploaded by the
--       teacher and playable by whoever can already read that topic's content.
-- Depends on: 20260719050000_restructure_modules_topics.sql (topics, modules, courses,
--       enrollments; the exact policy shape this mirrors is topic_audio's).
--
-- The bucket MUST be private (public = false) — a public Storage bucket serves any object
-- to anyone via its public URL with no RLS check at all, which would break the
-- free-preview/enrolled/owner-admin visibility model every other topic-scoped table in
-- this project enforces. Object path convention: '{topic_id}/{filename}' — RLS predicates
-- extract the topic id via (storage.foldername(name))[1]::uuid.

insert into storage.buckets (id, name, public)
values ('topic-videos', 'topic-videos', false);

alter table public.topics add column video_path text;

create policy "topic_videos_select_free_preview" on storage.objects
  for select
  using (
    bucket_id = 'topic-videos'
    and exists (
      select 1 from public.topics t
      join public.modules m on m.id = t.module_id
      join public.courses c on c.id = m.course_id
      where t.id = (storage.foldername(name))[1]::uuid
        and t.order_index = 0 and m.order_index = 0 and c.status = 'published'
    )
  );

create policy "topic_videos_select_enrolled" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'topic-videos'
    and exists (
      select 1 from public.topics t
      join public.modules m on m.id = t.module_id
      join public.enrollments e on e.course_id = m.course_id
      where t.id = (storage.foldername(name))[1]::uuid and e.student_id = auth.uid()
    )
  );

create policy "topic_videos_select_owner_or_admin" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'topic-videos'
    and (
      public.current_user_role() = 'admin'
      or exists (
        select 1 from public.topics t
        join public.modules m on m.id = t.module_id
        join public.courses c on c.id = m.course_id
        where t.id = (storage.foldername(name))[1]::uuid and c.teacher_id = auth.uid()
      )
    )
  );

create policy "topic_videos_insert_owner_or_admin" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'topic-videos'
    and (
      public.current_user_role() = 'admin'
      or exists (
        select 1 from public.topics t
        join public.modules m on m.id = t.module_id
        join public.courses c on c.id = m.course_id
        where t.id = (storage.foldername(name))[1]::uuid and c.teacher_id = auth.uid()
      )
    )
  );

create policy "topic_videos_update_owner_or_admin" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'topic-videos'
    and (
      public.current_user_role() = 'admin'
      or exists (
        select 1 from public.topics t
        join public.modules m on m.id = t.module_id
        join public.courses c on c.id = m.course_id
        where t.id = (storage.foldername(name))[1]::uuid and c.teacher_id = auth.uid()
      )
    )
  );

create policy "topic_videos_delete_owner_or_admin" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'topic-videos'
    and (
      public.current_user_role() = 'admin'
      or exists (
        select 1 from public.topics t
        join public.modules m on m.id = t.module_id
        join public.courses c on c.id = m.course_id
        where t.id = (storage.foldername(name))[1]::uuid and c.teacher_id = auth.uid()
      )
    )
  );
