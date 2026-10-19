// The catalog: the roast and shipping line, the category tabs, the filters, the grid of every coffee.
// Filtering and sorting happen in the browser (scripts/filters.js) over the data-* of the cards.
import { page } from "./layout.mjs";
import { card } from "./components.mjs";
import { esc, icon } from "./util.mjs";

// the default order «Популярные»: no sales data yet, so tagged coffees first, then Special, then the newest
// (design/decisions.json, "catalog-order")
const popular = (a, b) => (b.tags.length - a.tags.length) || ((b.line === "Special") - (a.line === "Special")) || String(b.created).localeCompare(String(a.created));

export function render(ctx) {
  const { site, products } = ctx;
  const list = [...products].sort(popular);
  const count = (fn) => [...new Set(products.flatMap(fn))];
  const countries = count((p) => p.countries).sort((a, b) => a.localeCompare(b, "ru"));
  const processes = count((p) => p.processes);
  const prices = products.flatMap((p) => p.weights.filter((w) => w.grams === 200).map((w) => w.price)).filter((x) => x != null);
  const data = esc(JSON.stringify({ days: site.roast.days, hour: site.roast.hour, tz: site.roast.timezoneOffset }));

  const tabs = site.catalog.tabs.map(([t, id], i) => `<li><a class="tab" href="#${id}" data-tab="${id}"${i === 0 ? ' aria-current="page"' : ""}>${esc(t)}</a></li>`).join("");

  const filters = [
    choice("sort", "Сортировка", "radio", [["popular", "Популярные"], ["new", "Новинки"], ["expensive", "Дороже"], ["cheap", "Дешевле"]], "popular"),
    range(Math.min(...prices), Math.max(...prices)),
    choice("type", "Тип", "checkbox", [["Моносорт", "Моносорт"], ["Смесь", "Смесь"]]),
    choice("line", "Линейка", "checkbox", [["Classic", "Classic"], ["Special", "Special"]]),
    choice("country", "Страна", "checkbox", countries.map((c) => [c, c]), null, plural(countries.length, "страна", "страны", "стран")),
    choice("process", "Обработка", "checkbox", processes.map((c) => [c, c]), null, plural(processes.length, "тип", "типа", "типов")),
    choice("prep", "Приготовление", "checkbox", [["espresso", "Эспрессо"], ["filter", "Фильтр"], ["milk", "С молоком"], ["turka", "Турка"]], null, "4 способа")
  ].join("\n      ");

  const body = `<section class="section section--first catalog" aria-labelledby="catalog-title">
  <div class="col">
    <h1 class="sr" id="catalog-title">${esc(site.catalog.title)}</h1>
    <ul class="catalog__info" data-roast="${data}">
      <li>${icon("roast")}<span data-roast-hours>До ближайшей обжарки — скоро</span></li>
      <li>${icon("truck")}<span data-ship-date>Передадим в доставку в день обжарки</span></li>
    </ul>
    <nav class="tabs" aria-label="Категории"><ul>${tabs}</ul></nav>
    <form class="filters" data-filters aria-label="Фильтры">
      ${filters}
      <p class="filters__result" aria-live="polite"><span data-found>${list.length}</span> кофе<button class="filters__reset" type="reset" hidden data-reset>Сбросить</button><button class="sr" type="submit">Показать</button></p>
    </form>
    <div class="grid grid--catalog" data-grid>
      ${list.map((p, i) => card(ctx, p, { size: i < site.catalog.featuredCount ? "half" : "third", heading: 2 })).join("\n      ")}
    </div>
    <p class="catalog__empty" data-empty hidden>Ничего не нашлось. <button type="button" class="link" data-reset>Сбросить фильтры</button></p>
    <p class="catalog__soon" data-soon hidden>Скоро здесь появятся <span data-soon-what></span>. А пока — <a class="link" href="#all" data-tab="all">весь кофе</a>.</p>
  </div>
</section>`;
  return page(ctx, {
    title: "Каталог — QQ Coffee",
    description: "Весь кофе QQ: моносорта и смеси, Classic и Special, под эспрессо и фильтр.",
    main: "catalog-page", body
  });
}

function plural(n, one, few, many) {
  const m10 = n % 10, m100 = n % 100;
  return `${n} ${m10 === 1 && m100 !== 11 ? one : m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20) ? few : many}`;
}

// A filter cell: a caption above, the current choice below; opens a list of options (a <details> that works without
// scripts; scripts/filters.js closes the others and writes the choice into the summary).
function choice(name, caption, type, options, checked = null, summary = null) {
  const sum = summary || options.map(([, t]) => t).join(", ");
  return `<details class="filter" data-filter="${name}">
        <summary class="filter__summary"><span class="filter__caption">${esc(caption)}</span><span class="filter__value" data-filter-value data-all="${esc(sum)}">${esc(checked ? options.find(([v]) => v === checked)[1] : sum)}</span></summary>
        <fieldset class="filter__options"><legend class="sr">${esc(caption)}</legend>
          ${options.map(([v, t]) => `<label class="option"><input type="${type}" name="${name}" value="${esc(v)}"${v === checked ? " checked" : ""}><span>${esc(t)}</span></label>`).join("\n          ")}
        </fieldset>
      </details>`;
}
function range(min, max) {
  return `<details class="filter" data-filter="price">
        <summary class="filter__summary"><span class="filter__caption">Цена за 200 г</span><span class="filter__value" data-filter-value data-all="${min} — ${max}">${min} — ${max}</span></summary>
        <fieldset class="filter__options filter__options--range"><legend class="sr">Цена за 200 г, ₽</legend>
          <label class="option option--field"><span>от</span><input type="number" name="min" inputmode="numeric" min="${min}" max="${max}" step="10" placeholder="${min}"></label>
          <label class="option option--field"><span>до</span><input type="number" name="max" inputmode="numeric" min="${min}" max="${max}" step="10" placeholder="${max}"></label>
        </fieldset>
      </details>`;
}
