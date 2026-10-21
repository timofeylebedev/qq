// The navbar and the tab bar take the colours of the section under them; the menu behind the burger.
//
// Every section says its ground (data-ground: paper, cloud, black, ink). A bar changes the moment its leading edge
// touches another section (Tim, round 7): scrolling down, the section under its lower edge; scrolling up, the one
// under its upper edge. Its colours cross over smoothly (nav.css). Scrolled above the top of the page (the bounce of a
// touchpad or a phone) the bars keep the first section's ground, and the page behind the bounce is that colour too.
export function initNav() {
  const nav = document.querySelector("[data-nav]");
  if (!nav) return;
  const tabbar = document.querySelector("[data-tabbar]");
  const root = document.documentElement;
  const grounds = [...document.querySelectorAll("main [data-ground], body > footer[data-ground]")];

  // the ground at the line y of the screen: the smallest section that holds it (a section inside another wins)
  const at = (y) => { let best = null, h = Infinity; for (const el of grounds) { const r = el.getBoundingClientRect(); if (r.top <= y && r.bottom > y && r.height < h) { best = el.dataset.ground; h = r.height; } } return best; };
  // the ground the band [top, bottom] has touched: the one at its leading edge (down: its lower edge, up: its upper)
  const under = (top, bottom, down) => (down ? at(bottom - 0.5) : at(top + 0.5)) || at((top + bottom) / 2);
  const first = grounds[0]?.dataset.ground || "paper", last = grounds[grounds.length - 1]?.dataset.ground || "paper";
  let queued = false, lastY = null, down = true;
  const update = () => {
    queued = false;
    if (!grounds.length) return;   // a page without sections (the component canvas's navbar frames) keeps its ground
    // a jump (the first look, a reload in the middle of the page, an anchor, End): no colour to keep, and no crossing
    const fresh = lastY === null || Math.abs(scrollY - lastY) > innerHeight / 2;
    if (lastY !== null && scrollY !== lastY) down = scrollY > lastY;
    lastY = scrollY;
    const top = scrollY <= 0, end = scrollY + innerHeight >= root.scrollHeight - 1;
    const set = (bar, g) => {
      if (!g || bar.dataset.ground === g) return;
      if (fresh) { bar.dataset.instant = ""; requestAnimationFrame(() => requestAnimationFrame(() => delete bar.dataset.instant)); }
      bar.dataset.ground = g;
    };
    set(nav, top ? first : fresh ? at(nav.offsetHeight / 2) : under(0, nav.offsetHeight, down));
    if (tabbar && tabbar.offsetHeight) set(tabbar, end ? last : fresh ? at(innerHeight - tabbar.offsetHeight / 2) : under(innerHeight - tabbar.offsetHeight, innerHeight, down));
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
