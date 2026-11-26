# The feedback after delivery: how it works

Session 6 of choosing coffee (26 Nov 2026), from Tim's idea of 23 Nov: after the coffee arrives, ask about it in the
same terms as the directions («слишком ярко», «в самый раз», «хочу плотнее»), so that the next suggestion moves. Research:
`docs/feedback-research.md`. Every answer's effect, listed: `docs/feedback-output.md` (generated). The outside check
(six survey respondents over three orders, and a separate agent against the roasters' texts): `docs/feedback-check/`.
What a backend needs: `docs/feedback-backend.md`. Decision: `feedback` (design/decisions.json).

**The loop:** buy → a few cups → three taps per coffee → the visitor's place on the taste map moves and narrows → the
next three coffees honour the answer, each saying why → buy again.

## When and where it asks

| Where | When | What it does | Built |
|---|---|---|---|
| **The order** (account → «Заказы» → an order, `#feedback`) | from delivery: filter beans from day 4, espresso from day 7 (an order of both: the later) | the form, a few taps per coffee; then the reply under it | yes |
| The list of orders | as above | «Как вам кофе? Ответить» under the status; «Ответили про 1 из 2 — ответить про остальные»; «Спросим про вкус 16 августа» before | yes |
| The profile | while an order asks and is under 30 days old | «Как вам A и B? Ответьте в заказе…» over the activity | yes |
| Purchases | always | in place of the thumbs: «Вы сказали: «слишком ярко»», or «Как вам? Ответить» | yes |
| A coffee's page | once answered | under its name: «Вы брали его в июле и сказали «слишком ярко».» | yes |
| **A letter** | filter: day 7 after delivery, espresso: day 10; one reminder 7 days later | the first question's three buttons in the letter itself; each opens the order with that answer tapped (`account/orders/<id>/?fb=<slug>&bright=less#fb-<id>-<slug>`, which the page already reads) | the page side; the letter needs the backend |
| The pack | in the box | a small card: «Как вам кофе? Через неделю спросим в письме — или ответьте сейчас:» and a QR to the account's orders | a proposal for QQ |

**Why there:**
- Taste-fit services ask in the account next to the order, and an email points there (Trade, Crema, Pact, Cometeer,
  Naked Wines, Hungryroot). Stitch Fix makes it part of the next decision.
- Answer buttons inside the email itself got more people to start and to finish than a link to a form (Liu & Inchausti
  2017, ~8,700 emails: 32.0% vs 26.2% started).
- Asking as soon as possible is not best, and timing barely changes the answers (a field study of 300,000+ consumers).
- Beans settle: filter about 5–7 days after roasting, espresso 7–10. QQ roasts to order, so a bag arrives 2–4 days after
  roasting, and a few cups take a few more.
- Nobody publishes results for a feedback card in the box (Bean Box's QR reorders). For QQ it is a cheap test, not a channel.

Sources and the rest of the evidence: `docs/feedback-research.md`.

## What it asks (data/feedback.json `axes`)

Per coffee of the order, in a tile:

1. **Как заваривали:** the catalogue's eight methods. It starts on the method the grind implies: espresso grind → рожковая,
   turka → турка, filter → воронка. For beans it starts on the visitor's last method when that suits the roast, else
   on the roast's own. **С молоком:** as the visitor last drank coffee brewed that way.
2. **Кислинка:** «Слишком ярко · В самый раз · Хочу ярче» (required).
3. **Плотность:** «Слишком плотно · В самый раз · Хочу плотнее» (required).
4. **Необычность** («Ферментация: винные, ромовые, тропические ноты»): «Слишком необычно · В самый раз · Хочу
   необычнее». Asked only about a coffee with some ferment (position.unusual ≥ 0.9).
5. **Не про вкус** (folded): «Помол не подошёл» (then «Как вам удобнее? В зёрнах: мелю сам · Молотый под мой способ ·
   Готовые дрип-пакеты») or «Не как в описании».

Two required taps when the method is right, three for a fermented coffee. The words are what the visitor wants next, not
a grade. Sweetness is not asked: it is 3–5 on every coffee and off the visible axes.

## What an answer changes (src/scripts/feedback.js)

**The visitor's place:** a region on the taste model's three visible axes (acidity, body, ferment), as in the quiz.
- **It starts** from the quiz's region when there is one, else from the middle of the first order's coffees, as wide as
  the model's START (1.5 points).
- **Every taste answer, in order,** goes through `update()` of taste.js:
  - the centre moves halfway towards where the answer points (¾ of a point past the coffee for «слишком…»/«хочу…»,
    the coffee itself for «в самый раз»);
  - the region narrows, to half a point at the least.
- **Session 6 fixed `update()`:** a «слишком ярко» never moves the centre brighter. Before, an answer about a coffee
  brighter than the centre pulled the centre towards it.
- **An answer counts half** when the roast doesn't suit the method (a filter roast in a machine tastes unlike itself). The
  reply says so.
- **«Не про вкус» answers never move anything.**
- The centre stays inside QQ's range (a «хочу плотнее» about the densest coffee can't carry it off the map).
- A later answer about the same bag of the same order replaces the earlier one (an edit). A taste answer and an issue
  about one bag are two answers.

**The next coffees** (`nextOf`): three cards. Each is a coffee QQ roasts for the visitor's last method, in stock and with
caffeine. None is a coffee already answered about (it was tried), and while anything else is left, none is one already bought.

1. **The move:** one real step (≥ 0.45) from the coffee just answered about, in every direction the answer asked
   («слишком ярко» → «Мягче», «хочу плотнее» → «Плотнее», both → «Мягче и плотнее»). The conditions:
   - **between earlier answers first:** after «хочу ярче» on a 3 and «слишком ярко» on a 4.5, a 4, not back to 3;
   - **near on the rows answered «в самый раз»** (within 0.8);
   - **no wilder** on a row not asked about;
   - the coffee page's own guards: «мягче» not much denser or wilder; «классичнее» only onto a coffee without ferment;
     «необычнее» only onto one fermented enough for its card to say so;
   - no robusta blend until the visitor has had one.

   The best fit of the moved region among those wins. With one direction, the coffee page's own «Что взять еще» move
   wins when it fits almost as well, so the two agree. When nothing honours every direction, the least certain one is
   dropped (ferment, then body) and the lead says «Сразу мягче и плотнее у нас нет — взяли мягче.».
2. **«Тоже …»:** a second coffee the same way, not a near twin of the first.
3. **«Снова»:** a coffee the visitor called «в самый раз» on every row, so one miss never hides a find. Else
   **«По вашему вкусу»:** the best fit of the whole region, every answer so far. It is never back the way the last
   answer turned away, and it stays inside the region on acidity and body (≤ 1 point), so it never contradicts «Ваш вкус».
   Ferment there is a softer wish: a less fermented coffee may come, saying «Но без ферментации.».

**After «в самый раз» on every row:**
- «Снова» (the same coffee);
- «Похожий»: a new coffee with acidity and body within half a point and as fermented, said in words («Кислинка и
  плотность те же, ферментации меньше.»);
- the region's best.

When there is no such «Похожий», the lead says so: «Похожего, но нового для вас, сейчас не нашли».

**At QQ's edge** («хочу плотнее» about Q-Optimistic, the densest), the lead says which it is, truthfully, then the nearest:
- «Плотнее, чем Q-Optimistic, у нас нет: это один из самых плотных наших кофе.»;
- softer coffees exist but are much denser («…у нас только Q-Punch и Q-Optimistic, а они совсем другие по плотности или
  ферментации.»);
- they exist only in another roast.

The build checks «самый» against QQ's coded scales.

**Words, not numbers** («Яркая кислинка… Для сравнения, Руанда Гицумби: очень яркая кислинка.»): the simulated customers
read «фермент 1 против 2» as noise.

## How the site shows it listened

- **Right under the answer, on the order:**
  - «Вы сказали: «слишком ярко».»;
  - how it counted: «Учли: ваш вкус сдвинулся мягче.», or for «в самый раз» «Учли: ваш вкус уточнился.», or the half
    answer, or for «не про вкус» what happens (passed to QQ; «Дальше предложим в зёрнах»);
  - the next coffee named: «Следующий — мягче: Колумбия Антиокия. Все три — в профиле.»;
  - «Изменить ответ» and «Рассказать на странице кофе».
- **The profile:**
  - **«Ваш вкус»**, a tile in place of the radar of purchases (two pictures of taste would disagree, and the radar showed
    sweetness): the taste map in small, every coffee a dot, the visitor's region, the path of its centre answer by answer
    and where it is now;
  - under it, in words, only after 3 taste answers («Яркий и лёгкий, можно с лёгкой ферментацией, уже довольно точно.»).
    Before that: «Пока это набросок по подбору и 1 ответу после доставки. Ещё 2 ответа — и назовём ваш вкус словами.»
    (session 0: show «your taste» only after 3–5 answers);
  - **«Следующий кофе»** in place of «Подобрали для вас» (which scored the four scales itself, against CLAUDE.md's rule):
    the lead («Руанда Гицумби: вы сказали «хочу плотнее». Следующий — плотнее:») and the three cards, each under its
    move in lavender with why. Its link and «в корзину» carry the roast and grind for the visitor's method, or what they
    asked for after «помол не подошёл».
- **Purchases:** what was said, per coffee.
- **A coffee's page:** «Вы брали его в июле и сказали «слишком ярко».»
- **«Впечатления»:** closeness to each teller is measured from the moved region (it was the quiz's, or the average of
  the purchases).

## Where it lives

- `data/feedback.json`: when to ask, the rows, weights, the next rules, every word.
- `build/feedback.mjs` → `src/data/feedback.json` (+ `docs/feedback-output.md`), after build/quiz.mjs.
- `src/scripts/feedback.js`: the arithmetic (Node and browser): `replay`, `nextOf`, `tasteName`, `askState`, `setFor`.
- `src/scripts/feedbackview.js`: what the account says (replies, rows, cards, the question), the same in the template and the browser.
- `src/templates/account.mjs`: the order's form (`fbSection`), the rows (`fbLine`), purchases (`pcardFb`), the profile
  (`fbPrompt`, `myMap`, `nextPart`).
- `src/templates/account-data.mjs`: `feedback()`, the placeholder visitor's state.
- `src/scripts/feedbackpage.js`: the browser. It adds this browser's answers, redraws, and keeps `qq-feedback`.
- `src/scripts/tastesaved.js` reads `qq-feedback` for «Впечатления» and the coffee's line.
- `src/templates/people.mjs`: «your» taste is the account's moved region.
- `src/templates/product.mjs` `mineLine`.
- **The placeholder visitor** (data/account.json `today`, `feedback`):
  - Марк's world is 19 Aug 2026, when his last order is being roasted;
  - his three earliest orders are answered (one «помол не подошёл»);
  - the two later ones wait for answers, so the form can be tried.
- **Storage:** localStorage `qq-feedback` = `{ v: 1, answers, region, mine }`. Nothing is sent.
- `build/feedback-sim.mjs`: the loop on the command line, for the simulation.
- `build/feedback-paths.mjs` → `docs/feedback-check/paths.json`.

## Checks

- **build/feedback.mjs runs every answer:** every coffee in stock × every method QQ roasts it for × with and without milk
  × every combination of the three rows, ~5,000 in all. It fails on:
  - a sold-out, decaf or wrong-roast offer (checked against products.json and site.json);
  - a new coffee already answered about;
  - a move the wrong way on QQ's own coded scales;
  - a visitor moved against the answer, or moved by an unanswered row or by «не про вкус»;
  - a filter roast in a machine not counting half;
  - the taste named before three answers;
  - an «у нас нет … самый» that a coffee on QQ's scales contradicts;
  - an empty or broken word.
- **The simulation and the check against the texts:** `docs/feedback-check/README.md`.

## Known limits

- **One visitor, one method.** The next coffees are for the last method answered. Марк brews in a machine and a
  pour-over, so the profile follows his last answer. A visitor with two methods would want two rows; later, with real data.
- **No bitterness row.** One customer found a robusta blend too bitter and had only «слишком плотно» to say it with.
  QQ's scales have no bitterness (the taste model dropped «Горечь»). A question for Tim (`feedback-bitter`).
- **Flavour isn't asked.** «В самый раз» on every row but «не моё» can't be said. The third answer of session 5
  (`people-third-answer`) would catch it; Naked Wines and Crema separate liking from wanting again.
- **The quiz doesn't ask whether you grind.** The first bag may come ground for someone with a grinder;
  «помол не подошёл» fixes the next ones.
- **No drip bags.** A drip-bag drinker gets filter grind and the reply says QQ has no bags (QQ's question).
- **The coffee page's «Поделиться впечатлениями»** is still its own form with session 5's words («ярковато / хотелось
  ярче» against what you usually drink). The account's reply links to it; one form for both is the backend's.
- **A coffee's coded position** is not moved by answers. The taste model's rule stands: ≥ 8 agreeing «не как в описании»
  put it on the Notion fixes list (the backend).
