import { isAdminAuthed } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase-server";
import { formatLkr } from "@/lib/types";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

type TripRow = {
  id: string;
  origin: string;
  destination: string;
  depart_at: string;
  price_cents: number;
  status: string;
  buses: { name: string; seat_count: number };
};

async function getTripStats() {
  const supabase = supabaseAdmin();

  const { data: trips } = await supabase
    .from("trips")
    .select("id, origin, destination, depart_at, price_cents, status, buses(name, seat_count)")
    .order("depart_at", { ascending: true });

  const { data: paidBookings } = await supabase
    .from("bookings")
    .select("trip_id, amount_cents, booking_seats(seat_no)")
    .eq("status", "paid");

  const stats = new Map<string, { seatsSold: number; revenueCents: number }>();
  for (const b of paidBookings ?? []) {
    const existing = stats.get(b.trip_id) ?? { seatsSold: 0, revenueCents: 0 };
    existing.seatsSold += (b.booking_seats as unknown as { seat_no: string }[]).length;
    existing.revenueCents += b.amount_cents;
    stats.set(b.trip_id, existing);
  }

  return { trips: (trips as unknown as TripRow[]) ?? [], stats };
}

export default async function AdminPage() {
  const authed = await isAdminAuthed();

  if (!authed) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
        <h1 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-50">Admin login</h1>
        <LoginForm />
      </main>
    );
  }

  const { trips, stats } = await getTripStats();
  const totalRevenue = [...stats.values()].reduce((sum, s) => sum + s.revenueCents, 0);

  return (
    <main className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="w-full max-w-4xl">
        <h1 className="mb-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Admin</h1>
        <p className="mb-8 text-sm text-zinc-500">Total revenue: {formatLkr(totalRevenue)}</p>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-zinc-500 dark:border-zinc-800">
              <th className="py-2 pr-4">Route</th>
              <th className="py-2 pr-4">Bus</th>
              <th className="py-2 pr-4">Departs</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Seats sold</th>
              <th className="py-2 pr-4">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {trips.map((trip) => {
              const s = stats.get(trip.id) ?? { seatsSold: 0, revenueCents: 0 };
              return (
                <tr key={trip.id} className="border-b border-zinc-100 dark:border-zinc-900">
                  <td className="py-2 pr-4 text-zinc-900 dark:text-zinc-50">
                    {trip.origin} → {trip.destination}
                  </td>
                  <td className="py-2 pr-4 text-zinc-500">{trip.buses.name}</td>
                  <td className="py-2 pr-4 text-zinc-500">{new Date(trip.depart_at).toLocaleString("en-LK")}</td>
                  <td className="py-2 pr-4 text-zinc-500">{trip.status}</td>
                  <td className="py-2 pr-4 text-zinc-900 dark:text-zinc-50">
                    {s.seatsSold} / {trip.buses.seat_count}
                  </td>
                  <td className="py-2 pr-4 text-zinc-900 dark:text-zinc-50">{formatLkr(s.revenueCents)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
