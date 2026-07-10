import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-neutral-200 px-6 py-8 text-sm text-neutral-500 dark:text-neutral-400 dark:border-neutral-800">
      <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-4">
        <p>© Reputation Passport</p>
        <nav aria-label="Footer" className="flex gap-4">
          <Link
            href="/p/demo"
            className="hover:text-neutral-700 dark:hover:text-neutral-300"
          >
            Sample passport
          </Link>
          <Link
            href="/platforms"
            className="hover:text-neutral-700 dark:hover:text-neutral-300"
          >
            For marketplaces
          </Link>
          <Link
            href="/docs/api"
            className="hover:text-neutral-700 dark:hover:text-neutral-300"
          >
            API preview
          </Link>
          <Link
            href="/docs/verification"
            className="hover:text-neutral-700 dark:hover:text-neutral-300"
          >
            How verification works
          </Link>
          <Link
            href="/privacy"
            className="hover:text-neutral-700 dark:hover:text-neutral-300"
          >
            Privacy
          </Link>
          <a
            href="mailto:anthonychenjiaqi@gmail.com?subject=Reputation%20Passport"
            className="hover:text-neutral-700 dark:hover:text-neutral-300"
          >
            Contact
          </a>
        </nav>
      </div>
    </footer>
  );
}
