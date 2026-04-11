"use client";

import Link from "next/link";
import PassportCard from "@/src/components/PassportCard";
import { usePassport } from "@/src/hooks/usePassport";
import { DEMO_WALLET } from "@/src/lib/constants";

export default function DemoPassportPreview() {
  const { passport } = usePassport(DEMO_WALLET);

  return (
    <div className="relative">
      <PassportCard passport={passport} walletAddress={DEMO_WALLET} />
      <Link
        href={`/passport/${DEMO_WALLET}`}
        className="absolute inset-0 rounded-2xl ring-0 hover:ring-2 ring-indigo-500/50 transition-all"
        aria-label="View demo passport"
      />
    </div>
  );
}
