import Link from "next/link";
import { DEMO_WALLET } from "@/src/lib/constants";

export default function Home() {
  const shortWallet = `${DEMO_WALLET.slice(0, 6)}…${DEMO_WALLET.slice(-4)}`;

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-900/40 border border-indigo-700/50 rounded-full px-4 py-1.5 text-sm text-indigo-300 mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
          </span>
          Live on Solana Devnet
        </div>

        <h1 className="text-5xl font-extrabold tracking-tight mb-4 max-w-2xl">
          Your Reputation,{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
            On-Chain
          </span>
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mb-10">
          A soulbound passport that aggregates your work history across freelance
          platforms — verifiable, portable, and owned entirely by you.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/demo"
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Try Live Demo
          </Link>
          <Link
            href={`/passport/${DEMO_WALLET}`}
            className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            View Demo Passport
          </Link>
        </div>
      </section>

      {/* Feature cards */}
      <section className="max-w-4xl mx-auto px-6 pb-20 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
        {[
          {
            icon: "🛡️",
            title: "Soulbound Badges",
            desc: "NFT badges minted on-chain that can't be transferred or faked.",
          },
          {
            icon: "📊",
            title: "Composite Score",
            desc: "Rating, volume, recency, diversity — one trusted number.",
          },
          {
            icon: "🔗",
            title: "Embed Anywhere",
            desc: "One-click iframe embed for your portfolio or client proposals.",
          },
        ].map(({ icon, title, desc }) => (
          <div
            key={title}
            className="bg-gray-900 border border-gray-800 rounded-2xl p-5"
          >
            <div className="text-2xl mb-3">{icon}</div>
            <h3 className="font-semibold text-white mb-1">{title}</h3>
            <p className="text-sm text-gray-400">{desc}</p>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 px-6 py-4 text-center text-xs text-gray-600">
        Demo wallet:{" "}
        <Link
          href={`/passport/${DEMO_WALLET}`}
          className="text-indigo-500 hover:text-indigo-400 font-mono"
        >
          {shortWallet}
        </Link>{" "}
        · Powered by Solana &amp; Anchor
      </footer>
    </main>
  );
}
