import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase-server";
import { formatLkr, type Trip } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getTrips(): Promise<Trip[]> {
  const supabase = supabaseAdmin();
  const { data } = await supabase
    .from("trips")
    .select("id, origin, destination, depart_at, price_cents, status, buses(id, name, seat_count, layout)")
    .eq("status", "open")
    .order("depart_at", { ascending: true });
  return (data as unknown as Trip[]) ?? [];
}

export default async function Home() {
  const trips = await getTrips();

  return (
    <main className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="w-full max-w-2xl">
        <h1 className="mb-8 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Available Trips
        </h1>

        {trips.length === 0 ? (
          <p className="text-zinc-500">No trips available right now.</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {trips.map((trip) => (
              <li key={trip.id}>
                <Link
                  href={`/trips/${trip.id}`}
                  className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-5 transition hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600"
                >
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">
                      {trip.origin} → {trip.destination}
                    </p>
                    <p className="text-sm text-zinc-500">
                      {trip.buses.name} · {new Date(trip.depart_at).toLocaleString("en-LK")}
                    </p>
                  </div>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                    {formatLkr(trip.price_cents)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
