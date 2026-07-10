import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">
        No passport at this address
      </h1>
      <p className="max-w-md text-neutral-600 dark:text-neutral-400">
        Passports can only be issued by Reputation Passport — if someone sent
        you this link as proof of their track record, treat it with caution.
        Check the address for typos, or start from the homepage.
      </p>
      <div className="mt-2 flex gap-3">
        <Link
          href="/"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Go to homepage
        </Link>
        <Link
          href="/p/demo"
          className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium dark:border-neutral-700"
        >
          See the sample passport
        </Link>
      </div>
    </main>
  );
}
