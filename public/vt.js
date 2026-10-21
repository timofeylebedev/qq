// A plain script, loaded in <head> before the page is drawn (so pagereveal is heard on time); public/, so Vite copies
// it as it is rather than folding it into the page's module bundle (which runs after the first frame).
(() => {
// A card opening its coffee's page (and the page going back to the list) as one move: the browser's view transition
// between the two pages (@view-transition in motion.css; Chrome 126+, Safari 18.2+; elsewhere the page simply
// opens). The card's name becomes the page's title and its pack the page's big pack, each travelling from one place
// to the other while the rest of the page cross-fades.
//
// Names are given to one card only, the one being opened (or the one being returned to), just before the pages are
// captured. The 3D canvas can't be captured, so for that moment every pack shows its still (the same pack, rendered
// ahead), and a coffee's page that is arrived at this way starts its big pack facing front instead of turning in.
// Leaving, each pack on the screen is replaced by a picture of itself as the canvas draws it that moment (packs.js
// freeze), so nothing changes as the page is captured; arriving, the packs face front, as their stills do, until the
// pages have changed. On a coffee's page the name travels with the line under it (the head: Tim, round 7).
const coffee = (url) => { try { return new URL(url).pathname.match(/\/coffee\/([^/]+)\/?$/)?.[1] || null; } catch { return null; } };

// on the screen (and not a card still waiting to rise): only that may travel
const seen = (el) => {
  // a card waits hidden only in a reel that rises, or in the catalog while its cards are dealt (html[data-enter])
  if (!el || el.closest(".reel[data-rise] > [data-wait], html[data-enter] .grid[data-rise] > [data-wait]")) return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
};
// the link last clicked (a card's, a new arrival's): the one that travels when it opens its coffee
let clicked = null;
addEventListener("click", (e) => { clicked = e.target.closest?.("a[href]") || null; }, true);

// the parts of this page that belong to a coffee: the clicked card or slide, else a card of that coffee on the
// screen (a list), or the stage (its own page)
function parts(slug) {
  const stage = document.querySelector("[data-stage]");
  if (stage) { const name = stage.querySelector(".pstage__title"), pack = stage.querySelector(".pack--hero"); return { name: seen(name) ? name : null, pack: seen(pack) ? pack : null }; }
  const own = clicked && coffee(clicked.href) === slug ? clicked.closest("[data-card], .featured__slide") : null;
  const card = own?.matches("[data-card]") ? own : own ? null : [...document.querySelectorAll(`[data-card][data-slug="${CSS.escape(slug)}"]`)].find((c) => seen(c.querySelector(".card__title")));
  if (card) { const pk = card.querySelector(".pack"); return { name: card.querySelector(".card__title"), pack: seen(pk) ? pk : null }; }
  const slide = own || [...document.querySelectorAll(".featured__slide")].find((x) => coffee(x.querySelector(".featured__name a")?.href) === slug && seen(x.querySelector(".featured__name")));
  return slide ? { name: slide.querySelector(".featured__name"), pack: null } : {};
}

function name(slug, on) {
  const p = parts(slug);
  if (p.name) p.name.style.viewTransitionName = on ? "coffee-name" : "";
  if (p.pack) p.pack.style.viewTransitionName = on ? "coffee-pack" : "";
  return p;
}

function initTransitions() {
  if (!("onpagereveal" in window)) return;
  // leaving: name the card (or the stage) of the coffee being opened or left, and show the stills
  addEventListener("pageswap", (e) => {
    if (!e.viewTransition) return;
    const to = coffee(e.activation?.entry?.url), here = coffee(location.href);
    const slug = to || here;
    if (!slug || (to && here)) return;                  // from one coffee to another: just the cross-fade
    window.qqPacks?.freeze?.();                         // every pack leaves a picture of itself as it is drawn now
    document.documentElement.dataset.vt = "out";
    name(slug, true);
  });
  // arriving: the same names on this page's side
  addEventListener("pagereveal", (e) => {
    if (!e.viewTransition) return;
    const from = coffee(navigation?.activation?.from?.url), here = coffee(location.href);
    const slug = here || from;
    if (!slug || (from && here)) return;
    // a step back: put the page at its place first (scripts/scroll.js keeps it; it runs only after this frame), so
    // the card it returns to is found where it will be
    if (navigation.activation?.navigationType === "traverse") {
      try { const at = JSON.parse(sessionStorage.getItem("qq-scroll:" + location.pathname + location.search)); if (at) { history.scrollRestoration = "manual"; scrollTo({ top: at.y, left: at.x, behavior: "instant" }); } } catch { /* storage off */ }
    }
    document.documentElement.dataset.vt = "in";
    name(slug, true);
    e.viewTransition.finished.finally(() => { name(slug, false); delete document.documentElement.dataset.vt; window.qqPacks?.stage.invalidate(); });
  });
  // back from the page the card opened (bfcache): the names given when leaving are taken off again
  addEventListener("pageshow", () => { if (document.documentElement.dataset.vt === "out") { delete document.documentElement.dataset.vt; for (const el of document.querySelectorAll("[style*='view-transition-name']")) el.style.viewTransitionName = ""; } });
}

initTransitions();
})();
