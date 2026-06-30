import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = supabaseAdmin();

  const { data: booking, error } = await supabase
    .from("bookings")
    .select("id, trip_id, customer_name, email, amount_cents, status, hold_expires_at, created_at, booking_seats(seat_no)")
    .eq("id", id)
    .single();

  if (error || !booking) {
    return NextResponse.json({ error: { code: "booking_not_found", message: "Booking not found" } }, { status: 404 });
  }

  return NextResponse.json({ booking });
}
