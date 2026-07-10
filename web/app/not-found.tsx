import Link from "next/link";
import { btnPrimary, btnSecondary } from "@/components/ui";

export default function NotFound() {
  return (
    <main
      id="main"
      className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center"
    >
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        aria-hidden
        className="text-danger"
      >
        <circle cx="12" cy="12" r="10.25" strokeWidth="1.5" />
        <circle
          cx="12"
          cy="12"
          r="7.75"
          strokeWidth="1"
          strokeDasharray="0.1 2.1"
          strokeLinecap="round"
        />
        <path d="M5 19L19 5" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      <p className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-danger">
        No passport on file
      </p>
      <h1 className="text-3xl font-semibold tracking-tight">
        No passport at this address
      </h1>
      <p className="max-w-md leading-[1.65] text-ink-secondary">
        Passports can only be issued by Reputation Passport. If someone sent
        you this link as proof of their track record, treat it with caution.
        Check the address for typos, or start from the homepage.
      </p>
      <div className="mt-2 flex gap-3">
        <Link href="/" className={btnPrimary}>
          Go to homepage
        </Link>
        <Link href="/p/demo" className={btnSecondary}>
          See the sample passport
        </Link>
      </div>
    </main>
  );
}
