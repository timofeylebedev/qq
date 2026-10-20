// The areas of round 2 (the navbar, the hero) at 25 real screens, on the previous build and on this one.
//   node design/report/tools/areas-round2.mjs <old base url> <new base url>   → design/report/areas-round2.json
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
  const shown = (s) => { const e = q(s); return !!e && getComputedStyle(e).display !== "none" && e.getBoundingClientRect().width > 0; };
  const tw = (e) => { const g = document.createRange(); g.selectNodeContents(e); return Math.round(g.getBoundingClientRect().width); };
  const hero = r(".hero"), links = [...document.querySelectorAll(".hero__links li")].map((l) => l.getBoundingClientRect());
  const parts = [...q(".hero__roast").children].filter((c) => !c.hidden && !c.matches(".hero__note"));
  const centres = parts.map((p) => { const b = p.getBoundingClientRect(); return b.top + b.height / 2; });
  const cols = getComputedStyle(q(".hero__grid")).gridTemplateColumns.split(" ").length;
  const align = cols > 1 && links.length === 3 && parts.length === 3 ? Math.round(Math.max(...links.map((l, i) => Math.abs(l.top + l.height / 2 - centres[i])))) : null;
  const title = q(".hero__title"), lh = parseFloat(getComputedStyle(title).lineHeight) || parseFloat(getComputedStyle(title).fontSize) * 1.05;
  const tools = [...document.querySelectorAll(".nav__tools > *")].filter((e) => getComputedStyle(e).display !== "none" && e.getBoundingClientRect().width > 0);
  const step = shown(".tabbar") ? "tab bar" : shown(".nav__burger") ? "burger" : shown(".nav__links--short") ? "short" : "every section";
  const lastIcon = tools.length ? tools[tools.length - 1].querySelector("svg").getBoundingClientRect().right : 0;
  const col = r(".col");
  return {
    heroH: Math.round(hero.height), peek: Math.round(innerHeight - (shown(".tabbar") ? r(".tabbar").height : 0) - hero.bottom),
    titleLines: Math.round((title.getBoundingClientRect().height - (parseFloat(getComputedStyle(title).paddingTop) + parseFloat(getComputedStyle(title).paddingBottom))) / lh),
    digits: tw(q(".hero__count .digits")), caption: tw(q(".hero__caption")), rowH: Math.round(links[0].height), align,
    cols, step, icons: tools.length, logoX: Math.round(q(".nav__logo svg").getBoundingClientRect().left - col.left), iconX: Math.round(col.right - lastIcon)
  };
};
const out = { old: [], new: [] };
for (const [name, base] of [["old", OLD], ["new", NEW]]) {
  for (const [w, h] of SIZES) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    const page = await ctx.newPage();
    await page.goto(base, { waitUntil: "networkidle" }); await page.addStyleTag({ content: "*{animation:none!important;transition:none!important}" }); await page.waitForTimeout(300);
    out[name].push({ size: `${w}×${h}`, w, h, ...(await page.evaluate(measure)) });
    await ctx.close();
  }
  console.log(name, "done");
}
await browser.close();
writeFileSync(resolve(import.meta.dirname, "../areas-round2.json"), JSON.stringify(out, null, 1));
