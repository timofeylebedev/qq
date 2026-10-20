// Small behaviours of the shop, account and information pages, each only where its markup is:
//   [data-dialog="id"]   opens the <dialog id>; a link keeps its address in the history while the dialog is open
//                        (the beans: account/beans/), so Back closes it; data-topic / data-title fill the request form
//   [data-dialog-close]  closes it, as do Escape and a click on the backdrop
//   [data-open-on-load]  a dialog open when its page opens (account/beans/); closing it returns to the page under it
//   [data-request]       the request form: checked, then a word that it is not sent yet (no server behind the site)
//   [data-tabs]          tabs over panels (the beans): click or the arrow keys
//   [data-copy]          copies its value (the referral link, a tracking number)
//   [data-rate]          the rating of a coffee bought (localStorage "qq-rate"); up and down exclude each other
//   [data-soon]          a control whose page or service does not exist yet: says so
import { load, save, toast } from "./buy.js";

export function initUi() {
  const dialogs = document.querySelectorAll("[data-dialog-box]");
  if (dialogs.length) dialogsUi(dialogs);
  for (const t of document.querySelectorAll("[data-tabs]")) tabs(t);
  rate();
  document.addEventListener("click", (e) => {
    const c = e.target.closest("[data-copy]"), s = e.target.closest("[data-soon]");
    if (c) {
      const done = () => toast("Скопировано");
      navigator.clipboard?.writeText(c.dataset.copy).then(done, () => toast(c.dataset.copy)) ?? toast(c.dataset.copy);
    }
    if (s) toast(s.dataset.soon);
  });
}

function dialogsUi(dialogs) {
  let pushed = null;
  const open = (d, opener) => {
    if (opener?.dataset.topic) {
      const f = d.querySelector("[data-topic-field]"); if (f) f.value = opener.dataset.topic;
      const t = d.querySelector("[data-dialog-title]"); if (t && opener.dataset.title) t.textContent = opener.dataset.title;
    }
    if (!d.open) d.showModal();
  };
  const close = (d) => {
    if (!d.open) return;
    d.close();
    if (pushed === d) { pushed = null; history.back(); }
    else if (d.hasAttribute("data-open-on-load")) {
      // the page opened with this dialog (account/beans/): closing it leaves the page under it, address and title too
      d.removeAttribute("data-open-on-load");
      if (d.dataset.home) { history.replaceState(null, "", d.dataset.home); if (d.dataset.homeTitle) document.title = d.dataset.homeTitle; }
    }
  };
  document.addEventListener("click", (e) => {
    const o = e.target.closest("[data-dialog]");
    if (o) {
      const d = document.getElementById(o.dataset.dialog);
      if (!d) return;
      e.preventDefault();
      if (o.href && o.href !== location.href) { history.replaceState({ dialog: null }, ""); history.pushState({ dialog: d.id }, "", o.href); pushed = d; }
      open(d, o);
    }
    const x = e.target.closest("[data-dialog-close]");
    if (x) close(x.closest("dialog"));
  });
  for (const d of dialogs) {
    // a click on the backdrop lands on the dialog itself, outside its box
    d.addEventListener("click", (e) => {
      if (e.target !== d) return;
      const r = d.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) close(d);
    });
    d.addEventListener("cancel", (e) => { e.preventDefault(); close(d); });
    if (d.hasAttribute("data-open-on-load")) d.showModal();
  }
  // Back closes a dialog opened with an address; Forward to that address opens it again
  addEventListener("popstate", (e) => {
    for (const d of dialogs) if (d.open && pushed === d) { pushed = null; d.close(); }
    const id = e.state?.dialog, d = id && document.getElementById(id);
    if (d && !d.open) { pushed = d; d.showModal(); }
  });
  for (const f of document.querySelectorAll("[data-request]")) f.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!f.reportValidity()) return;
    toast("Форма пока не отправляется — напишите нам на sales@qqcoffee.ru");
    close(f.closest("dialog")); f.reset();
  });
}

function tabs(list) {
  const buttons = [...list.querySelectorAll('[role="tab"]')];
  const pick = (b, focus) => {
    for (const x of buttons) {
      const on = x === b;
      x.setAttribute("aria-selected", String(on)); x.tabIndex = on ? 0 : -1;
      document.getElementById(x.getAttribute("aria-controls")).hidden = !on;
    }
    if (focus) b.focus();
  };
  list.addEventListener("click", (e) => { const b = e.target.closest('[role="tab"]'); if (b) pick(b); });
  list.addEventListener("keydown", (e) => {
    const i = buttons.indexOf(document.activeElement);
    if (i < 0) return;
    const j = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? buttons.length - 1 : null;
    if (j === null) return;
    e.preventDefault(); pick(buttons[(j + buttons.length) % buttons.length], true);
  });
}

function rate() {
  const KEY = "qq-rate";
  const sync = () => { const r = load(KEY, {}); for (const b of document.querySelectorAll("[data-rate]")) b.setAttribute("aria-pressed", String(r[b.dataset.slug] === b.dataset.rate)); };
  if (!document.querySelector("[data-rate]")) return;
  sync();
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-rate]");
    if (!b) return;
    const r = load(KEY, {});
    if (r[b.dataset.slug] === b.dataset.rate) delete r[b.dataset.slug]; else r[b.dataset.slug] = b.dataset.rate;
    save(KEY, r); sync();
  });
}
