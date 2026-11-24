// «Отзывы» (a coffee's page, src/templates/people.mjs): the filter by how people brew, and the review form.
//   [data-people-filter]  chips by way of brewing: show only those reviews (without this script nothing is hidden). The
//                         choice is this browser's (localStorage "qq-brew"), so the next coffee's page opens on the same way.
//   [data-review-form]    checked, then a word that it is not sent: there is no shop behind the site yet
//                         (docs/people-backend.md). An answer «не про вкус» needs no taste answers.
import { toast } from "./buy.js";

const KEY = "qq-brew";
const store = { get() { try { return localStorage.getItem(KEY); } catch { return null; } }, set(v) { try { localStorage.setItem(KEY, v); } catch {} } };

export function initPeople() {
  for (const bar of document.querySelectorAll("[data-people-filter]")) filter(bar);
  for (const f of document.querySelectorAll("[data-review-form]")) form(f);
}

function filter(bar) {
  const rows = [...bar.closest("[data-people]").querySelectorAll(".buyer")];
  const chips = [...bar.querySelectorAll("[data-g]")];
  const pick = (g, remember) => {
    if (!chips.some((c) => c.dataset.g === g)) g = "all";
    for (const c of chips) c.setAttribute("aria-pressed", String(c.dataset.g === g));
    for (const r of rows) r.hidden = !(g === "all" || (g === "milk" ? r.hasAttribute("data-milk") : r.dataset.g === g));
    if (remember) store.set(g);
  };
  bar.hidden = false;
  bar.addEventListener("click", (e) => { const c = e.target.closest("[data-g]"); if (c) pick(c.dataset.g, true); });
  const saved = store.get();
  if (saved) pick(saved, false);
}

function form(f) {
  const taste = [...f.querySelectorAll('input[name="method"], input[name="bright"], input[name="body"]')];
  f.addEventListener("change", (e) => {
    // «не про вкус» asks nothing about taste
    if (e.target.name === "issue") for (const i of taste) i.required = false;
  });
  f.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!f.reportValidity()) return;
    toast("Отзывы пока не отправляются: у сайта ещё нет магазина");
    f.closest("dialog")?.querySelector("[data-dialog-close]")?.click();
    f.reset();
    for (const i of taste) i.required = true;
  });
}
