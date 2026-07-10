import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy — Reputation Passport",
  description: "What data Reputation Passport accesses, stores, and deletes.",
};

export default function PrivacyPage() {
  return (
    <main id="main" className="mx-auto w-full max-w-2xl flex-1 px-6 py-14">
      <h1 className="text-3xl font-semibold tracking-tight">Privacy</h1>
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
        Plain-English version, ahead of the full policy that ships with the
        product launch. The service is pre-launch: these are the commitments
        we are building to, stated in the tense they deserve — as promises
        about the launched product, not descriptions of code that already
        runs.
      </p>

      <div className="mt-8 space-y-6 text-neutral-700 dark:text-neutral-300">
        <section>
          <h2 className="font-medium">What we access</h2>
          <p className="mt-1 text-sm">
            When you connect a storefront, we request read-only access and
            import only the facts that make up your track record: order counts
            and outcomes, dispute and cancellation records, ratings, and
            reviews.
          </p>
        </section>
        <section>
          <h2 className="font-medium">What we never touch</h2>
          <p className="mt-1 text-sm">
            Your customers&apos; names, email addresses, and shipping addresses
            are never imported. Buyer-identifying data is stripped before
            anything is stored — we keep aggregate facts about your store, not
            data about your buyers.
          </p>
        </section>
        <section>
          <h2 className="font-medium">What&apos;s public</h2>
          <p className="mt-1 text-sm">
            Nothing, until you choose to publish your passport. Publishing
            shows your score, its breakdown, and aggregate history — never
            individual orders or buyers.
          </p>
        </section>
        <section>
          <h2 className="font-medium">Deletion</h2>
          <p className="mt-1 text-sm">
            Disconnect a storefront anytime and its imported data is deleted.
            Delete your account and your passport, history, and connections go
            with it. Deletion will be a supported, tested code path from the
            first day sellers can sign up — not a support ticket. We&apos;re
            building it before launch because retrofitting deletion is how
            companies end up unable to honor it.
          </p>
        </section>
        <section>
          <h2 className="font-medium">Questions</h2>
          <p className="mt-1 text-sm">
            Email{" "}
            <a className="underline" href="mailto:anthonychenjiaqi@gmail.com">
              anthonychenjiaqi@gmail.com
            </a>{" "}
            — you&apos;ll get a reply from the founder.
          </p>
        </section>
      </div>
    </main>
  );
}
