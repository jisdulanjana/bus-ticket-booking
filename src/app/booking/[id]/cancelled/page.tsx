import Link from "next/link";

export default async function BookingCancelledPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="w-full max-w-md text-center">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Payment cancelled</h1>
        <p className="mt-2 text-sm text-zinc-500">Your seats are still held until the hold expires. You can try paying again.</p>
        <Link href={`/booking/${id}`} className="mt-6 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white">
          Back to booking
        </Link>
      </div>
    </main>
  );
}
