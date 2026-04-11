"use client";

import { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { getProgram, passportPda, workRecordPda, platformPda } from "@/lib/anchorClient";
import { TREASURY_PUBKEY, LAMPORTS_PER_SOL_NUM, RPC_URL } from "@/lib/constants";

// Deterministic platform keypairs from fixed 32-byte seeds
function seedBuf(label: string): Uint8Array {
  const buf = Buffer.alloc(32, 0);
  Buffer.from(label).copy(buf, 0, 0, 32);
  return buf;
}

const PLATFORM_KEYPAIRS: Record<string, Keypair> = {
  "Soleer Mock": Keypair.fromSeed(seedBuf("soleer-mock-platform-seed")),
  "Gibwork Mock": Keypair.fromSeed(seedBuf("gibwork-mock-platform-seed")),
  "Superteam Mock": Keypair.fromSeed(seedBuf("superteam-mock-platform-seed")),
};

const PLATFORMS = ["Soleer Mock", "Gibwork Mock", "Superteam Mock"] as const;
const CATEGORIES = ["Tech", "Design", "Language", "Teaching", "Other"] as const;
type Category = (typeof CATEGORIES)[number];

function categoryToAnchor(cat: Category): Record<string, Record<string, never>> {
  const map: Record<Category, string> = {
    Tech: "tech",
    Design: "design",
    Language: "language",
    Teaching: "teaching",
    Other: "other",
  };
  return { [map[cat]]: {} };
}

function truncateAddress(addr: string): string {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function explorerUrl(sig: string): string {
  const isLocal = RPC_URL.includes("127.0.0.1") || RPC_URL.includes("localhost");
  if (isLocal) {
    return `https://explorer.solana.com/tx/${sig}?cluster=custom&customUrl=${encodeURIComponent(RPC_URL)}`;
  }
  return `https://explorer.solana.com/tx/${sig}?cluster=devnet`;
}

interface DemoPanelProps {
  onGigComplete: (txSig: string) => void;
}

export default function DemoPanel({ onGigComplete }: DemoPanelProps) {
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const { connection } = useConnection();

  const [platform, setPlatform] = useState<string>(PLATFORMS[0]);
  const [category, setCategory] = useState<Category>("Tech");
  const [amountSol, setAmountSol] = useState<string>("0.01");
  const [rating, setRating] = useState<number>(5);
  const [disputed, setDisputed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [txSig, setTxSig] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!publicKey) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 min-h-[300px]">
        <span className="text-gray-400 text-sm text-center">
          Connect wallet to use demo
        </span>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!publicKey || !signTransaction || !signAllTransactions) return;

    setLoading(true);
    setError(null);
    setTxSig(null);

    try {
      const platformKeypair = PLATFORM_KEYPAIRS[platform];
      if (!platformKeypair) throw new Error("Unknown platform");

      const wallet = {
        publicKey,
        signTransaction,
        signAllTransactions,
      };

      const program = getProgram(connection, wallet);

      // Generate a unique record ID from timestamp + random bytes
      const recordIdBuf = Buffer.alloc(32);
      const nowBytes = Buffer.alloc(8);
      nowBytes.writeBigInt64LE(BigInt(Date.now()), 0);
      nowBytes.copy(recordIdBuf, 0);
      crypto.getRandomValues(recordIdBuf.subarray(8));
      const recordId = Array.from(recordIdBuf) as unknown as number[] & { length: 32 };

      const [passportPdaKey] = passportPda(publicKey);
      const [workRecordPdaKey] = workRecordPda(publicKey, recordIdBuf);
      const [platformPdaKey] = platformPda(platformKeypair.publicKey);
      const treasury = new PublicKey(TREASURY_PUBKEY);

      const amountLamports = new BN(
        Math.round(parseFloat(amountSol) * LAMPORTS_PER_SOL_NUM)
      );

      const sig = await (program.methods as any)
        .emitWorkRecord(
          recordId,
          categoryToAnchor(category),
          amountLamports,
          rating,
          disputed
        )
        .accounts({
          passport: passportPdaKey,
          workRecord: workRecordPdaKey,
          platform: platformPdaKey,
          worker: publicKey,
          treasury,
          platformSigner: platformKeypair.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([platformKeypair])
        .rpc();

      setTxSig(sig);
      onGigComplete(sig);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6">
      <h2 className="text-base font-semibold text-white mb-5">Gig Simulator</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Worker wallet */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Worker Wallet</label>
          <input
            type="text"
            readOnly
            value={truncateAddress(publicKey.toBase58())}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 font-mono cursor-not-allowed"
          />
        </div>

        {/* Platform */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Platform</label>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
          >
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Amount in SOL */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Amount (SOL)</label>
          <input
            type="number"
            min="0.001"
            step="0.001"
            value={amountSol}
            onChange={(e) => setAmountSol(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Rating */}
        <div>
          <label className="block text-xs text-gray-400 mb-2">Rating</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="text-2xl leading-none transition-transform hover:scale-110 focus:outline-none"
              >
                <span className={star <= rating ? "text-yellow-400" : "text-gray-600"}>
                  ★
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Disputed */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="disputed"
            checked={disputed}
            onChange={(e) => setDisputed(e.target.checked)}
            className="w-4 h-4 accent-indigo-500"
          />
          <label htmlFor="disputed" className="text-sm text-gray-300 cursor-pointer">
            Mark as disputed
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
        >
          {loading ? "Sending transaction…" : "Complete Gig"}
        </button>
      </form>

      {/* TX success */}
      {txSig && (
        <div className="mt-4 p-3 bg-green-900/30 border border-green-700/50 rounded-lg">
          <p className="text-xs text-green-400 font-medium mb-1">Transaction sent!</p>
          <a
            href={explorerUrl(txSig)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-indigo-400 underline break-all"
          >
            {txSig.slice(0, 20)}...{txSig.slice(-8)}
          </a>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 p-3 bg-red-900/30 border border-red-700/50 rounded-lg">
          <p className="text-xs text-red-400 font-medium mb-0.5">Transaction failed</p>
          <p className="text-xs text-red-300 break-all">{error}</p>
        </div>
      )}
    </div>
  );
}
