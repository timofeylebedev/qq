import { chromium } from "playwright";
const M = process.argv[2];
const b = await chromium.launch();
for (const [w, h, tag] of [[1280, 900, "w"], [390, 844, "n"]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  const errs = []; p.on("pageerror", (e) => errs.push(e.message)); p.on("console", (m) => m.type() === "error" && errs.push(m.text()));
  await p.goto("file://" + M + "/test.html"); await p.waitForTimeout(400);
  const box = await p.evaluate(() => { const r = document.getElementById("stage").getBoundingClientRect(); scrollTo(0, r.top + scrollY - 120); return null; });
  for (const opt of ["flip", "curl", "slide", "stack", "cut"]) {
    for (const [dir, pp] of [[1, 0.45], [-1, 0.6]]) {
      await p.evaluate(([opt, dir, pp]) => { S.run = null; S.opt = opt; rest(2); begin(2 + dir, dir); S.run.render(pp); }, [opt, dir, pp]);
      await p.waitForTimeout(80);
      const r = await p.evaluate(() => { const e = document.getElementById("stage").getBoundingClientRect(); return { x: e.left, y: e.top, width: e.width, height: e.height }; });
      await p.screenshot({ path: `${M}/t-${tag}-${opt}-${dir > 0 ? "f" : "b"}.png`, clip: { x: Math.max(0, r.x - 40), y: Math.max(0, r.y - 20), width: Math.min(w, r.width + 80), height: Math.min(h - Math.max(0, r.y - 20), r.height + 40) } });
    }
  }
  await p.evaluate(() => { S.run = null; rest(0); });
  // a real drag on the stage
  const r = await p.evaluate(() => { const e = document.getElementById("stage").getBoundingClientRect(); return [e.left + e.width * 0.8, e.top + e.height * 0.5]; });
  await p.mouse.move(r[0], r[1]); await p.mouse.down(); for (let k = 1; k <= 10; k++) await p.mouse.move(r[0] - k * 40, r[1]); await p.mouse.up(); await p.waitForTimeout(1500);
  console.log(tag, "after drag i=", await p.evaluate(() => S.i), "overflow", await p.evaluate(() => document.documentElement.scrollWidth - innerWidth), errs);
  await p.close();
}
await b.close();
