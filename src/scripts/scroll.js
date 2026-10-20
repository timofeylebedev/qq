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

// A change of the window's size keeps the place too (Tim, round 5): the page reflows (cards change columns, sizes
// follow the screen), so the same scrollY would show something else. The script keeps note of the first block that
// starts on the screen under the navbar (a heading, a card, a cell) and how far below the bar it stands; after a
// resize the page is scrolled so that block stands there again. If one block fills the screen past the bar, the
// point of it at the bar is kept instead. At the very top the page stays at the top.
export function initResizeKeep() {
  const line = () => (parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")) || 48) + 1;
  let anchor = null, resizing = 0, scrolling = 0, width = innerWidth;
  const block = (el) => { while (el && el !== document.body && (getComputedStyle(el).display.startsWith("inline") || !el.offsetHeight)) el = el.parentElement; return el; };
  const pick = () => {
    if (resizing || "modal" in document.documentElement.dataset) return;
    const y0 = line();
    if (scrollY < 1) { anchor = { top: true }; return; }
    for (let y = y0; y < innerHeight * 0.6; y += 24) {
      for (const x of [innerWidth / 2, innerWidth / 4, innerWidth * 0.75]) {
        let el = block(document.elementFromPoint(x, y));
        if (!el || el === document.body || el.closest(".nav, .tabbar, dialog")) continue;
        // the outermost block that still starts on the screen under the bar (a card rather than its title)
        while (el.parentElement && el.parentElement !== document.body && el.parentElement.getBoundingClientRect().top >= y0 - 1) el = el.parentElement;
        const r = el.getBoundingClientRect();
        if (r.top >= y0 - 1) { anchor = { el, dy: r.top - y0 }; return; }
      }
    }
    const el = block(document.elementFromPoint(innerWidth / 2, y0));
    if (el && el !== document.body) { const r = el.getBoundingClientRect(); anchor = { el, f: (y0 - r.top) / r.height }; }
  };
  const put = () => {
    if (!anchor || scrolling) return;
    if (anchor.top) { if (scrollY) scrollTo({ top: 0, behavior: "instant" }); return; }
    if (!anchor.el.isConnected) return;
    const r = anchor.el.getBoundingClientRect(), y0 = line();
    const d = "dy" in anchor ? r.top - y0 - anchor.dy : r.top + anchor.f * r.height - y0;
    if (Math.abs(d) >= 1) scrollTo({ top: scrollY + d, behavior: "instant" });
  };
  // the place is taken once a scroll has come to rest (not every frame), and never while a scroll is moving: a phone
  // changes its height (the toolbar hides) in the middle of a fling, and that must not stop it
  let rest = 0;
  addEventListener("scroll", () => {
    if (resizing) return;
    clearTimeout(scrolling); clearTimeout(rest);
    scrolling = setTimeout(() => { scrolling = 0; }, 150);
    rest = setTimeout(pick, 160);
  }, { passive: true });
  addEventListener("resize", () => {
    if (innerWidth === width) return;            // only a change of width reflows the page; a height change is a toolbar
    width = innerWidth;
    put(); requestAnimationFrame(() => { put(); requestAnimationFrame(put); });   // and again once the scripts have laid out
    clearTimeout(resizing); resizing = setTimeout(() => { resizing = 0; pick(); }, 400);
  });
  addEventListener("load", pick, { once: true });
  pick();
}
