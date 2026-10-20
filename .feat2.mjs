import { chromium } from "playwright";
const b = await chromium.launch();
for (const w of [960, 1024, 1100, 1280, 1440]) {
  const p = await b.newPage({ viewport: { width: w, height: 900 } });
  await p.goto("http://localhost:4173/", { waitUntil: "networkidle" });
  console.log(w, JSON.stringify(await p.evaluate(() => [...document.querySelectorAll(".featured__text")].map((t) => {
    const a = t.querySelector(".featured__about"), f = t.querySelector(".featured__facts"), lh = parseFloat(getComputedStyle(a).lineHeight);
    return [a.style.getPropertyValue("--lines"), +(a.clientHeight / lh).toFixed(2), Math.round(t.getBoundingClientRect().bottom - parseFloat(getComputedStyle(t).paddingBottom) - f.getBoundingClientRect().bottom)];
  }))));
  await p.close();
}
await b.close();
