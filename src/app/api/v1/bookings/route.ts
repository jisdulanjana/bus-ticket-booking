import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const HOLD_MINUTES = 10;
const MIN_HOURS_BEFORE_DEPARTURE = 12;

export async function POST(req: Request) {
  const { allowed } = rateLimit(`bookings:${clientIp(req)}`, 10);
  if (!allowed) {
    return NextResponse.json(
      { error: { code: "rate_limited", message: "Too many requests, please try again shortly" } },
      { status: 429 }
    );
  }

  const body = await req.json();
  const { trip_id, seats, customer_name, email, phone, user_id } = body as {
    trip_id: string;
    seats: string[];
    customer_name: string;
    email: string;
    phone?: string;
    user_id?: string;
  };

  if (!trip_id || !Array.isArray(seats) || seats.length === 0 || !customer_name || !email) {
    return NextResponse.json(
      { error: { code: "invalid_request", message: "trip_id, seats, customer_name, email are required" } },
      { status: 400 }
    );
  }

  const supabase = supabaseAdmin();

  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .select("id, price_cents, status, depart_at")
    .eq("id", trip_id)
    .single();

  if (tripError || !trip || trip.status !== "open") {
    return NextResponse.json({ error: { code: "trip_not_available", message: "Trip not found or closed" } }, { status: 404 });
  }

  const hoursUntilDeparture = (new Date(trip.depart_at).getTime() - Date.now()) / (60 * 60 * 1000);
  if (hoursUntilDeparture < MIN_HOURS_BEFORE_DEPARTURE) {
    return NextResponse.json(
      {
        error: {
          code: "booking_window_closed",
          message: `Bookings close ${MIN_HOURS_BEFORE_DEPARTURE} hours before departure`,
        },
      },
      { status: 409 }
    );
  }

  const amountCents = trip.price_cents * seats.length;
  const holdExpiresAt = new Date(Date.now() + HOLD_MINUTES * 60 * 1000).toISOString();

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      trip_id,
      user_id: user_id ?? null,
      customer_name,
      email,
      phone: phone ?? null,
      amount_cents: amountCents,
      status: "pending",
      hold_expires_at: holdExpiresAt,
    })
    .select("id")
    .single();

  if (bookingError || !booking) {
    return NextResponse.json({ error: { code: "booking_create_failed", message: bookingError?.message } }, { status: 500 });
  }

  const seatRows = seats.map((seat_no) => ({ trip_id, seat_no, booking_id: booking.id }));
  const { error: seatError } = await supabase.from("booking_seats").insert(seatRows);

  if (seatError) {
    await supabase.from("bookings").delete().eq("id", booking.id);
    return NextResponse.json(
      { error: { code: "seat_taken", message: "One or more selected seats were just taken" } },
      { status: 409 }
    );
  }

  return NextResponse.json({ booking_id: booking.id, amount_cents: amountCents, hold_expires_at: holdExpiresAt }, { status: 201 });
}
