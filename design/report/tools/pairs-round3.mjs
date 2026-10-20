// The picture pairs of round 3: the same place on round 2's build («Before», grey) and on this one («After», accent),
// JPEG at quality 82, at most 1000 wide and 620 tall.   node design/report/tools/pairs-round3.mjs <old> <new> [names]
import { chromium } from "playwright";
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const OUT = resolve(import.meta.dirname, "../shots"); mkdirSync(OUT, { recursive: true });
const [OLD = "http://localhost:4181/", NEW = "http://localhost:4182/"] = process.argv.slice(2);
const only = process.argv[4]?.split(",");
// [name, page, w, h, scroll (y, a selector, or 0), clip {x,y,width,height} or null, what to do before the picture]
const at = (sel) => async (p) => { const y = await p.evaluate((s) => document.querySelector(s)?.getBoundingClientRect().top + scrollY, sel); if (y != null) { await p.evaluate((y) => scrollTo({ top: y, behavior: "instant" }), y); await p.waitForTimeout(900); } };
const hoverOn = (sel) => async (p) => { const e = await p.$(sel); const b = e && await e.boundingBox(); if (b) { await p.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await p.waitForTimeout(700); } };
// [name, page, w, h, scroll (y, a selector, or 0), clip {x,y,width,height} or null, what to do before the picture, live]
const SHOTS = [
  // 3D packs: mid-scroll (a fast scroll of 600px, the picture 120ms in): round 2 leaned them, round 3 keeps them upright
  ["r3-packs-scroll-1440", "", 1440, 900, ".reel", null, async (p) => { await p.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; scrollBy(0, -300); }); await p.waitForTimeout(1200); await p.evaluate(() => { const t0 = performance.now(), y0 = scrollY; const f = (n) => { const k = Math.min(1, (n - t0) / 400); scrollTo(0, y0 + 300 * k); if (k < 1) requestAnimationFrame(f); }; requestAnimationFrame(f); }); await p.waitForTimeout(200); }, true],
  ["r3-featured-1280", "", 1280, 800, ".featured .head", null, null],
  ["r3-featured-1024", "", 1024, 768, ".featured .head", null, null],
  ["r3-featured-390", "", 390, 844, ".featured .head", null, null],
  // recommended: mid-slide (the arrow pressed, the picture 200ms in)
  ["r3-reel-slide-1440", "", 1440, 900, "#recs-title", null, async (p) => { await p.click('[data-next="recs"]'); await p.waitForTimeout(220); }, true],
  ["r3-reel-rise-1440", "", 1440, 900, 0, null, async (p) => { const y = await p.evaluate(() => document.querySelector("#recs-title").getBoundingClientRect().top + scrollY - 80); await p.evaluate((y) => scrollTo({ top: y, behavior: "instant" }), y); await p.waitForTimeout(260); }, true],
  ["r3-card-hover-price-1440", "", 1440, 900, "#recs-title", { x: 0, y: 380, width: 720, height: 520 }, hoverOn(".reel > .card:first-child .buy__add")],
  ["r3-card-hover-heart-1440", "", 1440, 900, "#recs-title", { x: 0, y: 60, width: 720, height: 480 }, hoverOn(".reel > .card:first-child .fav")],
  ["r3-facts-1440", "", 1440, 900, ".facts", { x: 0, y: 0, width: 1440, height: 500 }, async (p) => { await p.evaluate(() => scrollBy(0, -180)); await p.waitForTimeout(400); }],
  ["r3-facts-open-1440", "", 1440, 900, ".facts", null, async (p) => { await p.evaluate(() => scrollBy(0, -400)); await p.waitForTimeout(400); const b = await p.$("[data-fact='0'], .fact__more"); await b.click(); await p.waitForTimeout(900); }],
  ["r3-facts-open-390", "", 390, 844, ".facts", null, async (p) => { await p.evaluate(() => scrollBy(0, -300)); await p.waitForTimeout(400); const b = await p.$("[data-fact='0'], .fact__more"); await b.click(); await p.waitForTimeout(900); }],
  ["r3-footer-1440", "", 1440, 900, ".footer", null, async (p) => { await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(600); }],
  ["r3-footer-1920", "", 1920, 1080, ".footer", null, async (p) => { await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(600); }],
  ["r3-footer-legal-1440", "", 1440, 900, ".footer", { x: 0, y: 760, width: 720, height: 140 }, async (p) => { await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(600); }],
  ["r3-footer-1024", "", 1024, 768, ".footer", null, async (p) => { await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(600); }],
  ["r3-footer-390", "", 390, 844, ".footer", null, async (p) => { await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(600); }],
  // the fades: a card's foot (zoomed), a business card, the hero's
  ["r3-fade-card-1440", "catalog/", 1440, 900, "[data-grid]", { x: 40, y: 380, width: 680, height: 260 }, null],
  ["r3-fade-business-1440", "", 1440, 900, "#business .business__cards", { x: 40, y: 380, width: 680, height: 300 }, null],
  ["r3-fade-hero-1440", "", 1440, 900, 0, { x: 0, y: 360, width: 1440, height: 300 }, null],
  ["r3-type-1440", "", 1440, 900, ".featured .head", { x: 40, y: 60, width: 1000, height: 420 }, null]
];
const label = (text, color, w) => Buffer.from(`<svg width="${w}" height="34" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#0a0a0a"/><text x="2" y="23" font-family="Inter, Arial, sans-serif" font-size="17" font-weight="600" fill="${color}">${text}</text></svg>`);
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
async function shoot(base, [name, path, w, h, at, clip, act, live]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  await page.goto(base + path, { waitUntil: "networkidle" });
  await page.waitForTimeout(1600);
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
