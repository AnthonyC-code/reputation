import Link from "next/link";

const CONTACT = "anthonychenjiaqi@gmail.com";

const platforms = [
  { name: "Shopify", status: "at launch" },
  { name: "Judge.me reviews", status: "at launch" },
  { name: "Etsy", status: "in progress" },
  { name: "eBay", status: "planned" },
  { name: "CSV import", status: "at launch" },
];

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center px-6">
      {/* Hero */}
      <section className="flex flex-col items-center gap-6 pb-16 pt-24 text-center">
        <span className="rounded-full border border-emerald-600/30 bg-emerald-600/10 px-3 py-1 text-sm text-emerald-700 dark:text-emerald-400">
          Early access — founding sellers get in first
        </span>
        <h1 className="max-w-3xl text-5xl font-semibold tracking-tight sm:text-6xl">
          Your reputation, everywhere you sell
        </h1>
        <p className="max-w-xl text-lg text-neutral-600 dark:text-neutral-400">
          Years of five-star history shouldn&apos;t reset to zero when you
          expand to a new marketplace. Connect your storefronts once and get a
          verified, portable track record you can take anywhere.
        </p>
        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
          Free for sellers, forever — marketplaces pay to query the API, you
          never do.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/p/demo"
            className="rounded-lg bg-emerald-600 px-5 py-2.5 font-medium text-white hover:bg-emerald-700"
          >
            See a sample passport →
          </Link>
          <a
            href="#early-access"
            className="rounded-lg border border-neutral-300 px-5 py-2.5 font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
          >
            Join early access
          </a>
        </div>
      </section>

      {/* Works with */}
      <section className="w-full max-w-3xl border-t border-neutral-200 py-10 text-center dark:border-neutral-800">
        <h2 className="text-sm font-medium uppercase tracking-wide text-neutral-500">
          Works with
        </h2>
        <ul className="mt-4 flex flex-wrap items-center justify-center gap-3">
          {platforms.map((p) => (
            <li
              key={p.name}
              className="rounded-full border border-neutral-200 px-4 py-1.5 text-sm dark:border-neutral-800"
            >
              {p.name}{" "}
              <span
                className={
                  p.status === "at launch"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-neutral-500"
                }
              >
                · {p.status}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* What you get, day one */}
      <section className="w-full max-w-3xl border-t border-neutral-200 py-12 dark:border-neutral-800">
        <h2 className="text-2xl font-semibold tracking-tight">
          Useful on day one — no marketplace adoption required
        </h2>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          From the moment you connect a store, you get a public passport page
          and a trust badge for your own site, your email signature, and your
          wholesale or marketplace applications. As platforms join, they query
          your passport automatically — but the value doesn&apos;t wait for
          them.
        </p>
        <div className="mt-6 grid gap-4 text-left sm:grid-cols-3">
          {[
            {
              title: "Connect",
              body: "Link Shopify and Judge.me in a couple of clicks. We import your order and review history read-only, through official APIs.",
            },
            {
              title: "Verify",
              body: "Your numbers come straight from the platform's API — not self-reported, not editable by anyone, including us. Anyone can check a passport is genuine, free.",
            },
            {
              title: "Carry",
              body: "A public passport page, an embeddable trust badge, and an API that shows marketplaces the seller behind the storefront.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-neutral-200 p-5 dark:border-neutral-800"
            >
              <h3 className="mb-2 font-medium">{f.title}</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Data access promises */}
      <section className="w-full max-w-3xl border-t border-neutral-200 py-12 dark:border-neutral-800">
        <h2 className="text-2xl font-semibold tracking-tight">
          What we access — and what we never touch
        </h2>
        <ul className="mt-4 space-y-3 text-neutral-700 dark:text-neutral-300">
          {[
            "Read-only access. We can never change anything in your store.",
            "We import order counts, dispute outcomes, ratings, and reviews — the facts that make up your track record.",
            "Your customers' names, emails, and addresses are never imported. Buyer data is stripped before anything is stored.",
            "Disconnect anytime. Your imported data is deleted, and your passport with it if you choose.",
          ].map((line) => (
            <li key={line} className="flex gap-3">
              <span aria-hidden className="text-emerald-600">
                ✓
              </span>
              {line}
            </li>
          ))}
        </ul>
      </section>

      {/* Early access */}
      <section
        id="early-access"
        className="w-full max-w-3xl border-t border-neutral-200 py-12 text-center dark:border-neutral-800"
      >
        <h2 className="text-2xl font-semibold tracking-tight">
          Be a founding seller
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-neutral-600 dark:text-neutral-400">
          We&apos;re onboarding a small group of design partners first — your
          feedback shapes the product, and founding sellers keep a badge that
          says so.
        </p>
        <a
          href={`mailto:${CONTACT}?subject=Reputation%20Passport%20early%20access&body=Hi%2C%20I%27d%20like%20to%20join%20the%20early%20access%20list.%0A%0AMy%20store%3A%20`}
          className="mt-5 inline-block rounded-lg bg-emerald-600 px-5 py-2.5 font-medium text-white hover:bg-emerald-700"
        >
          Email us to join the list
        </a>
        <p className="mt-3 text-xs text-neutral-500">
          One email, no newsletter. We reply personally.
        </p>
        <p className="mt-6 text-sm text-neutral-600 dark:text-neutral-400">
          Run a marketplace?{" "}
          <Link
            href="/platforms"
            className="font-medium text-emerald-700 underline dark:text-emerald-400"
          >
            See the reputation API →
          </Link>
        </p>
      </section>
    </main>
  );
}
