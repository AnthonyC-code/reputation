"use client";

import { WorkRecordData } from "@/src/hooks/useWorkRecords";

const CATEGORY_COLORS: Record<string, string> = {
  Tech:     "bg-blue-900/40 text-blue-300 border-blue-700/40",
  Design:   "bg-purple-900/40 text-purple-300 border-purple-700/40",
  Language: "bg-green-900/40 text-green-300 border-green-700/40",
  Teaching: "bg-yellow-900/40 text-yellow-300 border-yellow-700/40",
  Other:    "bg-gray-800 text-gray-400 border-gray-700",
};

function formatSol(lamports: bigint): string {
  const sol = Number(lamports) / 1_000_000_000;
  if (sol < 0.01) return `${(sol * 1000).toFixed(2)} mSOL`;
  return `${sol.toFixed(3)} SOL`;
}

function formatDate(ts: bigint): string {
  const ms = Number(ts) * 1000;
  return new Date(ms).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="text-xs tracking-tighter">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={s <= rating ? "text-yellow-400" : "text-gray-700"}>
          ★
        </span>
      ))}
    </span>
  );
}

interface WorkRecordListProps {
  records: WorkRecordData[];
  loading?: boolean;
}

export default function WorkRecordList({ records, loading }: WorkRecordListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse bg-gray-800 rounded-xl h-16" />
        ))}
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <p className="text-gray-500 text-sm text-center py-6">No work records yet.</p>
    );
  }

  return (
    <div className="space-y-2">
      {records.map((rec, idx) => {
        const colorClass = CATEGORY_COLORS[rec.category] ?? CATEGORY_COLORS["Other"];
        return (
          <div
            key={idx}
            className="flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3"
          >
            {/* Category pill */}
            <span
              className={`flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full border ${colorClass}`}
            >
              {rec.category}
            </span>

            {/* Middle: rating + disputed */}
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <StarRating rating={rec.rating} />
              {rec.disputed && (
                <span className="text-xs text-red-400 bg-red-900/30 border border-red-700/40 px-1.5 py-0.5 rounded-full">
                  disputed
                </span>
              )}
            </div>

            {/* Right: amount + date */}
            <div className="flex-shrink-0 text-right">
              <p className="text-sm font-medium text-white">{formatSol(rec.amountPaid)}</p>
              <p className="text-xs text-gray-500">{formatDate(rec.timestamp)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
