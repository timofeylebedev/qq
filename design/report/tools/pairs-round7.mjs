// The picture pairs of round 7: the same place on round 6's build (main) («Before», grey) and on this one («After», accent),
// JPEG at quality 82, at most 1000 wide and 620 tall.   node design/report/tools/pairs-round7.mjs <old> <new> [names]
import { chromium } from "playwright";
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const OUT = resolve(import.meta.dirname, "../shots"); mkdirSync(OUT, { recursive: true });
const [OLD = "http://localhost:4402/", NEW = "http://localhost:4401/"] = process.argv.slice(2);
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
const open = (name) => async (p) => { await p.evaluate((n) => { const d = document.querySelector(`[data-filter="${n}"]`); if (d) d.open = true; }, name); await p.waitForTimeout(300); };
const openHover = (name, i) => async (p) => { await open(name)(p); await hoverOn(`[data-filter="${name}"] .option:nth-of-type(${i}), [data-filter="${name}"] option:nth-of-type(${i})`)(p); };
const pick = (name, i) => async (p) => { await p.evaluate(([n, i]) => { const x = document.querySelectorAll(`[data-filter="${n}"] input`)[i]; if (x) { x.checked = true; x.dispatchEvent(new Event("change", { bubbles: true })); } }, [name, i]); await p.waitForTimeout(400); };
// a drag across the big pack (round 7 makes it turn; before, nothing happened)
const dragPack = async (p) => { const b = await (await p.$(".pack--hero")).boundingBox(); await p.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await p.mouse.down(); await p.mouse.move(b.x + b.width / 2 + 130, b.y + b.height / 2 + 40, { steps: 8 }); await p.waitForTimeout(500); };
const SHOTS = [
  // catalog
  ["r7-info-390", "catalog/", 390, 844, 0, { x: 0, y: 48, width: 390, height: 460 }, null],
  ["r7-info-1440", "catalog/", 1440, 900, 0, { x: 0, y: 48, width: 1440, height: 320 }, null],
  ["r7-tabs-1440", "catalog/", 1440, 900, 0, { x: 0, y: 160, width: 1100, height: 100 }, null],
  ["r7-filter-open-1440", "catalog/", 1440, 900, 0, { x: 0, y: 230, width: 1440, height: 260 }, async (p) => { await open("line")(p); await pick("line", 1)(p); await open("line")(p); await hoverOn('[data-filter="line"] .option:nth-of-type(1)')(p); }],
  ["r7-filter-hover-1440", "catalog/", 1440, 900, 0, { x: 0, y: 230, width: 1440, height: 120 }, hoverOn('[data-filter="type"] summary')],
  ["r7-filter-open-390", "catalog/", 390, 844, 0, { x: 0, y: 200, width: 390, height: 420 }, open("country")],
  ["r7-cards-1440", "catalog/", 1440, 900, "[data-grid]", null, null],
  ["r7-rise-1440", "catalog/", 1440, 900, 0, null, async (p) => { await p.goto(p.url(), { waitUntil: "domcontentloaded" }); await p.waitForFunction(() => document.querySelector("[data-grid] > :not([data-wait])") || !document.documentElement.hasAttribute("data-enter")); await p.waitForTimeout(200); }, true],
  // the footer's top edge at 600 on the screen, the cards above it risen
  ["r7-footer-catalog-1440", "catalog/", 1440, 900, 0, { x: 0, y: 300, width: 1440, height: 450 }, async (p) => { await p.evaluate(async () => { const y = document.querySelector(".footer").getBoundingClientRect().top + scrollY - 600; for (let t = 0; t <= y; t += 400) { scrollTo({ top: t, behavior: "instant" }); await new Promise((r) => setTimeout(r, 30)); } scrollTo({ top: y, behavior: "instant" }); }); await p.waitForTimeout(1800); }],
  ["r7-footer-home-1440", "", 1440, 900, 0, { x: 0, y: 0, width: 1440, height: 420 }, async (p) => { await done(p); await bottom(p); }],
  // product
  ["r7-buybar-1440", "coffee/keniya-kisii/", 1440, 900, 0, { x: 0, y: 700, width: 1440, height: 200 }, null],
  ["r7-buybar-390", "coffee/keniya-kisii/", 390, 844, 0, { x: 0, y: 560, width: 390, height: 284 }, null],
  ["r7-buybar-open-1440", "coffee/keniya-kisii/", 1440, 900, 0, { x: 0, y: 500, width: 1440, height: 400 }, openHover("grind", 2)],
  ["r7-buybar-open-390", "coffee/keniya-kisii/", 390, 844, 0, { x: 0, y: 400, width: 390, height: 444 }, open("weight")],
  ["r7-pack-drag-1440", "coffee/keniya-kisii/", 1440, 1100, 0, null, dragPack],
  ["r7-similar-1440", "coffee/keniya-kisii/", 1440, 900, ".similar", null, up(150)],
  // about
  ["r7-team-1440", "about/", 1440, 900, ".team", null, up(120)],
  ["r7-team-390", "about/", 390, 844, ".team", null, up(80)]
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
