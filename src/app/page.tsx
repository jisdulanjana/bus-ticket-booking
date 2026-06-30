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

function RouteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-emerald-600">
      <path
        d="M4 16V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10M4 16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2M4 16h16M7.5 18.5v1M16.5 18.5v1M6 11h12"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 7v5l3.5 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
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
    <main className="flex flex-1 flex-col">
      <section className="bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 px-4 pb-20 pt-16 text-white">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Go anywhere in Sri Lanka</h1>
          <p className="mt-3 text-emerald-50/90">Pick a date, choose your seat, ride comfortably.</p>
        </div>
      </section>

      <div className="mx-auto -mt-10 w-full max-w-3xl px-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-lg shadow-emerald-900/5 dark:border-zinc-800 dark:bg-zinc-950">
          <DatePicker />
        </div>

        <div className="mt-8 pb-16">
          {trips.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-300 p-10 text-center text-zinc-500 dark:border-zinc-700">
              No trips available on this date. Try another date.
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {trips.map((trip) => {
                const bookable = isBookable(trip.depart_at);
                const card = (
                  <div
                    className={[
                      "flex items-center justify-between rounded-xl border bg-white p-5 transition dark:bg-zinc-950",
                      bookable
                        ? "border-zinc-200 hover:border-emerald-500 hover:shadow-md hover:shadow-emerald-900/5 dark:border-zinc-800 dark:hover:border-emerald-600"
                        : "border-zinc-200 opacity-60 dark:border-zinc-800",
                    ].join(" ")}
                  >
                    <div className="flex items-start gap-4">
                      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950">
                        <RouteIcon />
                      </span>
                      <div>
                        <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                          {trip.origin} <span className="text-zinc-400">→</span> {trip.destination}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-sm text-zinc-500">
                          {trip.buses.name}
                          <span className="text-zinc-300 dark:text-zinc-700">·</span>
                          <ClockIcon />
                          {new Date(trip.depart_at).toLocaleString("en-LK", {
                            weekday: "short",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                        {!bookable && (
                          <p className="mt-1.5 inline-block rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600 dark:bg-red-950 dark:text-red-400">
                            Booking closed
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="shrink-0 pl-3 text-lg font-bold text-zinc-900 dark:text-zinc-50">
                      {formatLkr(trip.price_cents)}
                    </p>
                  </div>
                );

                return <li key={trip.id}>{bookable ? <Link href={`/trips/${trip.id}`}>{card}</Link> : card}</li>;
              })}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
