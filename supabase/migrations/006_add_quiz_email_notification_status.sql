-- Apply manually after review. This migration is additive and is not executed by the app.
-- Run after 004_create_salon_quiz_submissions.sql and 005_add_quiz_submission_city.sql.
alter table public.salon_quiz_submissions
  add column if not exists email_notification_status text,
  add column if not exists email_notification_sent_at timestamptz,
  add column if not exists email_notification_message_id text,
  add column if not exists email_notification_error_code text;

alter table public.salon_quiz_submissions
  alter column email_notification_status drop not null,
  alter column email_notification_status drop default;

do $$
begin
  alter table public.salon_quiz_submissions
    drop constraint if exists salon_quiz_submissions_email_notification_status_check;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'salon_quiz_submissions_email_notification_status_check'
      and conrelid = 'public.salon_quiz_submissions'::regclass
  ) then
    alter table public.salon_quiz_submissions
      add constraint salon_quiz_submissions_email_notification_status_check
      check (email_notification_status is null or email_notification_status in ('pending', 'sent', 'skipped', 'failed'));
  end if;
end $$;

-- The public endpoint uses the server-only service_role client. RLS remains enabled;
-- no anon/authenticated policies are created.
grant usage on schema public to service_role;
grant select, insert, update, delete
  on table public.salon_quiz_submissions to service_role;
