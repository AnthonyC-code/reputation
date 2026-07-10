// Package score computes a seller's reputation score from normalized
// reputation events. Pure functions only — no I/O, no clock reads (the
// caller passes now) — so results are deterministic and golden-testable.
//
// Score v1 components (weights sum to 100):
//
//	rating     40  recency-weighted Bayesian mean of normalized ratings
//	defect     25  Wilson lower bound (95%) of the non-defect order rate
//	volume     15  log-scaled trailing-12-month order count
//	recency    10  half-life decay on days since last sale
//	diversity   5  verified storefront connections (capped at 3)
//	tenure      5  years since first event (capped at 5)
//
// Confidence is reported separately, never blended into the score, so API
// consumers can apply their own evidence thresholds.
package score

import (
	"math"
	"time"
)

const Version = "v1.0"

type EventType string

const (
	EventSale         EventType = "sale"
	EventReview       EventType = "review"
	EventDispute      EventType = "dispute"
	EventRefund       EventType = "refund"
	EventCancellation EventType = "cancellation"
)

type TrustLevel string

const (
	TrustVerifiedAPI  TrustLevel = "verified_api"
	TrustSelfReported TrustLevel = "csv_self_reported"
)

// Event is one normalized reputation event. Rating fields are only read for
// EventReview; the native scale travels with the value so 1–5 stars and
// eBay-style -1/0/+1 normalize identically.
type Event struct {
	Type       EventType
	OccurredAt time.Time
	Trust      TrustLevel

	RatingValue float64
	RatingMin   float64
	RatingMax   float64
}

type Input struct {
	Events              []Event
	VerifiedConnections int
	Now                 time.Time
}

type Component struct {
	Key      string  `json:"key"`
	Weight   float64 `json:"weight"`
	Raw      float64 `json:"raw"`      // 0–1 before weighting
	Weighted float64 `json:"weighted"` // Raw * Weight
}

// Summary is the derived-input audit trail stored with every snapshot so old
// scores stay interpretable after formula changes.
//
// Trust rules baked into the inputs: the defect component sees only
// verified orders/disputes (self-reports can't evidence the absence of
// disputes), and self-reported sales count fractionally toward volume.
type Summary struct {
	Orders12moWeighted float64 `json:"orders_12mo_weighted"` // verified 1.0, self-reported 0.5
	VerifiedOrders24mo int     `json:"verified_orders_24mo"`
	Defects24mo        int     `json:"defects_24mo"` // verified only
	ReviewsTotal       int     `json:"reviews_total"`
	DaysSinceLastSale  int     `json:"days_since_last_sale"` // -1 when no sales
	TenureYears        float64 `json:"tenure_years"`
	EffectiveEvents    float64 `json:"effective_events"`
	AllSelfReported    bool    `json:"all_self_reported"`
}

type Result struct {
	ScoreVersion string      `json:"score_version"`
	Overall      float64     `json:"overall"` // 0–100, 2 decimals
	Grade        string      `json:"grade"`
	Confidence   float64     `json:"confidence"` // 0–1, 3 decimals
	Components   []Component `json:"components"`
	Inputs       Summary     `json:"inputs"`
}

// Tunables for score v1. Changing any of these requires bumping Version and
// an ADR (AGENTS.md §8).
const (
	ratingPriorWeight = 25.0  // pseudo-reviews pulling toward the prior
	ratingPriorMean   = 0.70  // ≈3.8/5 — slightly below typical platform means
	ratingHalfLifeDay = 365.0 // review weight half-life
	wilsonZ           = 1.96  // 95% confidence
	volumeSaturation  = 1000.0
	recencyHalfLife   = 90.0 // days since last sale
	confidencePivot   = 50.0 // n_eff at which confidence = 0.5
	selfReportedDisc  = 0.5  // confidence discount for self-reported events
)

func Compute(in Input) Result {
	s := summarize(in)

	comps := []Component{
		component("rating", 40, ratingQuality(in)),
		component("defect", 25, wilsonNonDefect(s.VerifiedOrders24mo, s.Defects24mo)),
		component("volume", 15, volumeScore(s.Orders12moWeighted)),
		component("recency", 10, recencyScore(s.DaysSinceLastSale)),
		component("diversity", 5, math.Min(float64(in.VerifiedConnections), 3)/3),
		component("tenure", 5, math.Min(s.TenureYears, 5)/5),
	}

	overall := 0.0
	for _, c := range comps {
		overall += c.Weighted
	}
	overall = round2(math.Min(overall, 100))

	grade := gradeFor(overall)
	if s.AllSelfReported && gradeRank(grade) > gradeRank("B") {
		// Self-reported-only history can't earn a top grade (AGENTS.md §6).
		grade = "B"
	}

	return Result{
		ScoreVersion: Version,
		Overall:      overall,
		Grade:        grade,
		Confidence:   round3(s.EffectiveEvents / (s.EffectiveEvents + confidencePivot)),
		Components:   comps,
		Inputs:       s,
	}
}

func summarize(in Input) Summary {
	s := Summary{DaysSinceLastSale: -1, AllSelfReported: len(in.Events) > 0}
	var first time.Time
	var lastSale time.Time

	for _, e := range in.Events {
		if e.OccurredAt.After(in.Now) {
			continue // ignore clock-skewed future events
		}
		if first.IsZero() || e.OccurredAt.Before(first) {
			first = e.OccurredAt
		}
		if e.Trust != TrustSelfReported {
			s.AllSelfReported = false
		}
		age := in.Now.Sub(e.OccurredAt)
		weight := halfLife(age.Hours()/24, ratingHalfLifeDay)
		if e.Trust == TrustSelfReported {
			weight *= selfReportedDisc
		}
		s.EffectiveEvents += weight

		switch e.Type {
		case EventSale:
			if e.OccurredAt.After(lastSale) {
				lastSale = e.OccurredAt
			}
			if age <= 365*24*time.Hour {
				if e.Trust == TrustSelfReported {
					s.Orders12moWeighted += selfReportedDisc
				} else {
					s.Orders12moWeighted++
				}
			}
			if age <= 2*365*24*time.Hour && e.Trust != TrustSelfReported {
				s.VerifiedOrders24mo++
			}
		case EventReview:
			s.ReviewsTotal++
		case EventDispute, EventCancellation:
			// Only verified defects count — mirroring the defect component,
			// which sees only verified orders.
			if age <= 2*365*24*time.Hour && e.Trust != TrustSelfReported {
				s.Defects24mo++
			}
		}
	}

	if !lastSale.IsZero() {
		s.DaysSinceLastSale = int(in.Now.Sub(lastSale).Hours() / 24)
	}
	if !first.IsZero() {
		s.TenureYears = in.Now.Sub(first).Hours() / 24 / 365
	}
	return s
}

// ratingQuality is the recency-weighted Bayesian mean of normalized ratings:
// R = (Σ w_i·u_i + m·C) / (Σ w_i + m). The prior means five 5-star reviews
// score ~0.75, not 1.0 — small samples can't impersonate large ones.
func ratingQuality(in Input) float64 {
	num := ratingPriorWeight * ratingPriorMean
	den := ratingPriorWeight
	any := false
	for _, e := range in.Events {
		if e.Type != EventReview || e.RatingMax <= e.RatingMin || e.OccurredAt.After(in.Now) {
			continue
		}
		any = true
		u := (e.RatingValue - e.RatingMin) / (e.RatingMax - e.RatingMin)
		u = math.Max(0, math.Min(1, u))
		w := halfLife(in.Now.Sub(e.OccurredAt).Hours()/24, ratingHalfLifeDay)
		if e.Trust == TrustSelfReported {
			w *= selfReportedDisc
		}
		num += w * u
		den += w
	}
	if !any {
		return 0 // the prior shrinks evidence; it never substitutes for it
	}
	return num / den
}

// wilsonNonDefect returns the 95% Wilson lower bound of the non-defect
// proportion. It handles small n honestly: 0 defects in 10 orders scores
// lower than 2 defects in 5,000.
func wilsonNonDefect(orders, defects int) float64 {
	if orders <= 0 {
		return 0
	}
	n := float64(orders)
	p := float64(orders-defects) / n
	z := wilsonZ
	z2 := z * z
	center := p + z2/(2*n)
	margin := z * math.Sqrt(p*(1-p)/n+z2/(4*n*n))
	return math.Max(0, (center-margin)/(1+z2/n))
}

func volumeScore(orders12moWeighted float64) float64 {
	if orders12moWeighted <= 0 {
		return 0
	}
	return math.Min(1, math.Log10(1+orders12moWeighted)/math.Log10(1+volumeSaturation))
}

func recencyScore(daysSinceLastSale int) float64 {
	if daysSinceLastSale < 0 {
		return 0
	}
	return halfLife(float64(daysSinceLastSale), recencyHalfLife)
}

func halfLife(age, halfLifeAt float64) float64 {
	if age < 0 {
		age = 0
	}
	return math.Exp(-math.Ln2 * age / halfLifeAt)
}

func gradeFor(overall float64) string {
	switch {
	case overall >= 90:
		return "A+"
	case overall >= 80:
		return "A"
	case overall >= 65:
		return "B"
	case overall >= 50:
		return "C"
	default:
		return "D"
	}
}

func gradeRank(g string) int {
	switch g {
	case "A+":
		return 4
	case "A":
		return 3
	case "B":
		return 2
	case "C":
		return 1
	default:
		return 0
	}
}

func component(key string, weight, raw float64) Component {
	raw = math.Max(0, math.Min(1, raw))
	return Component{Key: key, Weight: weight, Raw: round4(raw), Weighted: round2(raw * weight)}
}

func round2(v float64) float64 { return math.Round(v*100) / 100 }
func round3(v float64) float64 { return math.Round(v*1000) / 1000 }
func round4(v float64) float64 { return math.Round(v*10000) / 10000 }
