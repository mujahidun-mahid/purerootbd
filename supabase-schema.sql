create extension if not exists pgcrypto;

create table if not exists public.orders (
 id uuid primary key default gen_random_uuid(),
 order_number text not null unique,
 phone text not null,
 customer jsonb not null default '{}'::jsonb,
 items jsonb not null default '[]'::jsonb,
 payment_method text not null,
 subtotal numeric(12,2) not null default 0,
 delivery_fee numeric(12,2) not null default 0,
 total numeric(12,2) not null default 0,
 status text not null default 'Order Placed',
 placed_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists orders_phone_idx on public.orders(phone);
create index if not exists orders_placed_at_idx on public.orders(placed_at desc);

create or replace function public.set_orders_updated_at() returns trigger
language plpgsql as $$ begin new.updated_at=now(); return new; end; $$;
drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at before update on public.orders for each row execute function public.set_orders_updated_at();

create table if not exists public.order_status_history (
 id uuid primary key default gen_random_uuid(),
 order_id uuid not null references public.orders(id) on delete cascade,
 status text not null,
 changed_at timestamptz not null default now()
);

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
create index if not exists site_events_event_type_idx on public.site_events(event_type);

alter table public.orders enable row level security;
alter table public.order_status_history enable row level security;
alter table public.site_events enable row level security;
revoke all on table public.orders from anon, authenticated;
revoke all on table public.order_status_history from anon, authenticated;
revoke all on table public.site_events from anon, authenticated;

-- Vercel admin uses protected Next.js API routes with the Supabase server key.
-- The browser never receives the server/secret key and never reads these tables directly.

-- Supabase Realtime Broadcast: send a small, non-sensitive notification whenever
-- admin-relevant data changes. The admin browser receives only this notification,
-- then calls the protected API to fetch the real data.
create or replace function public.broadcast_admin_data_change()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
begin
  perform realtime.send(
    jsonb_build_object('table_name', TG_TABLE_NAME, 'operation', TG_OP, 'changed_at', now()),
    'admin_data_changed',
    'pure-roots-admin-events',
    false
  );
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
after insert or update or delete on public.site_events
for each row execute function public.broadcast_admin_data_change();

-- Keep the legacy Postgres Changes publication enabled for orders as well.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;
end $$;
