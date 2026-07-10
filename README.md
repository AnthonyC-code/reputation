# Reputation Passport

Small ecommerce sellers build reputation on one marketplace and lose it the
moment they expand to another. Reputation Passport fixes this: sellers connect
their storefronts (Shopify first), we import and verify their sales, ratings,
reviews, and dispute history into one portable reputation profile — and
marketplaces query it through a paid REST API.

Every imported record and every score is Ed25519-signed and appended to a
hash-chained attestation log, so anyone can verify a passport offline against
our published public key. Tamper-evident without a blockchain.

## Quickstart

```bash
cp .env.example .env      # fill in local values
make up                   # Postgres 17 via docker compose
make migrate              # apply database migrations
make dev                  # passportd API + Next.js dev server
```

- API: http://localhost:8080 (`GET /healthz`)
- Web: http://localhost:3000

Requires Go 1.26+, Node 22+/pnpm, and Docker.

## Layout

| Path | What |
|---|---|
| `api/` | Go backend — the `passportd` binary (HTTP API + River workers) |
| `web/` | Next.js app — dashboard, public passport pages, badge embed, docs |
| `docs/` | Roadmap, product spec, ADRs, OpenAPI contract |
| `infra/` | Dockerfiles and deploy configs |

Working on this repo (human or agent)? Read **[AGENTS.md](AGENTS.md)** first.
Current phase and plan: **[docs/roadmap.md](docs/roadmap.md)**.

> The original Solana prototype is archived at the `legacy-solana` branch /
> `legacy-solana-final` tag. See `docs/adr/0001-pivot-from-solana.md`.
