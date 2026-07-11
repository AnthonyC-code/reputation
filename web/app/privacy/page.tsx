import type { Metadata } from "next";
import { Overline } from "@/components/ui";

export const metadata: Metadata = {
  title: "Privacy — Reputation Passport",
  description: "What data Reputation Passport accesses, stores, and deletes.",
};

const sections: [string, React.ReactNode][] = [
  [
    "What we access",
    "When you connect a storefront, we request read-only access and import only the facts that make up your track record: order counts and outcomes, dispute and cancellation records, ratings, and reviews.",
  ],
  [
    "What we never touch",
    "Your customers' names, email addresses, and shipping addresses are never imported. Buyer-identifying data is stripped before anything is stored. We keep aggregate facts about your store, not data about your buyers.",
  ],
  [
    "What's public",
    "Nothing, until you choose to publish your passport. Publishing shows your score, its breakdown, and aggregate history — never individual orders or buyers.",
  ],
  [
    "Deletion",
    "Disconnect a storefront anytime and its imported data is deleted. Delete your account and your passport, history, and connections go with it. Deletion will be a supported, tested code path from the first day sellers can sign up, not a support ticket. We're building it before launch because retrofitting deletion is how companies end up unable to honor it.",
  ],
];

export default function PrivacyPage() {
  return (
    <main id="main" className="mx-auto w-full max-w-2xl flex-1 px-6 py-14">
      <Overline>Policy</Overline>
      <h1 className="mt-3 text-4xl font-semibold tracking-[-0.025em]">
        Privacy
      </h1>
      <p className="mt-4 text-sm leading-[1.65] text-ink-tertiary">
        Plain-English version, ahead of the full policy that ships with the
        product launch. The service is pre-launch: everything below is a
        commitment about the launched product, not a description of code
        that already runs.
      </p>

      <div className="mt-10">
        {sections.map(([title, body]) => (
          <section
            key={title as string}
            className="border-t border-line py-6"
          >
            <h2 className="text-[22px] font-semibold tracking-[-0.01em]">
              {title}
            </h2>
            <p className="mt-3 text-sm leading-[1.65] text-ink-secondary">
              {body}
            </p>
          </section>
        ))}
        <section className="border-t border-line py-6">
          <h2 className="text-[22px] font-semibold tracking-[-0.01em]">
            Questions
          </h2>
          <p className="mt-3 text-sm leading-[1.65] text-ink-secondary">
            Email{" "}
            <a
              className="underline decoration-line-strong underline-offset-[3px] hover:decoration-accent"
              href="mailto:anthonychenjiaqi@gmail.com"
            >
              anthonychenjiaqi@gmail.com
            </a>{" "}
            and you&apos;ll get a reply from the founder.
          </p>
        </section>
      </div>
    </main>
  );
}
