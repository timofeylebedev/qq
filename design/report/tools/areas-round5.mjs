// The areas of round 5 at 25 real screens, on round 4's build (main) and on this one: the hero's title and cells,
// where its lines end, the roast note, the navbar's hover ground, the taste cell, the business gap, the info
// blocks (icon, plus, the modal's step row) and the footer's newsletter halves.
//   node design/report/tools/areas-round5.mjs <old base url> <new base url>   → design/report/areas-round5.json
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const [OLD = "http://localhost:4181/", NEW = "http://localhost:4182/"] = process.argv.slice(2);
const SIZES = [[320, 568], [360, 640], [375, 667], [390, 844], [414, 896], [430, 932], [568, 320], [667, 375], [844, 390], [932, 430],
  [744, 1133], [768, 1024], [820, 1180], [1024, 768], [1024, 1366], [1180, 820], [1280, 720], [1280, 800], [1366, 650], [1366, 768],
  [1440, 900], [1536, 864], [1680, 1050], [1920, 1080], [2560, 1440]];
const browser = await chromium.launch({ args: ["--disable-3d-apis"] });
const measure = () => {
  const q = (s) => document.querySelector(s), R = Math.round, R1 = (x) => Math.round(x * 10) / 10;
  const text = (el) => { const g = document.createRange(); g.selectNodeContents(el); return g.getBoundingClientRect(); };
  const t = q(".hero__title"), g = q(".hero__grid"), tr = t.getBoundingClientRect();
  const rows = [...document.querySelectorAll(".hero__links li")].map((l) => R(l.getBoundingClientRect().height));
  // the right end of the hairline between the first two links: the line itself (round 5) or the li's border
  const li2 = document.querySelectorAll(".hero__links li")[1], lb = li2.getBoundingClientRect(), pse = getComputedStyle(li2, "::before");
  const lineR = pse.content !== "none" && pse.borderTopStyle !== "none" ? lb.right - parseFloat(pse.right) : lb.right;
  // the navbar: the hover ground's air beside the text of «Каскара» (the link's own box, or its ::before)
  const a = document.querySelectorAll(".nav__links--full a")[1], ar = a?.getBoundingClientRect(), ab = a && getComputedStyle(a, "::before");
  const tint = a ? (ab.content !== "none" && ab.position === "absolute" ? ar.width - 2 * parseFloat(ab.left) : ar.width) : null;
  const navAir = a && a.offsetParent ? R1((tint - text(a).width) / 2) : null;
  const tc = q(".featured__facts > .taste"), tcr = tc?.getBoundingClientRect(), dl = tc?.querySelector(".taste__list dt");
  const bh = q(".business .head").getBoundingClientRect(), bc = q(".business__cards").getBoundingClientRect(), bs = q(".business").getBoundingClientRect(), btt = q(".business .head__title").getBoundingClientRect();
  const fo = q(".fact__open").getBoundingClientRect(), pl = q(".fact__more svg").getBoundingClientRect(), ic = q(".fact__icon svg").getBoundingClientRect();
  const nl = q(".footer__news-label").getBoundingClientRect(), nf = q(".footer__news .field").getBoundingClientRect();
  return {
    titlePx: R1(parseFloat(getComputedStyle(t).fontSize)), titleH: R(tr.height), cellsH: R(g.getBoundingClientRect().height), rowH: rows[0],
    leads: R(tr.height) >= R(g.getBoundingClientRect().height) - 1 ? "title" : "rows",
    lineEnd: R(innerWidth - lineR), noteSize: R1(parseFloat(getComputedStyle(q(".hero__note")).fontSize)),
    navAir, tastePad: tc ? `${R(text(dl).left - tcr.left)} / ${R(dl.getBoundingClientRect().top - tcr.top)}` : null,
    bizTop: R(btt.top - bs.top), bizGap: R(bc.top - bh.bottom),
    factIcon: R(ic.width), plusIn: `${R(fo.right - pl.right)} / ${R(pl.top - fo.top)}`,
    newsHalves: nl.right <= nf.left + 1 ? `${R(nl.width)} / ${R(nf.width)}` : "stacked"
  };
};
const modal = async (page) => page.evaluate(async () => {
  const b = document.querySelector("[data-fact]"); if (!b) return {};
  b.click(); await new Promise((r) => setTimeout(r, 1000));
  const step = [...document.querySelectorAll(".fmodal__panel")].find((p) => !p.hidden && !p.hasAttribute("data-off"))?.querySelector(".fmodal__step");
  const out = { stepH: step ? Math.round(step.getBoundingClientRect().height * 10) / 10 : null };
  document.querySelector("[data-fact-close]").click(); await new Promise((r) => setTimeout(r, 1000));
  return out;
});
const out = { old: [], new: [] };
for (const [name, base] of [["old", OLD], ["new", NEW]]) {
  for (const [w, h] of SIZES) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: "no-preference" });
    const page = await ctx.newPage();
    await page.goto(base, { waitUntil: "networkidle" }); await page.waitForTimeout(400);
    const row = { size: `${w}×${h}`, w, h, ...(await page.evaluate(measure)), ...(await modal(page)) };
    out[name].push(row);
    await ctx.close();
  }
  console.log(name, "done");
}
await browser.close();
writeFileSync(resolve(import.meta.dirname, "../areas-round5.json"), JSON.stringify(out, null, 1));
