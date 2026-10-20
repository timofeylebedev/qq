// The 3D packs of a page: one WebGL canvas (scripts/pouch3d.js) draws every [data-pack] slot.
//
//   cards      face the viewer, turned a little towards the middle of the screen, and towards the pointer over
//              their card. The page's scroll never tilts them (Tim, round 3).
//   every pack trails its slot a little when the page scrolls, and catches up as it stops. When the slot itself
//              moves on the page (its row slides, its card rises into place), the pack trails it and tilts the way
//              it is carried: sideways in a sliding row, up and down as a card rises. Pressed, it moves away from
//              the viewer and stays there while held (a quick click still shows it)
//   product    the big pack of a coffee's page turns once around as its fact tiles scroll past (scripts/product.js
//              gives the progress); it settles in from a quarter turn when the page opens
//
// Until the canvas has drawn (and without WebGL) each slot shows a still of the same pack. With «reduce motion» the
// packs stand still, facing front.
import { Pouch3D } from "./pouch3d.js";

const LOOK = { depth: 1.0, relief: 2.0, light: 0.75, sheen: 0.35, shadow: 0.38 };   // the approved look (docs/3d-pack-notes.md)
export const TUNE = {           // window.qqPacks in the console: try values live
  turn: 0.3,                    // how much a card's pack turns towards the middle of the screen (rad over the screen)
  hoverTurn: 0.5, hoverTilt: 0.3, hoverLift: 0.35,
  follow: 9,                    // how fast packs follow their targets (1/s)
  lag: 9,                       // how fast a pack catches up with its slot after a scroll (1/s)
  lagMax: 0.12, lagMaxPx: 40,   // … and how far it may trail: a share of its slot's height, at most this many px
  carryTurn: 0.55, carryTilt: 0.45,   // carried by its row or card: the turn (sideways) and tilt (up/down) at the full trail
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
    const p = { el, it, hero, hx: 0, hy: 0, hover: false, press: false, lx: 0, ly: 0, cx: 0, cy: 0, px: null, py: 0, sx: 0, sy: 0, carryUntil: 0 };
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
    // the big pack settles in from a quarter turn, unless the page was opened from a card (it arrives facing front)
    if (hero && !reduced && document.documentElement.dataset.vt !== "in") it.ry = -1.4;
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
    for (const p of items) if (!p.hero && e.detail?.el?.contains(p.el)) { p.carryUntil = until; p.it.live = true; }
    stage.invalidate();
  });

  stage.onTick = (dt, now) => {
    let moving = false;
    const k = 1 - Math.exp(-dt * TUNE.follow);
    const sy = scrollY, vw = innerWidth;

    for (const p of items) {
      const it = p.it;
      let rx = 0, ry = 0, lift = 0, scale = 1;
      if (p.hero) {
        const t = window.qqStage?.progress ?? 0;           // 0 → 1 over the fact tiles
        ry = reduced ? 0 : -0.35 + t * Math.PI * 2;
        rx = reduced ? 0 : -0.06 + 0.1 * Math.sin(t * Math.PI);
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

      // the lag, in two parts: the page's scroll (the pack only trails) and the slot's own move on the page (its row
      // slides, its card rises: the pack trails and tilts). Both soft-capped, so a jump to an anchor stays small.
      const m = Math.max(1, Math.min(TUNE.lagMax * it.h, TUNE.lagMaxPx)), decay = Math.exp(-dt * TUNE.lag);
      if (reduced || p.px === null) { p.lx = p.ly = p.cx = p.cy = 0; }
      else { p.lx += scrollX - p.sx; p.ly += sy - p.sy; p.cx -= it.x - p.px; p.cy -= it.y - p.py; }
      p.px = it.x; p.py = it.y; p.sx = scrollX; p.sy = sy;
      const cap = (v) => { v = Math.max(-3 * m, Math.min(3 * m, v)) * decay; return Math.abs(v) < 0.2 ? 0 : v; };
      p.lx = cap(p.lx); p.ly = cap(p.ly); p.cx = cap(p.cx); p.cy = cap(p.cy);
      const ox = m * Math.tanh((p.lx + p.cx) / m), oy = m * Math.tanh((p.ly + p.cy) / m);
      it.ox = ox; it.oy = oy;
      if (p.lx || p.ly || p.cx || p.cy) moving = true;
      if (!p.hero) { ry -= Math.tanh(p.cx / m) * TUNE.carryTurn; rx += Math.tanh(p.cy / m) * TUNE.carryTilt; }

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
