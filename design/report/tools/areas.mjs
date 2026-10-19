// The three areas of round 1 (hero, product stage, catalog) at 25 real screen sizes, from the built site served by
// `npm run preview`. Writes design/report/areas.json.   node design/report/tools/areas.mjs [base url]
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const base = process.argv[2] || "http://localhost:4173/";
const SIZES = [[320, 568], [360, 640], [375, 667], [390, 844], [414, 896], [430, 932], [568, 320], [667, 375], [844, 390], [932, 430],
  [744, 1133], [768, 1024], [820, 1180], [1024, 768], [1024, 1366], [1180, 820], [1280, 720], [1280, 800], [1366, 650], [1366, 768],
  [1440, 900], [1536, 864], [1680, 1050], [1920, 1080], [2560, 1440]];
const browser = await chromium.launch({ args: ["--disable-3d-apis"] });
const out = [];
for (const [w, h] of SIZES) {
  const row = { size: `${w}×${h}`, w, h };
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  await page.goto(base, { waitUntil: "networkidle" }); await page.waitForTimeout(300);
  Object.assign(row, await page.evaluate(() => {
    const r = (s) => document.querySelector(s).getBoundingClientRect(), px = (s) => Math.round(parseFloat(getComputedStyle(document.querySelector(s)).fontSize) * 10) / 10;
    const hero = r(".hero"), t = getComputedStyle(document.querySelector(".hero__grid")).gridTemplateColumns.split(" ").length;
    return { heroH: Math.round(hero.height), peek: Math.round(innerHeight - hero.bottom), heroTitle: px(".hero__title"), count: px(".hero__count .digits"), heroCols: t };
  }));
  await page.goto(base + "coffee/q-optimistic/", { waitUntil: "networkidle" }); await page.waitForTimeout(500);
  Object.assign(row, await page.evaluate(() => {
    const r = (s) => document.querySelector(s).getBoundingClientRect();
    const bar = r(".buybar"), pack = r(".pack--hero");
    const rows = new Set([...document.querySelectorAll(".buybar .cell, .buybar__add")].map((c) => Math.round(c.getBoundingClientRect().bottom))).size;
    const barPos = getComputedStyle(document.querySelector(".buybar")).position, onScreen = barPos === "sticky" ? bar.top : innerHeight;
    return { pinH: Math.round(r(".pstage__pin").height), pack: Math.round(pack.width), packUnderBar: Math.max(0, Math.round(pack.bottom - onScreen)), bar: Math.round(bar.height), barRows: bar.height > 100 ? 2 : 1, barPos };
  }));
  await page.goto(base + "catalog/", { waitUntil: "networkidle" }); await page.waitForTimeout(300);
  Object.assign(row, await page.evaluate(() => {
    const g = document.querySelector("[data-grid]"), cards = [...g.children].filter((c) => !c.hasAttribute("data-out"));
    const first = cards[0].getBoundingClientRect(), tops = new Set([...document.querySelectorAll(".filter")].map((f) => Math.round(f.getBoundingClientRect().top)));
    const perRow = cards.filter((c) => Math.round(c.getBoundingClientRect().top) === Math.round(first.top)).length;
    return { firstRow: perRow, cardW: Math.round(first.width), filterRows: tops.size, firstCardTop: Math.round(first.top) };
  }));
  out.push(row); console.log(JSON.stringify(row));
  await ctx.close();
}
await browser.close();
writeFileSync(resolve(import.meta.dirname, "../areas.json"), JSON.stringify(out, null, 1));
