import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase-server";
import { formatLkr, type Trip } from "@/lib/types";
import DatePicker from "./DatePicker";

export const dynamic = "force-dynamic";

const MIN_HOURS_BEFORE_DEPARTURE = 12;

async function getTrips(date: string): Promise<Trip[]> {
  const supabase = supabaseAdmin();
  const start = new Date(`${date}T00:00:00Z`);
  const end = new Date(`${date}T23:59:59.999Z`);

  const { data } = await supabase
    .from("trips")
    .select("id, origin, destination, depart_at, price_cents, status, buses(id, name, seat_count, layout)")
    .eq("status", "open")
    .gte("depart_at", start.toISOString())
    .lte("depart_at", end.toISOString())
    .order("depart_at", { ascending: true });

  return (data as unknown as Trip[]) ?? [];
}

function isBookable(departAt: string) {
  const hoursUntil = (new Date(departAt).getTime() - Date.now()) / (60 * 60 * 1000);
  return hoursUntil >= MIN_HOURS_BEFORE_DEPARTURE;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: dateParam } = await searchParams;
  const date = dateParam ?? new Date().toISOString().slice(0, 10);
  const trips = await getTrips(date);

  return (
    <main className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="w-full max-w-2xl">
        <h1 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Available Trips
        </h1>
        <DatePicker />

        {trips.length === 0 ? (
          <p className="text-zinc-500">No trips available on this date.</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {trips.map((trip) => {
              const bookable = isBookable(trip.depart_at);
              return (
                <li key={trip.id}>
                  {bookable ? (
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
                  ) : (
                    <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-100 p-5 opacity-60 dark:border-zinc-800 dark:bg-zinc-900">
                      <div>
                        <p className="font-medium text-zinc-700 dark:text-zinc-300">
                          {trip.origin} → {trip.destination}
                        </p>
                        <p className="text-sm text-zinc-500">
                          {trip.buses.name} · {new Date(trip.depart_at).toLocaleString("en-LK")}
                        </p>
                        <p className="mt-1 text-xs text-red-600">
                          Booking closed (less than {MIN_HOURS_BEFORE_DEPARTURE}h before departure)
                        </p>
                      </div>
                      <p className="font-semibold text-zinc-500">{formatLkr(trip.price_cents)}</p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
