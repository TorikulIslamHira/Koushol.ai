-- What: Restructures course content from a flat chapters list into Course -> Modules -> Topics,
--       with one quiz per Module (was one quiz per chapter). Renames chapter_progress ->
--       module_progress, chapter_audio -> topic_audio, enrollments.unlocked_chapter_index ->
--       unlocked_module_index, and drops courses.raw_notes (the course-level "Generate with
--       AI from raw notes" flow is removed in this same change).
-- Why:  Teacher wants a "real course builder" structure: name the course, add Modules, add
--       several hand-written Topics per Module, then let AI draft a quiz for that Module from
--       its topics' content (see supabase/functions/generate-module-quiz, added separately).
--       A student reads every topic in an unlocked module freely (no per-topic gating) and
--       takes the module's quiz to unlock the next module.
-- Depends on: 20260719010200_create_chapters.sql, 20260719010300_create_enrollments.sql,
--       20260719010400_create_quizzes.sql, 20260719010500_create_chapter_progress.sql,
--       20260719020000_add_courses_raw_notes.sql, 20260719030000_create_chapter_audio.sql.
--
-- Data migration note: this project has one real course ("zero to hero html", 9 chapters) and
-- one teacher account, so the blast radius is small, but the heuristic below is still worth
-- recording. For every existing course: its chapters become topics under one auto-created
-- "Module 1"; its N per-chapter quizzes are merged (concatenated, in chapter order) into that
-- module's single quiz, which is lossless for quiz content. A student's
-- unlocked_chapter_index only maps cleanly onto unlocked_module_index at the two extremes (not
-- started vs. finished every chapter) -- a student who was only partway through will need to
-- (re)take the merged module quiz to advance, even if they'd already passed some individual
-- chapter quizzes. Acceptable given there's no real student progress data yet.

-- ============================================================================
-- 1. modules table (new)
-- ============================================================================

create table public.modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  order_index integer not null check (order_index >= 0),
  title text not null,
  unique (course_id, order_index)
);

create index modules_course_id_idx on public.modules (course_id);

alter table public.modules enable row level security;

create policy "modules_select_free_preview" on public.modules
  for select
  using (
    order_index = 0
    and exists (
      select 1 from public.courses c
      where c.id = modules.course_id and c.status = 'published'
    )
  );

create policy "modules_select_enrolled" on public.modules
  for select to authenticated
  using (
    exists (
      select 1 from public.enrollments e
      where e.course_id = modules.course_id and e.student_id = auth.uid()
    )
  );

create policy "modules_select_owner_or_admin" on public.modules
  for select to authenticated
  using (
    public.current_user_role() = 'admin'
    or exists (
      select 1 from public.courses c
      where c.id = modules.course_id and c.teacher_id = auth.uid()
    )
  );

create policy "modules_insert_owner_or_admin" on public.modules
  for insert to authenticated
  with check (
    public.current_user_role() = 'admin'
    or exists (
      select 1 from public.courses c
      where c.id = modules.course_id and c.teacher_id = auth.uid()
    )
  );

create policy "modules_update_owner_or_admin" on public.modules
  for update to authenticated
  using (
    public.current_user_role() = 'admin'
    or exists (
      select 1 from public.courses c
      where c.id = modules.course_id and c.teacher_id = auth.uid()
    )
  )
  with check (
    public.current_user_role() = 'admin'
    or exists (
      select 1 from public.courses c
      where c.id = modules.course_id and c.teacher_id = auth.uid()
    )
  );

create policy "modules_delete_owner_or_admin" on public.modules
  for delete to authenticated
  using (
    public.current_user_role() = 'admin'
    or exists (
      select 1 from public.courses c
      where c.id = modules.course_id and c.teacher_id = auth.uid()
    )
  );

-- ============================================================================
-- 2. Data migration: one "Module 1" per existing course, chapters repointed at it
-- ============================================================================

insert into public.modules (id, course_id, order_index, title)
select gen_random_uuid(), c.id, 0, 'Module 1'
from public.courses c
where exists (select 1 from public.chapters ch where ch.course_id = c.id);

alter table public.chapters add column module_id uuid references public.modules (id) on delete cascade;

update public.chapters ch
set module_id = m.id
from public.modules m
where m.course_id = ch.course_id and m.order_index = 0;

-- ============================================================================
-- 3. chapters -> topics
-- ============================================================================

alter table public.chapters drop constraint chapters_course_id_order_index_key;
alter table public.chapters alter column module_id set not null;
alter table public.chapters drop column course_id;
alter table public.chapters drop column is_ai_generated;
alter table public.chapters add constraint topics_module_id_order_index_key unique (module_id, order_index);

alter table public.chapters rename to topics;
alter index chapters_pkey rename to topics_pkey;
create index topics_module_id_idx on public.topics (module_id);

drop policy "chapters_select_free_preview" on public.topics;
drop policy "chapters_select_owner_or_admin" on public.topics;
drop policy "chapters_select_enrolled" on public.topics;
drop policy "chapters_insert_owner_or_admin" on public.topics;
drop policy "chapters_update_owner_or_admin" on public.topics;
drop policy "chapters_delete_owner_or_admin" on public.topics;

create policy "topics_select_free_preview" on public.topics
  for select
  using (
    order_index = 0
    and exists (
      select 1 from public.modules m
      join public.courses c on c.id = m.course_id
      where m.id = topics.module_id and m.order_index = 0 and c.status = 'published'
    )
  );

create policy "topics_select_enrolled" on public.topics
  for select to authenticated
  using (
    exists (
      select 1 from public.modules m
      join public.enrollments e on e.course_id = m.course_id
      where m.id = topics.module_id and e.student_id = auth.uid()
    )
  );

create policy "topics_select_owner_or_admin" on public.topics
  for select to authenticated
  using (
    public.current_user_role() = 'admin'
    or exists (
      select 1 from public.modules m
      join public.courses c on c.id = m.course_id
      where m.id = topics.module_id and c.teacher_id = auth.uid()
    )
  );

create policy "topics_insert_owner_or_admin" on public.topics
  for insert to authenticated
  with check (
    public.current_user_role() = 'admin'
    or exists (
      select 1 from public.modules m
      join public.courses c on c.id = m.course_id
      where m.id = topics.module_id and c.teacher_id = auth.uid()
    )
  );

create policy "topics_update_owner_or_admin" on public.topics
  for update to authenticated
  using (
    public.current_user_role() = 'admin'
    or exists (
      select 1 from public.modules m
      join public.courses c on c.id = m.course_id
      where m.id = topics.module_id and c.teacher_id = auth.uid()
    )
  )
  with check (
    public.current_user_role() = 'admin'
    or exists (
      select 1 from public.modules m
      join public.courses c on c.id = m.course_id
      where m.id = topics.module_id and c.teacher_id = auth.uid()
    )
  );

create policy "topics_delete_owner_or_admin" on public.topics
  for delete to authenticated
  using (
    public.current_user_role() = 'admin'
    or exists (
      select 1 from public.modules m
      join public.courses c on c.id = m.course_id
      where m.id = topics.module_id and c.teacher_id = auth.uid()
    )
  );

-- ============================================================================
-- 4. quizzes: chapter_id -> module_id (merge per-chapter quizzes into one per module)
-- ============================================================================

alter table public.quizzes add column module_id uuid references public.modules (id) on delete cascade;

with merged as (
  select t.module_id, jsonb_agg(elem.value order by t.order_index, elem.ord) as questions
  from public.quizzes quiz
  join public.topics t on t.id = quiz.chapter_id
  cross join lateral jsonb_array_elements(quiz.questions) with ordinality as elem(value, ord)
  group by t.module_id
)
insert into public.quizzes (id, module_id, questions)
select gen_random_uuid(), merged.module_id, merged.questions
from merged;

delete from public.quizzes where module_id is null;

alter table public.quizzes alter column module_id set not null;
alter table public.quizzes add constraint quizzes_module_id_key unique (module_id);
alter table public.quizzes drop column chapter_id;
drop index if exists quizzes_chapter_id_idx;
create index quizzes_module_id_idx on public.quizzes (module_id);

drop policy "quizzes_select_free_preview" on public.quizzes;
drop policy "quizzes_select_enrolled" on public.quizzes;
drop policy "quizzes_select_owner_or_admin" on public.quizzes;
drop policy "quizzes_insert_owner_or_admin" on public.quizzes;
drop policy "quizzes_update_owner_or_admin" on public.quizzes;
drop policy "quizzes_delete_owner_or_admin" on public.quizzes;

create policy "quizzes_select_free_preview" on public.quizzes
  for select
  using (
    exists (
      select 1 from public.modules m
      join public.courses c on c.id = m.course_id
      where m.id = quizzes.module_id and m.order_index = 0 and c.status = 'published'
    )
  );

create policy "quizzes_select_enrolled" on public.quizzes
  for select to authenticated
  using (
    exists (
      select 1 from public.modules m
      join public.enrollments e on e.course_id = m.course_id
      where m.id = quizzes.module_id and e.student_id = auth.uid()
    )
  );

create policy "quizzes_select_owner_or_admin" on public.quizzes
  for select to authenticated
  using (
    public.current_user_role() = 'admin'
    or exists (
      select 1 from public.modules m
      join public.courses c on c.id = m.course_id
      where m.id = quizzes.module_id and c.teacher_id = auth.uid()
    )
  );

create policy "quizzes_insert_owner_or_admin" on public.quizzes
  for insert to authenticated
  with check (
    public.current_user_role() = 'admin'
    or exists (
      select 1 from public.modules m
      join public.courses c on c.id = m.course_id
      where m.id = quizzes.module_id and c.teacher_id = auth.uid()
    )
  );

create policy "quizzes_update_owner_or_admin" on public.quizzes
  for update to authenticated
  using (
    public.current_user_role() = 'admin'
    or exists (
      select 1 from public.modules m
      join public.courses c on c.id = m.course_id
      where m.id = quizzes.module_id and c.teacher_id = auth.uid()
    )
  )
  with check (
    public.current_user_role() = 'admin'
    or exists (
      select 1 from public.modules m
      join public.courses c on c.id = m.course_id
      where m.id = quizzes.module_id and c.teacher_id = auth.uid()
    )
  );

create policy "quizzes_delete_owner_or_admin" on public.quizzes
  for delete to authenticated
  using (
    public.current_user_role() = 'admin'
    or exists (
      select 1 from public.modules m
      join public.courses c on c.id = m.course_id
      where m.id = quizzes.module_id and c.teacher_id = auth.uid()
    )
  );

-- ============================================================================
-- 5. enrollments: unlocked_chapter_index -> unlocked_module_index
-- ============================================================================

alter table public.enrollments rename column unlocked_chapter_index to unlocked_module_index;

with chapter_counts as (
  select t.module_id, count(*) as chapter_count
  from public.topics t
  group by t.module_id
),
course_chapter_counts as (
  select m.course_id, sum(cc.chapter_count) as chapter_count
  from public.modules m
  join chapter_counts cc on cc.module_id = m.id
  group by m.course_id
)
update public.enrollments e
set unlocked_module_index = case
  when e.unlocked_module_index >= coalesce(ccc.chapter_count, 0) and ccc.chapter_count > 0 then 1
  else 0
end
from course_chapter_counts ccc
where ccc.course_id = e.course_id;

-- ============================================================================
-- 6. chapter_progress -> module_progress (only for students who finished every chapter)
-- ============================================================================

create table public.module_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.users (id) on delete cascade,
  module_id uuid not null references public.modules (id) on delete cascade,
  quiz_score numeric(5, 2) check (quiz_score is null or (quiz_score >= 0 and quiz_score <= 100)),
  completed_at timestamptz,
  unique (student_id, module_id)
);

create index module_progress_student_id_idx on public.module_progress (student_id);
create index module_progress_module_id_idx on public.module_progress (module_id);

insert into public.module_progress (student_id, module_id, quiz_score, completed_at)
select
  cp.student_id,
  t.module_id,
  avg(cp.quiz_score) filter (where cp.completed_at is not null),
  max(cp.completed_at)
from public.chapter_progress cp
join public.topics t on t.id = cp.chapter_id
join public.modules m on m.id = t.module_id
join public.enrollments e on e.course_id = m.course_id and e.student_id = cp.student_id
where e.unlocked_module_index >= 1
group by cp.student_id, t.module_id
having bool_and(cp.completed_at is not null);

drop table public.chapter_progress;

alter table public.module_progress enable row level security;

create policy "module_progress_select_own" on public.module_progress
  for select to authenticated
  using (student_id = auth.uid());

create policy "module_progress_select_teacher_or_admin" on public.module_progress
  for select to authenticated
  using (
    public.current_user_role() = 'admin'
    or exists (
      select 1 from public.modules m
      join public.courses c on c.id = m.course_id
      where m.id = module_progress.module_id and c.teacher_id = auth.uid()
    )
  );

create policy "module_progress_insert_own" on public.module_progress
  for insert to authenticated
  with check (
    student_id = auth.uid()
    and exists (
      select 1 from public.modules m
      join public.enrollments e on e.course_id = m.course_id
      where m.id = module_progress.module_id and e.student_id = auth.uid()
    )
  );

create policy "module_progress_update_own" on public.module_progress
  for update to authenticated
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

-- ============================================================================
-- 7. chapter_audio -> topic_audio
-- ============================================================================

alter table public.chapter_audio rename column chapter_id to topic_id;
alter table public.chapter_audio rename to topic_audio;
alter index chapter_audio_pkey rename to topic_audio_pkey;
drop index if exists chapter_audio_chapter_id_idx;
create index topic_audio_topic_id_idx on public.topic_audio (topic_id);

drop policy "chapter_audio_select_free_preview" on public.topic_audio;
drop policy "chapter_audio_select_enrolled" on public.topic_audio;
drop policy "chapter_audio_select_owner_or_admin" on public.topic_audio;
drop policy "chapter_audio_insert_owner_or_admin" on public.topic_audio;
drop policy "chapter_audio_update_owner_or_admin" on public.topic_audio;
drop policy "chapter_audio_delete_owner_or_admin" on public.topic_audio;

create policy "topic_audio_select_free_preview" on public.topic_audio
  for select
  using (
    exists (
      select 1 from public.topics t
      join public.modules m on m.id = t.module_id
      join public.courses c on c.id = m.course_id
      where t.id = topic_audio.topic_id
        and t.order_index = 0 and m.order_index = 0 and c.status = 'published'
    )
  );

create policy "topic_audio_select_enrolled" on public.topic_audio
  for select to authenticated
  using (
    exists (
      select 1 from public.topics t
      join public.modules m on m.id = t.module_id
      join public.enrollments e on e.course_id = m.course_id
      where t.id = topic_audio.topic_id and e.student_id = auth.uid()
    )
  );

create policy "topic_audio_select_owner_or_admin" on public.topic_audio
  for select to authenticated
  using (
    public.current_user_role() = 'admin'
    or exists (
      select 1 from public.topics t
      join public.modules m on m.id = t.module_id
      join public.courses c on c.id = m.course_id
      where t.id = topic_audio.topic_id and c.teacher_id = auth.uid()
    )
  );

create policy "topic_audio_insert_owner_or_admin" on public.topic_audio
  for insert to authenticated
  with check (
    public.current_user_role() = 'admin'
    or exists (
      select 1 from public.topics t
      join public.modules m on m.id = t.module_id
      join public.courses c on c.id = m.course_id
      where t.id = topic_audio.topic_id and c.teacher_id = auth.uid()
    )
  );

create policy "topic_audio_update_owner_or_admin" on public.topic_audio
  for update to authenticated
  using (
    public.current_user_role() = 'admin'
    or exists (
      select 1 from public.topics t
      join public.modules m on m.id = t.module_id
      join public.courses c on c.id = m.course_id
      where t.id = topic_audio.topic_id and c.teacher_id = auth.uid()
    )
  )
  with check (
    public.current_user_role() = 'admin'
    or exists (
      select 1 from public.topics t
      join public.modules m on m.id = t.module_id
      join public.courses c on c.id = m.course_id
      where t.id = topic_audio.topic_id and c.teacher_id = auth.uid()
    )
  );

create policy "topic_audio_delete_owner_or_admin" on public.topic_audio
  for delete to authenticated
  using (
    public.current_user_role() = 'admin'
    or exists (
      select 1 from public.topics t
      join public.modules m on m.id = t.module_id
      join public.courses c on c.id = m.course_id
      where t.id = topic_audio.topic_id and c.teacher_id = auth.uid()
    )
  );

-- ============================================================================
-- 8. courses.raw_notes dropped (course-level "Generate with AI from raw notes" removed)
-- ============================================================================

alter table public.courses drop column raw_notes;
