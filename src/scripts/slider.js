// Sideways rows that scroll with snapping (new arrivals, recommended). The arrows of the section head move a row by
// one item; the pager of new arrivals jumps to an item and shows which one is in view. Swiping and the trackpad
// work as they do anywhere: the row is an ordinary scrolling box.
//
// A reel (recommended) runs out to the screen's edges, so a card sliding past the column is not cut at it: the row
// is widened by the column's margins (--bleed, measured here) and padded back, and it snaps to the column. Its cards
// rise into place from below as they come into view (the section reaching the screen, or a card sliding in);
// their packs are carried up with them (scripts/packs.js, the event qq:carry).
const calm = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

export function initSliders() {
  for (const track of document.querySelectorAll("[data-slider]")) {
    const name = track.dataset.slider;
    const items = () => [...track.children];
    const prev = document.querySelector(`[data-prev="${name}"]`), next = document.querySelector(`[data-next="${name}"]`);
    const dots = [...(track.closest("section")?.querySelectorAll("[data-go]") || [])];
    const step = () => { const [a, b] = items(); return b ? b.offsetLeft - a.offsetLeft : track.clientWidth; };
    const behavior = calm() ? "instant" : "smooth";
    const go = (dx) => track.scrollBy({ left: dx, behavior });

    // at an end the arrow is aria-disabled, not disabled: a disabled button would drop the keyboard focus to the page
    const off = (b) => b.getAttribute("aria-disabled") === "true";
    prev?.addEventListener("click", () => off(prev) || go(-step()));
    next?.addEventListener("click", () => off(next) || go(step()));
    dots.forEach((d) => d.addEventListener("click", () => track.scrollTo({ left: items()[Number(d.dataset.go)].offsetLeft - items()[0].offsetLeft, behavior })));

    const sync = () => {
      const max = track.scrollWidth - track.clientWidth;
      prev?.setAttribute("aria-disabled", String(track.scrollLeft <= 2));
      next?.setAttribute("aria-disabled", String(track.scrollLeft >= max - 2));
      const i = Math.round(track.scrollLeft / step());
      dots.forEach((d, j) => d.setAttribute("aria-current", String(i === j)));
    };
    let raf = 0;
    track.addEventListener("scroll", () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(sync); }, { passive: true });
    new ResizeObserver(sync).observe(track);
    sync();

    if (track.classList.contains("reel")) { bleed(track); rise(track); }
    for (const t of track.querySelectorAll(".featured__text")) fitLines(t);
  }
}

// From L a new arrival's text is a square: its story is cut to the whole lines that fit between the name and the
// taste box (--lines; 8 without this script, or below L where the text grows instead)
function fitLines(box) {
  const about = box.querySelector(".featured__about"), name = box.querySelector(".featured__name"), facts = box.querySelector(".featured__facts");
  const fit = () => {
    if (getComputedStyle(box).aspectRatio === "auto") { about.style.removeProperty("--lines"); return; }
    const cs = getComputedStyle(box), lh = parseFloat(getComputedStyle(about).lineHeight);
    const gap = parseFloat(cs.rowGap) || 0, inner = parseFloat(getComputedStyle(name.parentElement).rowGap) || 0;
    const room = box.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - facts.offsetHeight - gap - name.offsetHeight - inner;
    about.style.setProperty("--lines", String(Math.max(1, Math.min(8, Math.floor(room / lh)))));
  };
  new ResizeObserver(fit).observe(box);
}

// the column's margin on each side, from the column itself (the page's width without its scrollbar)
function bleed(track) {
  const col = track.parentElement;
  const set = () => {
    const r = col.getBoundingClientRect();
    track.style.setProperty("--bleed-l", `${Math.max(0, r.left)}px`);
    track.style.setProperty("--bleed-r", `${Math.max(0, document.documentElement.clientWidth - r.right)}px`);
  };
  set();
  new ResizeObserver(set).observe(document.documentElement);
}

// cards out of view wait below, transparent; coming into view (the row reaching the screen, or sliding in) they rise
function rise(track) {
  if (calm() || !("IntersectionObserver" in window)) return;
  const cards = [...track.children];
  let shown = false;
  track.dataset.rise = "";
  for (const c of cards) c.dataset.wait = "";
  const up = (c, delay = 0) => {
    if (!("wait" in c.dataset)) return;
    c.style.transitionDelay = `${delay}ms`;
    delete c.dataset.wait;
    dispatchEvent(new CustomEvent("qq:carry", { detail: { el: c, ms: 1100 + delay } }));
  };
  // sideways: a card entering the row's box rises; one that has left it entirely waits below again
  const side = new IntersectionObserver((list) => {
    if (!shown) return;
    for (const e of list) {
      if (e.isIntersecting) up(e.target);
      else { e.target.style.transitionDelay = "0ms"; e.target.dataset.wait = ""; }
    }
  }, { root: track, threshold: 0 });
  // down the page: when the row comes onto the screen, the cards in view rise one after another
  const page = new IntersectionObserver((list) => {
    if (!list.some((e) => e.isIntersecting)) return;
    page.disconnect(); shown = true;
    const box = track.getBoundingClientRect();
    cards.filter((c) => { const r = c.getBoundingClientRect(); return r.right > box.left && r.left < box.right; })
      .forEach((c, i) => up(c, i * 90));
    for (const c of cards) side.observe(c);
  }, { threshold: 0.2 });
  page.observe(track);
}
