"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import PassportCard from "@/src/components/PassportCard";
import CategoryBreakdown from "@/src/components/CategoryBreakdown";
import BadgeGrid from "@/src/components/BadgeGrid";
import { usePassport, PassportData } from "@/src/hooks/usePassport";
import { useWorkRecords } from "@/src/hooks/useWorkRecords";
import WorkRecordList from "@/src/components/WorkRecordList";

interface PassportPageClientProps {
  wallet: string;
}

/** Derive which badges this passport has earned from on-chain aggregates. */
function deriveBadges(passport: PassportData | null): string[] {
  if (!passport) return [];
  const earned: string[] = [];

  const { totalGigs, disputeCount, uniquePlatforms, categoryGigs } = passport;
  const disputeRate = totalGigs > 0 ? disputeCount / totalGigs : 0;
  const maxCategoryGigs = Math.max(...categoryGigs);

  if (totalGigs >= 1)                          earned.push("FirstGig");
  if (totalGigs >= 50 && disputeRate < 0.05)   earned.push("TrustedWorker");
  if (uniquePlatforms >= 3)                    earned.push("MultiPlatform");
  if (totalGigs >= 20 && disputeCount === 0)   earned.push("ZeroDisputes");
  if (maxCategoryGigs >= 25)                   earned.push("DomainExpert");
  // EarlyAdopter: on-chain badge count exceeds what rule-based check gives
  if (earned.length < passport.badgeCount)     earned.push("EarlyAdopter");

  return earned;
}

export default function PassportPageClient({ wallet }: PassportPageClientProps) {
  const { publicKey, connected } = useWallet();
  const [embedCopied, setEmbedCopied] = useState(false);

  const isMe = wallet === "me";
  const walletAddress = isMe ? (publicKey?.toBase58() ?? null) : wallet;

  const { passport, loading: passportLoading, error: passportError } = usePassport(walletAddress);
  const { records, loading: recordsLoading } = useWorkRecords(walletAddress);

  const badges = deriveBadges(passport);

  function copyEmbed() {
    if (!walletAddress) return;
    const embedCode = `<iframe src="${window.location.origin}/passport/${walletAddress}" width="420" height="320" frameborder="0" style="border-radius:16px;"></iframe>`;
    navigator.clipboard.writeText(embedCode).then(() => {
      setEmbedCopied(true);
      setTimeout(() => setEmbedCopied(false), 2000);
    });
  }

  if (isMe && !connected) {
    return (
      <main className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-6 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Reputation Passport</h1>
          <p className="text-gray-400 text-sm">Connect your wallet using the button in the nav bar.</p>
        </div>
      </main>
    );
  }

  if (!walletAddress) {
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400">No wallet address provided.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 py-10 px-4">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">
            {isMe ? "My Passport" : "Reputation Passport"}
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={copyEmbed}
              className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 transition-colors"
            >
              {embedCopied ? "Copied!" : "</> Embed"}
            </button>
          </div>
        </div>

        <PassportCard
          passport={passport}
          walletAddress={walletAddress}
          loading={passportLoading}
          notFound={!passportLoading && !!passportError && !passport}
        />

        <section>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Category Breakdown
          </h2>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5">
            <CategoryBreakdown records={records} />
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Badges
          </h2>
          <BadgeGrid badges={badges} totalGigs={passport?.totalGigs ?? 0} />
        </section>

        <section>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Work History
            {records.length > 0 && (
              <span className="ml-2 text-gray-600 font-normal normal-case">
                ({records.length})
              </span>
            )}
          </h2>
          <WorkRecordList records={records} loading={recordsLoading} />
        </section>
      </div>
    </main>
  );
}
