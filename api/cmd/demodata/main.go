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
	"path/filepath"
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

type historyPoint struct {
	AsOf    string  `json:"as_of"` // "2026-07"
	Overall float64 `json:"overall"`
	Grade   string  `json:"grade"`
}

// scoreExample is a worked profile for /docs/score: fixed synthetic inputs,
// output computed by the real engine. Clearly labeled sample data.
type scoreExample struct {
	Key     string       `json:"key"`
	Title   string       `json:"title"`
	Profile string       `json:"profile"` // human summary of the inputs
	Result  score.Result `json:"result"`

	// For the dispute-spike example: the same seller scored at an earlier
	// date, while the disputes were still inside the 24-month window.
	ThenAsOf string        `json:"then_as_of,omitempty"`
	Then     *score.Result `json:"then,omitempty"`
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

	// Monthly score checkpoints computed by re-running the engine over the
	// same event history with an earlier "now" — a real time series, not an
	// illustration.
	History []historyPoint `json:"history"`

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
	jwksOut := flag.String("jwks-out", "../web/public/.well-known/demo-jwks.json", "demo JWKS output path")
	examplesOut := flag.String("examples-out", "../web/lib/score-examples.json", "worked score examples output path")
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
	// .example TLD (RFC 2606) — deliberately unresolvable; the page renders
	// it as plain text for the sample rather than a clickable dead link.
	p.Seller.Website = "https://wildflower-candle.example"
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

	// Trailing-24-month monthly checkpoints: same events, earlier "now"
	// (the engine ignores events after its reference date).
	for i := 23; i >= 0; i-- {
		at := refNow.AddDate(0, -i, 0)
		r := score.Compute(score.Input{Events: in.Events, VerifiedConnections: in.VerifiedConnections, Now: at})
		p.History = append(p.History, historyPoint{
			AsOf: at.Format("2006-01"), Overall: r.Overall, Grade: r.Grade,
		})
	}

	if err := writeExamples(*examplesOut); err != nil {
		fmt.Fprintln(os.Stderr, "writing score examples:", err)
		os.Exit(1)
	}

	if err := signDemo(&p); err != nil {
		fmt.Fprintln(os.Stderr, "signing demo attestation:", err)
		os.Exit(1)
	}

	// Publish the demo verification key at a well-known URL, separate from
	// the attestation itself, so verifiers pin the key by kid instead of
	// trusting key material shipped alongside the signature.
	if err := writeJWKS(*jwksOut, p.Attestation.PublicKey); err != nil {
		fmt.Fprintln(os.Stderr, "writing demo jwks:", err)
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

func sale(daysAgo int) score.Event {
	return score.Event{Type: score.EventSale, OccurredAt: refNow.AddDate(0, 0, -daysAgo), Trust: score.TrustVerifiedAPI}
}

func review(daysAgo int, stars float64) score.Event {
	return score.Event{
		Type: score.EventReview, OccurredAt: refNow.AddDate(0, 0, -daysAgo), Trust: score.TrustVerifiedAPI,
		RatingValue: stars, RatingMin: 1, RatingMax: 5,
	}
}

func dispute(daysAgo int) score.Event {
	return score.Event{Type: score.EventDispute, OccurredAt: refNow.AddDate(0, 0, -daysAgo), Trust: score.TrustVerifiedAPI}
}

// writeExamples emits the three worked profiles rendered on /docs/score.
// Inputs are fixed and synthetic; every output number comes from
// score.Compute — the docs can't drift from the engine.
func writeExamples(path string) error {
	var examples []scoreExample

	// (i) A new seller: seven months in, one storefront, a sale every other
	// day, ~30 reviews, no disputes.
	{
		var in score.Input
		in.Now = refNow
		in.VerifiedConnections = 1
		orders, reviews, fours := 0, 0, 0
		for d := 1; d <= 210; d += 2 {
			in.Events = append(in.Events, sale(d))
			orders++
		}
		for d := 4; d <= 210; d += 7 {
			stars := 5.0
			if reviews%10 == 9 {
				stars = 4
				fours++
			}
			in.Events = append(in.Events, review(d, stars))
			reviews++
		}
		avg := float64(reviews*5-fours) / float64(reviews)
		examples = append(examples, scoreExample{
			Key:   "new_seller",
			Title: "Seven months in",
			Profile: fmt.Sprintf(
				"%d verified orders over 7 months, %d reviews averaging %.1f/5, no disputes, one connected storefront.",
				orders, reviews, avg),
			Result: score.Compute(in),
		})
	}

	// (ii) An established seller who had a two-week dispute cluster ~25
	// months ago. Scored twice: 13 months ago (cluster inside the 24-month
	// defect window) and today (aged out).
	{
		var in score.Input
		in.VerifiedConnections = 2
		orders, reviews, fours := 0, 0, 0
		for d := 1; d <= 1277; d += 3 {
			in.Events = append(in.Events, sale(d))
			orders++
		}
		for d := 2; d <= 1277; d += 9 {
			stars := 5.0
			if reviews%10 == 9 {
				stars = 4
				fours++
			}
			in.Events = append(in.Events, review(d, stars))
			reviews++
		}
		for _, d := range []int{745, 752, 760, 768, 775} {
			in.Events = append(in.Events, dispute(d))
		}
		then := refNow.AddDate(0, -13, 0)
		in.Now = then
		thenResult := score.Compute(in)
		in.Now = refNow
		avg := float64(reviews*5-fours) / float64(reviews)
		examples = append(examples, scoreExample{
			Key:   "dispute_spike",
			Title: "A bad two weeks, two years ago",
			Profile: fmt.Sprintf(
				"%d verified orders over 3.5 years, %d reviews averaging %.1f/5, five disputes clustered ~25 months ago, two connected storefronts.",
				orders, reviews, avg),
			Result:   score.Compute(in),
			ThenAsOf: then.Format("January 2006"),
			Then:     &thenResult,
		})
	}

	// (iii) A strong single-storefront seller: diversity is the only
	// component they can't max out.
	{
		var in score.Input
		in.Now = refNow
		in.VerifiedConnections = 1
		orders, reviews, fours := 0, 0, 0
		for d := 1; d <= 1095; d++ {
			in.Events = append(in.Events, sale(d))
			if d%2 == 0 {
				in.Events = append(in.Events, sale(d))
				orders++
			}
			orders++
		}
		for d := 5; d <= 1095; d += 5 {
			stars := 5.0
			if reviews%10 == 9 {
				stars = 4
				fours++
			}
			in.Events = append(in.Events, review(d, stars))
			reviews++
		}
		in.Events = append(in.Events, dispute(200), dispute(500))
		avg := float64(reviews*5-fours) / float64(reviews)
		examples = append(examples, scoreExample{
			Key:   "single_storefront",
			Title: "Shopify-only, three years strong",
			Profile: fmt.Sprintf(
				"%d verified orders over 3 years, %d reviews averaging %.1f/5, two disputes, one connected storefront.",
				orders, reviews, avg),
			Result: score.Compute(in),
		})
	}

	buf, err := json.MarshalIndent(struct {
		Sample      bool           `json:"sample"`
		GeneratedBy string         `json:"generated_by"`
		AsOf        string         `json:"as_of"`
		Examples    []scoreExample `json:"examples"`
	}{true, "reputation score engine " + score.Version + " (api/internal/score)", refNow.Format("2006-01-02"), examples}, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, append(buf, '\n'), 0o644)
}

func writeJWKS(path string, jwk attest.JWK) error {
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return err
	}
	buf, err := json.MarshalIndent(attest.JWKS{Keys: []attest.JWK{jwk}}, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, append(buf, '\n'), 0o644)
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
	// The payload covers everything the passport page and badge assert:
	// score, headline stats, and the source list — not just the score.
	att, err := signer.Sign(map[string]any{
		"type":          "score.snapshot",
		"version":       1,
		"passport_slug": p.Seller.Slug,
		"display_name":  p.Seller.Name,
		"as_of":         p.AsOf,
		"score":         p.Score,
		"stats":         p.Stats,
		"sources":       p.Sources,
	})
	if err != nil {
		return err
	}
	p.Attestation.KID = kid
	p.Attestation.Payload = att.Payload
	p.Attestation.Signature = base64.StdEncoding.EncodeToString(att.Signature)
	p.Attestation.PublicKey = attest.PublicKeyJWK(pub, kid)
	p.Attestation.Note = "Demo key generated at build time and discarded; its public half is published at /.well-known/demo-jwks.json — fetch it from there (pin by kid) rather than trusting the copy in this file. Live passports are signed with the production key at /.well-known/jwks.json."
	return nil
}
