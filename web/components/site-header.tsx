import Link from "next/link";
import { SealMark } from "./icons";

export function SiteHeader() {
  return (
    <header className="border-b border-line">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-sm focus:bg-ink focus:px-3 focus:py-2 focus:text-sm focus:text-paper"
      >
        Skip to content
      </a>
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <SealMark size={22} className="text-accent" />
          <span className="whitespace-nowrap text-[15px] font-semibold">
            Reputation Passport
          </span>
        </Link>
        <nav
          aria-label="Main"
          className="flex items-center gap-3 text-sm text-ink-secondary sm:gap-5"
        >
          <Link href="/p/demo" className="whitespace-nowrap hover:text-ink">
            Sample passport
          </Link>
          <Link href="/platforms" className="hidden hover:text-ink sm:inline">
            For marketplaces
          </Link>
          <Link href="/docs/api" className="hidden hover:text-ink sm:inline">
            API
          </Link>
          <Link
            href="/#early-access"
            className="whitespace-nowrap rounded-sm bg-ink px-3 py-1.5 text-[13px] font-medium text-paper hover:bg-ink/90"
          >
            Early access
          </Link>
        </nav>
      </div>
    </header>
  );
}
