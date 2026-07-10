import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-neutral-200 px-6 py-3 dark:border-neutral-800">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-emerald-700 focus:px-3 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to content
      </a>
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2 py-1 font-semibold">
          <ShieldMark />
          Reputation Passport
        </Link>
        <nav
          aria-label="Main"
          className="flex items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400"
        >
          <Link
            href="/p/demo"
            className="hover:text-neutral-900 dark:hover:text-neutral-100"
          >
            Sample passport
          </Link>
          <Link
            href="/platforms"
            className="hidden hover:text-neutral-900 sm:inline dark:hover:text-neutral-100"
          >
            For marketplaces
          </Link>
          <Link
            href="/docs/api"
            className="hidden hover:text-neutral-900 sm:inline dark:hover:text-neutral-100"
          >
            API
          </Link>
          <Link
            href="/#early-access"
            className="rounded-lg bg-emerald-700 px-3 py-1.5 font-medium text-white hover:bg-emerald-800"
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
      className="text-emerald-700 dark:text-emerald-500"
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
