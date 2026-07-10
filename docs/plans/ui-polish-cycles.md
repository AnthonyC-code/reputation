# UI Polish Cycles — 5 iterations to a professional, investor-grade product

Self-contained execution plan. Run with: "Execute the plan in docs/plans/ui-polish-cycles.md, cycle by cycle."

## Context

The July 2026 critique cycles (see `docs/ux-cycles.md`) built the full product surface: landing, `/p/demo` sample passport with a real Ed25519-signed attestation, `/platforms`, `/docs/api`, `/docs/verification`, `/privacy`, an SVG badge route, OG share cards. Substance is solid; the *look* is default-Tailwind generic (white background, emerald-600 accent, rounded-xl cards, centered hero, unicode glyph icons) — exactly the AI-generated aesthetic.

Founder directive: 5 more cycles. The platform must look **professional, slick, investor-friendly, "more than presentable"**. Minimal emoji/unicode decoration. Nothing that reads as AI-generated. Use subagents each cycle to investigate bugs and drive feature improvements.

Working rules (established in prior cycles — keep):
- One commit per cycle, pushed to main, CI green (`gh run watch`).
- Log every cycle in `docs/ux-cycles.md` under a "Polish cycles" section: critic verdict, findings, accepted/rejected.
- `make lint && make test` + `pnpm build` + route smoke before each commit.
- Kill stray dev servers before smoke tests: `kill $(pgrep -f '[n]ext-server')` (the bracket avoids self-match).
- Honesty guardrails from cycle 4 stand: no overclaims, sample data labeled, no fabricated data outside the clearly-marked sample.
- If the demo data shape changes: `make demo-data` regenerates `web/lib/demo-passport.json` + `web/public/.well-known/demo-jwks.json` via the real Go engine (`api/cmd/demodata`).
- The stranger verification flow must keep working: scrape the verify script from the rendered `/p/demo` HTML, run against downloaded `attestation.json` → VALID; reordered-keys copy → VALID; tampered digit → INVALID.

---

## Design spec — "The Ledger Document"

One idea drives everything: **the website is itself a verifiable document.** Trust infrastructure should look like the thing it issues. Paper-toned tinted neutrals, near-black ink, 1px hairline rules instead of rounded cards, Geist Mono as the "machine register" for every number/label/identifier, one deep viridian accent reserved for verification semantics only, brass for grades, and a signature detail: a passport-style **MRZ strip** rendered from real data. Reference altitude: Stripe docs restraint + Vanta seriousness. No gradients, no glassmorphism, no blobs, no stock images.

### 1. Tokens (`web/app/globals.css`, Tailwind v4 — raw vars on `:root`, flipped in `@media (prefers-color-scheme: dark)`, mapped via `@theme inline` so `bg-paper`, `text-ink`, `border-line` work as utilities)

| Token | Light | Dark | Use |
|---|---|---|---|
| `--color-paper` | `#F7F7F4` | `#0D110F` | page background |
| `--color-surface` | `#FFFFFF` | `#141917` | document/card surfaces |
| `--color-sunken` | `#EFEFEA` | `#0A0D0B` | code blocks, MRZ strip, table heads |
| `--color-line` | `#E4E4DC` | `#242B27` | hairline borders |
| `--color-line-strong` | `#C9C9BF` | `#39423D` | document frames, table perimeters |
| `--color-ink` | `#1A201D` | `#E9EBE7` | primary text, primary buttons |
| `--color-ink-secondary` | `#4C5551` | `#A4ADA7` | supporting text |
| `--color-ink-tertiary` | `#717B75` | `#6F7973` | captions, meta, overlines |
| `--color-accent` | `#0B5B44` | `#3FBF8C` | verification semantics ONLY (checks, VERIFIED tags, score fills, focus rings). Never a button fill. |
| `--color-accent-hover` | `#084232` | `#5ACFA0` | |
| `--color-accent-tint` | `#0B5B440F` | `#3FBF8C14` | verified-tag backgrounds |
| `--color-brass` | `#8F7332` | `#CDAA5E` | grade letters, seal foil |
| `--color-warn` (text/bg/border) | `#7A4F0E` / `#FAF3E1` / `#E6D6AE` | `#E0BC6C` / `#241D10` / `#453A1D` | sample banner |
| `--color-danger` | `#A93230` | `#E5736E` | INVALID, 404 |

### 2. Typography — Geist Sans + Geist Mono only (already loaded via next/font)

Mono = machine register: all numbers (tabular-nums everywhere numeric), labels, tags, identifiers, code. Sans = human register.

- Display (landing h1): 600, `clamp(2.5rem,5vw,3.5rem)`, tracking −0.03em, leading 1.05
- h1 36px/600/−0.025em · h2 22px/600/−0.01em · h3 16px/600
- Body 16px/400/1.65 (`ink-secondary` for supporting grafs) · Lead 18px · Caption 13px `ink-tertiary`
- **Overline (signature element)**: Geist Mono 500, 11px, uppercase, tracking 0.08em, `ink-tertiary` — replaces every colored eyebrow ("FOR MARKETPLACES", "SEC. 02 — PROVENANCE")
- Data values: Mono 500–600 tabular · Code: Mono 13px/1.7 · MRZ: Mono 500 12px uppercase tracking 0.14em

### 3. Shape/depth

- Radii: 2px (tags), 4px (buttons, code blocks), 6px (document frame — max anywhere). Delete every `rounded-xl` / `rounded-lg` / `rounded-full`.
- 1px `line` borders everywhere; `line-strong` for frames/tables. Section separation = hairline top rule + overline, not boxes.
- Shadows: none, except the hero passport card: `0 1px 2px rgb(20 26 23/.06), 0 8px 24px rgb(20 26 23/.05)`; in dark replace with `0 0 0 1px #39423D`.
- Buttons: primary = solid `ink` with paper text, 4px radius, 14px/500, px-4 py-2; secondary = 1px `line-strong` border. Accent is never a fill.
- Prose links: underline, offset 3px, decoration `line-strong`, hover → accent decoration.
- Focus: `outline: 2px solid accent; offset 2px`.
- Texture: hero-only 24px SVG grid at 4% ink opacity faded with radial `mask-image`. Nothing else.

### 4. Logo — "the Seal" (replaces ShieldMark in `web/components/site-header.tsx`)

viewBox 0 0 24 24, currentColor (default accent): outer circle r=10.25 stroke 1.5; inner dotted perforation circle r=7.75 stroke 1 `stroke-dasharray="0.1 2.1"` linecap round; check `M8.4 12.3l2.5 2.5 4.8-5.4` stroke 1.8. Wordmark: seal 22px + "Reputation Passport" Sans 600 15px in ink (mark carries the color). Favicon `web/app/icon.svg`: seal without dotted ring (outer stroke 2, check 2.4), accent green, embedded `@media (prefers-color-scheme: dark)` swapping to `#3FBF8C`.

### 5. Icons — new `web/components/icons.tsx` (replaces every ✓ ↗ → ★ glyph)

viewBox 0 0 16 16, stroke 1.5, round caps/joins, fill none, currentColor, aria-hidden; 14px inline / 16px standalone:
Check `M3.5 8.5l3 3 6-7` · ArrowRight `M2.5 8h10.5M9.5 4.5L13 8l-3.5 3.5` · ArrowUpRight `M4.5 11.5L11.5 4.5M5.5 4.5h6v6` · Star (5-point, outer r 6.5/inner 2.6; filled in rating contexts) · Seal (16px logo, solid ring only) · Key (circle 5.5,10.5 r2.75 + shaft `M7.5 8.5L13 3M11 5l2 2M9.5 6.5l1.5 1.5`) · FileText (rect + folded corner + 2 rules) · AlertTriangle (`M8 2L14.5 13.5H1.5Z` + stem + dot).

### 6. MRZ helper — pure function in `web/lib/mrz.ts`

Builds passport-style lines from `PassportData`, padding with `<`:
`P<RPP<WILDFLOWER<CANDLE<CO<<<<<<<<<<<<<<<<` / `RP20260001<93A+<ORD2130<RAT49<EST2022<<<<`. Used by hero card, passport page, badge, OG card. Passport page adds a third line: `SIG ED25519 · KID {kid} · {first 8}…{last 8 of signature_b64}`.

### 7. Per-page directives

**Landing (`web/app/page.tsx`)** — container `max-w-5xl`; kill centered stack + rounded-full pill badge.
- Hero: asymmetric 7/5, 96px top pad. Left: overline `PORTABLE SELLER CREDENTIALS`; keep headline copy; lead in ink-secondary; "free for sellers" as plain caption with Check icon (not green bold); primary ink button "See a sample passport" + ArrowRight, secondary "Join early access".
- Right: **`<PassportCard/>`** (new server component, `web/components/passport-card.tsx`) live-rendered from `lib/demo.ts` — surface bg, line-strong border, 6px radius, the one shadow. Top-to-bottom: header row (seal 18px + `REPUTATION PASSPORT` overline + `NO. RP-2026-0001` mono right); seller name 20px/600; four **dotted-leader stat rows** (label left, mono value right, `border-b border-dotted` leader); score line mono 28px + grade in brass; footer MRZ strip on sunken. Masked grid texture behind.
- Works-with: hairline-ruled row, mono overline `WORKS WITH`, names 14px ink with mono 11px uppercase tags (`AT LAUNCH` accent-tint; `IN PROGRESS`/`PLANNED` ink-tertiary on sunken). No pills.
- Connect/Verify/Carry: replace 3-card grid with **numbered ledger rows** — hairline top rule each, grid `[64px 200px 1fr]`: mono `01` ink-tertiary / h3 / body.
- Data promises: one bordered plate titled overline `DATA ACCESS TERMS`, lines led by 16px Check in accent.
- Early access: left-aligned, hairline rule, h2 + graf + primary button; keep mailto. Marketplace cross-link uses ArrowRight icon.
- Copy pass: ≤1 em dash per page in prose; no `★`; sentence case.

**`/p/demo` (`web/app/p/[slug]/page.tsx` + `score-ring.tsx`)** — page bg paper; everything in **one document frame** (surface, 1px line-strong, 6px radius, **3px accent top rule**); internal hairline rules, not cards.
- Sample banner outside/above frame: flat strip, 3px warn-border left rule, warn bg, 13px, AlertTriangle 16px.
- Header: kill avatar tile. Row 1: seal + overline + `NO. RP-2026-0001 · SAMPLE` mono right. Row 2: name h1 + tagline; meta line 13px, ArrowUpRight on store link.
- Ring re-cut: 120px, stroke 6, **butt caps**, track `line`, fill `accent`, numeral Mono 600 30px tabular, grade in brass 15px/600, confidence as 11px mono uppercase.
- Share strip: sunken flat strip inside frame: overline `PASSPORT URL` + mono URL + CopyButton.
- Stats: 4-col strip with hairline **vertical** dividers; value Mono 600 24px tabular (Star icon 14px filled, "4.9/5"), label 12px ink-tertiary.
- Components: overline `SEC. 01 — HOW THIS SCORE IS BUILT`; bars 2px tall square ends, accent on line-track; values right-aligned mono `18.4 / 20`.
- Provenance: real `<table>` — 1px line-strong perimeter, hairline rows, sunken header (mono 11px uppercase `SOURCE / KIND / RECORDS / STATUS`), tabular counts, status tag = Check 12px + `VERIFIED` mono 11px accent on accent-tint, 2px radius. Detail text 12px second line in source cell.
- Badge/verify sections: keep structure; code blocks per shared spec; `<details>` summary in ink with underline (not green).
- MRZ strip: last element in frame, full-bleed, sunken, 2 MRZ lines + SIG line.
- Sample CTA below frame: hairline band, primary ink button.

**Shared code-block treatment** (used ~8 places on /docs/api, /p/demo, /docs/verification): 1px line border, 4px radius, sunken bg, **32px header bar** (hairline bottom rule, mono 11px uppercase label like `GET /V1/PASSPORTS/LOOKUP` or `VERIFY.MJS`, CopyButton right), body mono 13px/1.7 p-4. Consider `web/components/code-block.tsx`.

**/platforms, /docs/api, /docs/verification, /privacy**: keep `max-w-3xl`. Emerald eyebrows → mono overlines; rounded-circle numbers → plain mono `01`–`04` with hairline-ruled list; `→` in links → ArrowRight; emerald CTA boxes → surface plate, 1px border, primary ink button.

**Badge (`web/app/p/[slug]/badge.svg/route.ts`)** — trust-seal redesign, 300×72, self-contained (system font stacks only: `ui-monospace,'SF Mono',Menlo,monospace`): inset rect rx 4 fill `#FCFCFA` stroke `#C9C9BF`; left 56px zone with seal mark 30px `#0B5B44` + hairline vertical divider; `REPUTATION PASSPORT` 8px mono uppercase ls 1.2 `#717B75`; score 22px/600 `#1A201D` + grade in brass `#8F7332`; right column `2,130 VERIFIED ORDERS` / `4.9/5 · 473 REVIEWS` 9px mono `#4C5551`; hairline rule y=58 + MRZ micro-line 7px mono ls 1.5 `#9AA39D`; `SAMPLE` 8px mono `#7A4F0E` top-right. **Dark variant via `<style>@media (prefers-color-scheme: dark)</style>` inside the SVG** (bg `#141917`, border `#39423D`, ink `#E9EBE7`, accent `#3FBF8C`, brass `#CDAA5E`) — media queries work in `<img>`-embedded SVG.

**OG card (`opengraph-image.tsx`)** — light-only, bg `#F7F7F4`. Left: seal + `REPUTATION PASSPORT · SAMPLE` letter-spaced (Satori has no mono — fake with `letterSpacing: 4`) 24px `#717B75`; name 64px/700 ink; stats 28px `#4C5551`; provenance 22px `#717B75`. Right: re-cut ring (stroke 16 butt caps, track `#E4E4DC`, fill `#0B5B44`, grade `#8F7332`). Bottom: 56px `#EFEFEA` strip, one MRZ line 20px ls 6 `#9AA39D`. (Satori: every multi-child div needs explicit `display:flex`; no SVG `<text>` — overlay HTML divs.)

**404 (`not-found.tsx`)**: keep copy; add seal 32px with danger diagonal slash, mono overline `NO PASSPORT ON FILE`, new button styles.

**Header/footer**: hairline rules, ~56px header, new wordmark, "Early access" as small primary-ink 13px; footer seal 14px + links 13px ink-tertiary.

### 8. Anti-AI-tell checklist (enforce everywhere, including Metadata/OG strings)

Remove: unicode glyph decoration (✓ ↗ → ★; `4.9★` → `4.9/5` in ALL metadata), em-dash chains (≤1 per page in prose; interpuncts in data lines), exclamation marks, emoji, rounded-full pills, rounded-xl cards, equal three-card grids, centered hero stacks, gradients/blobs/glass, emerald-on-white, vocabulary "supercharge/unlock/seamless/effortless/revolutionize/game-changing".
Use: hairline rules + numbered sections, dotted leaders, tabular mono numerals, real data as the hero visual, sentence-case headings, concrete numbers, one reserved accent, MRZ/attestation details.

### 9. Contrast notes (verified in spec)

`#3FBF8C` on `#141917` ≈ 7.2:1 (pass); overlines `#717B75` on `#F7F7F4` ≈ 4.6:1 — acceptable for 11px uppercase tracked labels, don't go smaller.

---

## The five cycles

**C0 (start of C1) — Screenshot tooling.** `cd web && pnpm add -D playwright && pnpm exec playwright install chromium`. Write `web/scripts/shoot.mjs`: builds nothing itself; against a running `next start`, captures every route (/, /p/demo, /platforms, /docs/api, /docs/verification, /privacy, /p/nope) × light/dark (emulate `prefers-color-scheme`) × 1440px/390px widths into the session scratchpad. Look at the images. If chromium can't download in this environment, fall back to rendered-HTML review and note it.

**C1 — Design system + identity.** Implement spec §1–§6 + landing (§7 landing) + copy pass. Files: `globals.css`, new `components/icons.tsx`, `components/passport-card.tsx`, `lib/mrz.ts`, `app/icon.svg`, `site-header.tsx`, `site-footer.tsx`, `app/page.tsx`. Delete the old favicon.ico if superseded. Screenshot before/after. Commit.

**C2 — Flagship artifacts + docs sweep.** `/p/demo` document frame + ring + table + MRZ, badge redesign, OG rebuild, docs/platforms/privacy/404 token sweep, shared code-block component. Then launch a **design-critic subagent** (persona: design director; give it the spec + screenshots/rendered HTML; question: "does this look designed or generated? what breaks the ledger-document system?") and fix its findings. Commit.

**C3 — Bug hunt.** Two parallel subagents: (a) QA — responsive 390/768/1440, dark-mode inconsistencies, HTML validity, focus states, long-string overflow, build warnings, the stranger verification regression (valid/reordered/tampered); (b) code — dead code, unused classes/components, badge/OG edge cases, `next build` output anomalies, Go vet/test. Fix confirmed findings. Commit.

**C4 — Features + investor lens.** Critic subagent plays a seed investor AND a returning seller: does the site communicate market, moat (signed portable data), momentum? Candidate features it may prioritize: score-history sparkline on /p/demo (**read the `dataviz` skill before any chart work**; data can be a deterministic series derived in `api/cmd/demodata`), "how the score works" explainer with real formula weights, FAQ section on /platforms, about/founder note, copy-voice tightening. Implement top 2–4. Commit.

**C5 — Consistency + final dry run.** Full screenshot sweep, cross-page consistency audit (spacing rhythm, heading scale, icon sizes, code blocks identical everywhere), full regression (`make lint && make test`, all-route smoke, verify flow), a final dry-run critic subagent, update `docs/ux-cycles.md` + `docs/roadmap.md`, commit, push, watch CI green.

## Verification (end state)

- 5 commits on main, CI green on each (`gh run list`).
- Screenshot set (before/after) in scratchpad demonstrating the transformation.
- Zero unicode glyph icons in rendered HTML (`curl` pages, grep for ✓ ↗ → ★).
- Stranger verify flow: VALID / VALID (reordered) / INVALID (tampered).
- `docs/ux-cycles.md` polish section complete: per-cycle critic verdicts + dispositions.
- Go engine tests untouched and green; demo data regenerated if its shape changed.
