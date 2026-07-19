-- Local development seed data — inserted by `supabase db reset` / `supabase start`.
-- NEVER run this against a production project: it creates a demo auth user with a
-- throwaway password, purely so the Phase 1 student flow (browse -> enroll -> read
-- -> quiz -> unlock) has something real to click through end to end.

-- Demo teacher account (login: teacher.demo@koushol.ai / demo-password-not-for-prod).
-- Inserting into auth.users directly only works with local Postgres superuser access
-- (as `supabase db reset` has) — the handle_new_auth_user trigger from
-- 20260719010000_create_users.sql fires and creates the matching public.users row.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, last_sign_in_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) values (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-1111-1111-111111111111',
  'authenticated',
  'authenticated',
  'teacher.demo@koushol.ai',
  crypt('demo-password-not-for-prod', gen_salt('bf')),
  now(), now(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Demo Teacher"}',
  now(), now(), '', '', '', ''
);

update public.users set role = 'teacher' where id = '11111111-1111-1111-1111-111111111111';

-- Course 1: Bangla Grammar Basics (1 module, 3 topics)
insert into public.courses (id, teacher_id, title, description, status, price) values (
  '22222222-2222-2222-2222-222222222221',
  '11111111-1111-1111-1111-111111111111',
  'Bangla Grammar Basics',
  'A beginner-friendly walkthrough of core Bangla grammar: parts of speech, sentence structure, and common mistakes.',
  'published',
  499
);

insert into public.modules (id, course_id, order_index, title) values
  ('44444444-4444-4444-4444-444444444441', '22222222-2222-2222-2222-222222222221', 0, 'Grammar Fundamentals');

insert into public.topics (id, module_id, order_index, title, content) values
  ('33333333-3333-3333-3333-333333333311', '44444444-4444-4444-4444-444444444441', 0, 'Parts of Speech',
   E'Bangla, like English, builds sentences from a handful of word categories: noun (বিশেষ্য), pronoun (সর্বনাম), verb (ক্রিয়া), adjective (বিশেষণ), and adverb (ক্রিয়া বিশেষণ).\n\nIn this topic we look at how to spot each one in a sentence and why the category matters for word order later on.'),
  ('33333333-3333-3333-3333-333333333312', '44444444-4444-4444-4444-444444444441', 1, 'Sentence Structure',
   E'Bangla is a Subject-Object-Verb (SOV) language, unlike English''s Subject-Verb-Object order.\n\nExample: "আমি ভাত খাই" (I rice eat) vs English "I eat rice." This topic covers how SOV order shapes everyday sentences.'),
  ('33333333-3333-3333-3333-333333333313', '44444444-4444-4444-4444-444444444441', 2, 'Common Mistakes',
   E'The most frequent beginner mistakes: mixing up সে (he/she) gender-neutral pronoun usage, verb tense agreement, and formal vs informal address (তুমি vs আপনি).');

insert into public.quizzes (module_id, questions) values
  ('44444444-4444-4444-4444-444444444441', '[
    {"question": "Which word category is বিশেষ্য?", "options": ["Verb", "Noun", "Adjective", "Adverb"], "correct_index": 1},
    {"question": "Which word category describes a noun?", "options": ["বিশেষণ (Adjective)", "ক্রিয়া (Verb)", "সর্বনাম (Pronoun)", "None"], "correct_index": 0},
    {"question": "What word order does Bangla typically use?", "options": ["SVO", "SOV", "VSO", "OVS"], "correct_index": 1},
    {"question": "In \"আমি ভাত খাই\", which word is the verb?", "options": ["আমি", "ভাত", "খাই", "None"], "correct_index": 2},
    {"question": "Which pronoun is the formal \"you\" in Bangla?", "options": ["তুমি", "আপনি", "সে", "তারা"], "correct_index": 1}
  ]'::jsonb);

-- Course 2: Intro to Digital Marketing (1 module, 2 topics)
insert into public.courses (id, teacher_id, title, description, status, price) values (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'Intro to Digital Marketing',
  'The fundamentals of running a small business marketing campaign online: channels, targeting, and measuring results.',
  'published',
  899
);

insert into public.modules (id, course_id, order_index, title) values
  ('44444444-4444-4444-4444-444444444442', '22222222-2222-2222-2222-222222222222', 0, 'Marketing Basics');

insert into public.topics (id, module_id, order_index, title, content) values
  ('33333333-3333-3333-3333-333333333321', '44444444-4444-4444-4444-444444444442', 0, 'Marketing Channels',
   E'Social media, search, email, and word-of-mouth are the four channels most small businesses start with. This topic breaks down when to use each one.'),
  ('33333333-3333-3333-3333-333333333322', '44444444-4444-4444-4444-444444444442', 1, 'Targeting Your Audience',
   E'Before spending a single taka on ads, define who you''re talking to: age, location, interests, and buying stage. This topic walks through building a simple audience profile.');

insert into public.quizzes (module_id, questions) values
  ('44444444-4444-4444-4444-444444444442', '[
    {"question": "Which of these is a marketing channel?", "options": ["Email", "Invoice", "Payroll", "Tax filing"], "correct_index": 0},
    {"question": "What should you define before spending on ads?", "options": ["Office rent", "Target audience", "Logo color", "None of these"], "correct_index": 1}
  ]'::jsonb);
