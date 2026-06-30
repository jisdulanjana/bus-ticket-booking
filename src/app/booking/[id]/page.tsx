import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-server";
import { formatLkr, type Booking } from "@/lib/types";
import PayButton from "./PayButton";

export const dynamic = "force-dynamic";

type BookingWithTrip = Booking & {
  trips: { origin: string; destination: string; depart_at: string } | null;
};

async function getBooking(id: string) {
  const supabase = supabaseAdmin();
  const { data } = await supabase
    .from("bookings")
    .select(
      "id, trip_id, customer_name, email, amount_cents, status, hold_expires_at, created_at, booking_seats(seat_no), trips(origin, destination, depart_at)"
    )
    .eq("id", id)
    .single();
  return data as unknown as BookingWithTrip | null;
}

const statusStyle: Record<Booking["status"], string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400",
  paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400",
  expired: "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
};

const statusLabel: Record<Booking["status"], string> = {
  pending: "Awaiting payment",
  paid: "Confirmed",
  expired: "Hold expired",
  cancelled: "Cancelled",
};

export default async function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = await getBooking(id);

  if (!booking) notFound();

  return (
    <main className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 px-6 py-6 text-white">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-50/80">E-Ticket</p>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle[booking.status]}`}>
              {statusLabel[booking.status]}
            </span>
          </div>
          {booking.trips && (
            <h1 className="mt-2 text-xl font-bold">
              {booking.trips.origin} <span className="text-emerald-100">→</span> {booking.trips.destination}
            </h1>
          )}
          {booking.trips && (
            <p className="mt-1 text-sm text-emerald-50/90">
              {new Date(booking.trips.depart_at).toLocaleString("en-LK", { dateStyle: "medium", timeStyle: "short" })}
            </p>
          )}
        </div>

        <div className="relative px-6 py-6">
          <div className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-zinc-50 dark:bg-black" />
          <div className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-zinc-50 dark:bg-black" />
          <div className="mb-5 border-t border-dashed border-zinc-300 dark:border-zinc-700" />

          <dl className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-zinc-500">Booking ref</dt>
              <dd className="font-mono text-zinc-900 dark:text-zinc-50">{booking.id.slice(0, 8).toUpperCase()}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">Passenger</dt>
              <dd className="text-zinc-900 dark:text-zinc-50">{booking.customer_name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">Seats</dt>
              <dd className="font-semibold text-zinc-900 dark:text-zinc-50">
                {booking.booking_seats.map((s) => s.seat_no).join(", ")}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">Amount</dt>
              <dd className="font-semibold text-zinc-900 dark:text-zinc-50">{formatLkr(booking.amount_cents)}</dd>
            </div>
            {booking.status === "pending" && (
              <div className="flex justify-between">
                <dt className="text-zinc-500">Hold expires</dt>
                <dd className="text-amber-600 dark:text-amber-400">
                  {new Date(booking.hold_expires_at).toLocaleTimeString("en-LK")}
                </dd>
              </div>
            )}
          </dl>

          <div className="mt-6">
            {booking.status === "pending" && <PayButton bookingId={booking.id} />}
            {booking.status === "paid" && (
              <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                Your seats are confirmed. A ticket has been emailed to {booking.email}.
              </p>
            )}
            {(booking.status === "expired" || booking.status === "cancelled") && (
              <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-400">
                This booking is no longer active.
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
