"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { formatLkr, type SeatsResponse } from "@/lib/types";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SeatPicker({
  tripId,
  priceCents,
  initialSeats,
}: {
  tripId: string;
  priceCents: number;
  initialSeats: SeatsResponse;
}) {
  const router = useRouter();
  const [taken, setTaken] = useState<string[]>(initialSeats.taken_seats);
  const [selected, setSelected] = useState<string[]>([]);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { rows, cols, seats } = initialSeats.layout.layout;

  useEffect(() => {
    const channel = supabase
      .channel(`booking_seats:${tripId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "booking_seats", filter: `trip_id=eq.${tripId}` },
        async () => {
          const res = await fetch(`/api/v1/trips/${tripId}/seats`, { cache: "no-store" });
          const data: SeatsResponse = await res.json();
          setTaken(data.taken_seats);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId]);

  function toggleSeat(seat: string) {
    if (taken.includes(seat)) return;
    setSelected((prev) => (prev.includes(seat) ? prev.filter((s) => s !== seat) : [...prev, seat]));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (selected.length === 0) {
      setError("Select at least one seat.");
      return;
    }
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/v1/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trip_id: tripId,
        seats: selected,
        customer_name: form.name,
        email: form.email,
        phone: form.phone,
      }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error?.message ?? "Something went wrong.");
      if (data.error?.code === "seat_taken") {
        const seatsRes = await fetch(`/api/v1/trips/${tripId}/seats`, { cache: "no-store" });
        const seatsData: SeatsResponse = await seatsRes.json();
        setTaken(seatsData.taken_seats);
        setSelected([]);
      }
      return;
    }

    router.push(`/booking/${data.booking_id}`);
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-5 flex items-center justify-center gap-2 text-zinc-400">
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
            <path
              d="M12 3a3 3 0 0 1 3 3v1h2a1 1 0 0 1 1 1v3l-1 1v6a1 1 0 0 1-1 1h-8a1 1 0 0 1-1-1v-6l-1-1V8a1 1 0 0 1 1-1h2V6a3 3 0 0 1 3-3Z"
              stroke="currentColor"
              strokeWidth="1.3"
            />
          </svg>
          <span className="text-xs font-medium uppercase tracking-wide">Driver</span>
        </div>

        <div className="inline-grid gap-2.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {Array.from({ length: rows * cols }).map((_, i) => {
            const seat = seats[i];
            if (!seat) return <div key={i} />;
            const isTaken = taken.includes(seat);
            const isSelected = selected.includes(seat);
            return (
              <button
                key={seat}
                type="button"
                disabled={isTaken}
                onClick={() => toggleSeat(seat)}
                className={[
                  "flex h-11 w-11 items-center justify-center rounded-t-lg rounded-b-md text-xs font-semibold shadow-sm transition",
                  isTaken
                    ? "cursor-not-allowed bg-zinc-200 text-zinc-400 shadow-none dark:bg-zinc-800 dark:text-zinc-600"
                    : isSelected
                    ? "scale-105 bg-emerald-600 text-white shadow-emerald-900/20"
                    : "bg-zinc-100 text-zinc-700 hover:bg-emerald-100 hover:text-emerald-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-emerald-950 dark:hover:text-emerald-400",
                ].join(" ")}
              >
                {seat}
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex flex-wrap gap-4 text-xs text-zinc-500">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-t bg-zinc-100 dark:bg-zinc-800" /> Available
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-t bg-emerald-600" /> Selected
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-t bg-zinc-200 dark:bg-zinc-700" /> Taken
          </span>
        </div>
      </div>

      <form
        onSubmit={submit}
        className="flex w-full flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-6 lg:sticky lg:top-24 lg:max-w-xs dark:border-zinc-800 dark:bg-zinc-950"
      >
        <div className="mb-1 flex items-baseline justify-between">
          <p className="text-sm text-zinc-500">
            {selected.length} seat{selected.length === 1 ? "" : "s"}
          </p>
          <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            {formatLkr(priceCents * selected.length)}
          </p>
        </div>
        {selected.length > 0 && (
          <p className="-mt-1 mb-1 text-xs text-zinc-400">{selected.join(", ")}</p>
        )}

        <input
          required
          placeholder="Full name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="rounded-lg border border-zinc-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
        />
        <input
          required
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="rounded-lg border border-zinc-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
        />
        <input
          placeholder="Phone (optional)"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="rounded-lg border border-zinc-300 px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting || selected.length === 0}
          className="mt-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Booking..." : "Hold seats & continue"}
        </button>
        <p className="text-center text-xs text-zinc-400">Seats are held for 10 minutes while you pay.</p>
      </form>
    </div>
  );
}
