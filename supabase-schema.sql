-- =========================================================
-- PURE ROOTS E-COMMERCE - SUPABASE DATABASE SETUP & REALTIME
-- =========================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------
-- 1. ORDERS TABLE
-- ---------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  phone text not null,
  customer jsonb not null default '{}'::jsonb,
  items jsonb not null default '[]'::jsonb,
  payment_method text not null default 'cod',
  subtotal numeric(12,2) not null default 0,
  delivery_fee numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  status text not null default 'Order Placed',
  placed_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_phone_idx on public.orders(phone);
create index if not exists orders_placed_at_idx on public.orders(placed_at desc);
create index if not exists orders_status_idx on public.orders(status);

create or replace function public.set_orders_updated_at()
returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at
before update on public.orders
for each row execute function public.set_orders_updated_at();

-- ---------------------------------------------------------
-- 2. ORDER STATUS HISTORY
-- ---------------------------------------------------------
create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null,
  changed_at timestamptz not null default now()
);

create index if not exists order_status_history_order_idx
  on public.order_status_history(order_id, changed_at desc);

-- ---------------------------------------------------------
-- 3. SITE SETTINGS
-- ---------------------------------------------------------
create table if not exists public.site_settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);

insert into public.site_settings (key, value)
values
  ('hero_title', 'Nature’s Nutrition, Delivered Pure'),
  ('hero_subtitle', 'Premium nuts, seeds, spices, natural honey and nutritious food mixes, carefully selected for your everyday wellness.'),
  ('hero_image_url', '')
on conflict (key) do nothing;

-- ---------------------------------------------------------
-- 4. SITE EVENTS (VISITOR ANALYTICS)
-- ---------------------------------------------------------
create table if not exists public.site_events (
  id bigint generated always as identity primary key,
  event_type text not null,
  path text not null default '/',
  session_id text not null,
  referrer text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists site_events_created_idx on public.site_events(created_at desc);
create index if not exists site_events_session_idx on public.site_events(session_id);
create index if not exists site_events_path_idx on public.site_events(path);
create index if not exists site_events_event_type_idx on public.site_events(event_type);

-- ---------------------------------------------------------
-- 5. STORAGE BUCKET FOR SITE ASSETS
-- ---------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('site-assets', 'site-assets', true)
on conflict (id)
do update set public = true;

-- Allow public read on site-assets
do $$
begin
  if exists (select 1 from pg_tables where schemaname = 'storage' and tablename = 'objects') then
    drop policy if exists "Public Access to site-assets" on storage.objects;
    create policy "Public Access to site-assets" on storage.objects
      for select using (bucket_id = 'site-assets');
  end if;
exception when others then
  null;
end $$;

-- ---------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ---------------------------------------------------------
alter table public.orders enable row level security;
alter table public.order_status_history enable row level security;
alter table public.site_settings enable row level security;
alter table public.site_events enable row level security;

-- Drop prior policies if any
drop policy if exists "Allow anon insert orders" on public.orders;
drop policy if exists "Allow anon insert history" on public.order_status_history;
drop policy if exists "Allow anon insert events" on public.site_events;
drop policy if exists "Allow public read site_settings" on public.site_settings;

-- Allow inserting orders and events via anon/authenticated clients without rejection
create policy "Allow anon insert orders" on public.orders
  for insert to anon, authenticated with check (true);

create policy "Allow anon insert history" on public.order_status_history
  for insert to anon, authenticated with check (true);

create policy "Allow anon insert events" on public.site_events
  for insert to anon, authenticated with check (true);

create policy "Allow public read site_settings" on public.site_settings
  for select to anon, authenticated using (true);

-- Note: SELECT on orders and order_status_history is restricted to service_role,
-- which bypasses RLS and handles data securely in Next.js server API routes.

-- ---------------------------------------------------------
-- 7. SUPABASE REALTIME BROADCAST TRIGGER (SAFE & RESILIENT)
-- ---------------------------------------------------------
-- This trigger safely broadcasts changes to the 'pure-roots-admin-events' topic.
-- Notice: Wrapped in BEGIN ... EXCEPTION WHEN OTHERS THEN NULL; END;
-- This GUARANTEES that order insertions and site events NEVER fail even if Realtime is misconfigured!
create or replace function public.broadcast_admin_data_change()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
begin
  begin
    perform realtime.send(
      jsonb_build_object(
        'table_name', TG_TABLE_NAME,
        'operation', TG_OP,
        'changed_at', now()
      ),
      'admin_data_changed',
      'pure-roots-admin-events',
      false
    );
  exception when others then
    -- Do not block inserts if realtime broadcast fails or is not enabled
    null;
  end;
  return coalesce(NEW, OLD);
end;
$$;

drop trigger if exists orders_admin_broadcast on public.orders;
create trigger orders_admin_broadcast
after insert or update or delete on public.orders
for each row execute function public.broadcast_admin_data_change();

drop trigger if exists order_history_admin_broadcast on public.order_status_history;
create trigger order_history_admin_broadcast
after insert or update or delete on public.order_status_history
for each row execute function public.broadcast_admin_data_change();

drop trigger if exists site_events_admin_broadcast on public.site_events;
create trigger site_events_admin_broadcast
after insert on public.site_events
for each row execute function public.broadcast_admin_data_change();

drop trigger if exists site_settings_admin_broadcast on public.site_settings;
create trigger site_settings_admin_broadcast
after insert or update or delete on public.site_settings
for each row execute function public.broadcast_admin_data_change();

-- ---------------------------------------------------------
-- 8. REALTIME REPLICATION PUBLICATION & PERMISSIONS
-- ---------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='site_events'
  ) then
    alter publication supabase_realtime add table public.site_events;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='order_status_history'
  ) then
    alter publication supabase_realtime add table public.order_status_history;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='site_settings'
  ) then
    alter publication supabase_realtime add table public.site_settings;
  end if;
exception when others then
  null;
end $$;

-- Enable Realtime broadcast channel reception for anon
do $$
begin
  if exists (select 1 from pg_tables where schemaname = 'realtime' and tablename = 'messages') then
    drop policy if exists "Allow broadcast read" on realtime.messages;
    create policy "Allow broadcast read" on realtime.messages
      for select to anon, authenticated using (true);
  end if;
exception when others then
  null;
end $$;
