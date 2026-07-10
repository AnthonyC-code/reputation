// The hero visual: a live passport document rendered from the same data
// as /p/demo. Server component, no client JS.
import { demoPassport } from "@/lib/demo";
import { docNumber, mrzLines } from "@/lib/mrz";
import { SealMark } from "./icons";
import { Overline } from "./ui";

export function PassportCard() {
  const p = demoPassport;
  const [mrz1, mrz2] = mrzLines(p);
  const disputeRate = ((p.stats.disputes / p.stats.orders) * 100).toFixed(2);
  const rows: [string, string][] = [
    ["Verified orders", p.stats.orders.toLocaleString("en-US")],
    ["Average rating", `${p.stats.avg_rating}/5`],
    ["Dispute rate", `${disputeRate}%`],
    ["Selling since", p.seller.member_since],
  ];

  return (
    <div className="relative overflow-hidden rounded-md border border-line-strong bg-surface shadow-card">
      <div className="p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2">
            <SealMark size={18} className="shrink-0 text-accent" />
            <Overline>Reputation Passport</Overline>
          </span>
          <span className="font-mono text-[11px] font-medium tracking-[0.08em] text-ink-tertiary">
            NO. {docNumber(p)}
          </span>
        </div>

        <p className="mt-4 text-xl font-semibold tracking-tight">
          {p.seller.name}
        </p>

        <dl className="mt-4 space-y-2.5">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-baseline gap-2 text-sm">
              <dt className="text-ink-secondary">{label}</dt>
              <span
                aria-hidden
                className="flex-1 border-b border-dotted border-line-strong"
              />
              <dd className="font-mono font-medium">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-5 flex items-baseline justify-between border-t border-line pt-4">
          <Overline>Score</Overline>
          <p className="font-mono leading-none">
            <span className="text-[28px] font-semibold">
              {Math.round(p.score.overall)}
            </span>
            <span className="ml-2 text-base font-semibold text-brass">
              {p.score.grade}
            </span>
          </p>
        </div>
      </div>

      <div className="overflow-hidden border-t border-line bg-sunken px-5 py-3 font-mono text-[11px] font-medium uppercase leading-relaxed tracking-[0.1em] whitespace-nowrap text-ink-tertiary">
        <div>{mrz1}</div>
        <div>{mrz2}</div>
      </div>
    </div>
  );
}
