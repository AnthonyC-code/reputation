// Server-rendered 24-month score line — real engine output, no client JS.
// Single series: the line wears the accent (score-fill semantics); all text
// wears text tokens.
import { demoPassport } from "@/lib/demo";

const W = 560;
const H = 150;
const PAD = { top: 14, right: 40, bottom: 24, left: 34 };

export function ScoreHistory() {
  const pts = demoPassport.history;
  if (pts.length < 2) return null;

  const values = pts.map((p) => p.overall);
  const lo = Math.floor(Math.min(...values)) - 1;
  const hi = Math.ceil(Math.max(...values)) + 1;
  const x = (i: number) =>
    PAD.left + (i * (W - PAD.left - PAD.right)) / (pts.length - 1);
  const y = (v: number) =>
    PAD.top + ((hi - v) * (H - PAD.top - PAD.bottom)) / (hi - lo);

  const path = pts
    .map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p.overall).toFixed(1)}`)
    .join(" ");

  let ticks: number[] = [];
  for (let v = lo + 1; v < hi; v++) ticks.push(v);
  if (ticks.length > 4) ticks = ticks.filter((_, i) => i % 2 === 0);

  const first = pts[0];
  const last = pts[pts.length - 1];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full max-w-xl"
      role="img"
      aria-label={`Score history, ${first.as_of} to ${last.as_of}, computed monthly: from ${first.overall} to ${last.overall} out of 100.`}
    >
      {ticks.map((v) => (
        <g key={v}>
          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={y(v)}
            y2={y(v)}
            className="stroke-line"
            strokeWidth="1"
          />
          <text
            x={PAD.left - 8}
            y={y(v) + 3}
            textAnchor="end"
            className="fill-ink-tertiary font-mono text-[10px]"
          >
            {v}
          </text>
        </g>
      ))}
      <path d={path} fill="none" strokeWidth="2" className="stroke-accent" />
      <circle
        cx={x(pts.length - 1)}
        cy={y(last.overall)}
        r="3.5"
        className="fill-accent stroke-surface"
        strokeWidth="2"
      />
      <text
        x={x(pts.length - 1) + 8}
        y={y(last.overall) + 3.5}
        className="fill-ink font-mono text-[11px] font-semibold"
      >
        {Math.round(last.overall)}
      </text>
      <text
        x={PAD.left}
        y={H - 6}
        className="fill-ink-tertiary font-mono text-[10px] uppercase tracking-[0.08em]"
      >
        {first.as_of}
      </text>
      <text
        x={W - PAD.right}
        y={H - 6}
        textAnchor="end"
        className="fill-ink-tertiary font-mono text-[10px] uppercase tracking-[0.08em]"
      >
        {last.as_of}
      </text>
    </svg>
  );
}
