-- Integrity and timestamp hardening for the MVP schema.
create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
drop trigger if exists jobs_set_updated_at on public.jobs;
create trigger jobs_set_updated_at before update on public.jobs for each row execute function public.set_updated_at();
alter table public.jobs drop constraint if exists jobs_salary_order;
alter table public.jobs add constraint jobs_salary_order check (salary_min is null or salary_max is null or salary_max >= salary_min);
alter table public.interview_questions add constraint interview_questions_order_nonnegative check (ordering >= 0);
