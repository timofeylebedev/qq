// The stage of a coffee's page: how far the fact tiles have scrolled past the pinned pack, 0 at the start, 1 when the
// pin lets go. scripts/packs.js turns the pack by it. Also keeps --buybar-h equal to the buy bar's real height, so
// the pinned area fits between the navbar and the bar at every size.
let stage = null;
export const attachStage = (s) => { stage = s; s.measure(); };

export function initStage() {
  const section = document.querySelector("[data-stage]"), pin = section.querySelector(".pstage__pin");
  const bar = document.querySelector("[data-buybar]");
  window.qqStage = { progress: 0 };

  const measureBar = () => { if (bar) document.documentElement.style.setProperty("--buybar-h", bar.offsetHeight + "px"); };
  measureBar();
  if (bar) new ResizeObserver(() => { measureBar(); stage?.measure(); }).observe(bar);

  const update = () => {
    const r = section.getBoundingClientRect();
    const run = section.offsetHeight - pin.offsetHeight - (parseFloat(getComputedStyle(section).paddingTop) || 0);
    const done = -r.top;
    window.qqStage.progress = Math.min(1, Math.max(0, done / Math.max(1, run)));
    stage?.invalidate();
  };
  addEventListener("scroll", update, { passive: true });
  addEventListener("resize", update, { passive: true });
  update();
}
