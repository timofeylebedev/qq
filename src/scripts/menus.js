// The menu cells of a page (src/templates/blocks.mjs menu, components/menu.css): the catalog's filters and the
// product's options. One open at a time; a click elsewhere, Escape or the keyboard's focus leaving it closes it. A
// list that would stick out of its form on the right (a narrow cell's list is wider than the cell) opens leftwards.
// A menu of one choice (radios) writes the chosen option into its cell; the filters write theirs (scripts/filters.js).
import { focusFrom } from "./focus.js";

export function initMenus() {
  const cells = [...document.querySelectorAll("details.filter")];
  if (!cells.length) return;
  cells.forEach((d) => d.addEventListener("toggle", () => {
    if (!d.open) return;
    cells.forEach((o) => o !== d && (o.open = false));
    const panel = d.querySelector(".filter__options"), edge = (d.closest("form") || document.documentElement).getBoundingClientRect().right;
    panel.style.left = panel.style.right = "";
    if (panel.getBoundingClientRect().right > edge + 1) { panel.style.left = "auto"; panel.style.right = "-1px"; }
    // a list that opens upwards but has no room above it (the buy bar under the navbar on a short screen) opens down
    d.removeAttribute("data-down");
    if (d.classList.contains("filter--up") && panel.getBoundingClientRect().top < (parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")) || 48)) d.setAttribute("data-down", "");
  }));
  document.addEventListener("click", (e) => { if (!e.target.closest("details.filter")) cells.forEach((d) => (d.open = false)); });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const open = cells.find((d) => d.open);
    if (open) { open.open = false; focusFrom(open.querySelector("summary")); }
  });
  // an open list must not cover what the keyboard focuses next
  cells.forEach((d) => d.addEventListener("focusout", (e) => { if (d.open && !d.contains(e.relatedTarget) && e.relatedTarget) d.open = false; }));

  for (const d of cells) {
    if (!d.querySelector('input[type="radio"]') || d.closest("[data-filters]")) continue;
    const value = d.querySelector("[data-filter-value]");
    const write = () => { const on = d.querySelector("input:checked"); if (on) value.textContent = on.nextElementSibling.textContent; };
    // a choice by pointer closes the list; the keyboard's arrows only move the choice (Enter closes it)
    let pointer = false;
    d.addEventListener("pointerdown", () => { pointer = true; });
    d.addEventListener("change", () => { write(); if (pointer) d.open = false; pointer = false; });
    d.addEventListener("keydown", (e) => { pointer = false; if (e.key === "Enter" && e.target.matches("input")) { e.preventDefault(); d.open = false; focusFrom(d.querySelector("summary")); } });
    write();
  }
}
