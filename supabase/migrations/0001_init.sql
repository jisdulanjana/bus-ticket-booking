create extension if not exists pgcrypto;

create table buses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  seat_count int not null,
  layout jsonb,
  created_at timestamptz default now()
);

create table trips (
  id uuid primary key default gen_random_uuid(),
  bus_id uuid not null references buses(id),
  origin text,
  destination text,
  depart_at timestamptz,
  price_cents int not null,
  status text not null default 'open'
);

create table bookings (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id),
  user_id uuid,
  customer_name text not null,
  email text not null,
  phone text,
  amount_cents int not null,
  status text not null default 'pending',
  hold_expires_at timestamptz,
  payhere_order_id text unique,
  created_at timestamptz default now()
);

create table booking_seats (
  trip_id uuid not null references trips(id),
  seat_no text not null,
  booking_id uuid not null references bookings(id),
  primary key (trip_id, seat_no)
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id),
  provider text not null default 'payhere',
  provider_ref text,
  amount_cents int not null,
  status text not null,
  raw jsonb,
  created_at timestamptz default now()
);

alter table buses enable row level security;
alter table trips enable row level security;
alter table bookings enable row level security;
alter table booking_seats enable row level security;
alter table payments enable row level security;

create policy "buses are publicly readable" on buses for select using (true);
create policy "trips are publicly readable" on trips for select using (true);
create policy "booking_seats are publicly readable" on booking_seats for select using (true);

create policy "users can read own bookings" on bookings for select using (auth.uid() = user_id);
create policy "users can read own payments" on payments for select using (
  exists (select 1 from bookings b where b.id = payments.booking_id and b.user_id = auth.uid())
);
