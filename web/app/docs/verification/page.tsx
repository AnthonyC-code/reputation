import type { Metadata } from "next";
import Link from "next/link";
import { Overline } from "@/components/ui";

export const metadata: Metadata = {
  title: "How verification works — Reputation Passport",
  description:
    "The chain of custody from platform API to signed score, what the signature proves, and, just as important, what it doesn't.",
};

const custodySteps: [string, string][] = [
  [
    "Import",
    "The seller authorizes read-only OAuth access to their storefront. We fetch orders, disputes, and reviews from the platform's official API. The seller never uploads these numbers, and neither they nor we can edit what the platform returns.",
  ],
  [
    "Store raw",
    "Every API response is stored verbatim (buyer-identifying data stripped first). Raw documents are the source of truth: every downstream number can be re-derived from them, and re-importing is idempotent.",
  ],
  [
    "Normalize",
    "Raw documents become typed events (sale, review, dispute, refund, cancellation), each carrying its provenance label and the original rating scale.",
  ],
  [
    "Score",
    "A versioned, published formula computes the score. Small samples are statistically discounted (Bayesian prior on ratings, Wilson lower bound on dispute rates) so five perfect reviews can never impersonate five thousand.",
  ],
  [
    "Sign",
    "The score, its full component breakdown, input summary, headline stats, and source list are canonicalized (RFC 8785) and signed with Ed25519 (implemented today, demonstrated on the sample passport). At launch, signed entries land in an append-only hash-chained log so altering history breaks every later link; a public transparency log (published chain heads) follows, which is what lets outsiders catch even us rewriting history.",
  ],
];

const linkClass =
  "underline decoration-line-strong underline-offset-[3px] hover:decoration-accent";

export default function VerificationDocsPage() {
  return (
    <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-6 py-14">
      <Overline>Trust model</Overline>
      <h1 className="mt-3 text-4xl font-semibold tracking-[-0.025em]">
        How verification works
      </h1>
      <p className="mt-4 text-lg leading-[1.65] text-ink-secondary">
        Written for the skeptical reader. If your job is adversarial thinking,
        this page is for you, including the section on what our signatures{" "}
        <em>don&apos;t</em> prove.
      </p>
      <div className="mt-5 border-l-[3px] border-line-strong bg-sunken px-4 py-3 text-sm leading-[1.65] text-ink-secondary">
        <strong className="text-ink">Status:</strong> the service is
        pre-launch. This page is the committed design; the scoring engine and
        signature scheme are implemented and demonstrated on the{" "}
        <Link href="/p/demo" className={linkClass}>
          sample passport
        </Link>
        , while the import pipeline, revocation, and the transparency log are
        in development. We mark below what runs today vs. what ships with
        launch.
      </div>

      <section className="mt-12">
        <h2 className="text-[22px] font-semibold tracking-[-0.01em]">
          Chain of custody
        </h2>
        <ol className="mt-2">
          {custodySteps.map(([title, body], i) => (
            <li
              key={title}
              className="grid gap-2 border-b border-line py-5 last:border-b-0 sm:grid-cols-[64px_140px_1fr]"
            >
              <span className="font-mono text-sm text-ink-tertiary">
                0{i + 1}
              </span>
              <h3 className="text-base font-semibold">{title}</h3>
              <p className="text-sm leading-[1.65] text-ink-secondary">
                {body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12 border-t border-line pt-10">
        <h2 className="text-[22px] font-semibold tracking-[-0.01em]">
          Provenance labels
        </h2>
        <div className="mt-5 space-y-4 text-sm">
          <div className="rounded-sm border border-line bg-surface p-5">
            <code className="font-mono font-medium text-accent">
              verified_api
            </code>
            <p className="mt-2 leading-[1.65] text-ink-secondary">
              Fetched by us, read-only, from the platform&apos;s official API
              under the seller&apos;s OAuth grant. We attest to the provenance
              and integrity of retrieval; this is the data the score trusts.
            </p>
          </div>
          <div className="rounded-sm border border-line bg-surface p-5">
            <code className="font-mono font-medium text-warn">
              csv_self_reported
            </code>
            <p className="mt-2 leading-[1.65] text-ink-secondary">
              Supplied by the seller (CSV import). Labeled everywhere, and the
              scoring engine treats it with open suspicion: self-reported
              events carry half weight in rating and volume,{" "}
              <strong className="text-ink">
                contribute nothing to the dispute-rate component
              </strong>{" "}
              (you can&apos;t prove the absence of disputes from a
              self-report), and a passport with only self-reported history is
              capped at grade B no matter what.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-12 border-t border-line pt-10">
        <h2 className="text-[22px] font-semibold tracking-[-0.01em]">
          How a passport is bound to a real business
        </h2>
        <ul className="mt-4 space-y-3 text-sm leading-[1.65] text-ink-secondary">
          <li>
            <strong className="text-ink">Storefront ownership:</strong>{" "}
            connecting a store requires OAuth authorization only a store admin
            can grant. One storefront can back exactly one passport — a
            database uniqueness constraint in the launch schema, not a policy.
          </li>
          <li>
            <strong className="text-ink">Domain claims:</strong>{" "}claiming a
            website for API lookup requires a DNS TXT challenge, or the domain
            must match the connected storefront&apos;s primary domain.
            Unverified identifiers are never matchable.
          </li>
          <li>
            <strong className="text-ink">Plausibility checks:</strong> shop
            age, review-to-order ratios, and buyer-concentration signals ship
            with the importer; anomalies flag a passport for manual review
            before publication.
          </li>
        </ul>
      </section>

      <section className="mt-12 border-l-[3px] border-warn-line bg-warn-tint px-6 py-6">
        <h2 className="text-[22px] font-semibold tracking-[-0.01em]">
          What the signature does <em>not</em> prove
        </h2>
        <ul className="mt-4 space-y-3 text-sm leading-[1.65] text-ink-secondary">
          <li>
            It does not prove Shopify&apos;s (or any platform&apos;s) data is
            true. It proves <em>we</em>{" "}retrieved that data from the
            platform&apos;s API at a stated time and that nothing changed
            after we signed it.
          </li>
          <li>
            It does not prove <em>we</em>{" "}are honest. The signing key is
            ours,
            so a signature can&apos;t rule out the operator altering data
            before signing. That&apos;s the transparency log&apos;s job:
            published chain heads will let outsiders detect rewritten history.
            Until it ships, treat &quot;tamper-evident&quot; as covering
            everyone downstream of us, and hold us to shipping the log.
          </li>
          <li>
            It does not prove the person who sent you a passport link owns
            that passport. Identity binding comes from verified identifiers
            (domain, connected storefront): match those against your
            applicant, or use the API lookup rather than trusting a link.
          </li>
          <li>
            It does not prove future behavior. A clean history is evidence,
            not a guarantee, which is why we publish confidence separately
            and recommend using the score as an input to your decision, not
            as the decision.
          </li>
        </ul>
        <p className="mt-4 text-sm leading-[1.65] text-ink-secondary">
          The launch API includes revocation: if a passport is found
          fraudulent, its attestations are marked revoked. Offline
          verification still validates the signature, so high-stakes consumers
          should also call{" "}
          <code className="font-mono">POST /v1/verify</code>, which checks
          revocation status.
        </p>
      </section>

      <section className="mt-12 border-t border-line pt-10">
        <h2 className="text-[22px] font-semibold tracking-[-0.01em]">
          Try it now
        </h2>
        <p className="mt-3 leading-[1.65] text-ink-secondary">
          The{" "}
          <Link href="/p/demo" className={linkClass}>
            sample passport
          </Link>{" "}
          ships with a real signature. Download its attestation, run the
          30-second verify script (keys are fetched from our published key
          set and pinned by key id), then change one digit of the score and
          watch it fail.
        </p>
      </section>
    </main>
  );
}
