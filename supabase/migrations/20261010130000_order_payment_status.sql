-- Track payment state independently from fulfillment status.
-- payment_status is server-authoritative: 'pending' until a verified
-- gateway callback (or manual verification flow) marks it 'paid'.
alter table public.orders
  add column if not exists payment_status text not null default 'pending';

create index if not exists orders_payment_status_idx
  on public.orders(payment_status);
