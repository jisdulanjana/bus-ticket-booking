import Link from "next/link";

export default async function BookingCancelledPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="w-full max-w-md text-center">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950">
          <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7">
            <path d="M12 8v5M12 16.5v.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        </span>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Payment cancelled</h1>
        <p className="mt-2 text-sm text-zinc-500">Your seats are still held until the hold expires. You can try paying again.</p>
        <Link
          href={`/booking/${id}`}
          className="mt-6 inline-block rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          Back to booking
        </Link>
      </div>
    </main>
  );
}
