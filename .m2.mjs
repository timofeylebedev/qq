import { chromium } from "playwright";
const b = await chromium.launch();
for (const w of [1024, 1280, 1440]) {
const p = await b.newPage({ viewport: { width: w, height: 900 } });
await p.goto("http://localhost:4173/", { waitUntil: "networkidle" });
console.log(w, await p.evaluate(() => { const l = document.querySelector(".footer__news-label"), n = document.querySelector(".footer__news"); const r = document.createRange(); r.selectNodeContents(l); const g=[...document.querySelectorAll('.footer__group')].map(e=>Math.round(e.getBoundingClientRect().height)); return { label: Math.round(r.getBoundingClientRect().width), inner: n.clientWidth - parseFloat(getComputedStyle(n).paddingLeft) - parseFloat(getComputedStyle(n).paddingRight), news: n.offsetHeight, groups: g }; }));
}
await b.close();
