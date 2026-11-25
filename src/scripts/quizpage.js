// The quiz «Выбрать кофе за минуту» in the browser (src/templates/start.mjs; docs/quiz.md). One question at a time,
// the answers in the address (?method=espresso&milk=yes&now=shop&taste=choc; ?q=2 is the question shown), so Back
// goes to the previous question, a result can be shared and «Изменить» opens one question and comes back. A tap on an
// option answers and moves on; the arrow keys only choose (a keyboard moves on with Enter or «Дальше»).
// The result is src/scripts/quiz.js's: the coffees (the page holds every card, hidden; three are shown, in order, each
// with its move and its reasons), the visitor's region on the taste map (scripts/tastemap.js area), the part of the
// catalogue that fits, and it is saved in this browser for the profile, the catalogue and the coffee pages
// (scripts/tastesaved.js, localStorage "qq-taste").
import { result, answered } from "./quiz.js";
import { initTasteMap } from "./tastemap.js";
import { focusFrom } from "./focus.js";
import { saveTaste } from "./tastesaved.js";
import { KEY, load, save, badge, toast, rub } from "./buy.js";

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const cap = (s) => s && s[0].toUpperCase() + s.slice(1);

export function initQuiz() {
  const root = document.querySelector("[data-quiz]");
  const D = JSON.parse(document.getElementById("quiz-data").textContent);
  const form = root.querySelector("[data-quiz-form]"), res = root.querySelector("[data-quiz-result]");
  const steps = [...form.querySelectorAll("[data-step]")], bars = [...form.querySelectorAll("[data-bar]")];
  const back = form.querySelector("[data-quiz-back]"), next = form.querySelector("[data-quiz-submit]");
  const IDS = D.steps.map((s) => s.id);
  const grid = res.querySelector("[data-quiz-picks]");
  const cards = new Map([...grid.querySelectorAll("[data-card]")].map((el) => [el.dataset.slug, {
    el, link: el.querySelector(".card__link"), href: el.querySelector(".card__link").getAttribute("href"), tag: el.querySelector("[data-tag]"),
    text: el.querySelector(".card__text"), set: Object.fromEntries([...el.querySelectorAll("[data-set]")].map((i) => [i.dataset.set, i]))
  }]));
  const coffee = new Map(D.coffees.map((c) => [c.slug, c]));
  const setBtn = res.querySelector("[data-quiz-set]"), cat = res.querySelector("[data-quiz-catalogue]"), catHref = cat.getAttribute("href");
  let map = null, picks = [];
  root.setAttribute("data-js", "");
  next.textContent = "Дальше";

  // ── the address ↔ the answers ──
  const parse = () => {
    const q = new URLSearchParams(location.search), a = {};
    for (const s of D.steps) { const v = q.get(s.id); if (v && s.options.some((o) => o.id === v)) a[s.id] = v; }
    const at = q.has("q") ? Math.max(0, Math.min(IDS.length - 1, Number(q.get("q")) || 0)) : null;
    return { a, at, ret: q.get("r") === "1" };
  };
  const go = (a, at, { push = true, ret = false } = {}) => {
    const q = new URLSearchParams(location.search);
    for (const k of [...IDS, "q", "r"]) q.delete(k);
    for (const id of IDS) if (a[id]) q.set(id, a[id]);
    if (at != null) q.set("q", at);
    if (ret) q.set("r", "1");
    const s = q.toString();
    history[push ? "pushState" : "replaceState"]({ quiz: true }, "", location.pathname + (s ? "?" + s : "") + location.hash);
    draw(true);
  };

  // ── draw what the address says: a question, or the result ──
  function draw(moved) {
    const { a, at } = parse();
    const done = answered(a, D);
    const i = at ?? (done >= IDS.length ? null : done);
    for (const s of steps) for (const r of s.querySelectorAll("input")) r.checked = a[s.dataset.step] === r.value;
    if (i == null || i > done) { if (done >= IDS.length) return showResult(a, moved); }
    const cur = i ?? done;
    form.hidden = false; res.hidden = true;
    steps.forEach((s, k) => { s.hidden = k !== cur; });
    bars.forEach((b, k) => b.toggleAttribute("data-on", k <= cur));
    back.hidden = cur === 0 && !parse().ret;
    next.hidden = !a[IDS[cur]];
    if (moved) focusFrom(steps[cur].querySelector("legend"));
  }

  // ── answering ──
  let arrow = false;
  form.addEventListener("keydown", (e) => { arrow = /^Arrow/.test(e.key); });
  form.addEventListener("change", (e) => {
    const s = e.target.closest("[data-step]");
    if (!s) return;
    const { a, ret } = parse(), i = Number(s.dataset.i);
    a[s.dataset.step] = e.target.value;
    if (arrow) { arrow = false; go(a, i, { push: false, ret }); return; }   // the arrow keys choose; Enter moves on
    advance(a, i, ret);
  });
  // a tap on the option already chosen moves on too (no change event for it)
  form.addEventListener("click", (e) => {
    const input = e.target.closest(".qopt__input");
    if (!input || e.detail === 0) return;
    const { a, ret } = parse(), s = input.closest("[data-step]");
    if (a[s.dataset.step] === input.value) advance(a, Number(s.dataset.i), ret);
  });
  const advance = (a, i, ret) => {
    if (ret || answered(a, D) >= IDS.length && i === IDS.length - 1) return go(a, null);
    go(a, i + 1 < IDS.length ? i + 1 : null, { ret });
  };
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const { a, at, ret } = parse(), i = at ?? answered(a, D);
    if (a[IDS[i]]) advance(a, i, ret);
  });
  back.addEventListener("click", () => {
    const { a, at, ret } = parse(), i = at ?? answered(a, D);
    if (ret) return go(a, null);
    if (history.state?.quiz) history.back(); else go(a, Math.max(0, i - 1), { push: false });
  });
  res.querySelector("[data-quiz-again]").addEventListener("click", () => go({}, 0));
  addEventListener("popstate", () => draw(true));

  // ── the result ──
  function showResult(a, moved) {
    const r = result(a, D);
    form.hidden = true; res.hidden = false;
    res.querySelector("[data-quiz-summary]").textContent = r.summary[0];
    res.querySelector("[data-quiz-start]").textContent = r.summary[1];
    // the answers, each a way back to its question (and then straight back here)
    res.querySelector("[data-quiz-answers]").innerHTML = D.steps.map((s, k) => {
      const o = s.options.find((x) => x.id === a[s.id]);
      return `<li><button class="qres__answer" type="button" data-edit="${k}" aria-label="${esc(s.ask)} ${esc(o.ru)}. Изменить">${esc(o.ru)}</button></li>`;
    }).join("") + `<li class="qres__edit">${D.steps.length > 1 ? "Нажмите на ответ, чтобы изменить" : ""}</li>`;
    // the three coffees, in order; the others stay hidden
    picks = r.picks;
    for (const [, c] of cards) c.el.setAttribute("data-out", "");
    for (const p of r.picks) {
      const c = cards.get(p.slug);
      c.el.removeAttribute("data-out"); grid.append(c.el);
      c.tag.hidden = false; c.tag.textContent = p.label;
      const why = p.why.length ? `${cap(p.why.join("; "))}. ` : "";
      c.text.innerHTML = `${esc(why)}${esc(p.taste)}${p.but ? ` <span class="card__but">${esc(p.but)}</span>` : ""}${p.set ? ` <span class="card__set">${esc(p.set.text)}.</span>` : ""}`;
      c.set.roast.value = p.set ? p.set.roast : ""; c.set.grind.value = p.set ? p.set.grind : "";
      c.link.setAttribute("href", p.set ? `${c.href}?${new URLSearchParams({ roast: p.set.roast, grind: p.set.grind })}` : c.href);
    }
    // three different coffees: all three in small packs, when QQ sells each in 50 g
    const small = r.mode === "spread" && r.picks.every((p) => coffee.get(p.slug).small);
    setBtn.hidden = !small;
    if (small) setBtn.textContent = `Взять все три по 50 г — ${rub(r.picks.reduce((s, p) => s + coffee.get(p.slug).small.price, 0))}`;
    // the part of the catalogue that fits
    const q = new URLSearchParams(r.catalogue.params);
    cat.setAttribute("href", catHref + (q.toString() ? "?" + q : ""));
    cat.querySelector(".btn-arrow__label").textContent = `Все подходящие в каталоге: ${r.catalogue.n}`;
    // the map: the region, the three lit and named
    if (!map) map = initTasteMap(res.querySelector("[data-tmap]"), { info: (slug) => mapInfo(slug) });
    map.light(r.picks.map((p) => p.slug)); map.area(r.area);
    saveTaste({ answers: a, region: r.region, mode: r.mode, picks: r.picks.map((p) => ({ slug: p.slug, label: p.label, name: coffee.get(p.slug).name })) });
    res.querySelector("[data-quiz-saved]").hidden = false;
    dispatchEvent(new Event("qq:layout"));
    if (moved) focusFrom(res.querySelector("#quiz-summary"));
  }
  const mapInfo = (slug) => {
    const c = coffee.get(slug), p = picks.find((x) => x.slug === slug);
    const link = cards.has(slug) && !cards.get(slug).el.hasAttribute("data-out") ? cards.get(slug).link.getAttribute("href") : `${document.documentElement.dataset.root || ""}coffee/${slug}/`;
    return `<b>${esc(c.name)}</b>${p ? `<span class="tmap__miss">${esc(p.label)}</span>` : ""}<span>${esc(c.short || "")}</span><a class="link" href="${esc(link)}">К кофе →</a>`;
  };
  res.addEventListener("click", (e) => {
    const ed = e.target.closest("[data-edit]");
    if (ed) go(parse().a, Number(ed.dataset.edit), { ret: true });
  });
  setBtn.addEventListener("click", () => {
    const { a } = parse(), bag = load(KEY, []);
    for (const p of picks) {
      const c = coffee.get(p.slug), f = a.method && a.method !== "none" ? c.methods[a.method] : null;
      bag.push({ slug: p.slug, weight: c.small.label, grind: f ? f.grind : "В зернах", roast: f ? f.roast : null, qty: 1, price: c.small.price });
    }
    save(KEY, bag); badge(); toast("Три кофе по 50 г — в корзине");
  });

  draw(false);
}
