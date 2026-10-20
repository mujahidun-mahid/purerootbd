create table if not exists public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_slug text not null,
  name text not null check (char_length(name) between 1 and 80),
  rating smallint not null check (rating between 1 and 5),
  body text not null check (char_length(body) between 1 and 2000),
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists product_reviews_public_idx
  on public.product_reviews(product_slug, created_at desc) where approved = true;

alter table public.product_reviews enable row level security;

drop policy if exists "Public read approved product reviews" on public.product_reviews;
create policy "Public read approved product reviews" on public.product_reviews
  for select to anon, authenticated using (approved = true);

drop policy if exists "Public submit pending product reviews" on public.product_reviews;
create policy "Public submit pending product reviews" on public.product_reviews
  for insert to anon, authenticated with check (approved = false);

grant select, insert on public.product_reviews to anon, authenticated;
