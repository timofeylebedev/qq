// [data-toggle] buttons open and close the element named in their aria-controls (the plus of the info blocks, the
// «i» of the roast countdown). A target marked data-reveal is not hidden but marked data-open, so its styles can
// move it in and out (the roast note: the clock and its caption step away first, home.css).
export function initToggles() {
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-toggle]");
    if (!b) return;
    const target = document.getElementById(b.getAttribute("aria-controls"));
    if (!target) return;
    const open = b.getAttribute("aria-expanded") !== "true";
    b.setAttribute("aria-expanded", String(open));
    if ("reveal" in target.dataset) target.toggleAttribute("data-open", open);
    else target.hidden = !open;
  });
}
