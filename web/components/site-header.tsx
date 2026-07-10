import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-neutral-200 px-6 py-3 dark:border-neutral-800">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <ShieldMark />
          Reputation Passport
        </Link>
        <nav className="flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
          <Link
            href="/p/demo"
            className="hover:text-neutral-900 dark:hover:text-neutral-100"
          >
            Sample passport
          </Link>
          <Link
            href="/#early-access"
            className="rounded-lg bg-emerald-600 px-3 py-1.5 font-medium text-white hover:bg-emerald-700"
          >
            Early access
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function ShieldMark({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="text-emerald-600 dark:text-emerald-500"
    >
      <path
        d="M12 2.5 4.5 5.5v6c0 4.7 3.2 8.2 7.5 10 4.3-1.8 7.5-5.3 7.5-10v-6L12 2.5Z"
        fill="currentColor"
        fillOpacity="0.15"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="m8.8 12 2.2 2.2 4.2-4.4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
