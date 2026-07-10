package httpapi

import (
	"crypto/ed25519"
	"crypto/rand"

	"encoding/json"
	"github.com/AnthonyC-code/reputation/api/internal/attest"
	"log/slog"
	"net/http/httptest"
	"testing"
)

func TestHealthz(t *testing.T) {
	srv := New(nil, slog.New(slog.DiscardHandler), Options{})

	req := httptest.NewRequest("GET", "/healthz", nil)
	rec := httptest.NewRecorder()
	srv.ServeHTTP(rec, req)

	if rec.Code != 200 {
		t.Fatalf("healthz status = %d, want 200", rec.Code)
	}
	var body map[string]string
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("healthz body not JSON: %v", err)
	}
	if body["status"] != "ok" {
		t.Errorf("status = %q, want ok", body["status"])
	}
	if body["db"] != "unavailable" {
		t.Errorf("db = %q, want unavailable (no pool passed)", body["db"])
	}
}

func TestJWKSServedWhenConfigured(t *testing.T) {
	pub, _, err := ed25519.GenerateKey(rand.Reader)
	if err != nil {
		t.Fatal(err)
	}
	jwks := &attest.JWKS{Keys: []attest.JWK{attest.PublicKeyJWK(pub, "test-k1")}}
	srv := New(nil, slog.New(slog.DiscardHandler), Options{JWKS: jwks})

	rec := httptest.NewRecorder()
	srv.ServeHTTP(rec, httptest.NewRequest("GET", "/.well-known/jwks.json", nil))
	if rec.Code != 200 {
		t.Fatalf("jwks status = %d, want 200", rec.Code)
	}
	var got attest.JWKS
	if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
		t.Fatal(err)
	}
	if len(got.Keys) != 1 || got.Keys[0].Kid != "test-k1" || got.Keys[0].Kty != "OKP" {
		t.Errorf("unexpected jwks: %+v", got)
	}

	// Without a key configured, the endpoint must not exist.
	bare := New(nil, slog.New(slog.DiscardHandler), Options{})
	rec2 := httptest.NewRecorder()
	bare.ServeHTTP(rec2, httptest.NewRequest("GET", "/.well-known/jwks.json", nil))
	if rec2.Code != 404 {
		t.Errorf("unconfigured jwks status = %d, want 404", rec2.Code)
	}
}
