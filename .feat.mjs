import { chromium } from "playwright";
const b = await chromium.launch();
for (const w of [320, 768, 960, 1024, 1280, 1440, 1920]) {
  const p = await b.newPage({ viewport: { width: w, height: 900 } });
  await p.goto("http://localhost:4173/", { waitUntil: "networkidle" });
  const r = await p.evaluate(() => {
    const q = (s, root = document) => root.querySelector(s).getBoundingClientRect();
    const out = { slides: [] };
    for (const sl of document.querySelectorAll(".featured__slide")) {
      const t = sl.querySelector(".featured__text").getBoundingClientRect(), m = sl.querySelector(".featured__media").getBoundingClientRect();
      const f = [...sl.querySelectorAll(".featured__facts > *")].map((e) => Math.round(e.getBoundingClientRect().width));
      const ab = sl.querySelector(".featured__about"), intro = sl.querySelector(".featured__intro");
      out.slides.push({ text: [Math.round(t.width), Math.round(t.height)], media: [Math.round(m.width), Math.round(m.height)], facts: f, cut: intro.scrollHeight > intro.clientHeight + 1 || ab.scrollHeight > ab.clientHeight + 1 });
    }
    const h = q(".featured .head"), pg = q(".featured .pager");
    out.pagerOffset = Math.round((pg.left + pg.width / 2) - (h.left + h.width / 2));
    return out;
  });
  console.log(w, "pager Δ", r.pagerOffset, JSON.stringify(r.slides.map((s) => `${s.text}|${s.media}|${s.facts}${s.cut ? "|cut" : ""}`)));
  await p.close();
}
await b.close();
