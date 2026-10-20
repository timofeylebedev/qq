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
const coffee = (url) => { try { return new URL(url).pathname.match(/\/coffee\/([^/]+)\/?$/)?.[1] || null; } catch { return null; } };

// the parts of this page that belong to a coffee: its card (a list) or its stage (its own page)
function parts(slug) {
  const stage = document.querySelector("[data-stage]");
  if (stage) return { name: stage.querySelector(".pstage__name"), pack: stage.querySelector(".pack--hero") };
  const card = [...document.querySelectorAll(`[data-card][data-slug="${CSS.escape(slug)}"]`)].find((c) => {
    const r = c.getBoundingClientRect(); return r.width > 0 && r.bottom > -innerHeight && r.top < innerHeight * 2;
  });
  if (card) return { name: card.querySelector(".card__title"), pack: card.querySelector(".pack") };
  const slide = [...document.querySelectorAll(".featured__slide")].find((s) => coffee(s.querySelector(".featured__name a")?.href) === slug);
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
    document.documentElement.dataset.vt = "out";
    name(slug, true);
  });
  // arriving: the same names on this page's side
  addEventListener("pagereveal", (e) => {
    if (!e.viewTransition) return;
    const from = coffee(navigation?.activation?.from?.url), here = coffee(location.href);
    const slug = here || from;
    if (!slug || (from && here)) return;
    document.documentElement.dataset.vt = "in";
    name(slug, true);
    e.viewTransition.finished.finally(() => { name(slug, false); delete document.documentElement.dataset.vt; });
  });
  // back from the page the card opened (bfcache): the names given when leaving are taken off again
  addEventListener("pageshow", () => { if (document.documentElement.dataset.vt === "out") { delete document.documentElement.dataset.vt; for (const el of document.querySelectorAll("[style*='view-transition-name']")) el.style.viewTransitionName = ""; } });
}

initTransitions();
})();
