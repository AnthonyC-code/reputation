"use client";

interface BadgeDefinition {
  name: string;
  emoji: string;
  threshold: string;
}

const BADGE_DEFINITIONS: BadgeDefinition[] = [
  { name: "FirstGig",      emoji: "🎯", threshold: "1+ gig" },
  { name: "TrustedWorker", emoji: "⭐", threshold: "50+ gigs, <5% disputes" },
  { name: "MultiPlatform", emoji: "🌐", threshold: "3+ platforms" },
  { name: "ZeroDisputes",  emoji: "🔒", threshold: "20+ gigs, 0 disputes" },
  { name: "DomainExpert",  emoji: "🏆", threshold: "25+ gigs in one category" },
  { name: "EarlyAdopter",  emoji: "🚀", threshold: "First 1000 passports" },
];

interface BadgeGridProps {
  badges: string[];
  totalGigs: number;
}

export default function BadgeGrid({ badges }: BadgeGridProps) {
  const earnedSet = new Set(badges);

  return (
    <div className="grid grid-cols-3 gap-3">
      {BADGE_DEFINITIONS.map(({ name, emoji, threshold }) => {
        const earned = earnedSet.has(name);
        return (
          <div
            key={name}
            className={`rounded-xl p-3 text-center border ${
              earned
                ? "bg-gray-800 border-yellow-500/50"
                : "bg-gray-900 border-gray-700"
            }`}
          >
            <div
              className={`text-2xl mb-1 leading-none ${
                earned ? "" : "opacity-30 grayscale"
              }`}
            >
              {emoji}
            </div>
            <p
              className={`text-xs font-semibold leading-tight ${
                earned ? "text-white" : "text-gray-500"
              }`}
            >
              {name}
            </p>
            <p className="text-xs text-gray-500 mt-0.5 leading-tight">{threshold}</p>
          </div>
        );
      })}
    </div>
  );
}
