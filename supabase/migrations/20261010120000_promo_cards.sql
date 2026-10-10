-- =========================================================
-- PURE ROOTS - PROMOTIONAL BANNER CARDS (homepage)
-- =========================================================

create extension if not exists pgcrypto;

create table if not exists public.promo_cards (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  description text not null default '',
  discount_text text not null default '',
  background_image text not null default '',
  background_color text not null default '',
  button_text text not null default 'Shop Now',
  button_link text not null default '/shop',
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists promo_cards_active_order_idx
  on public.promo_cards(is_active, display_order);

create or replace function public.set_promo_cards_updated_at()
returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists promo_cards_updated_at on public.promo_cards;
create trigger promo_cards_updated_at
before update on public.promo_cards
for each row execute function public.set_promo_cards_updated_at();

alter table public.promo_cards enable row level security;

drop policy if exists "Allow public read active promo cards" on public.promo_cards;
create policy "Allow public read active promo cards" on public.promo_cards
  for select to anon, authenticated using (is_active = true);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'promo_cards'
  ) then
    alter publication supabase_realtime add table public.promo_cards;
  end if;
exception when others then
  null;
end $$;

drop trigger if exists promo_cards_admin_broadcast on public.promo_cards;
create trigger promo_cards_admin_broadcast
after insert or update or delete on public.promo_cards
for each row execute function public.broadcast_admin_data_change();

-- Default cards (only seeded on a fresh table)
insert into public.promo_cards
  (title, description, discount_text, background_image, background_color, button_text, button_link, display_order, is_active)
select
  'Purely Fresh Vegetables',
  'Crisp, organic picks from local farms.',
  'Flat 20% Discount',
  '',
  '#FFFDF9',
  'Shop Now',
  '/category/vegetables',
  1,
  true
where not exists (select 1 from public.promo_cards);

insert into public.promo_cards
  (title, description, discount_text, background_image, background_color, button_text, button_link, display_order, is_active)
select
  'Fresh Fruits, Pure Quality',
  'Sun-ripened sweetness delivered to your door.',
  'Flat 25% Discount',
  '',
  '#F0FDF4',
  'Shop Now',
  '/category/fruits',
  2,
  true
where (select count(*) from public.promo_cards) < 2;
