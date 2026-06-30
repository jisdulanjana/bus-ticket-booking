"use client";

import { useRouter, useSearchParams } from "next/navigation";

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function todayIso() {
  return isoDate(new Date());
}

function tomorrowIso() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return isoDate(d);
}

function maxDateIso() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return isoDate(d);
}

export default function DatePicker() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const date = searchParams.get("date") ?? todayIso();

  function setDate(value: string) {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("date", value);
    } else {
      params.delete("date");
    }
    router.push(`/?${params.toString()}`);
  }

  const quickOptions = [
    { label: "Today", value: todayIso() },
    { label: "Tomorrow", value: tomorrowIso() },
  ];

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950">
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
            <rect x="3.5" y="5" width="17" height="15" rx="2" stroke="currentColor" strokeWidth="1.6" />
            <path d="M3.5 9.5h17M8 3v3.5M16 3v3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </span>
        <input
          id="travel-date"
          type="date"
          value={date}
          min={todayIso()}
          max={maxDateIso()}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </div>
      <div className="flex gap-2">
        {quickOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setDate(opt.value)}
            className={[
              "rounded-full px-3 py-1.5 text-xs font-medium transition",
              date === opt.value
                ? "bg-emerald-600 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800",
            ].join(" ")}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
