import { demoPassport } from "@/lib/demo";
import { mrzLines } from "@/lib/mrz";

// Static SVG badge — embeddable anywhere an <img> works (own site, email
// signature, marketplace application). Self-contained: system font stacks
// only, no JS. Dark variant via a media query inside the SVG, which
// browsers honor even when the SVG is embedded through <img>.
export const dynamic = "force-static";

export function generateStaticParams() {
  return [{ slug: "demo" }];
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (slug !== "demo") {
    return new Response("passport not found", { status: 404 });
  }
  const p = demoPassport;
  const svg = badgeSVG({
    score: Math.round(p.score.overall),
    grade: p.score.grade,
    orders: p.stats.orders.toLocaleString("en-US"),
    rating: p.stats.avg_rating,
    reviews: p.stats.reviews.toLocaleString("en-US"),
    mrz: mrzLines(p)[1],
    sample: p.sample,
  });
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

const MONO = "ui-monospace,'SF Mono',Menlo,monospace";

// MRZ filler is `<`, which must be escaped inside SVG text nodes.
function xmlEscape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function badgeSVG(v: {
  score: number;
  grade: string;
  orders: string;
  rating: number;
  reviews: string;
  mrz: string;
  sample: boolean;
}): string {
  const sampleTag = v.sample
    ? `<text x="290" y="16" text-anchor="end" font-size="8" letter-spacing="1" class="warn" font-family="${MONO}">SAMPLE</text>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="72" viewBox="0 0 300 72" role="img" aria-label="Reputation Passport score ${v.score}, grade ${v.grade}, ${v.orders} verified orders, ${v.rating}/5 average rating">
  <style>
    .bg { fill: #FCFCFA; stroke: #C9C9BF; }
    .rule { stroke: #E4E4DC; }
    .seal { stroke: #0B5B44; }
    .ink { fill: #1A201D; }
    .sub { fill: #4C5551; }
    .muted { fill: #717B75; }
    .mrz { fill: #9AA39D; }
    .brass { fill: #8F7332; }
    .warn { fill: #7A4F0E; }
    @media (prefers-color-scheme: dark) {
      .bg { fill: #141917; stroke: #39423D; }
      .rule { stroke: #242B27; }
      .seal { stroke: #3FBF8C; }
      .ink { fill: #E9EBE7; }
      .sub { fill: #A4ADA7; }
      .muted { fill: #6F7973; }
      .mrz { fill: #545E58; }
      .brass { fill: #CDAA5E; }
      .warn { fill: #E0BC6C; }
    }
  </style>
  <rect x="0.5" y="0.5" width="299" height="71" rx="4" class="bg"/>
  <g transform="translate(13, 14) scale(1.25)" fill="none" class="seal">
    <circle cx="12" cy="12" r="10.25" stroke-width="1.5"/>
    <circle cx="12" cy="12" r="7.75" stroke-width="1" stroke-dasharray="0.1 2.1" stroke-linecap="round"/>
    <path d="M8.4 12.3l2.5 2.5 4.8-5.4" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <line x1="56.5" y1="10" x2="56.5" y2="50" class="rule"/>
  <g font-family="${MONO}">
    <text x="66" y="19" font-size="8" letter-spacing="1.2" class="muted">REPUTATION PASSPORT</text>
    <text x="66" y="45" font-size="22" font-weight="600" class="ink">${v.score}<tspan dx="4" font-size="14" class="brass">${v.grade}</tspan></text>
    <text x="290" y="33" text-anchor="end" font-size="9" letter-spacing="0.4" class="sub">${v.orders} VERIFIED ORDERS</text>
    <text x="290" y="47" text-anchor="end" font-size="9" letter-spacing="0.4" class="sub">${v.rating}/5 · ${v.reviews} REVIEWS</text>
    <line x1="10" y1="58.5" x2="290" y2="58.5" class="rule"/>
    <text x="10" y="67.5" font-size="7" letter-spacing="1.5" class="mrz">${xmlEscape(v.mrz)}</text>
  </g>
  ${sampleTag}
</svg>
`;
}
