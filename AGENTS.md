# AGENTS.md — Reputation Passport

Instructions for AI coding agents working in this repository. Read this fully
before making changes. When this file conflicts with your intuition, this file
wins. When reality conflicts with this file, fix this file in the same commit.

## 1. What this project is

**Reputation Passport** is a centralized reputation-portability platform for
small ecommerce sellers. Sellers connect their storefronts (Shopify first;
Etsy/eBay next; Amazon later) via OAuth. We import and normalize their sales,
ratings, reviews, and disputes into one portable, verified reputation profile
with a computed score.

**Business model:** marketplaces and platforms pay to query a REST reputation
API (API keys, metered usage). Sellers get free profiles and embeddable trust
badges.

**Not blockchain.** A previous Solana/Anchor prototype was discarded — it lives
on the `legacy-solana` branch / `legacy-solana-final` tag and must never be
referenced, restored, or imitated. Tamper-evidence is provided by Ed25519-signed
attestations over a hash-chained append-only log, not a chain. Do not propose
blockchain solutions. See `docs/adr/0001-pivot-from-solana.md`.

**MVP loop (everything serves this):** connect storefront → import + normalize
→ public passport page + embeddable badge → platform query API.

**Team:** one solo founder plus AI agents. Optimize for shipping speed,
simplicity, and code the founder can audit quickly. Prefer boring technology.
Adding a new third-party dependency to `api/` requires a one-line justification
in the commit message; prefer the standard library.

## 2. Architecture

One deployable Go binary and one Next.js app, backed by a single Postgres:

- **`passportd`** (`api/cmd/passportd`) — subcommands: `serve` (HTTP API with
  **embedded River workers**; `--api=false` / `--workers=false` allow splitting
  into separate deployments later), `migrate`, `keys generate`. The HTTP API
  hosts: platform query API (`/v1/*`, API-key auth), seller dashboard API
  (`/api/*`, Clerk JWT auth), OAuth callbacks, JWKS at
  `/.well-known/jwks.json`.
- **Web** (`web/`) — Next.js App Router on Vercel: marketing, Clerk-gated
  seller dashboard, public passport pages at `/p/[slug]` (ISR), badge embed
  (`public/embed.js` → iframe, plus a static SVG route), API docs.
- **Postgres 17** — the only stateful service. App data, JSONB raw documents,
  River job queue, and usage metering all live here. No Redis. No second
  datastore (a later DynamoDB/Mongo split for raw documents is anticipated by
  the schema, not built).

**Data flow (memorize this):** OAuth connect → raw platform API responses
stored **verbatim** as JSONB in `raw_documents` → normalizer emits typed
`reputation_events` → scoring engine writes append-only `score_snapshots` →
attestation signer appends Ed25519-signed entries to the hash-chained
`attestations` log.

**Invariant: raw documents are the source of truth.** Events, scores, and
attestations must always be re-derivable by re-running normalization + scoring
over `raw_documents`. Never write derived data that can't be regenerated.

### Repo map

```
api/                 Go module — the passportd binary
  cmd/passportd/       main + subcommands (serve | migrate | keys ...)
  internal/config/     env parsing
  internal/httpapi/    routers, handlers, middleware (publicv1/, sellerapi/, oauthcb/)
  internal/connectors/ Connector interface; shopify/, csvimport/ (etsy/ later)
  internal/ingest/     sync orchestration, raw_documents upserts, cursor mgmt
  internal/normalize/  raw docs -> reputation_events
  internal/score/      pure scoring engine + score_version constant
  internal/attest/     JCS canonicalization, Ed25519 signing, hash chain, JWKS
  internal/jobs/       River job definitions (thin wrappers over domain pkgs)
  internal/store/      sqlc-generated code + queries/*.sql + db helpers
  internal/crypto/     AES-GCM token encryption, signing-key loading
  migrations/          goose SQL migrations (NNNN_name.sql)
web/                 Next.js app (dashboard, public passport, badge, docs)
docs/                roadmap.md, product.md, adr/, api/openapi.yaml, ops/
infra/               Dockerfiles, deploy configs (Phase 6)
.claude/             agent settings and project skills
```

## 3. Tech stack (fixed choices — do not swap without an ADR)

| Area | Choice |
|---|---|
| Backend | Go 1.26+, chi router, stdlib-first |
| DB | PostgreSQL 17, single database, JSONB for raw docs |
| DB access | pgx/v5 + sqlc (no ORM — never GORM) |
| Migrations | goose, plain SQL files in `api/migrations/` |
| Job queue | River (riverqueue.com) — jobs live in Postgres, no Redis |
| Signing | stdlib `crypto/ed25519` + RFC 8785 JCS canonicalization |
| Seller auth | Clerk (web components + Go JWT verification via JWKS) |
| Frontend | Next.js (App Router), TypeScript strict, Tailwind CSS |
| Web pkg mgr | pnpm |
| Testing | Go stdlib `testing`; Postgres integration tests need Docker; Vitest/Playwright for web (later) |
| CI | GitHub Actions (`.github/workflows/ci.yml`) |
| Deploy | Fly.io/Render (passportd), Vercel (web), managed Postgres (Neon → RDS) |

## 4. Dev environment

Everything routes through the Makefile at repo root:

```
make up          # start docker-compose (Postgres 17 on :5432)
make dev         # run passportd (hot path: go run) + web dev server
make migrate     # goose up against local DB
make migrate-new NAME=add_foo   # create a new migration file
make sqlc        # regenerate api/internal/store from queries/*.sql
make test        # all Go tests + web typecheck/lint
make test-go     # Go only
make lint        # go vet (+ golangci-lint if installed) + eslint + tsc --noEmit
```

- Copy `.env.example` → `.env` for local config. **Every new env var must be
  added to `.env.example` with a comment and a fake value in the same commit.**
- sqlc runs via `go tool` (pinned in `api/go.mod`); migrations run through
  `passportd migrate` (embedded goose library) — no global installs needed.
- Integration tests that need Postgres are guarded: they skip when
  `TEST_DATABASE_URL` is unset. If Docker is unavailable, run `make test-go`
  and say so in your summary.
- Shopify OAuth needs a public HTTPS callback in dev: `cloudflared tunnel`
  (URL goes in `.env`).
- Never run `go run` / `pnpm dev` ad hoc when a make target exists; targets
  encode required env and flags.

## 5. Conventions

### Go
- New domain logic goes in a package under `api/internal/`, named by domain
  (`score`, `ingest`), never by pattern — `services`, `utils`, `helpers`, and
  `common` are banned package names.
- Errors: wrap with `fmt.Errorf("doing thing: %w", err)`; sentinel errors as
  package-level `var ErrX = errors.New(...)`; domain errors map to HTTP status
  codes in exactly one place (`internal/httpapi`). Never `panic` in request or
  job paths.
- Logging: `log/slog` structured logging only. No `fmt.Println` outside
  `cmd/` bootstrap.
- DB: all SQL lives in `api/internal/store/queries/*.sql` and goes through
  sqlc. No string-concatenated SQL, no raw queries in handlers. Transactions
  via the `store.WithTx` helper. After editing queries or migrations, run
  `make sqlc` and commit the generated code.
- Handlers are thin: decode → validate → call domain package → encode.
  Business logic lives in domain packages and is unit-testable without HTTP.
- Background work: define River job args + worker in `internal/jobs`, calling
  into the owning domain package. Jobs must be idempotent — they will retry.

### TypeScript / Next.js
- Strict mode; no `any` (use `unknown` + narrowing). Server Components by
  default; `"use client"` only when interaction requires it.
- All calls to the Go API go through the typed client in `web/lib/api.ts` —
  components never call `fetch` directly.
- Tailwind for styling; no CSS-in-JS. Shared components in `web/components/`;
  colocate one-off components with their route.
- Public passport pages must render fully without client-side JS (SEO and
  trust: integrators will read the page source).

### API design
- Platform API is versioned by path: `/v1/...`. Additive changes only within
  a version; breaking changes are what `/v2` is for. The seller dashboard API
  (`/api/...`) is unversioned, free to change, and never documented publicly.
- JSON: `snake_case` keys, RFC 3339 UTC timestamps, UUIDv7 string ids.
  Response envelopes are objects, never bare arrays.
- Errors: RFC 7807 `application/problem+json` with stable machine-readable
  `type` slugs, plus `request_id`.
- **Any change to `/v1/` updates `docs/api/openapi.yaml` in the same commit.**
- Platform API auth: `Authorization: Bearer rp_live_...` / `rp_test_...`.
  Test keys only ever see sandbox data.

### Migrations
- goose SQL files, sequentially numbered, in `api/migrations/`. Write
  `-- +goose Down` but never rely on running it in prod (forward-only).
- Never edit a migration that has been merged to main; write a new one.
- No destructive migrations (DROP TABLE / column removal) without an ADR.

### Git
- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`,
  `test:`; optional scope, e.g. `feat(ingest): shopify order backfill`.
- Small, coherent commits. `make lint && make test` green before committing.
  Do not commit generated files other than sqlc output. Never force-push main.

## 6. Domain glossary (use these words exactly)

- **Seller** — the business that owns storefronts and has an account (via
  Clerk). Table: `sellers`. *Never say "user" in code or schema — say seller
  or platform consumer.* (`users` exists only as the Clerk-identity join
  table.)
- **Passport** — a seller's public reputation profile, addressed by `slug`
  (`/p/{slug}`). One per seller in MVP.
- **Storefront connection** — an authorized OAuth link between a seller and
  one storefront on one platform (e.g. one Shopify shop). Holds encrypted
  tokens, sync cursors, and a trust level. Table: `storefront_connections`.
  Hard rule: **UNIQUE(platform, external_shop_id)** — one storefront can never
  back two passports.
- **Raw document** — a verbatim JSONB copy of a platform API response (buyer
  PII stripped at ingest), keyed by `(connection_id, kind, external_id)`.
  Immutable source of truth. Table: `raw_documents`.
- **Reputation event** — a normalized, typed fact derived from raw documents:
  `sale`, `review`, `dispute`, `refund`, `cancellation`. Idempotent to
  regenerate. Table: `reputation_events`.
- **Trust level** — provenance label on connections and events:
  `verified_api` (we fetched it from the platform's API via OAuth) or
  `csv_self_reported` (seller-supplied). Flows into confidence and badge copy;
  self-reported-only data is capped at grade B.
- **Score snapshot** — computed score (0–100) + grade + confidence + full
  component/input audit trail, tagged `score_version`. Append-only. Table:
  `score_snapshots`.
- **Attestation** — an Ed25519 signature over a JCS-canonicalized payload,
  appended to a hash-chained log (`chain_hash = sha256(prev || payload_hash)`).
  Kinds: `import.summary`, `score.snapshot`, `identifier.verified`. This is
  the tamper-evidence mechanism (the blockchain replacement). Table:
  `attestations`.
- **Platform consumer** — a paying customer (marketplace/platform) querying
  `/v1`. Owns API keys. Tables: `api_consumers`, `api_keys`.
- **Badge** — the embeddable widget/SVG a seller places on their site,
  showing their live score and linking to their passport page.
- **Sync** — a worker run importing from one storefront connection: `backfill`
  (initial full import) or `incremental` (cursor/webhook delta).
- **Normalization** — the raw-documents → reputation-events transformation.

## 7. Guardrails (hard rules)

- **Secrets & tokens:** never log, print, or include in error messages any
  OAuth token, API key, session token, or key material — not even truncated,
  not even at debug level. OAuth tokens are AES-256-GCM encrypted at rest;
  plaintext exists only in memory. API keys are stored as sha256 hashes; only
  the prefix (`rp_live_a1b2…`) may appear in logs or UI.
- **Signing key:** the Ed25519 private key comes from env / secret store only.
  Never generate it implicitly, hardcode it, or commit key material. Changes
  to `internal/attest` require tests proving verification against the
  published public key.
- **PII / GDPR:** buyer-identifying fields are stripped before raw documents
  are stored; `reputation_events` carries only `buyer_hash` (sha256 of the
  platform's buyer id). Public pages and `/v1` expose aggregates and event
  metadata, never buyer data. Seller deletion (`SellerDeletionJob`) must
  always remain possible: hard-delete derived data, null attestation payloads
  (keep hash + signature so the chain survives), tombstone the seller. Don't
  build features that make deletion impossible.
- **No fabricated data:** never seed fake reviews/ratings/sellers into
  non-sandbox code paths. Sandbox data is only reachable via `rp_test_` keys
  and is clearly labeled. Trust is the entire product.
- **External APIs:** all importer HTTP goes through the shared client in
  `internal/ingest` with retry/backoff and platform rate-limit respect. Tests
  use recorded fixtures (go-vcr), never live platform APIs.
- **Legacy code:** do not check out, cherry-pick, or copy from the
  `legacy-solana` branch. If blockchain remnants appear on main, delete them.
- **Before committing:** `make lint && make test` green; `make sqlc` output
  committed if SQL changed; OpenAPI updated if `/v1` changed.

## 8. Current status & where plans live

- **Current phase:** see the header of `docs/roadmap.md` — it names the active
  phase and its definition of done. Update it when a phase completes.
- Product spec, personas, pricing hypothesis: `docs/product.md`.
- Decisions: `docs/adr/NNNN-title.md`. If you make a decision future agents
  must not relitigate (schema shape, scoring formula, dependency choice),
  write an ADR in the same commit. Rule of thumb: if a future agent could
  plausibly "improve" it back to the rejected option, it needs an ADR.
- Platform API contract: `docs/api/openapi.yaml` (contract-first).
- When you finish meaningful work, leave the repo in a state where the next
  agent can orient from `docs/roadmap.md` + `git log` alone.
