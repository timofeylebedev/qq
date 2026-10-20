import { chromium } from "playwright";
const S = process.argv[2];
const b = await chromium.launch();
for (const [w, h] of [[1440, 900], [390, 800]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  const errs = []; p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => m.type() === "error" && errs.push(m.text()));
  await p.goto("http://localhost:4173/", { waitUntil: "networkidle" });
  await p.evaluate(() => { const e = document.querySelector(".facts"); scrollTo({ top: e.getBoundingClientRect().top + scrollY - innerHeight / 2, behavior: "instant" }); });
  await p.waitForTimeout(600);
  await p.click("[data-fact='0']");
  for (const t of [0, 150, 300, 700]) { if (t) await p.waitForTimeout(t === 150 ? 150 : t === 300 ? 150 : 400); await p.screenshot({ path: `${S}/m${w}-${t}.png` }); }
  await p.click(".fmodal__step >> nth=1", { force: true }).catch(() => p.evaluate(() => [...document.querySelectorAll("[data-fact-panel]:not([hidden]) .fmodal__step")][1].click()));
  await p.waitForTimeout(800); await p.screenshot({ path: `${S}/m${w}-next.png` });
  await p.keyboard.press("Escape"); await p.waitForTimeout(250); await p.screenshot({ path: `${S}/m${w}-closing.png` });
  await p.waitForTimeout(700);
  console.log(w, await p.evaluate(() => ({ open: document.querySelector("dialog").open, focus: document.activeElement?.dataset.fact, vis: [...document.querySelectorAll("[data-fact] [data-morph]")].map((e) => e.style.visibility).join(",") })), errs);
  await p.close();
}
await b.close();
