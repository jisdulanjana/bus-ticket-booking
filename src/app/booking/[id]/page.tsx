import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-server";
import { formatLkr, type Booking } from "@/lib/types";
import PayButton from "./PayButton";

export const dynamic = "force-dynamic";

async function getBooking(id: string) {
  const supabase = supabaseAdmin();
  const { data } = await supabase
    .from("bookings")
    .select("id, trip_id, customer_name, email, amount_cents, status, hold_expires_at, created_at, booking_seats(seat_no)")
    .eq("id", id)
    .single();
  return data as unknown as Booking | null;
}

const statusLabel: Record<Booking["status"], string> = {
  pending: "Awaiting payment",
  paid: "Paid",
  expired: "Hold expired",
  cancelled: "Cancelled",
};

export default async function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = await getBooking(id);

  if (!booking) notFound();

  return (
    <main className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Booking {booking.id.slice(0, 8)}</h1>
        <p className="mb-4 text-sm text-zinc-500">{statusLabel[booking.status]}</p>

        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-zinc-500">Passenger</dt>
            <dd className="text-zinc-900 dark:text-zinc-50">{booking.customer_name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-zinc-500">Seats</dt>
            <dd className="text-zinc-900 dark:text-zinc-50">{booking.booking_seats.map((s) => s.seat_no).join(", ")}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-zinc-500">Amount</dt>
            <dd className="font-medium text-zinc-900 dark:text-zinc-50">{formatLkr(booking.amount_cents)}</dd>
          </div>
          {booking.status === "pending" && (
            <div className="flex justify-between">
              <dt className="text-zinc-500">Hold expires</dt>
              <dd className="text-zinc-900 dark:text-zinc-50">{new Date(booking.hold_expires_at).toLocaleTimeString("en-LK")}</dd>
            </div>
          )}
        </dl>

        <div className="mt-6">
          {booking.status === "pending" && <PayButton bookingId={booking.id} />}
          {booking.status === "paid" && <p className="text-sm text-green-600">Your seats are confirmed. A ticket has been emailed to {booking.email}.</p>}
          {(booking.status === "expired" || booking.status === "cancelled") && (
            <p className="text-sm text-red-600">This booking is no longer active.</p>
          )}
        </div>
      </div>
    </main>
  );
}
