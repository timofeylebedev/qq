// The quiz «Подобрать кофе» in its dialog on the catalogue (src/templates/quiz.mjs; docs/quiz.md). One question at a
// time; ← and → at the top go back and on (→ only once the question is answered; Enter does the same). A tap on an
// option answers and moves on; the arrow keys only choose. The answers live in the dialog (no address of their own):
// opened again, it shows the result kept in this browser, if any.
// The result is src/scripts/quiz.js's: the coffees (the dialog holds every card, hidden; three are shown, in order,
// each with its move and its reasons), the visitor's region on the taste map (scripts/tastemap.js area); it is saved in
// this browser (scripts/tastesaved.js, localStorage "qq-taste") and the catalogue learns of it (event "qq:taste"):
// «Для вас» appears under the filters, and «Показать в каталоге» ticks it (with the visitor's method) and closes.
// catalog/?quiz opens the dialog on load (the footer, the profile).
import { result, answered } from "./quiz.js";
import { initTasteMap } from "./tastemap.js";
import { focusFrom } from "./focus.js";
import { saveTaste, loadTaste } from "./tastesaved.js";
import { KEY, load, save, badge, toast, rub } from "./buy.js";

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const cap = (s) => s && s[0].toUpperCase() + s.slice(1);

export function initQuiz() {
  const root = document.querySelector("[data-quiz]");
  const dialog = root.closest("dialog");
  const D = JSON.parse(document.getElementById("quiz-data").textContent);
  const form = root.querySelector("[data-quiz-form]"), res = root.querySelector("[data-quiz-result]");
  const steps = [...form.querySelectorAll("[data-step]")], bars = [...form.querySelectorAll("[data-bar]")];
  const back = form.querySelector("[data-quiz-back]"), next = form.querySelector("[data-quiz-next]");
  const IDS = D.steps.map((s) => s.id);
  const grid = res.querySelector("[data-quiz-picks]");
  const cards = new Map([...grid.querySelectorAll("[data-card]")].map((el) => [el.dataset.slug, {
    el, link: el.querySelector(".card__link"), href: el.querySelector(".card__link").getAttribute("href"), tag: el.querySelector("[data-tag]"),
    text: el.querySelector(".card__text"), set: Object.fromEntries([...el.querySelectorAll("[data-set]")].map((i) => [i.dataset.set, i]))
  }]));
  const coffee = new Map(D.coffees.map((c) => [c.slug, c]));
  const setBtn = res.querySelector("[data-quiz-set]");
  let map = null, picks = [];
  root.setAttribute("data-js", "");

  // ── where the dialog is: the answers, the question shown (null: the result), and whether a question was opened from
  //    the result (then answering it goes straight back there) ──
  const saved = loadTaste();
  const S = { a: saved ? { ...saved.answers } : {}, at: saved && answered(saved.answers, D) >= IDS.length ? null : 0, ret: false };
  const go = (at, { ret = false, moved = true } = {}) => { S.at = at; S.ret = ret; draw(moved); };
  const scrollTop = () => { dialog.scrollTop = 0; };

  function draw(moved) {
    const done = answered(S.a, D);
    if (S.at == null && done < IDS.length) S.at = done;
    for (const s of steps) for (const r of s.querySelectorAll("input")) r.checked = S.a[s.dataset.step] === r.value;
    if (S.at == null) return showResult(moved);
    // never past the first unanswered question
    const cur = Math.min(S.at, done);
    S.at = cur;
    form.hidden = false; res.hidden = true;
    steps.forEach((s, k) => { s.hidden = k !== cur; });
    bars.forEach((b, k) => b.toggleAttribute("data-on", k <= cur));
    back.disabled = cur === 0;
    next.disabled = !S.a[IDS[cur]];
    changedAt = performance.now();
    if (moved) { focusFrom(steps[cur].querySelector("legend")); scrollTop(); }
  }

  // ── answering and moving ──
  // a double tap must not answer the next question too: answers within 350 ms of a step change are ignored
  let changedAt = 0, arrow = false, mine = false;
  const tooSoon = () => performance.now() - changedAt < 350;
  const advance = () => {
    mine = true;
    const i = S.at;
    if (S.ret || i === IDS.length - 1) return go(answered(S.a, D) >= IDS.length ? null : answered(S.a, D));
    go(i + 1);
  };
  form.addEventListener("keydown", (e) => { arrow = /^Arrow/.test(e.key) && e.target.matches(".qopt__input"); });
  form.addEventListener("pointerdown", () => { arrow = false; });
  form.addEventListener("change", (e) => {
    const s = e.target.closest("[data-step]");
    if (!s) return;
    if (tooSoon() && !arrow) { draw(false); return; }
    S.a[s.dataset.step] = e.target.value;
    // the arrow keys only choose (the focus stays on the option); Enter or → moves on
    if (arrow) { arrow = false; mine = true; next.disabled = false; return; }
    advance();
  });
  // a tap on the option already chosen moves on too (no change event for it)
  form.addEventListener("click", (e) => {
    const input = e.target.closest(".qopt__input");
    if (!input || e.detail === 0 || tooSoon()) return;
    const s = input.closest("[data-step]");
    if (S.a[s.dataset.step] === input.value && Number(s.dataset.i) === S.at) advance();
  });
  form.addEventListener("submit", (e) => { e.preventDefault(); if (S.a[IDS[S.at]]) advance(); });
  back.addEventListener("click", () => { if (S.at > 0) go(S.at - 1); });
  res.querySelector("[data-quiz-again]").addEventListener("click", () => { S.a = {}; go(0); });
  res.addEventListener("click", (e) => {
    const ed = e.target.closest("[data-edit]");
    if (ed) go(Number(ed.dataset.edit), { ret: true });
  });

  // ── the result ──
  let last = null;
  function showResult(moved) {
    const a = S.a, r = result(a, D);
    form.hidden = true; res.hidden = false;
    res.querySelector("[data-quiz-summary]").textContent = r.summary[0];
    // the answers, each a way back to its question (and then straight back here)
    res.querySelector("[data-quiz-answers]").innerHTML = D.steps.map((s, k) => {
      const o = s.options.find((x) => x.id === a[s.id]);
      return `<li><button class="qres__answer" type="button" data-edit="${k}" aria-label="${esc(s.ask)} ${esc(o.ru)}. Изменить">${esc(o.ru)}</button></li>`;
    }).join("");
    // the three coffees, in order; the others stay hidden
    picks = r.picks;
    for (const [, c] of cards) c.el.setAttribute("data-out", "");
    for (const p of r.picks) {
      const c = cards.get(p.slug);
      c.el.removeAttribute("data-out"); grid.append(c.el);
      c.tag.hidden = false; c.tag.textContent = p.label;
      const why = p.why.length ? `${cap(p.why.join("; "))}. ` : "";
      c.text.innerHTML = `${esc(why)}${esc(p.taste)}${p.but ? ` <span class="card__but">${esc(p.but)}</span>` : ""}${p.set ? ` <span class="card__set">${esc(p.set.text)}.</span>` : ""}`;
      c.set.roast.value = p.set?.roast || ""; c.set.grind.value = p.set?.grind || "";
      const params = p.set ? Object.entries({ roast: p.set.roast, grind: p.set.grind }).filter(([, v]) => v) : [];
      c.link.setAttribute("href", params.length ? `${c.href}?${new URLSearchParams(params)}` : c.href);
    }
    // three different coffees: all three in small packs, when QQ sells each in 50 g
    const small = r.mode === "spread" && r.picks.every((p) => coffee.get(p.slug).small);
    setBtn.hidden = !small; setBtn.disabled = false;
    if (small) setBtn.textContent = `Взять все три по 50 г — ${rub(r.picks.reduce((s, p) => s + coffee.get(p.slug).small.price, 0))}`;
    // the map: the region, the three lit and named
    if (!map) map = initTasteMap(res.querySelector("[data-tmap]"), { info: (slug) => mapInfo(slug) });
    map.light(r.picks.map((p) => p.slug)); map.area(r.area);
    // kept in this browser when answered here (a result opened from what was kept is already there); the catalogue's
    // «Для вас» follows it
    last = { answers: { ...a }, region: r.region, mode: r.mode, picks: r.picks.map((p) => ({ slug: p.slug, label: p.label, name: coffee.get(p.slug).name })) };
    if (mine) { saveTaste(last); mine = false; }
    dispatchEvent(new CustomEvent("qq:taste", { detail: { taste: last } }));
    dispatchEvent(new Event("qq:layout"));
    if (moved) { focusFrom(res.querySelector("#quiz-summary")); scrollTop(); }
  }
  const mapInfo = (slug) => {
    const c = coffee.get(slug), p = picks.find((x) => x.slug === slug);
    const link = cards.has(slug) && !cards.get(slug).el.hasAttribute("data-out") ? cards.get(slug).link.getAttribute("href") : `${document.documentElement.dataset.root || ""}coffee/${slug}/`;
    return `<b>${esc(c.name)}</b>${p ? `<span class="tmap__miss">${esc(p.label)}</span>` : ""}<span>${esc(c.short || "")}</span><a class="link" href="${esc(link)}">К кофе →</a>`;
  };
  // «Показать в каталоге»: «Для вас» ticked under the filters (scripts/filters.js), the dialog closed
  res.querySelector("[data-quiz-show]").addEventListener("click", () => {
    dispatchEvent(new CustomEvent("qq:taste", { detail: { taste: last, show: true } }));
    dialog.querySelector("[data-dialog-close]").click();
  });
  setBtn.addEventListener("click", () => {
    const a = S.a, bag = load(KEY, []);
    for (const p of picks) {
      const c = coffee.get(p.slug), f = a.method && a.method !== "none" ? c.methods[a.method] : null;
      const set = p.set || {};
      bag.push({ slug: p.slug, weight: c.small.label, grind: f ? f.grind : set.grind || "В зернах", roast: f ? f.roast : set.roast || null, qty: 1, price: c.small.price });
    }
    save(KEY, bag); badge(); toast("Три кофе по 50 г — в корзине");
    setBtn.disabled = true; setBtn.textContent = "Уже в корзине";
  });

  // the dialog opens on the question or the result it was left on; catalog/?quiz opens it on load
  new MutationObserver(() => { if (dialog.open) draw(true); }).observe(dialog, { attributes: true, attributeFilter: ["open"] });
  draw(false);
  const q = new URLSearchParams(location.search);
  if (q.has("quiz")) {
    q.delete("quiz");
    const s = q.toString();
    history.replaceState(history.state, "", location.pathname + (s ? "?" + s : "") + location.hash);
    dialog.showModal();
  }
}
