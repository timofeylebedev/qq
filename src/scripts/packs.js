// The 3D packs of a page: one WebGL canvas (scripts/pouch3d.js) draws every [data-pack] slot.
//
//   cards      face the viewer, turned a little towards the middle of the screen, and towards the pointer over
//              their card. The page's scroll never tilts them (Tim, round 3).
//   every pack stays exactly in its slot while the page scrolls or its row slides (no lag, no tilt: Tim, round 5).
//              A card rising into place carries its pack up: the pack trails it a little and tilts up and down as it
//              goes. Pressed anywhere on its card, a pack moves away from the viewer and stays there while held (a
//              quick click still shows it)
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
  lag: 9,                       // how fast a pack catches up with its rising card (1/s)
  lagMax: 0.12, lagMaxPx: 40,   // … and how far it may trail: a share of its slot's height, at most this many px
  carryTilt: 0.45,              // carried up by its rising card: the tilt (up/down) at the full trail
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
  window.qqPacks = { stage, TUNE, freeze: () => {} };

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
      const inside = (e) => { const r = el.getBoundingClientRect(); return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom; };
      const down = () => { clearTimeout(off); p.press = true; since = performance.now(); stage.invalidate(); };
      const up = () => {
        clearTimeout(wait); if (!p.press) return;
        off = setTimeout(() => { p.press = false; stage.invalidate(); }, Math.max(0, TUNE.pressHold * 1000 - (performance.now() - since)));
      };
      (el.closest("[data-card], .featured__slide") || el).addEventListener("pointerdown", (e) => {
        if (e.button > 0 || (hero && !inside(e)) || e.target.closest("button, input, label, select, .buy")) return;
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
    for (const p of items) if (!p.hero && e.detail?.el?.contains(p.el)) { p.carryUntil = until; p.it.live = true; p.tilt = e.detail.tilt !== false; }
    stage.invalidate();
  });

  // a card that was already rising when the packs came in (a reload in the middle of the page: the rows rise at once,
  // the 3D stage is ready a moment later) missed its qq:carry: its pack is carried for the rest of the rise, so it
  // neither stands where the card was when measured nor shows at full strength before its card does (Tim, round 7)
  for (const p of items) {
    const run = p.fade?.getAnimations?.().filter((a) => a.playState === "running") || [];
    if (!run.length) continue;
    const left = Math.max(300, ...run.map((a) => { const t = a.effect?.getComputedTiming?.(); return t ? t.endTime - (a.currentTime || 0) : 0; }));
    p.carryUntil = performance.now() + left + 100; p.it.live = true; p.tilt = true;
  }

  // the page is going to another (scripts/../vt.js, pageswap): the canvas can't be captured, so every pack on the
  // screen leaves a picture of itself, as it is drawn this moment, in its slot (not the still: a pack turned towards
  // the pointer that became the front-facing still on the way out was the flicker, Tim, round 7)
  window.qqPacks.freeze = () => {
    for (const p of items) {
      if (!p.it.visible || p.el.querySelector(".pack__shot")) continue;
      const c = stage.shot(p.it);
      if (c) { c.className = "pack__shot"; c.setAttribute("aria-hidden", "true"); p.el.append(c); }
    }
  };
  addEventListener("pageshow", () => { for (const c of document.querySelectorAll(".pack__shot")) c.remove(); });
  // arriving by a card (html[data-vt="in"]): the packs face the viewer, as their stills do, until the pages have
  // changed, and only then turn to where they look
  const arriving = () => document.documentElement.dataset.vt === "in";

  stage.onTick = (dt, now) => {
    let moving = false;
    const k = 1 - Math.exp(-dt * TUNE.follow);
    const vw = innerWidth;

    for (const p of items) {
      const it = p.it;
      let rx = 0, ry = 0, lift = 0, scale = 1;
      if (p.hero && arriving()) { ry = 0; rx = 0; }
      else if (p.hero) {
        const t = window.qqStage?.progress ?? 0;           // 0 → 1 over the fact tiles
        ry = reduced ? 0 : -0.35 + t * Math.PI * 2;
        rx = reduced ? 0 : -0.06 + 0.1 * Math.sin(t * Math.PI);
      } else if (!reduced && !arriving()) {
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
