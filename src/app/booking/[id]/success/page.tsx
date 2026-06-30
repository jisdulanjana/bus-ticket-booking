import Link from "next/link";

export default async function BookingSuccessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="w-full max-w-md text-center">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950">
          <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7">
            <path d="M5 12.5l4.5 4.5L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Payment received</h1>
        <p className="mt-2 text-sm text-zinc-500">
          We&apos;re confirming your booking. This usually takes a few seconds.
        </p>
        <Link
          href={`/booking/${id}`}
          className="mt-6 inline-block rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          View booking status
        </Link>
      </div>
    </main>
  );
}
