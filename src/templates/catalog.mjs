// The catalog: the roast and shipping line, the category tabs, the way to choose, the grid of every coffee.
// Choosing (session 3 of choosing coffee; docs/choose.md): «Чем варите» (a brewing method sets the roast and grind QQ
// sells for it), the scenario chips, «Карта вкуса» (the taste map: a region is a choice, a choice lights its coffees)
// and «Ещё фильтры» (acidity, taste, type, line, country, processing, price, sort). Nothing is ever hidden: the
// matches come first, then «Почти» (the nearest, each saying what it misses), then the rest (scripts/filters.js, over
// src/data/choose.json through src/scripts/choose.js).
import { page } from "./layout.mjs";
import { card } from "./components.mjs";
import { esc, icon, read } from "./util.mjs";
import { menu } from "./blocks.mjs";
import { tasteMap } from "./map.mjs";

const choice = (name, caption, type, options, checked = null, summary = null) => menu(name, caption, type, options, { checked, summary });

// the default order «Популярные»: no sales data yet, so tagged coffees first, then Special, then the newest
// (design/decisions.json, "catalog-order")
const popular = (a, b) => (b.tags.length - a.tags.length) || ((b.line === "Special") - (a.line === "Special")) || String(b.created).localeCompare(String(a.created));

export function render(ctx) {
  const { site, products } = ctx;
  const C = read("src/data/choose.json");
  const list = [...products].sort(popular);
  const live = C.coffees.filter((c) => !c.out);
  const n = (fn) => live.filter(fn).length;
  const count = (fn) => [...new Set(products.flatMap(fn))];
  const countries = count((p) => p.countries).sort((a, b) => a.localeCompare(b, "ru"));
  const processes = count((p) => p.processes).sort((a, b) => a.localeCompare(b, "ru"));
  const prices = products.flatMap((p) => p.weights.filter((w) => w.grams === 200).map((w) => w.price)).filter((x) => x != null);
  const data = esc(JSON.stringify({ days: site.roast.days, hour: site.roast.hour, tz: site.roast.timezoneOffset }));
  const tabs = site.catalog.tabs.map(([t, id], i) => `<li><a class="tab" href="#${id}" data-tab="${id}"${i === 0 ? ' aria-current="page"' : ""}>${esc(t)}</a></li>`).join("");
  const by = new Map(C.coffees.map((c) => [c.slug, c]));
  const of = (p) => by.get(p.slug);

  // the first level: how you brew (a menu: eight plain names, each with how many it fits), what you want (chips)
  const method = choice("method", "Чем варите", "radio", [["", "Любым способом", "", String(live.length)], ...C.methods.map((m) => [m.id, m.ru, "", String(n((c) => c.methods[m.id].ok))])], "", "Любым способом");
  const chips = C.chips.map((k) => `<label class="chip"><input type="checkbox" name="chip" value="${k.id}"><span>${esc(k.ru)}</span><span class="chip__n" data-n>${n((c) => c.chips.includes(k.id))}</span></label>`).join("");
  // one tap away: the rest (multi-choice within a cell, each option with its count)
  const more = [
    choice("sort", "Сортировка", "radio", [["popular", "Популярные"], ["new", "Новинки"], ["soft", "Мягче"], ["bright", "Ярче"], ["expensive", "Дороже"], ["cheap", "Дешевле"]], "popular"),
    choice("acid", "Кислотность", "checkbox", C.acidity.map((a) => [a.id, `${a.ru} · ${a.hint}`, "", String(n((c) => c.acid === a.id))]), null, "Любая"),
    choice("taste", "Вкус", "checkbox", C.tastes.map((t) => [t.id, t.ru, "", String(n((c) => c.tastes.includes(t.id)))]), null, "Любой"),
    choice("type", "Тип", "checkbox", [["Моносорт", "Моносорт"], ["Смесь", "Смесь"]].map(([v, t]) => [v, t, "", String(n((c) => c.type === v))]), null, "Моносорт, смесь"),
    choice("line", "Линейка", "checkbox", [["Classic", "Classic"], ["Special", "Special"]].map(([v, t]) => [v, t, "", String(n((c) => c.line === v))]), null, "Classic, Special"),
    choice("country", "Страна", "checkbox", countries.map((x) => [x, x, "", String(products.filter((p) => p.countries.includes(x) && !of(p).out).length)]), null, plural(countries.length, "страна", "страны", "стран")),
    choice("process", "Обработка", "checkbox", processes.map((x) => [x, x, "", String(products.filter((p) => p.processes.includes(x) && !of(p).out).length)]), null, plural(processes.length, "тип", "типа", "типов")),
    range(Math.min(...prices), Math.max(...prices))
  ].join("\n        ");
  const regions = C.map.regions.map((r) => `<input type="checkbox" name="region" value="${r.id}" hidden>`).join("");
  // what the script reads: each coffee's choices, the methods, the chips' rules and words, the taste distances
  const json = JSON.stringify({
    methods: C.methods, chips: read("data/choose.json").chips.map(({ id, ru, when, miss, why }) => ({ id, ru, when, miss, why })),
    acidity: C.acidity, tastes: C.tastes, regions: C.map.regions,
    coffees: C.coffees.map(({ slug, name, i, out, decaf, line, type, roasts, grind, use, coded, position, methods, chips, acid, tastes, region }) => ({ slug, name, i, out, decaf, line, type, roasts, grind, use, coded, position, methods, chips, acid, tastes, region, ...pick(products.find((p) => p.slug === slug)) })),
    dist: C.dist
  }).replace(/</g, "\\u003c");

  const body = `<section class="section section--first catalog" data-ground="paper" aria-labelledby="catalog-title">
  <div class="col">
    <h1 class="sr" id="catalog-title">${esc(site.catalog.title)}</h1>
    <ul class="catalog__info" data-roast="${data}">
      <li>${icon("roast")}<span data-roast-hours>До обжарки — скоро</span></li>
      <li>${icon("truck")}<span data-ship-date>Передадим в доставку на следующий рабочий день после обжарки</span></li>
    </ul>
    <nav class="tabs" aria-label="Категории"><ul>${tabs}</ul></nav>
    <form class="filters" data-filters aria-label="Выбор кофе">
      <div class="filters__row">
        ${method}
        <button class="filters__open" type="button" aria-expanded="false" aria-controls="catalog-map" data-open="map"><span class="filter__caption">Карта вкуса</span><span class="filter__value">${C.coffees.length} кофе</span></button>
        <button class="filters__open" type="button" aria-expanded="false" aria-controls="catalog-more" data-open="more"><span class="filter__caption">Ещё фильтры</span><span class="filter__value" data-more-value>8 фильтров</span></button>
      </div>
      <fieldset class="chips"><legend class="sr">Что хочется</legend>${chips}</fieldset>
      <div class="filters__more" id="catalog-more" hidden>
        ${more}
      </div>
      <div class="filters__map" id="catalog-map" hidden>
        ${tasteMap(ctx, { id: "catalog-tmap", label: "Карта вкуса" })}${regions}
        <p class="filters__how">Нажмите на точку, чтобы увидеть кофе, или на область, чтобы выбрать её. Выбор выше подсвечивает свои кофе на карте.</p>
      </div>
      <div class="filters__active" data-active hidden><ul class="filters__pills" data-pills></ul><button class="filters__reset" type="reset" data-reset>Сбросить всё</button></div>
      <button class="sr" type="submit" tabindex="-1">Показать</button>
    </form>
    <script type="application/json" id="choose-data">${json}</script>
    <div class="grid grid--catalog" data-grid data-rise>
      <h2 class="grid__head" data-head="exact" hidden></h2>
      ${list.map((p, i) => card(ctx, p, { size: i < site.catalog.featuredCount ? "half" : "third", heading: 2, wait: true, choose: true })).join("\n      ")}
      <h2 class="grid__head" data-head="near" hidden>Почти</h2>
      <h2 class="grid__head" data-head="rest" hidden></h2>
    </div>
    <p class="catalog__soon" data-soon hidden>Скоро здесь <span data-soon-what></span>. А пока — <a class="link" href="#all" data-tab="all">весь кофе</a>.</p>
  </div>
</section>`;
  return page(ctx, {
    title: "Каталог — QQ Coffee",
    description: "Весь кофе QQ: моносорта и смеси, Classic и Special, для кофемашины, гейзера, турки, воронки и френч-пресса.",
    main: "catalog-page", body
  });
}

const pick = (p) => ({ short: p.short, countries: p.countries, processes: p.processes });

function plural(n, one, few, many) {
  const m10 = n % 10, m100 = n % 100;
  return `${n} ${m10 === 1 && m100 !== 11 ? one : m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20) ? few : many}`;
}

function range(min, max) {
  return `<details class="filter" data-filter="price">
        <summary class="filter__summary"><span class="filter__caption">Цена</span><span class="filter__value" data-filter-value data-all="${min} — ${max}">${min} — ${max}</span></summary>
        <fieldset class="filter__options filter__options--range"><legend class="sr">Цена за 200 г, ₽</legend>
          <label class="option option--field"><span>от</span><input type="number" name="min" inputmode="numeric" min="${min}" max="${max}" step="10" placeholder="${min}"></label>
          <label class="option option--field"><span>до</span><input type="number" name="max" inputmode="numeric" min="${min}" max="${max}" step="10" placeholder="${max}"></label>
        </fieldset>
      </details>`;
}
