// The catalog's way to choose (src/templates/catalog.mjs; docs/choose.md), in the browser over src/data/choose.json
// (embedded in the page as #choose-data) and the arithmetic of scripts/choose.js:
//   sort                            popular (the order of the page), new, soft, bright, expensive, cheap
//   min, max                        the price of 200 g
//   acid, body, odd                 the «Вкус» switches: "low" (мягче, легче, классичнее), "" (все), "high"
//   taste                           any of the ticked taste groups
//   method                          «Приготовление»: a coffee QQ roasts for it matches; its card then puts the method's
//                                   roast and grind into the bag and opens its page on them (?roast=…&grind=…)
//   country, process, type, line    any of the ticked values (none ticked: any)
//   chip                            the checkboxes under the row: each ticked one must hold
// A choice shows its matches, then «Похожие» (the nearest that miss as little as possible); the rest are not shown.
// With no match: «Точно таких нет», then «Похожие». Every option shows how many it would find with the rest of the
// choice. The choice is kept in the address (?method=moka&chip=milk): every change is a step of the browser's history,
// so a choice can be shared and Back undoes it.
import { riseGrid } from "./slider.js";
import { rank, nearOf, roastMiss } from "./choose.js";
import { focusFrom } from "./focus.js";

const ROAST = { Эспрессо: "под эспрессо", Фильтр: "под фильтр" };
const GRIND = { "В зернах": "в зёрнах", Эспрессо: "помол для эспрессо", Фильтр: "помол для фильтра", Турка: "помол для турки" };
const MULTI = ["taste", "country", "process", "type", "line", "chip"];

export function initFilters() {
  const form = document.querySelector("[data-filters]"), grid = document.querySelector("[data-grid]");
  const D = JSON.parse(document.getElementById("choose-data").textContent);
  const cards = [...grid.querySelectorAll("[data-card]")];
  const heads = Object.fromEntries([...grid.querySelectorAll("[data-head]")].map((h) => [h.dataset.head, h]));
  const soon = document.querySelector("[data-soon]"), soonWhat = document.querySelector("[data-soon-what]");
  const reset = form.querySelector("[data-reset]"), status = form.querySelector("[data-status]");
  const SOON = { kaskara: "появится каскара", dripy: "появятся дрипы", sety: "появятся сеты", merch: "появится мерч" };
  const AXES = D.axes.map((a) => a.id);
  const DEFAULT = { sort: "popular", method: "", ...Object.fromEntries(AXES.map((k) => [k, ""])) };

  // each coffee: its data, its card, its price, the address of its page
  const coffees = cards.map((el) => {
    const c = D.coffees.find((x) => x.slug === el.dataset.slug);
    const link = el.querySelector(".card__link");
    return { ...c, el, price: Number(el.dataset.price), created: el.dataset.created, href: link.getAttribute("href"), link, tag: el.querySelector("[data-tag]"),
      set: Object.fromEntries([...el.querySelectorAll("[data-set]")].map((i) => [i.dataset.set, i])) };
  });
  const order = new Map(coffees.map((c, i) => [c, i]));
  const dist = (a, b) => D.dist[a.i][b.i];

  // ── the form ↔ the state ↔ the address ──
  const state = () => {
    const f = new FormData(form);
    const s = { sort: f.get("sort") || "popular", method: f.get("method") || "",
      min: f.get("min") ? Number(f.get("min")) : null, max: f.get("max") ? Number(f.get("max")) : null };
    for (const k of AXES) s[k] = f.get(k) || "";
    for (const k of MULTI) s[k] = f.getAll(k);
    return s;
  };
  const read = () => {
    const q = new URLSearchParams(location.search);
    for (const el of form.elements) {
      if (!el.name) continue;
      if (el.type === "checkbox") el.checked = q.getAll(el.name).includes(el.value);
      else if (el.type === "radio") el.checked = (q.get(el.name) ?? DEFAULT[el.name] ?? "") === el.value;
      else if (el.type !== "submit" && el.type !== "reset") el.value = q.get(el.name) || "";
    }
  };
  // the form's own parameters are written anew; the address's others (?qqbox, ?qqgl …) stay as they were
  const own = new Set([...form.elements].map((el) => el.name).filter(Boolean));
  const write = (push) => {
    const q = new URLSearchParams(location.search);
    for (const k of own) q.delete(k);
    for (const [k, v] of new FormData(form)) if (v !== "" && DEFAULT[k] !== v) q.append(k, v);
    const s = q.toString(), url = location.pathname + (s ? "?" + s : "") + location.hash;
    if (url !== location.pathname + location.search + location.hash) history[push ? "pushState" : "replaceState"](null, "", url);
  };

  // ── the conditions of a state (the shape scripts/choose.js ranks; `miss` is required by rank, not shown) ──
  const none = () => "";
  const conditions = (s) => {
    const k = [];
    if (s.method) { const m = s.method; k.push({ id: "method", method: true, test: (c) => c.methods[m].ok, miss: roastMiss }); }
    for (const a of D.axes) if (s[a.id]) {
      const side = a[s[a.id] === "low" ? "low" : "high"], as = { ru: side.ru, when: side.when };
      k.push({ id: a.id, test: (c) => c.axes[a.id] === s[a.id], miss: none, near: (c) => nearOf(c, as) });
    }
    if (s.taste.length) k.push({ id: "taste", test: (c) => s.taste.some((t) => c.tastes.includes(t)), miss: none });
    for (const id of s.chip) {
      const ch = D.chips.find((x) => x.id === id);
      if (ch) k.push({ id: "chip-" + id, test: (c) => c.chips.includes(id), miss: none, near: (c) => nearOf(c, ch) });
    }
    for (const key of ["type", "line"]) if (s[key].length) k.push({ id: key, test: (c) => s[key].includes(c[key]), miss: none });
    if (s.country.length) k.push({ id: "country", test: (c) => s.country.some((x) => c.countries.includes(x)), miss: none });
    if (s.process.length) k.push({ id: "process", test: (c) => s.process.some((x) => c.processes.includes(x)), miss: none });
    if (s.min != null || s.max != null) {
      const lo = s.min ?? 0, hi = s.max ?? Infinity;
      k.push({ id: "price", test: (c) => c.price >= lo && c.price <= hi, miss: none, near: (c) => (c.price < lo ? lo - c.price : c.price - hi) / 100 });
    }
    return k;
  };
  const exactCount = (s) => { const k = conditions(s); return coffees.filter((c) => !c.out && k.every((x) => x.test(c))).length; };

  const SORT = {
    popular: (a, b) => order.get(a) - order.get(b),
    new: (a, b) => b.created.localeCompare(a.created) || order.get(a) - order.get(b),
    soft: (a, b) => a.coded.acidity - b.coded.acidity || b.coded.density - a.coded.density || order.get(a) - order.get(b),
    bright: (a, b) => b.coded.acidity - a.coded.acidity || a.coded.density - b.coded.density || order.get(a) - order.get(b),
    expensive: (a, b) => b.price - a.price || order.get(a) - order.get(b),
    cheap: (a, b) => a.price - b.price || order.get(a) - order.get(b)
  };

  // ── draw a state ──
  function apply(push) {
    const s = state(), K = conditions(s), sorted = [...coffees].sort(SORT[s.sort] || SORT.popular);
    const R = rank(sorted, K, { dist });
    const any = K.length > 0, m = s.method && D.methods.find((x) => x.id === s.method);
    const near = R.near.map((x) => x.c);
    // the matches, then «Похожие»; with no choice, every coffee (the sold-out ones last)
    const shown = any ? [...R.exact, ...near] : [...R.exact, ...R.rest];
    const seq = any ? [heads.exact, ...R.exact, heads.near, ...near] : shown;
    for (const x of seq) grid.append(x.el || x);
    for (const c of coffees) {
      if (shown.includes(c)) { c.el.removeAttribute("data-out"); continue; }
      grid.append(c.el); c.el.setAttribute("data-out", "");
    }
    heads.exact.hidden = !any || !R.empty; heads.exact.textContent = "Точно таких нет";
    heads.near.hidden = !any || !near.length;
    // sizes: the first cards take half a row in the page's own order and look, the rest a third; any choice, all thirds
    let big = !any && s.sort === "popular" ? 4 : 0;
    for (const c of shown) {
      c.el.classList.toggle("card--half", big > 0); c.el.classList.toggle("card--third", big <= 0); big--;
      // the roast and grind the method sets, in a line over a match's text; «Похожие» carry no line
      const fit = m && c.methods[m.id], set = !!(fit && fit.ok && R.exact.includes(c));
      const line = set ? `${fit.omni ? "Омни-обжарка" : `Обжарка ${ROAST[fit.roast]}`} · ${GRIND[fit.grind]}` : "";
      c.tag.textContent = line; c.tag.hidden = !line;
      const fits = !!(fit && fit.ok);
      c.set.roast.value = fits ? fit.roast : ""; c.set.grind.value = fits ? fit.grind : "";
      c.link.setAttribute("href", fits ? `${c.href}?${new URLSearchParams({ roast: fit.roast, grind: fit.grind })}` : c.href);
    }
    // how many each option would find, with the rest of the choice as it is (a ticked option of several counts alone
    // in its cell: «Кения 2», whatever else of the cell is ticked; a checkbox under the row counts with the others)
    const countOf = (name, value) => {
      if (name === "chip") return exactCount({ ...s, chip: [...new Set([...s.chip, value])] });
      if (name === "method" || AXES.includes(name)) return exactCount({ ...s, [name]: value });
      return exactCount({ ...s, [name]: [value] });
    };
    for (const i of form.querySelectorAll("input[name]")) {
      const label = i.closest("label"), nEl = label?.querySelector("[data-n]");
      if (!nEl) continue;
      const v = countOf(i.name, i.value);
      nEl.textContent = v; label.toggleAttribute("data-none", v === 0);
    }
    // what each cell says when closed: the choice, or everything
    for (const d of form.querySelectorAll("[data-filter]")) {
      const v = d.querySelector("[data-filter-value]"), f = d.dataset.filter;
      const picked = [...d.querySelectorAll("input:checked")].filter((i) => i.value).map((i) => i.closest("label").querySelector("span").textContent);
      const nums = [...d.querySelectorAll('input[type="number"]')].map((i) => i.value);
      let text = v.dataset.all, on = false;
      if (f === "price") { if (nums[0] || nums[1]) { text = `${nums[0] || "…"} — ${nums[1] || "…"}`; on = true; } }
      else if (f === "sort") { text = picked[0] || text; on = s.sort !== "popular"; }
      else if (f === "method") { text = picked[0] || text; on = !!s.method; }
      else if (picked.length) { text = picked.map((t, j) => (j ? t.toLowerCase() : t[0].toUpperCase() + t.slice(1))).join(", "); on = true; }
      v.textContent = text; d.toggleAttribute("data-active", on);
    }
    reset.hidden = !any && s.sort === "popular";
    // a screen reader hears what a change found (only a visitor's change: not on load, not on Back)
    if (push === true) status.textContent = !any ? `Все ${R.exact.length} кофе` : R.empty ? `Точно таких нет. Похожих: ${near.length}` : `Подходят ${R.exact.length}${near.length ? `, похожих ${near.length}` : ""}`;
    write(push === true);
    dispatchEvent(new Event("qq:layout"));
  }

  // ── the tabs: «Все» and «Кофе» show the coffee; the others are not in the shop yet ──
  const tab = () => {
    const id = location.hash.slice(1) || "all";
    const what = SOON[id];
    for (const t of document.querySelectorAll(".tab")) t.toggleAttribute("aria-current", false);
    document.querySelector(`.tab[data-tab="${what || id === "kofe" ? id : "all"}"]`)?.setAttribute("aria-current", "page");
    grid.hidden = !!what; form.hidden = !!what; soon.hidden = !what;
    if (what) soonWhat.textContent = what;
    dispatchEvent(new Event("qq:layout"));
  };

  // the cards rise into place one after another, and again when a change of the choice deals them anew
  const rise = riseGrid(grid);
  const changed = (push) => { apply(push); rise.deal(); };
  form.addEventListener("change", (e) => { if (e.target.type !== "number") changed(true); });
  let typing = 0;   // typing a price is one step of history, not one per digit
  form.addEventListener("input", (e) => { if (e.target.type === "number") { apply(!typing); clearTimeout(typing); typing = setTimeout(() => (typing = 0), 800); } });
  form.addEventListener("submit", (e) => e.preventDefault());
  // «Сбросить всё»: the form's own reset restores the defaults; the keyboard goes to the first cell
  form.addEventListener("reset", () => setTimeout(() => { changed(true); focusFrom(form.querySelector(".filter summary")); }));
  addEventListener("hashchange", tab);
  addEventListener("popstate", () => { read(); apply(); });
  read();
  apply(); tab();
}
