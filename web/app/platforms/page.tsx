import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import { Overline, btnPrimary } from "@/components/ui";

export const metadata: Metadata = {
  title: "For marketplaces — Reputation Passport",
  description:
    "One API call returns a seller's verified cross-platform track record: score, confidence, provenance, and an offline-verifiable signature.",
};

const CONTACT = "anthonychenjiaqi@gmail.com";

const queueSteps = [
  "An application comes in. You have a store domain, an email, or nothing but a name.",
  "You call GET /v1/passports/lookup with the domain or a SHA-256 of the email. Raw emails never leave your system.",
  "You get back a score (0–100), a confidence figure based on evidence volume, the component breakdown, and the provenance of every input: verified-API vs self-reported, per platform.",
  "Your analyst (or your rules engine) decides. The response carries a signature you can verify offline, so you can cache it, audit it, and never take our word for anything.",
];

const linkClass =
  "underline decoration-line-strong underline-offset-[3px] hover:decoration-accent";

export default function PlatformsPage() {
  return (
    <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-6 py-14">
      <Overline>For marketplaces &amp; platforms</Overline>
      <h1 className="mt-3 text-4xl font-semibold tracking-[-0.025em]">
        Stop underwriting sellers blind
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-[1.65] text-ink-secondary">
        Every seller application is a blank slate you pay to investigate —
        fraud if you guess wrong, lost GMV if you reject good sellers. One API
        call returns the applicant&apos;s verified history from the platforms
        where they already sell.
      </p>

      <section className="mt-12">
        <h2 className="text-[22px] font-semibold tracking-[-0.01em]">
          How it fits your queue
        </h2>
        <ol className="mt-2">
          {queueSteps.map((t, i) => (
            <li
              key={t}
              className="grid gap-2 border-b border-line py-5 last:border-b-0 sm:grid-cols-[64px_1fr]"
            >
              <span className="font-mono text-sm text-ink-tertiary">
                0{i + 1}
              </span>
              <span className="leading-[1.65] text-ink-secondary">{t}</span>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm">
          <Link
            href="/docs/api"
            className={`inline-flex items-center gap-1 font-medium ${linkClass}`}
          >
            See the full sample API response
            <ArrowRight size={14} />
          </Link>
        </p>
      </section>

      <section className="mt-12 border-t border-line pt-10">
        <h2 className="text-[22px] font-semibold tracking-[-0.01em]">
          What about sellers who aren&apos;t on it yet?
        </h2>
        <p className="mt-3 leading-[1.65] text-ink-secondary">
          Early on, most lookups will miss; we&apos;re honest about that. The
          pilot product is the <strong>invite flow</strong>: when a lookup
          returns no match, you send the applicant a link; they connect their
          existing storefronts in a couple of clicks, and a verified passport
          appears in your queue, usually the same day. You stop asking
          applicants for screenshots of their Shopify dashboard.
        </p>
      </section>

      <section className="mt-12 border-t border-line pt-10">
        <h2 className="text-[22px] font-semibold tracking-[-0.01em]">
          What happens if this startup disappears?
        </h2>
        <p className="mt-3 leading-[1.65] text-ink-secondary">
          The architecture makes continuity a feature, not a promise. Every
          passport response is signed; signatures verify offline, forever,
          against keys that will be published at{" "}
          <code className="font-mono text-sm">
            api.reputationpassport.dev/.well-known/jwks.json
          </code>
          . You can cache every response you&apos;ve paid for and re-verify it
          without us, and sellers will be able to export their signed history.
          We also recommend integrating async and advisory: enrich your review
          queue rather than blocking your onboarding path on any third party,
          including us.
        </p>
      </section>

      <section className="mt-12 border-t border-line pt-10">
        <h2 className="text-[22px] font-semibold tracking-[-0.01em]">
          Pricing
        </h2>
        <p className="mt-3 leading-[1.65] text-ink-secondary">
          <strong>Design partners: free during the pilot</strong>, and you
          shape the pricing with us. The expected model is per-lookup metered
          pricing with volume tiers: think risk-data-API economics, not
          seat-based SaaS. If per-lookup pricing at your volume wouldn&apos;t
          pencil out, tell us in the first call; that&apos;s exactly the
          conversation the pilot is for.
        </p>
      </section>

      <section className="mt-14 flex flex-wrap items-center justify-between gap-5 rounded-md border border-line-strong bg-surface p-6 sm:p-8">
        <div>
          <Overline>Design partners</Overline>
          <h2 className="mt-2 text-base font-semibold">
            Become a design partner
          </h2>
          <p className="mt-1 text-sm leading-[1.65] text-ink-secondary">
            We&apos;re selecting 1–2 platforms to build the pilot with. Direct
            line to the founder, sandbox access first.
          </p>
        </div>
        <a
          href={`mailto:${CONTACT}?subject=Reputation%20Passport%20design%20partner%20(platform)&body=Hi%2C%20I%20lead%20trust%2Fonboarding%20at%3A%20%0AMonthly%20seller%20applications%20(roughly)%3A%20%0AWhat%20we%20use%20today%3A%20`}
          className={btnPrimary}
        >
          Start the conversation
        </a>
      </section>
    </main>
  );
}
