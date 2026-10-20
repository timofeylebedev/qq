// The component canvas: the camera over the groups of page.mjs. The components run the site's own scripts
// (/scripts/main.js, loaded before this); this file only moves the view and decides what links do.
//
//   pan     drag empty space (any button), the middle button anywhere, Space + drag, the wheel or the trackpad
//   zoom    Ctrl/⌘ + wheel or a trackpad pinch, around the pointer; two fingers on a touch screen; + and −
//   keys    on the canvas itself (not inside a component): arrows pan, + − zoom, 1 fits all, 0 resets, Esc stops a drag
//   links   to a part of the canvas move the camera there; links that would leave the canvas are not followed
//           (Ctrl/⌘-click still opens them in a new tab) and the status line says where they go
//
// The world is placed with left/top and scaled with CSS zoom, never transformed (see canvas.css): the site's layers
// (the 3D canvas at z-index 5 between a card's ground and its name) stay as they are. After every move the packs are
// told to measure again ("qq:layout", which scripts/packs.js listens to).
//
// Only the camera is saved (localStorage, versioned). window.qqCanvas exposes it for testing.
const KEY = "qq-site:component-canvas:camera";
const VERSION = 1;
const Z = { min: 0.02, max: 4 };   // 2%: «fit all» must reach the whole world (round 4 added the shop, account and information blocks)
const KEEP = 80;            // px of the world that always stays on screen
const STEP = 64;            // an arrow key moves this far (× 4 with Shift)

const stage = document.querySelector("[data-cv-stage]");
const shell = document.querySelector("[data-cv-shell]");      // the canvas's own focus (behind the world)
const world = document.querySelector("[data-cv-world]");
const readout = document.querySelector("[data-cv-readout]");
const status = document.querySelector("[data-cv-status]");
const ui = document.querySelector("[data-cv-ui]");
const glasses = [...document.querySelectorAll("[data-cv-glass]")];   // the screens (iframes): see canvas.css

const ac = new AbortController();
const on = (target, type, fn, opts = {}) => target.addEventListener(type, fn, { ...opts, signal: ac.signal });
const timers = new Set();
const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); return t; };
const clear = (t) => { clearTimeout(t); timers.delete(t); };
let raf = 0;

const finite = (n) => typeof n === "number" && Number.isFinite(n);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// ── the layout: groups in columns, by their measured sizes ──────────────────────────────────────────────────────
// Four columns of 1600px; a group takes as many as its width needs (at most two, page.mjs) and goes, in order, where
// those columns are lowest. Sizes are read in CSS px at 100% (offsetWidth/Height are not scaled by zoom). Placing
// groups changes no size, so it can't loop.
//
// CSS zoom keeps every hairline at least one screen pixel, so below 100% boxes measure a little larger (at 6%, up to
// ~120px on a group). So that zooming out doesn't shuffle the groups, the layout follows a size change at once only at
// 100% or more; below, only a change bigger than SLACK (well under the 200px between groups, so they can't overlap).
const COLUMN = 1600, COLUMNS = 4, GAP_X = 160, GAP_Y = 200, EDGE = 200, SLACK = 160;
let laid = null;               // the sizes the groups were placed by
function layout() {
  const groups = [...world.querySelectorAll(":scope > [data-cv-group]")];
  const dims = groups.map((g) => [g.offsetWidth, g.offsetHeight]);
  const exact = shown.z >= 1, limit = exact ? 1 : SLACK;
  if (laid && laid.length === dims.length && dims.every(([w, h], i) => Math.abs(w - laid[i][0]) <= limit && Math.abs(h - laid[i][1]) <= limit)) return false;
  laid = dims;
  const floor = new Array(COLUMNS).fill(EDGE);
  groups.forEach((g, i) => {
    const [w, h] = dims[i];
    if (g.hasAttribute("data-cv-break")) floor.fill(Math.max(...floor));      // a new part (the page blocks) starts on a clean line
    const span = Math.min(COLUMNS, Math.max(1, Math.ceil((w + GAP_X) / (COLUMN + GAP_X))));
    let best = 0, top = Infinity;
    for (let c = 0; c + span <= COLUMNS; c++) { const t = Math.max(...floor.slice(c, c + span)); if (t < top) { top = t; best = c; } }
    g.style.left = EDGE + best * (COLUMN + GAP_X) + "px";
    g.style.top = top + "px";
    for (let c = best; c < best + span; c++) floor[c] = top + h + GAP_Y;
  });
  world.style.width = 2 * EDGE + COLUMNS * COLUMN + (COLUMNS - 1) * GAP_X + "px";
  world.style.height = Math.max(...floor) - GAP_Y + EDGE + "px";
  dispatchEvent(new Event("qq:layout"));
  return true;
}
let layoutRaf = 0;
const relayout = () => { if (!layoutRaf) layoutRaf = requestAnimationFrame(() => { layoutRaf = 0; if (layout()) set(cam); }); };
const sizeWatch = new ResizeObserver(relayout);
for (const g of world.querySelectorAll(":scope > [data-cv-group]")) sizeWatch.observe(g);

// ── the camera: screen = world × z + (x, y) ─────────────────────────────────────────────────────────────────────
let cam = { x: 0, y: 0, z: 1 };
let shown = { ...cam };        // what is on screen now (the last applied camera)

const size = () => ({ w: world.offsetWidth, h: world.offsetHeight });   // the world's size at 100%
function bound(c) {
  const z = clamp(finite(c.z) ? c.z : 1, Z.min, Z.max);
  const { w, h } = size(), W = innerWidth, H = innerHeight;
  const x = clamp(finite(c.x) ? c.x : 0, Math.min(KEEP - w * z, W - KEEP), Math.max(KEEP - w * z, W - KEEP));
  const y = clamp(finite(c.y) ? c.y : 0, Math.min(KEEP - h * z, H - KEEP), Math.max(KEEP - h * z, H - KEEP));
  return { x, y, z };
}
function set(c) { cam = bound(c); if (!raf) raf = requestAnimationFrame(apply); }

// writes first, then one read (the packs measure): one layout per frame
function apply() {
  raf = 0;
  const { x, y, z } = cam;
  world.style.zoom = String(z);
  world.style.left = x / z + "px";
  world.style.top = y / z + "px";
  for (const g of glasses) { g.style.zoom = String(1 / z); g.style.transform = `scale(${z})`; }
  shown = { x, y, z };
  readout.textContent = Math.round(z * 100) + "%";
  dispatchEvent(new Event("qq:layout"));
  wake();
  save();
}

// A screen (iframe) loads the first time it is on screen at 25% or closer: no need to run seven pages of 3D packs and
// sliders for a view where they are a few pixels wide.
const WAKE_AT = 0.25;
function wake() {
  if (shown.z < WAKE_AT) return;
  for (const f of world.querySelectorAll("iframe[data-cv-frame][data-src]")) {
    const r = f.getBoundingClientRect();
    if (r.right > 0 && r.bottom > 0 && r.left < innerWidth && r.top < innerHeight) { f.src = f.dataset.src; f.removeAttribute("data-src"); }
  }
}

let touched = false;            // has the person moved the camera yet? (until then it follows the layout as it settles)
const pan = (dx, dy) => { touched = true; set({ ...cam, x: cam.x + dx, y: cam.y + dy }); };
function zoomAt(px, py, factor) {
  touched = true;
  const z = clamp(cam.z * factor, Z.min, Z.max), k = z / cam.z;
  set({ x: px - (px - cam.x) * k, y: py - (py - cam.y) * k, z });
}
const centre = () => [innerWidth / 2, innerHeight / 2];

// the groups' bounds in world units (100%), measured from what is drawn
const box = (g) => ({ x: g.offsetLeft, y: g.offsetTop, w: g.offsetWidth, h: g.offsetHeight });
function content() {
  let l = Infinity, t = Infinity, r = -Infinity, b = -Infinity;
  for (const g of world.querySelectorAll(":scope > [data-cv-group]")) {
    const q = box(g);
    if (!q.w || !q.h) continue;
    l = Math.min(l, q.x); t = Math.min(t, q.y); r = Math.max(r, q.x + q.w); b = Math.max(b, q.y + q.h);
  }
  return l === Infinity ? null : { x: l, y: t, w: r - l, h: b - t };
}
// show a box of the world (world units) as large as fits, at most at `most`
function show(box, most = Z.max, margin = 48) {
  const top = ui.getBoundingClientRect().bottom + 16;
  const W = innerWidth - 2 * margin, H = innerHeight - top - margin;
  const z = clamp(Math.min(W / box.w, H / box.h, most), Z.min, Z.max);
  set({ z, x: margin + (W - box.w * z) / 2 - box.x * z, y: top + (H - box.h * z) / 2 - box.y * z });
}
function fit(auto = false) { if (!auto) touched = true; const b = content(); if (b) show(b, 1); }
function reset() { touched = true; set({ x: 0, y: 0, z: 1 }); }

// ── saving the camera ────────────────────────────────────────────────────────────────────────────────────────────
// { v: 1, x, y, z }. Older or unknown data (another version, a broken value, something too big) is dropped and the
// canvas starts from its defaults; a storage that can't be read or written (private mode, full, blocked) is skipped.
let saveTimer = 0;
function save() {
  clear(saveTimer);
  saveTimer = later(() => {
    try { localStorage.setItem(KEY, JSON.stringify({ v: VERSION, x: Math.round(cam.x), y: Math.round(cam.y), z: +cam.z.toFixed(4) })); }
    catch { /* full or blocked: the camera just isn't kept */ }
  }, 250);
}
function load() {
  let raw = null;
  try { raw = localStorage.getItem(KEY); } catch { return null; }
  if (raw == null) return null;
  let c = null;
  try { c = raw.length <= 256 ? JSON.parse(raw) : null; } catch { c = null; }
  if (c && c.v === VERSION && finite(c.x) && finite(c.y) && finite(c.z) && c.z >= Z.min && c.z <= Z.max) return { x: c.x, y: c.y, z: c.z };
  try { localStorage.removeItem(KEY); } catch { /* nothing to drop */ }
  return null;
}

// ── wheel and trackpad ───────────────────────────────────────────────────────────────────────────────────────────
const px = (e, d) => d * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1);

// can something between the pointer and `stop` scroll this way? (then the wheel is theirs: reels, tabs, a frame)
function scrollable(el, dx, dy, stop) {
  for (let n = el; n && n !== stop; n = n.parentElement) {
    const s = n.ownerDocument.defaultView.getComputedStyle(n);
    const page = n === n.ownerDocument.scrollingElement;        // a document scrolls unless it's told not to
    const can = (o) => (page ? !/(hidden|clip)/.test(o) : /(auto|scroll)/.test(o));
    const sx = can(s.overflowX) && n.scrollWidth > n.clientWidth;
    const sy = can(s.overflowY) && n.scrollHeight > n.clientHeight;
    if (sx && dx && (dx < 0 ? n.scrollLeft > 0 : n.scrollLeft + n.clientWidth < n.scrollWidth - 1)) return true;
    if (sy && dy && (dy < 0 ? n.scrollTop > 0 : n.scrollTop + n.clientHeight < n.scrollHeight - 1)) return true;
  }
  return false;
}
// one wheel event, from the canvas or from inside a frame (sx, sy: the pointer on the canvas's screen)
function wheel(e, sx, sy, ownScroll) {
  let dx = px(e, e.deltaX), dy = px(e, e.deltaY);
  if (e.ctrlKey || e.metaKey) { e.preventDefault(); zoomAt(sx, sy, Math.exp(-dy * 0.01)); return; }
  if (e.shiftKey && !dx) { dx = dy; dy = 0; }
  if (ownScroll(dx, dy)) return;
  e.preventDefault();
  pan(-dx, -dy);
}
on(stage, "wheel", (e) => wheel(e, e.clientX, e.clientY, (dx, dy) => !!e.target.closest?.("[data-cv-slot]") && scrollable(e.target, dx, dy, stage)), { passive: false });

// Safari's trackpad pinch
let gestureScale = 1;
on(stage, "gesturestart", (e) => { e.preventDefault(); gestureScale = 1; });
on(stage, "gesturechange", (e) => { e.preventDefault(); zoomAt(e.clientX, e.clientY, e.scale / gestureScale); gestureScale = e.scale; });

// ── pointers: pan with one, pinch with two ───────────────────────────────────────────────────────────────────────
const pointers = new Map();     // id → { x, y }
let gesture = null;             // { mid: [x, y], dist } while a gesture runs
let space = false;

const empty = (t) => !t.closest?.("[data-cv-slot], [data-cv-ui]");
const midpoint = () => { const p = [...pointers.values()]; return p.length === 1 ? { mid: [p[0].x, p[0].y], dist: 0 } : { mid: [(p[0].x + p[1].x) / 2, (p[0].y + p[1].y) / 2], dist: Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) }; };

function end(id) {
  if (id != null) { pointers.delete(id); try { stage.releasePointerCapture(id); } catch { /* already released */ } }
  else { for (const p of pointers.keys()) try { stage.releasePointerCapture(p); } catch { /* gone */ } pointers.clear(); }
  gesture = pointers.size ? midpoint() : null;
  stage.toggleAttribute("data-cv-panning", !!gesture);
}

on(stage, "pointerdown", (e) => {
  const join = gesture && e.pointerType === "touch" && pointers.size < 2;
  const start = e.button === 1 || (e.button === 0 && (space || empty(e.target)));
  if (!join && !start) return;
  e.preventDefault();                                   // no text selection, no autoscroll of the middle button
  if (!join) shell.focus({ preventScroll: true });
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  try { stage.setPointerCapture(e.pointerId); } catch { /* the pointer is gone already */ }
  gesture = midpoint();
  stage.setAttribute("data-cv-panning", "");
});
on(stage, "pointermove", (e) => {
  const p = pointers.get(e.pointerId);
  if (!p || !gesture) return;
  p.x = e.clientX; p.y = e.clientY;
  const now = midpoint();
  if (pointers.size === 2 && gesture.dist > 0 && now.dist > 0) zoomAt(now.mid[0], now.mid[1], now.dist / gesture.dist);
  pan(now.mid[0] - gesture.mid[0], now.mid[1] - gesture.mid[1]);
  gesture = now;
});
for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) on(stage, type, (e) => pointers.has(e.pointerId) && end(e.pointerId));
on(window, "blur", () => { end(); space = false; stage.removeAttribute("data-cv-space"); });
on(document, "visibilitychange", () => { if (document.hidden) { end(); space = false; stage.removeAttribute("data-cv-space"); } });
// a middle click must not open a link under it after a pan
on(stage, "auxclick", (e) => { if (e.button === 1 && !e.target.closest?.("[data-cv-slot]")) e.preventDefault(); });

// ── keys: only on the canvas itself, never taken from a component ────────────────────────────────────────────────
const onShell = () => document.activeElement === shell || document.activeElement === document.body || !document.activeElement;
on(window, "keydown", (e) => {
  if (!onShell() || e.altKey || e.ctrlKey || e.metaKey) return;
  const k = e.key, far = e.shiftKey ? 4 : 1;
  const moves = { ArrowLeft: [STEP, 0], ArrowRight: [-STEP, 0], ArrowUp: [0, STEP], ArrowDown: [0, -STEP] };
  if (moves[k]) { e.preventDefault(); pan(moves[k][0] * far, moves[k][1] * far); }
  else if (k === "+" || k === "=") { e.preventDefault(); zoomAt(...centre(), 1.25); }
  else if (k === "-" || k === "_") { e.preventDefault(); zoomAt(...centre(), 0.8); }
  else if (k === "1" || k === "!") { e.preventDefault(); fit(); }
  else if (k === "0" || k === ")") { e.preventDefault(); reset(); }
  else if (k === "Escape") end();
  else if (k === " " && !e.repeat) { e.preventDefault(); space = true; stage.setAttribute("data-cv-space", ""); }
});
on(window, "keyup", (e) => { if (e.key === " ") { space = false; stage.removeAttribute("data-cv-space"); } });

on(ui, "click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  if (b.dataset.cvZoom) zoomAt(...centre(), b.dataset.cvZoom === "in" ? 1.25 : 0.8);
  else if (b.hasAttribute("data-cv-fit")) fit();
  else if (b.hasAttribute("data-cv-reset")) reset();
});

// ── keyboard focus outside the view: bring it in ─────────────────────────────────────────────────────────────────
function reveal(r, margin = 48) {
  if (!r.width && !r.height) return;
  const top = ui.getBoundingClientRect().bottom + 16, W = innerWidth, H = innerHeight;
  let dx = 0, dy = 0;
  if (r.width > W - 2 * margin || r.left < margin) dx = margin - r.left; else if (r.right > W - margin) dx = W - margin - r.right;
  if (r.height > H - top - margin || r.top < top) dy = top - r.top; else if (r.bottom > H - margin) dy = H - margin - r.bottom;
  if (dx || dy) pan(dx, dy);
}
// (keyboard focus only: a click focuses what is under the pointer, which is in view, or a link that just moved the camera)
const keyed = (el) => { try { return el.matches(":focus-visible"); } catch { return true; } };
on(stage, "focusin", (e) => { if (world.contains(e.target) && keyed(e.target)) requestAnimationFrame(() => reveal(e.target.getBoundingClientRect())); });
// the stage clips and never scrolls; should the page itself ever scroll (a focused element pulled into view), undo it
on(window, "scroll", () => { if (scrollX || scrollY) scrollTo(0, 0); });

// ── links ────────────────────────────────────────────────────────────────────────────────────────────────────────
const root = new URL(document.documentElement.dataset.root || "./", location.href);
let statusTimer = 0;
function say(text) {
  status.textContent = text;
  clear(statusTimer);
  statusTimer = later(() => (status.textContent = ""), 5000);
}
function goTo(el) {
  const g = el.closest("[data-cv-group]");
  if (!g) return;
  touched = true;
  const b = box(g);
  b.h = Math.min(b.h, b.w * (innerHeight / innerWidth));     // a tall group: its top
  show(b, Math.max(cam.z, 0.25));
  say(`Moved to «${g.querySelector(".cv-group__title")?.textContent}»`);
}
// what a click on a link does. `doc` is the canvas or a frame's document; the frame's own anchors stay in the frame.
function follow(e, doc) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = e.target.closest?.("a[href]");
  if (!a || (doc === document && !world.contains(a))) return;
  const raw = a.getAttribute("href"), url = new URL(raw, doc.baseURI);
  const here = new URL(doc.baseURI);
  if (url.origin !== location.origin) { e.preventDefault(); say(`Not followed in the canvas: ${url.href}`); return; }
  const id = decodeURIComponent(url.hash.slice(1));
  if (url.pathname === here.pathname && url.search === here.search) {          // a link inside the same document
    if (raw === "#" || !id) { e.preventDefault(); say("This link leads to a page that isn't made yet (#)"); return; }
    if (doc !== document && doc.getElementById(id)) return;                      // the frame scrolls to it itself
    const target = document.getElementById(id);
    if (target && world.contains(target)) { e.preventDefault(); goTo(target); }
    return;                                                                       // nothing here: the components' own hash links (the catalog tabs)
  }
  e.preventDefault();
  const path = url.pathname.startsWith(root.pathname) ? url.pathname.slice(root.pathname.length) : url.pathname;
  const target = (id && document.getElementById(id) && world.contains(document.getElementById(id)) && document.getElementById(id))
    || world.querySelector(`[data-cv-group][data-cv-page="${CSS.escape(path)}"]`);
  if (target) goTo(target);
  else say(`Not followed in the canvas: /${path}${url.hash} (Ctrl/⌘-click opens it in a new tab)`);
}
on(window, "click", (e) => follow(e, document));

// ── preview documents (iframes) ──────────────────────────────────────────────────────────────────────────────────
// Their content is native: it scrolls and takes keys and gestures itself. The canvas only takes the wheel when the
// frame has nothing left to scroll that way (or with Ctrl/⌘ to zoom), follows its links as above, and brings its
// focused element into view.
function frame(f) {
  const hook = () => {
    let w, d;
    try { w = f.contentWindow; d = f.contentDocument; if (!d || !d.body) return; } catch { return; }
    const scale = () => f.getBoundingClientRect().width / Math.max(1, w.innerWidth);
    const toScreen = (r) => { const fr = f.getBoundingClientRect(), s = scale(); return new DOMRect(fr.left + r.left * s, fr.top + r.top * s, r.width * s, r.height * s); };
    w.addEventListener("wheel", (e) => {
      const p = toScreen(new DOMRect(e.clientX, e.clientY, 0, 0));
      wheel(e, p.x, p.y, (dx, dy) => scrollable(e.target.nodeType === 1 ? e.target : e.target.parentElement, dx, dy, null));
    }, { passive: false, signal: ac.signal });
    w.addEventListener("click", (e) => follow(e, d), { signal: ac.signal });
    d.addEventListener("focusin", (e) => { if (keyed(e.target)) w.requestAnimationFrame(() => reveal(toScreen(e.target.getBoundingClientRect()))); }, { signal: ac.signal });
  };
  on(f, "load", hook);
  hook();
}
for (const f of document.querySelectorAll("[data-cv-frame]")) frame(f);

// ── start: the saved camera, or (once the layout has settled) everything in view ────────────────────────────────
const frameDone = () => new Promise((r) => requestAnimationFrame(() => r()));
async function settle(frames) {
  try { await Promise.race([document.fonts?.ready, new Promise((r) => later(r, 1500))]); } catch { /* fonts are not needed to measure */ }
  for (let i = 0, same = 0; i < frames && same < 3 && !ac.signal.aborted; i++) {
    await frameDone();
    same = layout() ? 0 : same + 1;
  }
}
// the world is measured at 100% while hidden (exact sizes, data-cv-ready unset), then shown with the saved camera or
// with everything in view
layout();
const saved = load();
settle(60).then(() => {
  if (ac.signal.aborted) return;
  if (saved) set(saved); else fit(true);
  stage.setAttribute("data-cv-ready", "");
  return settle(120);
}).then(() => { if (!ac.signal.aborted && !saved && !touched) fit(true); });
on(window, "resize", () => set(cam), { passive: true });

// ── teardown: every listener, timer and frame ────────────────────────────────────────────────────────────────────
function destroy() {
  end();
  ac.abort();
  sizeWatch.disconnect();
  cancelAnimationFrame(raf); raf = 0;
  cancelAnimationFrame(layoutRaf); layoutRaf = 0;
  for (const t of timers) clearTimeout(t);
  timers.clear();
}
on(window, "pagehide", destroy);
// back from the browser's page cache with everything torn down: start again
addEventListener("pageshow", (e) => { if (e.persisted && ac.signal.aborted) location.reload(); }, { once: true });

window.qqCanvas = { get camera() { return { ...shown }; }, set, fit, reset, content, destroy, get pointers() { return pointers.size; }, KEY };
