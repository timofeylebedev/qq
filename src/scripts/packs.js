// The 3D packs of a page: one WebGL canvas (scripts/pouch3d.js) draws every [data-pack] slot.
//
//   cards      face the viewer, turned a little towards the middle of the screen, and towards the pointer over
//              their card. The page's scroll never tilts them (Tim, round 3).
//   every pack stays exactly in its slot while the page scrolls or its row slides (no lag, no tilt: Tim, round 5).
//              A card rising into place carries its pack up: the pack trails it a little and tilts up and down as it
//              goes. Pressed anywhere on its card, a pack moves away from the viewer and stays there while held (a
//              quick click still shows it)
//   product    the big pack of a coffee's page turns once around as its fact tiles scroll past (scripts/product.js
//              gives the progress), exactly with the scroll (no easing behind it: Tim, round 7); it settles in from a
//              quarter turn when the page opens. It can be dragged round (and tilted) by hand; let go, it turns back
//              to the angle of the scroll. While it is pinned the canvas stands on the screen (stage.fixed), so the
//              pack never rides the page's scroll for a frame before it is drawn again
//
// Until the canvas has drawn (and without WebGL) each slot shows a still of the same pack. With «reduce motion» the
// packs stand still, facing front.
import { Pouch3D } from "./pouch3d.js";

const LOOK = { depth: 1.0, relief: 2.0, light: 0.75, sheen: 0.35, shadow: 0.38 };   // the approved look (docs/3d-pack-notes.md)
export const TUNE = {           // window.qqPacks in the console: try values live
  turn: 0.3,                    // how much a card's pack turns towards the middle of the screen (rad over the screen)
  hoverTurn: 0.5, hoverTilt: 0.3, hoverLift: 0.35,
  follow: 9,                    // how fast packs follow their targets (1/s)
  lag: 9,                       // how fast a pack catches up with its rising card (1/s)
  lagMax: 0.12, lagMaxPx: 40,   // … and how far it may trail: a share of its slot's height, at most this many px
  carryTilt: 0.45,              // carried up by its rising card: the tilt (up/down) at the full trail
  pressLift: -0.45, pressScale: 0.94, pressHold: 0.2, pressFollow: 16,  // pressed: further away, smaller, held ≥ 0.2s
  dragTurn: 0.012, dragTilt: 0.006, dragTiltMax: 0.6,   // the big pack dragged: rad per px across, per px down (capped)
  dragFollow: 24, dragBack: 5                           // … how fast it follows the pointer, and turns back when let go (1/s)
};

// the big pack of a coffee's page, by hand: a drag over it turns it round (across) and tilts it (down); let go, it turns
// back. The tiles scroll over the pin, so the stage hears the pointer and checks it is over the pack, not a tile. On a
// touch screen only a drag across turns it (the stage lets a drag up or down scroll the page: touch-action pan-y).
function drag(p) {
  const stage = p.el.closest("[data-stage]");
  if (!stage) return;
  const over = (e) => { const r = p.el.getBoundingClientRect(); return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom && !e.target.closest(".ptile, a, button, input, label, summary"); };
  let x0 = 0, y0 = 0, id = null;
  const end = (e) => {
    if (e.pointerId !== id) return;
    id = null; p.drag.on = false; p.drag.tx = 0; p.drag.ty = 0;
    stage.style.cursor = "";
    window.qqPacks?.stage.invalidate();
  };
  stage.addEventListener("pointerdown", (e) => {
    if (e.button > 0 || id !== null || !over(e)) return;
    id = e.pointerId; x0 = e.clientX - p.drag.x / TUNE.dragTurn; y0 = e.clientY - p.drag.y / TUNE.dragTilt;
    p.drag.on = true; stage.setPointerCapture(id); stage.style.cursor = "grabbing";
    if (e.pointerType === "mouse") e.preventDefault();   // no text selection while dragging
  });
  stage.addEventListener("pointermove", (e) => {
    if (e.pointerId === id) {
      p.drag.tx = (e.clientX - x0) * TUNE.dragTurn;
      p.drag.ty = Math.max(-TUNE.dragTiltMax, Math.min(TUNE.dragTiltMax, (e.clientY - y0) * TUNE.dragTilt));
      window.qqPacks?.stage.invalidate();
    } else if (e.pointerType === "mouse") stage.style.cursor = over(e) ? "grab" : "";
  });
  stage.addEventListener("pointerup", end);
  stage.addEventListener("pointercancel", end);
}

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
    const p = { el, it, hero, hx: 0, hy: 0, hover: false, press: false, cy: 0, px: null, py: 0, carryUntil: 0 };
    // a click on the pack opens its coffee, as a click on its name does (the name's link covers only the name)
    const link = el.closest("[data-card], .featured__slide")?.querySelector(".card__link, .featured__name a");
    if (link && !hero) (el.closest("[data-card], .featured__media") || el).addEventListener("click", (e) => {
      const r = el.getBoundingClientRect();
      if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom && !e.target.closest("a, button, input, label, select, form")) link.click();
    });
    if (!reduced) {
      // press: the pointer goes down anywhere on the card (not its buttons); it lets go at least pressHold later, so a click reads
      let since = 0, wait = 0, off = 0;
      const down = () => { clearTimeout(off); p.press = true; since = performance.now(); stage.invalidate(); };
      const up = () => {
        clearTimeout(wait); if (!p.press) return;
        off = setTimeout(() => { p.press = false; stage.invalidate(); }, Math.max(0, TUNE.pressHold * 1000 - (performance.now() - since)));
      };
      if (!hero) (el.closest("[data-card], .featured__slide") || el).addEventListener("pointerdown", (e) => {
        if (e.button > 0 || e.target.closest("button, input, label, select, .buy")) return;
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
    // the big pack settles in from a quarter turn, unless the page was opened from a card (it arrives facing front)
    p.drag = { on: false, x: 0, y: 0, tx: 0, ty: 0 };   // the hand's turn and tilt (tx, ty: where it is going)
    if (hero && !reduced && document.documentElement.dataset.vt !== "in") p.drag.x = -1.05;
    if (hero) drag(p);
    p.fade = el.closest("[data-rise] > *");        // a card that rises into place: its pack fades with it
    return p;
  });

  // show the canvas once the label is decoded, so a pack never shows up blank
  const labels = [...new Set(items.map((p) => p.it.front))];
  await Promise.all(labels.map((u) => { const im = new Image(); im.src = u; return im.decode().catch(() => {}); }));
  for (const p of items) p.el.dataset.live = "";
  document.documentElement.classList.add("has-3d");

  // rows that scroll sideways move their packs without moving the page
  for (const row of document.querySelectorAll("[data-slider]")) row.addEventListener("scroll", () => stage.measure(), { passive: true });
  // a change of the page's layout moves slots without carrying them: start their lag afresh
  const relayout = () => { for (const p of items) p.px = null; stage.measure(); };
  addEventListener("qq:layout", relayout);
  if (document.fonts?.ready) document.fonts.ready.then(relayout);

  addEventListener("resize", () => { for (const p of items) p.px = null; }, { passive: true });

  // a card rising into place (scripts/slider.js) moves its slot without a scroll: measure it every frame meanwhile
  addEventListener("qq:carry", (e) => {
    const until = performance.now() + (e.detail?.ms || 1000);
    for (const p of items) if (!p.hero && e.detail?.el?.contains(p.el)) { p.carryUntil = until; p.it.live = true; p.tilt = e.detail.tilt !== false; }
    stage.invalidate();
  });

  stage.onTick = (dt, now) => {
    let moving = false;
    const k = 1 - Math.exp(-dt * TUNE.follow);
    const vw = innerWidth;

    for (const p of items) {
      const it = p.it;
      let rx = 0, ry = 0, lift = 0, scale = 1;
      if (p.hero) {
        const t = window.qqStage?.progress ?? 0;           // 0 → 1 over the fact tiles
        const d = p.drag, kd = d.on ? 1 - Math.exp(-dt * TUNE.dragFollow) : reduced ? 1 : 1 - Math.exp(-dt * TUNE.dragBack);
        d.x += (d.tx - d.x) * kd; d.y += (d.ty - d.y) * kd;
        if (Math.abs(d.tx - d.x) + Math.abs(d.ty - d.y) < 0.001) { d.x = d.tx; d.y = d.ty; } else moving = true;
        // the scroll's angle as it is, the hand's on top of it; nothing eases behind the scroll
        it.ry = (reduced ? 0 : -0.35 + t * Math.PI * 2) + d.x;
        it.rx = (reduced ? 0 : -0.06 + 0.1 * Math.sin(t * Math.PI)) + d.y;
        it.lift = 0; it.scale = 1; it.ox = it.oy = 0;
        // pinned (the tiles still to pass): the canvas stands on the screen with the pin
        stage.fixed = it.visible && t < 1;
        continue;
      } else if (!reduced) {
        ry = -((it.x + it.w / 2) / vw - 0.5) * TUNE.turn;
        if (p.hover) { ry += p.hx * TUNE.hoverTurn; rx += p.hy * TUNE.hoverTilt; lift = TUNE.hoverLift; scale = 1.03; }
      }
      if (p.press) { lift += TUNE.pressLift; scale *= TUNE.pressScale; }
      if (p.carryUntil && now > p.carryUntil) { p.carryUntil = 0; p.it.live = false; }
      if (p.fade) {
        const a = p.carryUntil || "wait" in p.fade.dataset ? +getComputedStyle(p.fade).opacity : 1;
        if (a !== it.alpha) { it.alpha = a; moving = true; }
      }

      // a card rising into place: its pack trails the slot's own move up the page and tilts with it (soft-capped).
      // The page's scroll and a sliding row move the slot without any lag (Tim, round 5).
      const m = Math.max(1, Math.min(TUNE.lagMax * it.h, TUNE.lagMaxPx)), decay = Math.exp(-dt * TUNE.lag);
      if (reduced || p.px === null || !p.carryUntil || !p.tilt) p.cy = 0;   // a card sinking away takes its pack upright, no trail
      else p.cy -= it.y - p.py;
      p.px = it.x; p.py = it.y;
      const cap = (v) => { v = Math.max(-3 * m, Math.min(3 * m, v)) * decay; return Math.abs(v) < 0.2 ? 0 : v; };
      p.cy = cap(p.cy);
      it.ox = 0; it.oy = m * Math.tanh(p.cy / m);
      if (p.cy) moving = true;
      if (!p.hero) rx += Math.tanh(p.cy / m) * TUNE.carryTilt;

      if (!it.visible) { it.rx = rx; it.ry = ry; it.lift = lift; it.scale = scale; continue; }
      const e = Math.abs(rx - it.rx) + Math.abs(ry - it.ry) + Math.abs(lift - it.lift) + Math.abs(scale - it.scale) * 4;
      if (e > 0.002) {
        const kk = p.press || Math.abs(it.lift - lift) > 0.3 ? 1 - Math.exp(-dt * TUNE.pressFollow) : k;
        it.rx += (rx - it.rx) * kk; it.ry += (ry - it.ry) * kk; it.lift += (lift - it.lift) * kk; it.scale += (scale - it.scale) * kk;
        moving = true;
      } else { it.rx = rx; it.ry = ry; it.lift = lift; it.scale = scale; }
    }
    return moving;
  };
  stage.invalidate();

  if (document.querySelector("[data-stage]")) import("./product.js").then((m) => m.attachStage(stage));
}
