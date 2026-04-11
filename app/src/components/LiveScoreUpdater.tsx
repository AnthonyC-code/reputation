"use client";

import { useEffect, useRef, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useConnection } from "@solana/wallet-adapter-react";
import { getProgram, passportPda } from "@/lib/anchorClient";

const READ_ONLY_WALLET = {
  publicKey: PublicKey.default,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signTransaction: async (t: any) => t,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  signAllTransactions: async (ts: any[]) => ts,
};

const MAX_POLLS = 15;
const POLL_INTERVAL_MS = 2000;

interface LiveScoreUpdaterProps {
  walletAddress: string;
  prevScore: number;
  onUpdate: (newScore: number) => void;
}

export default function LiveScoreUpdater({
  walletAddress,
  prevScore,
  onUpdate,
}: LiveScoreUpdaterProps) {
  const { connection } = useConnection();
  const [status, setStatus] = useState<"polling" | "updated" | "unchanged">("polling");
  const [newScore, setNewScore] = useState<number | null>(null);
  const pollCountRef = useRef(0);
  const doneRef = useRef(false);

  useEffect(() => {
    doneRef.current = false;
    pollCountRef.current = 0;
    setStatus("polling");
    setNewScore(null);

    async function poll() {
      if (doneRef.current) return;

      if (pollCountRef.current >= MAX_POLLS) {
        setStatus("unchanged");
        return;
      }

      pollCountRef.current += 1;

      try {
        const workerPubkey = new PublicKey(walletAddress);
        const program = getProgram(connection, READ_ONLY_WALLET);
        const [pda] = passportPda(workerPubkey);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw = await (program.account as any).passportAccount.fetch(pda);
        const score: number = raw.overallScore;

        if (score !== prevScore) {
          doneRef.current = true;
          setNewScore(score);
          setStatus("updated");
          onUpdate(score);
          return;
        }
      } catch {
        // Silently retry on fetch error
      }

      if (!doneRef.current) {
        setTimeout(poll, POLL_INTERVAL_MS);
      }
    }

    setTimeout(poll, POLL_INTERVAL_MS);

    return () => {
      doneRef.current = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletAddress, prevScore]);

  if (status === "polling") {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500" />
        </span>
        Updating score…
      </div>
    );
  }

  if (status === "updated" && newScore !== null) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-400 font-medium">
        <span className="text-green-500">✓</span>
        Score updated: {prevScore} → {newScore}
      </div>
    );
  }

  return (
    <div className="text-sm text-gray-500">
      Score unchanged after 30s
    </div>
  );
}
