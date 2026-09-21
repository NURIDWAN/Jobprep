-- Production hardening: idempotent email outbox, retries, and retention.
alter table public.email_outbox add column if not exists dedupe_key text;
alter table public.email_outbox add column if not exists attempts integer not null default 0;
alter table public.email_outbox add column if not exists next_attempt_at timestamptz not null default now();
alter table public.email_outbox add column if not exists last_error text;
create unique index if not exists email_outbox_dedupe_key_idx on public.email_outbox(dedupe_key) where dedupe_key is not null;
create index if not exists email_outbox_pending_idx on public.email_outbox(status, next_attempt_at);

create or replace function public.queue_application_status_notification()
returns trigger language plpgsql security definer set search_path = public as $$
declare candidate_email text; candidate_name text; job_title text; key text;
begin
  if old.status = new.status then return new; end if;
  select p.email, p.name into candidate_email, candidate_name from public.profiles p where p.id = new.user_id;
  select j.title into job_title from public.jobs j where j.id = new.job_id;
  key := 'application-status:' || new.id::text || ':' || new.status::text;
  insert into public.notifications(user_id, type, title, body, application_id)
  values (new.user_id, 'application_status', 'Status lamaran diperbarui', 'Status lamaranmu untuk ' || coalesce(job_title, 'lowongan') || ' berubah menjadi ' || new.status || '.', new.id)
  on conflict do nothing;
  if candidate_email is not null then
    insert into public.email_outbox(to_email, subject, html, dedupe_key)
    values (candidate_email, 'Update lamaran JobPrep', '<p>Hai ' || coalesce(candidate_name, 'Kandidat') || ', status lamaranmu untuk <strong>' || coalesce(job_title, 'lowongan') || '</strong> berubah menjadi <strong>' || new.status || '</strong>.</p>', key)
    on conflict (dedupe_key) do nothing;
  end if;
  return new;
end;
$$;

-- Retain sensitive CV and interview data for 24 months; run this statement from a scheduled Supabase job.
create or replace function public.purge_expired_jobprep_data()
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from public.interview_answers where created_at < now() - interval '24 months';
  delete from public.interview_sessions where created_at < now() - interval '24 months';
  delete from public.email_outbox where created_at < now() - interval '90 days' and status in ('sent','failed');
end;
$$;
