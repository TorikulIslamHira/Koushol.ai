-- What: Creates public.sales (a payment record for a student enrolling in a paid course).
-- Why:  Data model placeholder for Phase 6 (bKash/Nagad/SSLCommerz). No payment provider is
--       wired up yet, so this migration only creates the table + locked-down RLS.
-- Depends on: 20260719010100_create_courses.sql.

create type public.payment_provider as enum ('bkash', 'nagad', 'sslcommerz');
create type public.sale_status as enum ('pending', 'completed', 'failed', 'refunded');

create table public.sales (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  student_id uuid not null references public.users (id) on delete cascade,
  amount numeric(10, 2) not null check (amount >= 0),
  payment_provider public.payment_provider not null,
  status public.sale_status not null default 'pending',
  created_at timestamptz not null default now()
);

create index sales_course_id_idx on public.sales (course_id);
create index sales_student_id_idx on public.sales (student_id);

alter table public.sales enable row level security;

create policy "sales_select_own" on public.sales
  for select to authenticated
  using (student_id = auth.uid());

create policy "sales_select_teacher_or_admin" on public.sales
  for select to authenticated
  using (
    public.current_user_role() = 'admin'
    or exists (
      select 1 from public.courses c
      where c.id = sales.course_id and c.teacher_id = auth.uid()
    )
  );

-- No self-service insert: real payments will be written by a server-side
-- webhook handler (service role, bypasses RLS) once Phase 6 wires up a provider.
create policy "sales_insert_admin" on public.sales
  for insert to authenticated
  with check (public.current_user_role() = 'admin');
