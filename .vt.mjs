import { chromium } from "playwright";
const S = process.argv[2];
const b = await chromium.launch({ args: ["--use-gl=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"] });
const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
const p = await ctx.newPage();
const errs = []; p.on("pageerror", (e) => errs.push(e.message));
await p.goto("http://localhost:4173/catalog/", { waitUntil: "networkidle" });
await p.waitForTimeout(1500);
// freeze the transition as soon as the new page has it
await ctx.addInitScript(() => {
  addEventListener("pagereveal", (e) => {
    window.__vt = !!e.viewTransition;
    if (e.viewTransition) e.viewTransition.ready.then(() => { window.__anims = document.getAnimations(); for (const a of window.__anims) a.pause(); });
  });
});
const card = await p.$("[data-card].card--light");
const slug = await card.getAttribute("data-slug");
await card.$eval(".card__link", (a) => a.click());
await p.waitForURL(/coffee/);
await p.waitForFunction(() => window.__anims || window.__vt === false, null, { timeout: 5000 }).catch(() => {});
const info = await p.evaluate(() => ({ vt: window.__vt, n: window.__anims?.length, names: window.__anims?.map((a) => a.effect?.pseudoElement).filter(Boolean).slice(0, 12) }));
console.log(slug, JSON.stringify(info), errs);
for (const t of [0, 150, 300, 600]) {
  await p.evaluate((t) => window.__anims?.forEach((a) => { a.currentTime = t; }), t);
  await p.waitForTimeout(80);
  await p.screenshot({ path: `${S}/vt-${t}.png` });
}
await b.close();
