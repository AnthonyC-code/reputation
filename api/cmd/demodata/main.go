// demodata generates the sample passport JSON that powers the public /p/demo
// page. The sample seller is fictional and labeled as such everywhere, but
// the score is computed by the real scoring engine (internal/score) so the
// demo shows genuine product output, not marketing numbers.
//
// Deterministic by construction: fixed reference date, no randomness.
// Regenerate with `make demo-data` after changing the engine.
package main

import (
	"crypto/ed25519"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"time"

	"github.com/AnthonyC-code/reputation/api/internal/attest"
	"github.com/AnthonyC-code/reputation/api/internal/score"
)

// refNow is the fixed "as of" date for the sample; bump when regenerating.
var refNow = time.Date(2026, 7, 1, 0, 0, 0, 0, time.UTC)

type source struct {
	Platform string `json:"platform"`
	Kind     string `json:"kind"`
	Status   string `json:"status"` // "verified_api" | "csv_self_reported" | "in_progress" | "planned"
	Count    int    `json:"count"`
	Detail   string `json:"detail"`
}

type demoPassport struct {
	Sample      bool   `json:"sample"`
	GeneratedBy string `json:"generated_by"`
	AsOf        string `json:"as_of"`

	Seller struct {
		Name        string `json:"name"`
		Slug        string `json:"slug"`
		Location    string `json:"location"`
		MemberSince string `json:"member_since"`
		Tagline     string `json:"tagline"`
		Website     string `json:"website"`
	} `json:"seller"`

	Score score.Result `json:"score"`

	Stats struct {
		Orders    int     `json:"orders"`
		Reviews   int     `json:"reviews"`
		AvgRating float64 `json:"avg_rating"`
		Disputes  int     `json:"disputes"`
	} `json:"stats"`

	Sources []source `json:"sources"`

	// A genuinely verifiable signature over the score payload, produced by
	// internal/attest with an ephemeral demo key (generated at build time,
	// never persisted — real passports use the production signing key).
	Attestation struct {
		KID       string          `json:"kid"`
		Payload   json.RawMessage `json:"payload"` // JCS canonical form
		Signature string          `json:"signature_b64"`
		PublicKey attest.JWK      `json:"public_key_jwk"`
		Note      string          `json:"note"`
	} `json:"attestation"`
}

func main() {
	out := flag.String("out", "../web/lib/demo-passport.json", "output path")
	flag.Parse()

	in := score.Input{Now: refNow, VerifiedConnections: 2}

	// ~4 years of steady, growing sales: 3 orders every 2 days.
	orders := 0
	for d := 1; d <= 1420; d++ {
		n := 1
		if d%2 == 0 {
			n = 2
		}
		for range n {
			in.Events = append(in.Events, score.Event{
				Type: score.EventSale, OccurredAt: refNow.AddDate(0, 0, -d), Trust: score.TrustVerifiedAPI,
			})
			orders++
		}
	}

	// Reviews: one per ~5 orders, 4.9★ average (1 four-star in 10).
	reviews, fiveStars := 0, 0
	for d := 2; d <= 1420; d += 3 {
		stars := 5.0
		if reviews%10 == 9 {
			stars = 4
		} else {
			fiveStars++
		}
		in.Events = append(in.Events, score.Event{
			Type: score.EventReview, OccurredAt: refNow.AddDate(0, 0, -d), Trust: score.TrustVerifiedAPI,
			RatingValue: stars, RatingMin: 1, RatingMax: 5,
		})
		reviews++
	}

	// A realistic, small number of disputes across the history.
	for _, d := range []int{95, 260, 470, 610, 880, 1130} {
		in.Events = append(in.Events, score.Event{
			Type: score.EventDispute, OccurredAt: refNow.AddDate(0, 0, -d), Trust: score.TrustVerifiedAPI,
		})
	}

	var p demoPassport
	p.Sample = true
	p.GeneratedBy = "reputation score engine " + score.Version + " (api/internal/score)"
	p.AsOf = refNow.Format("2006-01-02")
	p.Seller.Name = "Wildflower Candle Co."
	p.Seller.Slug = "demo"
	p.Seller.Location = "Austin, TX"
	p.Seller.MemberSince = refNow.AddDate(0, 0, -1420).Format("January 2006")
	p.Seller.Tagline = "Hand-poured soy candles, shipped nationwide"
	p.Seller.Website = "https://example.com/wildflower-candle-co"
	p.Score = score.Compute(in)
	p.Stats.Orders = orders
	p.Stats.Reviews = reviews
	p.Stats.AvgRating = float64(int((float64(fiveStars*5+(reviews-fiveStars)*4)/float64(reviews))*10+0.5)) / 10
	p.Stats.Disputes = 6
	p.Sources = []source{
		{Platform: "Shopify", Kind: "Orders & disputes", Status: "verified_api", Count: orders,
			Detail: "Imported read-only via the official Shopify Admin API"},
		{Platform: "Judge.me", Kind: "Product reviews", Status: "verified_api", Count: reviews,
			Detail: "Review history imported via the official Judge.me API"},
	}

	if err := signDemo(&p); err != nil {
		fmt.Fprintln(os.Stderr, "signing demo attestation:", err)
		os.Exit(1)
	}

	buf, err := json.MarshalIndent(p, "", "  ")
	if err != nil {
		fmt.Fprintln(os.Stderr, "marshal:", err)
		os.Exit(1)
	}
	if err := os.WriteFile(*out, append(buf, '\n'), 0o644); err != nil {
		fmt.Fprintln(os.Stderr, "write:", err)
		os.Exit(1)
	}
	fmt.Printf("wrote %s — score %.2f (%s), confidence %.3f\n", *out, p.Score.Overall, p.Score.Grade, p.Score.Confidence)
}

func signDemo(p *demoPassport) error {
	pub, priv, err := ed25519.GenerateKey(rand.Reader)
	if err != nil {
		return err
	}
	const kid = "demo-ephemeral"
	signer, err := attest.NewSigner(priv, kid)
	if err != nil {
		return err
	}
	att, err := signer.Sign(map[string]any{
		"type":          "score.snapshot",
		"version":       1,
		"passport_slug": p.Seller.Slug,
		"as_of":         p.AsOf,
		"score":         p.Score,
	})
	if err != nil {
		return err
	}
	p.Attestation.KID = kid
	p.Attestation.Payload = att.Payload
	p.Attestation.Signature = base64.StdEncoding.EncodeToString(att.Signature)
	p.Attestation.PublicKey = attest.PublicKeyJWK(pub, kid)
	p.Attestation.Note = "Demo key generated at build time and discarded. Live passports are signed with the production key published at /.well-known/jwks.json."
	return nil
}
