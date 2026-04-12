"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";

export default function NavBar() {
  const pathname = usePathname();
  const { publicKey, connected } = useWallet();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const links = [
    { href: "/", label: "Home" },
    { href: "/demo", label: "Demo" },
    {
      href: connected && publicKey ? `/passport/${publicKey.toBase58()}` : "/passport/me",
      label: "My Passport",
    },
  ];

  return (
    <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-white font-bold text-sm tracking-tight">
            Vouchit
          </Link>
          <div className="hidden sm:flex items-center gap-1">
            {links.map(({ href, label }) => {
              const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
              return (
                <Link
                  key={label}
                  href={href}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    isActive
                      ? "bg-gray-800 text-white"
                      : "text-gray-400 hover:text-white hover:bg-gray-800/60"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
        {mounted && <WalletMultiButton style={{ height: 36, fontSize: 13 }} />}
      </div>
    </nav>
  );
}
