// [data-toggle] buttons open and close the element named in their aria-controls (the plus of the info blocks, the
// «i» of the roast countdown).
export function initToggles() {
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-toggle]");
    if (!b) return;
    const target = document.getElementById(b.getAttribute("aria-controls"));
    if (!target) return;
    const open = b.getAttribute("aria-expanded") !== "true";
    b.setAttribute("aria-expanded", String(open));
    target.hidden = !open;
  });
}
