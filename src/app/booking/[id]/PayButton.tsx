"use client";

import { useState } from "react";

const PAYHERE_CHECKOUT_URL =
  process.env.NEXT_PUBLIC_PAYHERE_SANDBOX === "false"
    ? "https://www.payhere.lk/pay/checkout"
    : "https://sandbox.payhere.lk/pay/checkout";

export default function PayButton({ bookingId }: { bookingId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/v1/payments/payhere/initiate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ booking_id: bookingId }),
    });
    const params = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(params.error?.message ?? "Could not start payment.");
      return;
    }

    const form = document.createElement("form");
    form.method = "POST";
    form.action = PAYHERE_CHECKOUT_URL;
    for (const [key, value] of Object.entries(params)) {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = String(value ?? "");
      form.appendChild(input);
    }
    document.body.appendChild(form);
    form.submit();
  }

  return (
    <div>
      <button
        onClick={pay}
        disabled={loading}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? "Redirecting..." : "Pay with PayHere"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
