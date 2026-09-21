-- P3 candidate preferences, recommendation interactions, readiness snapshots, analytics.
create table public.candidate_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  skills text[] not null default '{}', industries text[] not null default '{}', preferred_locations text[] not null default '{}',
  preferred_work_types public.work_type[] not null default '{}', preferred_levels public.job_level[] not null default '{}', updated_at timestamptz not null default now()
);
create table public.recommendation_interactions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade, interaction text not null check (interaction in ('view','save','apply','dismiss')),
  created_at timestamptz not null default now()
);
create table public.analytics_events (
  id uuid primary key default gen_random_uuid(), user_id uuid references public.profiles(id) on delete set null,
  event_name text not null, properties jsonb not null default '{}', created_at timestamptz not null default now()
);
create index recommendation_interactions_user_idx on public.recommendation_interactions(user_id, created_at desc);
create index analytics_events_name_idx on public.analytics_events(event_name, created_at desc);
alter table public.candidate_preferences enable row level security;
alter table public.recommendation_interactions enable row level security;
alter table public.analytics_events enable row level security;
create policy "candidate manages own preferences" on public.candidate_preferences for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "candidate manages own recommendation interactions" on public.recommendation_interactions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users create own analytics" on public.analytics_events for insert with check (user_id = auth.uid() or user_id is null);
create policy "users read own analytics" on public.analytics_events for select using (user_id = auth.uid());
