// The three info blocks of the home page (roasting, payment, delivery). A block is one button: pressed, it grows into
// a modal (one <dialog>, the three panels in it, one shown at a time), and the modal steps to the other two with its
// «‹ Доставка | Оплата ›» row. Closing (the cross, Esc, a click beside it) shrinks it back into the block it shows.
//
// The growing is a shared-element move, so nothing is stretched: the modal's white ground grows from the block's box
// (an empty box may scale), while the icon and the title travel from the block to their places in the modal at the
// same size, and the block's plus travels to the corner and turns into the cross. The text and the step row fade in
// after. With «reduce motion» the modal simply opens and closes.
const T = () => {
  const cs = getComputedStyle(document.documentElement);
  const s = (v) => parseFloat(v) * (v.trim().endsWith("ms") ? 1 : 1000);
  return { move: s(cs.getPropertyValue("--t-move")), out: s(cs.getPropertyValue("--t-out")), ease: cs.getPropertyValue("--ease-move").trim(), easeOut: cs.getPropertyValue("--ease-out").trim() };
};
const box = (el) => el.getBoundingClientRect();
const sheet = () => matchMedia("(width < 40em)").matches;   // a phone: the modal is a sheet at the foot of the screen (media.css --phone)

export function initFacts() {
  const dialog = document.querySelector("[data-facts-modal]");
  if (!dialog || !dialog.showModal) return;
  const blocks = [...document.querySelectorAll("[data-fact]")];
  const panels = [...dialog.querySelectorAll("[data-fact-panel]")];
  const ground = dialog.querySelector('[data-morph="ground"]'), shell = dialog.querySelector(".fmodal__box");
  const close = dialog.querySelector("[data-fact-close]"), cross = close.querySelector('[data-morph="plus"]');
  let at = -1, busy = false;

  const part = (root, name) => root.querySelector(`[data-morph="${name}"]`);
  const show = (i) => { panels.forEach((p, j) => { p.hidden = j !== i; }); at = i; };
  // the moving parts of the block stay hidden while the modal holds them
  const hold = (i, on) => { for (const n of ["icon", "title", "plus"]) part(blocks[i], n).style.visibility = on ? "hidden" : ""; };

  // from the block's parts to the modal's (forward), or back (reverse)
  function morph(i, reverse) {
    const t = T(), b = blocks[i], p = panels[i];
    const B = box(b), M = box(shell);
    // the arriving curve: the ground is nearly in place when the text comes in (and leaves first on the way back)
    const opts = { duration: t.move, easing: t.easeOut, fill: "both", direction: reverse ? "reverse" : "normal" };
    const anims = [];
    dialog.dataset.morphing = "";
    const from = (el, to, extra = "") => {
      const a = box(el), c = box(to);
      return `translate(${a.left - c.left}px, ${a.top - c.top}px)${extra}`;
    };
    anims.push(ground.animate([{ transformOrigin: "0 0", transform: `translate(${B.left - M.left}px, ${B.top - M.top}px) scale(${B.width / M.width}, ${B.height / M.height})` }, { transformOrigin: "0 0", transform: "none" }], opts));
    for (const n of ["icon", "title"]) anims.push(part(p, n).animate([{ transform: from(part(b, n), part(p, n)) }, { transform: "none" }], opts));
    anims.push(cross.animate([{ transform: from(part(b, "plus"), cross) + " rotate(0deg)" }, { transform: "rotate(45deg)" }], opts));
    // the rest of the modal comes in once the ground is mostly there (and goes first on the way back)
    const rest = [p.querySelector(".fmodal__text"), p.querySelector(".fmodal__nav"), dialog.querySelector(".fmodal__dim")];
    rest.forEach((el, k) => anims.push(el.animate(k === 2
      ? [{ opacity: 0 }, { opacity: 1 }]
      : [{ opacity: 0, transform: "translateY(12px)" }, { opacity: 1, transform: "none" }],
    k === 2 ? opts : { ...opts, delay: reverse ? 0 : t.move * 0.3, endDelay: reverse ? t.move * 0.3 : 0, duration: t.move * 0.7 })));
    return Promise.all(anims.map((a) => a.finished)).then(() => { delete dialog.dataset.morphing; return anims; });
  }

  async function open(i) {
    if (busy || dialog.open) return;
    busy = true;
    show(i);
    document.documentElement.dataset.modal = "";
    dialog.showModal();
    hold(i, true);
    const anims = await morph(i, false);
    anims.forEach((a) => a.cancel());
    busy = false;
  }

  async function shut() {
    if (busy || !dialog.open) return;
    busy = true;
    const i = at;
    const anims = await morph(i, true);
    dialog.close();
    anims.forEach((a) => a.cancel());
    hold(i, false);
    delete document.documentElement.dataset.modal;
    blocks[i].focus({ preventScroll: true });
    busy = false;
  }

  // to another block: the old panel slides out, the new one in, the ground eases to the new height
  async function step(j) {
    if (busy || j === at) return;
    busy = true;
    const t = T(), i = at, n = panels.length;
    const dir = (j - i + n) % n === 1 ? 1 : -1;
    const h0 = box(shell).height, old = panels[i], neu = panels[j];
    hold(i, false); hold(j, true);
    const out = old.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: `translateX(${-24 * dir}px)` }], { duration: t.out * 0.5, easing: t.ease, fill: "both" });
    await out.finished;
    show(j); out.cancel();
    const h1 = box(shell).height;
    const anims = [
      ground.animate([{ transformOrigin: sheet() ? "50% 100%" : "50% 50%", transform: `scaleY(${h0 / h1})` }, { transformOrigin: sheet() ? "50% 100%" : "50% 50%", transform: "none" }], { duration: t.out, easing: t.ease }),
      neu.animate([{ opacity: 0, transform: `translateX(${24 * dir}px)` }, { opacity: 1, transform: "none" }], { duration: t.out, easing: t.easeOut })
    ];
    neu.querySelector(`[data-fact-go="${i}"]`)?.focus({ preventScroll: true });
    await Promise.all(anims.map((a) => a.finished));
    busy = false;
  }

  blocks.forEach((b, i) => b.addEventListener("click", () => open(i)));
  close.addEventListener("click", shut);
  dialog.addEventListener("cancel", (e) => { e.preventDefault(); shut(); });
  dialog.querySelector(".fmodal__dim").addEventListener("click", shut);
  dialog.addEventListener("click", (e) => { const g = e.target.closest("[data-fact-go]"); if (g) step(Number(g.dataset.factGo)); });
}
