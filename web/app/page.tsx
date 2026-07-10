export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-10 px-6 py-24 text-center">
      <span className="rounded-full border border-emerald-600/30 bg-emerald-600/10 px-3 py-1 text-sm text-emerald-700 dark:text-emerald-400">
        Early access — launching soon
      </span>

      <h1 className="max-w-3xl text-5xl font-semibold tracking-tight sm:text-6xl">
        Your reputation, everywhere you sell
      </h1>

      <p className="max-w-xl text-lg text-neutral-600 dark:text-neutral-400">
        Years of five-star history shouldn&apos;t reset to zero when you expand
        to a new marketplace. Connect your storefronts once and carry your
        verified sales, ratings, and review history with you — portable,
        tamper-evident, yours.
      </p>

      <div className="grid max-w-3xl gap-4 text-left sm:grid-cols-3">
        {[
          {
            title: "Connect",
            body: "Link Shopify and your other storefronts in a couple of clicks. We import your history through official APIs.",
          },
          {
            title: "Verify",
            body: "Every record is cryptographically signed. Anyone can check your passport is genuine — no one can quietly edit it.",
          },
          {
            title: "Carry",
            body: "A public passport page, an embeddable trust badge, and an API marketplaces use to see the seller behind the storefront.",
          },
        ].map((f) => (
          <div
            key={f.title}
            className="rounded-xl border border-neutral-200 p-5 dark:border-neutral-800"
          >
            <h2 className="mb-2 font-medium">{f.title}</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {f.body}
            </p>
          </div>
        ))}
      </div>

      <p className="text-sm text-neutral-500">
        Seller dashboard and marketplace API are under construction.
      </p>
    </main>
  );
}
