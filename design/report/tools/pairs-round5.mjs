// The picture pairs of round 5: the same place on round 4's build (main) («Before», grey) and on this one («After», accent),
// JPEG at quality 82, at most 1000 wide and 620 tall.   node design/report/tools/pairs-round5.mjs <old> <new> [names]
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
const bottom = async (p) => { await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(700); };
const up = (px) => async (p) => { await p.evaluate((px) => scrollBy(0, -px), px); await p.waitForTimeout(500); };
const frozen = (ms, act) => async (p) => { await act(p); await p.evaluate(() => { for (const a of document.getAnimations()) a.pause(); }); await p.evaluate((ms) => { for (const a of document.getAnimations()) if (a.effect?.target?.closest?.(".fmodal")) a.currentTime = ms; }, ms); await p.waitForTimeout(150); };
const openFact = async (p) => { await p.evaluate(() => document.querySelectorAll(".fact__open")[1].click()); };
const SHOTS = [
  // general: the fades, the hovers, the packs while scrolling
  ["r5-fade-hero-1440", "", 1440, 900, 0, { x: 0, y: 300, width: 1440, height: 600 }, null],
  ["r5-fade-business-1440", "", 1440, 900, "#business .business__cards", { x: 40, y: 300, width: 680, height: 420 }, up(100)],
  ["r5-fade-card-1440", "catalog/", 1440, 900, "[data-grid]", { x: 40, y: 340, width: 680, height: 300 }, null],
  ["r5-hover-pager-1440", "", 1440, 900, ".featured .head", { x: 560, y: 40, width: 320, height: 120 }, async (p) => { await up(80)(p); await hoverOn(".pager__dot:nth-child(3)")(p); }],
  ["r5-hover-arrows-1440", "", 1440, 900, "#recs-title", { x: 1200, y: 0, width: 240, height: 120 }, async (p) => { await up(40)(p); await hoverOn('[data-next="recs"]')(p); }],
  ["r5-hover-card-1440", "", 1440, 900, "#recs-title", { x: 0, y: 420, width: 520, height: 300 }, hoverOn(".reel > .card:first-child .buy__weights")],
  ["r5-hover-heart-1440", "", 1440, 900, "#recs-title", { x: 0, y: 40, width: 520, height: 200 }, hoverOn(".reel > .card:first-child .fav")],
  ["r5-packs-scroll-1440", "", 1440, 900, ".reel", null, async (p) => { await p.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; scrollBy(0, -300); }); await p.waitForTimeout(1200); await p.evaluate(() => { const t0 = performance.now(), y0 = scrollY; const f = (n) => { const k = Math.min(1, (n - t0) / 400); scrollTo(0, y0 + 300 * k); if (k < 1) requestAnimationFrame(f); }; requestAnimationFrame(f); }); await p.waitForTimeout(200); }, true],
  // navbar
  ["r5-navbar-1440", "", 1440, 900, 0, { x: 0, y: 0, width: 1440, height: 48 }, null],
  ["r5-navbar-hover-1440", "", 1440, 900, 0, { x: 400, y: 0, width: 640, height: 48 }, hoverOn(".nav__links--full li:nth-child(2) a")],
  // hero
  ["r5-hero-1440", "", 1440, 900, 0, null, null],
  ["r5-hero-1920", "", 1920, 1080, 0, null, null],
  ["r5-hero-1024", "", 1024, 768, 0, null, null],
  ["r5-hero-800", "", 800, 900, 0, null, null],
  ["r5-hero-390", "", 390, 844, 0, null, null],
  ["r5-hero-link-hover-1440", "", 1440, 900, 0, { x: 940, y: 540, width: 500, height: 360 }, hoverOn(".hero__links li:nth-child(2) a")],
  ["r5-hero-note-1440", "", 1440, 900, 0, { x: 480, y: 540, width: 480, height: 360 }, async (p) => { await p.click(".hero__info-btn"); await p.mouse.move(10, 400); await p.waitForTimeout(500); }],
  // new arrivals
  ["r5-taste-1440", "", 1440, 900, ".featured__facts", { x: 60, y: 0, width: 680, height: 220 }, up(40)],
  ["r5-taste-1024", "", 1024, 768, ".featured__facts", { x: 20, y: 0, width: 520, height: 300 }, up(40)],
  // recommended
  ["r5-reel-slide-1440", "", 1440, 900, "#recs-title", null, async (p) => { await p.waitForTimeout(800); await p.click('[data-next="recs"]'); await p.waitForTimeout(220); }, true],
  ["r5-reel-rest-1440", "", 1440, 900, "#recs-title", null, async (p) => { await p.waitForTimeout(800); await p.click('[data-next="recs"]'); await p.waitForTimeout(1600); }],
  // business
  ["r5-business-1440", "", 1440, 900, "#business", null, null],
  // info blocks
  ["r5-facts-1440", "", 1440, 900, ".facts", { x: 0, y: 0, width: 1440, height: 520 }, up(160)],
  ["r5-facts-390", "", 390, 844, ".facts", null, up(60)],
  ["r5-modal-150ms-1440", "", 1440, 900, ".facts", null, async (p) => { await up(450)(p); await frozen(150, openFact)(p); }, true],
  ["r5-modal-1440", "", 1440, 900, ".facts", null, async (p) => { await up(450)(p); await openFact(p); await p.waitForTimeout(1000); }],
  ["r5-modal-390", "", 390, 844, ".facts", null, async (p) => { await up(300)(p); await p.evaluate(() => document.querySelector(".fact__open").click()); await p.waitForTimeout(1000); }],
  // footer
  ["r5-footer-1440", "", 1440, 900, ".footer", null, bottom],
  ["r5-footer-900", "", 900, 900, ".footer", null, bottom],
  ["r5-footer-hover-1440", "", 1440, 900, ".footer", { x: 720, y: 560, width: 720, height: 220 }, async (p) => { await bottom(p); await hoverOn(".footer__group a")(p); }]
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
