# Product spec — Reputation Passport

## Problem

A small ecommerce seller's most valuable asset — years of ratings, reviews,
and clean order history — is locked inside each marketplace. Expanding to a
new channel means starting from zero: no trust, worse conversion, worse
placement in marketplace risk models. Marketplaces have the mirror problem:
every new seller is a blank slate they must underwrite blind.

## Product

One portable, verified reputation profile per seller.

1. **Sellers** connect their storefronts (Shopify first) via OAuth. We import
   sales, reviews, disputes through the platform's official API and label
   everything with its provenance (`verified_api` vs `csv_self_reported`).
2. We compute a **score (0–100) + grade + confidence** from the combined
   history — Bayesian-adjusted so 5 reviews can't impersonate 5,000.
3. Every import and score is **Ed25519-signed** into a hash-chained
   attestation log. Anyone can verify a passport offline against our published
   public key. Tamper-evident without a blockchain.
4. Sellers get a **public passport page** (`/p/{slug}`) and an **embeddable
   badge** for their own site.
5. **Marketplaces/platforms query the REST API** (`/v1`) to fetch a seller's
   passport by domain, hashed email, or platform seller id — during seller
   onboarding, underwriting, or ranking.

## Personas

- **Priya, Shopify seller (supply side, free).** 4 years, 4.9★, 6k orders on
  her Shopify store + Etsy. Wants to launch on a new marketplace without the
  cold-start penalty, and show trust on her own site.
- **Marcus, marketplace trust & safety lead (demand side, pays).** Onboards
  hundreds of sellers monthly, loses money to fraud and to over-strict
  onboarding of good sellers. Pays for an API call that returns a verified
  cross-platform history instead of a blank slate.

## Business model

- Sellers: free (they are the supply; the passport's coverage is the moat).
- Platform consumers: metered API — pay-as-you-go per query, moving to monthly
  tiers with included volume. Metering recorded from day one
  (`api_usage_daily`); billing integration (Stripe metered) post-MVP.
- Pricing hypothesis to validate with design partners in Phase 5.

## MVP loop (the thin slice everything serves)

connect storefront → import + normalize → public passport page + badge →
platform query API with keys.

## Explicitly out of scope (do not build without a founder decision)

- Blockchain anything (see ADR-0001).
- Buyer-side features (consumer reviews of sellers, buyer accounts).
- Amazon SP-API integration before PMF (gated, slow approval).
- Reputation *writing* by platforms (inbound attestations from marketplaces) —
  interesting v2, not MVP.
- Multi-passport per seller, teams/orgs beyond simple `seller_members`.
- Score dispute/appeal workflows (manual founder support for MVP).
