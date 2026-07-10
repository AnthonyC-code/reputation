import { ImageResponse } from "next/og";
import { demoPassport } from "@/lib/demo";

// Social share card: seller name, score ring, headline stats. Rendered at
// build time (SSG) so shares unfurl instantly. Satori quirks: every div with
// multiple children needs explicit display:flex, and non-ASCII glyphs (★)
// trigger dynamic font fetches — text is composed as single strings.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Reputation Passport score card";

export function generateStaticParams() {
  return [{ slug: "demo" }];
}

export default async function OGImage() {
  const p = demoPassport;
  const r = 110;
  const c = 2 * Math.PI * r;
  const filled = (p.score.overall / 100) * c;
  const statsLine = `${p.stats.orders.toLocaleString("en-US")} verified orders  ·  ${p.stats.avg_rating}/5 across ${p.stats.reviews.toLocaleString("en-US")} reviews`;
  const provenanceLine = `Verified via official platform APIs · selling since ${p.seller.member_since}`;
  const brandLine = `Reputation Passport${p.sample ? " · sample" : ""}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#fafafa",
          padding: "72px 88px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", color: "#059669", fontSize: 30, fontWeight: 600 }}>
            {brandLine}
          </div>
          <div style={{ display: "flex", fontSize: 58, fontWeight: 700, color: "#171717" }}>
            {p.seller.name}
          </div>
          <div style={{ display: "flex", fontSize: 30, color: "#525252" }}>
            {statsLine}
          </div>
          <div style={{ display: "flex", fontSize: 25, color: "#737373" }}>
            {provenanceLine}
          </div>
        </div>
        <div style={{ display: "flex", position: "relative", width: 280, height: 280 }}>
          <svg width="280" height="280" viewBox="0 0 280 280">
            <circle cx="140" cy="140" r={r} fill="none" stroke="#e5e5e5" strokeWidth="22" />
            <circle
              cx="140"
              cy="140"
              r={r}
              fill="none"
              stroke="#059669"
              strokeWidth="22"
              strokeLinecap="round"
              strokeDasharray={`${filled} ${c - filled}`}
              transform="rotate(-90 140 140)"
            />
          </svg>
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: 280,
              height: 280,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ display: "flex", fontSize: 76, fontWeight: 700, color: "#171717", lineHeight: 1 }}>
              {String(Math.round(p.score.overall))}
            </div>
            <div style={{ display: "flex", fontSize: 40, fontWeight: 600, color: "#059669" }}>
              {p.score.grade}
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
