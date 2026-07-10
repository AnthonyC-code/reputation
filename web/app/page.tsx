import Link from "next/link";
import { ArrowRight, Check } from "@/components/icons";
import { PassportCard } from "@/components/passport-card";
import { Overline, btnPrimary, btnSecondary } from "@/components/ui";

const CONTACT = "anthonychenjiaqi@gmail.com";

const platforms = [
  { name: "Shopify", status: "at launch" },
  { name: "Judge.me reviews", status: "at launch" },
  { name: "CSV import", status: "at launch" },
  { name: "Etsy", status: "in progress" },
  { name: "eBay", status: "planned" },
];

const steps = [
  {
    n: "01",
    title: "Connect",
    body: "Link Shopify and Judge.me in a couple of clicks. We import your order and review history read-only, through official APIs.",
  },
  {
    n: "02",
    title: "Verify",
    body: "Your numbers come straight from the platform's API, not self-reported, and every import is cryptographically signed. Any alteration afterwards is detectable by anyone, free.",
  },
  {
    n: "03",
    title: "Carry",
    body: "A public passport page, an embeddable trust badge, and an API that shows marketplaces the seller behind the storefront.",
  },
];

const promises = [
  "Read-only access. We can never change anything in your store.",
  "We import order counts, dispute outcomes, ratings, and reviews: the facts that make up your track record.",
  "Your customers' names, emails, and addresses are never imported. Buyer data is stripped before anything is stored.",
  "Disconnect anytime. Your imported data is deleted, and your passport with it if you choose.",
];

export default function Home() {
  return (
    <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-6">
      {/* Hero */}
      <section className="grid items-center gap-12 pb-20 pt-24 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Overline>Portable seller credentials</Overline>
          <h1 className="mt-4 max-w-xl text-[clamp(2.5rem,5vw,3.5rem)] font-semibold leading-[1.05] tracking-[-0.03em]">
            Your reputation, everywhere you sell
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-[1.65] text-ink-secondary">
            Years of five-star history shouldn&apos;t reset to zero when you
            expand to a new marketplace. Connect your storefronts once and get
            a verified, portable track record you can take anywhere.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link href="/p/demo" className={btnPrimary}>
              See a sample passport
              <ArrowRight size={14} />
            </Link>
            <a href="#early-access" className={btnSecondary}>
              Join early access
            </a>
          </div>
          <p className="mt-5 flex items-center gap-2 text-[13px] text-ink-tertiary">
            <Check size={14} className="shrink-0" />
            Free for sellers, forever. Marketplaces pay to query the API; you
            never do.
          </p>
        </div>
        <div className="relative lg:col-span-5">
          {/* right-0 keeps the decorative grid from widening the page. */}
          <div aria-hidden className="hero-grid absolute -inset-y-8 -left-8 right-0" />
          <PassportCard />
        </div>
      </section>

      {/* Works with */}
      <section className="flex flex-wrap items-baseline gap-x-8 gap-y-3 border-t border-line py-8">
        <Overline>Works with</Overline>
        <ul className="flex flex-wrap items-baseline gap-x-6 gap-y-3">
          {platforms.map((p) => (
            <li key={p.name} className="flex items-baseline gap-2 text-sm">
              {p.name}
              <span
                className={`rounded-xs px-1.5 py-0.5 font-mono text-[11px] font-medium uppercase tracking-[0.08em] ${
                  p.status === "at launch"
                    ? "bg-accent-tint text-accent"
                    : "bg-sunken text-ink-tertiary"
                }`}
              >
                {p.status}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* What you get, day one */}
      <section className="border-t border-line py-14">
        <h2 className="text-[22px] font-semibold tracking-[-0.01em]">
          Useful on day one — no marketplace adoption required
        </h2>
        <p className="mt-3 max-w-2xl leading-[1.65] text-ink-secondary">
          Connect a store and you get a passport page, published only when you
          choose, plus a trust badge for your own site, your email signature,
          and your wholesale or marketplace applications. As platforms join,
          they query your passport automatically. The value doesn&apos;t wait
          for them.
        </p>
        <div className="mt-10">
          {steps.map((s) => (
            <div
              key={s.n}
              className="grid gap-2 border-t border-line py-6 sm:grid-cols-[64px_200px_1fr] sm:gap-0"
            >
              <span className="font-mono text-sm text-ink-tertiary">{s.n}</span>
              <h3 className="text-base font-semibold">{s.title}</h3>
              <p className="max-w-xl text-sm leading-[1.65] text-ink-secondary">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Data access terms */}
      <section className="pb-14">
        <div className="rounded-md border border-line-strong bg-surface p-6 sm:p-8">
          <Overline>Data access terms</Overline>
          <ul className="mt-5 space-y-4">
            {promises.map((line) => (
              <li key={line} className="flex gap-3 text-sm leading-[1.65]">
                <Check size={16} className="mt-0.5 shrink-0 text-accent" />
                <span className="text-ink-secondary">{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Early access */}
      <section id="early-access" className="border-t border-line py-14">
        <h2 className="text-[22px] font-semibold tracking-[-0.01em]">
          Be a founding seller
        </h2>
        <p className="mt-3 max-w-xl leading-[1.65] text-ink-secondary">
          We&apos;re onboarding a small group of design partners first. Your
          feedback shapes the product, and founding sellers keep a badge that
          says so.
        </p>
        <a
          href={`mailto:${CONTACT}?subject=Reputation%20Passport%20early%20access&body=Hi%2C%20I%27d%20like%20to%20join%20the%20early%20access%20list.%0A%0AMy%20store%3A%20`}
          className={`${btnPrimary} mt-6`}
        >
          Email us to join the list
        </a>
        <p className="mt-3 text-[13px] text-ink-tertiary">
          One email, no newsletter. We reply personally.
        </p>
        <p className="mt-8 text-sm text-ink-secondary">
          Run a marketplace?{" "}
          <Link
            href="/platforms"
            className="inline-flex items-center gap-1 font-medium text-ink underline decoration-line-strong underline-offset-[3px] hover:decoration-accent"
          >
            See the reputation API
            <ArrowRight size={14} />
          </Link>
        </p>
      </section>
    </main>
  );
}
