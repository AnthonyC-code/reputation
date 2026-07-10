import { demoPassport } from "@/lib/demo";

// Machine-readable attestation for offline verification (see the
// "verify it yourself" section on the passport page).
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
  return Response.json(demoPassport.attestation, {
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}
