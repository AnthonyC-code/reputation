import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { demoPassport, componentLabels } from "@/lib/demo";
import { SITE_URL } from "@/lib/site";
import { CopyButton } from "@/components/copy-button";
import { ScoreRing } from "./score-ring";

// Only the sample passport exists until real sellers onboard (Phase 4).
export function generateStaticParams() {
  return [{ slug: "demo" }];
}

export const dynamicParams = false;

const p = demoPassport;
const passportUrl = `${SITE_URL}/p/${p.seller.slug}`;
const badgeUrl = `${passportUrl}/badge.svg`;
const embedSnippet = `<a href="${passportUrl}"><img src="${badgeUrl}" alt="${p.seller.name} — Reputation Passport score ${Math.round(p.score.overall)} (${p.score.grade})" width="300" height="72"></a>`;
const verifySnippet = `// verify.mjs — check this passport's signature yourself (Node 20+, no deps)
// 1. download ${passportUrl}/attestation.json
// 2. node verify.mjs attestation.json
// The verification key is fetched from our published key set — never
// trusted from the attestation file itself.
import { createPublicKey, createHash, verify } from "node:crypto";
import { readFileSync } from "node:fs";

const KEYS_URL = "${SITE_URL}/.well-known/demo-jwks.json"; // live keys: /.well-known/jwks.json
const att = JSON.parse(readFileSync(process.argv[2], "utf8"));
const jwks = await (await fetch(KEYS_URL)).json();
const jwk = jwks.keys.find((k) => k.kid === att.kid);
if (!jwk) throw new Error(\`key id \${att.kid} is not in the published key set\`);
const payload = Buffer.from(JSON.stringify(att.payload));
const msg = Buffer.concat([
  Buffer.from("reputation-passport:attestation:v1"),
  createHash("sha256").update(payload).digest(),
]);
const ok = verify(null, msg, createPublicKey({ key: jwk, format: "jwk" }),
  Buffer.from(att.signature_b64, "base64"));
console.log(ok ? "VALID — signed by Reputation Passport, untampered" : "INVALID");`;

export const metadata: Metadata = {
  title: `${p.seller.name} — Reputation Passport${p.sample ? " (sample)" : ""}`,
  description: `Reputation score ${Math.round(p.score.overall)} (${p.score.grade}): ${p.stats.orders.toLocaleString()} verified orders, ${p.stats.avg_rating}★ across ${p.stats.reviews.toLocaleString()} reviews. Verified via official platform APIs.`,
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title: `${p.seller.name} — score ${Math.round(p.score.overall)} (${p.score.grade})`,
    description: `${p.stats.orders.toLocaleString()} verified orders · ${p.stats.avg_rating}★ across ${p.stats.reviews.toLocaleString()} reviews · verified via official platform APIs.`,
    type: "profile",
    siteName: "Reputation Passport",
  },
  twitter: {
    card: "summary_large_image",
    title: `${p.seller.name} — Reputation Passport`,
    description: `Score ${Math.round(p.score.overall)} (${p.score.grade}) · ${p.stats.orders.toLocaleString()} verified orders.`,
  },
};

export default async function PassportPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (slug !== "demo") notFound();
  const disputeRate = ((p.stats.disputes / p.stats.orders) * 100).toFixed(2);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      {p.sample && (
        <div className="mb-8 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          <strong>Sample passport.</strong> This seller is fictional, but the
          score below was computed by our real scoring engine (
          {p.score.score_version}) and carries a real, checkable signature —
          exactly what a live passport looks like.
        </div>
      )}

      <header className="flex flex-wrap items-start justify-between gap-6">
        <div className="flex gap-4">
          <div
            aria-hidden
            className="flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-600/10 text-2xl font-semibold text-emerald-700 dark:text-emerald-400"
          >
            {p.seller.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              {p.seller.name}
            </h1>
            <p className="mt-1 text-neutral-600 dark:text-neutral-400">
              {p.seller.tagline}
            </p>
            <p className="mt-2 text-sm text-neutral-500">
              {p.seller.location} · Selling since {p.seller.member_since} ·{" "}
              <a
                href={p.seller.website}
                rel="nofollow noopener"
                className="underline hover:text-neutral-700 dark:hover:text-neutral-300"
              >
                Visit store ↗
              </a>
            </p>
          </div>
        </div>
        <div className="flex flex-col items-center">
          <ScoreRing
            score={p.score.overall}
            grade={p.score.grade}
            confidence={p.score.confidence}
          />
          <p className="mt-1 text-xs text-neutral-500">
            A+ is the top grade (90–100) · as of {p.as_of}
          </p>
        </div>
      </header>

      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-lg border border-neutral-200 px-4 py-2.5 text-sm dark:border-neutral-800">
        <span className="text-neutral-500">Share this passport:</span>
        <code className="text-xs">{passportUrl}</code>
        <CopyButton text={passportUrl} label="Copy link" />
      </div>

      <section className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Verified orders", value: p.stats.orders.toLocaleString() },
          {
            label: `${p.stats.reviews.toLocaleString()} verified reviews`,
            value: `${p.stats.avg_rating}★`,
          },
          {
            label: `${p.stats.disputes} disputes in ${p.stats.orders.toLocaleString()} orders`,
            value: `${disputeRate}%`,
          },
          {
            label: "Years of history",
            value: p.seller.member_since.split(" ").pop() ?? "",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800"
          >
            <div className="text-lg font-medium">{s.value}</div>
            <div className="mt-1 text-xs text-neutral-500">{s.label}</div>
          </div>
        ))}
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-medium">How this score is built</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Six components, each capped so no single number can be gamed. Small
          samples are statistically discounted — five perfect reviews never
          look like five thousand. The confidence figure under the ring says
          how much verified evidence backs the score.
        </p>
        <div className="mt-4 space-y-3">
          {p.score.components.map((c) => {
            const meta = componentLabels[c.key] ?? {
              label: c.key,
              explain: "",
            };
            return (
              <div key={c.key}>
                <div className="flex items-baseline justify-between text-sm">
                  <span>{meta.label}</span>
                  <span className="tabular-nums text-neutral-500">
                    {c.weighted.toFixed(1)} / {c.weight}
                  </span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${(c.weighted / c.weight) * 100}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-neutral-500">{meta.explain}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-medium">Where this history comes from</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Every source is labeled. “Verified” means we imported it read-only
          from the platform’s official API — the seller can’t edit it, and
          neither can we.
        </p>
        <ul className="mt-4 space-y-3">
          {p.sources.map((s) => (
            <li
              key={s.platform}
              className="flex items-start justify-between gap-4 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800"
            >
              <div>
                <div className="font-medium">
                  {s.platform}{" "}
                  <span className="text-sm font-normal text-neutral-500">
                    — {s.kind}
                  </span>
                </div>
                <p className="mt-1 text-xs text-neutral-500">{s.detail}</p>
              </div>
              <span className="whitespace-nowrap rounded-full border border-emerald-600/30 bg-emerald-600/10 px-2.5 py-1 text-xs text-emerald-700 dark:text-emerald-400">
                ✓ Verified · {s.count.toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-medium">Put this badge on your site</h2>
        <p className="mt-1 text-sm text-neutral-500">
          A live badge for your storefront, email signature, or wholesale
          applications. It always shows the current score and links back to
          this page.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-6 rounded-xl border border-neutral-200 p-5 dark:border-neutral-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/p/${p.seller.slug}/badge.svg`}
            alt={`${p.seller.name} Reputation Passport badge`}
            width={300}
            height={72}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                Embed code
              </span>
              <CopyButton text={embedSnippet} label="Copy embed code" />
            </div>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-neutral-100 p-3 text-xs dark:bg-neutral-900">
              {embedSnippet}
            </pre>
          </div>
        </div>
      </section>

      <section className="mt-10 rounded-xl border border-neutral-200 p-5 dark:border-neutral-800">
        <h2 className="text-lg font-medium">Don’t take our word for it</h2>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          This score ships with a digital signature over the score and every
          input that produced it. Anyone — a marketplace, a wholesale buyer, a
          customer — can check it hasn’t been altered, for free, without
          asking us.
        </p>
        <details className="mt-3">
          <summary className="cursor-pointer text-sm font-medium text-emerald-700 dark:text-emerald-400">
            Verify it yourself (30 seconds, no account)
          </summary>
          <div className="mt-3 space-y-3 text-sm">
            <p className="text-neutral-600 dark:text-neutral-400">
              1. Download{" "}
              <a
                href={`/p/${p.seller.slug}/attestation.json`}
                className="underline"
              >
                attestation.json
              </a>{" "}
              — the signed score payload, signature, and public key.
              <br />
              2. Run the script below. It recomputes the payload hash and
              checks the Ed25519 signature.
            </p>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                verify.mjs
              </span>
              <CopyButton text={verifySnippet} label="Copy script" />
            </div>
            <pre className="overflow-x-auto rounded-lg bg-neutral-100 p-3 text-xs leading-relaxed dark:bg-neutral-900">
              {verifySnippet}
            </pre>
            {p.sample && (
              <p className="text-xs text-neutral-500">{p.attestation.note}</p>
            )}
          </div>
        </details>
      </section>

      {p.sample && (
        <section className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-emerald-600/30 bg-emerald-600/5 p-5">
          <div>
            <h2 className="font-medium">This could be your track record.</h2>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
              Connect your store in a couple of clicks when we launch — free
              for sellers, forever.
            </p>
          </div>
          <Link
            href="/#early-access"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Join early access
          </Link>
        </section>
      )}
    </main>
  );
}
