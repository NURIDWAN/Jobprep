create extension if not exists pgcrypto;

create type public.user_role as enum ('job_seeker', 'recruiter');
create type public.job_level as enum ('entry', 'mid', 'senior', 'lead');
create type public.work_type as enum ('remote', 'hybrid', 'onsite');
create type public.job_status as enum ('draft', 'published', 'closed');
create type public.application_status as enum ('new', 'reviewed', 'interview', 'rejected', 'accepted');
create type public.interview_status as enum ('in_progress', 'completed');
create type public.question_category as enum ('behavioral', 'technical', 'situational');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'job_seeker',
  name text not null,
  email text not null,
  bio text,
  cv_url text,
  created_at timestamptz not null default now()
);
create table public.companies (
  id uuid primary key default gen_random_uuid(), recruiter_id uuid not null references public.profiles(id) on delete cascade,
  name text not null, description text, logo_url text, created_at timestamptz not null default now()
);
create table public.jobs (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
  title text not null, description text not null, qualifications text not null, level public.job_level not null,
  industry text not null, location text not null, work_type public.work_type not null, salary_min integer, salary_max integer,
  status public.job_status not null default 'published', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.applications (
  id uuid primary key default gen_random_uuid(), job_id uuid not null references public.jobs(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade, cv_url text not null, cover_letter text,
  status public.application_status not null default 'new', created_at timestamptz not null default now(), unique(job_id, user_id)
);
create table public.interview_sessions (
  id uuid primary key default gen_random_uuid(), job_id uuid not null references public.jobs(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade, status public.interview_status not null default 'in_progress',
  summary_feedback jsonb, created_at timestamptz not null default now()
);
create table public.interview_questions (
  id uuid primary key default gen_random_uuid(), session_id uuid not null references public.interview_sessions(id) on delete cascade,
  question text not null, category public.question_category not null, ordering integer not null
);
create table public.interview_answers (
  id uuid primary key default gen_random_uuid(), question_id uuid not null references public.interview_questions(id) on delete cascade,
  answer_text text not null, score jsonb, feedback_ai jsonb, created_at timestamptz not null default now(), unique(question_id)
);

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.jobs enable row level security;
alter table public.applications enable row level security;
alter table public.interview_sessions enable row level security;
alter table public.interview_questions enable row level security;
alter table public.interview_answers enable row level security;

create policy "profiles own read" on public.profiles for select using (id = auth.uid());
create policy "profiles own update" on public.profiles for update using (id = auth.uid());
create policy "companies public read" on public.companies for select using (true);
create policy "recruiter manages companies" on public.companies for all using (recruiter_id = auth.uid()) with check (recruiter_id = auth.uid());
create policy "published jobs public read" on public.jobs for select using (status = 'published' or company_id in (select id from public.companies where recruiter_id = auth.uid()));
create policy "recruiter manages jobs" on public.jobs for all using (company_id in (select id from public.companies where recruiter_id = auth.uid())) with check (company_id in (select id from public.companies where recruiter_id = auth.uid()));
create policy "application owner or recruiter read" on public.applications for select using (user_id = auth.uid() or job_id in (select j.id from public.jobs j join public.companies c on c.id = j.company_id where c.recruiter_id = auth.uid()));
create policy "job seeker creates application" on public.applications for insert with check (user_id = auth.uid());
create policy "recruiter updates application" on public.applications for update using (job_id in (select j.id from public.jobs j join public.companies c on c.id = j.company_id where c.recruiter_id = auth.uid()));
create policy "session owner access" on public.interview_sessions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "question session owner access" on public.interview_questions for all using (session_id in (select id from public.interview_sessions where user_id = auth.uid())) with check (session_id in (select id from public.interview_sessions where user_id = auth.uid()));
create policy "answer owner access" on public.interview_answers for all using (question_id in (select q.id from public.interview_questions q join public.interview_sessions s on s.id = q.session_id where s.user_id = auth.uid())) with check (question_id in (select q.id from public.interview_questions q join public.interview_sessions s on s.id = q.session_id where s.user_id = auth.uid()));

insert into storage.buckets (id, name, public) values ('cvs', 'cvs', false) on conflict (id) do nothing;
create policy "users manage own cvs" on storage.objects for all using (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text) with check (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text);
