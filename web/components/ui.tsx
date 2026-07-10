// Tiny shared primitives for the ledger-document system, so overlines and
// button styles stay identical across pages.
import type { ReactNode } from "react";

// Mono uppercase micro-label; replaces every colored eyebrow.
export function Overline({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink-tertiary ${className ?? ""}`}
    >
      {children}
    </span>
  );
}

// Primary action: solid ink, paper text. Accent is never a button fill.
export const btnPrimary =
  "inline-flex items-center gap-2 rounded-sm bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-ink/90";

export const btnSecondary =
  "inline-flex items-center gap-2 rounded-sm border border-line-strong px-4 py-2 text-sm font-medium text-ink hover:bg-sunken";
