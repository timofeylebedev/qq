// Focus moved by a script shows its ring only when the visitor is using the keyboard (Tim, round 5: a click changes
// nothing). The browsers' own rule (:focus-visible) follows the last input; a script passes it on with focusVisible.
let key = false;
addEventListener("keydown", (e) => { if (!e.metaKey && !e.altKey && !e.ctrlKey) key = true; }, true);
addEventListener("pointerdown", () => { key = false; }, true);

export const keyed = () => key;
export function focusFrom(el, opts = {}) { el?.focus({ preventScroll: true, ...opts, focusVisible: key }); }
