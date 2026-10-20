import { chromium } from "playwright";
const b = await chromium.launch({ args: ["--use-gl=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"] });
const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
await p.goto("http://localhost:4173/", { waitUntil: "networkidle" });
await p.evaluate(() => { const e = document.querySelector(".reel"); scrollTo(0, e.getBoundingClientRect().top + scrollY - 60); });
await p.waitForTimeout(1500);
const S = process.argv[2];
for (const [n, rx, ry] of [["ry+", 0, 0.6], ["rx+", 0.6, 0]]) {
  await p.evaluate(([rx, ry]) => { const st = window.qqPacks.stage; st.onTick = () => { for (const it of st.items) { it.rx = rx; it.ry = ry; it.ox = it.oy = 0; } return false; }; st.invalidate(); }, [rx, ry]);
  await p.waitForTimeout(300);
  await p.screenshot({ path: `${S}/sign-${n}.png`, clip: { x: 0, y: 40, width: 460, height: 500 } });
}
await b.close();
