import { chromium } from "playwright";
const b = await chromium.launch(); 
for (const w of [960, 1024, 1100, 1280, 1440, 1600, 1920]) {
  const p = await b.newPage({ viewport: { width: w, height: 900 } });
  await p.goto("http://localhost:4173/", { waitUntil: "networkidle" });
  const r = await p.evaluate(() => {
    const q = (s) => document.querySelector(s).getBoundingClientRect();
    const br = q(".footer__brand"), li = q(".footer__links"), m = q(".footer__mark img"), lg = [...document.querySelectorAll(".footer__legal > *")].map((e) => { const r = e.getBoundingClientRect(); return Math.round(r.bottom); });
    const lab = document.querySelector(".footer__news-label"); const lines = Math.round(lab.getBoundingClientRect().height / parseFloat(getComputedStyle(lab).lineHeight));
    return { brand: [Math.round(br.width), Math.round(br.height)], links: [Math.round(li.width), Math.round(li.height)], markCenterDy: Math.round((m.top + m.height * 0.6287) - (br.top + br.height / 2)), legalBottoms: lg, newsLines: lines };
  });
  console.log(w, JSON.stringify(r)); await p.close();
}
await b.close();
