create table if not exists public.salon_quiz_submissions (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salons(id) on delete cascade,
  quiz_version text,
  visitor_name text,
  visitor_whatsapp text not null,
  answers jsonb not null default '[]'::jsonb,
  consent_accepted boolean not null default false,
  consent_text text not null default '',
  source_url text,
  status text not null default 'new' check (status in ('new', 'contacted', 'finished')),
  created_at timestamptz not null default now()
);

create index if not exists salon_quiz_submissions_salon_created_idx
  on public.salon_quiz_submissions (salon_id, created_at desc);

alter table public.salon_quiz_submissions enable row level security;

-- No public read/insert policies are created. The server-side service role writes
-- and reads this table after the authenticated admin checks.
