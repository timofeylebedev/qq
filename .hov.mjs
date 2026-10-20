import { chromium } from "playwright";
const S = process.argv[2];
const b = await chromium.launch({ args: ["--use-gl=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("http://localhost:4182/catalog/", { waitUntil: "networkidle" });
await p.evaluate(() => scrollTo({ top: document.querySelector("[data-grid]").getBoundingClientRect().top + scrollY - 60, behavior: "instant" }));
await p.waitForTimeout(1500);
const out = {};
for (const [k, sel] of [["add", ".card .buy__add"], ["fav", ".card .fav"]]) {
  const e = await p.$(sel); const bb = await e.boundingBox();
  out[k + "Before"] = await e.evaluate((el) => getComputedStyle(el.querySelector("svg")).color + " / bg " + getComputedStyle(el).backgroundColor);
  await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await p.waitForTimeout(600);
  out[k + "Hover"] = await e.evaluate((el) => getComputedStyle(el.querySelector("svg")).color + " / bg " + getComputedStyle(el).backgroundColor);
  await p.screenshot({ path: `${S}/hover-${k}.png`, clip: { x: bb.x - 300, y: bb.y - 120, width: 520, height: 220 } });
}
console.log(out);
await b.close();
