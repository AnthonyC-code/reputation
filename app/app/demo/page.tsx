"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import DemoPanel from "@/src/components/DemoPanel";
import PassportCard from "@/src/components/PassportCard";
import LiveScoreUpdater from "@/src/components/LiveScoreUpdater";
import { usePassport } from "@/src/hooks/usePassport";

export default function DemoPage() {
  const { publicKey, connected } = useWallet();
  const [lastTxSig, setLastTxSig] = useState<string | null>(null);
  const [prevScore, setPrevScore] = useState<number | null>(null);
  const [liveScore, setLiveScore] = useState<number | null>(null);

  const walletAddress = connected && publicKey ? publicKey.toBase58() : null;

  const { passport, loading: passportLoading, error: passportError, refresh } = usePassport(walletAddress);

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
      <header className="border-b border-gray-800 px-6 py-5">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-1">
            Live Demo — Reputation Passport
          </h1>
          <p className="text-gray-400 text-sm">
            Submit an on-chain gig and watch your reputation score update in real time.
          </p>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* How it works */}
        <div className="mb-8 bg-gray-900 border border-gray-700 rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">How to run this demo</h2>
          <ol className="space-y-3">
            {[
              {
                step: "1",
                title: "Get a Devnet wallet",
                desc: "Install Phantom or Backpack, create a wallet, and switch the network to Devnet.",
              },
              {
                step: "2",
                title: "Fund with Devnet SOL",
                desc: "Open the Phantom wallet, go to Settings → Developer Settings → Airdrop SOL, or use the Solana faucet at faucet.solana.com.",
              },
              {
                step: "3",
                title: "Connect your wallet",
                desc: 'Click the "Select Wallet" button in the nav bar and approve the connection.',
              },
              {
                step: "4",
                title: "Submit a gig",
                desc: 'Choose a platform, category, amount, and rating, then click "Complete Gig". The first submission auto-creates your passport on-chain.',
              },
              {
                step: "5",
                title: "Watch your score update",
                desc: "After the transaction confirms, your reputation score and passport stats update in real time.",
              },
            ].map(({ step, title, desc }) => (
              <li key={step} className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-bold flex items-center justify-center">
                  {step}
                </span>
                <div>
                  <span className="text-sm font-medium text-white">{title} </span>
                  <span className="text-sm text-gray-400">{desc}</span>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Left: Gig form */}
          <div className="max-w-sm w-full">
            <DemoPanel onGigComplete={handleGigComplete} />

            {lastTxSig && prevScore !== null && walletAddress && (
              <div className="mt-4 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3">
                <LiveScoreUpdater
                  key={lastTxSig}
                  walletAddress={walletAddress}
                  prevScore={prevScore}
                  onUpdate={handleScoreUpdate}
                />
              </div>
            )}
          </div>

          {/* Right: Live passport card */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-3">
              Your Passport
            </p>
            {walletAddress ? (
              <PassportCard
                passport={displayPassport}
                walletAddress={walletAddress}
                loading={passportLoading}
                notFound={!passportLoading && !!passportError && !displayPassport}
              />
            ) : (
              <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 flex items-center justify-center min-h-[200px]">
                <p className="text-gray-500 text-sm text-center">
                  Connect your wallet to see your passport
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
