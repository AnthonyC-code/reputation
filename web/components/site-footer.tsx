import Link from "next/link";
import { Seal } from "./icons";

const links = [
  ["/p/demo", "Sample passport"],
  ["/platforms", "For marketplaces"],
  ["/docs/api", "API preview"],
  ["/docs/score", "How the score works"],
  ["/docs/verification", "How verification works"],
  ["/about", "About"],
  ["/privacy", "Privacy"],
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line px-6 py-8 text-[13px] text-ink-tertiary">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-4">
        <p className="flex items-center gap-2">
          <Seal size={14} />© Reputation Passport
        </p>
        <nav aria-label="Footer" className="flex flex-wrap gap-4">
          {links.map(([href, label]) => (
            <Link key={href} href={href} className="hover:text-ink">
              {label}
            </Link>
          ))}
          <a
            href="mailto:anthonychenjiaqi@gmail.com?subject=Reputation%20Passport"
            className="hover:text-ink"
          >
            Contact
          </a>
        </nav>
      </div>
    </footer>
  );
}
