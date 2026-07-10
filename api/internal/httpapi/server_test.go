package httpapi

import (
	"encoding/json"
	"log/slog"
	"net/http/httptest"
	"testing"
)

func TestHealthz(t *testing.T) {
	srv := New(nil, slog.New(slog.DiscardHandler))

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
