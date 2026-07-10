// Package attest implements the tamper-evidence core: Ed25519 signatures
// over JCS-canonicalized (RFC 8785) JSON payloads, a hash chain for the
// append-only attestation log, and JWKS publication of verification keys.
//
// The signed message is domain-separated so signatures can never be confused
// with any other protocol:
//
//	msg = "reputation-passport:attestation:v1" || sha256(jcs(payload))
//	sig = Ed25519_Sign(sk, msg)
//
// Anyone can verify offline with only the published public key.
package attest

import (
	"crypto/ed25519"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"

	"github.com/gowebpki/jcs"
)

const domain = "reputation-passport:attestation:v1"

// Attestation is a signed, canonicalized payload ready for storage or for
// embedding in an API response.
type Attestation struct {
	KID         string          `json:"kid"`
	Payload     json.RawMessage `json:"payload"`      // JCS canonical form
	PayloadHash []byte          `json:"payload_hash"` // sha256 of Payload
	Signature   []byte          `json:"signature"`
}

type Signer struct {
	priv ed25519.PrivateKey
	kid  string
}

func NewSigner(priv ed25519.PrivateKey, kid string) (*Signer, error) {
	if len(priv) != ed25519.PrivateKeySize {
		return nil, fmt.Errorf("invalid ed25519 private key length %d", len(priv))
	}
	if kid == "" {
		return nil, fmt.Errorf("kid must not be empty")
	}
	return &Signer{priv: priv, kid: kid}, nil
}

// Sign canonicalizes payload (any JSON-marshalable value) and signs it.
func (s *Signer) Sign(payload any) (Attestation, error) {
	raw, err := json.Marshal(payload)
	if err != nil {
		return Attestation{}, fmt.Errorf("marshaling payload: %w", err)
	}
	canonical, err := jcs.Transform(raw)
	if err != nil {
		return Attestation{}, fmt.Errorf("canonicalizing payload: %w", err)
	}
	hash := sha256.Sum256(canonical)
	sig := ed25519.Sign(s.priv, signedMessage(hash[:]))
	return Attestation{
		KID:         s.kid,
		Payload:     canonical,
		PayloadHash: hash[:],
		Signature:   sig,
	}, nil
}

// Verify checks an attestation against a public key. The payload is
// re-canonicalized so verification succeeds on any JSON-equivalent encoding
// of the payload, exactly as an external verifier would do it.
func Verify(pub ed25519.PublicKey, payload []byte, signature []byte) bool {
	canonical, err := jcs.Transform(payload)
	if err != nil {
		return false
	}
	hash := sha256.Sum256(canonical)
	return ed25519.Verify(pub, signedMessage(hash[:]), signature)
}

func signedMessage(payloadHash []byte) []byte {
	return append([]byte(domain), payloadHash...)
}

// ChainHash computes the append-only log link:
// chain_n = sha256(chain_{n-1} || payload_hash_n). Pass nil for the genesis
// entry.
func ChainHash(prev, payloadHash []byte) []byte {
	h := sha256.New()
	h.Write(prev)
	h.Write(payloadHash)
	return h.Sum(nil)
}

// JWK is an OKP/Ed25519 JSON Web Key (RFC 8037) for the JWKS endpoint.
type JWK struct {
	Kty string `json:"kty"`
	Crv string `json:"crv"`
	X   string `json:"x"`
	Kid string `json:"kid"`
	Alg string `json:"alg"`
	Use string `json:"use"`
}

type JWKS struct {
	Keys []JWK `json:"keys"`
}

func PublicKeyJWK(pub ed25519.PublicKey, kid string) JWK {
	return JWK{
		Kty: "OKP",
		Crv: "Ed25519",
		X:   base64.RawURLEncoding.EncodeToString(pub),
		Kid: kid,
		Alg: "EdDSA",
		Use: "sig",
	}
}

// PublicKeyFromJWK reverses PublicKeyJWK — used by the reference verifier
// and tests to prove round-tripping through the published JWKS works.
func PublicKeyFromJWK(k JWK) (ed25519.PublicKey, error) {
	if k.Kty != "OKP" || k.Crv != "Ed25519" {
		return nil, fmt.Errorf("unsupported key type %s/%s", k.Kty, k.Crv)
	}
	b, err := base64.RawURLEncoding.DecodeString(k.X)
	if err != nil {
		return nil, fmt.Errorf("decoding x: %w", err)
	}
	if len(b) != ed25519.PublicKeySize {
		return nil, fmt.Errorf("invalid public key length %d", len(b))
	}
	return ed25519.PublicKey(b), nil
}
