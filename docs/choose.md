# Choosing among QQ's coffees: how it works

Session 3 of choosing coffee (24 Nov 2026): the catalogue. The quiz (session 4) reuses the same two parts: the mapping
from a brewing method to what QQ sells, and the taste map. Research: `docs/choose-research.md`. Every result, listed:
`docs/choose-output.md` (generated). Checks: `docs/choose-check/`. Decision: `catalog-choose` (design/decisions.json).

## The catalogue now (Tim, 26 Nov)

Tim reshaped the first build (24 Nov, described below) into the catalogue's original row of cells:
- **The row:** Сортировка · Цена · **Вкус** · **Приготовление** · Страна · Обработка · Моносорт / смесь · Линейка (two a
  row below M, four from M, eight from L). «Вкус» holds three switches and the seven taste groups; «Приготовление» is
  the eight methods (below), each setting the roast and grind.
- **The switches** (`axes` in data/choose.json; «все» is no condition, the middle of an axis is on neither side):
  Кислотность мягче (acidity ≤ 2, 5) / ярче (≥ 3.5, 7); Плотность легче (density ≤ 2, 6) / плотнее (≥ 4, 7); Характер
  классичнее (the model's unusual < 0.3, 17) / необычнее (≥ 1, 7).
- **The checkboxes under the row** (`chips`; any number, each a condition): Под молоко 10, На каждый день 13,
  Необычные 5 (unusual ≥ 2), Без кофеина 1. «Мягкая кислотность» left: it is the «мягче» switch.
- **The result:** the matches, then «Похожие» (`rank()`'s near misses, without the words of what they miss), and
  nothing else; with no match, «Точно таких нет» over «Похожие». A match still carries the method's roast and grind in
  lavender. Below M the «Вкус» menu opens across the whole row of cells (it is wider than one cell).
- **Not on the catalogue now:** the taste map (kept for the quiz), the chips with pills, «Ещё фильтры», the applied
  pills, the method's line under the cells, «Остальные».

## The parts, and where they live

| Part | File | Who reads it |
|---|---|---|
| Methods, chips, acidity levels, taste groups (hand-written data) | `data/choose.json` | build/choose.mjs |
| What every coffee is: methods it fits (roast, grind), chips, acidity level, taste groups, region and place on the map, the taste distances | `build/choose.mjs` → `src/data/choose.json` (generated; runs before dev and build) | the catalogue; the quiz |
| The arithmetic: `methodFit`, `meets`, `rank` (matches → «Почти» → the rest), `missOf` / `nearOf` / `roastMiss` (what a coffee misses, and how far), `layout` (the map's places) | `src/scripts/choose.js` (Node and browser) | build/choose.mjs, scripts/filters.js; the quiz |
| The taste map's markup | `src/templates/map.mjs` `tasteMap(ctx, { id, label })` | the catalogue; the quiz |
| The taste map in the browser: `light(slugs)`, `regions(ids)`, `area({ u, v, ru, rv })` (a visitor's wide region), `show(slug)` | `src/scripts/tastemap.js` `initTasteMap(el, { onRegion, onDot, info })` | scripts/filters.js; the quiz |
| The catalogue | `src/templates/catalog.mjs`, `src/scripts/filters.js`, `src/styles/pages/catalog.css`, `src/styles/components/map.css` | — |

## Brewing methods → what QQ sells

QQ sells two roasts (под эспрессо, средняя; под фильтр, светлая; 7 coffees espresso only, 6 filter only, 12 both) and
the same four grinds for every coffee (в зёрнах, для турки, для фильтра, для эспрессо). Колумбия Декаф is QQ's omni
roast («Обжарка в прайсе: Омни»; build/data.mjs keeps only «Эспрессо» from «Эспрессо • Средняя [Омни]», so
build/choose.mjs reads the price list's column): it fits filter methods too, and its card says «Омни-обжарка». A method names the roast it
needs and the grind it sets; `build/choose.mjs` fails if either is not one QQ sells.

| Method (plain name) | Roast | Grind set | Fits |
|---|---|---|---|
| Автоматическая кофемашина | под эспрессо | в зёрнах (it grinds itself) | 19 |
| Рожковая кофемашина | под эспрессо | для эспрессо | 19 |
| Гейзерная кофеварка | под эспрессо | в зёрнах (no moka grind: question `grinds-moka-press`) | 19 |
| Турка | any (под эспрессо when a coffee has both) | для турки | 25 |
| Воронка или дрип-пакет (V60, кемекс, клевер, сифон, a drip bag filled at home) | под фильтр (or omni) | для фильтра | 19 |
| Капельная кофеварка | под фильтр (or omni) | для фильтра | 19 |
| Аэропресс | под фильтр (or omni) | для фильтра | 19 |
| Френч-пресс | any (под фильтр when a coffee has both) | в зёрнах (no coarse grind: same question) | 25 |

Not methods on purpose: capsules and concentrates (QQ sells neither), ready drip bags (the catalogue's «Дрипы» tab,
«скоро»). Every method named in the B2C survey leads to one of these (`docs/choose-check/survey.md`).

What a method does in the catalogue: a coffee QQ roasts for it is a match; its card says «Обжарка под эспрессо · в
зёрнах», its «в корзину» puts that roast and grind into the bag, and its link opens the coffee's page with them chosen
(`?roast=…&grind=…`, read by scripts/buy.js); a line under the cells says what the method sets («Обжарка под эспрессо.
Отдельного помола для гейзера у QQ нет: берите зерно.»). A coffee QQ doesn't roast for it is never a match; as a near
miss it says «обжариваем только под фильтр».

## Chips, acidity, taste

- **Chips** (one at a time; `when` in data/choose.json, all conditions must hold):
  «Под молоко» = QQ's «Применение: Молочные напитки» (10); «Мягкая кислотность» = acidity ≤ 2 (5); «На каждый день» =
  Classic, no ferment, acidity ≤ 3 (13, the decaf included); «Необычное» = the taste model's unusual axis ≥ 2 (ferment ≥ 2
  or an experimental process, 5). Never «Вторая кофемолка», never «Оценка Q», never «Горечь».
  Marketing's «без яркой кислотности» became «Мягкая кислотность»: the acidity filter calls 4–5 «яркая», so «без
  яркой» would have promised 3 too (the outside check); the chip finds the soft five.
- **Acidity** (in «Ещё фильтры»): мягкая 1–2 (5), средняя 3 (13), яркая 4–5 (7). Every coffee in one level (the build checks).
- **Taste groups**: a coffee is in a group when the group's families make up ≥ 0.15 of its flavour profile (the taste
  model's; data/flavours.json): one note of up to six is enough. Шоколад и орехи 8, Карамель и мёд 11, Ягоды 9 (Q-Berry
  among them), Цитрусы 20 (QQ lists citrus almost everywhere), Фрукты 14, Чай и цветы 10, Ликёр и специи 6. Every
  coffee with descriptors is in at least one (the build checks). The first rule (≥ 0.3) left six coffees in none and
  Q-Berry out of «Ягоды» (the outside check).
- **Secondary**: type, caffeine (с кофеином / без кофеина), line, country, processing, price (200 g), sort (Популярные,
  Новинки, Мягче, Ярче, Дороже, Дешевле).

## Ranking: never hidden, never empty

`rank(coffees, conditions, { dist })` (src/scripts/choose.js):
- **Подходят N**: every condition holds, in the page's sort.
- **Почти**: up to three coffees missing the fewest conditions (one, when anything matches), ordered in three tiers:
  those a step or less from the condition (`nearOf`: the points outside a range), then those QQ doesn't roast for the
  chosen method, then those further off; inside a tier, by the taste model's distance to the nearest match. So an
  espresso machine with «Необычное» offers the unusual filter-only lots («обжариваем только под фильтр»), not a plain
  natural with ferment 0. Each says what it misses, in the coffee's own terms («кислотность 3», «Special»,
  «не отмечен у QQ для молока»).
- **Остальные N**: the rest, in the page's sort.
- With no match: «Точно таких нет — ближе всего» and up to six near misses lead, measured against the coffees that would
  match but are sold out, if any (the only decaf sold out: its nearest). With nothing to measure against: «Точно таких
  нет», then «Остальные».
- A sold-out coffee (data/site.json `shop.unavailable`) is never a match or a near miss; it stays in the rest with
  «Скоро вернётся».
- Every option shows how many it would find with the rest of the choice as it is (sold-out coffees never counted).
  Chosen things show as pills with ×, and «Сбросить всё» (the keyboard then goes to «Чем варите»). A screen reader
  hears what a change found («Подходят 10, почти 3»). The choice is in the address (shareable; Back undoes it; of
  several chips in an address, the first).

## The taste map

Acidity across (left «мягче», right «ярче»), body up («плотнее» above, «легче» below), one shape (width / height 1.1),
a dot 8.4% of the map's width (24px on a 320px screen). Dots sit on a honeycomb of places: each coffee takes the free
place nearest to where its position puts it, a sideways step counting 1.6 times a step up or down so acidity's order
holds; the build fails if two dots overlap. Nine regions (acidity soft / mid / bright × body light ≤ 2 / mid 3 / dense
≥ 4: Мягкие и плотные, Плотные, Яркие и плотные, Мягкие, Середина, Лёгкие…), their lines drawn midway between the
dots of neighbouring bands; the build fails if a dot sits outside its region.

The map's box isolates its layers, so an open menu always lies over its dots.

In the catalogue the map is a companion («Карта вкуса» opens it under the chips), not the way in (the bench's map form
was 550–600px tall on a phone; research: a map is liked, but slower). A choice lights its coffees (the others shrink to
small ink-60 dots, still seen); a region is a choice like a chip (`region` in the address); a dot opens its coffee under
the map with what it misses and «К карточке ↓» (redrawn when the choice changes); names show beside the lit dots when
six or fewer are lit, and a screen reader hears «подходит» on a lit dot.

For the quiz: `initTasteMap(el, …).area({ u, v, ru, rv })` draws the visitor's wide region (0–1 of the map's box);
place it from the visitor's region (`src/scripts/taste.js` START, `fit`) with the map's axes (`src/data/choose.json`
`map.axes`: x acidity 0.5–5.1, y density 1.4–5.6, y up). The dots' drawn places differ from their positions by up to
about half a point inside a cluster; the regions are exact.

## Known limits
- On a folded phone (280px) the map's dots are 21px, under the 24px target; from 320px they are 24px or more.
- Methods and chips with counts: a count is the matches alone; a method that fits all 25 (турка, френч-пресс) narrows
  nothing; it still sets the grind and the roast.
- Moka-pot and French-press grinds: QQ has none (question `grinds-moka-press`). The roast for a turka or a French press
  when a coffee is sold in both is a judgement for QQ to confirm (`asks` in data/choose.json).
