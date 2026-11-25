# The quiz in a browser, at the audit's sizes

Outside check of session 4: the quiz «Выбрать кофе за минуту» measured in Chromium (Playwright,
`/opt/pw-browsers/chromium-1243`, swiftshader) on the built site served by `vite preview`, at the twelve sizes of
`site-kit.config.mjs` `audit.sizes`, phones first (touch and `isMobile` up to 1024, 24px text through CDP
`Page.setFontSizes`). Each page opened in a fresh browser, scrolled through once, then measured. Measured on 25 Nov 2026
on the build of 22:22 UTC. After that build `src/styles/pages/quiz.css`, `src/templates/start.mjs`, `src/scripts/quiz.js`,
`data/quiz.json` and `build/quiz.mjs` changed (not measured here); `src/scripts/quizpage.js` did not.

Seven states at each size:
1. `start/`: question 1.
2. `start/?method=espresso&q=1`: question 2.
3. `start/?method=espresso&milk=yes&now=shop&taste=choc`: one coffee and two moves.
4. `start/?method=none&milk=no&now=none&taste=dunno`: three different coffees and the 50 g set.
5. The home page's `.qentry`.
6. `catalog/` after state 3 in the same browser: `[data-quiz-entry]`.
7. `coffee/q-optimistic/` after that: `[data-fit]` and the buy bar.

Also: sideways scroll (the document and `[data-page]`, a screen at a time), text past the screen or cut by a clipping box,
text over text (options, answer buttons, card texts, the map's names and axis words), tap targets (≥ 44px for options and
the result's buttons, < 24px flagged), console errors, failed requests, and axe (wcag2a, wcag2aa, wcag21aa, wcag22aa) at
320, 390 @24px, 1366 @24px and 1440 for states 1, 3, 4 and 5. The interaction runs were at 390 and 1440, and at 390 with
reduced motion. The scripts and screenshots are in `/home/claude/work/browser/`, outside the repo.

All numbers are px. A position is measured from the top of the page. «(below)» means it starts under the first screen
(above the tab bar on phones); «(part)» means only its top is on the first screen.

### Questions (states 1, 2) and the home page (state 5)

| Size | Q1: first option | Q1: options whole on screen | Q1: grid, cell height | Q2: first option, cell height | «Назад» | Home `.qentry`: first option | Sideways: start / home |
|---|---|---|---|---|---|---|---|
| 280×653 | 476 | 3 of 9 | 1 a row · 72–74 | 397 · 72–74 | 40 | 836 (below) | 45 / no |
| 320×568 | 439 | 1 of 9 | 1 a row · 72–74 | 360 · 72–74 | 40 | 779 (below) | 5 / no |
| 390×844 | 384 | 9 of 9 | 2+2+2+2+1 · 72–93 | 349 · 72–76 | 40 | 1006 (below) | no / no |
| 390×844 @24px | 640 | 4 of 9 | 1 a row · 72–92 | 530 · 72–92 | 40 | 1091 (below) | 90 / no |
| 844×390 | 326 (part) | 0 of 9 | 2+2+2+2+1 · 72–76 | 291 · 76 | 40 | 630 (below) | no / no |
| 768×1024 | 362 | 9 of 9 | 2+2+2+2+1 · 72–90 | 326 · 107 | 40 | 1210 (below) | no / no |
| 1024×768 | 366 | 9 of 9 | 3+3+3 · 76–99 | 329 · 99 | 40 | 969 (below) | no / no |
| 1366×650 | 354 | 9 of 9 | 3+3+3 · 72–94 | 318 · 94 | 40 | 844 (below) | no / no |
| 1366×650 @24px | 370 | 6 of 9 | 2+2+2+2+1 · 72–100 | 325 · 100 | 40 | 853 (below) | no / no |
| 1440×900 | 400 | 9 of 9 | 3+3+3 · 89–112 | 362 · 112 | 40 | 1124 (below) | no / no |
| 1920×1080 | 404 | 9 of 9 | 3+3+3 · 90–113 | 366 · 113 | 40 | 1306 (below) | no / no |
| 2560×1440 | 404 | 9 of 9 | 3+3+3 · 90–113 | 366 · 113 | 40 | 1450 (below) | no / no |

### Results (states 3, 4)

| Size | 3: first card | 3: result height | 4: first card | 4: result height | Cards a row | Card height (3) | Answer buttons | Map · dot | Names on the map (3 / 4) | «Пройти заново» at | Sideways (3 / 4) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 280×653 | 737 (below) | 2881 | 617 (part) | 2630 | 1 | 587 | 40 | 318×289 · 26.5 | 3 / 2 | 2590 | 54 / 62 |
| 320×568 | 700 (below) | 2881 | 580 (below) | 2630 | 1 | 587 | 40 | 318×289 · 26.5 | 3 / 2 | 2553 | 14 / 22 |
| 390×844 | 597 (part) | 2937 | 549 (part) | 2759 | 1 | 614 | 40 | 354×322 · 29.6 | 3 / 3 | 2557 | no / no |
| 390×844 @24px | 975 (part) | 3944 | 814 (part) | 3529 | 1 | 820 | 40 | 438×398 · 36.6 | 3 / 2 | 3554 | 90 / 90 |
| 844×390 | 423 (below) | 2344 | 374 (part) | 2200 | 2 | 650 | 40 | 544×495 · 45.5 | 3 / 3 | 1768 | no / no |
| 768×1024 | 505 (part) | 2377 | 457 | 2241 | 2 | 613 | 40 | 544×495 · 45.5 | 3 / 3 | 1794 | no / no |
| 1024×768 | 500 (part) | 1759 | 474 (part) | 1630 | 3 | 605 | 40 | 544×495 · 45.5 | 3 / 3 | 1151 | no / no |
| 1366×650 | 482 (part) | 1818 | 456 (part) | 1731 | 3 | 688 | 40 | 544×495 · 45.5 | 3 / 3 | 1212 | no / no |
| 1366×650 @24px | 510 (part) | 3506 | 439 (part) | 3291 | 2 | 1036 | 40 | 816×742 · 68.4 | 3 / 3 | 2625 | no / no |
| 1440×900 | 577 (part) | 1958 | 529 (part) | 1846 | 3 | 711 | 40 | 544×495 · 45.5 | 3 / 3 | 1343 | no / no |
| 1920×1080 | 583 (part) | 2039 | 535 (part) | 1926 | 3 | 784 | 40 | 544×495 · 45.5 | 3 / 3 | 1423 | no / no |
| 2560×1440 | 583 | 2039 | 535 | 1926 | 3 | 784 | 40 | 544×495 · 45.5 | 3 / 3 | 1423 | no / no |

The map at 280 and 320 is wider than the column (248 and 288 wide) because of the first problem below. Left in its
column, it would be about 248 wide with 21px dots at 280, as on the catalogue.

### The saved quiz (states 6, 7)

| Size | Catalogue line: lines · height · top | «Открыть подбор» | `[data-fit]`: height · top · gap under the name | Buy bar: grind / roast |
|---|---|---|---|---|
| 280×653 | 2 · 38 · 273 | 106×16 | 50 · 254 · 45 | Для эспрессо / Средняя |
| 320×568 | 2 · 38 · 273 | 106×16 | 50 · 217 · 45 | Для эспрессо / Средняя |
| 390×844 | 2 · 38 · 258 | 107×16 | 51 · 201 · 45 | Для эспрессо / Средняя |
| 390×844 @24px | 2 · 57 · 309 | 160×25 | 76 · 312 · 54 | Для эспрессо / Средняя |
| 844×390 | 1 · 19 · 216 | 107×16 | 34 · 200 · 45 | Для эспрессо / Средняя |
| 768×1024 | 1 · 20 · 224 | 113×18 | 36 · 214 · 46 | Для эспрессо / Средняя |
| 1024×768 | 1 · 21 · 229 | 116×18 | 37 · 224 · 47 | Для эспрессо / Средняя |
| 1366×650 | 1 · 20 · 226 | 114×18 | 36 · 219 · 46 | Для эспрессо / Средняя |
| 1366×650 @24px | 1 · 29 · 232 | 163×25 | 51 · 236 · 55 | Для эспрессо / Средняя |
| 1440×900 | 1 · 21 · 237 | 121×19 | 38 · 237 · 47 | Для эспрессо / Средняя |
| 1920×1080 | 1 · 22 · 238 | 122×19 | 38 · 239 · 48 | Для эспрессо / Средняя |
| 2560×1440 | 1 · 22 · 238 | 122×19 | 38 · 239 · 48 | Для эспрессо / Средняя |

## Problems

- **The arrow keys throw the focus out of the options, so Enter never moves on.** An arrow key chooses the next option
  (address `?method=espresso&q=0`, through `replaceState`). Then `go()` → `draw(true)` → `focusFrom(legend)` moves the
  focus to the question's `<legend>`. A second arrow key scrolls the page instead of choosing, and Enter on the legend does
  nothing. This happens at 390 and at 1440, from question 1 on (screenshot `kb-legend-1440x900.png`). To move on, a
  keyboard user has to Tab back to the chosen radio and press Enter, or Tab twice to «Дальше». The arrow path in
  `src/scripts/quizpage.js` (the `change` handler with `arrow`) should draw without moving the focus.
- **The start page scrolls sideways at 280 (45px), 320 (5px) and 390 with 24px text (90px), in every quiz state.** On a
  phone the layout viewport grows to 325 / 325 / 481px, so the whole page zooms out. The cause is the typesetter's held
  pieces in two headings further down the page, `#order-title` «Как⍽мы⍽обжариваем и⍽доставляем» (text to 325px at
  280 and 320, 480px at 390 @24px) and `#roast-title` «Под⍽эспрессо или⍽под⍽фильтр» (271 at 280, 398 at 390 @24px).
  This is the case CLAUDE.md already describes: such headings need `data-typeset="off"` or holds that fit.
- **The result is wider than its column at 280 and 320 (and with 24px text).** «Все подходящие в каталоге: N»
  (`.qres__actions a.btn-arrow`, one uppercase line) needs 318 to 326px at 280 and 320, and 438 to 450px at 390 @24px.
  `.quiz__result`'s grid column grows to that width, so the summary, cards, map and notes run 30 to 75px past the screen.
  This also happens with `isMobile` off: at 280 in state 4 the result is 326 wide in a 248 column. The button needs to
  wrap, or the column needs `minmax(0, 1fr)`.
- **«Пройти заново» leaves the visitor far down the page.** The button sits 1 151 to 3 554px down. After a tap the
  result collapses to question 1, but the scroll stays where it was (`focusFrom` uses `preventScroll`). At 390 the
  question's legend ended 1 435px above the screen, with «Или начните с этих трёх» and below on screen; at 1440 it was
  183px above. The same can happen whenever a step changes while the page is scrolled. Taps from the top kept every
  question's heading on screen at 280, 390, 390 @24px and 1440, because the answer buttons are in the first screen at
  every size (page y 309 to 734).
- **Back shows the previous question without its answer.** The history entry of a question is written before it is
  answered. «Назад» on question 4 goes to `?method=espresso&milk=yes&q=2`, which shows question 3 with nothing chosen
  and «Дальше» hidden. The browser's Back does the same. The visitor has to answer again; a tap does move on at once.
- **An option grid with two a row leaves «Пока не знаю» alone beside an empty cell.** This is the 9th cell of
  question 1, at 390, 768, 844×390 and 1366 @24px, on `start/` and on the home page's `.qentry` (screenshots
  `s1-390x844-0.png`, `s5-390x844-1.png`). The built CSS has no rule for it. `quiz.css`, changed after this build, adds
  `.qopts--many > :last-child:nth-child(odd) { grid-column: 1 / -1 }`. Measure it again after the next build.
- **Answer buttons, «Назад» and «Пройти заново» are 40px tall,** under the 44px asked for, at every size
  (`.qres__answer`, `.quiz__back`, `[data-quiz-again]`). Option cells are fine (72px at least).
- **The map's names and axis words cover dots.** `names()` in `tastemap.js` keeps a name off lit dots only. At most
  sizes «Q-Profit» covers `indoneziya-vonosalam` in state 3. In state 4 two or three grey dots are covered (for example
  Вьетнам Куа Мон over `braziliya-santa-mariya`). Below M, the axis word «↓ Легче» lies under the dot of `ruanda-nyaki`.
  At 280, 320 and 390 @24px only 2 of 3 names fit in state 4.
- **State 4's card links say `?roast=null&grind=В+зернах`.** `p.set.roast` is `null` for «Пока не знаю». buy.js ignores
  the value, so nothing breaks, but the address is wrong; the `roast` parameter should be left out.
- **State 3 offers «Тоже подходит» as its third card** (Q-Punch), not a move. The «плотнее/легче» direction found
  nothing for espresso + milk + shop + choc. This is content, not layout, but it is the case most newcomers will see.
- Small looks: at 1440 the map (544 wide) stands in the left 40% of the column with nothing beside it. In state 4 the
  two buttons above each other have different widths (279 and 328 at 390). At 844×390 the first option of question 1
  only starts on the first screen (326 of 390). At 320, 1 of the 9 options is whole on the first screen.

## What holds

- **No console errors, failed requests or 4xx/5xx responses** in any of the 84 state runs or the interaction runs.
- **No sideways scroll** on the home page, the catalogue or the coffee page at any size. On `start/` there is none from
  390 up, except 390 @24px.
- **axe: no violations** in states 1, 3, 4 and 5 at 320, 390 @24px, 1366 @24px and 1440. Contrast was checked (120 to 140
  nodes passed on `start/`). The same run on the catalogue finds the known `tabs-30` ink-30 (5 nodes, decision
  `tabs-30`), so nothing new is hidden. One «needs review» item: `aria-labelledby` on the `.quiz__result` div, which has
  no role.
- **Option cells** are 72 to 113px tall at every size, with no text cut off or overlapping in options, answer buttons or
  card texts (apart from the sideways cases above). Question 1's first option is on the first screen at every size;
  all 9 are whole on screen from 390 (and 768) up.
- **Taps**: every tap answers and moves on, and the address changes each step (`?method=…&q=1` → `…&milk=…&q=2` →
  `…&now=…&q=3` → the result without `q`). Tapping an answer already chosen moves on. On the result, an answer button
  opens its question (`&q=3&r=1`, the answer marked, «Назад» shown). Another answer returns straight to the result with
  new picks (choc → bright: Q-Optimistic, Q-Profit, Q-Punch → Q-Berry, Руанда Гитсумби, Эфиопия Бекеле). «Назад» from an
  opened answer returns to the result. All of this at 390 and 1440, and with reduced motion.
- **Focus**: after each step the focus is on the question's legend, and on the result it is on `#quiz-summary`. The
  ring shows only after a key: a 2px ink outline on the option, inset 4px, and on the legend and heading. A tap leaves
  no ring. Enter on a chosen radio and «Дальше» move on. Space chooses and moves on, like a tap.
- **«Пройти заново»** clears every answer (`?q=0`, nothing checked, «Назад» hidden), apart from the scroll above.
- **«Взять все три по 50 г — 970 ₽»** (state 4) puts three items into `qq-bag` (50 г, в зёрнах). The tab bar's count
  goes from hidden to 3 at 390, and the navbar's at 1440. The toast says «Три кофе по 50 г — в корзине», and the bag page
  lists the three.
- **State 3's card links** carry `?roast=Эспрессо&grind=Эспрессо`, and so do the cards' hidden fields. «в корзину» puts
  that roast and grind into the bag. The link opens Q-Optimistic with the buy bar on them.
- **The saved quiz is read everywhere it should be.** On the catalogue: «Ваш подбор: Q-Optimistic, Q-Profit и Q-Punch.
  Открыть подбор», linking to the saved answers. It is 2 lines on phones and 1 from 768, 12 to 24px under the tabs, on
  the first screen. On Q-Optimistic: «Из вашего подбора. Ваш способ — рожковая кофемашина: обжарка под эспрессо, помол
  для эспрессо.», 45 to 55px under the name, on the first screen at every size. The buy bar starts on «Для эспрессо»
  (it was «Зерна») and «Средняя». «Открыть подбор», «профиле» and «Колумбия Декаф» are 16 to 25px tall text links
  inside sentences (WCAG 2.5.8's inline exception).
- **Reduced motion** breaks nothing: the same flows pass, the result's cards are at full opacity, and the home page's
  hero and `.qentry` show with nothing dimmed.

## After the fixes (26 Nov, re-measured by Claude on the new build)

Fixed in the commit «Quiz: fixes from the browser measurements», then measured again in Chromium at 280×653,
320×568, 390×844 (and with 24px text), 768×1024, 1366×650 with 24px text, and 1440×900. The states were `start/`,
state 3, state 4 and the home page.
- **Sideways scroll: none at any of these sizes.** The four headings of the page under the quiz are `data-typeset="off"`,
  as the story titles are (CLAUDE.md «Texts»). «Все подходящие: N» wraps, and the result's buttons stand one under
  another, the full width, below M.
- **Arrow keys** choose and keep the focus on the option, and the address follows. Enter moves on, and the focus lands
  on the next question's legend. Checked at 390: auto → →, then espresso, then moka, Enter → `q=1`.
- **Back** («Назад» or the browser's) shows the previous question with its answer chosen and «Дальше» shown: each
  step's entry is stamped with its answer before the next is pushed.
- **«Пройти заново»** scrolls the page back up to the quiz. So does the result appearing when its top is above the screen.
- **An odd last option** («Пока не знаю», «Почти не пью», «Не знаю») takes the whole row where options are two a row:
  354 vs 178 px at 390, 710 vs 356 at 768. Five answers stand in one row from L.
- **Targets:** the answer buttons, «Назад» and «Пройти заново» are 44px.
- **The map:**
  - names avoid every dot, lit or not, and try the four corners after the four sides;
  - only when nothing is free does a name lie over a small unlit dot;
  - three of three names show in state 3 at every size, and 2–3 in state 4.
  - From L the map's words stand beside it, so it no longer leaves the right of the column empty.
- **Links:** with no method («Пока не знаю») the cards' links carry no `?roast=null`.
