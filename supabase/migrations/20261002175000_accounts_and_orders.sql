-- Accounts live in Supabase Auth. Orders and support messages live in these tables.
-- Run this once in the Supabase SQL editor.

create table if not exists public.orders (
  id uuid primary key,
  stripe_session_id text unique,
  gogetviews_order_id bigint,
  service_id integer not null,
  service_name text not null,
  platform text not null,
  link text not null,
  email text,
  user_id uuid references auth.users (id) on delete set null,
  quantity integer not null,
  comments text,
  amount_cents integer not null,
  currency text not null default 'usd',
  status text not null,
  delivery_status text,
  start_count text,
  remains text,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_user_id_idx on public.orders (user_id);
create index if not exists orders_created_at_idx on public.orders (created_at desc);

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  email text not null,
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.orders enable row level security;
alter table public.support_messages enable row level security;

drop policy if exists "users read own orders" on public.orders;
create policy "users read own orders"
  on public.orders
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

drop policy if exists "users insert own support messages" on public.support_messages;
create policy "users insert own support messages"
  on public.support_messages
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "users read own support messages" on public.support_messages;
create policy "users read own support messages"
  on public.support_messages
  for select
  to authenticated
  using (user_id = auth.uid());
