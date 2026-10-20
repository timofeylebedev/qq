// The areas of round 6 at 25 real screens, on round 5's build (main) and on this one: the hero's title (size, lines,
// where its text starts, its air above and below), the layout of its cells, the padding of a link cell as you see it
// (below the max the lines run to the screen's edges, so an outer side is the screen's), the countdown (digits,
// caption and its lines), the «i» note (does the cell keep its height), the frame, and the navbar's link cells.
//   node design/report/tools/areas-round6.mjs <old base url> <new base url>   → design/report/areas-round6.json
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const [OLD = "http://localhost:4402/", NEW = "http://localhost:4401/"] = process.argv.slice(2);
const SIZES = [[320, 568], [360, 640], [375, 667], [390, 844], [414, 896], [430, 932], [568, 320], [667, 375], [844, 390], [932, 430],
  [744, 1133], [768, 1024], [820, 1180], [1024, 768], [1024, 1366], [1180, 820], [1280, 720], [1280, 800], [1366, 650], [1366, 768],
  [1440, 900], [1536, 864], [1680, 1050], [1920, 1080], [2560, 1440]];
const browser = await chromium.launch({ args: ["--disable-3d-apis"] });
const measure = () => {
  const q = (s) => document.querySelector(s), R = Math.round, R1 = (x) => Math.round(x * 10) / 10;
  const range = (el) => { const g = document.createRange(); g.selectNodeContents(el); return g; };
  const t = q(".hero__title"), fz = parseFloat(getComputedStyle(t).fontSize);
  const rects = [...range(t).getClientRects()].filter((x) => x.width > 1);
  const lines = new Set(rects.map((x) => R((x.top + x.height / 2) / (fz * 0.5)))).size;
  const g = q(".hero__grid"), framed = parseFloat(getComputedStyle(g).borderLeftWidth) > 0;
  const c = q(".col").getBoundingClientRect();
  // the layout of the cells: «row» (title | countdown | links), «top + 2 rows» (the parts side by side), «top + 2 cols»
  // (round 6 below M), or the old ones
  const dock = q(".hero__dock");
  const roastCols = getComputedStyle(q(".hero__roast")).gridTemplateColumns.split(" ").filter(Boolean).length;
  const gridCols = getComputedStyle(g).display === "grid" ? getComputedStyle(g).gridTemplateColumns.split(" ").filter(Boolean).length : 1;
  const layout = !dock ? (gridCols === 3 ? "row of 3" : gridCols === 2 ? "title + 2 cols" : "stacked") : gridCols === 3 ? "row of 3" : roastCols > 1 ? "top + 2 rows" : "top + 2 cols";
  // a link cell as you see it
  const a = q(".hero__link"), s = a.querySelector("span").getBoundingClientRect(), i = a.querySelector("svg").getBoundingClientRect(), b = a.getBoundingClientRect();
  const L = !framed && b.left <= c.left + 1 ? 0 : b.left, Rr = !framed && b.right >= c.right - 1 ? innerWidth : b.right;
  // the countdown
  const dg = q(".hero__count .digits"), svg = dg.tagName.toLowerCase() === "svg";
  const digitsW = svg ? dg.getBoundingClientRect().width : range(dg).getBoundingClientRect().width;
  const cap = q(".hero__caption"), capLines = new Set([...range(cap).getClientRects()].map((x) => R(x.top))).size;
  // the navbar's link cells (where the links show)
  const ls = [...document.querySelectorAll(".nav__links")].find((n) => n.getBoundingClientRect().width > 0);
  let nav = "burger";
  if (ls) {
    const as = [...ls.querySelectorAll("a")], a0 = as[0].getBoundingClientRect(), a1 = as[1].getBoundingClientRect();
    const bf = getComputedStyle(as[0], "::before"), wider = bf.content !== "none" && bf.position === "absolute" ? -parseFloat(bf.left) || 0 : 0;
    const pad = range(as[0]).getBoundingClientRect().left - a0.left + wider, gap = a1.left - a0.right - 2 * wider;
    nav = `${as.length} links · ${R1(pad)} / ${R1(gap)}`;
  }
  return {
    titlePx: R1(fz), lines, titleX: R(Math.min(...rects.map((x) => x.left))), layout,
    linkPad: `${R(s.left - L)} / ${R(Rr - i.right)}`, digitsW: R(digitsW), capLines, frame: framed ? "framed" : "—",
    heroH: R(q(".hero").getBoundingClientRect().height), nav
  };
};
// the «i»: the countdown's cell before and after it opens (it should not grow)
const note = async (page) => page.evaluate(async () => {
  const cell = document.querySelector(".hero__roast"), h0 = cell.getBoundingClientRect().height;
  document.querySelector(".hero__info-btn").click(); await new Promise((r) => setTimeout(r, 300));
  const h1 = cell.getBoundingClientRect().height;
  document.querySelector(".hero__info-btn").click();
  return { noteGrow: Math.round(h1 - h0) };
});
const out = { old: [], new: [] };
for (const [name, base] of [["old", OLD], ["new", NEW]]) {
  for (const [w, h] of SIZES) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    const page = await ctx.newPage();
    await page.goto(base, { waitUntil: "networkidle" }); await page.evaluate(() => window.qqHero?.progress(1)); await page.waitForTimeout(400);
    out[name].push({ size: `${w}×${h}`, w, h, ...(await page.evaluate(measure)), ...(await note(page)) });
    await ctx.close();
  }
  console.log(name, "done");
}
await browser.close();
writeFileSync(resolve(import.meta.dirname, "../areas-round6.json"), JSON.stringify(out, null, 1));
