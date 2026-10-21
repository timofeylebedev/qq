// The pages checked in a real browser at the screen sizes that matter, after `npm run build`:   npm run audit
//
// Pages: home, catalog, two coffees (a single origin and a blend), and the pages of round 4: the shop (the bag and the
// favourites with a bag and hearts put into the browser first, the three steps of the checkout), the account (profile,
// orders, one order, purchases, settings, the beans dialog open) and the information pages. At each size the page is scrolled through once, so
// every block has come in, then measured. It fails (exit code 1) on:
//   · sideways scroll: the page wider than the screen
//   · text cut off: a line of text outside a box that clips it (rows that scroll sideways and text ending in an ellipsis
//     are left out), or off screen
//   · text under 12px as drawn
//   · a link or button smaller than 24×24px to tap (WCAG 2.2, 2.5.8)
//   · the navbar: its sections running into the logo or the tools (each step of media.css must fit its row)
//   · the hero's countdown: the day row, the digits (or the date) not as wide as a one-line caption, or a caption on two
//     lines wider than the digits (decision countdown-as-caption)
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
const PAGES = ["", "catalog/", "coffee/keniya-kisii/", "coffee/q-optimistic/",
  "cart/", "favourites/", "checkout/", "checkout/details/", "checkout/delivery/",
  "account/", "account/beans/", "account/orders/", "account/orders/433273/", "account/purchases/", "account/settings/",
  "business/", "faq/", "delivery/", "contacts/", "privacy/", "about/"];
// what a visitor has put into this browser before the shop pages are measured: a bag with a photo coffee, a pack coffee,
// a big quantity and a line put aside; favourites with photos and packs
const STATE = {
  "qq-bag": [{ slug: "braziliya-santa-mariya", weight: "200 г", qty: 1 }, { slug: "vetnam-kua-mon", weight: "1 кг", qty: 12 },
    { slug: "kolumbiya-chayna-alta", weight: "200 г", grind: "Фильтр", roast: "Фильтр", qty: 1 }, { slug: "efiopiya-bekele", weight: "200 г", qty: 1, later: true }],
  "qq-fav": ["q-optimistic", "keniya-kisii", "kolumbiya-chayna-alta", "efiopiya-bekele"]
};
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
  const skip = (e) => e.closest(".sprite, .sr, [data-slider], .tabs, .subtabs, .menu, .toast, .skip");
  const out = { sideways: document.documentElement.scrollWidth - vw, clipped: [], small: [], targets: [] };
  for (const e of document.querySelectorAll("h1, h2, h3, p, a, button, dt, dd, span, li, label, output, select, summary")) {
    if (skip(e) || !e.textContent.trim() || !shown(e) || e.children.length > 3) continue;
    // the box of its visible text (text for screen readers only, .sr, is left out)
    const rects = [];
    const tw = document.createTreeWalker(e, NodeFilter.SHOW_TEXT);
    // (text that ends in an ellipsis is cut on purpose: its range runs past its box, and is left out)
    const ellipsed = (x) => { for (; x && x !== e.parentElement; x = x.parentElement) { const s = getComputedStyle(x); if (s.textOverflow === "ellipsis" && s.overflowX !== "visible") return true; } return false; };
    for (let n; (n = tw.nextNode()); ) { if (!n.textContent.trim() || n.parentElement.closest(".sr") || ellipsed(n.parentElement)) continue; const r = document.createRange(); r.selectNodeContents(n); rects.push(r.getBoundingClientRect()); }
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
  out.bars = [];
  const vis = (q) => [...document.querySelectorAll(q)].find(shown);
  const logo = vis(".nav__logo"), links = vis(".nav__links"), tools = vis(".nav__tools");
  if (links && logo && tools) {
    const a = logo.getBoundingClientRect(), b = links.querySelector("ul").getBoundingClientRect(), c = tools.getBoundingClientRect();
    if (b.left < a.right + 8 || b.right > c.left - 8) out.bars.push(`navbar: the sections (${Math.round(b.left)}–${Math.round(b.right)}) run into the logo or the tools (${Math.round(a.right)}, ${Math.round(c.left)})`);
  }
  const cap = vis(".hero__caption");
  if (cap) {
    const tw = (e) => { const r = document.createRange(); r.selectNodeContents(e); return r.getBoundingClientRect().width; };
    // the caption on one line: the digits (or the date) and the day row as wide as it; on two lines (a narrow cell),
    // the caption within the digits' width
    const lines = new Set([...(() => { const r = document.createRange(); r.selectNodeContents(cap); return r.getClientRects(); })()].map((x) => Math.round(x.top))).size;
    const w = tw(cap), dial = vis(".hero__count .digits") || vis(".hero__date"), now = vis(".hero__now");
    const dw = dial.getBoundingClientRect().width;
    const side = getComputedStyle(cap.parentElement).gridTemplateColumns.split(" ").length > 1;   // the parts side by side (M → L)
    if (lines === 1 && !side) for (const [n, x] of [["digits", dw], ["day row", now.getBoundingClientRect().width]]) { if (Math.abs(x - w) > w * 0.04) out.bars.push(`hero: the ${n} ${Math.round(x)}px, the caption ${Math.round(w)}px`); }
    if (lines > 1 && w > dw + 1 && !side) out.bars.push(`hero: the caption ${Math.round(w)}px on ${lines} lines, wider than the digits ${Math.round(dw)}px`);
  }
  return out;
}

const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const problems = [], kept = new Map(), summary = [];
const sizes = SIZES.filter((s) => !only || only.includes(`${s.w}x${s.h}${s.font ? "@" + s.font : ""}`));
for (const s of sizes) {
  const label = `${s.w}×${s.h}${s.font ? ` text ${s.font}px` : ""}`;
  const ctx = await browser.newContext({ viewport: { width: s.w, height: s.h }, isMobile: !!s.touch, hasTouch: !!s.touch, deviceScaleFactor: 1, bypassCSP: true });
  await ctx.addInitScript((st) => { if (!localStorage.getItem("qq-bag")) for (const [k, v] of Object.entries(st)) localStorage.setItem(k, JSON.stringify(v)); }, STATE);
  let fails = 0;
  for (const pagePath of PAGES) {
    const page = await ctx.newPage();
    const errors = []; page.on("pageerror", (e) => errors.push(e.message));
    if (s.font) { const c = await ctx.newCDPSession(page); await c.send("Page.enable"); await c.send("Page.setFontSizes", { fontSizes: { standard: s.font, fixed: s.font } }); }
    await page.goto(base + pagePath, { waitUntil: "networkidle" });
    const H = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < H; y += s.h * 0.8) { await page.evaluate((y) => scrollTo(0, y), y); await page.waitForTimeout(60); }
    await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(900);   // the bars cross over to the first ground on --t-move
    const m = await page.evaluate(measure);
    const where = `${label} /${pagePath}`;
    const add = (kind, list) => list.forEach((x) => { problems.push(`${where}: ${kind}: ${x}`); fails++; });
    if (m.sideways > 0) add("sideways scroll", [`${m.sideways}px`]);
    add("text cut", [...new Set(m.clipped)].slice(0, 6));
    add("text < 12px", [...new Set(m.small)].slice(0, 6));
    add("tap target < 24px", [...new Set(m.targets)].slice(0, 6));
    add("bar", m.bars);
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
