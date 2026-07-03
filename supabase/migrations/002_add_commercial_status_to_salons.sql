alter table public.salons
add column if not exists commercial_status text default 'test';

update public.salons
set commercial_status = coalesce(
  metadata -> 'salon' ->> 'commercialStatus',
  commercial_status,
  'test'
);

create index if not exists salons_commercial_status_idx
on public.salons (commercial_status);
