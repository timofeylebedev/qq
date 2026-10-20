// The areas of round 3 (the footer, new arrivals, the recommended row, the info blocks' modal) at 25 real screens,
// on the previous build and on this one.
//   node design/report/tools/areas-round3.mjs <old base url> <new base url>   → design/report/areas-round3.json
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const [OLD = "http://localhost:4181/", NEW = "http://localhost:4182/"] = process.argv.slice(2);
const SIZES = [[320, 568], [360, 640], [375, 667], [390, 844], [414, 896], [430, 932], [568, 320], [667, 375], [844, 390], [932, 430],
  [744, 1133], [768, 1024], [820, 1180], [1024, 768], [1024, 1366], [1180, 820], [1280, 720], [1280, 800], [1366, 650], [1366, 768],
  [1440, 900], [1536, 864], [1680, 1050], [1920, 1080], [2560, 1440]];
const browser = await chromium.launch({ args: ["--disable-3d-apis"] });
const measure = () => {
  const q = (s) => document.querySelector(s), r = (s) => q(s)?.getBoundingClientRect();
  const R = Math.round, R1 = (x) => Math.round(x * 10) / 10;
  const fb = r(".footer__brand"), fl = r(".footer__links"), col = q(".footer .col").getBoundingClientRect();
  const mk = q(".footer__mark img, .footer__mark svg").getBoundingClientRect();
  const lg = [...document.querySelectorAll(".footer__legal > *")].map((e) => { const g = document.createRange(); g.selectNodeContents(e); const rr = g.getClientRects(); return rr[rr.length - 1]?.bottom ?? 0; });
  const nl = q(".footer__news-label"), inner = getComputedStyle(q(".footer__inner"));
  const priv = q(".footer__legal a");
  const t = r(".featured__text"), m = r(".featured__media");
  const fc = [...document.querySelectorAll(".featured__slide:first-child .featured__facts > *")].map((e) => e.getBoundingClientRect().width);
  const h = r(".featured .head"), pg = r(".featured .pager");
  const about = q(".featured__about"), lh = parseFloat(getComputedStyle(about).lineHeight);
  const reel = q(".reel"), first = reel.firstElementChild.getBoundingClientRect(), rc = reel.parentElement.getBoundingClientRect();
  return {
    fCols: getComputedStyle(q(".footer__inner")).gridTemplateColumns.split(" ").length,
    fBrand: `${R(fb.width)}×${R(fb.height)}`, fRatio: R1(fb.height / fb.width * 100) / 100, fLinks: R(fl.width),
    fMarkDy: fb.width < col.width * 0.9 ? R(mk.top + mk.height * 0.6287 - (fb.top + fb.height / 2)) : null,
    fMarkDx: fb.width < col.width * 0.9 ? R(mk.left + mk.width * 0.505 - (fb.left + fb.width / 2)) : null,
    legalDy: R1(Math.abs(lg[0] - lg[1])), legalLines: new Set(lg.map(Math.round)).size,
    newsLines: R(nl.getBoundingClientRect().height / parseFloat(getComputedStyle(nl).lineHeight)),
    privLine: getComputedStyle(priv).textDecorationLine, sides: inner.borderLeftWidth !== "0px" && inner.borderLeftStyle !== "none" ? "framed" : "—",
    featText: R(t.width), featMedia: R(m.width), featH: `${R(t.height)} / ${R(m.height)}`, facts: fc.map(R).join(" / "),
    pagerDx: R(pg.left + pg.width / 2 - (h.left + h.width / 2)), lines: R1(about.clientHeight / lh),
    featBorder: getComputedStyle(q(".featured__media")).borderLeftWidth, mediaPhoto: !!q(".featured__slide:first-child .featured__media img"),
    reelW: R(reel.getBoundingClientRect().width), colW: R(rc.width), firstAt: R(first.left - rc.left),
    factsTop: getComputedStyle(q(".facts")).borderTopWidth
  };
};
const modal = async (page) => page.evaluate(async () => {
  const b = document.querySelector("[data-fact]"); if (!b) return null;
  b.click(); await new Promise((r) => setTimeout(r, 900));
  const box = document.querySelector(".fmodal__box").getBoundingClientRect();
  const out = { modalW: Math.round(box.width), modalH: Math.round(box.height), sheet: Math.round(innerHeight - box.bottom) <= 1 && Math.round(box.width) >= innerWidth - 1 ? "sheet" : "centred", modalTop: Math.round(box.top) };
  document.querySelector("[data-fact-close]").click(); await new Promise((r) => setTimeout(r, 900));
  out.closed = !document.querySelector("dialog").open;
  return out;
});
const out = { old: [], new: [] };
for (const [name, base] of [["old", OLD], ["new", NEW]]) {
  for (const [w, h] of SIZES) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    const page = await ctx.newPage();
    await page.goto(base, { waitUntil: "networkidle" }); await page.waitForTimeout(300);
    const row = { size: `${w}×${h}`, w, h, ...(await page.evaluate(measure)) };
    if (name === "new") Object.assign(row, await modal(page));
    out[name].push(row);
    await ctx.close();
  }
  console.log(name, "done");
}
await browser.close();
writeFileSync(resolve(import.meta.dirname, "../areas-round3.json"), JSON.stringify(out, null, 1));
