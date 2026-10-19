// The navbar: dark over the black hero of the home page, light everywhere else; the menu behind the burger
// (under 64em; a plain list for now, not designed yet).
export function initNav() {
  const nav = document.querySelector("[data-nav]");
  if (!nav) return;

  const hero = document.querySelector("[data-hero]");
  if (hero && "IntersectionObserver" in window) {
    // dark while the hero is under the navbar: watch the line at the navbar's bottom edge
    let io;
    const watch = () => {
      io?.disconnect();
      io = new IntersectionObserver(([e]) => { nav.dataset.theme = e.isIntersecting ? "dark" : "light"; }, { rootMargin: `-47px 0px -${Math.max(0, innerHeight - 48)}px 0px` });
      io.observe(hero);
    };
    watch();
    addEventListener("resize", watch, { passive: true });
  }

  const button = nav.querySelector("[data-menu-button]"), menu = nav.querySelector("[data-menu]");
  if (!button || !menu) return;
  const set = (open) => {
    button.setAttribute("aria-expanded", String(open));
    menu.hidden = !open;
    nav.toggleAttribute("data-open", open);
  };
  button.addEventListener("click", () => set(menu.hidden));
  addEventListener("keydown", (e) => { if (e.key === "Escape" && !menu.hidden) { set(false); button.focus(); } });
  menu.addEventListener("click", (e) => { if (e.target.closest("a")) set(false); });
  matchMedia("(width >= 64em)").addEventListener("change", (e) => { if (e.matches) set(false); });
}
