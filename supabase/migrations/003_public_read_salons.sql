drop policy if exists "Public can read published salons" on public.salons;

drop policy if exists "Public can read salons by slug" on public.salons;

create policy "Public can read salons by slug"
on public.salons
for select
to anon
using (slug is not null);
