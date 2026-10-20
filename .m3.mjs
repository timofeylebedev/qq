import { chromium } from "playwright";
const b = await chromium.launch();
for (const [w, h] of [[390, 844], [1440, 900]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.goto("http://localhost:4182/", { waitUntil: "networkidle" });
  console.log(w, await p.evaluate(async () => {
    const sw0 = innerWidth - document.documentElement.clientWidth;
    document.querySelector("[data-fact]").click(); await new Promise((r) => setTimeout(r, 900));
    const d = document.querySelector("dialog").getBoundingClientRect(), bx = document.querySelector(".fmodal__box").getBoundingClientRect();
    return { scrollbar: sw0, inner: innerWidth, dialogW: d.width, boxW: bx.width, boxBottomGap: Math.round(innerHeight - bx.bottom), navLeft: document.querySelector(".nav").getBoundingClientRect().width };
  }));
}
await b.close();
