"use client";

import { useState } from "react";
import { PassportData } from "@/hooks/usePassport";
import { LAMPORTS_PER_SOL_NUM } from "@/lib/constants";

interface PassportCardProps {
  passport: PassportData | null;
  walletAddress: string;
}

const CIRCUMFERENCE = 2 * Math.PI * 40; // ~251.327

function scoreColor(score: number): string {
  if (score > 70) return "#22c55e"; // green-500
  if (score > 40) return "#eab308"; // yellow-500
  return "#ef4444"; // red-500
}

function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatDate(timestamp: bigint): string {
  const ms = Number(timestamp) * 1000;
  return new Date(ms).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function PassportCard({ passport, walletAddress }: PassportCardProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (!passport) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 animate-pulse">
        <div className="flex items-center justify-between mb-6">
          <div className="h-4 bg-gray-700 rounded w-40" />
          <div className="h-8 w-8 bg-gray-700 rounded" />
        </div>
        <div className="flex justify-center mb-6">
          <div className="h-28 w-28 bg-gray-700 rounded-full" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 bg-gray-700 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const score = passport.overallScore;
  const dashOffset = CIRCUMFERENCE * (1 - score / 100);
  const color = scoreColor(score);
  const disputeRate =
    passport.totalGigs > 0
      ? ((passport.disputeCount / passport.totalGigs) * 100).toFixed(1)
      : "0.0";
  const totalEarnedSol = (Number(passport.totalEarned) / LAMPORTS_PER_SOL_NUM).toFixed(3);
  const memberSince = formatDate(passport.createdAt);

  const stats: { label: string; value: string }[] = [
    { label: "Total Gigs", value: String(passport.totalGigs) },
    { label: "Dispute Rate", value: `${disputeRate}%` },
    { label: "Platforms", value: String(passport.uniquePlatforms) },
    { label: "Member Since", value: memberSince },
    { label: "Total Earned", value: `${totalEarnedSol} SOL` },
  ];

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6">
      {/* Top row: wallet address + copy */}
      <div className="flex items-center justify-between mb-6">
        <span className="text-gray-400 text-sm font-mono">
          {truncateAddress(walletAddress)}
        </span>
        <button
          onClick={handleCopy}
          className="text-xs px-2 py-1 rounded bg-gray-800 border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      {/* Score ring */}
      <div className="flex justify-center mb-6">
        <div className="relative w-28 h-28">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#374151"
              strokeWidth="8"
            />
            {/* Foreground circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
            />
          </svg>
          {/* Score label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-white leading-none">{score}</span>
            <span className="text-xs text-gray-400 mt-0.5">score</span>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map(({ label, value }) => (
          <div
            key={label}
            className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-3"
          >
            <p className="text-xs text-gray-400 mb-0.5">{label}</p>
            <p className="text-sm font-semibold text-white truncate">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
