"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import DemoPanel from "@/src/components/DemoPanel";
import PassportCard from "@/src/components/PassportCard";
import LiveScoreUpdater from "@/src/components/LiveScoreUpdater";
import { usePassport } from "@/src/hooks/usePassport";
import { DEMO_WALLET } from "@/src/lib/constants";

export default function DemoPage() {
  const { publicKey, connected } = useWallet();
  const [lastTxSig, setLastTxSig] = useState<string | null>(null);
  const [prevScore, setPrevScore] = useState<number | null>(null);
  const [liveScore, setLiveScore] = useState<number | null>(null);

  // Show connected wallet's passport; fall back to demo wallet
  const activeWallet = connected && publicKey
    ? publicKey.toBase58()
    : DEMO_WALLET;

  const { passport, refresh } = usePassport(activeWallet);

  function handleGigComplete(txSig: string) {
    setLastTxSig(txSig);
    setLiveScore(null);
    setPrevScore(passport?.overallScore ?? 0);
  }

  function handleScoreUpdate(newScore: number) {
    setLiveScore(newScore);
    refresh();
  }

  const displayPassport =
    liveScore !== null && passport
      ? { ...passport, overallScore: liveScore }
      : passport;

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">
              Live Demo — Reputation Passport
            </h1>
            <p className="text-gray-400 text-sm">
              Submit an on-chain gig and watch your reputation score update in real time.
            </p>
          </div>
          <WalletMultiButton />
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Step instructions */}
        <ol className="flex flex-wrap gap-3 mb-8">
          {[
            "Connect your Phantom wallet",
            "Fill in the gig form",
            "Click Complete Gig",
            "Watch your score update live",
          ].map((step, i) => (
            <li
              key={i}
              className="flex items-center gap-2 bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-sm"
            >
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">
                {i + 1}
              </span>
              <span className="text-gray-300">{step}</span>
            </li>
          ))}
        </ol>

        {/* Split layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Left: Gig form */}
          <div className="max-w-sm w-full">
            <DemoPanel onGigComplete={handleGigComplete} />

            {/* Live score updater appears after a gig is completed */}
            {lastTxSig && prevScore !== null && (
              <div className="mt-4 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3">
                <LiveScoreUpdater
                  key={lastTxSig}
                  walletAddress={activeWallet}
                  prevScore={prevScore}
                  onUpdate={handleScoreUpdate}
                />
              </div>
            )}
          </div>

          {/* Right: Live passport card */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-3">
              {connected ? "Your Passport" : "Demo Wallet Passport"}
            </p>
            <PassportCard passport={displayPassport} walletAddress={activeWallet} />
          </div>
        </div>
      </div>
    </main>
  );
}
