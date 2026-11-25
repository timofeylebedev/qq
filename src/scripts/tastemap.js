// The taste map (src/templates/map.mjs): what it does in the browser. The catalogue lights what its choice finds and
// takes a region as a choice; the quiz (session 4) will light its picks and draw the visitor's wide region (`area`).
//
//   const map = initTasteMap(el, { onRegion(id, on), onDot(slug), info(slug) → html })
//   map.light(slugs | null)       the coffees to light (null: all lit); the others stay, dimmed, never hidden
//   map.regions(ids)              which regions are pressed
//   map.area({ u, v, ru, rv })    draw a soft region (0–1 of the box; null removes it)
//   map.show(slug | null)         open a dot's card under the map (redrawn on every light(), so it stays current)
// Dots and regions are one Tab stop each; the arrow keys move between them (in reading order).
import { focusFrom } from "./focus.js";

const LABELS_UPTO = 6;   // names beside the lit dots when this few are lit

export function initTasteMap(el, { onRegion = () => {}, onDot = () => {}, info = () => "" } = {}) {
  const box = el.querySelector(".tmap__box"), labels = el.querySelector(".tmap__labels"), card = el.querySelector("[data-tmap-info]");
  const dots = [...el.querySelectorAll(".tmap__dots .tmap__dot")], regs = [...el.querySelectorAll(".tmap__region")];
  const dotOf = new Map(dots.map((d) => [d.dataset.slug, d]));
  let lit = null, shown = null;

  // ── the keys: one Tab stop per group, arrows inside it ──
  const roving = (list) => list.forEach((b, i) => b.addEventListener("keydown", (e) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1, Home: -i, End: list.length - 1 - i }[e.key];
    if (step == null) return;
    e.preventDefault();
    const n = list[(i + step + list.length) % list.length];
    list.forEach((x) => (x.tabIndex = -1)); n.tabIndex = 0; focusFrom(n);
  }));
  roving(dots); roving(regs);

  regs.forEach((r) => r.addEventListener("click", () => onRegion(r.dataset.region, r.getAttribute("aria-pressed") !== "true")));
  dots.forEach((d) => d.addEventListener("click", () => { api.show(shown === d.dataset.slug ? null : d.dataset.slug); onDot(d.dataset.slug); }));

  // ── names beside lit dots, where they fit: right, left, above, below; none over another dot or name ──
  function names() {
    labels.textContent = "";
    if (!lit || lit.size > LABELS_UPTO || !lit.size) return;
    const B = box.getBoundingClientRect(), taken = [];
    const dotRects = dots.map((d) => d.getBoundingClientRect());
    const clash = (r) => r.left < B.left + 2 || r.right > B.right - 2 || r.top < B.top + 2 || r.bottom > B.bottom - 2 ||
      taken.some((t) => !(r.right <= t.left || r.left >= t.right || r.bottom <= t.top || r.top >= t.bottom)) ||
      dotRects.some((t, i) => lit.has(dots[i].dataset.slug) && !(r.right <= t.left || r.left >= t.right || r.bottom <= t.top || r.top >= t.bottom));
    for (const d of dots) {
      if (!lit.has(d.dataset.slug)) continue;
      const s = document.createElement("span");
      s.className = "tmap__label"; s.textContent = d.querySelector(".sr").textContent; labels.append(s);
      const w = s.offsetWidth, h = s.offsetHeight, r = d.getBoundingClientRect(), g = 4;
      const spots = [[r.right + g, r.top + r.height / 2 - h / 2], [r.left - g - w, r.top + r.height / 2 - h / 2], [r.left + r.width / 2 - w / 2, r.top - g - h], [r.left + r.width / 2 - w / 2, r.bottom + g]];
      const at = spots.map(([x, y]) => ({ left: x, top: y, right: x + w, bottom: y + h })).find((q) => !clash(q));
      if (!at) { s.remove(); continue; }
      taken.push(at);
      s.style.left = `${at.left - B.left}px`; s.style.top = `${at.top - B.top}px`;
    }
  }
  new ResizeObserver(() => names()).observe(box);

  const api = {
    light(slugs) {
      lit = slugs ? new Set(slugs) : null;
      el.toggleAttribute("data-some", !!lit);
      for (const d of dots) {
        const on = !!lit && lit.has(d.dataset.slug);
        d.toggleAttribute("data-lit", on);
        // a screen reader hears what the eye sees: which dots a choice lights
        d.querySelector("[data-lit-sr]")?.remove();
        if (on) d.insertAdjacentHTML("beforeend", '<span class="sr" data-lit-sr>, подходит</span>');
      }
      names();
      if (shown) api.show(shown);
    },
    regions(ids) { for (const r of regs) r.setAttribute("aria-pressed", String(ids.includes(r.dataset.region))); },
    area(a) {
      el.querySelector(".tmap__area")?.remove();
      if (!a) return;
      const s = document.createElement("span");
      s.className = "tmap__area"; s.setAttribute("aria-hidden", "true");
      s.style.cssText = `--u: ${a.u * 100}%; --v: ${a.v * 100}%; --ru: ${a.ru * 100}%; --rv: ${a.rv * 100}%`;
      box.prepend(s);
    },
    show(slug) {
      shown = slug;
      for (const d of dots) d.setAttribute("aria-pressed", String(d.dataset.slug === slug));
      card.hidden = !slug;
      card.innerHTML = slug ? info(slug) : "";
    },
    dot: (slug) => dotOf.get(slug)
  };
  return api;
}
