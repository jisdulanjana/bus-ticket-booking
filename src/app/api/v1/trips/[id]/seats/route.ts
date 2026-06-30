import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = supabaseAdmin();

  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .select("id, bus_id, buses(seat_count, layout)")
    .eq("id", id)
    .single();

  if (tripError || !trip) {
    return NextResponse.json({ error: { code: "trip_not_found", message: "Trip not found" } }, { status: 404 });
  }

  const { data: takenSeats, error: seatsError } = await supabase
    .from("booking_seats")
    .select("seat_no, bookings(status)")
    .eq("trip_id", id);

  if (seatsError) {
    return NextResponse.json({ error: { code: "seats_fetch_failed", message: seatsError.message } }, { status: 500 });
  }

  const taken = (takenSeats ?? [])
    .filter((s) => {
      const booking = s.bookings as unknown as { status: string } | null;
      return booking?.status === "paid" || booking?.status === "pending";
    })
    .map((s) => s.seat_no);

  return NextResponse.json({ trip_id: id, layout: trip.buses, taken_seats: taken });
}
