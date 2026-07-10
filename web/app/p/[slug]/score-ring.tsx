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
  const r = 52;
  const c = 2 * Math.PI * r;
  const filled = (score / 100) * c;

  return (
    <div className="flex flex-col items-center">
      <svg
        width="140"
        height="140"
        viewBox="0 0 140 140"
        role="img"
        aria-label={`Reputation score ${Math.round(score)} out of 100, grade ${grade}`}
      >
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          strokeWidth="10"
          className="stroke-neutral-200 dark:stroke-neutral-800"
        />
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          className="stroke-emerald-500"
          strokeDasharray={`${filled} ${c - filled}`}
          transform="rotate(-90 70 70)"
        />
        <text
          x="70"
          y="66"
          textAnchor="middle"
          className="fill-current text-3xl font-semibold"
        >
          {Math.round(score)}
        </text>
        <text
          x="70"
          y="90"
          textAnchor="middle"
          className="fill-emerald-600 text-base font-medium dark:fill-emerald-400"
        >
          {grade}
        </text>
      </svg>
      <span className="mt-1 text-xs text-neutral-500">
        {(confidence * 100).toFixed(0)}% evidence confidence
      </span>
    </div>
  );
}
