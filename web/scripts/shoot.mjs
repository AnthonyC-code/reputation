// Screenshot sweep for design review. Assumes a server is already running
// (e.g. `pnpm build && pnpm start`). Usage:
//   node scripts/shoot.mjs <out-dir> [base-url]
// Captures every route x light/dark x desktop/mobile into <out-dir>.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const outDir = process.argv[2];
if (!outDir) {
  console.error("usage: node scripts/shoot.mjs <out-dir> [base-url]");
  process.exit(1);
}
const baseUrl = process.argv[3] ?? "http://localhost:3000";

const routes = [
  ["/", "home"],
  ["/p/demo", "passport"],
  ["/platforms", "platforms"],
  ["/docs/api", "docs-api"],
  ["/docs/score", "docs-score"],
  ["/docs/verification", "docs-verification"],
  ["/about", "about"],
  ["/privacy", "privacy"],
  ["/p/nope", "404"],
];
const schemes = ["light", "dark"];
const widths = [
  [1440, 900],
  [390, 844],
];

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
let count = 0;
for (const [width, height] of widths) {
  for (const scheme of schemes) {
    const ctx = await browser.newContext({
      viewport: { width, height },
      colorScheme: scheme,
      deviceScaleFactor: 1,
    });
    const page = await ctx.newPage();
    for (const [route, name] of routes) {
      const res = await page.goto(baseUrl + route, { waitUntil: "networkidle" });
      if (!res) throw new Error(`no response for ${route}`);
      const file = join(outDir, `${name}-${width}-${scheme}.png`);
      await page.screenshot({ path: file, fullPage: true });
      count++;
      console.log(`${file} (HTTP ${res.status()})`);
    }
    await ctx.close();
  }
}
await browser.close();
console.log(`${count} screenshots -> ${outDir}`);
