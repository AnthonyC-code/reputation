"use client";

import { WorkRecordData } from "@/hooks/useWorkRecords";

interface CategoryBreakdownProps {
  records: WorkRecordData[];
}

interface CategoryConfig {
  label: string;
  barColor: string;
}

const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  Tech:     { label: "Tech",     barColor: "bg-blue-500" },
  Design:   { label: "Design",   barColor: "bg-purple-500" },
  Language: { label: "Language", barColor: "bg-green-500" },
  Teaching: { label: "Teaching", barColor: "bg-yellow-500" },
  Other:    { label: "Other",    barColor: "bg-gray-500" },
};

const CATEGORY_ORDER = ["Tech", "Design", "Language", "Teaching", "Other"];

export default function CategoryBreakdown({ records }: CategoryBreakdownProps) {
  if (records.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-gray-500 text-sm">
        No work records yet
      </div>
    );
  }

  // Group by category
  const grouped: Record<string, WorkRecordData[]> = {};
  for (const record of records) {
    const cat = CATEGORY_CONFIG[record.category] ? record.category : "Other";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(record);
  }

  const categories = CATEGORY_ORDER.filter((cat) => grouped[cat]?.length > 0);

  return (
    <div className="space-y-4">
      {categories.map((cat) => {
        const catRecords = grouped[cat];
        const count = catRecords.length;
        const avgRating =
          catRecords.reduce((sum, r) => sum + r.rating, 0) / count;
        const pct = (avgRating / 5) * 100;
        const config = CATEGORY_CONFIG[cat];

        return (
          <div key={cat}>
            {/* Header row */}
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-white">{config.label}</span>
              <span className="text-xs text-gray-400">
                {count} {count === 1 ? "gig" : "gigs"}
              </span>
            </div>

            {/* Rating bar */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${config.barColor} transition-all duration-500`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs text-gray-400 w-8 text-right">
                {avgRating.toFixed(1)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
