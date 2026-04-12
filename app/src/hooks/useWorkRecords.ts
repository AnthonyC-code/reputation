import { useEffect, useState, useCallback } from "react";
import { PublicKey } from "@solana/web3.js";
import { useConnection } from "@solana/wallet-adapter-react";
import { getProgram } from "../lib/anchorClient";
import { MOCK_RECORDS } from "../lib/mockData";

export interface WorkRecordData {
  worker: string;
  platform: string;
  category: string;
  amountPaid: bigint;
  rating: number;
  disputed: boolean;
  timestamp: bigint;
  recordId: Uint8Array;
}

interface UseWorkRecordsOptions {
  useMock?: boolean;
}

interface UseWorkRecordsResult {
  records: WorkRecordData[];
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

// Map on-chain variant objects like { tech: {} } to display strings
function normalizeCategoryVariant(category: unknown): string {
  if (typeof category === "string") return category;
  if (category && typeof category === "object") {
    const key = Object.keys(category as Record<string, unknown>)[0];
    if (!key) return "Other";
    const map: Record<string, string> = {
      tech: "Tech",
      design: "Design",
      writing: "Writing",
      language: "Language",
      teaching: "Teaching",
      other: "Other",
    };
    return map[key.toLowerCase()] ?? key.charAt(0).toUpperCase() + key.slice(1);
  }
  return "Other";
}

function normalizeMockRecords(): WorkRecordData[] {
  return MOCK_RECORDS.map((r, i) => ({
    worker: "MockWallet111111111111111111111111111111111",
    platform: r.platform,
    category: r.category,
    amountPaid: BigInt(Math.round(r.amountPaid)),
    rating: r.rating,
    disputed: r.disputed,
    timestamp: BigInt(Math.round(r.timestamp)),
    recordId: new Uint8Array(32).fill(i + 1),
  }));
}

export function useWorkRecords(
  workerAddress: string | null,
  { useMock = false }: UseWorkRecordsOptions = {}
): UseWorkRecordsResult {
  const { connection } = useConnection();
  const [records, setRecords] = useState<WorkRecordData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<number>(0);

  const refresh = useCallback(() => {
    setRefreshToken((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (useMock || !workerAddress) {
      setRecords(normalizeMockRecords());
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    async function fetchRecords() {
      setLoading(true);
      setError(null);

      try {
        const workerPubkey = new PublicKey(workerAddress!);
        const program = getProgram(connection, READ_ONLY_WALLET);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawAccounts = await (program.account as any).workRecord.all([
          {
            memcmp: {
              offset: 8, // skip the 8-byte discriminator
              bytes: workerPubkey.toBase58(),
            },
          },
        ]);

        if (cancelled) return;

        const data: WorkRecordData[] = rawAccounts.map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ({ account }: { account: any }) => ({
            worker: account.worker.toBase58(),
            platform: account.platform.toBase58(),
            category: normalizeCategoryVariant(account.category),
            amountPaid: BigInt(account.amountPaid.toString()),
            rating: account.rating,
            disputed: account.disputed,
            timestamp: BigInt(account.timestamp.toString()),
            recordId: new Uint8Array(account.recordId as number[]),
          })
        );

        // Sort by timestamp descending (most recent first)
        data.sort((a, b) => (b.timestamp > a.timestamp ? 1 : b.timestamp < a.timestamp ? -1 : 0));

        setRecords(data);
      } catch (err) {
        if (cancelled) return;
        setRecords([]);
        setError(err instanceof Error ? err.message : "Failed to fetch work records");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchRecords();

    return () => {
      cancelled = true;
    };
  }, [workerAddress, useMock, connection, refreshToken]);

  return { records, loading, error, refresh };
}
