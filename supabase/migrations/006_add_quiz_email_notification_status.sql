-- Apply manually after review. This migration is additive and is not executed by the app.
alter table public.salon_quiz_submissions
  add column if not exists email_notification_status text not null default 'pending',
  add column if not exists email_notification_sent_at timestamptz,
  add column if not exists email_notification_message_id text,
  add column if not exists email_notification_error_code text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'salon_quiz_submissions_email_notification_status_check'
      and conrelid = 'public.salon_quiz_submissions'::regclass
  ) then
    alter table public.salon_quiz_submissions
      add constraint salon_quiz_submissions_email_notification_status_check
      check (email_notification_status in ('pending', 'sent', 'skipped', 'failed'));
  end if;
end $$;
