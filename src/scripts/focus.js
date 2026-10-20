// Focus shows only for the keyboard (Tim, round 5: a click changes nothing). The browsers' own rule (:focus-visible)
// follows the last input; here the page also keeps html[data-keyed] while the keyboard is in use, for the text fields
// (a field always matches :focus-visible, so its ring is drawn only under data-keyed), and scripts that move the focus
// pass it on with focusVisible.
let key = false;
const set = (on) => { key = on; document.documentElement.toggleAttribute("data-keyed", on); };
addEventListener("keydown", (e) => { if (!e.metaKey && !e.altKey && !e.ctrlKey && !key) set(true); }, true);
addEventListener("pointerdown", () => { if (key) set(false); }, true);

export function focusFrom(el, opts = {}) { el?.focus({ preventScroll: true, ...opts, focusVisible: key }); }
