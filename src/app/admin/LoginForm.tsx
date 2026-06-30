"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setSubmitting(false);
    if (!res.ok) {
      setError("Incorrect password.");
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex w-full max-w-xs flex-col gap-3">
      <input
        type="password"
        required
        placeholder="Admin password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {submitting ? "Checking..." : "Log in"}
      </button>
    </form>
  );
}
