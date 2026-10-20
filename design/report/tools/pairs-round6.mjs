// The picture pairs of round 6: the same place on round 5's build (main) («Before», grey) and on this one («After», accent),
// JPEG at quality 82, at most 1000 wide and 620 tall.   node design/report/tools/pairs-round6.mjs <old> <new> [names]
// The hero's entrance is finished at once (window.qqHero) unless a shot catches it on its way.
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
const done = async (p) => { await p.evaluate(() => window.qqHero?.progress(1)); await p.waitForTimeout(300); };
const menu = (ms) => async (p) => { await p.click("[data-menu-button]"); await p.waitForTimeout(ms); };
const note = async (p) => { await done(p); await p.click(".hero__info-btn"); await p.mouse.move(10, 300); await p.waitForTimeout(500); };
const intro = (ms) => async (p) => { await p.evaluate(async (ms) => { if (window.qqHero) { window.qqHero.pause(); window.qqHero.seek(ms / 1000); } }, ms); await p.waitForTimeout(200); };
const SHOTS = [
  // general: the fades on the new curve
  ["r6-fade-hero-1440", "", 1440, 900, 0, { x: 0, y: 260, width: 1440, height: 640 }, done],
  ["r6-fade-card-1440", "catalog/", 1440, 900, "[data-grid]", { x: 40, y: 340, width: 680, height: 300 }, null],
  ["r6-fade-business-1440", "", 1440, 900, "#business .business__cards", { x: 40, y: 300, width: 680, height: 420 }, up(100)],
  // navbar
  ["r6-navbar-1440", "", 1440, 900, 0, { x: 380, y: 0, width: 680, height: 48 }, done],
  ["r6-navbar-hover-1440", "", 1440, 900, 0, { x: 380, y: 0, width: 680, height: 48 }, async (p) => { await done(p); await hoverOn(".nav__links--full li:nth-child(2) a")(p); }],
  ["r6-navbar-1100", "", 1100, 800, 0, { x: 0, y: 0, width: 1100, height: 48 }, done],
  ["r6-logo-hover-1440", "", 1440, 900, 0, { x: 0, y: 0, width: 360, height: 48 }, async (p) => { await done(p); await hoverOn(".nav__logo")(p); }],
  // the menu
  ["r6-menu-390", "catalog/", 390, 844, 0, null, menu(900)],
  ["r6-menu-700", "catalog/", 700, 900, 0, { x: 0, y: 0, width: 700, height: 420 }, menu(900)],
  ["r6-menu-slide-390", "catalog/", 390, 844, 0, null, menu(160), true],
  // hero
  ["r6-hero-1440", "", 1440, 900, 0, null, done],
  ["r6-hero-1920", "", 1920, 1080, 0, null, done],
  ["r6-hero-1024", "", 1024, 768, 0, null, done],
  ["r6-hero-800", "", 800, 1000, 0, null, done],
  ["r6-hero-600", "", 600, 900, 0, null, done],
  ["r6-hero-390", "", 390, 844, 0, null, done],
  ["r6-hero-320", "", 320, 640, 0, null, done],
  ["r6-hero-cells-1440", "", 1440, 900, 0, { x: 0, y: 560, width: 1440, height: 340 }, done],
  ["r6-hero-digits-1440", "", 1440, 900, 0, { x: 560, y: 680, width: 320, height: 110 }, done],
  ["r6-hero-note-1440", "", 1440, 900, 0, { x: 480, y: 540, width: 480, height: 360 }, note],
  ["r6-hero-note-800", "", 800, 1000, 0, { x: 0, y: 760, width: 800, height: 240 }, note],
  ["r6-hero-note-390", "", 390, 844, 0, { x: 0, y: 500, width: 390, height: 344 }, note],
  ["r6-hero-intro-1440", "", 1440, 900, 0, null, intro(900), true],
  ["r6-hero-intro-390", "", 390, 844, 0, null, intro(900), true],
  // new arrivals
  ["r6-pager-1440", "", 1440, 900, ".featured .head", { x: 560, y: 0, width: 320, height: 120 }, async (p) => { await done(p); await up(40)(p); }],
  ["r6-pager-hover-1440", "", 1440, 900, ".featured .head", { x: 560, y: 0, width: 320, height: 120 }, async (p) => { await done(p); await up(40)(p); await hoverOn(".pager__dot:nth-child(3)")(p); }]
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
