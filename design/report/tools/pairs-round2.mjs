// The picture pairs of round 2: the same place on the previous build («Before», grey) and on this one («After»,
// accent), JPEG at quality 82, at most 1000 wide and 620 tall.   node design/report/tools/pairs-round2.mjs <old> <new>
import { chromium } from "playwright";
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const OUT = resolve(import.meta.dirname, "../shots"); mkdirSync(OUT, { recursive: true });
const [OLD = "http://localhost:4181/", NEW = "http://localhost:4182/"] = process.argv.slice(2);
const only = process.argv[4]?.split(",");
const FRIDAY = new Date("2026-10-23T12:00:00+03:00");
// [name, page, w, h, scroll (y, a selector, or 0), clip {x,y,width,height} or null, what to do before the picture]
const SHOTS = [
  ["r2-navbar-1440", "", 1440, 900, 0, { x: 0, y: 0, width: 1440, height: 64 }, null],
  ["r2-navbar-hover-1440", "", 1440, 900, 0, { x: 300, y: 0, width: 840, height: 64 }, async (p) => { const a = (await p.$$(".nav__links a"))[1]; const b = await a.boundingBox(); await p.mouse.move(b.x + b.width / 2, b.y + b.height / 2); }],
  ["r2-navbar-1920", "", 1920, 1080, 0, { x: 0, y: 0, width: 1920, height: 64 }, null],
  ["r2-navbar-steps-900", "", 900, 700, 0, { x: 0, y: 0, width: 900, height: 64 }, null],
  ["r2-navbar-steps-700", "", 700, 700, 0, { x: 0, y: 0, width: 700, height: 64 }, null],
  ["r2-phone-390", "", 390, 844, 0, null, null],
  ["r2-navbar-business-1440", "", 1440, 900, "#business", null, null],
  ["r2-navbar-dark-1440", "", 1440, 900, "#approach", null, null],
  ["r2-hero-1440", "", 1440, 900, 0, null, null],
  ["r2-hero-1920", "", 1920, 1080, 0, null, null],
  ["r2-hero-1024", "", 1024, 768, 0, null, null],
  ["r2-hero-date-1440", "", 1440, 900, 0, { x: 480, y: 540, width: 480, height: 360 }, "friday"],
  ["r2-hero-hover-1440", "", 1440, 900, 0, { x: 940, y: 540, width: 500, height: 360 }, async (p) => { const a = (await p.$$(".hero__link"))[1]; const b = await a.boundingBox(); await p.mouse.move(b.x + 40, b.y + b.height / 2); }],
  ["r2-lines-featured-1440", "", 1440, 900, ".featured .head", null, null],
  ["r2-product-390", "coffee/keniya-kisii/", 390, 844, 0, null, null],
  ["r2-pack-press-1440", "catalog/", 1440, 900, 1750, null, async (p) => { const c = await p.evaluate(() => { const i = window.qqPacks?.stage.items.find((i) => { const r = i.el.getBoundingClientRect(), c = r.top + r.height / 2; return c > 200 && c < 700 && r.width > 100; }); if (!i) return null; const r = i.el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }); if (c) { await p.mouse.move(c[0], c[1]); await p.waitForTimeout(500); await p.mouse.down(); await p.waitForTimeout(600); } }, true]
];
const label = (text, color, w) => Buffer.from(`<svg width="${w}" height="34" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#0a0a0a"/><text x="2" y="23" font-family="Inter, Arial, sans-serif" font-size="17" font-weight="600" fill="${color}">${text}</text></svg>`);
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
async function shoot(base, [name, path, w, h, at, clip, act, live]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  if (act === "friday") await page.clock.install({ time: FRIDAY });
  await page.goto(base + path, { waitUntil: "networkidle" });
  if (act === "friday") await page.clock.runFor(2500); else await page.waitForTimeout(1600);
  const y = typeof at === "number" ? at : await page.evaluate((s) => document.querySelector(s).getBoundingClientRect().top + scrollY, at);
  if (y) { await page.evaluate((y) => scrollTo({ top: y, behavior: "instant" }), y); await page.waitForTimeout(1400); }
  if (typeof act === "function") await act(page);
  if (!live) await page.waitForTimeout(700);
  const png = await page.screenshot(clip ? { clip } : {});
  await ctx.close();
  return png;
}
for (const s of SHOTS) {
  if (only && !only.includes(s[0])) continue;
  const [a, b] = [await shoot(OLD, s), await shoot(NEW, s)];
  const meta = await sharp(b).metadata(), wide = meta.width / meta.height > 1.6;
  const fit = wide ? { width: 1000, height: 272 } : { width: 496, height: 586 };
  const imgs = await Promise.all([a, b].map((x) => sharp(x).resize({ ...fit, fit: "inside" }).toBuffer({ resolveWithObject: true })));
  const parts = [["Before", "#8a8a8a", imgs[0]], ["After", "#38bdf8", imgs[1]]];
  const comp = []; let x = 0, y = 0;
  for (const [t, c, im] of parts) {
    comp.push({ input: label(t, c, im.info.width), left: x, top: y }, { input: im.data, left: x, top: y + 34 });
    if (wide) y += 34 + im.info.height + 8; else x += im.info.width + 8;
  }
  const W = wide ? Math.max(...imgs.map((i) => i.info.width)) : x - 8, H = wide ? y - 8 : 34 + Math.max(...imgs.map((i) => i.info.height));
  await sharp({ create: { width: W, height: H, channels: 3, background: "#0a0a0a" } }).composite(comp).jpeg({ quality: 82 }).toFile(resolve(OUT, s[0] + ".jpg"));
  console.log(s[0]);
}
await browser.close();
