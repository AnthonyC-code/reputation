# UX critique cycles

Five cycles of: persona critic agent reviews the product → triage → implement
→ verify → commit. One commit per cycle. (July 2026)

## Cycle 1 — Priya, first-time visitor / small Shopify seller

**Gut reaction:** headline lands, but "there is literally nothing to click —
this reads like a domain parked after a hackathon."

**Criticisms (ranked) → disposition:**

1. No CTA of any kind; 0% conversion by construction → **accepted**: hero CTAs
   ("See a sample passport" + early-access mailto), founding-seller framing.
2. The product is invisible — no sample passport anywhere → **accepted**:
   `/p/demo` built, powered by the real Go score engine via `make demo-data`
   (fictional seller, clearly labeled; real engine output).
3. OAuth data-access questions unanswered → **accepted**: "What we access —
   and what we never touch" section + `/privacy` plain-English page.
4. Chicken-and-egg dodge (who accepts this passport?) → **accepted**: honest
   "useful on day one, no marketplace adoption required" section.
5. "Your other storefronts" too vague → **accepted**: Works-with row with
   honest statuses (Shopify/Judge.me at launch, Etsy in progress, eBay
   planned, CSV import).
6. Crypto jargon spends trust → **accepted**: Verify card rewritten in buyer
   terms; crypto detail deferred to a verification page (cycle 3 material).
7. Anonymous site (no footer/contact/privacy) → **accepted**: footer with
   founder name + email, privacy link.
8. "Free for sellers" missing → **accepted**: one-liner under the hero
   including who pays (marketplaces).

**Also shipped (pulled Phase 3 forward):** `api/internal/score` engine v1 with
golden tests. Tests immediately caught two real formula flaws: the Bayesian
prior granted 28 free points to an empty passport (fixed: no reviews → no
rating evidence), and a week-old shop with 200 self-reported perfect reviews
scored 84 (fixed: defect component counts only verified orders; self-reported
data half-weighted in rating and volume).

**Rejected:** embedded waitlist form (needs a backend or a third-party form
service — external signup can be added when the founder picks a provider;
mailto is the honest stopgap).
