// The navbar and the tab bar take the colours of the section under them; the menu behind the burger (a plain list
// for now, not designed yet).
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

  // the ground wholly under the band [top, bottom] of the screen, or null while a boundary crosses it
  const under = (top, bottom) => {
    let best = null, h = Infinity;
    for (const el of grounds) {
      const r = el.getBoundingClientRect();
      if (r.top <= top + 0.5 && r.bottom >= bottom - 0.5 && r.height < h) { best = el.dataset.ground; h = r.height; }
    }
    return best;
  };
  const first = grounds[0]?.dataset.ground || "paper", last = grounds[grounds.length - 1]?.dataset.ground || "paper";
  let queued = false;
  const update = () => {
    if (!grounds.length) return;   // a page without sections (the component canvas's navbar frames) keeps its ground
    queued = false;
    const top = scrollY <= 0, end = scrollY + innerHeight >= root.scrollHeight - 1;
    const g = top ? first : under(0, nav.offsetHeight);
    if (g && nav.dataset.ground !== g) nav.dataset.ground = g;
    if (tabbar && tabbar.offsetHeight) {
      const t = end ? last : under(innerHeight - tabbar.offsetHeight, innerHeight);
      if (t && tabbar.dataset.ground !== t) tabbar.dataset.ground = t;
    }
    // the colour behind a bounce: the first ground in the top half of the page, the last in the bottom half
    const over = scrollY + innerHeight / 2 < root.scrollHeight / 2 ? first : last;
    if (root.dataset.over !== over) root.dataset.over = over;
  };
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
  addEventListener("scroll", queue, { passive: true });
  addEventListener("resize", queue, { passive: true });
  update();

  const button = nav.querySelector("[data-menu-button]"), menu = nav.querySelector("[data-menu]");
  if (!button || !menu) return;
  const set = (open) => {
    button.setAttribute("aria-expanded", String(open));
    menu.hidden = !open;
    nav.toggleAttribute("data-open", open);
  };
  button.addEventListener("click", () => set(menu.hidden));
  addEventListener("keydown", (e) => { if (e.key === "Escape" && !menu.hidden) { set(false); button.focus(); } });
  menu.addEventListener("click", (e) => { if (e.target.closest("a[href]")) set(false); });
  matchMedia("(width >= 48em)").addEventListener("change", (e) => { if (e.matches) set(false); });
}
