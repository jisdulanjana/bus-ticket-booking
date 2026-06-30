"use client";

import { useRouter, useSearchParams } from "next/navigation";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function maxDateIso() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

export default function DatePicker() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const date = searchParams.get("date") ?? todayIso();

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set("date", value);
    } else {
      params.delete("date");
    }
    router.push(`/?${params.toString()}`);
  }

  return (
    <div className="mb-6 flex items-center gap-3">
      <label htmlFor="travel-date" className="text-sm text-zinc-500">
        Travel date
      </label>
      <input
        id="travel-date"
        type="date"
        value={date}
        min={todayIso()}
        max={maxDateIso()}
        onChange={onChange}
        className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      />
    </div>
  );
}
