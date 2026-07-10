// Server-rendered SVG score ring — no client JS (AGENTS.md: public passport
// pages must render fully without client-side JavaScript).
export function ScoreRing({
  score,
  grade,
  confidence,
}: {
  score: number;
  grade: string;
  confidence: number;
}) {
  const r = 57;
  const c = 2 * Math.PI * r;
  const filled = (score / 100) * c;

  return (
    <div className="flex flex-col items-center">
      <svg
        width="120"
        height="120"
        viewBox="0 0 120 120"
        role="img"
        aria-label={`Reputation score ${Math.round(score)} out of 100, grade ${grade}`}
      >
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          strokeWidth="6"
          className="stroke-line"
        />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          strokeWidth="6"
          strokeLinecap="butt"
          className="stroke-accent"
          strokeDasharray={`${filled} ${c - filled}`}
          transform="rotate(-90 60 60)"
        />
        <text
          x="60"
          y="58"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-ink font-mono text-[30px] font-semibold"
        >
          {Math.round(score)}
        </text>
        <text
          x="60"
          y="82"
          textAnchor="middle"
          className="fill-brass text-[15px] font-semibold"
        >
          {grade}
        </text>
      </svg>
      <span className="mt-2 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink-tertiary">
        {/* floor, not round: never overstate a trust figure */}
        {Math.floor(confidence * 100)}% evidence confidence
      </span>
    </div>
  );
}
