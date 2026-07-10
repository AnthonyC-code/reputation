import { ImageResponse } from "next/og";
import { notFound } from "next/navigation";
import { demoPassport } from "@/lib/demo";
import { mrzLines } from "@/lib/mrz";

// Social share card in the ledger-document style, light-only. Rendered at
// build time (SSG) so shares unfurl instantly. Satori quirks: every div with
// multiple children needs explicit display:flex; no SVG <text> (numbers are
// overlaid HTML divs); no real mono font, so machine-register lines fake it
// with wide letter-spacing.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Reputation Passport score card";

export function generateStaticParams() {
  return [{ slug: "demo" }];
}

export default async function OGImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (slug !== "demo") notFound();
  const p = demoPassport;
  const r = 110;
  const c = 2 * Math.PI * r;
  const filled = (p.score.overall / 100) * c;
  const brandLine = `REPUTATION PASSPORT${p.sample ? " · SAMPLE" : ""}`;
  const statsLine = `${p.stats.orders.toLocaleString("en-US")} verified orders  ·  ${p.stats.avg_rating}/5 across ${p.stats.reviews.toLocaleString("en-US")} reviews`;
  const provenanceLine = `Verified via official platform APIs · selling since ${p.seller.member_since}`;
  const mrz = mrzLines(p)[0];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#F7F7F4",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 88px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#0B5B44">
                <circle cx="12" cy="12" r="10.25" strokeWidth="1.5" />
                <circle
                  cx="12"
                  cy="12"
                  r="7.75"
                  strokeWidth="1"
                  strokeDasharray="0.1 2.1"
                  strokeLinecap="round"
                />
                <path
                  d="M8.4 12.3l2.5 2.5 4.8-5.4"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div
                style={{
                  display: "flex",
                  fontSize: 24,
                  letterSpacing: 4,
                  color: "#717B75",
                }}
              >
                {brandLine}
              </div>
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 64,
                fontWeight: 700,
                color: "#1A201D",
                letterSpacing: -1,
              }}
            >
              {p.seller.name}
            </div>
            <div style={{ display: "flex", fontSize: 28, color: "#4C5551" }}>
              {statsLine}
            </div>
            <div style={{ display: "flex", fontSize: 22, color: "#717B75" }}>
              {provenanceLine}
            </div>
          </div>
          <div
            style={{
              display: "flex",
              position: "relative",
              width: 280,
              height: 280,
            }}
          >
            <svg width="280" height="280" viewBox="0 0 280 280">
              <circle
                cx="140"
                cy="140"
                r={r}
                fill="none"
                stroke="#E4E4DC"
                strokeWidth="16"
              />
              <circle
                cx="140"
                cy="140"
                r={r}
                fill="none"
                stroke="#0B5B44"
                strokeWidth="16"
                strokeLinecap="butt"
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
              <div
                style={{
                  display: "flex",
                  fontSize: 76,
                  fontWeight: 700,
                  color: "#1A201D",
                  lineHeight: 1,
                }}
              >
                {String(Math.round(p.score.overall))}
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 38,
                  fontWeight: 600,
                  color: "#8F7332",
                }}
              >
                {p.score.grade}
              </div>
            </div>
          </div>
        </div>
        <div
          style={{
            height: 56,
            display: "flex",
            alignItems: "center",
            background: "#EFEFEA",
            padding: "0 88px",
            fontSize: 20,
            letterSpacing: 6,
            color: "#9AA39D",
          }}
        >
          {mrz}
        </div>
      </div>
    ),
    size,
  );
}
