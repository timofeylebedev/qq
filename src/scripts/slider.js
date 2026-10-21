// Sideways rows that scroll with snapping (recommended; new arrivals turn like pages instead: scripts/curl.js). The
// arrows of the section head move a row by one item. Swiping and the trackpad
// work as they do anywhere: the row is an ordinary scrolling box.
//
// A reel (recommended) shows whole cards only, clipped at the column (Tim, round 7). Its cards rise into place from
// below as they come into view (the section reaching the screen, or a card sliding in); their packs are carried up
// with them (scripts/packs.js, the event qq:carry).
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

    if (track.classList.contains("reel")) rise(track);
  }
  for (const t of document.querySelectorAll(".featured__text")) fitLines(t);
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

// Cards show only inside the column (Tim, round 5): out of it they wait below, transparent. Coming into it (the row
// reaching the screen, or a card sliding in) a card rises once half of it is in; as soon as it starts to slide out of
// it, it sinks away the same way, reversed. So at rest no card shows beyond the column, however far a swipe went.
// Where the row shows one card (a phone) any part of the next in the column is enough.
function rise(track) {
  if (calm() || !("IntersectionObserver" in window)) return;
  const cards = [...track.children];
  // back on the page (a reload, a step back from a coffee's page): the cards in view stand where they were, nothing
  // rises again (Tim, round 7: «when you go back to the recommended section all cards move»)
  const nav = performance.getEntriesByType?.("navigation")[0]?.type;
  const box = track.getBoundingClientRect();
  const back = (nav === "reload" || nav === "back_forward" || document.documentElement.dataset.vt === "in") && box.bottom > 0 && box.top < innerHeight;
  const per = Math.round(parseFloat(getComputedStyle(track).getPropertyValue("--per")) || 1);
  let shown = back;
  track.dataset.rise = "";
  cards.forEach((c, i) => { if (!back || i >= per) c.dataset.wait = ""; });
  const up = (c, delay = 0) => {
    if (!("wait" in c.dataset)) return;
    c.style.transitionDelay = `${delay}ms`;
    delete c.dataset.wait;
    dispatchEvent(new CustomEvent("qq:carry", { detail: { el: c, ms: 1100 + delay } }));
  };
  const down = (c) => {
    if ("wait" in c.dataset) return;
    c.style.transitionDelay = "0ms";
    c.dataset.wait = "out";              // leaving: the rise reversed (layout.css), not the instant wait of a card never shown
    dispatchEvent(new CustomEvent("qq:carry", { detail: { el: c, ms: 700, tilt: false } }));   // its pack goes with it, upright
  };
  // sideways: in the row's own box (the column)
  let side = null;
  const seen = new WeakMap();
  const watch = () => {
    side?.disconnect();
    side = new IntersectionObserver((list) => {
      if (!shown) return;
      const few = parseFloat(getComputedStyle(track).getPropertyValue("--per")) < 2;
      for (const e of list) {
        const c = e.target, now = e.isIntersecting ? e.intersectionRatio : 0, was = seen.get(c) ?? now;
        seen.set(c, now);
        if (few) (now > 0 ? up : down)(c);
        else if (now >= 0.98) up(c);           // wholly in
        else if (now < was) down(c);           // on its way out
        else if (now >= 0.5) up(c);            // half way in
      }
    }, { root: track, threshold: [0, 0.5, 0.98, 1] });
    if (shown) for (const c of cards) side.observe(c);
  };
  new ResizeObserver(watch).observe(document.documentElement);
  // down the page: when the row comes onto the screen, the cards in view rise one after another
  const page = new IntersectionObserver((list) => {
    if (!list.some((e) => e.isIntersecting)) return;
    page.disconnect(); shown = true;
    const box = track.getBoundingClientRect();
    cards.filter((c) => { const r = c.getBoundingClientRect(), inn = Math.min(r.right, box.right) - Math.max(r.left, box.left); return inn >= r.width / 2 || (inn > 0 && parseFloat(getComputedStyle(track).getPropertyValue("--per")) < 2); })
      .forEach((c, i) => up(c, i * 90));
    watch();
  }, { threshold: 0.2 });
  if (back) watch(); else page.observe(track);
}
