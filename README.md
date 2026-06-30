# Bus Ticket Booking

Headless JSON API (Next.js App Router) + Supabase (Postgres/Auth/Realtime) + PayHere payments. Web client now, Flutter client later — same backend, no rewrite.

## Stack

- Next.js 16 (App Router) on Vercel — web UI + API
- Supabase — Postgres, Auth, Realtime
- PayHere — payment gateway (LKR)
- Resend — e-ticket emails

## Setup

```bash
npm install
cp .env.example .env.local   # fill in Supabase/PayHere/Resend keys
```

Run the migration in `supabase/migrations/0001_init.sql` against your Supabase project (SQL editor or `supabase db push`).

```bash
npm run dev
```

## API (`/api/v1`)

| Method & path | Purpose |
| --- | --- |
| `GET /api/v1/trips` | List open trips |
| `GET /api/v1/trips/:id/seats` | Seat map + taken seats |
| `POST /api/v1/bookings` | Create booking, lock seats, 10-min hold |
| `GET /api/v1/bookings/:id` | Booking status |
| `POST /api/v1/payments/payhere/initiate` | Signed PayHere checkout params |
| `POST /api/v1/payments/payhere/notify` | PayHere server webhook (fulfillment) |
