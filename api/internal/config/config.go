// Package config loads passportd configuration from the environment
// (and, in dev, from a .env file at the repo root).
package config

import (
	"fmt"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Env         string // dev | test | prod
	APIAddr     string
	DatabaseURL string
}

func Load() (Config, error) {
	// Best-effort .env loading for local dev; real environments set env vars.
	// passportd runs from api/ (make dev) or repo root, so try both.
	_ = godotenv.Load("../.env", ".env")

	cfg := Config{
		Env:         getenv("APP_ENV", "dev"),
		APIAddr:     getenv("API_ADDR", ":8080"),
		DatabaseURL: getenv("DATABASE_URL", "postgres://passport:passport@localhost:5433/passport?sslmode=disable"),
	}
	switch cfg.Env {
	case "dev", "test", "prod":
	default:
		return Config{}, fmt.Errorf("invalid APP_ENV %q (want dev|test|prod)", cfg.Env)
	}
	return cfg, nil
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
