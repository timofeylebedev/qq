// A card's taste panel (components.mjs tasteScale): with a mouse it shows while the card is hovered (CSS, no button to
// see); on a touch screen the info button in the picture's bottom left corner shows it. A press (a tap, Enter) pins it
// open until the next press, a press on another card's button, a press anywhere else
// or Esc. One listener for the whole page, so cards written later by a script (the bag, the favourites) work too.
export function initAbout() {
  const open = (about, on) => {
    about.toggleAttribute("data-open", on);
    about.querySelector("[data-about-toggle]").setAttribute("aria-expanded", String(on));
  };
  const all = () => document.querySelectorAll("[data-about][data-open]");
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-about-toggle]");
    const about = b?.closest("[data-about]");
    for (const a of all()) if (a !== about && !a.contains(e.target)) open(a, false);
    if (!b) return;
    e.preventDefault(); e.stopPropagation();   // the button lies over the card's link: a press never opens the page
    open(about, !about.hasAttribute("data-open"));
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    for (const a of all()) { open(a, false); a.querySelector("[data-about-toggle]").focus({ preventScroll: true }); }
  });
}
