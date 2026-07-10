-- +goose Up
-- Bootstrap migration: proves the goose + sqlc pipeline end to end.
-- The full domain schema (sellers, passports, raw_documents, ...) lands in
-- Phase 1 as separate migrations.
CREATE TABLE meta (
    key   text PRIMARY KEY,
    value text NOT NULL
);

INSERT INTO meta (key, value) VALUES ('schema_bootstrap', 'phase-0');

-- +goose Down
DROP TABLE meta;
