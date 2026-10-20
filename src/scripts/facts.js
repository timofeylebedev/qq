// The three info blocks of the home page (roasting, payment, delivery). A block is one button: pressed, it grows into
// a modal (one <dialog>, the three panels in it, one shown at a time), and the modal steps to the other two with its
// «‹ Доставка | Оплата ›» row. Closing (the cross, Esc, a click beside it) shrinks it back into the block it shows.
//
// The growing is one card (Tim, round 5: seamless, smooth both ways): the modal's box starts on the block, cut to the
// block's size, and grows into place, nothing stretched. Inside it the icon and the title travel from the block to
// their places at the same size; the text rides with the title, coming in as it goes; the step row stays at the
// card's foot, so it slides up from under the growing edge; the block's plus travels to the corner and turns into
// the cross. Closing is the same move backwards. With «reduce motion» the modal simply opens and closes.
import { focusFrom } from "./focus.js";

const T = () => {
  const cs = getComputedStyle(document.documentElement);
  const s = (v) => parseFloat(v) * (v.trim().endsWith("ms") ? 1 : 1000);
  return { move: s(cs.getPropertyValue("--t-move")), out: s(cs.getPropertyValue("--t-out")), ease: cs.getPropertyValue("--ease-move").trim(), easeOut: cs.getPropertyValue("--ease-out").trim() };
};
const box = (el) => el.getBoundingClientRect();

export function initFacts() {
  const dialog = document.querySelector("[data-facts-modal]");
  if (!dialog || !dialog.showModal) return;
  const blocks = [...document.querySelectorAll("[data-fact]")];
  const panels = [...dialog.querySelectorAll("[data-fact-panel]")];
  const shell = dialog.querySelector(".fmodal__box");
  const close = dialog.querySelector("[data-fact-close]"), cross = close.querySelector('[data-morph="plus"]');
  let at = -1, busy = false;

  const part = (root, name) => root.querySelector(`[data-morph="${name}"]`);
  // one panel shown (the others stay in the box's one cell, hidden and inert, so the box keeps its height); the
  // dialog is named by its title
  const show = (i) => { panels.forEach((p, j) => { p.toggleAttribute("data-off", j !== i); p.inert = j !== i; }); at = i; dialog.setAttribute("aria-labelledby", `fact-${i}-title`); };
  // the moving parts of the block stay hidden while the modal holds them
  const hold = (i, on) => { for (const n of ["icon", "title", "plus"]) part(blocks[i], n).style.visibility = on ? "hidden" : ""; };

  // from the block to the modal (forward), or back (reverse): one card
  function morph(i, reverse) {
    const t = T(), b = blocks[i], p = panels[i];
    const B = box(b), M = box(shell);
    const dx = B.left - M.left, dy = B.top - M.top, cw = M.width - B.width, ch = M.height - B.height;
    const opts = { duration: t.move, easing: t.easeOut, fill: "both", direction: reverse ? "reverse" : "normal" };
    const anims = [];
    dialog.dataset.morphing = "";
    // a part's way from the block to its place, inside the card (which itself moves by dx, dy); every box is measured
    // before anything moves
    const corner = (el, to) => { const a = box(el), c = box(to); return `translate(${a.left - c.left - dx}px, ${a.top - c.top - dy}px)`; };
    const centre = (el, to) => { const a = box(el), c = box(to); return `translate(${a.left + a.width / 2 - c.left - c.width / 2 - dx}px, ${a.top + a.height / 2 - c.top - c.height / 2 - dy}px)`; };
    const icon = part(p, "icon"), title = part(p, "title"), text = p.querySelector(".fmodal__text"), nav = p.querySelector(".fmodal__nav");
    const fromIcon = corner(part(b, "icon"), icon), fromTitle = corner(part(b, "title"), title), fromCross = centre(part(b, "plus"), cross);
    const navFrom = `translateY(${nav.offsetHeight - Math.max(0, ch)}px)`;
    anims.push(shell.animate([
      { transform: `translate(${dx}px, ${dy}px)`, clipPath: `inset(0px ${Math.max(0, cw)}px ${Math.max(0, ch)}px 0px)` },
      { transform: "none", clipPath: "inset(0px 0px 0px 0px)" }], opts));
    anims.push(icon.animate([{ transform: fromIcon }, { transform: "none" }], opts));
    anims.push(title.animate([{ transform: fromTitle }, { transform: "none" }], opts));
    // the text rides with the title, coming in as it goes; the step row slides up from under the card's growing foot
    anims.push(text.animate([{ transform: fromTitle, opacity: 0 }, { transform: "none", opacity: 1 }], opts));
    anims.push(nav.animate([{ transform: navFrom }, { transform: "none" }], opts));
    anims.push(cross.animate([{ transform: fromCross + " rotate(0deg)" }, { transform: "rotate(45deg)" }], opts));
    anims.push(dialog.querySelector(".fmodal__dim").animate([{ opacity: 0 }, { opacity: 1 }], opts));
    return Promise.all(anims.map((a) => a.finished)).then(() => { delete dialog.dataset.morphing; return anims; });
  }

  let wantShut = false;            // a close asked for while the modal is still moving: done as soon as it stops
  async function open(i) {
    if (busy || dialog.open) return;
    busy = true; wantShut = false;
    show(i);
    // the scrollbar's width, if the browser draws one: the page and its bars keep that room while it is gone
    document.documentElement.style.setProperty("--sbw", `${Math.max(0, innerWidth - document.documentElement.clientWidth)}px`);
    document.documentElement.dataset.modal = "";
    dialog.showModal();
    hold(i, true);
    const anims = await morph(i, false);
    anims.forEach((a) => a.cancel());
    busy = false;
    if (wantShut) shut();
  }

  async function shut() {
    if (!dialog.open) return;
    if (busy) { wantShut = true; return; }
    busy = true; wantShut = false;
    const anims = await morph(at, true);
    dialog.close();                 // the close event tidies up (below)
    anims.forEach((a) => a.cancel());
    busy = false;
  }

  // however the dialog closes (the cross, Esc, a click beside it, or the browser closing it itself), the page gets
  // back its scroll and its block, and the focus returns to that block
  dialog.addEventListener("close", () => {
    for (let i = 0; i < blocks.length; i++) hold(i, false);
    delete document.documentElement.dataset.modal; delete dialog.dataset.morphing;
    focusFrom(blocks[at]);
    busy = false; wantShut = false;
  });

  // to another block: the old text slides out, the new one in; the box and its step row stay where they are
  async function step(j) {
    if (busy || j === at) return;
    busy = true;
    const t = T(), i = at, n = panels.length;
    const dir = (j - i + n) % n === 1 ? 1 : -1;
    const old = panels[i].querySelector(".fmodal__body"), neu = panels[j].querySelector(".fmodal__body");
    hold(i, false); hold(j, true);
    const out = old.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: `translateX(${-24 * dir}px)` }], { duration: t.out * 0.5, easing: t.ease, fill: "both" });
    await out.finished;
    show(j); out.cancel();
    const into = neu.animate([{ opacity: 0, transform: `translateX(${24 * dir}px)` }, { opacity: 1, transform: "none" }], { duration: t.out, easing: t.easeOut });
    focusFrom(panels[j].querySelector(`[data-fact-go="${i}"]`));
    await into.finished;
    busy = false;
  }

  blocks.forEach((b, i) => b.addEventListener("click", () => open(i)));
  close.addEventListener("click", shut);
  dialog.addEventListener("cancel", (e) => { e.preventDefault(); shut(); });
  dialog.querySelector(".fmodal__dim").addEventListener("click", shut);
  dialog.addEventListener("click", (e) => { const g = e.target.closest("[data-fact-go]"); if (g) step(Number(g.dataset.factGo)); });
}
