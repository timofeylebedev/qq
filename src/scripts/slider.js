// Sideways rows that scroll with snapping (new arrivals, recommended). The arrows of the section head move a row by
// one item; the pager of new arrivals jumps to an item and shows which one is in view. Swiping and the trackpad
// work as they do anywhere: the row is an ordinary scrolling box.
export function initSliders() {
  for (const track of document.querySelectorAll("[data-slider]")) {
    const name = track.dataset.slider;
    const items = () => [...track.children];
    const prev = document.querySelector(`[data-prev="${name}"]`), next = document.querySelector(`[data-next="${name}"]`);
    const dots = [...(track.closest("section")?.querySelectorAll("[data-go]") || [])];
    const step = () => { const [a, b] = items(); return b ? b.offsetLeft - a.offsetLeft : track.clientWidth; };
    const behavior = matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth";
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
  }
}
