"use client";

import { useState } from "react";

// The one deliberately-client component on passport pages: copying to the
// clipboard requires JS. The content being copied is always also visible as
// plain text, so the page degrades gracefully without JS (AGENTS.md §5).
export function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="shrink-0 whitespace-nowrap rounded-xs border border-line-strong px-2 py-0.5 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink-secondary hover:bg-sunken"
    >
      {copied ? "Copied" : label}
      <span aria-live="polite" className="sr-only">
        {copied ? "Copied to clipboard" : ""}
      </span>
    </button>
  );
}
