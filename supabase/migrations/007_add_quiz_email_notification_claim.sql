-- Apply manually after 006_add_quiz_email_notification_status.sql.
-- This migration is additive. It serializes Brevo notification attempts without
-- exposing any read access to salon_quiz_submissions.
alter table public.salon_quiz_submissions
  add column if not exists email_notification_claim_id uuid,
  add column if not exists email_notification_claimed_at timestamptz,
  add column if not exists email_notification_first_attempt_at timestamptz,
  add column if not exists email_notification_attempt_count integer not null default 0;

create index if not exists salon_quiz_submissions_email_notification_retry_idx
  on public.salon_quiz_submissions (email_notification_status, email_notification_claimed_at)
  where email_notification_status in ('pending', 'failed');

create or replace function public.claim_quiz_email_notification(
  p_submission_id uuid,
  p_claim_id uuid
)
returns table (claimed boolean, email_status text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_claimed_at timestamptz;
  v_first_attempt_at timestamptz;
begin
  select email_notification_status, email_notification_claimed_at, email_notification_first_attempt_at
  into v_status, v_claimed_at, v_first_attempt_at
  from public.salon_quiz_submissions
  where id = p_submission_id
  for update;

  if not found then
    return query select false, null::text;
    return;
  end if;

  -- A finished or intentionally skipped notification is never sent again.
  if v_status in ('sent', 'skipped') then
    return query select false, v_status;
    return;
  end if;

  -- A recent pending claim belongs to another request. It becomes retryable only
  -- after five minutes, which also recovers from an interrupted Worker request.
  if v_status = 'pending'
    and v_claimed_at is not null
    and v_claimed_at > now() - interval '5 minutes' then
    return query select false, v_status;
    return;
  end if;

  -- Brevo honors Idempotency-Key for 15 minutes. Beyond that window the Worker
  -- leaves a failed/pending lead for manual review rather than risking a second
  -- message after an ambiguous network failure.
  if v_first_attempt_at is not null
    and v_first_attempt_at <= now() - interval '15 minutes' then
    return query select false, v_status;
    return;
  end if;

  -- A null status is the first notification attempt. Later retries are allowed
  -- only from failed or stale pending states.
  update public.salon_quiz_submissions
  set email_notification_status = 'pending',
      email_notification_claim_id = p_claim_id,
      email_notification_claimed_at = now(),
      email_notification_first_attempt_at = coalesce(email_notification_first_attempt_at, now()),
      email_notification_attempt_count = coalesce(email_notification_attempt_count, 0) + 1,
      email_notification_error_code = null
  where id = p_submission_id;

  return query select true, 'pending'::text;
end;
$$;

revoke all on function public.claim_quiz_email_notification(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.claim_quiz_email_notification(uuid, uuid)
  to service_role;
