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
import { stateOf, replyOf, rowOf, promptOf, purchaseOf, mineOf, formStart } from "./feedbackview.js";
import { setFor, area } from "./feedback.js";
import { loadTaste, loadFeedback, FEEDBACK } from "./tastesaved.js";
import { save } from "./buy.js";
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
  let S;

  const compute = () => { S = stateOf(acc, [...acc.answers, ...local], F, { quiz }); };
  const keep = () => {
    const mine = {};
    for (const slug of new Set(S.answers.map((a) => a.slug))) mine[slug] = mineOf(S.answers, slug, F);
    save(FEEDBACK, { v: 1, at: new Date().toISOString(), answers: local, region: S.st.region, mine });
  };

  // ── drawing ──
  const replyHtml = (r, slug) => {
    const W = F.words;
    const next = r.next ? `<p class="fb__next">${esc(r.next.line)} <a class="link" href="${root()}coffee/${r.next.slug}/">${esc(r.next.name)}</a>. <a class="link" href="${root()}account/#next">${esc(W.allNext)}</a></p>` : "";
    return `<p class="fb__said"><b>${esc(W.youSaid)}</b> «${esc(r.said)}».</p>${r.lines.map((l) => `<p class="fb__line">${esc(l)}</p>`).join("")}${next}
      <p class="fb__actions"><button class="link" type="button" data-fb-edit>${esc(r.issue ? W.editTaste : W.edit)}</button>${r.issue ? "" : `<a class="link" href="${root()}coffee/${slug}/#people">${esc(W.share)}</a>`}</p>`;
  };
  function drawForms() {
    for (const f of document.querySelectorAll("[data-fb-form]")) {
      const a = S.byKey.get(`${f.dataset.order}/${f.dataset.slug}`);
      const ask = f.querySelector("[data-fb-ask]"), rep = f.querySelector("[data-fb-reply]");
      if (a && !f.hasAttribute("data-editing")) {
        const r = replyOf(S, acc, a, F);
        rep.innerHTML = r ? replyHtml(r, f.dataset.slug) : "";
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
      pr.hidden = !p;
      if (p) { pr.querySelector("[data-fb-prompt-text]").textContent = p.text; pr.querySelector("[data-fb-prompt-link]").setAttribute("href", `${root()}account/orders/${p.order}/#feedback`); }
    }
  }
  function drawMap() {
    const m = document.querySelector("[data-fb-map]");
    if (!m) return;
    const r = S.area, at = (x) => `${(x.u * 110).toFixed(2)},${(x.v * 100).toFixed(2)}`, now = S.trail.at(-1);
    const e = m.querySelector("[data-fb-area]");
    e.setAttribute("cx", (r.u * 110).toFixed(2)); e.setAttribute("cy", (r.v * 100).toFixed(2));
    e.setAttribute("rx", Math.max(3, r.ru * 110).toFixed(2)); e.setAttribute("ry", Math.max(3, r.rv * 100).toFixed(2));
    m.querySelector("[data-fb-trail]").setAttribute("points", S.trail.map(at).join(" "));
    const n = m.querySelector("[data-fb-now]"); n.setAttribute("cx", (now.u * 110).toFixed(2)); n.setAttribute("cy", (now.v * 100).toFixed(2));
    m.querySelector("[data-fb-name]").textContent = S.name.text;
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
  for (const f of document.querySelectorAll("[data-fb-form]")) {
    const need = f.querySelector("[data-fb-need]");
    const taste = () => [...f.querySelectorAll('input[name="bright"], input[name="body"]')];
    f.addEventListener("change", (e) => {
      if (e.target.name !== "issue") return;
      // «не про вкус» needs no taste taps; «помол» asks how the visitor wants it next time
      for (const i of taste()) i.required = false;
      need.hidden = e.target.value !== "grind";
    });
    f.addEventListener("click", (e) => {
      if (!e.target.closest("[data-fb-edit]")) return;
      f.setAttribute("data-editing", "");
      drawForms();
      focusFrom(f.querySelector("select, input"));
    });
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!f.reportValidity()) return;
      const d = new FormData(f), issue = d.get("issue") || null;
      const a = { order: f.dataset.order, slug: f.dataset.slug, at: new Date().toISOString().slice(0, 16), method: d.get("method") || null, milk: d.get("milk") === "yes" };
      for (const k of AXES) if (d.get(k)) a[k] = d.get(k);
      if (issue) { a.issue = issue; if (issue === "grind" && d.get("need")) a.need = d.get("need"); }
      if (!issue && !(a.bright && a.body)) return;
      // an issue and a taste answer about the same bag are two answers (the taste one counts, the issue goes to QQ)
      local = local.filter((x) => !(x.order === a.order && x.slug === a.slug && !!x.issue === !!a.issue));
      if (issue && (a.bright || a.body)) {
        const t = { ...a }; delete t.issue; delete t.need; t.at = a.at + ":01";
        local.push({ order: a.order, slug: a.slug, at: a.at, method: a.method, milk: a.milk, issue, ...(a.need ? { need: a.need } : {}) }, t);
      } else local.push(a);
      f.removeAttribute("data-editing");
      draw(); keep();
      const rep = f.querySelector("[data-fb-reply]");
      focusFrom(rep);
    });
  }

  // ── a letter's one-tap answer: ?fb=<slug>&bright=less (and the like) taps it in that coffee's form ──
  const q = new URLSearchParams(location.search), slug = q.get("fb");
  if (slug) {
    const f = document.querySelector(`[data-fb-form][data-slug="${CSS.escape(slug)}"]`);
    if (f) {
      f.setAttribute("data-editing", "");
      for (const k of AXES) { const v = q.get(k); const i = v && f.querySelector(`input[name="${k}"][value="${CSS.escape(v)}"]`); if (i) i.checked = true; }
      requestAnimationFrame(() => f.scrollIntoView({ block: "start" }));
    }
  }
  draw();
}
