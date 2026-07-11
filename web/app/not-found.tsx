import type { Metadata } from "next";
import Link from "next/link";
import { SealSlash } from "@/components/icons";
import { btnPrimary, btnSecondary } from "@/components/ui";

export const metadata: Metadata = {
  title: "No passport on file — Reputation Passport",
  description:
    "Nothing is issued at this address. Check the link for typos, or start from the homepage.",
};

export default function NotFound() {
  return (
    <main
      id="main"
      className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center"
    >
      <SealSlash size={32} className="text-danger" />
      <p className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-danger">
        No passport on file
      </p>
      <h1 className="text-4xl font-semibold tracking-[-0.025em]">
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
