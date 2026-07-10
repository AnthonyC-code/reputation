import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "For marketplaces — Reputation Passport",
  description:
    "One API call returns a seller's verified cross-platform track record: score, confidence, provenance, and an offline-verifiable signature.",
};

const CONTACT = "anthonychenjiaqi@gmail.com";

export default function PlatformsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-14">
      <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
        For marketplaces &amp; platforms
      </p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">
        Stop underwriting sellers blind
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-neutral-600 dark:text-neutral-400">
        Every seller application is a blank slate you pay to investigate —
        fraud if you guess wrong, lost GMV if you reject good sellers. One API
        call returns the applicant&apos;s verified history from the platforms
        where they already sell.
      </p>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">How it fits your queue</h2>
        <ol className="mt-4 space-y-3 text-neutral-700 dark:text-neutral-300">
          {[
            ["1", "An application comes in — you have a store domain, an email, or nothing but a name."],
            ["2", "You call GET /v1/passports/lookup with the domain or a SHA-256 of the email. Raw emails never leave your system."],
            ["3", "You get back a score (0–100), a confidence figure based on evidence volume, the component breakdown, and the provenance of every input — verified-API vs self-reported, per platform."],
            ["4", "Your analyst (or your rules engine) decides. The response carries a signature you can verify offline, so you can cache it, audit it, and never take our word for anything."],
          ].map(([n, t]) => (
            <li key={n} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600/10 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                {n}
              </span>
              {t}
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm">
          <Link href="/docs/api" className="font-medium text-emerald-700 underline dark:text-emerald-400">
            See the full sample API response →
          </Link>
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">
          What about sellers who aren&apos;t on it yet?
        </h2>
        <p className="mt-2 text-neutral-700 dark:text-neutral-300">
          Early on, most lookups will miss — we&apos;re honest about that. The
          pilot product is the <strong>invite flow</strong>: when a lookup
          returns no match, you send the applicant a link; they connect their
          existing storefronts in a couple of clicks, and a verified passport
          appears in your queue — usually the same day. You stop asking
          applicants for screenshots of their Shopify dashboard.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">
          What happens if this startup disappears?
        </h2>
        <p className="mt-2 text-neutral-700 dark:text-neutral-300">
          The architecture makes continuity a feature, not a promise. Every
          passport response is signed; signatures verify offline, forever,
          against keys published at{" "}
          <code className="text-sm">/.well-known/jwks.json</code>. You can
          cache every response you&apos;ve paid for and re-verify it without
          us. Sellers can export their signed history. We also recommend
          integrating async and advisory — enrich your review queue rather
          than blocking your onboarding path on any third party, including us.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Pricing</h2>
        <p className="mt-2 text-neutral-700 dark:text-neutral-300">
          <strong>Design partners: free during the pilot</strong>, and you
          shape the pricing with us. The expected model is per-lookup metered
          pricing with volume tiers — think risk-data-API economics, not
          seat-based SaaS. If per-lookup pricing at your volume wouldn&apos;t
          pencil out, tell us in the first call; that&apos;s exactly the
          conversation the pilot is for.
        </p>
      </section>

      <section className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-emerald-600/30 bg-emerald-600/5 p-6">
        <div>
          <h2 className="text-lg font-semibold">Become a design partner</h2>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            We&apos;re selecting 1–2 platforms to build the pilot with. Direct
            line to the founder, sandbox access first.
          </p>
        </div>
        <a
          href={`mailto:${CONTACT}?subject=Reputation%20Passport%20design%20partner%20(platform)&body=Hi%2C%20I%20lead%20trust%2Fonboarding%20at%3A%20%0AMonthly%20seller%20applications%20(roughly)%3A%20%0AWhat%20we%20use%20today%3A%20`}
          className="rounded-lg bg-emerald-600 px-5 py-2.5 font-medium text-white hover:bg-emerald-700"
        >
          Start the conversation
        </a>
      </section>
    </main>
  );
}
