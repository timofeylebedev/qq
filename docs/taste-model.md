# The taste model

One position per coffee in one taste space. The distance between two positions means "tastes alike". A direction is a
move in that space: brighter or softer, denser or lighter, more unusual or more classic. The related coffees, the
catalogue, the quiz, people's picks and the feedback after delivery all read the same model, so they can't disagree
with each other. Session 1 of the "choosing coffee" plan (claude.ai project QQ, `claude/choosing-coffee-plan.md`).

## Where it lives

| File | What |
|---|---|
| `build/taste.mjs` | the build step: cleans the data, places the coffees, picks neighbours and directions, writes the reasons, checks its own rules (the build fails if they break) |
| `src/scripts/taste.js` | the arithmetic, the same in Node and in the browser: distance, family similarity, a visitor as a region, how an answer moves the region |
| `data/flavours.json` | the flavour families: every descriptor → family, each family's place on the SCA/WCR wheel, its reference food, its dot colour |
| `src/data/taste.json` | **the output** (generated, not committed, like `products.json`): positions, flavour profiles, 5 neighbours and 6 directions per coffee with reasons, anchors, relabels, the fixes list |
| `docs/taste-output.md` | the same output, readable, committed so a review shows how neighbours move when the data changes |
| `docs/notion-fixes.md` | what QQ should fix in the Notion table, written by the same build |
| `docs/taste-check.md`, `docs/taste-check/` | the blind check and what came of it |
| `docs/taste-lexicon.md` | the research behind the families (WCR lexicon, flavour wheel, sources) |
| `design/taste-bench/` | the bench: an interactive map published as an artifact (`npm run taste:bench`, then publish `out/`) |

`npm run taste` rebuilds it. `predev`, `prebuild` and `precanvas` run it after `build/data.mjs`. The coffee page's
«Кофе с похожим вкусом» now shows the model's four nearest (it had its own scoring before), and descriptor dots take
their colour from `data/flavours.json`.

## Input and cleaning

The input is `data/products.csv`, the Notion export, as it is. Cleaning happens in the build, never by hand in the
CSV. Every fix the build makes is logged and becomes a line in `docs/notion-fixes.md`, and a line disappears once
Notion is fixed and the CSV is exported again.

- **Which coffees:** the 25 of `build/data.mjs` («На сайте» = Да). Колумбия Вуш-Вуш is there twice: the filled-in
  row (`cf_6WFSJG9JTurLDDQ7`) wins.
- **Old wording in [brackets]** is dropped: names, descriptors, short lines, roasts, processing, tags. Q-Berry's
  descriptor split by a bracket («Шоколад [Лесные ягоды» + «Шоколад]») reads as «Шоколад».
- **Processing**, whatever the spelling (Натуральная / Натуральный, Мытая / Мытый), becomes codes: washed, natural,
  honey, wet-hull, anaerobic, semi-anaerobic, culturing, decaf. A blend's processing comes from its lots, found among
  all rows of the table (robusta has no row of its own, so it is left out of the share).
- **Relabels:** any row with the same green coffee (the same lots in the same shares) as an on-site coffee is that
  coffee under another name (St. Riders, Okta Brew, Иду лесом, Donutsday, the light and dark roasts: 17 rows). Lot
  names are compared loosely (case, ё/е, hyphens and dots, up to two typos), and a name that is another coffee's name
  plus a partner's counts as the same coffee too. They
  are listed as anchors and **never offered as an alternative to their own coffee**. On-site coffees are grouped the
  same way, so this rule holds if a relabel is ever put on the site.
- **Checked against the text:** where «О сорте» says «плотное тело» or «яркая кислотность» and the scale says 3, the
  build lists it for QQ. The model believes the scale.
- **Never used by the model:** «Оценка Q» (it follows acidity and ferment, r ≈ 0.7: using it would rank bright and
  fermented coffees as "better"; it is not read at all), «Ценовая группа» (read only for the fixes list), «Линейка»
  (carried for display).

## The space

Each coffee has three visible coordinates on QQ's own scales, two hidden ones, and a flavour profile.

| Coordinate | From | Why |
|---|---|---|
| **bright** (мягче — ярче) | «Кислотность», ± at most 0.2 from what the descriptors say about acidity (citrus +1, berry +0.8 … chocolate −1, scaled to 0.2) | Acidity is the axis people differ on most (session 0). The lift only orders coffees inside one step, e.g. the eight at acidity 3 / body 3: a coded difference always wins |
| **body** (легче — плотнее) | «Плотность», as coded | the "for milk" axis |
| **unusual** (классичнее — необычнее) | «Фермент» + 0.3 for an experimental process (anaerobic, semi-anaerobic, culturing), + 0.2 for wet-hull or for a species that isn't arabica (Воносалам, excelsa), − 0.1 for robusta in a blend, ± 0.1 from the families | ferment is QQ's own call; the process is QQ's data too, and it breaks ties |
| sweet (hidden) | «Сладость» | it is 3–5 almost everywhere, so it counts a third and never appears as an axis or a reason unless two points apart |
| process (hidden) | washed / natural / wet-hull shares | QQ's scales don't record it, but washed cups read cleaner, naturals fruitier and heavier. The blind check showed this was missing (below) |
| flavour (hidden) | the descriptors' families, shares adding up to 1 | the only thing that separates coffees with identical scales |

**Flavour families** (`data/flavours.json`, research in `docs/taste-lexicon.md`): 11 families placed in the order of
the SCA/WCR Coffee Taster's Flavor Wheel (2016). That wheel was laid out from 72 experts sorting the WCR lexicon's
terms, so neighbours on it are flavours people group together: чай и цветы · ягоды · сухофрукты · садовые фрукты ·
тропические фрукты · цитрусы · ликёрные ноты · специи · орехи · шоколад · карамель. Every one of the 66 descriptors in
the table is mapped exactly, with no substrings; a compound one is split (Земляничное варенье = ягоды 0.7 + карамель
0.3). Two families are similar by their distance on the wheel (1 − arc / 50°), at least 0.45 within one inner
category (Fruity, Nutty/Cocoa), plus 9 set pairs: 7 links that the lexicon's own definitions make (chocolate ~ caramel
0.6, "sugar browning"; berry ~ ferment 0.4, WCR: strawberry is "frequently winey"; and so on) and 2 from the wheel's
structure (chocolate ~ nuts 0.75, one inner category; chocolate ~ citrus 0, opposite sides). Shortbread and toast count as
caramel, because the WCR's reference for "sweet aromatics" is a shortbread cookie. Two coffees' flavours are compared
by soft cosine, which credits near families. Cuppers barely share vocabulary (only four terms were used by more than
two tasters for one coffee), so a family that matches only near another should still count for something.

## The distance

```
d(a, b) = √( (1·Δbright)² + (0.75·Δbody)² + (0.85·Δunusual)² + (0.35·Δsweet)² + (1.4·(1 − flavourSim))² + (0.6·processGap)² )
```

One point of acidity counts 1. A point of body or ferment counts a little less. A complete change of flavour counts
like 1.4 points of acidity: it has to separate the cluster at acidity 3 / body 3. A complete change of processing
(washed vs natural) counts 0.6. Санта Мария, Антиокия and Мерури are identical on all four scales; they now sit
0.69–0.95 apart, set apart by flavour and processing. The median distance to a coffee's nearest neighbour is 0.61.

**Two exclusions apply before any distance:** a relabel of the same green coffee is never an alternative, and a
decaf is never offered for a coffee with caffeine (decaf = the processing or the name says so, or at least half the
green coffee is a decaf lot, so a «лоукаф» blend counts). Decaf is a need, not a taste: a surface shows it in its own slot.
The decaf's own alternatives say «С кофеином». The build fails if either rule breaks, and its check doesn't trust
the model's own flags: it re-reads the name, the processing and the green coffee.

## Directions

For each of the six directions, a candidate must be **one real step** along its axis: at least 0.45 further on the
coordinate (QQ's smallest step is half a point). The best candidate is then the closest on everything else (the
distance without that axis). Each point beyond a full step costs 0.4, so the pick is "the same, but brighter", not
"the brightest". «Плотнее» is the step towards milk: a coffee QQ tags «Молочные напитки» gets 0.25 off.

- **An edge** (no candidate) says so in words: «Ярче этого у QQ сейчас нет…». Edges: brighter 2, softer 2, denser 2
  (the two robusta blends), lighter 6 (everything at body 2), unusual 2, classic 17 (every coffee with ferment 0: it
  already is the classic end).
- **Far:** a step or neighbour whose other axes and flavour differ by more than 1.6 is still shown, but its reason
  says it is a different coffee in other respects (brighter 1, softer 4, denser 5, unusual 2). These are the holes in
  the range. Log clicks on them.
- **Reasons** are written in the coffee's terms, the downside included, in points the card shows, and the other
  coffee's flavour in its own descriptors. Ньяки → «Мягче»: «Мягче: кислотность 2 против 3. Но плотнее (плотность 3
  против 2). Общее во вкусе — цитрусы и чайно-цветочные ноты; у него мед, сушеный апельсин, цветы.» A blend and a lot
  it contains say so («В обоих — Бразилия Санта Мария: здесь 60%, там 50%»); a step of more than a point says that
  the nearer ones differ more elsewhere. A neighbour's reason names what is the same, then the biggest difference. The
  structured `why` sits beside each text, so a surface can phrase it its own way.

## Anchors and visitors

- **Anchors** are what people already know, placed as regions (centre + spread) on the same axes. Origins come from
  their single origins. Café drinks come from QQ's own «Применение» tags (капучино/латте, эспрессо, фильтр). "A
  supermarket bag" is a hand-set assumption (acidity 1, body 4.5, chocolate and nuts) to check with QQ. Relabels map
  to their coffee.
- **A visitor is a region, not a point** (`src/scripts/taste.js`): a centre and a spread per axis, plus flavours if
  known. The quiz sets a wide one (`START`: spread 1.5). `fit()` says how well a coffee fits it. `update()` takes one
  answer per axis after a delivery ("less" «слишком ярко», "ok" «в самый раз», "more" «хочу ярче»): it moves the
  centre halfway towards where the answer points (¾ of a point past the coffee) and narrows the spread, never below
  0.5. "Wrong grind" and "not as described" are not taste answers and never reach it.
- **A coffee's position can be revised:** the coded scales are the input, so a correction goes into Notion and the
  next export. Proposed rule for session 6: when at least 8 delivery answers about one coffee agree that it is not as
  described in one direction, the build lists it for QQ. It is not moved automatically.

## What the check found

Two blind judges read only QQ's texts. 76% of their 70 closest picks fall in the model's top 10 of the 23 coffees
it may offer (median rank 6). Fixed from the check: processing was added, decaf is excluded, and far neighbours are marked. The
rest is explained coffee by coffee in `docs/taste-check.md`: mostly the texts disagree with QQ's own scales, so the
question went to QQ. Next is the roaster's blind sheet.

## Open

- **A roaster's blind sheet** (one page, linked in `docs/taste-check.md`) and two tasters scoring the 25 independently:
  until then the check is against texts, not against a palate.
- **Text vs data** (`docs/notion-fixes.md`): Бекеле, Гуджи, Ранчо Гранде and Кисии (body or acidity); Вуш-Вуш (an
  anaerobic process written as «Натуральная») and Ла Сирена (culturing without its base); and Мерури, the question
  the blind check raised: its text says deep, spicy, soft; its descriptors and acidity say grapefruit, tropical, 3.
- **The weights and family similarities are judgements**, written down to be revised by tasting data. The bench has
  sliders. Between flavour weights of 1 and 3, process 0–1 and acidity 0.6–1, agreement with the judges moves only
  between 2.1 and 3.0 of 5.
- **«Под молоко» as its own direction** (session 2): today «плотнее» prefers milk-tagged coffees, but milk also masks
  acidity.
- **«Кофе с похожим вкусом» shows far neighbours** without saying so: 3 of 4 on Q-Optimistic, Q-Punch and Эль Пласэр
  ИПА. Session 2 decides the form (fewer cards, «ближе у нас нет»).
- **The account's "for you" list** (`src/templates/account-data.mjs`) still scores the four scales on its own. Move it
  to a region with `fit()` in session 5 or 6.
- **"A supermarket bag"** as an anchor is an assumption. Ask QQ what their newcomers drank before.
- **«Вторая кофемолка»** still shows on the coffee page («Как готовить»). Remove it in session 2 or 3.
