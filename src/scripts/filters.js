// The catalog's way to choose (src/templates/catalog.mjs; docs/choose.md), in the browser over src/data/choose.json
// (embedded in the page as #choose-data) and the arithmetic of scripts/choose.js:
//   method                          «Чем варите»: a coffee QQ roasts for it matches; its card then puts the method's
//                                   roast and grind into the bag and opens its page on them (?roast=…&grind=…)
//   chip                            a scenario (one at a time): «Под молоко», «Без яркой кислотности»…
//   acid, taste, type, line, country, process, region   any of the ticked values (none ticked: any)
//   min, max                        the price of 200 g
//   sort                            popular (the order of the page), new, soft, bright, expensive, cheap
// Nothing is hidden: the matches come first («Подходят N»), then «Почти» (the nearest in taste, each saying what it
// misses), then «Остальные». With no match the nearest lead («Точно таких нет — ближе всего»). Every option shows how
// many it would find with the rest of the choice. The choice is kept in the address (?method=moka&chip=soft): every
// change is a step of the browser's history, so a choice can be shared and Back undoes it.
import { riseGrid } from "./slider.js";
import { rank, missOf, nearOf, roastMiss } from "./choose.js";
import { initTasteMap } from "./tastemap.js";
import { by } from "./scroller.js";
import { focusFrom } from "./focus.js";

const ROAST = { Эспрессо: "под эспрессо", Фильтр: "под фильтр" };
const GRIND = { "В зернах": "в зёрнах", Эспрессо: "помол для эспрессо", Фильтр: "помол для фильтра", Турка: "помол для турки" };
const num = (x) => String(x).replace(".", ",");
const lower = (s) => s.charAt(0).toLowerCase() + s.slice(1), upper = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export function initFilters() {
  const form = document.querySelector("[data-filters]"), grid = document.querySelector("[data-grid]");
  const D = JSON.parse(document.getElementById("choose-data").textContent);
  const cards = [...grid.querySelectorAll("[data-card]")];
  const heads = Object.fromEntries([...grid.querySelectorAll("[data-head]")].map((h) => [h.dataset.head, h]));
  const soon = document.querySelector("[data-soon]"), soonWhat = document.querySelector("[data-soon-what]");
  const active = form.querySelector("[data-active]"), pills = form.querySelector("[data-pills]");
  const why = form.querySelector("[data-why]"), status = form.querySelector("[data-status]");
  // where the keyboard goes when what it was on disappears (the last pill, «Сбросить всё»): the method's cell
  const home = () => focusFrom(form.querySelector('[data-filter="method"] summary'));
  const SOON = { kaskara: "появится каскара", dripy: "появятся дрипы", sety: "появятся сеты", merch: "появится мерч" };
  const DEFAULT = { sort: "popular", method: "" };

  // each coffee: its data, its card, its price, the address of its page
  const card = new Map(cards.map((c) => [c.dataset.slug, c]));
  const coffees = cards.map((el) => {
    const c = D.coffees.find((x) => x.slug === el.dataset.slug);
    const link = el.querySelector(".card__link");
    return { ...c, el, price: Number(el.dataset.price), created: el.dataset.created, href: link.getAttribute("href"), link, tag: el.querySelector("[data-tag]"),
      set: Object.fromEntries([...el.querySelectorAll("[data-set]")].map((i) => [i.dataset.set, i])) };
  });
  const order = new Map(coffees.map((c, i) => [c, i]));
  const dist = (a, b) => D.dist[a.i][b.i];
  const method = (id) => D.methods.find((m) => m.id === id), chip = (id) => D.chips.find((k) => k.id === id);
  const regionRu = (id) => D.regions.find((r) => r.id === id)?.ru;

  // ── the form ↔ the state ↔ the address ──
  const state = () => {
    const f = new FormData(form), all = (k) => f.getAll(k);
    return { method: f.get("method") || "", chip: f.get("chip") || "", acid: all("acid"), taste: all("taste"), type: all("type"), line: all("line"), caffeine: all("caffeine"),
      country: all("country"), process: all("process"), region: all("region"),
      min: f.get("min") ? Number(f.get("min")) : null, max: f.get("max") ? Number(f.get("max")) : null, sort: f.get("sort") || "popular" };
  };
  const read = () => {
    const q = new URLSearchParams(location.search);
    for (const el of form.elements) {
      if (!el.name) continue;
      // a chip is one at a time: of several in a shared address, the first
      if (el.type === "checkbox") el.checked = el.name === "chip" ? q.get("chip") === el.value : q.getAll(el.name).includes(el.value);
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

  // ── the conditions of a state (the same shape scripts/choose.js ranks) ──
  const conditions = (s, skip = null) => {
    const k = [];
    if (s.method && skip !== "method") { const m = s.method; k.push({ id: "method", method: true, test: (c) => c.methods[m].ok, miss: roastMiss }); }
    if (s.chip && skip !== "chip") { const ch = chip(s.chip); k.push({ id: "chip", test: (c) => c.chips.includes(ch.id), miss: (c) => missOf(c, ch), near: (c) => nearOf(c, ch) }); }
    const ACID = D.acidity.map((a) => a.id);
    if (s.acid.length && skip !== "acid") k.push({ id: "acid", test: (c) => s.acid.includes(c.acid), miss: (c) => `кислотность ${num(c.coded.acidity)}`,
      near: (c) => Math.min(...s.acid.map((a) => Math.abs(ACID.indexOf(a) - ACID.indexOf(c.acid)))) });
    if (s.taste.length && skip !== "taste") k.push({ id: "taste", test: (c) => s.taste.some((t) => c.tastes.includes(t)),
      miss: (c) => c.tastes.length ? `во вкусе ${c.tastes.map((t) => lower(D.tastes.find((x) => x.id === t).ru)).join(", ")}` : "другой вкус" });
    if (s.region.length && skip !== "region") {
      const at = (id) => { const [a, b] = id.split("-"); return [ACID.indexOf(a), ["dense", "mid", "light"].indexOf(b)]; };
      k.push({ id: "region", test: (c) => s.region.includes(c.region), miss: (c) => `на карте: ${lower(regionRu(c.region))}`,
        near: (c) => Math.min(...s.region.map((r) => { const [x, y] = at(r), [u, v] = at(c.region); return Math.abs(x - u) + Math.abs(y - v); })) });
    }
    for (const [key, field] of [["type", "type"], ["line", "line"]]) if (s[key].length && skip !== key) k.push({ id: key, test: (c) => s[key].includes(c[field]), miss: (c) => c[field] });
    if (s.caffeine.length && skip !== "caffeine") k.push({ id: "caffeine", test: (c) => s.caffeine.includes(c.decaf ? "decaf" : "caf"), miss: (c) => c.decaf ? "без кофеина" : "с кофеином" });
    if (s.country.length && skip !== "country") k.push({ id: "country", test: (c) => s.country.some((x) => c.countries.includes(x)), miss: (c) => c.countries.join(", ") });
    if (s.process.length && skip !== "process") k.push({ id: "process", test: (c) => s.process.some((x) => c.processes.includes(x)), miss: (c) => c.processes.length ? lower(c.processes.join(", ")) : "смесь" });
    if ((s.min != null || s.max != null) && skip !== "price") {
      const lo = s.min ?? 0, hi = s.max ?? Infinity;
      k.push({ id: "price", test: (c) => c.price >= lo && c.price <= hi, miss: (c) => `${c.price} ₽`, near: (c) => (c.price < lo ? lo - c.price : c.price - hi) / 100 });
    }
    return k;
  };
  const SORT = {
    popular: (a, b) => order.get(a) - order.get(b),
    new: (a, b) => b.created.localeCompare(a.created) || order.get(a) - order.get(b),
    soft: (a, b) => a.coded.acidity - b.coded.acidity || b.coded.density - a.coded.density || order.get(a) - order.get(b),
    bright: (a, b) => b.coded.acidity - a.coded.acidity || a.coded.density - b.coded.density || order.get(a) - order.get(b),
    expensive: (a, b) => b.price - a.price || order.get(a) - order.get(b),
    cheap: (a, b) => a.price - b.price || order.get(a) - order.get(b)
  };
  const exactCount = (s) => { const k = conditions(s); return coffees.filter((c) => !c.out && k.every((x) => x.test(c))).length; };

  // ── the map ──
  const mapEl = form.querySelector("[data-tmap]");
  let R = null;
  const tmap = mapEl && initTasteMap(mapEl, {
    onRegion(id, on) { const i = form.querySelector(`input[name="region"][value="${id}"]`); i.checked = on; changed(true); },
    info(slug) {
      const c = coffees.find((x) => x.slug === slug), near = R?.near.find((x) => x.c === c);
      const miss = R && !R.exact.includes(c) && conditions(state()).filter((k) => !k.test(c)).map((k) => k.miss(c));
      return `<b>${esc(c.name)}</b><span>${esc(c.short)}</span>${miss && miss.length ? `<span class="tmap__miss">${near ? "Почти" : "Не подходит"}: ${esc(miss.join(", "))}</span>` : ""}<button type="button" class="link" data-to="${slug}">К карточке ↓</button>`;
    }
  });
  mapEl?.addEventListener("click", (e) => {
    const b = e.target.closest("[data-to]");
    if (!b) return;
    const el = card.get(b.dataset.to);
    by(el.getBoundingClientRect().top - (parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")) || 48) - 16);
    focusFrom(el.querySelector(".card__link"));
  });

  // ── draw a state ──
  function apply(push) {
    const s = state(), K = conditions(s), sorted = [...coffees].sort(SORT[s.sort] || SORT.popular);
    R = rank(sorted, K, { dist });
    const any = K.length > 0, m = s.method && method(s.method);
    const near = new Map(R.near.map((x) => [x.c, x.missing]));
    const seq = any ? [heads.exact, ...R.exact, ...(R.empty ? [] : [heads.near]), ...R.near.map((x) => x.c), heads.rest, ...R.rest] : [...R.exact, ...R.rest];
    for (const x of seq) grid.append(x.el || x);
    for (const h of Object.values(heads)) if (!seq.includes(h)) grid.append(h);
    heads.exact.hidden = !any; heads.near.hidden = !any || R.empty || !R.near.length; heads.rest.hidden = !any || !R.rest.length;
    heads.exact.textContent = !R.empty ? `Подходят ${R.exact.length}` : R.near.length ? "Точно таких нет — ближе всего" : "Точно таких нет";
    heads.rest.textContent = `Остальные ${R.rest.length}`;
    // sizes: the first cards take half a row in the page's own order and look, the rest a third; any choice, all thirds
    let big = !any && s.sort === "popular" ? 4 : 0;
    const n = R.exact.length;
    while (big && big <= n && (n - big) % 3) big += 2;
    if (big > n) big = 0;
    for (const c of [...R.exact, ...R.near.map((x) => x.c), ...R.rest]) {
      c.el.classList.toggle("card--half", big > 0); c.el.classList.toggle("card--third", big <= 0); big--;
      // the line above the text: the roast and grind the method sets for a match, what a near miss misses
      const fit = m && c.methods[m.id];
      const line = near.has(c) ? upper(near.get(c).join(", ")) : fit && fit.ok && R.exact.includes(c) ? `${fit.omni ? "Омни-обжарка" : `Обжарка ${ROAST[fit.roast]}`} · ${GRIND[fit.grind]}` : "";
      c.tag.textContent = line; c.tag.hidden = !line;
      // the method's roast and grind into the bag and into the link to the page
      const set = fit && fit.ok;
      c.set.roast.value = set ? fit.roast : ""; c.set.grind.value = set ? fit.grind : "";
      c.link.setAttribute("href", set ? `${c.href}?${new URLSearchParams({ roast: fit.roast, grind: fit.grind })}` : c.href);
    }
    // how many each option would find, with the rest of the choice as it is
    // (a ticked option of several counts alone in its cell: «Кения 2», whatever else of the cell is ticked)
    const countOf = (name, value) => exactCount({ ...s, [name]: name === "method" || name === "chip" ? value : [value] });
    for (const i of form.querySelectorAll("input[name]")) {
      const nEl = i.parentElement.querySelector("[data-n]");
      if (!nEl || !["method", "chip", "acid", "taste", "type", "caffeine", "line", "country", "process"].includes(i.name)) continue;
      const v = countOf(i.name, i.value);
      nEl.textContent = v; i.parentElement.toggleAttribute("data-none", v === 0);
    }
    // what each cell says when closed: the choice, or everything
    for (const d of form.querySelectorAll("[data-filter]")) {
      const v = d.querySelector("[data-filter-value]");
      const picked = [...d.querySelectorAll("input:checked")].map((i) => i.nextElementSibling.textContent).filter(Boolean);
      const nums = [...d.querySelectorAll('input[type="number"]')].map((i) => i.value);
      let text = v.dataset.all, on = false;
      if (d.dataset.filter === "price" && (nums[0] || nums[1])) { text = `${nums[0] || "…"} — ${nums[1] || "…"}`; on = true; }
      else if (d.dataset.filter === "sort" || d.dataset.filter === "method") { text = picked[0] || text; on = d.dataset.filter === "method" ? !!s.method : s.sort !== "popular"; }
      else if (picked.length) { text = picked.join(", "); on = true; }
      v.textContent = text; d.toggleAttribute("data-active", on);
    }
    const inMore = ["acid", "taste", "type", "caffeine", "line", "country", "process"].reduce((a, k) => a + s[k].length, 0) + (s.min != null || s.max != null ? 1 : 0) + (s.sort !== "popular" ? 1 : 0);
    const moreBtn = form.querySelector('[data-open="more"]');
    moreBtn.toggleAttribute("data-active", inMore > 0);
    form.querySelector("[data-more-value]").textContent = inMore ? `Выбрано: ${inMore}` : "8 фильтров";
    const mapBtn = form.querySelector('[data-open="map"]');
    mapBtn.toggleAttribute("data-active", s.region.length > 0);
    mapBtn.querySelector(".filter__value").textContent = s.region.length ? s.region.map(regionRu).join(", ") : `${coffees.filter((c) => !c.out).length} кофе`;
    // the chosen method: what it sets, in a line under the cells
    why.hidden = !m; why.textContent = m ? m.why : "";
    // the chosen, each with its ×
    const chosen = [];
    if (m) chosen.push(["method", "", m.short]);
    if (s.chip) chosen.push(["chip", s.chip, chip(s.chip).ru]);
    for (const a of s.acid) chosen.push(["acid", a, `Кислотность: ${lower(D.acidity.find((x) => x.id === a).ru)}`]);
    for (const t of s.taste) chosen.push(["taste", t, D.tastes.find((x) => x.id === t).ru]);
    for (const r of s.region) chosen.push(["region", r, `На карте: ${lower(regionRu(r))}`]);
    for (const k of ["type", "line", "country", "process"]) for (const v of s[k]) chosen.push([k, v, v]);
    for (const v of s.caffeine) chosen.push(["caffeine", v, v === "decaf" ? "Без кофеина" : "С кофеином"]);
    if (s.min != null || s.max != null) chosen.push(["price", "", `${s.min ?? "…"} — ${s.max ?? "…"} ₽`]);
    pills.innerHTML = chosen.map(([k, v, t]) => `<li><button type="button" class="filters__pill" data-k="${k}" data-v="${esc(v)}" aria-label="Убрать: ${esc(t)}">${esc(t)}<span aria-hidden="true">×</span></button></li>`).join("");
    active.hidden = !chosen.length && s.sort === "popular";
    // the map lights what the list leads with
    if (tmap) { tmap.light(any ? (R.empty ? R.near : R.exact).map((x) => (x.c || x).slug) : null); tmap.regions(s.region); }
    // a screen reader hears what a change found (only a visitor's change: not on load, not on Back)
    if (push === true) status.textContent = !any ? `Все ${R.exact.length} кофе` : R.empty ? `Точно таких нет. Ближе всего: ${R.near.length}` : `Подходят ${R.exact.length}${R.near.length ? `, почти ${R.near.length}` : ""}`;
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

  // ── the panels: «Ещё фильтры» and «Карта вкуса» open in place ──
  const open = (btn, on) => {
    btn.setAttribute("aria-expanded", String(on));
    document.getElementById(btn.getAttribute("aria-controls")).hidden = !on;
    dispatchEvent(new Event("qq:layout"));
  };
  for (const b of form.querySelectorAll("[data-open]")) b.addEventListener("click", () => open(b, b.getAttribute("aria-expanded") !== "true"));

  // a chip is one at a time: ticking one unticks the others
  form.addEventListener("change", (e) => {
    if (e.target.name === "chip" && e.target.checked) for (const i of form.querySelectorAll('input[name="chip"]')) if (i !== e.target) i.checked = false;
  }, true);
  // a pill's × takes its choice away
  pills.addEventListener("click", (e) => {
    const b = e.target.closest("[data-k]");
    if (!b) return;
    const { k, v } = b.dataset;
    if (k === "method") form.querySelector('input[name="method"][value=""]').checked = true;
    else if (k === "price") for (const i of form.querySelectorAll('input[type="number"]')) i.value = "";
    else { const i = [...form.querySelectorAll(`input[name="${k}"]`)].find((x) => x.value === v); if (i) i.checked = false; }
    const next = b.closest("li").nextElementSibling?.querySelector("button") || b.closest("li").previousElementSibling?.querySelector("button");
    changed(true);
    const to = next && pills.querySelector(`[data-k="${next.dataset.k}"][data-v="${next.dataset.v}"]`);
    if (to) focusFrom(to); else home();
  });

  // the cards rise into place one after another, and again when a change of the choice deals them anew
  const rise = riseGrid(grid);
  const changed = (push) => { apply(push); rise.deal(); };
  form.addEventListener("change", (e) => { if (e.target.type !== "number") changed(true); });
  let typing = 0;   // typing a price is one step of history, not one per digit
  form.addEventListener("input", (e) => { if (e.target.type === "number") { apply(!typing); clearTimeout(typing); typing = setTimeout(() => (typing = 0), 800); } });
  form.addEventListener("submit", (e) => e.preventDefault());
  form.addEventListener("reset", () => setTimeout(() => { form.querySelector('input[name="method"][value=""]').checked = true; changed(true); home(); }));
  addEventListener("hashchange", tab);
  addEventListener("popstate", () => { read(); apply(); });
  read();
  // a shared address with a choice in a panel opens that panel
  const s0 = state();
  if (s0.region.length) open(form.querySelector('[data-open="map"]'), true);
  if (["acid", "taste", "type", "caffeine", "line", "country", "process"].some((k) => s0[k].length) || s0.min != null || s0.max != null || s0.sort !== "popular") open(form.querySelector('[data-open="more"]'), true);
  apply(); tab();
}

const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]);
