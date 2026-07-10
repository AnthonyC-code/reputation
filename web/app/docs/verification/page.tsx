import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How verification works — Reputation Passport",
  description:
    "The chain of custody from platform API to signed score, what the signature proves, and — just as important — what it doesn't.",
};

export default function VerificationDocsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-14">
      <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
        Trust model
      </p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">
        How verification works
      </h1>
      <p className="mt-3 text-lg text-neutral-600 dark:text-neutral-400">
        Written for the skeptical reader. If your job is adversarial thinking,
        this page is for you — including the section on what our signatures{" "}
        <em>don&apos;t</em> prove.
      </p>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Chain of custody</h2>
        <ol className="mt-4 space-y-3 text-neutral-700 dark:text-neutral-300">
          {[
            ["Import", "The seller authorizes read-only OAuth access to their storefront. We fetch orders, disputes, and reviews from the platform's official API — the seller never uploads these numbers, and neither they nor we can edit what the platform returns."],
            ["Store raw", "Every API response is stored verbatim (buyer-identifying data stripped first). Raw documents are the source of truth: every downstream number can be re-derived from them, and re-importing is idempotent."],
            ["Normalize", "Raw documents become typed events — sale, review, dispute, refund, cancellation — each carrying its provenance label and the original rating scale."],
            ["Score", "A versioned, published formula computes the score. Small samples are statistically discounted (Bayesian prior on ratings, Wilson lower bound on dispute rates) so five perfect reviews can never impersonate five thousand."],
            ["Sign", "The score, its full component breakdown, and its input summary are canonicalized (RFC 8785) and signed with Ed25519. Signed entries chain by hash, append-only — altering history breaks every later link."],
          ].map(([title, body], i) => (
            <li key={title} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600/10 text-sm font-medium text-emerald-700 dark:text-emerald-400">
                {i + 1}
              </span>
              <span>
                <strong>{title}.</strong> {body}
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Provenance labels</h2>
        <div className="mt-4 space-y-3 text-sm text-neutral-700 dark:text-neutral-300">
          <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
            <code className="font-medium text-emerald-700 dark:text-emerald-400">
              verified_api
            </code>
            <p className="mt-1">
              Fetched by us, read-only, from the platform&apos;s official API
              under the seller&apos;s OAuth grant. We attest to the provenance
              and integrity of retrieval — this is the data the score trusts.
            </p>
          </div>
          <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
            <code className="font-medium text-amber-700 dark:text-amber-400">
              csv_self_reported
            </code>
            <p className="mt-1">
              Supplied by the seller (CSV import). Labeled everywhere, and the
              scoring engine treats it with open suspicion: self-reported
              events carry half weight in rating and volume,{" "}
              <strong>
                contribute nothing to the dispute-rate component
              </strong>{" "}
              (you can&apos;t prove the absence of disputes from a
              self-report), and a passport with only self-reported history is
              capped at grade B no matter what.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">
          How a passport is bound to a real business
        </h2>
        <ul className="mt-3 space-y-2 text-neutral-700 dark:text-neutral-300">
          <li>
            <strong>Storefront ownership:</strong> connecting a store requires
            OAuth authorization only a store admin can grant. One storefront
            can back exactly one passport — enforced as a hard uniqueness
            rule, not a policy.
          </li>
          <li>
            <strong>Domain claims:</strong> claiming a website for API lookup
            requires a DNS TXT challenge, or the domain must match the
            connected storefront&apos;s primary domain. Unverified identifiers
            are never matchable.
          </li>
          <li>
            <strong>Plausibility checks:</strong> shop age, review-to-order
            ratios, and buyer-concentration signals are captured at import;
            anomalies flag the passport for manual review before publication.
          </li>
        </ul>
      </section>

      <section className="mt-10 rounded-xl border border-amber-500/40 bg-amber-500/5 p-5">
        <h2 className="text-xl font-semibold">
          What the signature does <em>not</em> prove
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-neutral-700 dark:text-neutral-300">
          <li>
            It does not prove Shopify&apos;s (or any platform&apos;s) data is
            true — it proves <em>we</em> retrieved that data from the
            platform&apos;s API at a stated time and that nobody, including
            us, altered it afterward.
          </li>
          <li>
            It does not prove the person who sent you a passport link owns
            that passport. Identity binding comes from verified identifiers
            (domain, connected storefront) — match those against your
            applicant, or use the API lookup rather than trusting a link.
          </li>
          <li>
            It does not prove future behavior. A clean history is evidence,
            not a guarantee — which is why we publish confidence separately
            and recommend using the score as an input to your decision, not
            as the decision.
          </li>
        </ul>
        <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400">
          If a passport is later found fraudulent, its attestations are
          revoked — offline verification still validates the signature, so
          high-stakes consumers should also call{" "}
          <code>POST /v1/verify</code>, which checks revocation.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Try it now</h2>
        <p className="mt-2 text-neutral-700 dark:text-neutral-300">
          The{" "}
          <Link href="/p/demo" className="underline">
            sample passport
          </Link>{" "}
          ships with a real signature. Download its attestation, run the
          30-second verify script (keys are fetched from our published key
          set, pinned by key id — never trusted from the file itself), then
          change one digit of the score and watch it fail.
        </p>
      </section>
    </main>
  );
}
