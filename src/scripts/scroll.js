// A reload keeps the place on the page. Browsers restore it on their own, but not reliably here: the page grows as
// fonts, pictures and the 3D packs come in, and with smooth scrolling on (base.css) some browsers restore before
// the page is tall enough or animate from the top. So the site does it itself: the place is kept per address in this
// tab (sessionStorage) and put back, instantly, after a reload or a step back, and again while the page settles,
// until the visitor scrolls on their own.
const KEY = "qq-scroll:" + location.pathname + location.search;

export function initScroll() {
  if (!("scrollRestoration" in history)) return;
  history.scrollRestoration = "manual";
  let saved = null;
  try { saved = JSON.parse(sessionStorage.getItem(KEY)); } catch { /* storage off: the browser's own way */ }
  const save = () => { try { sessionStorage.setItem(KEY, JSON.stringify({ y: scrollY, x: scrollX })); } catch { /* nothing */ } };
  let t = 0;
  addEventListener("scroll", () => { clearTimeout(t); t = setTimeout(save, 150); }, { passive: true });
  addEventListener("pagehide", save);

  const nav = performance.getEntriesByType?.("navigation")[0]?.type;
  if (!saved || (nav !== "reload" && nav !== "back_forward") || location.hash) return;
  const go = () => window.scrollTo({ top: saved.y, left: saved.x, behavior: "instant" });
  go();
  // put it back while the page settles (fonts, pictures, the packs), until the visitor moves it themselves
  let mine = false;
  const stop = () => { mine = true; ro?.disconnect(); };
  for (const e of ["wheel", "touchstart", "keydown", "pointerdown"]) addEventListener(e, stop, { once: true, passive: true });
  const ro = "ResizeObserver" in window ? new ResizeObserver(() => { if (!mine && Math.abs(scrollY - saved.y) > 1) go(); }) : null;
  ro?.observe(document.documentElement);
  document.fonts?.ready.then(() => { if (!mine) go(); });
  addEventListener("load", () => { if (!mine) go(); setTimeout(stop, 1500); }, { once: true });
}
