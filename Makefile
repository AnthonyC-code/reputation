.PHONY: up down dev dev-api dev-web migrate migrate-new sqlc test test-go test-web lint lint-go lint-web build

# ---- infrastructure ----

up: ## start local Postgres
	docker compose up -d db

down:
	docker compose down

# ---- dev ----

dev: ## run API + web together (Ctrl-C stops both)
	$(MAKE) -j2 dev-api dev-web

dev-api:
	cd api && go run ./cmd/passportd serve

dev-web:
	cd web && pnpm dev

# ---- database ----

migrate: ## apply migrations to DATABASE_URL
	cd api && go run ./cmd/passportd migrate

migrate-new: ## create a migration: make migrate-new NAME=add_foo
	@test -n "$(NAME)" || (echo "usage: make migrate-new NAME=add_foo" && exit 1)
	@n=$$(printf '%05d' $$(($$(ls api/migrations/*.sql | wc -l) + 1))); \
	f="api/migrations/$${n}_$(NAME).sql"; \
	printf -- '-- +goose Up\n\n-- +goose Down\n' > $$f; \
	echo "created $$f"

sqlc: ## regenerate internal/store from queries/*.sql
	cd api && go tool sqlc generate

demo-data: ## regenerate web/lib/demo-passport.json via the real score engine
	cd api && go run ./cmd/demodata

# ---- quality ----

test: test-go test-web

test-go:
	cd api && go test ./...

test-web:
	cd web && pnpm typecheck && pnpm lint

lint: lint-go lint-web

lint-go:
	cd api && go vet ./...
	@if command -v golangci-lint >/dev/null 2>&1; then cd api && golangci-lint run; else echo "golangci-lint not installed; ran go vet only"; fi

lint-web:
	cd web && pnpm lint && pnpm typecheck

build:
	cd api && go build ./...
	cd web && pnpm build

openapi-sync: ## copy the canonical spec to the web app's public dir
	cp docs/api/openapi.yaml web/public/openapi.yaml
