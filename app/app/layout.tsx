import type { Metadata } from "next";
import "./globals.css";
import SolanaWalletProvider from "@/src/components/WalletProvider";

export const metadata: Metadata = {
  title: "Reputation Passport",
  description: "On-chain gig worker reputation protocol",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-white min-h-screen">
        <SolanaWalletProvider>{children}</SolanaWalletProvider>
      </body>
    </html>
  );
}
