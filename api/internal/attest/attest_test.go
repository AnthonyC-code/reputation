package attest

import (
	"bytes"
	"crypto/ed25519"
	"crypto/rand"
	"encoding/json"
	"testing"
)

func newTestSigner(t *testing.T) (*Signer, ed25519.PublicKey) {
	t.Helper()
	pub, priv, err := ed25519.GenerateKey(rand.Reader)
	if err != nil {
		t.Fatal(err)
	}
	s, err := NewSigner(priv, "test-k1")
	if err != nil {
		t.Fatal(err)
	}
	return s, pub
}

func TestSignVerifyRoundTrip(t *testing.T) {
	s, pub := newTestSigner(t)
	att, err := s.Sign(map[string]any{"type": "score.snapshot", "overall": 93.16, "grade": "A+"})
	if err != nil {
		t.Fatal(err)
	}
	if !Verify(pub, att.Payload, att.Signature) {
		t.Fatal("valid attestation failed verification")
	}
}

func TestTamperedPayloadFails(t *testing.T) {
	s, pub := newTestSigner(t)
	att, err := s.Sign(map[string]any{"overall": 93.16})
	if err != nil {
		t.Fatal(err)
	}
	tampered := bytes.Replace(att.Payload, []byte("93.16"), []byte("99.99"), 1)
	if Verify(pub, tampered, att.Signature) {
		t.Fatal("tampered payload verified — tamper-evidence is broken")
	}
}

func TestWrongKeyFails(t *testing.T) {
	s, _ := newTestSigner(t)
	_, otherPub := newTestSigner(t)
	att, err := s.Sign(map[string]any{"a": 1})
	if err != nil {
		t.Fatal(err)
	}
	if Verify(otherPub, att.Payload, att.Signature) {
		t.Fatal("attestation verified under the wrong key")
	}
}

// Verification must not depend on JSON key order or whitespace — an external
// verifier re-encoding the payload still verifies, per RFC 8785.
func TestCanonicalizationIndependence(t *testing.T) {
	s, pub := newTestSigner(t)
	att, err := s.Sign(map[string]any{"b": 2, "a": 1})
	if err != nil {
		t.Fatal(err)
	}
	reordered := []byte("{\n  \"b\": 2,\n  \"a\": 1\n}")
	if !Verify(pub, reordered, att.Signature) {
		t.Fatal("JSON-equivalent payload failed verification")
	}
}

func TestChainHashContinuity(t *testing.T) {
	s, _ := newTestSigner(t)
	a1, _ := s.Sign(map[string]any{"n": 1})
	a2, _ := s.Sign(map[string]any{"n": 2})

	c1 := ChainHash(nil, a1.PayloadHash)
	c2 := ChainHash(c1, a2.PayloadHash)

	if bytes.Equal(c1, c2) {
		t.Fatal("chain hashes must differ per entry")
	}
	// Recomputing the chain from the log must reproduce it exactly.
	if !bytes.Equal(ChainHash(ChainHash(nil, a1.PayloadHash), a2.PayloadHash), c2) {
		t.Fatal("chain is not reproducible from the log")
	}
	// Altering an earlier entry breaks every later link.
	forged := ChainHash(ChainHash(nil, a2.PayloadHash), a2.PayloadHash)
	if bytes.Equal(forged, c2) {
		t.Fatal("altered history produced the same chain head")
	}
}

func TestJWKSRoundTrip(t *testing.T) {
	s, pub := newTestSigner(t)
	jwk := PublicKeyJWK(pub, "test-k1")
	if jwk.Kty != "OKP" || jwk.Crv != "Ed25519" || jwk.Alg != "EdDSA" {
		t.Fatalf("unexpected JWK shape: %+v", jwk)
	}

	// Serialize like the /.well-known endpoint would, parse like a verifier
	// would, and verify a real signature with the recovered key.
	buf, err := json.Marshal(JWKS{Keys: []JWK{jwk}})
	if err != nil {
		t.Fatal(err)
	}
	var parsed JWKS
	if err := json.Unmarshal(buf, &parsed); err != nil {
		t.Fatal(err)
	}
	recovered, err := PublicKeyFromJWK(parsed.Keys[0])
	if err != nil {
		t.Fatal(err)
	}
	att, err := s.Sign(map[string]any{"via": "jwks"})
	if err != nil {
		t.Fatal(err)
	}
	if !Verify(recovered, att.Payload, att.Signature) {
		t.Fatal("signature failed verification with JWKS-recovered key")
	}
}
