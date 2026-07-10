// Shared code-block treatment: sunken body, hairline header bar with a
// mono uppercase label and a copy button. Used on /p/[slug] and /docs/*.
import { CopyButton } from "./copy-button";

export function CodeBlock({
  label,
  code,
  copyLabel,
}: {
  label: string;
  code: string;
  // Omit to hide the copy button (for short illustrative snippets).
  copyLabel?: string;
}) {
  return (
    <figure className="overflow-hidden rounded-sm border border-line bg-sunken">
      <figcaption className="flex h-8 items-center justify-between gap-3 border-b border-line px-3">
        <span className="truncate font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink-tertiary">
          {label}
        </span>
        {copyLabel && <CopyButton text={code} label={copyLabel} />}
      </figcaption>
      <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-[1.7]">
        {code}
      </pre>
    </figure>
  );
}
