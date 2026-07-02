create extension if not exists pgcrypto;

create table if not exists public.salons (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  status text default 'preview',
  language text default 'en',
  country text,
  city text,
  address text,
  description text,
  headline text,
  subheadline text,
  booking_url text,
  whatsapp text,
  phone text,
  website_url text,
  instagram_url text,
  google_maps_url text,
  business_hours text,
  notes text,
  readiness_score integer,
  services jsonb not null default '[]'::jsonb,
  real_images jsonb not null default '[]'::jsonb,
  real_reviews jsonb not null default '[]'::jsonb,
  copy_suggestions jsonb,
  copy_history jsonb not null default '[]'::jsonb,
  generated_copy jsonb,
  source_profile jsonb not null default '{}'::jsonb,
  social_links jsonb not null default '{}'::jsonb,
  cta jsonb not null default '{}'::jsonb,
  seo jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists salons_created_at_idx on public.salons (created_at desc);
create index if not exists salons_status_idx on public.salons (status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists salons_set_updated_at on public.salons;

create trigger salons_set_updated_at
before update on public.salons
for each row
execute function public.set_updated_at();

alter table public.salons enable row level security;

drop policy if exists "Public can read published salons" on public.salons;

create policy "Public can read published salons"
on public.salons
for select
to anon
using (status = 'published');

-- SECURITY NOTE:
-- This project does not have authentication yet. Keep anonymous insert/update/delete
-- disabled by default. The app falls back to localStorage for internal writes unless
-- NEXT_PUBLIC_SUPABASE_WRITE_MODE=enabled is configured and your project has an
-- explicit admin/auth policy.
--
-- For local-only experiments, you may temporarily create broader policies in a
-- disposable Supabase project, but do not use those policies in production.
