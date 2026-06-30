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

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50">{value}</p>
    </div>
  );
}

export default async function AdminPage() {
  const authed = await isAdminAuthed();

  if (!authed) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
        <div className="w-full max-w-xs rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h1 className="mb-6 text-center text-lg font-semibold text-zinc-900 dark:text-zinc-50">Admin login</h1>
          <LoginForm />
        </div>
      </main>
    );
  }

  const { trips, stats } = await getTripStats();
  const totalRevenue = [...stats.values()].reduce((sum, s) => sum + s.revenueCents, 0);
  const totalSeatsSold = [...stats.values()].reduce((sum, s) => sum + s.seatsSold, 0);
  const upcomingTrips = trips.filter((t) => new Date(t.depart_at).getTime() > Date.now()).length;

  return (
    <main className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <h1 className="mb-6 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Admin dashboard</h1>

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Total revenue" value={formatLkr(totalRevenue)} />
          <StatCard label="Seats sold" value={String(totalSeatsSold)} />
          <StatCard label="Upcoming trips" value={String(upcomingTrips)} />
        </div>

        <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
          <div className="max-h-[32rem] overflow-y-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-950">
                <tr className="border-b border-zinc-200 text-left text-zinc-500 dark:border-zinc-800">
                  <th className="px-4 py-3 font-medium">Route</th>
                  <th className="px-4 py-3 font-medium">Bus</th>
                  <th className="px-4 py-3 font-medium">Departs</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Seats sold</th>
                  <th className="px-4 py-3 font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {trips.map((trip, i) => {
                  const s = stats.get(trip.id) ?? { seatsSold: 0, revenueCents: 0 };
                  return (
                    <tr
                      key={trip.id}
                      className={`border-b border-zinc-100 dark:border-zinc-900 ${
                        i % 2 === 1 ? "bg-zinc-50/60 dark:bg-zinc-950/60" : "bg-white dark:bg-zinc-950"
                      }`}
                    >
                      <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                        {trip.origin} → {trip.destination}
                      </td>
                      <td className="px-4 py-3 text-zinc-500">{trip.buses.name}</td>
                      <td className="px-4 py-3 text-zinc-500">
                        {new Date(trip.depart_at).toLocaleString("en-LK", { dateStyle: "medium", timeStyle: "short" })}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                          {trip.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-900 dark:text-zinc-50">
                        {s.seatsSold} / {trip.buses.seat_count}
                      </td>
                      <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">{formatLkr(s.revenueCents)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
