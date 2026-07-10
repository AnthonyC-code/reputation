// Line icon set for the ledger-document design system. 16px grid,
// 1.5px strokes, round caps, currentColor. Replaces unicode glyphs
// (✓ ↗ → ★) everywhere in the UI.
import type { ReactNode } from "react";

interface IconProps {
  size?: number;
  className?: string;
}

function Icon({
  size = 16,
  className,
  children,
  fill = "none",
}: IconProps & { children: ReactNode; fill?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill={fill}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {children}
    </svg>
  );
}

export function Check(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.5 8.5l3 3 6-7" />
    </Icon>
  );
}

export function ArrowRight(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M2.5 8h10.5M9.5 4.5L13 8l-3.5 3.5" />
    </Icon>
  );
}

export function ArrowUpRight(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.5 11.5L11.5 4.5M5.5 4.5h6v6" />
    </Icon>
  );
}

export function Star({ filled = false, ...props }: IconProps & { filled?: boolean }) {
  return (
    <Icon {...props} fill={filled ? "currentColor" : "none"}>
      <path
        strokeWidth={filled ? 0 : 1.5}
        d="M8 1.5L9.53 5.9L14.18 5.99L10.47 8.8L11.82 13.26L8 10.6L4.18 13.26L5.53 8.8L1.82 5.99L6.47 5.9Z"
      />
    </Icon>
  );
}

// Compact seal: solid ring + check, for footer and inline use.
export function Seal(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="8" cy="8" r="6.5" />
      <path d="M5.6 8.2l1.7 1.7 3.2-3.6" />
    </Icon>
  );
}

export function AlertTriangle(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8 2L14.5 13.5H1.5Z" />
      <path d="M8 6.5v3M8 11.4v.2" />
    </Icon>
  );
}

// Full wordmark seal: outer ring, dotted perforation, check. currentColor
// so the caller sets the color (accent by default in the header).
export function SealMark({ size = 22, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      aria-hidden
      className={className}
    >
      <circle cx="12" cy="12" r="10.25" strokeWidth="1.5" />
      <circle
        cx="12"
        cy="12"
        r="7.75"
        strokeWidth="1"
        strokeDasharray="0.1 2.1"
        strokeLinecap="round"
      />
      <path
        d="M8.4 12.3l2.5 2.5 4.8-5.4"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
