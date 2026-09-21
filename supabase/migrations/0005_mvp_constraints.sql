-- P1 privacy and ownership hardening.
create policy "recruiter reads applicant metadata on owned jobs" on public.profiles
for select using (
  exists (
    select 1 from public.applications a
    join public.jobs j on j.id = a.job_id
    join public.companies c on c.id = j.company_id
    where a.user_id = profiles.id and c.recruiter_id = auth.uid()
  )
);

create or replace function public.prevent_application_identity_change()
returns trigger language plpgsql as $$
begin
  if new.job_id <> old.job_id or new.user_id <> old.user_id or new.cv_url <> old.cv_url then
    raise exception 'application ownership fields are immutable';
  end if;
  return new;
end;
$$;
drop trigger if exists applications_identity_immutable on public.applications;
create trigger applications_identity_immutable
before update on public.applications
for each row execute function public.prevent_application_identity_change();

create index if not exists applications_job_user_idx on public.applications(job_id, user_id);
create index if not exists interview_questions_session_order_idx on public.interview_questions(session_id, ordering);
