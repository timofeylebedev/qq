import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
const hitAll = (sel, parts) => p.evaluate(([sel, parts]) => {
  const c = [...document.querySelectorAll(sel)].find((c) => c.getBoundingClientRect().width > 0);
  const out = {};
  for (const [k, s, fx, fy] of parts) { const el = c.querySelector(s); if (!el) { out[k] = "—"; continue; } const r = el.getBoundingClientRect(); const e = document.elementFromPoint(r.left + r.width * fx, r.top + r.height * fy); out[k] = e ? (e.closest("a,button,label,input")?.className || "· " + e.tagName + "." + e.className) : null; }
  return out;
}, [sel, parts]);
const go = (sel) => p.evaluate((sel) => { const c = [...document.querySelectorAll(sel)].find((c) => c.getBoundingClientRect().width > 0); scrollTo({ top: c.getBoundingClientRect().top + scrollY - 200, behavior: "instant" }); }, sel);
for (const url of ["/", "/catalog/", "/coffee/q-berry/"]) {
  await p.goto("http://localhost:4173" + url, { waitUntil: "networkidle" });
  await go("[data-card]"); await p.waitForTimeout(1500);
  console.log(url, JSON.stringify(await hitAll("[data-card]", [["media", ".card__media", .5, .5], ["text", ".card__text", .5, .5], ["title", ".card__title", .2, .5], ["fav", ".fav", .5, .5], ["add", ".buy__add", .5, .5], ["weight", ".weight:last-child", .5, .5]])));
  if (url === "/") { await go(".featured__slide"); await p.waitForTimeout(500);
    console.log("featured", JSON.stringify(await hitAll(".featured__slide", [["about", ".featured__about", .5, .5], ["photo", ".featured__media", .5, .3], ["caption", ".featured__caption", .5, .5], ["pills", ".pills", .5, .5]]))); }
}
await b.close();
