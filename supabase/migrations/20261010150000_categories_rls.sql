-- SECURITY FIX: categories table had RLS disabled, exposing it to
-- unauthenticated read AND write via the Data API (anon key).
-- Enable RLS and allow public reads of active rows only.
-- All writes stay server-side via the service role (admin APIs).

alter table public.categories enable row level security;

drop policy if exists "Allow public read active categories" on public.categories;
create policy "Allow public read active categories" on public.categories
  for select to anon, authenticated using (active is distinct from false);
