import { chromium } from "playwright";
const S = process.argv[2];
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto("http://localhost:4173/", { waitUntil: "networkidle" });
await p.evaluate(() => { const e = document.querySelector(".facts"); scrollTo({ top: e.getBoundingClientRect().top + scrollY - innerHeight / 2, behavior: "instant" }); });
await p.waitForTimeout(500);
await p.evaluate(() => document.querySelector("[data-fact='2']").click());
await p.waitForTimeout(30);
for (const t of [0, 120, 240, 360, 480, 600]) {
  await p.evaluate((t) => document.getAnimations().forEach((a) => { a.pause(); a.currentTime = t; }), t);
  await p.waitForTimeout(60);
  await p.screenshot({ path: `${S}/mm-${t}.png`, clip: { x: 360, y: 150, width: 1080, height: 600 } });
}
await b.close();
