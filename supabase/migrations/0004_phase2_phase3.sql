-- Phase 2/3: notifications, readiness aggregation, recommendations, calendar invites.
create type public.notification_type as enum ('application_status','interview_invite');
create table public.notifications (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  type public.notification_type not null, title text not null, body text not null, read_at timestamptz,
  application_id uuid references public.applications(id) on delete cascade, created_at timestamptz not null default now()
);
create table public.interview_invites (
  id uuid primary key default gen_random_uuid(), application_id uuid not null references public.applications(id) on delete cascade,
  recruiter_id uuid not null references public.profiles(id) on delete cascade, candidate_id uuid not null references public.profiles(id) on delete cascade,
  starts_at timestamptz not null, duration_minutes integer not null default 45 check (duration_minutes between 15 and 180),
  meeting_url text, notes text, created_at timestamptz not null default now()
);
create index notifications_user_created_idx on public.notifications(user_id, created_at desc);
create index interview_invites_candidate_idx on public.interview_invites(candidate_id, starts_at);
alter table public.notifications enable row level security;
alter table public.interview_invites enable row level security;
create policy "user reads own notifications" on public.notifications for select using (user_id = auth.uid());
create policy "authorized actors create notifications" on public.notifications for insert with check (
  user_id = auth.uid()
  or exists (select 1 from public.applications a join public.jobs j on j.id = a.job_id join public.companies c on c.id = j.company_id where a.id = application_id and c.recruiter_id = auth.uid())
);
create policy "user marks own notifications" on public.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "invite participant access" on public.interview_invites for select using (recruiter_id = auth.uid() or candidate_id = auth.uid());
create policy "recruiter creates invite" on public.interview_invites for insert with check (recruiter_id = auth.uid());
create policy "recruiter updates own invite" on public.interview_invites for update using (recruiter_id = auth.uid()) with check (recruiter_id = auth.uid());
