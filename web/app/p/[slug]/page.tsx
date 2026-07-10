import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { demoPassport, componentLabels } from "@/lib/demo";
import { ScoreRing } from "./score-ring";

// Only the sample passport exists until real sellers onboard (Phase 4).
export function generateStaticParams() {
  return [{ slug: "demo" }];
}

export const dynamicParams = false;

export const metadata: Metadata = {
  title: `${demoPassport.seller.name} — Reputation Passport (sample)`,
  description: `Sample reputation passport: score ${demoPassport.score.overall} (${demoPassport.score.grade}), ${demoPassport.stats.orders.toLocaleString()} verified orders, ${demoPassport.stats.avg_rating}★ across ${demoPassport.stats.reviews.toLocaleString()} reviews.`,
};

export default async function PassportPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (slug !== "demo") notFound();
  const p = demoPassport;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      {p.sample && (
        <div className="mb-8 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          <strong>Sample passport.</strong> This seller is fictional, but the
          score below was computed by our real scoring engine (
          {p.score.score_version}) from the sample history shown — exactly what
          a live passport looks like.
        </div>
      )}

      <header className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {p.seller.name}
          </h1>
          <p className="mt-1 text-neutral-600 dark:text-neutral-400">
            {p.seller.tagline}
          </p>
          <p className="mt-2 text-sm text-neutral-500">
            {p.seller.location} · Selling since {p.seller.member_since} ·
            Verified {p.sources.length} sources
          </p>
        </div>
        <ScoreRing
          score={p.score.overall}
          grade={p.score.grade}
          confidence={p.score.confidence}
        />
      </header>

      <section className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Verified orders", value: p.stats.orders.toLocaleString() },
          {
            label: "Reviews",
            value: `${p.stats.avg_rating}★ · ${p.stats.reviews.toLocaleString()}`,
          },
          {
            label: "Disputes",
            value: `${p.stats.disputes} in ${p.stats.orders.toLocaleString()}`,
          },
          { label: "Score as of", value: p.as_of },
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
          look like five thousand.
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

      <section className="mt-10 rounded-xl border border-neutral-200 p-5 dark:border-neutral-800">
        <h2 className="text-lg font-medium">Don’t take our word for it</h2>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          Live passports ship with a digital signature over the score and its
          inputs. Anyone — a marketplace, a wholesale buyer, a customer — will
          be able to check that a passport is genuine and hasn’t been altered,
          for free, without asking us. The signature format and verification
          tools are published with the API.
        </p>
      </section>

      <section className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-emerald-600/30 bg-emerald-600/5 p-5">
        <div>
          <h2 className="font-medium">This could be your track record.</h2>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Connect your store in a couple of clicks when we launch — free for
            sellers, forever.
          </p>
        </div>
        <Link
          href="/#early-access"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Join early access
        </Link>
      </section>
    </main>
  );
}
