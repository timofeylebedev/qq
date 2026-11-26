// The catalog: the roast and shipping line, the category tabs, the way to choose, the grid of every coffee.
// Choosing (session 3 of choosing coffee; docs/choose.md): one row of menu cells (Сортировка, Цена, Вкус — three
// switches «мягче / все / ярче»… of equal cells, no counts, and the taste groups —, Приготовление — a brewing method
// sets the roast and grind QQ sells for it; each on one line —, Страна, Обработка, Особенности — моносорт, смесь,
// Classic, Special) and under it a row of checkboxes without counts (Для вас — only with a saved quiz —, Под молоко, На
// каждый день, Необычные, Без кофеина). A choice shows only its matches; with none, «Точно таких нет» over the nearest
// (scripts/filters.js, over src/data/choose.json through src/scripts/choose.js). At the left of the row, apart from the
// cells, «Подобрать кофе» opens the quiz in a dialog (quiz.mjs, scripts/quizpage.js).
import { page } from "./layout.mjs";
import { card } from "./components.mjs";
import { esc, icon, read } from "./util.mjs";
import { menu } from "./blocks.mjs";
import { quizDialog } from "./quiz.mjs";

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

  const cnt = (fn) => String(n(fn));
  // Вкус: three switches (a radio each: the low side, all, the high side) and the taste groups (checkboxes)
  const axes = C.axes.map((a) => `<fieldset class="switch"><legend class="switch__name">${esc(a.ru)}</legend><div class="seg">${[["low", a.low.ru], ["", "все"], ["high", a.high.ru]].map(([v, t]) =>
    `<label class="switch__opt"><input type="radio" name="${a.id}" value="${v}"${v ? "" : " checked"}><span>${esc(t)}</span></label>`).join("")}</div></fieldset>`).join("");
  const tastes = C.tastes.map((t) => `<label class="option"><input class="box" type="checkbox" name="taste" value="${t.id}"><span>${esc(t.ru)}</span><span class="option__n" data-n>${cnt((c) => c.tastes.includes(t.id))}</span></label>`).join("");
  const taste = `<details class="filter filter--taste" data-filter="taste">
        <summary class="filter__summary"><span class="filter__caption">Вкус</span><span class="filter__value" data-filter-value data-all="Любой">Любой</span></summary>
        <div class="filter__options filter__options--taste">${axes}<fieldset class="filter__group"><legend class="sr">Во вкусе</legend>${tastes}</fieldset></div>
      </details>`;
  // Особенности: моносорт or смесь, and the line (Classic, Special): two conditions in one cell (inside each, any of
  // the ticked; between them, both)
  const feat = [["type", "Моносорт", "Моносорт"], ["type", "Смесь", "Смесь"], ["line", "Classic", "Classic"], ["line", "Special", "Special"]]
    .map(([k, v, t]) => `<label class="option"><input class="box" type="checkbox" name="${k}" value="${v}"><span>${esc(t)}</span><span class="option__n" data-n>${cnt((c) => c[k] === v)}</span></label>`).join("\n          ");
  const features = `<details class="filter" data-filter="features">
        <summary class="filter__summary"><span class="filter__caption">Особенности</span><span class="filter__value" data-filter-value data-all="Любые">Любые</span></summary>
        <fieldset class="filter__options"><legend class="sr">Особенности</legend>
          ${feat}
        </fieldset>
      </details>`;
  const cells = [
    choice("sort", "Сортировка", "radio", [["popular", "Популярные"], ["new", "Новинки"], ["soft", "Мягче"], ["bright", "Ярче"], ["expensive", "Дороже"], ["cheap", "Дешевле"]], "popular"),
    range(Math.min(...prices), Math.max(...prices)),
    taste,
    choice("method", "Приготовление", "radio", [["", "Любое", "", String(live.length)], ...C.methods.map((m) => [m.id, m.ru, "", cnt((c) => c.methods[m.id].ok)])], "", "Любое"),
    choice("country", "Страна", "checkbox", countries.map((x) => [x, x, "", String(products.filter((p) => p.countries.includes(x) && !of(p).out).length)]), null, plural(countries.length, "страна", "страны", "стран")),
    choice("process", "Обработка", "checkbox", processes.map((x) => [x, x, "", String(products.filter((p) => p.processes.includes(x) && !of(p).out).length)]), null, plural(processes.length, "тип", "типа", "типов")),
    features
  ].join("\n        ");
  // under the row: the scenarios, as checkboxes without counts (any number; each is a condition). «Для вас» first: the
  // coffees for the visitor's saved taste (choose.js forYou); filters.js removes it when this browser keeps no quiz
  const checks = `<label class="check" data-you hidden><input class="box" type="checkbox" name="chip" value="you"><span>Для вас</span></label>`
    + C.chips.map((k) => `<label class="check"><input class="box" type="checkbox" name="chip" value="${k.id}"><span>${esc(k.ru)}</span></label>`).join("");
  // what the script reads: each coffee's choices, the methods, the chips' rules and words, the taste distances
  const json = JSON.stringify({
    methods: C.methods, chips: read("data/choose.json").chips.map(({ id, ru, when, miss, why }) => ({ id, ru, when, miss, why })), axes: C.axes,
    tastes: C.tastes,
    coffees: C.coffees.map(({ slug, name, i, out, decaf, omni, line, type, countries, processes, roasts, grind, use, coded, position, methods, chips, axes, tastes }) => ({ slug, name, i, out, decaf, omni, line, type, countries, processes, roasts, grind, use, coded, position, methods, chips, axes, tastes, ...pick(products.find((p) => p.slug === slug)) })),
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
      <div class="filters__bar">
        <button class="btn filters__quiz" type="button" data-dialog="quiz">Подобрать кофе</button>
        <div class="filters__row">
        ${cells}
        </div>
      </div>
      <fieldset class="filters__checks"><legend class="sr">Что хочется</legend>${checks}<button class="filters__reset" type="reset" data-reset hidden>Сбросить всё</button></fieldset>
      <p class="sr" role="status" data-status></p>
      <button class="sr" type="submit" tabindex="-1">Показать</button>
    </form>
    <script type="application/json" id="choose-data">${json}</script>
    ${quizDialog(ctx)}
    <div class="grid grid--catalog" data-grid data-rise>
      <h2 class="grid__head" data-head="exact" hidden>Точно таких нет</h2>
      ${list.map((p, i) => card(ctx, p, { size: i < site.catalog.featuredCount ? "half" : "third", heading: 2, wait: true, choose: true })).join("\n      ")}
      <h2 class="grid__head" data-head="near" hidden>Похожие</h2>
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

const pick = (p) => ({ short: p.short });

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
