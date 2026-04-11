"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import PassportCard from "@/src/components/PassportCard";
import CategoryBreakdown from "@/src/components/CategoryBreakdown";
import BadgeGrid from "@/src/components/BadgeGrid";
import { usePassport } from "@/src/hooks/usePassport";
import { useWorkRecords } from "@/src/hooks/useWorkRecords";
import { MOCK_BADGES } from "@/src/lib/mockData";

interface PassportPageClientProps {
  wallet: string;
}

export default function PassportPageClient({ wallet }: PassportPageClientProps) {
  const { publicKey, connected } = useWallet();

  const isMe = wallet === "me";
  const walletAddress = isMe ? (publicKey?.toBase58() ?? null) : wallet;

  const { passport } = usePassport(walletAddress);
  const { records } = useWorkRecords(walletAddress);

  // Derive badge list from passport or fall back to mock
  const badges: string[] =
    passport && passport.badgeCount > 0 ? MOCK_BADGES : MOCK_BADGES;

  if (isMe && !connected) {
    return (
      <main className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-6 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Reputation Passport</h1>
          <p className="text-gray-400 text-sm mb-6">Connect your wallet to view your passport</p>
          <WalletMultiButton />
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
        {/* Header row with wallet button when viewing own passport */}
        {isMe && (
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-white">My Passport</h1>
            <WalletMultiButton />
          </div>
        )}

        {!isMe && (
          <h1 className="text-xl font-bold text-white">
            Reputation Passport
          </h1>
        )}

        <PassportCard passport={passport} walletAddress={walletAddress} />

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
      </div>
    </main>
  );
}
