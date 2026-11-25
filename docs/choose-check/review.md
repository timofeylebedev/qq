# Independent code review: branch `claude/catalogue-filters`

Reviewed cold on 24 Nov 2026: `git diff main...HEAD` (without `design/catalogue-bench` and `docs`), commits 3452e6b
and 1e234dc. I built the site (`npm run build`), served `dist/`, and drove it with Playwright's Chromium at 1280×900
and 390×844 (touch). To test sold-out handling I put `q-berry`, `kolumbiya-dekaf` and `keniya-kisii` into
`data/site.json` `shop.unavailable` for one build, then restored the file (`git diff data/site.json` is empty). The
scripts are in `/tmp/review/` (t1–t8). I saw every finding below happen in the browser or in a command's output,
except where a finding says it comes from reading the code.

**Count: 6 important, 8 nits.**

## Important

### 1. The taste map's dots cover the open filter menus, and taps land on the dots
`src/styles/components/map.css:33` (`.tmap__dot { position: absolute; z-index: 3 }`) against
`src/styles/components/menu.css:32` (`.filter__options`: positioned, `z-index: auto`). Both sit in the `.filters`
stacking context, and the map comes later in the DOM.
Scenario: open «Карта вкуса», then open «Чем варите». The dots and the «↑ Плотнее» label draw over the list (screenshot
`/tmp/review/phone-method.png`). `elementFromPoint` on the list's options hits `.tmap__dot`:
- at 390: «Воронка или дрип-пакет» and «Френч-пресс»;
- at 1280: «Гейзерная», «Воронка», «Аэропресс», «Френч-пресс».

A tap meant for a method opens a coffee's dot card instead. The same happens to any «Ещё фильтры» menu that opens over
the map.
Fix: `.tmap__box { isolation: isolate; }` so the dots stay inside the map, plus a z-index on the open menu
(`.filters details[open] { position: relative; z-index: 8; }` or on `.filter__options`).

### 2. «Остальные N» is hidden whenever it follows the hidden «Почти» head: sold-out coffees appear under «Подходят»
`src/styles/pages/catalog.css:91` `.grid__head + .grid__head { display: none; }` matches whatever the `hidden` state.
`filters.js:132` always appends `heads.near` before `heads.rest`, so when there are no near misses the rest's head is
always hidden.
Scenario (3 coffees sold out): `?method=turka` or `?method=press&sort=cheap`. The page shows «Подходят 22», then 22
matches, then the 3 sold-out cards with no heading between. Their «Скоро вернётся» cards read as matches. The rest
head has `hidden=false` but its computed style is `display: none`.
Fix: drop the CSS rule and set `hidden` on each head in `apply()` (append only the heads that show), or use
`.grid__head:not([hidden]) + .grid__head:not([hidden])` and leave nothing hidden between.

### 3. «Точно таких нет — ближе всего» heads a list with no nearest at all
`src/scripts/choose.js:66`: with no match and one condition that has no `near` (process, country, type, line, taste),
`near` is empty. `filters.js:136` still titles the list «ближе всего», and finding 2 hides «Остальные 25».
Scenario: the only decaf sold out, `?process=Декаф`. The page says «Точно таких нет — ближе всего» over all 25 coffees
in plain order, the sold-out decaf among them, with no «Почти» lines. The page tells the visitor these are the
nearest, and they are not.
Fix: when `R.empty && !R.near.length`, title it «Точно таких нет» and show «Остальные N». Better: give these
conditions a fallback `near` (taste distance to the option's coffees, sold-out ones included), so the nearest are
still offered.

### 4. `npm run check` fails: two empty `<h2>`
`src/templates/catalog.mjs:84` and `:87` (`<h2 class="grid__head" data-head="exact" hidden></h2>`, same for
`rest`). html-validate: `dist/catalog/index.html … <h2> cannot be empty (empty-heading)`, 2 errors. CI's site job runs
`npm run check`, so this PR fails CI.
Fix: write the default text into the template («Подходят», «Остальные»), or create the heads in the script.

### 5. Removing the last chosen pill, or «Сбросить всё», drops the keyboard focus to `<body>`
`src/scripts/filters.js:229–231`: with no neighbour pill, `next` is null and nothing gets focus; the row is then hidden
(`active.hidden`). `:241`: the reset button hides itself the same way.
Scenario: `?chip=milk&method=moka`, Tab to a pill, Enter, Enter. `document.activeElement` is `BODY`. Same after Enter
on «Сбросить всё».
Fix: when no pill is left, `focusFrom()` the first chip's input (or the «Чем варите» summary); do the same after
reset.

### 6. A change of choice is never announced
`src/scripts/filters.js` `apply()` rewrites «Подходят N» and reorders the grid, but nothing is a status message. The
only `aria-live` regions on the page are the map's dot card and the toast. A screen-reader user who ticks «Под
молоко» hears the checkbox state and nothing about the 10 matches (WCAG 4.1.3).
Fix: a visually hidden `<p role="status">` in the form that `apply()` fills with «Подходят 10, почти 3», or «Точно
таких нет, ближе всего 6». Write it only on a user's change, not on load or popstate.

## Nits

1. **The dot card goes stale.** `src/scripts/tastemap.js:72–77` / `filters.js:193`: the shown dot's card is written
   once. Tap Антиокия, then tick «Под молоко»: the card still shows no «Почти: QQ не советует его под молоко», though
   the coffee is now a near miss. Fix: in `apply()`, call `tmap.show(shown)` again when a dot is shown (expose
   `shown`, or add `refresh()` to the API).
2. **«Чем варите» stays open after a pick.** `src/scripts/menus.js:30` skips the close-on-pick for menus inside
   `[data-filters]`, so the one-choice method list stays open over the chips (and the map, finding 1) after a tap. On a
   phone it covers most of the screen (`phone-method.png`). Fix: let the `method` (and `sort`) radio menus close on a
   pointer pick, like the product's.
3. **Several chips from a shared address.** `?chip=milk&chip=soft`: both chips show ticked, only `milk` applies
   (`f.get`), the pill row shows one, and the address keeps both (`filters.js:58`, `:50`). Fix: in `read()`, tick only
   the first `chip`.
4. **Counts that include sold-out coffees.** The map regions' screen-reader counts (`map.mjs:17`, from
   `build/choose.mjs:97`, which counts every coffee) and «Карта вкуса · 25 кофе» (`catalog.mjs:68`, `filters.js:180`
   `coffees.length`). The sold-out build printed the same region counts as the in-stock one
   (`regions 2/3/2/2/8/2/1/2/3`). Every other count uses `live`. Fix: count `!c.out` in both.
5. **The map's lit state is only visual.** `tastemap.js:60` sets `data-lit`, but a dot's name doesn't change, so a
   screen reader can't tell which coffees a choice lights. Fix: put «подходит» or «почти» into the dot's `.sr` text, or
   use `aria-describedby`.
6. **One-at-a-time chips are checkboxes.** `catalog.mjs:36`: screen readers announce a multi-choice group, while
   ticking one unticks the others (`filters.js:219`). Fix: radios with a way to clear them (the pill ×), or keep the
   checkboxes and say «один на выбор» in the legend.
7. **Near misses: taste always before roast.** `choose.js:68` sorts chip misses before method misses, however far
   they are. Scenario: `?method=auto&chip=unusual` offers Уганда Луна «Почти: фермент 0» (unusual 0.008 against a
   threshold of 2), but never Эль Пласэр ИПА or Ранчо Гранде «обжариваем только под фильтр». Fix: rank a chip miss
   with `nearOf` > 1 after the method misses. (More in `results.md` § D.)
8. **Housekeeping.**
   - `data/site.json:104` puts Q-Berry back on sale inside a feature PR. The commit says so, but CLAUDE.md asks for
     one topic per PR: mention it in the PR description at least.
   - The removed `data-out` filtering leaves `src/styles/components/blocks.css:112` (`.grid > [data-out]`) dead, and
     CLAUDE.md:113 still says «`data-out` is the catalog filter's».

## Checked and fine

- **URL round trip.** Every change pushes one history step. Back and Forward restore the chip, the method and their
  pills (milk → pourover → soft, back ×3, forward). A shared address opens the panel its choice lives in
  (`?region=mid-mid&chip=milk` opens the map). `?qqbox` and the hash (`#dripy`) survive. A bad `?method=foo` falls
  back to «Любым способом» and is cleaned from the address. Typing a price makes one step per pause.
- **Sold-out coffees.** Never a match, never «Почти», never lit on the map. They are left out of every option's count
  in the menus and chips (only the counts in nit 4 still include them).
- **Roast and grind.** Every method sets a roast and grind QQ sells (the build checks; the card shows them). The
  card's «в корзину» stores them (`{"grind":"В зернах","roast":"Эспрессо"}` for moka). The card's link opens the
  coffee's page with the buy bar on them (`?method=espresso` → Антиокия's bar on «Для эспрессо» / «Средняя»). Without
  a method the bag gets `""`, which `cart.js` falls back from as before.
- **Other checks.** `npm run rules`: QQ's twelve rules hold. The kit's one failure (`tokens-wired`: `--c-graphite`,
  `--trace-light`, `--c-taste-other` unused) comes from `build/tokens.mjs`, which this branch doesn't touch. No
  sideways scroll at 390. Map dots measure 29.6 px at 390, with 32.5 px between centres. The arrow keys move between
  dots and between regions.

## After the review (fixed, 24 Nov)

All six important findings and the nits, each re-run in Chromium at 390 and 1280 with three coffees marked sold out
for one build (`data/site.json` restored after):
1. The map's box isolates its layers (`isolation: isolate`) and an open menu has `z-index: 8`: every option of «Чем
   варите» over the open map is hit by `elementFromPoint` (9 of 9, both widths).
2. The CSS that hid a head after a head is gone; `apply()` hides each head itself. «Турка» with three sold out: «Подходят
   22», then «Остальные 3» over the sold-out cards.
3. With no match, the near misses are measured against the coffees that would match but are sold out (`?process=Декаф`
   with the decaf sold out: «Точно таких нет — ближе всего», then six coffees nearest the decaf, then «Остальные 19»);
   with nothing to measure against the head says «Точно таких нет».
4. The heads carry text in the template; `npm run check` passes.
5. Removing the last pill or «Сбросить всё» puts the keyboard on «Чем варите».
6. A `role="status"` line says what a visitor's change found («Подходят 16, почти 3»), not on load or Back.
Nits: the dot's card is redrawn on every change; the catalog's one-choice menus close on a pointer pick; of several
chips in an address only the first is ticked; the map's and its cell's counts leave sold-out coffees out; a lit dot
says «подходит» to a screen reader; the chips' legend says «один на выбор»; near misses rank by tier (finding 7 = results
§ D); CLAUDE.md's line on `data-out` now says it is the favourites' (the rule in blocks.css is theirs, not dead), and
Q-Berry's return to sale is in the PR's description.
