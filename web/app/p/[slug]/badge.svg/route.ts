import { demoPassport } from "@/lib/demo";

// Static SVG badge — embeddable anywhere an <img> works (own site, email
// signature, marketplace application). Self-contained: no fonts, no JS.
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
    sample: p.sample,
  });
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

function badgeSVG(v: {
  score: number;
  grade: string;
  orders: string;
  rating: number;
  sample: boolean;
}): string {
  const sampleTag = v.sample
    ? `<text x="292" y="14" text-anchor="end" font-size="9" fill="#b45309" font-family="system-ui, -apple-system, sans-serif">SAMPLE</text>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="72" viewBox="0 0 300 72" role="img" aria-label="Reputation Passport score ${v.score}, grade ${v.grade}">
  <rect x="0.5" y="0.5" width="299" height="71" rx="10" fill="#ffffff" stroke="#d4d4d4"/>
  ${sampleTag}
  <g transform="translate(14, 16)">
    <path d="M20 2.5 6.5 7.5v10c0 8 5.5 14 13.5 17.5C28 31.5 33.5 25.5 33.5 17.5v-10L20 2.5Z" fill="#05966915" stroke="#059669" stroke-width="2.4"/>
    <path d="m14 18.5 4.2 4.2 8-8.4" fill="none" stroke="#059669" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
  <g font-family="system-ui, -apple-system, sans-serif">
    <text x="62" y="26" font-size="11" fill="#737373">Reputation Passport</text>
    <text x="62" y="50" font-size="22" font-weight="600" fill="#171717">${v.score}<tspan fill="#059669"> · ${v.grade}</tspan></text>
    <text x="292" y="38" text-anchor="end" font-size="11" fill="#404040">${v.orders} verified orders</text>
    <text x="292" y="54" text-anchor="end" font-size="11" fill="#404040">${v.rating}★ average rating</text>
  </g>
</svg>
`;
}
