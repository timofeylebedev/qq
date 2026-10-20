import { chromium } from "playwright";
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
await p.goto("http://localhost:4173/", { waitUntil: "networkidle" });
console.log(await p.evaluate(() => { const r = document.querySelector(".reel"); const cs = getComputedStyle(r); return { gac: cs.gridAutoColumns, disp: cs.display, flow: cs.gridAutoFlow, kids: [...r.children].map((e) => [e.tagName, e.className, e.getBoundingClientRect().width, getComputedStyle(e).display]) , sw: r.scrollWidth}; }));
await b.close();
