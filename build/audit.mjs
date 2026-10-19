// The pages checked in a real browser at the screen sizes that matter, after `npm run build`:   npm run audit
//
// Pages: home, catalog, two coffees (a single origin and a blend). At each size the page is scrolled through once, so
// every block has come in, then measured. It fails (exit code 1) on:
//   · sideways scroll: the page wider than the screen
//   · text cut off: a line of text outside a box that clips it (rows that scroll sideways are left out), or off screen
//   · text under 12px as drawn
//   · a link or button smaller than 24×24px to tap (WCAG 2.2, 2.5.8)
//   · axe-core (accessibility) at a phone and a desktop size
//   · all of the above but axe with the browser's text made bigger (24px), at a phone and a short laptop
// Sizes: a folded phone (280), phones, a phone sideways, tablets, laptops short and tall, 1920 and 2560.
// design/decisions.json: an exception with an audit entry is not a failure, but is printed under «Kept as designed».
// Browser: Playwright's Chromium, with software WebGL (the 3D packs draw as they would).
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { resolve, extname, join } from "node:path";
import { createRequire } from "node:module";
import { chromium } from "playwright";

const root = resolve(import.meta.dirname, "..");
const dist = join(root, "dist");
const AXE = await readFile(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const PAGES = ["", "catalog/", "coffee/keniya-kisii/", "coffee/q-optimistic/"];
const SIZES = [
  { w: 280, h: 653, touch: true },   { w: 320, h: 568, touch: true, axe: true }, { w: 390, h: 844, touch: true }, { w: 768, h: 1024, touch: true },
  { w: 844, h: 390, touch: true }, { w: 1024, h: 768, touch: true }, { w: 1366, h: 650 }, { w: 1440, h: 900, axe: true },
  { w: 1920, h: 1080 }, { w: 2560, h: 1440 },
  { w: 390, h: 844, touch: true, font: 24 }, { w: 1366, h: 650, font: 24 }
];
const only = process.argv.find((a) => a.startsWith("--sizes="))?.slice(8).split(",");
const DECISIONS = JSON.parse(readFileSync(join(root, "design/decisions.json"), "utf8")).decisions;
const ACCEPTED = DECISIONS.filter((d) => d.audit?.axe).map((d) => ({ rule: d.audit.axe, target: new RegExp(d.audit.target), id: d.id }));

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".webp": "image/webp",
  ".avif": "image/avif", ".png": "image/png", ".jpg": "image/jpeg", ".woff2": "font/woff2", ".json": "application/json" };
if (!existsSync(join(dist, "index.html"))) { console.error("audit: no dist/ — run `npm run build` first"); process.exit(2); }
const server = createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
  const file = join(dist, path.endsWith("/") ? path + "index.html" : path);
  try { const body = await readFile(file); res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" }); res.end(body); }
  catch { res.writeHead(404); res.end(); }
}).listen(0);
const base = `http://localhost:${server.address().port}/`;

function measure() {
  const vw = document.documentElement.clientWidth;
  const name = (e) => e.tagName.toLowerCase() + (typeof e.className === "string" && e.className ? "." + e.className.trim().split(/\s+/)[0] : "");
  const path = (e) => { const p = []; for (let x = e; x && x !== document.body && p.length < 3; x = x.parentElement) p.unshift(name(x)); return p.join(" > "); };
  const shown = (e) => { for (let x = e; x; x = x.parentElement) { const s = getComputedStyle(x); if (s.display === "none" || s.visibility === "hidden" || +s.opacity === 0) return false; } const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const skip = (e) => e.closest(".sprite, .sr, [data-slider], .tabs, .menu, .toast, .skip");
  const out = { sideways: document.documentElement.scrollWidth - vw, clipped: [], small: [], targets: [] };
  for (const e of document.querySelectorAll("h1, h2, h3, p, a, button, dt, dd, span, li, label, output, select, summary")) {
    if (skip(e) || !e.textContent.trim() || !shown(e) || e.children.length > 3) continue;
    // the box of its visible text (text for screen readers only, .sr, is left out)
    const rects = [];
    const tw = document.createTreeWalker(e, NodeFilter.SHOW_TEXT);
    for (let n; (n = tw.nextNode()); ) { if (!n.textContent.trim() || n.parentElement.closest(".sr")) continue; const r = document.createRange(); r.selectNodeContents(n); rects.push(r.getBoundingClientRect()); }
    if (!rects.length) continue;
    const t = { left: Math.min(...rects.map((q) => q.left)), right: Math.max(...rects.map((q) => q.right)), top: Math.min(...rects.map((q) => q.top)), bottom: Math.max(...rects.map((q) => q.bottom)) };
    if (t.right > vw + 1 || t.left < -1) out.clipped.push(`${path(e)} past the screen by ${Math.round(Math.max(t.right - vw, -t.left))}px`);
    for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) {
      const s = getComputedStyle(a);
      if (!/(hidden|clip)/.test(s.overflowX + s.overflowY)) continue;
      if (s.webkitLineClamp && s.webkitLineClamp !== "none") break;          // clamped on purpose (card text)
      const q = a.getBoundingClientRect(), over = Math.max(q.left - t.left, t.right - q.right, q.top - t.top, t.bottom - q.bottom);
      if (over > 1.5) out.clipped.push(`${path(e)} cut by ${name(a)} by ${Math.round(over)}px`);
      break;
    }
  }
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n; (n = walker.nextNode()); ) {
    const e = n.parentElement;
    if (!e || !n.textContent.trim() || e.closest(".sprite, script, style, .sr") || !shown(e)) continue;
    const px = parseFloat(getComputedStyle(e).fontSize);
    if (px < 11.95) out.small.push(`${path(e)} «${n.textContent.trim().slice(0, 24)}» ${px.toFixed(1)}px`);
  }
  for (const e of document.querySelectorAll("a[href], button, select, summary, input")) {
    if (!shown(e) || e.closest(".skip, .sr") || (e.tagName === "INPUT" && /radio|checkbox/.test(e.type))) continue;
    const r = e.getBoundingClientRect();
    const after = getComputedStyle(e, "::after");
    if (after.content !== "none" && after.position === "absolute") continue;   // a link stretched over its card
    if (Math.min(r.width, r.height) < 23.5) out.targets.push(`${path(e)} ${Math.round(r.width)}×${Math.round(r.height)}px`);
  }
  return out;
}

const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const problems = [], kept = new Map(), summary = [];
const sizes = SIZES.filter((s) => !only || only.includes(`${s.w}x${s.h}${s.font ? "@" + s.font : ""}`));
for (const s of sizes) {
  const label = `${s.w}×${s.h}${s.font ? ` text ${s.font}px` : ""}`;
  const ctx = await browser.newContext({ viewport: { width: s.w, height: s.h }, isMobile: !!s.touch, hasTouch: !!s.touch, deviceScaleFactor: 1, bypassCSP: true });
  let fails = 0;
  for (const pagePath of PAGES) {
    const page = await ctx.newPage();
    const errors = []; page.on("pageerror", (e) => errors.push(e.message));
    if (s.font) { const c = await ctx.newCDPSession(page); await c.send("Page.enable"); await c.send("Page.setFontSizes", { fontSizes: { standard: s.font, fixed: s.font } }); }
    await page.goto(base + pagePath, { waitUntil: "networkidle" });
    const H = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < H; y += s.h * 0.8) { await page.evaluate((y) => scrollTo(0, y), y); await page.waitForTimeout(60); }
    await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(300);
    const m = await page.evaluate(measure);
    const where = `${label} /${pagePath}`;
    const add = (kind, list) => list.forEach((x) => { problems.push(`${where}: ${kind}: ${x}`); fails++; });
    if (m.sideways > 0) add("sideways scroll", [`${m.sideways}px`]);
    add("text cut", [...new Set(m.clipped)].slice(0, 6));
    add("text < 12px", [...new Set(m.small)].slice(0, 6));
    add("tap target < 24px", [...new Set(m.targets)].slice(0, 6));
    add("script error", errors);
    if (s.axe || s.font) {
      await page.addScriptTag({ content: AXE });
      const r = await page.evaluate(async () => (await axe.run(document, { resultTypes: ["violations"] })).violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target.join(" ")) })));
      for (const v of r) {
        const left = v.nodes.filter((n) => { const a = ACCEPTED.find((x) => x.rule === v.id && x.target.test(n)); if (a) { if (!kept.has(a.id)) kept.set(a.id, new Set()); kept.get(a.id).add(`${label}: ${n}`); } return !a; });
        if (left.length) add(`axe ${v.id}`, [left.slice(0, 4).join(", ")]);
      }
    }
    await page.close();
  }
  summary.push(`${fails ? "✗" : "✓"} ${label}${fails ? ` — ${fails} problem${fails > 1 ? "s" : ""}` : ""}`);
  await ctx.close();
}
await browser.close(); server.close();

console.log(summary.join("\n"));
if (problems.length) console.log("\n" + problems.join("\n"));
if (kept.size) { console.log("\nKept as designed (design/decisions.json):"); for (const [id, set] of kept) console.log(`  ${id}: ${[...set].slice(0, 4).join("; ")}`); }
console.log(`\n${problems.length ? problems.length + " problems" : "clean"} — ${PAGES.length} pages × ${sizes.length} sizes`);
process.exitCode = problems.length ? 1 : 0;
