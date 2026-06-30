import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-emerald-900/10 bg-white/80 backdrop-blur dark:border-emerald-50/10 dark:bg-zinc-950/80">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <path
                d="M4 16V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10M4 16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2M4 16h16M7.5 18.5v1M16.5 18.5v1M6 11h12"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="7.5" cy="13.5" r="0.9" fill="currentColor" />
              <circle cx="16.5" cy="13.5" r="0.9" fill="currentColor" />
            </svg>
          </span>
          <span className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Lanka<span className="text-emerald-600">Bus</span>
          </span>
        </Link>
        <nav className="flex items-center gap-5 text-sm font-medium text-zinc-500">
          <Link href="/" className="transition hover:text-zinc-900 dark:hover:text-zinc-100">
            Book
          </Link>
          <Link href="/admin" className="transition hover:text-zinc-900 dark:hover:text-zinc-100">
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
