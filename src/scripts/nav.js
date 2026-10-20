// The navbar and the tab bar take the colours of the section under them; the menu behind the burger.
//
// Every section says its ground (data-ground: paper, cloud, black, ink). A bar changes only once it stands wholly over
// one section (its whole height inside the section's box), and its colours cross over smoothly (nav.css); while a
// boundary runs through the bar it keeps the colours it has. Scrolled above the top of the page (the bounce of a
// touchpad or a phone) the bars keep the first section's ground, and the page behind the bounce is that colour too.
export function initNav() {
  const nav = document.querySelector("[data-nav]");
  if (!nav) return;
  const tabbar = document.querySelector("[data-tabbar]");
  const root = document.documentElement;
  const grounds = [...document.querySelectorAll("main [data-ground], body > footer[data-ground]")];

  // the ground under the band [top, bottom] of the screen: the section that holds it wholly; else, if the grounds at
  // its two edges are the same (two white sections meeting), that one; else null while the boundary crosses it — or,
  // when the bar has no colour of its own yet (the page has just opened, or jumped), the ground under its middle
  const at = (y) => { let best = null, h = Infinity; for (const el of grounds) { const r = el.getBoundingClientRect(); if (r.top <= y && r.bottom > y && r.height < h) { best = el.dataset.ground; h = r.height; } } return best; };
  const under = (top, bottom, fresh) => {
    let best = null, h = Infinity;
    for (const el of grounds) {
      const r = el.getBoundingClientRect();
      if (r.top <= top + 0.5 && r.bottom >= bottom - 0.5 && r.height < h) { best = el.dataset.ground; h = r.height; }
    }
    if (best) return best;
    const a = at(top + 0.5), b = at(bottom - 0.5);
    return a && a === b ? a : fresh ? at((top + bottom) / 2) : null;
  };
  const first = grounds[0]?.dataset.ground || "paper", last = grounds[grounds.length - 1]?.dataset.ground || "paper";
  let queued = false, lastY = null;
  const update = () => {
    queued = false;
    if (!grounds.length) return;   // a page without sections (the component canvas's navbar frames) keeps its ground
    // a jump (the first look, a reload in the middle of the page, an anchor, End): no colour to keep, and no crossing
    const fresh = lastY === null || Math.abs(scrollY - lastY) > innerHeight / 2;
    lastY = scrollY;
    const top = scrollY <= 0, end = scrollY + innerHeight >= root.scrollHeight - 1;
    const set = (bar, g) => {
      if (!g || bar.dataset.ground === g) return;
      if (fresh) { bar.dataset.instant = ""; requestAnimationFrame(() => requestAnimationFrame(() => delete bar.dataset.instant)); }
      bar.dataset.ground = g;
    };
    set(nav, top ? first : under(0, nav.offsetHeight, fresh));
    if (tabbar && tabbar.offsetHeight) set(tabbar, end ? last : under(innerHeight - tabbar.offsetHeight, innerHeight, fresh));
    // the colour behind a bounce: the first ground in the top half of the page, the last in the bottom half
    const over = scrollY + innerHeight / 2 < root.scrollHeight / 2 ? first : last;
    if (root.dataset.over !== over) root.dataset.over = over;
  };
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
  addEventListener("scroll", queue, { passive: true });
  addEventListener("resize", queue, { passive: true });
  update();

  // the logo on the home page is not a link (it would reload the page): a click takes the page back to its top
  nav.querySelector("[data-to-top]")?.addEventListener("click", () => scrollTo({ top: 0 }));

  const button = nav.querySelector("[data-menu-button]"), menu = nav.querySelector("[data-menu]");
  if (!button || !menu) return;
  // open, the menu slides in from under the bar (nav.css); closed, it is hidden from the reader and the keyboard too
  const isOpen = () => nav.hasAttribute("data-open");
  const set = (open) => {
    button.setAttribute("aria-expanded", String(open));
    nav.toggleAttribute("data-open", open);
  };
  button.addEventListener("click", () => set(!isOpen()));
  addEventListener("keydown", (e) => { if (e.key === "Escape" && isOpen()) { set(false); button.focus(); } });
  menu.addEventListener("click", (e) => { if (e.target.closest("a[href]")) set(false); });
  matchMedia("(width >= 48em)").addEventListener("change", (e) => { if (e.matches) set(false); });
}
