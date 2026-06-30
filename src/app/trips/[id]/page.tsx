import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-server";
import { formatLkr, type Trip, type SeatsResponse } from "@/lib/types";
import SeatPicker from "./SeatPicker";

export const dynamic = "force-dynamic";

async function getTripAndSeats(id: string) {
  const supabase = supabaseAdmin();

  const { data: trip } = await supabase
    .from("trips")
    .select("id, origin, destination, depart_at, price_cents, status, buses(id, name, seat_count, layout)")
    .eq("id", id)
    .single();

  if (!trip) return null;

  const { data: takenSeats } = await supabase
    .from("booking_seats")
    .select("seat_no, bookings(status)")
    .eq("trip_id", id);

  const taken = (takenSeats ?? [])
    .filter((s) => {
      const booking = s.bookings as unknown as { status: string } | null;
      return booking?.status === "paid" || booking?.status === "pending";
    })
    .map((s) => s.seat_no);

  const seatsResponse: SeatsResponse = {
    trip_id: id,
    layout: { layout: (trip as unknown as Trip).buses.layout, seat_count: (trip as unknown as Trip).buses.seat_count },
    taken_seats: taken,
  };

  return { trip: trip as unknown as Trip, seats: seatsResponse };
}

export default async function TripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getTripAndSeats(id);

  if (!result) notFound();
  const { trip, seats } = result;

  return (
    <main className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="w-full max-w-3xl">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          {trip.origin} → {trip.destination}
        </h1>
        <p className="mb-8 text-sm text-zinc-500">
          {trip.buses.name} · {new Date(trip.depart_at).toLocaleString("en-LK")} · {formatLkr(trip.price_cents)} per seat
        </p>
        <SeatPicker tripId={trip.id} priceCents={trip.price_cents} initialSeats={seats} />
      </div>
    </main>
  );
}
