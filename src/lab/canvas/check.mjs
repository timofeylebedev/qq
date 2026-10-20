// The component canvas, checked in a real browser:   npm run canvas:check
//
// Starts the dev server (which writes the canvas), opens /lab/canvas/ in Playwright's Chromium with software WebGL,
// and checks what src/lab/canvas promises: every variant of variants.mjs is on the canvas, groups look alike and
// never overlap, the camera pans, zooms, fits, resets, follows the keyboard and is saved, components keep their
// clicks, keys, selection and scrolling at any zoom, links stay in the canvas, nothing leaves localhost, and the
// components' source is unchanged. Each check prints ✓ or ✗; any ✗ exits 1.
import { createServer } from "vite";
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { groups, OMITTED } from "./variants.mjs";
import { data, write } from "./page.mjs";

const root = resolve(import.meta.dirname, "../../..");
const results = [];
const check = (name, ok, detail = "") => { results.push({ name, ok: !!ok, detail }); console.log(`${ok ? "✓" : "✗"} ${name}${detail ? " — " + detail : ""}`); };
const near = (a, b, d = 1.5) => Math.abs(a - b) <= d;

// what the component sources are before the canvas runs (git's view of them, changes included)
const SOURCES = ["src/templates", "src/scripts", "src/styles", "src/assets", "build/pages.mjs", "data"];
const sourceState = () => execFileSync("git", ["diff", "HEAD", "--", ...SOURCES], { cwd: root, encoding: "utf8" }) + execFileSync("git", ["status", "--porcelain", "--", ...SOURCES], { cwd: root, encoding: "utf8" });
const SOURCE_BEFORE = sourceState();

try { write(); check("The canvas is written from the templates", true); }
catch (e) { check("The canvas is written from the templates", false, e.message); process.exit(1); }

const server = await createServer({ configFile: resolve(root, "vite.config.js"), server: { port: 0, strictPort: false, watch: null }, logLevel: "error" });
await server.listen();
const base = server.resolvedUrls.local[0];
const URL_ = new URL("lab/canvas/", base).href;
const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });

async function open(opts = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...opts.context });
  if (opts.init) await context.addInitScript(opts.init);
  // errors that never reach the console (a ResizeObserver loop, an uncaught error inside a frame) are logged there
  await context.addInitScript(() => addEventListener("error", (e) => console.error(`window error: ${e.message} (${location.pathname})`)));
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const errors = [], requests = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => requests.push(r.url()));
  let loaded = Date.now();
  page.on("load", () => (loaded = Date.now()));
  await page.goto(URL_, { waitUntil: "load" });
  for (let t = 0; t < 40 && Date.now() - loaded < 1500; t++) await page.waitForTimeout(250);   // a fresh dev server may reload the page once
  await page.waitForFunction(() => window.qqCanvas && document.querySelector("[data-cv-stage]")?.hasAttribute("data-cv-ready"));
  await page.waitForTimeout(opts.settle ?? 3500);
  return { context, page, errors, requests };
}
const cam = (page) => page.evaluate(() => qqCanvas.camera);
const frame = (page) => page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
// put a group (or an element) at the top left at a zoom
const showGroup = (page, id, z = 1, dx = 40, dy = 80) => page.evaluate(({ id, z, dx, dy }) => {
  const g = document.querySelector(`[data-cv-group="${id}"]`);
  qqCanvas.set({ z, x: dx - g.offsetLeft * z, y: dy - g.offsetTop * z });
}, { id, z, dx, dy }).then(() => frame(page));
const centreOf = (page, sel, i = 0) => page.evaluate(({ sel, i }) => { const r = document.querySelectorAll(sel)[i].getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }, { sel, i });
// a point on empty canvas: in a gap between groups, inside the screen
const emptyPoint = (page) => page.evaluate(() => {
  for (let y = 120; y < innerHeight - 20; y += 23) for (let x = 20; x < innerWidth - 20; x += 23) {
    const e = document.elementFromPoint(x, y);
    if (e && e.matches("[data-cv-shell]")) return [x, y];
  }
  return null;
});

try {
  const { context, page, errors, requests } = await open();
  const d = data(), G = groups(d);

  // ── it mounts, and every variant is there ──
  check("The canvas mounts", await page.evaluate(() => !!window.qqCanvas && document.querySelectorAll("[data-cv-group]").length > 0));
  const twice = await page.evaluate(() => { const seen = new Map(); for (const e of document.querySelectorAll("[id]")) seen.set(e.id, (seen.get(e.id) || 0) + 1); return [...seen].filter(([, n]) => n > 1).map(([id]) => id); });
  check("No id appears twice (labels, toggles and links find their own element)", !twice.length, twice.join(", "));
  const dom = await page.evaluate(() => Object.fromEntries([...document.querySelectorAll("[data-cv-group]")].map((g) => [g.dataset.cvGroup, [...g.querySelectorAll("[data-cv-slot]")].map((s) => {
    const el = s.firstElementChild, r = el?.getBoundingClientRect();
    return { w: r?.width || 0, h: r?.height || 0, frame: !!s.querySelector("iframe") };
  })])));
  const missing = [];
  for (const g of G) {
    if (!dom[g.id]) { missing.push(`${g.id} (no group)`); continue; }
    if (dom[g.id].length !== g.slots.length) missing.push(`${g.id}: ${dom[g.id].length} of ${g.slots.length} slots`);
    dom[g.id].forEach((s, i) => { if (!s.w || !s.h) missing.push(`${g.id} slot ${i + 1} is empty`); });
  }
  check("Every listed variant is on the canvas", !missing.length, missing.length ? missing.join("; ") : `${G.length} groups, ${G.reduce((n, g) => n + g.slots.length, 0)} slots; ${OMITTED.length} omissions listed`);

  // the frames load once they come near the screen: visit each
  const frameGroups = G.filter((g) => g.slots.some((s) => s.frame)).map((g) => g.id);
  const loaded = (id) => page.evaluate((id) => [...document.querySelectorAll(`[data-cv-group="${id}"] iframe`)].every((f) => { try { return f.contentDocument?.readyState === "complete" && f.contentDocument.body?.children.length > 0; } catch { return false; } }), id);
  for (const id of frameGroups) {
    await showGroup(page, id, 0.3);
    for (let t = 0; t < 40 && !(await loaded(id)); t++) await page.waitForTimeout(250);
  }
  const frames = await page.evaluate(() => [...document.querySelectorAll("[data-cv-frame]")].map((f) => { try { return f.contentDocument?.body?.children.length > 0 && f.contentWindow.innerWidth > 0; } catch { return false; } }));
  check("Every preview document loads", frames.length && frames.every(Boolean), `${frames.filter(Boolean).length} of ${frames.length} frames`);

  // ── how groups look ──
  await page.evaluate(() => qqCanvas.reset()); await frame(page);
  const looks = await page.evaluate(() => [...document.querySelectorAll("[data-cv-group]")].map((g) => {
    const box = g.querySelector(".cv-group__box"), title = g.querySelector(".cv-group__title"), s = getComputedStyle(box), z = qqCanvas.camera.z;
    return { id: g.dataset.cvGroup, style: s.borderTopStyle, width: s.borderTopWidth, pad: s.paddingTop, gap: (box.getBoundingClientRect().top - title.getBoundingClientRect().bottom) / z, colour: s.borderTopColor, titleColour: getComputedStyle(title).color, titleOpacity: getComputedStyle(title).opacity };
  }));
  const odd = looks.filter((l) => l.style !== "dashed" || l.width !== "1px" || l.pad !== looks[0].pad || l.colour !== looks[0].colour || !near(l.gap, 8, 0.6) || l.titleColour !== looks[0].titleColour || l.titleOpacity !== "1");
  check("Groups: same padding, thin dashed border, plain title 8px above", !odd.length, odd.length ? odd.map((o) => o.id).join(", ") : `border ${looks[0].colour}, title ${looks[0].titleColour}`);

  // comparisons that are not about style keep one style and one text
  const same = await page.evaluate(() => {
    const out = [];
    for (const g of document.querySelectorAll('[data-cv-group]:not([data-cv-compares="—"])')) {
      const id = g.dataset.cvGroup, cards = [...g.querySelectorAll(".card")];
      if (cards.length && id !== "card-tone" && new Set(cards.map((c) => c.classList.contains("card--dark"))).size > 1) out.push(`${id}: two tones`);
      if (cards.length && id !== "card-name" && new Set(cards.map((c) => c.querySelector(".card__title").textContent)).size > 1) out.push(`${id}: different names`);
      const heads = [...g.querySelectorAll(".head__title")];
      if (id === "head-layout" && new Set(heads.map((h) => h.textContent)).size > 1) out.push(`${id}: different titles`);
      const srcs = [...g.querySelectorAll("iframe")].map((f) => f.getAttribute("src"));
      if (id !== "nav-theme" && srcs.length > 1 && new Set(srcs).size > 1) out.push(`${id}: different documents`);
    }
    return out;
  });
  check("Non-style comparisons use one style (and the same text)", !same.length, same.join("; "));

  // ── no overlap, after expanding a block and resizing the window ──
  const overlaps = () => page.evaluate(() => {
    const b = [...document.querySelectorAll("[data-cv-group]")].map((g) => ({ id: g.dataset.cvGroup, l: g.offsetLeft, t: g.offsetTop, r: g.offsetLeft + g.offsetWidth, b: g.offsetTop + g.offsetHeight }));
    const bad = [];
    for (let i = 0; i < b.length; i++) for (let j = i + 1; j < b.length; j++) if (b[i].l < b[j].r && b[j].l < b[i].r && b[i].t < b[j].b && b[j].t < b[i].b) bad.push(`${b[i].id}/${b[j].id}`);
    return bad;
  });
  check("Groups don't overlap", !(await overlaps()).length, (await overlaps()).join(", "));
  await showGroup(page, "facts", 0.9);
  const tops = () => page.evaluate(() => [...document.querySelectorAll("[data-cv-group]")].map((g) => g.offsetTop).join());
  const before = await page.evaluate(() => document.querySelector('[data-cv-group="facts"]').offsetHeight), tops0 = await tops();
  // the groups under it in its own columns (it may be the last there: then nothing has to move)
  const under = await page.evaluate(() => { const f = document.querySelector('[data-cv-group="facts"]'); return [...document.querySelectorAll("[data-cv-group]")].filter((g) => g !== f && g.offsetTop > f.offsetTop && g.offsetLeft < f.offsetLeft + f.offsetWidth && f.offsetLeft < g.offsetLeft + g.offsetWidth).length; });
  for (let i = 0; i < 3; i++) await page.click(`[data-cv-group="facts"] .fact__more >> nth=${i}`);
  await page.waitForTimeout(400);
  const after = await page.evaluate(() => document.querySelector('[data-cv-group="facts"]').offsetHeight);
  const below100 = await overlaps();
  await page.evaluate(() => qqCanvas.set({ ...qqCanvas.camera, z: 1 })); await page.waitForTimeout(400);
  check("A block that expands never overlaps (at its zoom and at 100%)", after > before && !below100.length && !(await overlaps()).length, `${under} groups under it in its columns${(await tops()) !== tops0 ? ", moved down" : ", far enough below to stay"}; facts ${before} → ${after}px${below100.length ? "; overlaps " + below100.join(", ") : ""}`);
  await page.setViewportSize({ width: 1024, height: 700 }); await page.waitForTimeout(800);
  const resized = await overlaps();
  await page.setViewportSize({ width: 1440, height: 900 }); await page.waitForTimeout(1500);
  check("No overlap after the window resizes", !resized.length && !(await overlaps()).length, resized.join(", "));

  // ── fit, reset, bounds ──
  await page.click("[data-cv-fit]"); await page.waitForTimeout(200);
  const inView = await page.evaluate(() => [...document.querySelectorAll("[data-cv-group]")].every((g) => { const r = g.getBoundingClientRect(); return r.left >= -1 && r.top >= -1 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1; }));
  check("Fit all shows every group", inView, `zoom ${(await cam(page)).z.toFixed(3)}`);
  const layoutBefore = await page.evaluate(() => [...document.querySelectorAll("[data-cv-group]")].map((g) => g.style.left + g.style.top).join());
  await page.click("[data-cv-fit]"); await frame(page);
  check("Fitting never moves groups", layoutBefore === await page.evaluate(() => [...document.querySelectorAll("[data-cv-group]")].map((g) => g.style.left + g.style.top).join()));
  await page.click("[data-cv-reset]"); await frame(page);
  const r0 = await cam(page);
  check("Reset view: 100% at the start", r0.z === 1 && r0.x === 0 && r0.y === 0, JSON.stringify(r0));
  await page.evaluate(() => qqCanvas.set({ x: 1e9, y: -1e9, z: 99 })); await frame(page);
  const lost = await page.evaluate(() => { const r = document.querySelector("[data-cv-world]").getBoundingClientRect(), c = qqCanvas.camera; return { z: c.z, visible: Math.min(r.right, innerWidth) - Math.max(r.left, 0) >= 79 && Math.min(r.bottom, innerHeight) - Math.max(r.top, 0) >= 79 }; });
  const ui = await page.evaluate(() => { const r = document.querySelector("[data-cv-ui]").getBoundingClientRect(); return r.top >= 0 && r.right <= innerWidth; });
  check("Camera stays in bounds (zoom 2–400%, some of the world on screen)", lost.z <= 4 && lost.visible, JSON.stringify(lost));
  const names = await page.evaluate(() => [...document.querySelectorAll("[data-cv-ui] button")].map((b) => b.getAttribute("aria-label")));
  check("Fit and reset are named buttons, on screen however lost the view", ui && names.every(Boolean) && names.includes("Fit all") && names.includes("Reset view"), names.join(", "));

  // ── wheel and trackpad ──
  await showGroup(page, "card-tone", 1);
  let p = await emptyPoint(page);
  const worldAt = (q) => page.evaluate(([x, y]) => { const c = qqCanvas.camera; return [(x - c.x) / c.z, (y - c.y) / c.z]; }, q);
  const w0 = await worldAt(p);
  await page.mouse.move(...p); await page.keyboard.down("Control"); await page.mouse.wheel(0, -200); await page.keyboard.up("Control"); await frame(page);
  const c1 = await cam(page), w1 = await worldAt(p);
  check("Ctrl + wheel zooms around the pointer", c1.z > 1 && near(w0[0], w1[0], 1) && near(w0[1], w1[1], 1), `zoom ${c1.z.toFixed(2)}`);
  const c2a = await cam(page); await page.mouse.wheel(120, 240); await frame(page); const c2 = await cam(page);
  check("The wheel pans", near(c2.x, c2a.x - 120) && near(c2.y, c2a.y - 240));

  // nested scrolling: the reel takes sideways scrolling; up/down over it pans
  await showGroup(page, "recs", 0.8);
  const reel = await centreOf(page, '[data-cv-group="recs"] .reel');
  await page.mouse.move(...reel);
  const r1 = await cam(page); await page.mouse.wheel(400, 0); await page.waitForTimeout(600);
  const sl = await page.evaluate(() => document.querySelector('[data-cv-group="recs"] .reel').scrollLeft), r2 = await cam(page);
  check("A row that scrolls sideways keeps the wheel", sl > 0 && r1.x === r2.x, `scrollLeft ${Math.round(sl)}`);
  await page.mouse.wheel(0, 100); await frame(page);
  check("… and up/down over it still pans the canvas", (await cam(page)).y < r2.y);
  const arrowsState = await page.evaluate(() => document.querySelector('[data-cv-group="recs"] [data-prev="recs"]').getAttribute("aria-disabled"));
  check("The row's arrows follow it (the start arrow comes alive)", arrowsState === "false");

  // a frame scrolls itself
  await showGroup(page, "stage-screen", 0.5); await page.waitForTimeout(1500);
  const fr = await centreOf(page, '[data-cv-group="stage-screen"] iframe', 1);
  await page.mouse.move(...fr); const f1 = await cam(page);
  await page.mouse.wheel(0, 600); await page.waitForTimeout(800);
  const fsy = await page.evaluate(() => document.querySelectorAll('[data-cv-group="stage-screen"] iframe')[1].contentWindow.scrollY);
  const progress = await page.evaluate(() => document.querySelectorAll('[data-cv-group="stage-screen"] iframe')[1].contentWindow.qqStage?.progress);
  check("A preview document scrolls inside (the product stage runs)", fsy > 0 && (await cam(page)).y === f1.y && progress > 0, `scrollY ${Math.round(fsy)}, stage progress ${progress?.toFixed(2)}`);

  // ── pointer: pan on empty space only; previews keep selection ──
  await showGroup(page, "head-layout", 0.6);
  p = await emptyPoint(page);
  const d0 = await cam(page);
  await page.mouse.move(...p); await page.mouse.down(); await page.mouse.move(p[0] + 100, p[1] + 50, { steps: 5 }); await page.mouse.up(); await frame(page);
  const d1 = await cam(page);
  check("Dragging empty space pans", near(d1.x, d0.x + 100) && near(d1.y, d0.y + 50));
  // the text of a component (on its own text, as a person would drag)
  const text = await page.evaluate(() => { const el = document.querySelector('[data-cv-group="head-layout"] .head__lead'), rg = document.createRange(); rg.selectNodeContents(el.firstChild); const q = rg.getClientRects()[0]; return [q.left + 2, q.top + q.height / 2, q.left + q.width * 0.6, q.top + q.height / 2]; });
  await page.mouse.move(text[0], text[1]); await page.mouse.down(); await page.mouse.move(text[2], text[3], { steps: 8 }); await page.mouse.up();
  const sel = await page.evaluate(() => { const s = getSelection(); return { text: s.toString(), inside: !!s.anchorNode?.parentElement?.closest(".head__lead") && !!s.focusNode?.parentElement?.closest(".head__lead") }; });
  check("Dragging over a component selects its text and doesn't pan", sel.text.length > 10 && sel.inside && JSON.stringify(await cam(page)) === JSON.stringify(d1), `«${sel.text.slice(0, 30)}»`);
  await page.evaluate(() => getSelection().removeAllRanges());
  // groups can't be dragged: a drag on a title pans
  const gpos = await page.evaluate(() => { const g = document.querySelector('[data-cv-group="head-layout"]'); return [g.offsetLeft, g.offsetTop]; });
  const title = await centreOf(page, '[data-cv-group="head-layout"] .cv-group__title');
  await page.mouse.move(...title); await page.mouse.down(); await page.mouse.move(title[0] + 80, title[1] + 30, { steps: 4 }); await page.mouse.up();
  check("Groups can't be dragged (a drag on one pans the view)", JSON.stringify(gpos) === JSON.stringify(await page.evaluate(() => { const g = document.querySelector('[data-cv-group="head-layout"]'); return [g.offsetLeft, g.offsetTop]; })));
  // a drag that loses the window
  p = await emptyPoint(page);
  await page.mouse.move(...p); await page.mouse.down();
  await page.evaluate(() => dispatchEvent(new Event("blur")));
  const e0 = await cam(page); await page.mouse.move(p[0] + 60, p[1] + 60, { steps: 3 }); await page.mouse.up(); await frame(page);
  check("A drag ends when the window loses focus", (await page.evaluate(() => qqCanvas.pointers)) === 0 && JSON.stringify(await cam(page)) === JSON.stringify(e0));

  // ── touch: pan with one finger, pinch with two, cancel ──
  const cdp = await context.newCDPSession(page);
  p = await emptyPoint(page);
  const t0 = await cam(page);
  const touch = (type, pts) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: pts.map(([x, y], id) => ({ x, y, id })) });
  await touch("touchStart", [[p[0], p[1]]]); await touch("touchMove", [[p[0] + 40, p[1] + 10]]); await touch("touchEnd", []); await frame(page);
  const t1 = await cam(page);
  check("One finger on empty space pans", near(t1.x, t0.x + 40, 3) && near(t1.y, t0.y + 10, 3));
  await touch("touchStart", [[p[0] - 20, p[1]], [p[0] + 20, p[1]]]);
  for (let k = 1; k <= 5; k++) await touch("touchMove", [[p[0] - 20 - 10 * k, p[1]], [p[0] + 20 + 10 * k, p[1]]]);
  await frame(page);
  const t2 = await cam(page);
  await touch("touchCancel", []); await frame(page);
  check("Two fingers pinch-zoom; a cancelled touch leaves no pointer behind", t2.z > t1.z * 1.5 && (await page.evaluate(() => qqCanvas.pointers)) === 0, `zoom ${t1.z.toFixed(2)} → ${t2.z.toFixed(2)}`);

  // ── keyboard: the canvas itself, never the components ──
  await page.evaluate(() => { qqCanvas.reset(); document.querySelector("[data-cv-world] button, [data-cv-world] a[href]").focus({ preventScroll: true }); }); await frame(page);
  await page.keyboard.press("Shift+Tab");   // from the first control of the world back to the canvas itself
  await page.evaluate(() => qqCanvas.reset()); await frame(page);
  const ring = await page.evaluate(() => document.activeElement?.matches("[data-cv-shell]") && document.activeElement.matches(":focus-visible") && getComputedStyle(document.activeElement).outlineStyle !== "none");
  check("The canvas itself takes keyboard focus (before the components), with a visible ring", ring);
  const k0 = await cam(page);
  await page.keyboard.press("ArrowRight"); await page.keyboard.press("ArrowDown"); await frame(page);
  const k1 = await cam(page);
  await page.keyboard.press("+"); await frame(page); const k2 = await cam(page);
  await page.keyboard.press("1"); await frame(page); const k3 = await cam(page);
  await page.keyboard.press("0"); await frame(page); const k4 = await cam(page);
  check("Keys pan (arrows), zoom (+ −), fit (1) and reset (0)", k1.x === k0.x - 64 && k1.y === k0.y - 64 && near(k2.z, 1.25, 0.001) && k3.z < 0.2 && k4.z === 1, `${k0.x},${k0.y} → ${k1.x},${k1.y}; zoom ${k2.z}, fit ${k3.z.toFixed(3)}`);
  await page.keyboard.press("Control+z"); await frame(page);
  check("No undo on the canvas (Ctrl+Z changes nothing)", JSON.stringify(await cam(page)) === JSON.stringify(k4));
  // focus outside the view is brought in: Tab from the canvas goes to the first control of the world
  await page.evaluate(() => qqCanvas.set({ x: innerWidth - 90, y: innerHeight - 90, z: 1 })); await frame(page);
  await page.focus("[data-cv-shell]"); await page.keyboard.press("Tab"); await page.waitForTimeout(150);
  const rev = await page.evaluate(() => { const r = document.activeElement.getBoundingClientRect(); return { tag: document.activeElement.tagName, ok: r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight }; });
  check("Keyboard focus outside the view is brought into view", rev.ok, rev.tag);
  // components keep their keys: typing (with Space and arrows) in the footer's field
  await showGroup(page, "footer", 0.7);
  await page.click('[data-cv-group="footer"] input[type="email"]');
  const f0 = await cam(page);
  await page.keyboard.type("a b"); await page.keyboard.press("ArrowLeft"); await page.keyboard.press("ArrowLeft"); await page.keyboard.press("Minus");
  const val = await page.inputValue('[data-cv-group="footer"] input[type="email"]');
  check("Typing in a component keeps Space, arrows and − (the camera doesn't move)", val === "a- b" && JSON.stringify(await cam(page)) === JSON.stringify(f0), `«${val}»`);
  await page.click("[data-cv-reset]"); await frame(page);
  check("Reset view keeps what's typed in components", (await page.inputValue('[data-cv-group="footer"] input[type="email"]')) === "a- b");
  await page.evaluate(() => scrollTo(0, 600)); await frame(page);
  check("The page itself never scrolls", (await page.evaluate(() => scrollY)) === 0);

  // ── components work at any zoom: clicks land where they're drawn ──
  for (const z of [0.5, 1.5]) {
    await showGroup(page, "catalog", z, 40, 60); await page.waitForTimeout(200);
    const s = await centreOf(page, '[data-cv-group="catalog"] [data-filter="type"] summary');
    await page.mouse.click(...s); await page.waitForTimeout(150);
    const o = await centreOf(page, '[data-cv-group="catalog"] [data-filter="type"] .option');
    const hit = await page.evaluate(([x, y]) => !!document.elementFromPoint(x, y)?.closest('[data-filter="type"] .option'), o);
    await page.mouse.click(...o); await page.waitForTimeout(200);
    const st = await page.evaluate(() => ({ checked: document.querySelector('[data-filter="type"] .option input').checked, found: document.querySelector("[data-found]").textContent }));
    check(`At ${z * 100}%: a filter opens, its option is clickable where drawn, the grid filters`, hit && st.checked, `found ${st.found}`);
    await page.click('[data-cv-group="catalog"] [data-filter="type"] .option input'); await page.keyboard.press("Escape"); await page.waitForTimeout(150);
  }
  // buttons, switches, the toast (in its own place on the screen)
  await showGroup(page, "card-weights", 1);
  await page.click('[data-cv-group="card-weights"] .card >> nth=0 >> .weight >> nth=1');
  const price = await page.textContent('[data-cv-group="card-weights"] .card >> nth=0 >> [data-price-out]');
  check("A weight switch changes the price", /2\s?900/.test(price.replace(/\s/g, " ")), price);
  await page.click('[data-cv-group="card-weights"] .card >> nth=0 >> .buy__add'); await page.waitForTimeout(500);
  const t1r = await page.evaluate(() => { const r = document.querySelector("[data-toast]").getBoundingClientRect(); return { on: document.querySelector("[data-toast]").hasAttribute("data-on"), h: r.height, bottom: innerHeight - r.bottom }; });
  await page.evaluate(() => qqCanvas.set({ ...qqCanvas.camera, z: 0.5 })); await frame(page);
  const t2r = await page.evaluate(() => document.querySelector("[data-toast]").getBoundingClientRect().height);
  check("«В корзину» shows the toast at the foot of the screen, at screen size", t1r.on && t1r.bottom >= 0 && t1r.bottom < 60 && near(t1r.h, t2r, 0.5), JSON.stringify(t1r));
  await showGroup(page, "nav-theme", 0.5); await page.waitForTimeout(1500);
  const count = await page.evaluate(() => document.querySelector('[data-cv-group="nav-theme"] iframe').contentDocument.querySelector("[data-bag-count]")?.textContent);
  check("The navbar on its screen counts the bag", count === "1", `count ${count}`);
  const fav = await page.evaluate(() => { const b = document.querySelector('[data-cv-group="card-tone"] .fav'); b.click(); return b.getAttribute("aria-pressed"); });
  check("The heart toggles", fav === "true");

  // ── links ──
  const url0 = page.url();
  await showGroup(page, "hero", 0.6);
  await page.click('[data-cv-group="hero"] .hero__link >> nth=1');   // «Бизнесу» → business/, a page shown on the canvas
  await page.waitForTimeout(200);
  const biz = await page.evaluate(() => { const r = document.querySelector('[data-cv-group="bhero"]').getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0 && r.left < innerWidth && r.right > 0; });
  check("A link to a page shown on the canvas moves the camera to its group", biz && page.url() === url0);
  await showGroup(page, "card-tone", 1);
  await page.click('[data-cv-group="card-tone"] .card__link >> nth=0'); await page.waitForTimeout(150);
  const said = await page.textContent("[data-cv-status]");
  check("A link that would leave the canvas isn't followed, and says where it goes", page.url() === url0 && /Not followed/.test(said), said);
  await showGroup(page, "nav-theme", 0.5);
  await page.waitForTimeout(1000);
  // where the link is drawn: its box in the frame, scaled by the frame's zoom, from the frame's corner
  const link = await page.evaluate(() => { const f = document.querySelector('[data-cv-group="nav-theme"] iframe'), fr = f.getBoundingClientRect(), s = fr.width / f.contentWindow.innerWidth, r = f.contentDocument.querySelector(".nav__links a").getBoundingClientRect(); return [fr.left + (r.left + r.width / 2) * s, fr.top + (r.top + r.height / 2) * s]; });
  await page.mouse.click(...link); await page.waitForTimeout(200);
  const toCat = await page.evaluate(() => { const r = document.querySelector('[data-cv-group="catalog"]').getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; });
  const frameUrl = await page.evaluate(() => document.querySelector('[data-cv-group="nav-theme"] iframe').contentWindow.location.pathname);
  check("A link inside a preview document (navbar → Кофе) moves the camera to that page's group", toCat && /frame-nav-paper/.test(frameUrl));

  // ── nothing leaves the dev server; no errors ──
  const outside = requests.filter((u) => !u.startsWith(base) && !u.startsWith("data:") && !u.startsWith("blob:"));
  check("No request leaves the dev server", !outside.length, outside.slice(0, 3).join(", "));
  check("No errors in the console", !errors.length, errors.slice(0, 3).join(" | "));

  // ── the camera is saved, and bad or missing storage is survived ──
  await page.evaluate(() => qqCanvas.set({ x: -1234, y: -567, z: 0.42 })); await page.waitForTimeout(500);
  await page.reload({ waitUntil: "load" }); await page.waitForFunction(() => window.qqCanvas); await page.waitForTimeout(2500);
  const kept = await cam(page);
  check("The camera is kept across a reload", near(kept.x, -1234) && near(kept.y, -567) && near(kept.z, 0.42, 0.001), JSON.stringify(kept));
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem(qqCanvas.KEY)));
  check("Only the camera is saved, versioned", Object.keys(stored).sort().join() === "v,x,y,z" && stored.v === 1, JSON.stringify(stored));
  for (const [what, bad] of [["broken JSON", "{x:"], ["an unknown version", JSON.stringify({ v: 9, x: 1, y: 2, z: 1, groups: [[0, 0]] })], ["too much data", JSON.stringify({ v: 1, x: 1, y: 1, z: 1, pad: "x".repeat(5000) })], ["an impossible zoom", JSON.stringify({ v: 1, x: 0, y: 0, z: 1e6 })]]) {
    await page.evaluate(([k, v]) => localStorage.setItem(k, v), [await page.evaluate(() => qqCanvas.KEY), bad]);
    await page.reload({ waitUntil: "load" }); await page.waitForFunction(() => window.qqCanvas); await page.waitForTimeout(2500);
    const c = await cam(page), left = await page.evaluate(() => localStorage.getItem(qqCanvas.KEY));
    check(`Saved data with ${what} is dropped for the defaults`, c.z < 0.2 && (left === null || JSON.parse(left).v === 1), JSON.stringify(c));
  }
  await context.close();

  const blocked = await open({ init: () => { for (const m of ["getItem", "setItem", "removeItem"]) Storage.prototype[m] = () => { throw new DOMException("blocked", "SecurityError"); }; } });
  await blocked.page.evaluate(() => qqCanvas.set({ x: -50, y: -50, z: 0.5 })); await blocked.page.waitForTimeout(500);
  const bc = await cam(blocked.page);
  check("Without storage the canvas still works (nothing is kept)", near(bc.z, 0.5, 0.001) && !blocked.errors.filter((e) => !/blocked/.test(e)).length, blocked.errors.slice(0, 2).join(" | "));
  await blocked.context.close();

  // ── teardown ──
  const td = await open({ settle: 1500 });
  const tdOk = await td.page.evaluate(async () => {
    qqCanvas.destroy();
    const c0 = JSON.stringify(qqCanvas.camera);
    const st = document.querySelector("[data-cv-shell]");
    st.dispatchEvent(new WheelEvent("wheel", { deltaY: -300, ctrlKey: true, clientX: 300, clientY: 300, bubbles: true, cancelable: true }));
    st.focus(); dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }));
    document.querySelector('[data-cv-group="facts"] .fact__more').click();
    await new Promise((r) => setTimeout(r, 400));
    return c0 === JSON.stringify(qqCanvas.camera) && qqCanvas.pointers === 0;
  });
  check("Teardown removes every listener, observer and frame (the camera stops answering)", tdOk);
  await td.context.close();

  // ── the components themselves ──
  // the canvas only reads the components: the sources are byte for byte what they were before it ran
  try {
    const after = sourceState();
    check("Component source unchanged by the canvas (templates, scripts, styles, assets, data)", after === SOURCE_BEFORE, after === SOURCE_BEFORE ? "" : "changed while the canvas ran");
  } catch (e) { check("Component source unchanged by the canvas (templates, scripts, styles, assets, data)", false, "git: " + e.message.split("\n")[0]); }
} catch (e) {
  check("The check ran to the end", false, e.stack?.split("\n").slice(0, 3).join(" "));
} finally {
  await browser.close();
  await server.close();
}
const bad = results.filter((r) => !r.ok).length;
console.log(bad ? `\n${bad} of ${results.length} checks failed` : `\nall ${results.length} checks pass`);
process.exitCode = bad ? 1 : 0;
