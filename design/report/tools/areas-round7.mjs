// The areas of round 7 at 25 real screens, on round 6's build (main) and on this one: the catalog's two info blocks
// (are the tops of their words level, and how they stand), the tabs (their colour, their box against their capitals),
// the filter cell and its open list (the gap and the seam between them, the list's width against the cell's, the
// checkbox's corners), the footer's line, the product's buy bar (its ground and the line above it), the room around
// «Кофе с похожим вкусом», and the canvas while the big pack is pinned.
//   node design/report/tools/areas-round7.mjs <old base url> <new base url>   → design/report/areas-round7.json
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const [OLD = "http://localhost:4402/", NEW = "http://localhost:4401/"] = process.argv.slice(2);
const SIZES = [[320, 568], [360, 640], [375, 667], [390, 844], [414, 896], [430, 932], [568, 320], [667, 375], [844, 390], [932, 430],
  [744, 1133], [768, 1024], [820, 1180], [1024, 768], [1024, 1366], [1180, 820], [1280, 720], [1280, 800], [1366, 650], [1366, 768],
  [1440, 900], [1536, 864], [1680, 1050], [1920, 1080], [2560, 1440]];
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const catalog = async () => {
  const q = (s) => document.querySelector(s), R = Math.round;
  const range = (el) => { const g = document.createRange(); g.selectNodeContents(el); return g; };
  const words = [...document.querySelectorAll(".catalog__info li > span")].map((e) => range(e).getClientRects()[0]);
  const icons = [...document.querySelectorAll(".catalog__info li > svg")].map((e) => e.getBoundingClientRect());
  const info = icons[0].bottom <= words[0].top + 1 ? "icon above" : "icon before";
  const tab = q(".tab:not([aria-current])"), tb = tab.getBoundingClientRect(), tr = range(tab).getBoundingClientRect();
  const f = q('[data-filter="type"]'); f.open = true; await new Promise((r) => setTimeout(r, 60));
  const fb = f.getBoundingClientRect(), pn = f.querySelector(".filter__options"), pb = pn.getBoundingClientRect(), ps = getComputedStyle(pn);
  const box = f.querySelector(".option input"), bs = getComputedStyle(box);
  const opt = f.querySelector(".option").getBoundingClientRect();
  const chev = getComputedStyle(f.querySelector(".filter__summary"), "::after").opacity;
  f.open = false;
  return {
    infoDy: R(Math.abs(words[0].top - words[1].top)), info, tabColor: getComputedStyle(tab).color.replace(/\s/g, ""),
    tabBox: `${R(tb.height)} / ${R(tr.height)}`, tabTrim: getComputedStyle(tab).textBoxTrim || "—",
    seam: ps.borderTopWidth === "0px" ? "none" : ps.borderTopWidth, gap: R(pb.top - fb.bottom), listW: `${R(pb.width)} / ${R(fb.width)}`,
    optInset: R(opt.left - pb.left), boxRadius: bs.borderRadius, chevron: chev, shadow: ps.boxShadow === "none" ? "none" : "yes",
    caption: f.parentElement.querySelector('[data-filter="price"] .filter__caption').textContent,
    footerLine: getComputedStyle(q(".footer")).borderTopWidth
  };
};
const product = async () => {
  const q = (s) => document.querySelector(s), R = Math.round;
  const b = q(".buybar"), cs = getComputedStyle(b);
  const st = q(".similar .head__title"), g = document.createRange(); g.selectNodeContents(st); const tr = g.getBoundingClientRect();
  const sel = q(".buybar select") ? "select" : q(".buybar details.filter") ? "menu cell" : "—";
  return { barBg: cs.backgroundColor.replace(/\s/g, ""), barLine: cs.borderTopWidth, barH: R(b.getBoundingClientRect().height), options: sel,
    simAbove: R(tr.top - q(".pstory").getBoundingClientRect().bottom), simBelow: R(q(".similar .grid").getBoundingClientRect().top - tr.bottom),
    canvas: q("canvas")?.style.position || "—" };
};
const out = { old: [], new: [] };
for (const [name, base] of [["old", OLD], ["new", NEW]]) {
  for (const [w, h] of SIZES) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    const page = await ctx.newPage();
    await page.goto(base + "catalog/", { waitUntil: "networkidle" }); await page.waitForTimeout(300);
    const c = await page.evaluate(catalog);
    await page.goto(base + "coffee/keniya-kisii/", { waitUntil: "networkidle" }); await page.waitForTimeout(1200);
    const p = await page.evaluate(product);
    out[name].push({ size: `${w}×${h}`, w, h, ...c, ...p });
    await ctx.close();
  }
  console.log(name, "done");
}
await browser.close();
writeFileSync(resolve(import.meta.dirname, "../areas-round7.json"), JSON.stringify(out, null, 1));
