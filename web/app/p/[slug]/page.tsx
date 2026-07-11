import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { demoPassport, componentLabels } from "@/lib/demo";
import { SITE_URL } from "@/lib/site";
import { docNumber, mrzLines, sigLine } from "@/lib/mrz";
import { CodeBlock } from "@/components/code-block";
import { CopyButton } from "@/components/copy-button";
import {
  AlertTriangle,
  ArrowUpRight,
  Check,
  SealMark,
  Star,
} from "@/components/icons";
import { Overline, btnPrimary } from "@/components/ui";
import { ScoreHistory } from "./score-history";
import { ScoreRing } from "./score-ring";

// Only the sample passport exists until real sellers onboard (Phase 4).
export function generateStaticParams() {
  return [{ slug: "demo" }];
}

export const dynamicParams = false;

const p = demoPassport;
const passportUrl = `${SITE_URL}/p/${p.seller.slug}`;
const badgeUrl = `${passportUrl}/badge.svg`;
const embedSnippet = `<a href="${passportUrl}">
  <img src="${badgeUrl}"
       alt="${p.seller.name} — Reputation Passport score ${Math.round(p.score.overall)} (${p.score.grade})"
       width="300" height="72">
</a>`;
const verifySnippet = `// verify.mjs — check this passport's signature yourself (Node 20+, no deps)
// 1. download ${passportUrl}/attestation.json
// 2. node verify.mjs attestation.json
// The key is fetched from the published key set and pinned by key id.
// Verification canonicalizes the payload (RFC 8785 for this payload shape),
// so it also works on re-serialized or reformatted copies.
import { createPublicKey, createHash, verify } from "node:crypto";
import { readFileSync } from "node:fs";

const KEYS_URL = "${SITE_URL}/.well-known/demo-jwks.json"; // live keys: on the API origin
const canon = (v) =>
  Array.isArray(v) ? \`[\${v.map(canon).join(",")}]\`
  : v && typeof v === "object"
    ? \`{\${Object.keys(v).sort().map((k) => \`\${JSON.stringify(k)}:\${canon(v[k])}\`).join(",")}}\`
    : JSON.stringify(v);

const att = JSON.parse(readFileSync(process.argv[2], "utf8"));
const jwks = await (await fetch(KEYS_URL)).json();
const jwk = jwks.keys.find((k) => k.kid === att.kid);
if (!jwk) throw new Error(\`key id \${att.kid} is not in the published key set\`);
const msg = Buffer.concat([
  Buffer.from("reputation-passport:attestation:v1"),
  createHash("sha256").update(Buffer.from(canon(att.payload))).digest(),
]);
const ok = verify(null, msg, createPublicKey({ key: jwk, format: "jwk" }),
  Buffer.from(att.signature_b64, "base64"));
console.log(ok ? "VALID — payload unchanged since it was signed"
               : "INVALID — payload does not match the signature");`;

export const metadata: Metadata = {
  title: `${p.seller.name} — Reputation Passport${p.sample ? " (sample)" : ""}`,
  description: `Reputation score ${Math.round(p.score.overall)} (${p.score.grade}): ${p.stats.orders.toLocaleString()} verified orders, ${p.stats.avg_rating}/5 across ${p.stats.reviews.toLocaleString()} reviews. Verified via official platform APIs.`,
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title: `${p.sample ? "[Sample] " : ""}${p.seller.name} — score ${Math.round(p.score.overall)} (${p.score.grade})`,
    description: `${p.sample ? "Sample passport (fictional seller, real engine): " : ""}${p.stats.orders.toLocaleString()} verified orders · ${p.stats.avg_rating}/5 across ${p.stats.reviews.toLocaleString()} reviews · verified via official platform APIs.`,
    type: "profile",
    siteName: "Reputation Passport",
  },
  twitter: {
    card: "summary_large_image",
    title: `${p.sample ? "[Sample] " : ""}${p.seller.name} — Reputation Passport`,
    description: `${p.sample ? "Sample passport: " : ""}Score ${Math.round(p.score.overall)} (${p.score.grade}) · ${p.stats.orders.toLocaleString()} verified orders.`,
  },
};

function SectionLabel({ children }: { children: string }) {
  return (
    <h2 className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink-tertiary">
      {children}
    </h2>
  );
}

export default async function PassportPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (slug !== "demo") notFound();
  const disputeRate = ((p.stats.disputes / p.stats.orders) * 100).toFixed(2);
  const [mrz1, mrz2] = mrzLines(p);

  return (
    <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
      {p.sample && (
        <div className="mb-6 flex gap-2.5 border-l-[3px] border-warn-line bg-warn-tint px-4 py-3 text-[13px] leading-[1.6] text-warn">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <p>
            <strong>Sample passport.</strong> This seller is fictional, but the
            score below was computed by our real scoring engine (
            {p.score.score_version}) and carries a real, checkable signature.
            This is exactly what a live passport looks like.
          </p>
        </div>
      )}

      {/* The passport document */}
      <article className="overflow-hidden rounded-md border border-line-strong border-t-[3px] border-t-accent bg-surface">
        {/* Header */}
        <header className="px-5 py-6 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <SealMark size={18} className="shrink-0 text-accent" />
              <Overline>Reputation Passport</Overline>
            </span>
            <span className="font-mono text-[11px] font-medium tracking-[0.08em] text-ink-tertiary">
              NO. {docNumber(p)}
              {p.sample && " · SAMPLE"}
            </span>
          </div>

          <div className="mt-6 flex flex-wrap items-start justify-between gap-8">
            <div className="min-w-0 flex-1 basis-72">
              <h1 className="text-3xl font-semibold tracking-[-0.025em] sm:text-4xl">
                {p.seller.name}
              </h1>
              <p className="mt-2 text-ink-secondary">{p.seller.tagline}</p>
              <p className="mt-3 text-[13px] text-ink-tertiary">
                {p.seller.location} · Selling since {p.seller.member_since} ·{" "}
                {p.sample ? (
                  // The sample store is fictional — show the domain, link nothing.
                  <span>{new URL(p.seller.website).hostname}</span>
                ) : (
                  <a
                    href={p.seller.website}
                    rel="nofollow noopener"
                    className="inline-flex items-center gap-0.5 underline decoration-line-strong underline-offset-[3px] hover:decoration-accent"
                  >
                    Visit store
                    <ArrowUpRight size={14} />
                  </a>
                )}
              </p>
            </div>
            <div className="flex flex-col items-center">
              <ScoreRing
                score={p.score.overall}
                grade={p.score.grade}
                confidence={p.score.confidence}
              />
              <p className="mt-1.5 max-w-44 text-center text-xs leading-relaxed text-ink-tertiary">
                A+ is the top grade (90–100) · as of {p.as_of}
              </p>
            </div>
          </div>
        </header>

        {/* Share strip */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-line bg-sunken px-5 py-3 sm:px-8">
          <Overline>Passport URL</Overline>
          <code className="min-w-0 flex-1 truncate font-mono text-[13px]">
            {passportUrl}
          </code>
          <CopyButton text={passportUrl} label="Copy link" />
        </div>

        {/* Stats strip */}
        <section
          aria-label="Headline statistics"
          className="grid grid-cols-2 sm:grid-cols-4"
        >
          {[
            {
              value: p.stats.orders.toLocaleString(),
              label: "Verified orders",
              star: false,
            },
            {
              value: `${p.stats.avg_rating}/5`,
              label: `${p.stats.reviews.toLocaleString()} verified reviews`,
              star: true,
            },
            {
              value: `${disputeRate}%`,
              label: `${p.stats.disputes} disputes in ${p.stats.orders.toLocaleString()} orders`,
              star: false,
            },
            {
              value: p.score.inputs.tenure_years.toFixed(1),
              label: `Years of history (since ${p.seller.member_since})`,
              star: false,
            },
          ].map((s, i) => (
            <div
              key={s.label}
              className={`border-line px-5 py-4 sm:px-6 ${
                [
                  "",
                  "max-sm:border-l sm:border-l",
                  "max-sm:border-t sm:border-l",
                  "max-sm:border-l max-sm:border-t sm:border-l",
                ][i]
              }`}
            >
              <div className="flex items-baseline gap-1.5 font-mono text-2xl font-semibold">
                {s.value}
                {s.star && (
                  <Star size={14} filled className="self-center text-brass" />
                )}
              </div>
              <div className="mt-1 text-xs text-ink-tertiary">{s.label}</div>
            </div>
          ))}
        </section>

        {/* Score components */}
        <section className="border-t border-line px-5 py-6 sm:px-8">
          <SectionLabel>Sec. 01 — How this score is built</SectionLabel>
          <p className="mt-3 max-w-2xl text-sm leading-[1.65] text-ink-secondary">
            Six components, each capped so no single number can be gamed.
            Small samples are statistically discounted: five perfect reviews
            never look like five thousand. The confidence figure under the
            ring says how much verified evidence backs the score.{" "}
            <Link
              href="/docs/score"
              className="underline decoration-line-strong underline-offset-[3px] hover:decoration-accent"
            >
              Full formula and worked examples
            </Link>
            .
          </p>

          <div className="mt-6">
            <h3 className="text-base font-semibold">24-month history</h3>
            <div className="mt-3">
              <ScoreHistory />
            </div>
            <p className="mt-2 max-w-2xl text-xs leading-[1.65] text-ink-tertiary">
              Computed monthly by the same engine over the same event history.
              The score rises as history accumulates, and each dispute stops
              counting 24 months after it occurred.
            </p>
          </div>

          <div className="mt-8 space-y-5">
            {p.score.components.map((c) => {
              const meta = componentLabels[c.key] ?? {
                label: c.key,
                explain: "",
              };
              return (
                <div key={c.key}>
                  <div className="flex items-baseline justify-between gap-4 text-sm">
                    <span className="font-medium">{meta.label}</span>
                    <span className="font-mono text-[13px] text-ink-secondary">
                      {c.weighted.toFixed(1)} / {c.weight}
                    </span>
                  </div>
                  <div className="mt-1.5 h-0.5 w-full bg-line">
                    <div
                      className="h-full bg-accent"
                      style={{ width: `${(c.weighted / c.weight) * 100}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-ink-tertiary">
                    {meta.explain}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Provenance */}
        <section className="border-t border-line px-5 py-6 sm:px-8">
          <SectionLabel>Sec. 02 — Where this history comes from</SectionLabel>
          <p className="mt-3 max-w-2xl text-sm leading-[1.65] text-ink-secondary">
            Every source is labeled. &ldquo;Verified&rdquo; means we imported
            it read-only from the platform&apos;s official API. The seller
            can&apos;t edit it, and neither can we.
          </p>
          {/* Stacked rows on phones; the real table needs ~480px. */}
          <ul className="mt-4 border border-line-strong sm:hidden">
            {p.sources.map((s) => (
              <li
                key={s.platform}
                className="border-t border-line p-4 first:border-t-0"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">{s.platform}</span>
                  <span className="inline-flex items-center gap-1 rounded-xs bg-accent-tint px-1.5 py-0.5 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-accent">
                    <Check size={12} />
                    Verified
                  </span>
                </div>
                <div className="mt-1 flex items-baseline justify-between gap-3 text-sm text-ink-secondary">
                  <span>{s.kind}</span>
                  <span className="font-mono">{s.count.toLocaleString()}</span>
                </div>
                <p className="mt-1 text-xs text-ink-tertiary">{s.detail}</p>
              </li>
            ))}
          </ul>
          <div className="mt-4 hidden overflow-x-auto sm:block">
            <table className="w-full min-w-[480px] border border-line-strong text-sm">
              <thead>
                <tr className="bg-sunken">
                  {["Source", "Kind", "Records", "Status"].map((h) => (
                    <th
                      key={h}
                      className={`px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink-tertiary ${h === "Records" ? "text-right" : "text-left"}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {p.sources.map((s) => (
                  <tr key={s.platform} className="border-t border-line">
                    <td className="px-4 py-3 align-top">
                      <div className="font-medium">{s.platform}</div>
                      <div className="mt-0.5 text-xs text-ink-tertiary">
                        {s.detail}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top text-ink-secondary">
                      {s.kind}
                    </td>
                    <td className="px-4 py-3 text-right align-top font-mono">
                      {s.count.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className="inline-flex items-center gap-1 rounded-xs bg-accent-tint px-1.5 py-0.5 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-accent">
                        <Check size={12} />
                        Verified
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Badge */}
        <section className="border-t border-line px-5 py-6 sm:px-8">
          <SectionLabel>Sec. 03 — Put this badge on your site</SectionLabel>
          <p className="mt-3 max-w-2xl text-sm leading-[1.65] text-ink-secondary">
            A live badge for your storefront, email signature, or wholesale
            applications. It always shows the current score and links back to
            this page.
          </p>
          <div className="mt-5 flex flex-wrap items-start gap-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/p/${p.seller.slug}/badge.svg`}
              alt={`${p.seller.name} Reputation Passport badge`}
              width={300}
              height={72}
            />
            <div className="min-w-0 flex-1 basis-72">
              <CodeBlock
                label="Embed code"
                code={embedSnippet}
                copyLabel="Copy"
              />
            </div>
          </div>
        </section>

        {/* Verification */}
        <section className="border-t border-line px-5 py-6 sm:px-8">
          <SectionLabel>Sec. 04 — Don&apos;t take our word for it</SectionLabel>
          <p className="mt-3 max-w-2xl text-sm leading-[1.65] text-ink-secondary">
            This score ships with a digital signature covering the score, its
            input summary, the headline stats, and the source list. Any
            marketplace, wholesale buyer, or customer can check none of it
            changed since we signed it, for free, without asking us. What the
            signature can and can&apos;t prove is documented honestly in{" "}
            <Link
              href="/docs/verification"
              className="underline decoration-line-strong underline-offset-[3px] hover:decoration-accent"
            >
              how verification works
            </Link>
            .
          </p>
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-medium underline decoration-line-strong underline-offset-[3px] hover:decoration-accent">
              Verify it yourself (30 seconds, no account)
            </summary>
            <div className="mt-4 space-y-4 text-sm">
              <p className="leading-[1.65] text-ink-secondary">
                1. Download{" "}
                <a
                  href={`/p/${p.seller.slug}/attestation.json`}
                  className="underline decoration-line-strong underline-offset-[3px] hover:decoration-accent"
                >
                  attestation.json
                </a>
                , the signed score payload, signature, and public key.
                <br />
                2. Run the script below. It recomputes the payload hash and
                checks the Ed25519 signature.
              </p>
              <CodeBlock
                label="verify.mjs"
                code={verifySnippet}
                copyLabel="Copy script"
              />
              {p.sample && (
                <p className="text-xs text-ink-tertiary">
                  {p.attestation.note}
                </p>
              )}
            </div>
          </details>
        </section>

        {/* MRZ strip */}
        <div
          aria-hidden
          className="overflow-hidden border-t border-line bg-sunken px-5 py-4 font-mono text-[10px] font-medium uppercase leading-[1.9] tracking-[0.14em] whitespace-nowrap text-ink-tertiary sm:px-8 sm:text-xs"
        >
          <div>{mrz1}</div>
          <div>{mrz2}</div>
          <div className="normal-case">{sigLine(p)}</div>
        </div>
      </article>

      {p.sample && (
        <section className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
          <div>
            <h2 className="font-semibold">This could be your track record.</h2>
            <p className="mt-1 text-sm text-ink-secondary">
              Connect your store in a couple of clicks when we launch. Free
              for sellers, forever.
            </p>
          </div>
          <Link href="/#early-access" className={btnPrimary}>
            Join early access
          </Link>
        </section>
      )}
    </main>
  );
}
