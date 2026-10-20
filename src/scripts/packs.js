// The 3D packs of a page: one WebGL canvas (scripts/pouch3d.js) draws every [data-pack] slot.
//
//   cards      lean with the page as it scrolls (seen from a little above or below, like goods on a shelf, and
//              more while the page moves fast), turn towards the pointer over their card
//   every pack trails its slot a little when the page (or its row) scrolls, and catches up as it stops; pressed, it
//              moves away from the viewer and stays there while held (a quick click still shows it)
//   product    the big pack of a coffee's page turns once around as its fact tiles scroll past (scripts/product.js
//              gives the progress); it settles in from a quarter turn when the page opens
//
// Until the canvas has drawn (and without WebGL) each slot shows a still of the same pack. With «reduce motion» the
// packs stand still, facing front.
import { Pouch3D } from "./pouch3d.js";

const LOOK = { depth: 1.0, relief: 2.0, light: 0.75, sheen: 0.35, shadow: 0.38 };   // the approved look (docs/3d-pack-notes.md)
export const TUNE = {           // window.qqPacks in the console: try values live
  shelf: 0.34,                  // how much a card's pack tilts with its place on the screen (rad over the screen)
  turn: 0.3,                    // … and turns towards the middle of the screen
  speed: 0.00028,               // extra tilt per px/s of scrolling, at most ±lean
  lean: 0.45,
  hoverTurn: 0.5, hoverTilt: 0.3, hoverLift: 0.35,
  follow: 9,                    // how fast packs follow their targets (1/s)
  lag: 9,                       // how fast a pack catches up with its slot after a scroll (1/s)
  lagMax: 0.12, lagMaxPx: 40,   // … and how far it may trail: a share of its slot's height, at most this many px
  pressLift: -0.45, pressScale: 0.94, pressHold: 0.2, pressFollow: 16   // pressed: further away, smaller, held ≥ 0.2s
};

export async function initPacks() {
  const slots = [...document.querySelectorAll("[data-pack]")];
  if (!slots.length) return;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = new URL(document.documentElement.dataset.root || "./", location.href);
  const A = new URL("pack/", root).href;

  let stage;
  try { stage = await Pouch3D.createStage({ assets: A, mesh: A + "pouch-glb.json", zIndex: 5 }); }
  catch (err) { console.info("3D packs off:", err.message); return; }
  Object.assign(stage.look, LOOK);
  window.qqPacks = { stage, TUNE };

  const items = slots.map((el) => {
    const hero = el.dataset.pack === "hero", px = hero ? 1024 : 512;
    const it = stage.add(el, {
      front: `${A}labels/${el.dataset.front}-${px}.webp`, back: `${A}labels/${el.dataset.back}-${px}.webp`,
      fit: hero ? 0.82 : 0.9, live: hero, clip: el.closest("[data-slider]") || undefined
    });
    const p = { el, it, hero, hx: 0, hy: 0, hover: false, press: false, lx: 0, ly: 0, px: null, py: 0 };
    // a click on the pack opens its coffee, as a click on its name does (the name's link covers only the name)
    const link = el.closest("[data-card], .featured__slide")?.querySelector(".card__link, .featured__name a");
    if (link && !hero) (el.closest("[data-card], .featured__media") || el).addEventListener("click", (e) => {
      const r = el.getBoundingClientRect();
      if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom && !e.target.closest("a, button, input, label, select, form")) link.click();
    });
    if (!reduced) {
      // press: the pointer goes down on the pack itself; it lets go at least pressHold later, so a click reads
      let since = 0, wait = 0, off = 0;
      const inside = (e) => { const r = el.getBoundingClientRect(); return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom; };
      const down = () => { clearTimeout(off); p.press = true; since = performance.now(); stage.invalidate(); };
      const up = () => {
        clearTimeout(wait); if (!p.press) return;
        off = setTimeout(() => { p.press = false; stage.invalidate(); }, Math.max(0, TUNE.pressHold * 1000 - (performance.now() - since)));
      };
      (el.closest("[data-card], .featured__media") || el).addEventListener("pointerdown", (e) => {
        if (!inside(e) || e.button > 0) return;
        if (e.pointerType === "touch") wait = setTimeout(down, 90); else down();   // a touch may be the start of a scroll
        addEventListener("pointerup", up, { once: true }); addEventListener("pointercancel", up, { once: true });
      });
    }
    if (!hero && !reduced) {
      const card = el.closest("[data-card], .featured__media") || el.parentElement;
      card.addEventListener("pointermove", (e) => {
        if (e.pointerType === "touch") return;
        const r = el.getBoundingClientRect();
        p.hx = ((e.clientX - r.left) / r.width) * 2 - 1; p.hy = ((e.clientY - r.top) / r.height) * 2 - 1;
        p.hover = true; stage.invalidate();
      });
      card.addEventListener("pointerleave", () => { p.hover = false; stage.invalidate(); });
    }
    if (hero && !reduced) it.ry = -1.4;
    return p;
  });

  // show the canvas once the label is decoded, so a pack never shows up blank
  const labels = [...new Set(items.map((p) => p.it.front))];
  await Promise.all(labels.map((u) => { const im = new Image(); im.src = u; return im.decode().catch(() => {}); }));
  for (const p of items) p.el.dataset.live = "";
  document.documentElement.classList.add("has-3d");

  // rows that scroll sideways move their packs without moving the page
  for (const row of document.querySelectorAll("[data-slider]")) row.addEventListener("scroll", () => stage.measure(), { passive: true });
  addEventListener("qq:layout", () => stage.measure());
  if (document.fonts?.ready) document.fonts.ready.then(() => stage.measure());

  addEventListener("resize", () => { for (const p of items) p.px = null; }, { passive: true });

  let vel = 0, last = scrollY;
  stage.onTick = (dt) => {
    let moving = false;
    const k = 1 - Math.exp(-dt * TUNE.follow);
    const sy = scrollY, vh = innerHeight, vw = innerWidth;
    const v = (sy - last) / Math.max(dt, 0.001); last = sy;
    vel += (v - vel) * (1 - Math.exp(-dt * 12));
    if (Math.abs(vel) < 2) vel = 0; else moving = true;
    const lean = reduced ? 0 : Math.max(-TUNE.lean, Math.min(TUNE.lean, vel * TUNE.speed));

    for (const p of items) {
      const it = p.it;
      let rx = 0, ry = 0, lift = 0, scale = 1;
      if (p.hero) {
        const t = window.qqStage?.progress ?? 0;           // 0 → 1 over the fact tiles
        ry = reduced ? 0 : -0.35 + t * Math.PI * 2;
        rx = reduced ? 0 : -0.06 + 0.1 * Math.sin(t * Math.PI);
      } else if (!reduced) {
        rx = ((it.y + it.h / 2 - sy) / vh - 0.5) * TUNE.shelf + lean;
        ry = -((it.x + it.w / 2) / vw - 0.5) * TUNE.turn;
        if (p.hover) { ry += p.hx * TUNE.hoverTurn; rx += p.hy * TUNE.hoverTilt; lift = TUNE.hoverLift; scale = 1.03; }
      }
      if (p.press) { lift += TUNE.pressLift; scale *= TUNE.pressScale; }

      // the lag: the pack's place on the screen trails its slot's (soft-capped, so a jump to an anchor stays small)
      const sx = it.x - scrollX, sy2 = it.y - sy;
      if (reduced || p.px === null) { p.lx = p.ly = 0; }
      else { p.lx -= sx - p.px; p.ly -= sy2 - p.py; }
      p.px = sx; p.py = sy2;
      const m = Math.max(1, Math.min(TUNE.lagMax * it.h, TUNE.lagMaxPx)), decay = Math.exp(-dt * TUNE.lag);
      p.lx = Math.max(-3 * m, Math.min(3 * m, p.lx)) * decay; p.ly = Math.max(-3 * m, Math.min(3 * m, p.ly)) * decay;
      if (Math.abs(p.lx) < 0.2) p.lx = 0; if (Math.abs(p.ly) < 0.2) p.ly = 0;
      it.ox = m * Math.tanh(p.lx / m); it.oy = m * Math.tanh(p.ly / m);
      if (p.lx || p.ly) moving = true;

      if (!it.visible) { it.rx = rx; it.ry = ry; it.lift = lift; it.scale = scale; continue; }
      const e = Math.abs(rx - it.rx) + Math.abs(ry - it.ry) + Math.abs(lift - it.lift) + Math.abs(scale - it.scale) * 4;
      if (e > 0.002) {
        const kk = p.press || Math.abs(it.lift - lift) > 0.3 ? 1 - Math.exp(-dt * TUNE.pressFollow) : p.hero ? 1 - Math.exp(-dt * 5) : k;
        it.rx += (rx - it.rx) * kk; it.ry += (ry - it.ry) * kk; it.lift += (lift - it.lift) * kk; it.scale += (scale - it.scale) * kk;
        moving = true;
      } else { it.rx = rx; it.ry = ry; it.lift = lift; it.scale = scale; }
    }
    return moving;
  };
  stage.invalidate();

  if (document.querySelector("[data-stage]")) import("./product.js").then((m) => m.attachStage(stage));
}
