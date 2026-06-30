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
    <div className="flex flex-col gap-8 sm:flex-row">
      <div>
        <p className="mb-3 text-sm text-zinc-500">Tap a seat to select it.</p>
        <div className="inline-grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
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
                  "h-10 w-10 rounded-md text-xs font-medium transition",
                  isTaken
                    ? "cursor-not-allowed bg-zinc-300 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-500"
                    : isSelected
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700",
                ].join(" ")}
              >
                {seat}
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex gap-4 text-xs text-zinc-500">
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded bg-zinc-100 dark:bg-zinc-800" /> Available
          </span>
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded bg-blue-600" /> Selected
          </span>
          <span className="flex items-center gap-1">
            <span className="h-3 w-3 rounded bg-zinc-300 dark:bg-zinc-700" /> Taken
          </span>
        </div>
      </div>

      <form onSubmit={submit} className="flex w-full max-w-xs flex-col gap-3">
        <p className="font-medium text-zinc-900 dark:text-zinc-50">
          {selected.length} seat{selected.length === 1 ? "" : "s"} · {formatLkr(priceCents * selected.length)}
        </p>
        <input
          required
          placeholder="Full name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <input
          required
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <input
          placeholder="Phone (optional)"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting || selected.length === 0}
          className="mt-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {submitting ? "Booking..." : "Hold seats & continue"}
        </button>
      </form>
    </div>
  );
}
