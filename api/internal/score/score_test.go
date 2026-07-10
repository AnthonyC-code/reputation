package score

import (
	"math"
	"testing"
	"time"
)

var now = time.Date(2026, 7, 1, 0, 0, 0, 0, time.UTC)

func daysAgo(d int) time.Time { return now.AddDate(0, 0, -d) }

func review(stars float64, ageDays int, trust TrustLevel) Event {
	return Event{Type: EventReview, OccurredAt: daysAgo(ageDays), Trust: trust,
		RatingValue: stars, RatingMin: 1, RatingMax: 5}
}

func sale(ageDays int, trust TrustLevel) Event {
	return Event{Type: EventSale, OccurredAt: daysAgo(ageDays), Trust: trust}
}

func dispute(ageDays int) Event {
	return Event{Type: EventDispute, OccurredAt: daysAgo(ageDays), Trust: TrustVerifiedAPI}
}

func approx(t *testing.T, name string, got, want, tol float64) {
	t.Helper()
	if math.Abs(got-want) > tol {
		t.Errorf("%s = %v, want %v (±%v)", name, got, want, tol)
	}
}

func comp(t *testing.T, r Result, key string) Component {
	t.Helper()
	for _, c := range r.Components {
		if c.Key == key {
			return c
		}
	}
	t.Fatalf("component %q missing", key)
	return Component{}
}

// Five fresh 5-star reviews must NOT look like a perfect record: the
// Bayesian prior (m=25, C=0.70) pins the raw rating near 0.75.
func TestFiveReviewsAreNotFiveThousand(t *testing.T) {
	small := Input{Now: now}
	for range 5 {
		small.Events = append(small.Events, review(5, 1, TrustVerifiedAPI))
	}
	big := Input{Now: now}
	for range 5000 {
		big.Events = append(big.Events, review(5, 1, TrustVerifiedAPI))
	}

	smallRating := comp(t, Compute(small), "rating").Raw
	bigRating := comp(t, Compute(big), "rating").Raw

	approx(t, "small rating", smallRating, (5+25*0.70)/30, 0.01) // ≈0.75
	if bigRating < 0.99 {
		t.Errorf("5000 perfect reviews raw = %v, want ~1.0", bigRating)
	}
	if bigRating-smallRating < 0.2 {
		t.Errorf("volume of evidence must matter: big %v vs small %v", bigRating, smallRating)
	}
}

func TestWilsonSmallSampleHonesty(t *testing.T) {
	// 0 defects in 10 orders is weaker evidence than 2 in 5000.
	clean10 := wilsonNonDefect(10, 0)
	nearly5000 := wilsonNonDefect(5000, 2)
	if clean10 >= nearly5000 {
		t.Errorf("wilson: clean-but-tiny %v should score below huge-and-nearly-clean %v", clean10, nearly5000)
	}
	if wilsonNonDefect(0, 0) != 0 {
		t.Error("no orders must yield 0, not a perfect record")
	}
	approx(t, "wilson(100,0)", wilsonNonDefect(100, 0), 0.9630, 0.001)
}

func TestEstablishedSellerGolden(t *testing.T) {
	// Priya-like fixture: ~4 years tenure, steady sales, strong reviews.
	in := Input{Now: now, VerifiedConnections: 2}
	for d := 0; d < 1460; d += 2 { // a sale every other day for 4 years
		in.Events = append(in.Events, sale(d, TrustVerifiedAPI))
	}
	for d := 0; d < 1460; d += 10 { // steady 5-star reviews, few 4s
		stars := 5.0
		if d%50 == 0 {
			stars = 4
		}
		in.Events = append(in.Events, review(stars, d, TrustVerifiedAPI))
	}
	in.Events = append(in.Events, dispute(200), dispute(500))

	r := Compute(in)

	if r.ScoreVersion != Version {
		t.Errorf("version = %q", r.ScoreVersion)
	}
	if r.Overall < 80 || r.Overall > 95 {
		t.Errorf("established seller overall = %v, want 80–95", r.Overall)
	}
	if r.Grade != "A" && r.Grade != "A+" {
		t.Errorf("grade = %q, want A or A+", r.Grade)
	}
	if r.Confidence < 0.8 {
		t.Errorf("confidence = %v, want ≥0.8 for 4 years of history", r.Confidence)
	}
	approx(t, "recency raw", comp(t, r, "recency").Raw, 1.0, 0.01) // sold today
	approx(t, "tenure raw", comp(t, r, "tenure").Raw, 0.8, 0.01)  // 4 of 5 years
	approx(t, "diversity raw", comp(t, r, "diversity").Raw, 2.0/3, 0.01)

	// The weighted sum must equal the overall.
	sum := 0.0
	for _, c := range r.Components {
		sum += c.Weighted
	}
	approx(t, "sum(weighted) == overall", r.Overall, round2(sum), 0.001)
}

func TestFreshFakeShopCannotScoreHigh(t *testing.T) {
	// Sybil resistance: a week-old shop with 200 perfect self-reported
	// reviews and no verified connections must not reach grade A.
	in := Input{Now: now}
	for range 200 {
		in.Events = append(in.Events, review(5, 3, TrustSelfReported))
		in.Events = append(in.Events, sale(3, TrustSelfReported))
	}
	r := Compute(in)
	if r.Overall >= 80 {
		t.Errorf("fresh fake shop overall = %v, want < 80", r.Overall)
	}
	if gradeRank(r.Grade) > gradeRank("B") {
		t.Errorf("self-reported-only grade = %q, must be capped at B", r.Grade)
	}
	if !r.Inputs.AllSelfReported {
		t.Error("AllSelfReported should be true")
	}
}

func TestEmptyPassport(t *testing.T) {
	r := Compute(Input{Now: now})
	if r.Overall > 20 {
		t.Errorf("empty passport overall = %v, want ~0 (only the rating prior)", r.Overall)
	}
	if r.Grade != "D" {
		t.Errorf("grade = %q, want D", r.Grade)
	}
	if r.Confidence != 0 {
		t.Errorf("confidence = %v, want 0", r.Confidence)
	}
	if r.Inputs.DaysSinceLastSale != -1 {
		t.Errorf("DaysSinceLastSale = %d, want -1 sentinel", r.Inputs.DaysSinceLastSale)
	}
}

func TestDormantSellerDecays(t *testing.T) {
	active := Input{Now: now, VerifiedConnections: 1}
	dormant := Input{Now: now, VerifiedConnections: 1}
	for d := 0; d < 730; d += 2 {
		active.Events = append(active.Events, sale(d, TrustVerifiedAPI))
		dormant.Events = append(dormant.Events, sale(d+270, TrustVerifiedAPI)) // stopped 9 months ago
	}
	a, d := Compute(active), Compute(dormant)
	if d.Overall >= a.Overall {
		t.Errorf("dormant %v should score below active %v", d.Overall, a.Overall)
	}
	if got := comp(t, d, "recency").Raw; got > 0.15 {
		t.Errorf("recency after 270 days = %v, want < 0.15 (90-day half-life)", got)
	}
}

func TestEbayScaleNormalization(t *testing.T) {
	// eBay-style -1/0/+1 feedback normalizes onto the same 0–1 axis.
	fiveStar := Input{Now: now, Events: []Event{
		{Type: EventReview, OccurredAt: daysAgo(1), Trust: TrustVerifiedAPI, RatingValue: 5, RatingMin: 1, RatingMax: 5},
	}}
	ebayPos := Input{Now: now, Events: []Event{
		{Type: EventReview, OccurredAt: daysAgo(1), Trust: TrustVerifiedAPI, RatingValue: 1, RatingMin: -1, RatingMax: 1},
	}}
	if a, b := comp(t, Compute(fiveStar), "rating").Raw, comp(t, Compute(ebayPos), "rating").Raw; a != b {
		t.Errorf("5/5 stars (%v) and +1 ebay (%v) must normalize identically", a, b)
	}
}
