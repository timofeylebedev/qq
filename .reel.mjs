import { chromium } from "playwright";
const S = process.argv[2];
const b = await chromium.launch({ args: ["--use-gl=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"] });
const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
await p.goto("http://localhost:4173/", { waitUntil: "networkidle" });
await p.waitForTimeout(800);
// scroll to the reel: the cards rise
const y = await p.evaluate(() => document.querySelector(".reel").getBoundingClientRect().top + scrollY - 120);
await p.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), y);
for (const t of [120, 350, 1600]) { await p.waitForTimeout(t === 120 ? 120 : t - 120); await p.screenshot({ path: `${S}/rise-${t}.png` }); }
const info = await p.evaluate(() => { const r = document.querySelector(".reel"); const c = [...r.children].map((e) => Math.round(e.getBoundingClientRect().left)); return { w: r.getBoundingClientRect().width, left: r.getBoundingClientRect().left, cards: c, pad: getComputedStyle(r).paddingLeft, docW: document.documentElement.scrollWidth }; });
console.log(JSON.stringify(info));
// slide: next arrow
await p.click('[data-next="recs"]');
for (const t of [150, 300, 1500]) { await p.waitForTimeout(t === 150 ? 150 : t - 150); await p.screenshot({ path: `${S}/slide-${t}.png` }); }
console.log(JSON.stringify(await p.evaluate(() => [...document.querySelector(".reel").children].map((e) => [Math.round(e.getBoundingClientRect().left), "out" in e.dataset]))));
await b.close();
