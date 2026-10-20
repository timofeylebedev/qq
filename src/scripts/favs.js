// The favourites page: every coffee's card is on the page, hidden; the visitor's favourites (localStorage "qq-fav",
// the hearts of the site, oldest first) are shown in the order chosen: newest added first, cheaper, dearer, by name.
// A heart taken off here hides its card. Runs before the 3D packs are set up, so the shown cards get their packs.
import { FAV, load, save, badge, toast } from "./buy.js";

export function initFavs() {
  const grid = document.querySelector("[data-fav-grid]");
  if (!grid) return;
  const cards = new Map([...grid.querySelectorAll("[data-card]")].map((c) => [c.dataset.slug, c]));
  const sort = document.querySelector("[data-fav-sort]"), count = document.querySelector("[data-fav-count]");
  const empty = document.querySelector("[data-fav-empty]"), bar = document.querySelector("[data-fav-bar]");
  const name = (c) => c.querySelector(".card__link")?.textContent.trim() || "";

  function show() {
    const fav = load(FAV, []).filter((s) => cards.has(s));
    const order = {
      date: [...fav].reverse(),
      cheap: [...fav].sort((a, b) => cards.get(a).dataset.price - cards.get(b).dataset.price),
      expensive: [...fav].sort((a, b) => cards.get(b).dataset.price - cards.get(a).dataset.price),
      name: [...fav].sort((a, b) => name(cards.get(a)).localeCompare(name(cards.get(b)), "ru"))
    }[sort.value] || fav;
    // the shown cards in the chosen order, in the document itself (so the keyboard and screen readers follow it too)
    for (const [slug, c] of cards) c.toggleAttribute("data-out", !order.includes(slug));
    for (const slug of order) grid.append(cards.get(slug));
    count.textContent = fav.length || "";
    empty.hidden = fav.length > 0; bar.hidden = !fav.length; grid.hidden = !fav.length;
    dispatchEvent(new Event("qq:layout"));
  }
  show();
  sort.addEventListener("change", show);
  // a heart anywhere on this page (its grid or «Рекомендуем»): scripts/buy.js changes the list first, so wait a turn
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-fav]");
    if (!b) return;
    setTimeout(() => { show(); if (b.closest("[data-fav-grid]") && b.getAttribute("aria-pressed") === "false") toast(`${name(b.closest("[data-card]"))} — убран из избранного`); });
  });
  document.querySelector("[data-fav-clear]").addEventListener("click", () => { save(FAV, []); badge(); show(); toast("Избранное пусто"); });
  addEventListener("storage", (e) => { if (e.key === FAV) show(); });
}
