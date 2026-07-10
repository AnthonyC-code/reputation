# Roadmap

> **Current phase: 0 — Reset + scaffolding + CI (in progress)**
> DoD: fresh clone → `make up && make dev` runs API + web; CI green on main.

Agents: check the current phase above before starting work; update it (and
tick checklists) when you complete items. Decisions that must not be
relitigated go in `docs/adr/`.

## Phase 0 — Reset + scaffolding + CI (2–3 days)

- [x] Archive Solana prototype to `legacy-solana` branch + `legacy-solana-final` tag; clean main
- [x] AGENTS.md (+ CLAUDE.md symlink), README, docs skeleton, ADR-0001
- [x] `api/`: Go module, `passportd` (serve | migrate | keys generate), chi `/healthz`, goose + sqlc wired with migration 0001
- [x] `web/`: Next.js (TS strict, Tailwind, App Router) with landing page
- [x] docker-compose (Postgres 17), Makefile, `.env.example`, `.claude/settings.json`
- [x] GitHub Actions CI (Go vet/lint/test + web tsc/eslint/build)
- [ ] **Non-code, founder:** register Shopify Partner account + create dev store + apply for protected customer data access (longest external lead time — do this now)

## Phase 1 — Schema + auth + sellers (1–1.5 wk)

- [ ] Full core schema migrations: `users`, `sellers`, `seller_members`, `seller_identifiers`, `storefront_connections`, `sync_runs`, `raw_documents`, `reputation_events`, `score_snapshots`, `signing_keys`, `attestations`, `api_consumers`, `api_keys`, `api_usage_daily`, `webhook_subscriptions`
- [ ] Clerk integration: web components + Go JWT middleware (JWKS)
- [ ] Signup → seller + passport auto-created with slug; profile endpoints
- [ ] RFC 7807 error envelope, slog request logging, request-id middleware
- [ ] Integration tests vs Postgres (guarded by `TEST_DATABASE_URL`)
- [ ] ADR-0002 data model, ADR-0005 Clerk auth

DoD: signup → session → `GET /api/seller` round-trip covered by tests.

## Phase 2 — Shopify ingestion (1.5–2 wk)

- [ ] Shopify OAuth connect flow; AES-GCM encrypted token storage
- [ ] River worker: backfill (orders, disputes) with pagination, rate limits, cursors in `sync_state`; raw responses verbatim into `raw_documents` (buyer PII stripped)
- [ ] Idempotent normalizer: raw docs → `reputation_events` (re-run = no-op)
- [ ] Incremental sync (periodic) + webhook stubs
- [ ] Judge.me connector #2 for reviews (Shopify has no native reviews)
- [ ] go-vcr fixture tests from a real dev store

DoD: real dev store → events in Postgres; re-run backfill is a no-op; tokens never appear in logs.

## Phase 3 — Scoring + attestations (1 wk)

- [ ] Score engine v1 (see `docs/adr/0003` when written): Bayesian rating mean, Wilson dispute bound, volume/recency/diversity/tenure; confidence separate; golden tests
- [ ] `score_snapshots` after sync; skip when `inputs_hash` unchanged
- [ ] Ed25519 attestations (JCS canonical payloads, domain-separated), hash chain, JWKS endpoint, `POST /v1/verify`
- [ ] ADR-0003 scoring, ADR-0004 attestation format

DoD: sync → snapshot → attestation verifiable with only the published public key.

## Phase 4 — Public passport + badge + dashboard (1.5 wk)

- [ ] `/p/[slug]` public page: ISR + on-demand revalidation, renders without client JS, JSON-LD AggregateRating, per-platform provenance
- [ ] Badge: `public/embed.js` → iframe + backlink; static SVG route
- [ ] Dashboard: connections/sync status, score chart, embed snippet, publish toggle
- [ ] DNS TXT domain verification for `seller_identifiers`
- [ ] GDPR `SellerDeletionJob` + dashboard delete flow
- [ ] **Non-code, founder:** apply for Etsy/eBay developer accounts (long lead)

DoD: connect store → shareable page + badge pasted into a random HTML file renders live score.

## Phase 5 — Platform API + monetization surface (1 wk)

- [ ] `/v1/passports/{id}`, `/v1/passports/lookup`, `/v1/.../score` (+ inline attestation), `/v1/.../attestations`
- [ ] API keys (`rp_live_`/`rp_test_`, hashed), token-bucket rate limits, `api_usage_daily` metering
- [ ] Sandbox sellers seeded for `rp_test_` keys
- [ ] `docs/api/openapi.yaml` complete + Fumadocs rendering + reference verifiers (TS/Go)
- [ ] CSV import fallback (`csv_self_reported` trust level)

DoD: a stranger with a test key can query and verify a sandbox passport from public docs alone.

## Phase 6 — Launch prep (1–1.5 wk)

- [ ] Deploy: passportd on Fly.io/Render, Postgres on Neon (→ RDS later), web on Vercel
- [ ] Secrets in platform secret store; signing key generated in prod, never in git
- [ ] Backups, Sentry, uptime check, `docs/ops/` runbook
- [ ] Landing page + waitlist; privacy policy + ToS
- [ ] Onboard 3–5 design-partner sellers + 1–2 API-consumer prospects

## Non-code founder track (run alongside phases)

- Shopify Partner + protected-customer-data application — **Phase 0, now**
- Design-partner seller outreach list — start Phase 3, don't wait for polish
- Pricing hypothesis doc (per-query vs monthly tiers) — validate with API design partners in Phase 5
- Name/domain/trademark check
- GDPR-lite legal review before launch
