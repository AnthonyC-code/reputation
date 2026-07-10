# ADR-0001: Pivot from Solana to a centralized platform with signed attestations

Status: accepted (2026-07-09)

## Context

The first prototype of Reputation Passport was a Solana Anchor program +
Next.js demo for **gig-worker** reputation: platforms wrote work records
on-chain, workers owned a passport PDA, badges were SPL tokens. It reached a
working devnet demo but had structural flaws (un-gated badge minting, broken
platform-diversity counting, stake with no economic function) and, more
importantly, the product pivoted to **small ecommerce sellers** with a
business model of **selling API query access to platforms**.

## Decision

Rebuild from scratch as a centralized platform: Go + single Postgres +
Next.js. Tamper-evidence comes from Ed25519-signed attestations over
JCS-canonicalized payloads, appended to a hash-chained log (transparency-log
compatible; a public merkle tree can be layered on later without migration).

The prototype is archived at branch `legacy-solana` / tag
`legacy-solana-final` and deleted from `main`. Never restore, reference, or
imitate it.

## Why blockchain lost

1. **The buyer doesn't want it.** Platform customers evaluate data quality,
   API reliability, and compliance — not consensus mechanisms.
2. **GDPR.** Seller reputation data contains PII; the right to erasure is
   incompatible with an immutable public ledger. The attestation log handles
   deletion by nulling payloads while keeping hashes + signatures.
3. **Business model.** Public on-chain data is free to read, which undermines
   selling query access.
4. **Friction.** Wallets, gas, and devnet UX are a tax on small-business
   sellers and on B2B integration.

"Portable, verifiable, tamper-evident" survives the pivot — implemented with
signatures instead of consensus.

## Consequences

- Verification story: published JWKS + offline verifiers + `/v1/verify`.
- We become a trusted party; the hash chain + (later) published tree heads
  bound how much we could tamper undetected.
- Future option preserved: anchor periodic chain heads anywhere public if a
  customer ever demands it.
