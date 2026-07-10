// Passport-style MRZ (machine readable zone) lines rendered from real
// passport data. Decorative but honest: every field is derived from the
// same data the page displays.
import type { PassportData } from "./demo";

const LINE_LENGTH = 44;

// Uppercase and replace filler (spaces, punctuation) with `<`, MRZ-style.
function mrzField(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9+]+/g, "<")
    .replace(/^<+|<+$/g, "");
}

function pad(line: string): string {
  return line.length >= LINE_LENGTH
    ? line.slice(0, LINE_LENGTH)
    : line + "<".repeat(LINE_LENGTH - line.length);
}

// Document number shown on the passport, e.g. "RP-2026-0001".
export function docNumber(p: PassportData): string {
  const year = p.as_of.slice(0, 4);
  return `RP-${year}-0001`;
}

// Two MRZ lines, e.g.
//   P<RPP<WILDFLOWER<CANDLE<CO<<<<<<<<<<<<<<<<<<
//   RP20260001<93A+<ORD2130<RAT49<EST2022<<<<<<<
export function mrzLines(p: PassportData): [string, string] {
  const line1 = pad(`P<RPP<${mrzField(p.seller.name)}`);
  const estYear = p.seller.member_since.match(/\d{4}/)?.[0] ?? "";
  const fields = [
    docNumber(p).replace(/-/g, ""),
    `${Math.round(p.score.overall)}${p.score.grade}`,
    `ORD${p.stats.orders}`,
    `RAT${Math.round(p.stats.avg_rating * 10)}`,
    `EST${estYear}`,
  ];
  const line2 = pad(fields.join("<"));
  return [line1, line2];
}

// Signature line for the passport page MRZ strip, e.g.
//   SIG ED25519 · KID demo-ephemeral · EHQosHPv…tlx0UKtIDA==
export function sigLine(p: PassportData): string {
  const sig = p.attestation.signature_b64;
  return `SIG ED25519 · KID ${p.attestation.kid} · ${sig.slice(0, 8)}…${sig.slice(-8)}`;
}
