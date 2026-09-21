-- P2 notification outbox and status-change trigger.
create table public.email_outbox (
  id uuid primary key default gen_random_uuid(), to_email text not null, subject text not null, html text not null,
  status text not null default 'pending' check (status in ('pending','sent','failed')),
  created_at timestamptz not null default now(), sent_at timestamptz
);
alter table public.email_outbox enable row level security;
create policy "no client access to email outbox" on public.email_outbox for all using (false) with check (false);

create or replace function public.queue_application_status_notification()
returns trigger language plpgsql security definer set search_path = public as $$
declare candidate_email text; candidate_name text; job_title text;
begin
  if old.status = new.status then return new; end if;
  select p.email, p.name into candidate_email, candidate_name from public.profiles p where p.id = new.user_id;
  select j.title into job_title from public.jobs j where j.id = new.job_id;
  insert into public.notifications(user_id, type, title, body, application_id)
  values (new.user_id, 'application_status', 'Status lamaran diperbarui', 'Status lamaranmu untuk ' || coalesce(job_title, 'lowongan') || ' berubah menjadi ' || new.status || '.', new.id)
  on conflict do nothing;
  if candidate_email is not null then
    insert into public.email_outbox(to_email, subject, html)
    values (candidate_email, 'Update lamaran JobPrep', '<p>Hai ' || coalesce(candidate_name, 'Kandidat') || ', status lamaranmu untuk <strong>' || coalesce(job_title, 'lowongan') || '</strong> berubah menjadi <strong>' || new.status || '</strong>.</p>');
  end if;
  return new;
end;
$$;
drop trigger if exists application_status_notification on public.applications;
create trigger application_status_notification after update of status on public.applications for each row execute function public.queue_application_status_notification();
