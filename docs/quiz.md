# The quiz «Выбрать кофе за минуту»: how it works

Session 4 of choosing coffee (26 Nov 2026), from marketing's rows 4 and 10 and their doc's sections 2 and 15. Research:
`docs/quiz-research.md`. Every answer's result, listed: `docs/quiz-output.md` (generated). The outside check against the
B2C survey: `docs/quiz-check/`. A script for testing it with five newcomers: `docs/quiz-test.md`. Decision: `quiz`
(design/decisions.json). Bench: `design/quiz-bench/` (`npm run quiz && node design/quiz-bench/build.mjs`), published at
https://claude.ai/artifact/AZFRK774BDY4sEPQq1EspK: any answers with three forms of the result side by side, and the 106
respondents of the survey check with their verdicts.

## Where it is
- **A dialog of the catalogue, «Подобрать кофе»** (Tim, 26 Nov: no page, no section): `src/templates/quiz.mjs`
  `quizDialog()`, opened by the button at the left of the filters' row (apart from the cells by the gap; below L on its
  own line above them), by `catalog/?quiz` (the footer's «Подобрать кофе», the profile's «Открыть подбор») and, with a
  quiz kept in this browser, straight onto its result. The page «Заказываю кофе впервые» (`start/`: the «start here»
  set of three, the roasts, the words, roasting and delivery) and the home page's section after the hero are gone.
- **In the dialog:** four bars and ← → at the top (→ only once the question is answered), the question and its options
  (no «Вопрос 1 из 4» but for a screen reader, no «или выбираю в подарок»). The result: «Ваш подбор», one sentence, the
  answers (each reopens its question and comes straight back), the three cards, «Показать в каталоге» (ticks «Для вас»
  under the filters with the visitor's method, and closes), «Пройти заново», the taste map. No «Это начало, а не
  приговор…», no «Нажмите на ответ…», no line about what was saved. The answers live in the dialog, not in an address.
- **The options' lines** are the grid's own (its line colour one hairline between cells, and a frame), not the cells'
  overlapping borders: a chosen or tinted cell never covers or doubles a neighbour's line (Tim, 26 Nov).
- **B2B** is a link on the first screen («Для кофейни или офиса: подберём с менеджером и на дегустации» → business/),
  not a result: business buyers choose with a manager and a cupping (marketing's row 5; the B2B survey).

## The questions (data/quiz.json `steps`)
Four, one tap each. A tap answers and moves on; Back returns; the arrow keys only choose (Enter or «Дальше» moves on).

| # | Question | Answers | Why this question |
|---|---|---|---|
| 1 | Чем вы варите кофе дома? | the catalogue's eight methods by their plain names (data/choose.json) + «Пока не знаю (или выбираю в подарок)» | Everyone can answer it; it sets the roast and grind QQ sells, the same mapping as the catalogue's «Приготовление» |
| 2 | Пьёте с молоком? | обычно с молоком · когда как · без молока | Newcomers add milk far more often (69% vs 17% of enthusiasts in the survey); milk softens acidity and wants body; QQ tags 10 coffees for milk |
| 3 | Какой кофе вы пьёте сейчас? | из магазина или маркетплейса · в кофейнях · растворимый или капсулы · спешелти других обжарщиков · почти не пью | People describe coffee by what they drink, not by taste words (19% of newcomers answered «не знаю» about taste); it is the reference the region starts from |
| 4 | Что вам ближе на вкус? | шоколад и орехи (без кислинки) · карамель и фрукты (лёгкая кислинка) · ягоды и цитрусы (яркая кислинка) · что-то необычное · **не знаю** | One coarse taste question with food words and «не знаю» (session 0: no sliders); acidity is the axis people differ on, so each option says it |

Not asked, on purpose: budget (Classic 680 ₽ and Special up to 1 180 ₽ for 200 g: a question would cost a step for a small
split; the prices are on the cards), strength (no data on what newcomers mean by «крепкий»; the method and milk stand in
for it), foods you like (no evidence), decaf (one coffee: the result names it under the cards).

## Where the answers put the visitor (src/scripts/quiz.js `regionOf`)
A visitor is a region on the taste model's visible axes (bright = acidity, body = density, unusual = ferment and
processing): a centre and a spread, as `START` and `fit()` in src/scripts/taste.js.
- **Start** from what they drink now: one of the taste model's anchors (taste.json `anchors.drinks`): «пачка из
  супермаркета» (shop, instant), «эспрессо» or «капучино, латте» with milk (cafés), «фильтр, воронка» or «эспрессо» by
  the method's roast (specialty). The spread is wider than the anchor's (1–1.4 points): what you drink now is not what you
  would pick. «Почти не пью» starts from START (2.5 / 3.5 / 0.5, spread 1.5).
- **Taste** pulls the centre 85% of the way to its own point on acidity and ferment and narrows those spreads to 0.8
  (choc 1.6 · caramel 2.9 · bright 4.5 · wild 3.6 with ferment 2.6), and gives the region a flavour profile (cocoa and
  nuts; caramel, orchard and dried fruit; berry and citrus; fermented and tropical).
- **Milk** shifts acidity −0.25 and body +0.4 (yes) or half of that (sometimes), and costs a coffee QQ does not tag for milk
  0.45 (0.15).
- **The method** thickens the cup: moka +0.4, turka +0.3, machines and the French press +0.2 (people choose them for
  «насыщенный», «крепость», as the survey's respondents say).

## The result (`result`)
**The form follows how much the answers tell.**
- **A taste is named → one coffee and two moves away from it.**
  - The first is the best fit in the region among coffees QQ roasts for the method, in stock, with caffeine.
  - The two others are steps from it (≥ 0.45 on the move's axis, near on the others, within 1.5 spreads of the region),
    in the directions the answers leave least sure:
    - choc: ярче, then плотнее/легче;
    - caramel: мягче, ярче;
    - bright: мягче, необычнее (with milk: ярче, мягче);
    - wild: ярче, необычнее (with milk: классичнее, необычнее).
  - The coffee page's own «Что взять еще» move is taken when it fits the visitor almost as well as the best (652 of the
    1 080 moves, 60%); otherwise the taste model's next candidate in that direction or the best fit in the region.
    Two moves are never near twins of each other (taste distance ≥ 0.6), and «Необычнее» needs real fermentation. With milk (and a taste that isn't bright or unusual) a move is only onto
    a coffee QQ tags for milk.
  - A direction with nothing in it gives way to the next; the last resort is «Тоже подходит», never a near twin of a coffee
    already shown (two robusta blends side by side).
- **«Не знаю» → three different coffees,** softest to brightest:
  - the best soft, middle and bright coffee inside the region (for milk, or a moka, turka or machine: a dense one in
    place of the bright);
  - offered as «Взять все три по 50 г» when QQ sells each in 50 g (a question for Tim: `quiz-small-packs`).
- **Why not a place on the map alone, or a list:**
  - uncertain choosers do worse with many options (Chernev et al. 2015);
  - a best match with alternatives that show their trade-off beat a ranked list on trust (Pu and Chen 2006);
  - inside the region there are 0 to 19 coffees over the 675 answer sets (median 6), so the region alone either says
    nothing or too much.
  - The map is still shown, as the explanation: «Пятно — ваш вкус по ответам. Оно широкое: это начало, а не точка.»

**Reasons in plain words** (data/quiz.json `words`), on each card under its move in lavender:
- **What ties it to the answers:**
  - the taste asked for («шоколад и орехи, как вы хотели»), only when the coffee's own notes are of those families, and
    never beside a contrary downside (the summary then leaves the taste out of its reasons too);
  - «QQ советует его для капучино и латте»;
  - «похож на кофе из магазина, только свежей обжарки» (only the anchor's own coffees).
- **The coffee in words:** «Почти без кислинки, очень плотный. Во вкусе …» (acidity, density and ferment as words, never
  «3 из 5»); a blend with robusta says so («Смесь с робустой: крепче и с горчинкой»: some people avoid it).
- **One downside at most,** where it is furthest from what was asked: «Но кислинка ярче, чем вы описали», «Но легче, чем вы
  привыкли», «Но QQ не советует его для молока». About one card in seven carries one (296 of 2 025).
- **What the method sets:** «Обжарка под эспрессо, помол для эспрессо — или в зёрнах, если мелете сами» (moka and French
  press: in beans, QQ has no such grind yet).
- **Above the cards, one sentence:** what kind of coffee to start with and why, from the answers: «Начните с мягкого и
  плотного кофе: вы пьёте с молоком, привыкли к кофе из магазина и выбрали шоколад и орехи.» Then: «Это начало, а не
  приговор…».
- No persona labels: a label changes taste and self-image (research), and the region already says it.

Also on the result:
- the answers, each a button that opens its question and comes straight back (`?…&q=2&r=1`: `r` returns to the result);
- «Все подходящие в каталоге: N» (the method, milk, and the taste as the catalogue's own switches: choc → acid=low,
  bright → acid=high, wild → chip=unusual; a condition that would leave fewer than three is dropped);
- the taste map (the catalogue's `tasteMap()`, `initTasteMap().area()`), with the three lit and named;
- the decaf in words;
- «Пройти заново».

## What it reuses, so the quiz and the catalogue agree
- The methods and the roast and grind they set: `data/choose.json` → `src/data/choose.json` `methods` (`methodFit`). A
  card's «в корзину» puts that roast and grind into the bag, and its link opens the coffee's page on them
  (`?roast=…&grind=…`, scripts/buy.js), as in the catalogue.
- The taste map: `tasteMap()` (src/templates/map.mjs), `initTasteMap()` (scripts/tastemap.js) with `area()` for the region
  and `light()` for the three.
- The taste model: positions, flavour profiles, family similarity, anchors, `fit()`, and the coffee page's moves
  (`next`, `directions`).
- The catalogue's chips and switches, for the link to its part.

## Saved, and who reads it
Until the account has a backend, the result is kept in this browser, only when the visitor answered the questions here
(a shared result offers «Сделать этот подбор моим» instead of replacing theirs): localStorage `qq-taste` =
`{ v: 1, at, answers: { method, milk, now, taste }, region: { center, spread, flavour? }, mode, picks: [{ slug, label, name }] }`
(`scripts/tastesaved.js`). Read by:
- **the catalogue:** «Для вас», the first checkbox under the filters (choose.js `forYou`: the three and the coffees
  inside the region), in place of the line about the quiz;
- **a coffee's page** (`[data-fit]` under the name):
  - «Ваш способ — рожковая кофемашина: обжарка под эспрессо, помол для эспрессо.», or «Для вашего способа — … — не
    подходит: его обжариваем только под фильтр.»;
  - «Из вашего подбора.» when it is one of the three;
  - the buy bar starts on that roast and grind (unless the address chose them);
- **«Впечатления»:** how close each teller's taste is to yours now uses the quiz's region (it was the account's
  placeholder purchases);
- **the profile:** «Ваш подбор», the three with their moves, «Изменить ответы».

**What a backend must keep** (with `docs/people-backend.md`):
- the answers and the region per account, and every earlier set of answers with its date (log them from day one:
  traffic is too low for A/B tests);
- the three offered, and which one was bought.

**Session 6 (feedback after delivery)** moves this region with `update(region, pos, answers)` of taste.js. It narrows
the spread, so «Ваш подбор» becomes sharper with each answer. «Не про вкус» answers never reach it.

## Checks
- **build/quiz.mjs runs every combination** (9 × 3 × 5 × 5 = 675) and fails on any result that:
  - offers a sold-out coffee, a decaf, or a coffee the method's roast does not fit;
  - offers the same coffee twice or fewer than three;
  - has an empty or broken reason, or reads «Оценка Q».
- **The survey** (`docs/quiz-check/`): 106 respondents coded blind from their own answers, run through the quiz, judged
  against what they said. Results and fixes there.
- **build/quiz.mjs also checks against the sources,** not quiz.js's own rules: products.json's roasts and grinds,
  site.json's `shop.unavailable`, the decaf tag; no near twins among the three; the catalogue link keeps the first coffee;
  the summary never names a taste the first card contradicts. It runs every answer again with the most offered coffee
  sold out.
- **The browser** (`docs/quiz-check/browser.md`): the audit's sizes, the result's three cards, the map, the keyboard.
- **The independent review** (in the PR): its findings were fixed in «Fixes from the independent review».

## Known limits
- **The anchors are judgements.** «Пачка из супермаркета» is an assumption of the taste model (dark roast, often with
  robusta) for QQ to confirm. The specialty anchor is the model's filter or espresso anchor, not a measured place.
- **A wide region still picks one first coffee.** For the most common answers (machine, milk, shop) it is QQ's dense
  milk blends. That is right for those people, but it means few lots ever come first: 11 of 24.
- **«Или начните с этих трёх»** is the quiz's own «не знаю» everywhere, among the coffees roasted for espresso and filter
  both (so they suit any method): today Эфиопия Бекеле, Вьетнам Куа Мон, Руанда Гицумби.
- **Kenya Найваша ПБ and Ла Сирена are rarely offered.** They sit at the bright edge, beyond what newcomers ask.
- **«Тоже подходит»** appears when a direction has no coffee (21 of the 1 080 cards after a first one), mostly at the soft-dense edge.
- **Q-Punch is in the «Ликёр и специи» taste group** through «сладкие специи» (data/choose.json, session 3), which the
  survey check questioned. The quiz names notes, not groups, so it doesn't show.
- **No decaf answer.** There is one decaf; the result names it under the cards. Two survey respondents liked only decaf.
- **On a folded phone (280px)** the map's dots are 21px, under the 24px target, as in the catalogue (`docs/choose.md`); from
  320px they are 24px or more. The three coffees are also cards, so nothing depends on tapping a dot.
- **The quiz can't know dislikes** («перу точно не нравится»). Feedback after delivery and the catalogue handle those.
