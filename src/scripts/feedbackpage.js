// The feedback after delivery in the browser (session 6; docs/feedback.md). The account's pages are written in the
// placeholder visitor's state (src/templates/account.mjs); this script adds this browser's answers (localStorage
// "qq-feedback") and the quiz's region (qq-taste, when there is one), works the visitor's state out again with the same
// functions (src/scripts/feedbackview.js, feedback.js) and redraws what depends on it:
//   [data-fb-form]     an order's form per coffee: a few taps, then the reply (what counted, how the visitor moved, what next)
//   [data-fb-row]      an order's line in the list of orders · [data-fb-card] a purchase's line · [data-fb-prompt] the profile's question
//   [data-fb-map]      the profile's tile «Ваш вкус» · [data-fb-next] the profile's «Следующий кофе»
// A letter's buttons open an order with the first answer already tapped: account/orders/<id>/?fb=<slug>&bright=less#fb-<id>-<slug>.
// Nothing is sent: there is no shop behind the site yet (docs/feedback-backend.md says what a backend keeps).
import F from "../data/feedback.json";
import { stateOf, replyOf, rowOf, promptOf, purchaseOf, mineOf, replyHtml } from "./feedbackview.js";
import { setFor } from "./feedback.js";
import { loadTaste, loadFeedback, FEEDBACK } from "./tastesaved.js";
import { save, load } from "./buy.js";
// the profile's question closed with × (Tim, 26 Nov): the order and coffees it asked about
const CLOSED = "qq-fb-closed";
import { focusFrom } from "./focus.js";

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const root = () => document.documentElement.dataset.root || "";
const AXES = ["bright", "body", "unusual"];

export function initFeedback() {
  const host = document.querySelector("[data-fb-account]");
  const acc = JSON.parse(host.dataset.fbAccount);
  const today = acc.today || new Date().toISOString().slice(0, 10);
  const quiz = loadTaste()?.region || null;
  let local = loadFeedback()?.answers || [];
  const coffee = new Map(F.coffees.map((c) => [c.slug, c]));
  document.querySelector("[data-fb-prompt-close]")?.addEventListener("click", (e) => {
    const pr = e.currentTarget.closest("[data-fb-prompt]");
    save(CLOSED, pr.dataset.fbKey); pr.hidden = true;
  });
  let S;

  // this browser's answers over the placeholder's: one per bag and kind (taste, «не про вкус»); a kind the visitor
  // cleared is kept as { …, kind, cleared: true }, so it also hides the placeholder's
  const kindOf = (a) => (a.issue || a.kind === "issue" ? "issue" : "taste");
  const merged = () => {
    const m = new Map(acc.answers.map((a) => [`${a.order}/${a.slug}/${kindOf(a)}`, a]));
    for (const a of local) { const k = `${a.order}/${a.slug}/${kindOf(a)}`; if (a.cleared) m.delete(k); else m.set(k, a); }
    return [...m.values()];
  };
  const compute = () => { S = stateOf(acc, merged(), F, { quiz }); };
  const keep = () => {
    const mine = {};
    for (const slug of new Set(S.answers.map((a) => a.slug))) mine[slug] = mineOf(S.answers, slug, F, acc.orders);
    save(FEEDBACK, { v: 1, at: new Date().toISOString(), answers: local, region: S.st.region, mine });
  };

  // ── drawing ──
  function drawForms() {
    for (const f of document.querySelectorAll("[data-fb-form]")) {
      const a = S.byKey.get(`${f.dataset.order}/${f.dataset.slug}`);
      const ask = f.querySelector("[data-fb-ask]"), rep = f.querySelector("[data-fb-reply]");
      if (a && !f.hasAttribute("data-editing")) {
        const r = replyOf(S, acc, a, F);
        rep.innerHTML = r ? replyHtml(r, f.dataset.slug, F, root()) : "";
        rep.hidden = false; ask.hidden = true;
      } else { rep.hidden = true; ask.hidden = false; }
    }
  }
  function drawRows() {
    for (const el of document.querySelectorAll("[data-fb-row]")) {
      const o = acc.orders.find((x) => x.id === el.dataset.fbRow), r = rowOf(S, o, today, F);
      el.className = `orow__fb orow__fb--${r.kind}`;
      el.innerHTML = r.kind === "ask" ? `<a class="orow__fblink" href="${root()}account/orders/${o.id}/#feedback">${esc(r.text)}</a>` : esc(r.text);
    }
    for (const el of document.querySelectorAll("[data-fb-card]")) {
      const r = purchaseOf(S, acc, el.dataset.fbCard, today, F);
      el.className = `pcard__fb pcard__fb--${r.kind}`;
      el.innerHTML = r.kind === "later" ? esc(r.text) : `<a class="link" href="${root()}account/orders/${r.order}/#fb-${r.order}-${el.dataset.fbCard}">${esc(r.text)}</a>`;
    }
    const pr = document.querySelector("[data-fb-prompt]");
    if (pr) {
      const p = promptOf(S, acc, today, F);
      // closed with × for these coffees of this order: stays closed until another order (or coffee) asks
      pr.hidden = !p || load(CLOSED, "") === p.key;
      if (p) { pr.dataset.fbKey = p.key; pr.querySelector("[data-fb-prompt-title]").textContent = p.title; pr.querySelector("[data-fb-prompt-link]").setAttribute("href", `${root()}account/orders/${p.order}/#feedback`); }
    }
  }
  // the map's dots: hovered or focused, the coffee's card stands above its dot; the pointer may move onto the card (it
  // stays) and a click on it opens the coffee. On a touch screen the first tap on a dot shows its card.
  const mapEl = document.querySelector("[data-fb-map]");
  if (mapEl) {
    const box = mapEl.querySelector(".mymap__box");
    let shown = null, shownDot = null, timer = 0;
    const show = (dot) => {
      clearTimeout(timer);
      const tip = box.querySelector(`[data-tip="${dot.dataset.dot}"]`);
      if (shown && shown !== tip) shown.hidden = true;
      shownDot?.classList.remove("is-on");
      if (!tip) return;
      tip.hidden = false; shown = tip; shownDot = dot; dot.classList.add("is-on");
      const b = box.getBoundingClientRect(), d = dot.querySelector(".mymap__pt").getBoundingClientRect();
      const x = d.left + d.width / 2 - b.left, y = d.top - b.top;
      const w = tip.offsetWidth, h = tip.offsetHeight;
      tip.style.left = `${Math.max(0, Math.min(b.width - w, x - w / 2))}px`;
      tip.style.top = `${y - h - 6}px`;   // always above the dot, even past the tile (Tim, 26 Nov)
    };
    const hide = () => { clearTimeout(timer); if (shown) shown.hidden = true; shownDot?.classList.remove("is-on"); shown = shownDot = null; };
    const later = () => { clearTimeout(timer); timer = setTimeout(hide, 180); };
    let touch = false;
    for (const dot of box.querySelectorAll("[data-dot]")) {
      dot.addEventListener("pointerenter", (e) => { touch = e.pointerType === "touch"; if (!touch) show(dot); });
      dot.addEventListener("pointerleave", (e) => { if (e.pointerType !== "touch") later(); });
      dot.addEventListener("focus", () => show(dot));
      dot.addEventListener("blur", later);
      dot.addEventListener("click", (e) => { if (touch && shownDot !== dot) { e.preventDefault(); show(dot); } });
    }
    for (const tip of box.querySelectorAll("[data-tip]")) {
      tip.addEventListener("pointerenter", () => clearTimeout(timer));
      tip.addEventListener("pointerleave", (e) => { if (e.pointerType !== "touch") later(); });
    }
    document.addEventListener("pointerdown", (e) => { if (shown && !e.target.closest?.("[data-dot], [data-tip]")) hide(); });
  }
  function drawMap() {
    const m = document.querySelector("[data-fb-map]");
    if (!m) return;
    const r = S.area, at = (x) => `${(x.u * 110).toFixed(2)},${(x.v * 100).toFixed(2)}`, now = S.trail.at(-1);
    const e = m.querySelector("[data-fb-area]");
    e.setAttribute("cx", (r.u * 110).toFixed(2)); e.setAttribute("cy", (r.v * 100).toFixed(2));
    e.setAttribute("rx", Math.max(3, r.ru * 110).toFixed(2)); e.setAttribute("ry", Math.max(3, r.rv * 100).toFixed(2));
    m.querySelector("[data-fb-trail]").setAttribute("points", S.trail.map(at).join(" "));
    m.querySelector("[data-fb-now]").setAttribute("transform", `translate(${(now.u * 110).toFixed(2)} ${(now.v * 100).toFixed(2)})`);
  }
  function drawNext() {
    const part = document.querySelector("[data-fb-next]");
    if (!part) return;
    part.querySelector("[data-fb-lead]").textContent = S.next.lead;
    const grid = part.querySelector(".next__grid"), items = new Map([...grid.querySelectorAll("[data-fb-item]")].map((el) => [el.dataset.fbItem, el]));
    for (const el of items.values()) el.hidden = true;
    for (const p of S.next.picks) {
      const el = items.get(p.slug);
      if (!el) continue;
      el.querySelector("[data-fb-tag]").textContent = p.label;
      el.querySelector(".card__text").textContent = p.text;
      // the card's link and «в корзину» carry the roast and grind for the visitor's method (or what they asked for)
      const set = setFor(coffee.get(p.slug), S.opts.method, S.need), link = el.querySelector(".card__link");
      link.dataset.href ||= link.getAttribute("href");
      link.setAttribute("href", `${link.dataset.href}?${new URLSearchParams({ roast: set.roast, grind: set.grind })}`);
      for (const i of el.querySelectorAll("[data-set]")) i.value = set[i.dataset.set] || "";
      el.hidden = false;
      grid.append(el);   // the three first, in their order, for the eye and for a screen reader alike
    }
  }
  const draw = () => { compute(); drawForms(); drawRows(); drawMap(); drawNext(); };

  // ── the forms ──
  // «не про вкус» needs no taste taps; «помол» asks how the visitor wants it next time
  const sync = (f) => {
    const issue = f.querySelector('input[name="issue"]:checked');
    for (const i of f.querySelectorAll('.fb__row input[type="radio"]')) i.required = !issue;
    f.querySelector("[data-fb-need]").hidden = issue?.value !== "grind";
    if (issue) f.querySelector(".fb__other").open = true;
  };
  // the form shows what the reply says: the bag's answers, this browser's or the placeholder's
  const fill = (f) => {
    const k = `${f.dataset.order}/${f.dataset.slug}`;
    const t = S.answers.find((x) => !x.issue && `${x.order}/${x.slug}` === k), i = S.answers.find((x) => x.issue && `${x.order}/${x.slug}` === k);
    for (const r of AXES) for (const inp of f.querySelectorAll(`input[name="${r}"]`)) inp.checked = t?.[r] === inp.value;
    for (const inp of f.querySelectorAll('input[name="issue"]')) inp.checked = i?.issue === inp.value;
    for (const inp of f.querySelectorAll('input[name="need"]')) inp.checked = i?.need === inp.value;
    const a = t || i;
    if (a?.method) f.querySelector('select[name="method"]').value = a.method;
    if (a) f.querySelector('input[name="milk"]').checked = !!a.milk;
    sync(f);
  };
  for (const f of document.querySelectorAll("[data-fb-form]")) {
    // a second tap on a chosen option clears it (a taste row, «не про вкус», how you want it): an answer can be withdrawn
    let was = null;
    f.addEventListener("pointerdown", (e) => { const i = e.target.closest("label")?.querySelector('input[type="radio"]'); was = i?.checked ? i : null; });
    f.addEventListener("click", (e) => {
      const i = e.target.closest('input[type="radio"]');
      if (i && i === was) { i.checked = false; was = null; sync(f); }
      if (e.target.closest("[data-fb-edit]")) { f.setAttribute("data-editing", ""); drawForms(); fill(f); focusFrom(f.querySelector("select")); }
    });
    f.addEventListener("change", () => sync(f));
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!f.reportValidity()) return;
      const d = new FormData(f), issue = d.get("issue") || null, at = new Date().toISOString().slice(0, 16);
      const base = { order: f.dataset.order, slug: f.dataset.slug, method: d.get("method") || null, milk: d.get("milk") === "yes" };
      const taste = { ...base, at: at + ":01" };
      for (const k of AXES) if (d.get(k)) taste[k] = d.get(k);
      const hasTaste = !!(taste.bright && taste.body);
      if (!issue && !hasTaste) return;
      // the form is the bag's whole answer now: a kind it leaves empty is cleared
      local = local.filter((x) => !(x.order === base.order && x.slug === base.slug));
      local.push(hasTaste ? taste : { ...base, at, kind: "taste", cleared: true });
      local.push(issue ? { ...base, at, issue, ...(issue === "grind" && d.get("need") ? { need: d.get("need") } : {}) } : { ...base, at, kind: "issue", cleared: true });
      f.removeAttribute("data-editing");
      // a letter's address would reopen the form on every reload
      if (new URLSearchParams(location.search).has("fb")) history.replaceState(history.state, "", location.pathname + location.hash);
      draw(); keep();
      focusFrom(f.querySelector("[data-fb-reply]"));
    });
  }

  // ── a letter's one-tap answer: ?fb=<slug>&bright=less (and the like) taps it in that coffee's form, unless that bag is
  // already answered (then its reply shows; the address's #fb-… brings it into view) ──
  compute();
  const q = new URLSearchParams(location.search), slug = q.get("fb");
  if (slug) {
    const f = document.querySelector(`[data-fb-form][data-slug="${CSS.escape(slug)}"]`);
    if (f && !S.byKey.has(`${f.dataset.order}/${slug}`)) {
      f.setAttribute("data-editing", "");
      for (const k of AXES) { const v = q.get(k); const i = v && f.querySelector(`input[name="${k}"][value="${CSS.escape(v)}"]`); if (i) i.checked = true; }
    }
  }
  draw();
  // a later quiz moves the start: keep the coffee pages' region current
  if (local.length) keep();
}
