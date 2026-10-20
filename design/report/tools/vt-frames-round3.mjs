// Round 3's card → coffee page move, as four frames (0, 150, 300, 600ms) of the view transition, paused on the new
// page. There is no «before» (a plain page load).   node design/report/tools/vt-frames-round3.mjs <base url>
import { chromium } from "playwright";
import sharp from "sharp";
import { resolve } from "node:path";
const [BASE = "http://localhost:4182/"] = process.argv.slice(2);
const OUT = resolve(import.meta.dirname, "../shots/r3-card-to-page-1280.jpg");
const b = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
const p = await ctx.newPage();
await p.goto(BASE + "catalog/", { waitUntil: "networkidle" }); await p.waitForTimeout(1500);
await ctx.addInitScript(() => addEventListener("pagereveal", (e) => { if (e.viewTransition) e.viewTransition.ready.then(() => { window.__a = document.getAnimations(); window.__a.forEach((a) => a.pause()); }); }));
await p.$eval("[data-card].card--light .card__link", (a) => a.click());
await p.waitForURL(/coffee/); await p.waitForFunction(() => window.__a, null, { timeout: 5000 });
const frames = [];
for (const t of [0, 150, 300, 600]) {
  await p.evaluate((t) => window.__a.forEach((a) => { a.currentTime = t; }), t); await p.waitForTimeout(80);
  frames.push(await sharp(await p.screenshot()).resize({ width: 496 }).toBuffer());
}
await b.close();
const label = (t, w) => Buffer.from(`<svg width="${w}" height="34" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#0a0a0a"/><text x="2" y="23" font-family="Inter, Arial, sans-serif" font-size="17" font-weight="600" fill="#38bdf8">${t}</text></svg>`);
const h = 310, comp = [];
["After · 0 ms", "150 ms", "300 ms", "600 ms"].forEach((t, i) => { const x = (i % 2) * 504, y = Math.floor(i / 2) * (h + 34 + 8); comp.push({ input: label(t, 496), left: x, top: y }, { input: frames[i], left: x, top: y + 34 }); });
await sharp({ create: { width: 1000, height: 2 * (h + 34) + 8, channels: 3, background: "#0a0a0a" } }).composite(comp).jpeg({ quality: 82 }).toFile(OUT);
console.log(OUT);
