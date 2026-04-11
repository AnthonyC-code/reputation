import Link from "next/link";
import { DEMO_WALLET } from "@/src/lib/constants";
import DemoPassportPreview from "@/src/components/DemoPassportPreview";

export default function Home() {
  const shortWallet = `${DEMO_WALLET.slice(0, 6)}…${DEMO_WALLET.slice(-4)}`;

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Hero — two-column on md+ */}
      <section className="flex-1 max-w-5xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {/* Left: copy */}
        <div>
          <div className="inline-flex items-center gap-2 bg-indigo-900/40 border border-indigo-700/50 rounded-full px-4 py-1.5 text-sm text-indigo-300 mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
            </span>
            Live on Solana Devnet
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight mb-4 leading-tight">
            Your Reputation,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
              On-Chain
            </span>
          </h1>
          <p className="text-gray-400 text-base mb-8 leading-relaxed">
            A soulbound passport that aggregates your work history across freelance
            platforms — verifiable, portable, and owned entirely by you.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/demo"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
            >
              Try Live Demo
            </Link>
            <Link
              href={`/passport/${DEMO_WALLET}`}
              className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
            >
              View Demo Passport
            </Link>
          </div>

          {/* Feature pills */}
          <div className="mt-10 flex flex-wrap gap-2">
            {[
              { icon: "🛡️", text: "Soulbound Badges" },
              { icon: "📊", text: "Composite Score" },
              { icon: "🔗", text: "Embed Anywhere" },
              { icon: "⛓️", text: "Trustless Verification" },
            ].map(({ icon, text }) => (
              <span
                key={text}
                className="flex items-center gap-1.5 bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-gray-300"
              >
                {icon} {text}
              </span>
            ))}
          </div>
        </div>

        {/* Right: live demo passport card */}
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-3">
            Demo Wallet — Devnet
          </p>
          <DemoPassportPreview />
        </div>
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
