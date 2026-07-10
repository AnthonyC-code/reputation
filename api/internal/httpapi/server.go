// Package httpapi assembles the passportd HTTP surface: the platform query
// API (/v1), the seller dashboard API (/api), OAuth callbacks, and
// well-known endpoints. Handlers stay thin — decode, validate, call a domain
// package, encode.
package httpapi

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"time"

	"github.com/AnthonyC-code/reputation/api/internal/attest"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Options carries optional server dependencies; zero value is valid for a
// bare skeleton (dev without a database or signing key).
type Options struct {
	// JWKS is served at /.well-known/jwks.json when non-nil.
	JWKS *attest.JWKS
}

func New(pool *pgxpool.Pool, logger *slog.Logger, opts Options) http.Handler {
	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(requestLogger(logger))
	r.Use(middleware.Recoverer)

	r.Get("/healthz", healthz(pool))

	if opts.JWKS != nil {
		r.Get("/.well-known/jwks.json", func(w http.ResponseWriter, _ *http.Request) {
			w.Header().Set("Cache-Control", "public, max-age=3600")
			writeJSON(w, http.StatusOK, opts.JWKS)
		})
	}

	// Mounted in later phases:
	//   /v1        platform query API (API-key auth)      — Phase 5
	//   /api       seller dashboard API (Clerk JWT auth)  — Phase 1
	//   /connect   storefront OAuth flows                 — Phase 2

	return r
}

func healthz(pool *pgxpool.Pool) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		db := "unavailable"
		if pool != nil {
			ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
			defer cancel()
			if err := pool.Ping(ctx); err == nil {
				db = "ok"
			}
		}
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok", "db": db})
	}
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func requestLogger(logger *slog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()
			ww := middleware.NewWrapResponseWriter(w, r.ProtoMajor)
			next.ServeHTTP(ww, r)
			logger.Info("http",
				"method", r.Method,
				"path", r.URL.Path,
				"status", ww.Status(),
				"dur_ms", time.Since(start).Milliseconds(),
				"request_id", middleware.GetReqID(r.Context()),
			)
		})
	}
}
