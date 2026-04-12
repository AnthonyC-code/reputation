import { useEffect, useState, useCallback } from "react";
import { PublicKey } from "@solana/web3.js";
import { AnchorProvider } from "@coral-xyz/anchor";
import { useConnection } from "@solana/wallet-adapter-react";
import { getProgram, passportPda } from "../lib/anchorClient";
import { MOCK_PASSPORT } from "../lib/mockData";

export interface PassportData {
  owner: string;
  overallScore: number;
  totalGigs: number;
  disputeCount: number;
  totalEarned: bigint;
  createdAt: bigint;
  lastUpdated: bigint;
  badgeCount: number;
  sumRatings: number;
  lastTimestamp: bigint;
  uniquePlatforms: number;
  categoryGigs: number[];
}

interface UsePassportOptions {
  useMock?: boolean;
}

interface UsePassportResult {
  passport: PassportData | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

// Read-only wallet stub — no signing needed for account fetches
const READ_ONLY_WALLET = {
  publicKey: PublicKey.default,
  signTransaction: async <T>(t: T): Promise<T> => t,
  signAllTransactions: async <T>(ts: T[]): Promise<T[]> => ts,
};

function normalizeMockPassport(): PassportData {
  return {
    owner: MOCK_PASSPORT.owner,
    overallScore: MOCK_PASSPORT.overallScore,
    totalGigs: MOCK_PASSPORT.totalGigs,
    disputeCount: MOCK_PASSPORT.disputeCount,
    totalEarned: BigInt(MOCK_PASSPORT.totalEarned),
    createdAt: BigInt(MOCK_PASSPORT.createdAt),
    lastUpdated: BigInt(MOCK_PASSPORT.lastUpdated),
    badgeCount: MOCK_PASSPORT.badgeCount,
    sumRatings: MOCK_PASSPORT.sumRatings,
    lastTimestamp: BigInt(MOCK_PASSPORT.lastUpdated),
    uniquePlatforms: MOCK_PASSPORT.uniquePlatforms,
    categoryGigs: MOCK_PASSPORT.categoryGigs,
  };
}

export function usePassport(
  walletAddress: string | null,
  { useMock = false }: UsePassportOptions = {}
): UsePassportResult {
  const { connection } = useConnection();
  const [passport, setPassport] = useState<PassportData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<number>(0);

  const refresh = useCallback(() => {
    setRefreshToken((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (useMock) {
      setPassport(normalizeMockPassport());
      setLoading(false);
      setError(null);
      return;
    }

    if (!walletAddress) {
      setPassport(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    async function fetchPassport() {
      setLoading(true);
      setError(null);

      try {
        const walletPubkey = new PublicKey(walletAddress!);
        const provider = new AnchorProvider(connection, READ_ONLY_WALLET, {
          commitment: "confirmed",
        });
        const program = getProgram(connection, READ_ONLY_WALLET);
        void provider; // provider is embedded via getProgram internally

        const [pda] = passportPda(walletPubkey);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw = await (program.account as any).passportAccount.fetch(pda);

        if (cancelled) return;

        const data: PassportData = {
          owner: raw.owner.toBase58(),
          overallScore: raw.overallScore,
          totalGigs: raw.totalGigs,
          disputeCount: raw.disputeCount,
          totalEarned: BigInt(raw.totalEarned.toString()),
          createdAt: BigInt(raw.createdAt.toString()),
          lastUpdated: BigInt(raw.lastUpdated.toString()),
          badgeCount: raw.badgeCount,
          sumRatings: raw.sumRatings,
          lastTimestamp: BigInt(raw.lastTimestamp.toString()),
          uniquePlatforms: raw.uniquePlatforms,
          categoryGigs: Array.from(raw.categoryGigs as number[]),
        };

        setPassport(data);
      } catch (err) {
        if (cancelled) return;
        setPassport(null);
        setError(err instanceof Error ? err.message : "Failed to fetch passport");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchPassport();

    return () => {
      cancelled = true;
    };
  }, [walletAddress, useMock, connection, refreshToken]);

  return { passport, loading, error, refresh };
}
