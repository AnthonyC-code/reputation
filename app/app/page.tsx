import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col">
      <section className="flex-1 max-w-2xl mx-auto px-6 py-24 flex flex-col items-center justify-center text-center">
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
        <p className="text-gray-400 text-base mb-8 leading-relaxed max-w-lg">
          A soulbound passport that aggregates your work history across freelance
          platforms — verifiable, portable, and owned entirely by you.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/demo"
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
          >
            Try Live Demo
          </Link>
          <Link
            href="/passport/me"
            className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
          >
            My Passport
          </Link>
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-2">
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
      </section>

      <footer className="border-t border-gray-800 px-6 py-4 text-center text-xs text-gray-600">
        Powered by Solana &amp; Anchor
      </footer>
    </main>
  );
}
