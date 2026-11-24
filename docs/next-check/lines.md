# QQ «what next» block, v4 (final): outside check against the roasters' texts

## Summary

| Lines checked | ok | Flagged | High | Medium | Low |
|---|---|---|---|---|---|
| 150 | 131 | 19 | 4 | 6 | 9 |

Earlier rounds: v1 50 flagged (10 H / 16 M / 24 L) · v2 31 (4 / 11 / 16) · v3 18 (4 / 6 / 8).

**Remaining flags** (H = a shopper would be misled; M = odd or weak; L = wording, or a better pick exists):

| Sev | Coffee | Move | Flag |
|---|---|---|---|
| H | Колумбия Антиокия | Похожий | Антиокия «Похожий» → Мерури: texts describe opposite cups (on purpose, pending roaster) |
| H | Колумбия Антиокия | Sold out | Антиокия sold-out → Мерури (same) |
| H | Индонезия Мерури | Похожий | Мерури «Похожий» → Антиокия (same pair) |
| H | Индонезия Мерури | Sold out | Мерури sold-out → Антиокия (same pair) |
| M | Колумбия Эль Пласэр ИПА | Sold out | ИПА sold-out → Воносалам; should be Ла Сирена |
| M | Руанда Гицумби | Похожий | Гицумби «Похожий» → Чайна Альта: no berries; Ньяки (same Rwanda Red Bourbon) unused |
| M | Руанда Гицумби | Sold out | Гицумби sold-out → Чайна Альта (same) |
| M | Колумбия Ла Сирена | Мягче | Ла Сирена «Мягче» → Ранчо Гранде: text calls it intense, «Плотное тело» |
| M | Колумбия Ла Сирена | Ярче | Ла Сирена «Ярче» → ИПА: «в остальном заметно другой» is wrong; they're siblings |
| M | Кения Найваша ПБ | Плотнее (in place of Ярче) | Найваша «Плотнее» → Чайна Альта, whose short is «легкого питкого кофе»; repeats Похожий's step |
| L | Колумбия Эль Пласэр ИПА | Похожий | ИПА «Похожий» → Воносалам; sibling Ла Сирена is now on the page, but only as «Легче» |
| L | Перу Пальма Реаль | Плотнее (in place of Мягче) | Пальма Реаль «Плотнее» → Бекеле repeats the step «Похожий» (Луна) already makes |
| L | Бразилия Ранчо Гранде | Мягче | Ранчо Гранде «Мягче» → Луна: «в остальном заметно другой» undersells a fair pick |
| L | Кения Кисии | Ярче | Кисии «Ярче» → Воносалам: brighter only on the scale |
| L | Индонезия Воносалам | Похожий · мягче | Воносалам «Похожий · мягче» → Кисии: «мягче» only on the scale |
| L | Колумбия Чайна Альта | Похожий | Чайна Альта «Похожий» → Гицумби: berry identity not shared (acceptable) |
| L | Колумбия Чайна Альта | Sold out | Чайна Альта sold-out → Гицумби (same) |
| L | Кения Найваша ПБ | Необычнее | Найваша «Необычнее» → Вуш-Вуш; Кисии (unusual Kenya) fits better |
| L | Вьетнам Куа Мон | Sold out | Куа Мон sold-out → Монте Верде: hand brew only, while Куа Мон is a milk coffee |

The 4 highs and the 2 Гицумби mediums are pairs left unchanged on purpose (they follow QQ's scales; Мерури is an open question for the roaster).

Checked: every line of `block-v4.md` against `texts.json`, by the same method as before; the model itself wasn't consulted. **Numbers:** every «X вместо Y» / «Та же …» figure and heading matches `scales`. **Shared notes:** every «тоже X» is a word both coffees' descriptors use, and no «у него ещё» item is shared. **Q-Berry:** it's offered nowhere; its own page leads with Q-Finch when sold out. **«но»:** gone everywhere. Lines the page doesn't show (the edge text after «in place of», the «Without caffeine» lines) were checked too; they're accurate.

## v3 → v4

Of the 18 v3 flags: **1 fixed**, **17 remain** (one of them lowered). **New: 2.**

### Fixed (1)

| Coffee | Move | Pick v3 → v4 | v3 → v4 |
|---|---|---|---|
| Колумбия Вуш-Вуш | Похожий · ярче | Кения Найваша ПБ → Кения Найваша ПБ | L → ok |

### Remain (17)

| Coffee | Move | Pick v3 → v4 | v3 → v4 |
|---|---|---|---|
| Колумбия Эль Пласэр ИПА | Похожий | Индонезия Воносалам → Индонезия Воносалам | M → L |
| Колумбия Эль Пласэр ИПА | Sold out | Индонезия Воносалам → Индонезия Воносалам | M → M |
| Колумбия Антиокия | Похожий | Индонезия Мерури → Индонезия Мерури | H → H |
| Колумбия Антиокия | Sold out | Индонезия Мерури → Индонезия Мерури | H → H |
| Индонезия Мерури | Похожий | Колумбия Антиокия → Колумбия Антиокия | H → H |
| Индонезия Мерури | Sold out | Колумбия Антиокия → Колумбия Антиокия | H → H |
| Бразилия Ранчо Гранде | Мягче | Уганда Луна (far) → Уганда Луна (far) | L → L |
| Кения Кисии | Ярче | Индонезия Воносалам → Индонезия Воносалам | L → L |
| Руанда Гицумби | Похожий | Колумбия Чайна Альта → Колумбия Чайна Альта | M → M |
| Руанда Гицумби | Sold out | Колумбия Чайна Альта → Колумбия Чайна Альта | M → M |
| Колумбия Ла Сирена | Мягче | Бразилия Ранчо Гранде → Бразилия Ранчо Гранде | M → M |
| Колумбия Ла Сирена | Ярче | Колумбия Эль Пласэр ИПА (far) → Колумбия Эль Пласэр ИПА (far) | M → M |
| Индонезия Воносалам | Похожий · мягче | Кения Кисии → Кения Кисии | L → L |
| Колумбия Чайна Альта | Похожий | Руанда Гицумби → Руанда Гицумби | L → L |
| Колумбия Чайна Альта | Sold out | Руанда Гицумби → Руанда Гицумби | L → L |
| Кения Найваша ПБ | Необычнее | Колумбия Вуш-Вуш → Колумбия Вуш-Вуш | L → L |
| Вьетнам Куа Мон | Sold out | Перу Монте Верде → Перу Монте Верде | L → L |

### New (2)

| Coffee | Move | Pick v3 → v4 | v3 → v4 |
|---|---|---|---|
| Перу Пальма Реаль | Плотнее (in place of Мягче) | edge → Эфиопия Бекеле | ok → L |
| Кения Найваша ПБ | Плотнее (in place of Ярче) | edge → Колумбия Чайна Альта | ok → M |

### The changes, judged

- **Q-Berry out.** The only v3 picks it held were Q-Finch's «Похожий» and sold-out lead. Both now go to Q-Profit, which is just as good (Санта Мария-based espresso blend, the same acidity and body, «тоже шоколад, орехи»). No other line changed because of it.
- **Replacement moves (7).** «Легче» works on all 5 pages:
  - Q-Optimistic and Q-Punch → Бекеле: a lighter cup that is still low in acidity, for milk and espresso.
  - Бекеле and Луна → Пальма Реаль: same low acidity, «питким телом».
  - ИПА → Ла Сирена: it finally puts the IPA's sibling on its page.
  «Плотнее» is the weak spot, on both of its pages, because on both the «Похожий» card already makes the same body +1 step with identical numbers:
  - Пальма Реаль → Бекеле: the same step as «Похожий» → Луна (low).
  - Найваша → Чайна Альта: the same step as «Похожий» → Гицумби, and the pick sells itself as «легкого питкого кофе» (medium).
  A rule that helps: a replacement must not repeat a step another card on the page already makes. When it would, join it to that card and use the place for «Тоже похожий». («Тоже похожий» and the other end of the unusual axis are used nowhere in v4.)
- **No «но».** The lines read as plain lists of differences, which is clearer.
- **Joined cards carry both numbers.** That fixes Вуш-Вуш «Похожий · ярче»; Воносалам and Куа Мон were already fine.
- **Page shows the move word and line only.** Edge sentences and the decaf line are off the page. The far picks' «в остальном заметно другой» still shows, and is still wrong on Ла Сирена → ИПА.

## Per coffee

Verdict: ok, or flag with severity (H/M/L). Lines not mentioned in «v3 → v4» are carried over from v3, re-read against v4's wording.

### Q-Optimistic

_Кислотность 1, плотность 5, фермент 0. Апельсиновые чипсы, Какао, Орехи. Молочные напитки, Основной эспрессо. «Классика кофейного вкуса в ее лучших проявлениях»_

| Move | Pick | Verdict | Why |
|---|---|---|---|
| Похожий | Q-Punch | ok | Both 60% Санта Мария plus robusta; «в обоих Бразилия Санта Мария» is true. |
| Легче (in place of Мягче) | Эфиопия Бекеле | ok | Makes sense: nothing at QQ is less acidic, so the other natural step from a body-5 robusta blend («густую структуру, пышное тело») is a lighter cup. Бекеле is the gentlest lighter coffee («без перегруза и излишней кислотности», acidity only 2 against 1), QQ recommends it for milk and espresso like Q-Optimistic, and it comes in espresso roast. (Its text says «Тело плотное», but body 3 against 5 is plainly lighter.) «тоже сушеный апельсин» matches «Апельсиновые чипсы». |
| Ярче | Q-Profit | ok | «в обоих Бразилия Санта Мария», «тоже орехи» are both true; Q-Profit «Профиль яркий». |
| Необычнее | Вьетнам Куа Мон (far) | ok | «более необычным профилем, чем классические базовые лоты»; espresso roast available; «тоже апельсин» matches «Апельсиновые чипсы». |
| Sold out | Q-Punch | ok | Same as «Похожий». |
| Decaf | Колумбия Декаф | ok | Only decaf QQ sells; labelled «Без кофеина»; its short «Хоть в капуч, хоть в фильтр, хоть ночью…» supports offering it on any page. |

### Q-Berry

_Кислотность 3, плотность 4, фермент 0. Сухофрукты, Чай, Шоколад, Ягоды. Молочные напитки, Основной эспрессо. «Авторская смесь (классическая основа с нотами ягод)»_

| Move | Pick | Verdict | Why |
|---|---|---|---|
| Похожий | Q-Finch (Финч бленд) | ok | Both Санта Мария + Ethiopian blends for milk/espresso; «тоже чай, шоколад» and «у него ещё орехи, цветы» are both correct. |
| Мягче | Эфиопия Бекеле | ok | «Для тех, кто не любит лишнюю кислотность». |
| Ярче | Руанда Гицумби | ok | «ягодным профилем», espresso roast available. |
| Необычнее | Вьетнам Куа Мон | ok | «более необычным профилем»; espresso roast available. |
| Sold out | Q-Finch (Финч бленд) | ok | As «Похожий». |
| Decaf | Колумбия Декаф | ok | Only decaf QQ sells; labelled «Без кофеина»; its short «Хоть в капуч, хоть в фильтр, хоть ночью…» supports offering it on any page. |

### Бразилия Санта Мария

_Кислотность 3, плотность 3, фермент 0. Молочный шоколад, Урбеч, Яблоко. Молочные напитки, Основной эспрессо. «Кофе с классическим и чистым вкусом»_

| Move | Pick | Verdict | Why |
|---|---|---|---|
| Похожий | Q-Profit | ok | «в нём 50% этого кофе» is true. |
| Мягче | Уганда Луна | ok | «тоже молочный шоколад» is exact; «мягкая сладость и округлое тело». |
| Ярче | Руанда Гицумби | ok | Brighter; espresso roast available. |
| Необычнее | Вьетнам Куа Мон | ok | Espresso roast available; «более необычным профилем». |
| Sold out | Q-Profit | ok | Half of it is this lot. |
| Decaf | Колумбия Декаф | ok | Only decaf QQ sells; labelled «Без кофеина»; its short «Хоть в капуч, хоть в фильтр, хоть ночью…» supports offering it on any page. |

### Колумбия Эль Пласэр ИПА

_Кислотность 4,5, плотность 4, фермент 2. Мандарин, Маракуйя, Хмель. Ручное заваривание. «India pale ale в вашей чашке»_

| Move | Pick | Verdict | Why |
|---|---|---|---|
| Похожий | Индонезия Воносалам | **flag L** | Lowered from medium: Колумбия Ла Сирена, its textual sibling («регионе Киндио», culturing, ferment 2), is now on the page as «Легче», so the shopper can reach it. «Похожий» itself is still Воносалам, another species («Эксельса», «natural mosto»), where Ла Сирена is nearer by text. |
| Мягче | Бразилия Ранчо Гранде | ok | Lower acidity and body, same ferment, also experimental. |
| Легче (in place of Ярче) | Колумбия Ла Сирена | ok | Makes sense, and it's the best change in v4. With nothing brighter than 4.5, a lighter cup at nearly the same acidity is a real alternative: body 2 against 4, Ла Сирена «достаточно деликатный и питкий». It's also the IPA's sibling (Киндио, culturing). No «в остальном заметно другой» on this side. |
| Классичнее | Руанда Гицумби | ok | Washed, ferment 0, «классической мытой Руанды». |
| Sold out | Индонезия Воносалам | **flag M** | Remains from v3. Колумбия Ла Сирена (same region and process) is the natural stand-in for a sold-out Colombian culturing lot. |
| Decaf | Колумбия Декаф | ok | Only decaf QQ sells; labelled «Без кофеина»; its short «Хоть в капуч, хоть в фильтр, хоть ночью…» supports offering it on any page. |

### Колумбия Антиокия

_Кислотность 3, плотность 3, фермент 0. Зеленое яблоко, Карамель, Цитрусы, Чай. Фильтр. «Базовый кофе из Южной Америки»_

| Move | Pick | Verdict | Why |
|---|---|---|---|
| Похожий | Индонезия Мерури | **flag H** | Remains from v3. Антиокия «яркую кислотность, чистый вкус», washed; Мерури «глубокий, насыщенный и пряный», wet-hull, «Табачный лист». They match only on the scales. As the first card, it's now the block's headline suggestion. |
| Мягче | Эфиопия Бекеле | ok | «без ... излишней кислотности». |
| Ярче | Колумбия Чайна Альта | ok | Washed Colombian, «тоже карамель». |
| Необычнее | Перу Монте Верде | ok | «нестандартные вкусы». |
| Sold out | Индонезия Мерури | **flag H** | Remains from v3. Same as «Похожий». |
| Decaf | Колумбия Декаф | ok | Its textual twin. |

### Q-Finch (Финч бленд)

_Кислотность 3, плотность 4, фермент 0. Молочный шоколад, Орехи, Сушеные ягоды, Цветы, Чай. Молочные напитки, Основной эспрессо. «Бразилия / Эфиопия в ваш бункер, всё по классике»_

| Move | Pick | Verdict | Why |
|---|---|---|---|
| Похожий | Q-Profit | ok | Changed because Q-Berry is out, and the new pick is good: the same acidity and body, «в обоих Бразилия Санта Мария», «тоже шоколад, орехи»; both blends for milk and espresso. (Q-Profit is «плотную ... выразительную», Q-Finch «Сочный, чистый, сбалансированный»; close enough.) |
| Мягче | Эфиопия Бекеле | ok | «тоже цветы» is exact. |
| Ярче | Руанда Гицумби | ok | Espresso roast available. |
| Необычнее | Вьетнам Куа Мон | ok | As before. |
| Sold out | Q-Profit | ok | As «Похожий»: a good stand-in for a Санта Мария-based espresso blend. |
| Decaf | Колумбия Декаф | ok | Only decaf QQ sells; labelled «Без кофеина»; its short «Хоть в капуч, хоть в фильтр, хоть ночью…» supports offering it on any page. |

### Колумбия Декаф

_Кислотность 3, плотность 3, фермент 0. Карамель, Сушеный банан, Цитрусы, Чай. Молочные напитки, Фильтр. «Хоть в капуч, хоть в фильтр, хоть ночью…»_

| Move | Pick | Verdict | Why |
|---|---|---|---|
| Похожий | Колумбия Антиокия | ok | The false «ещё ... чай» is gone. The textual twin (same varieties, «тоже карамель, цитрусы»); «с кофеином». |
| Мягче | Эфиопия Бекеле | ok | Marked «с кофеином». |
| Ярче | Руанда Гицумби | ok | «тоже карамель»; «с кофеином». |
| Необычнее | Вьетнам Куа Мон | ok | «с кофеином». |
| Sold out | Колумбия Антиокия | ok | With the new note below, leading with the caffeinated twin is honest and useful. |
| Sold out, note | — | ok | «Другого кофе без кофеина у QQ сейчас нет: ближе всего по вкусу — с кофеином.» True (one decaf in `texts.json`) and clear. |

### Индонезия Мерури

_Кислотность 3, плотность 3, фермент 0. Грейпфрут, Карамель, Табачный лист, Тропики. Фильтр. «Высокогорная классика Суматры»_

| Move | Pick | Verdict | Why |
|---|---|---|---|
| Похожий | Колумбия Антиокия | **flag H** | Remains from v3. «глубокий, насыщенный и пряный» against «яркую кислотность, чистый вкус». |
| Мягче | Эфиопия Бекеле | ok | As before. |
| Ярче | Колумбия Чайна Альта | ok | «тоже грейпфрут, карамель». |
| Необычнее | Перу Монте Верде | ok | «тоже тропики». |
| Sold out | Колумбия Антиокия | **flag H** | Remains from v3. Same as «Похожий». |
| Decaf | Колумбия Декаф | ok | Only decaf QQ sells; labelled «Без кофеина»; its short «Хоть в капуч, хоть в фильтр, хоть ночью…» supports offering it on any page. |

### Перу Пальма Реаль

_Кислотность 2, плотность 2, фермент 0. Желтые фрукты, Пралине, Шоколад. Фильтр. «Для спокойного утра дома»_

| Move | Pick | Verdict | Why |
|---|---|---|---|
| Похожий | Уганда Луна | ok | «понятный ... кофе на каждый день» in both texts; «тоже шоколад». |
| Плотнее (in place of Мягче) | Эфиопия Бекеле | **flag L** | New. «Плотнее» itself makes sense (Пальма is among the lightest, «питким телом»; Бекеле keeps the same low acidity, and its text says «Тело плотное»). But the page's «Похожий», Уганда Луна, takes the very same step (acidity 2, body 3 against 2, and the card says «плотность 3 вместо 2»). Луна and Бекеле have identical scales, so the shopper sees two cards making one move with nothing to tell them apart. Better: a joined «Похожий · плотнее» card on Луна, and the freed place for another direction (e.g. «Тоже похожий»). |
| Ярче | Эфиопия Гуджи | ok | Washed, same body, «яркой кислотностью». |
| Необычнее | Перу Монте Верде | ok | Peruvian natural, «хочу не как всегда». |
| Sold out | Уганда Луна | ok | As «Похожий». |
| Decaf | Колумбия Декаф | ok | Only decaf QQ sells; labelled «Без кофеина»; its short «Хоть в капуч, хоть в фильтр, хоть ночью…» supports offering it on any page. |

### Перу Монте Верде

_Кислотность 3, плотность 3, фермент 1. Крем-брюле, Сушеный апельсин, Тропики. Ручное заваривание. «Для момента «хочу не как всегда»»_

| Move | Pick | Verdict | Why |
|---|---|---|---|
| Похожий | Вьетнам Куа Мон | ok | Natural, «десертным характером», ferment 0.5; «тоже апельсин». |
| Мягче | Эфиопия Бекеле | ok | «тоже сушеный апельсин». |
| Ярче | Колумбия Вуш-Вуш | ok | Natural, ferment 1. |
| Необычнее | Бразилия Ранчо Гранде | ok | «ищет удивление». |
| Sold out | Вьетнам Куа Мон | ok | Now the same as «Похожий». |
| Decaf | Колумбия Декаф | ok | Only decaf QQ sells; labelled «Без кофеина»; its short «Хоть в капуч, хоть в фильтр, хоть ночью…» supports offering it on any page. |

### Руанда Ньяки

_Кислотность 3, плотность 2, фермент 0. Темные ягоды, Цедра цитрусов, Чай с бергамотом. Основной эспрессо, Фильтр. «Для тех, кто ценит стабильность»_

| Move | Pick | Verdict | Why |
|---|---|---|---|
| Похожий | Эфиопия Гуджи | ok | «тоже ягоды, чай» is correct; the texts match closely (second grinder, everyday filter). |
| Мягче | Эфиопия Бекеле | ok | As before. |
| Ярче | Кения Найваша ПБ | ok | Washed, berries. «тоже черный чай» matches Ньяки's «Чай с бергамотом» (Earl Grey-style black tea). Defensible, though «тоже чай» would be safer. |
| Необычнее | Вьетнам Куа Мон | ok | As before. |
| Sold out | Эфиопия Гуджи | ok | As «Похожий». |
| Decaf | Колумбия Декаф | ok | Only decaf QQ sells; labelled «Без кофеина»; its short «Хоть в капуч, хоть в фильтр, хоть ночью…» supports offering it on any page. |

### Эфиопия Бекеле

_Кислотность 2, плотность 3, фермент 0. Мед, Сушеный апельсин, Цветы. Молочные напитки, Основной эспрессо, Фильтр. «Для тех, кто не любит лишнюю кислотность»_

| Move | Pick | Verdict | Why |
|---|---|---|---|
| Похожий | Уганда Луна | ok | Both natural, «мягкая сладость», for milk and espresso. |
| Легче (in place of Мягче) | Перу Пальма Реаль | ok | Makes sense, and suits this coffee's buyer exactly: Бекеле is «Для тех, кто не любит лишнюю кислотность»; Пальма Реаль has the same low acidity, «без яркой кислотности», with «питким телом» (body 2 against 3). Filter and espresso roasts both available. |
| Ярче | Вьетнам Куа Мон | ok | «тоже апельсин». |
| Необычнее | Перу Монте Верде | ok | «тоже сушеный апельсин». |
| Sold out | Уганда Луна | ok | As «Похожий». |
| Decaf | Колумбия Декаф | ok | Only decaf QQ sells; labelled «Без кофеина»; its short «Хоть в капуч, хоть в фильтр, хоть ночью…» supports offering it on any page. |

### Q-Punch

_Кислотность 1, плотность 5, фермент 0. Песочное печенье, Сладкие специи, Цедра. Молочные напитки, Основной эспрессо. «Классический бленд под молоко»_

| Move | Pick | Verdict | Why |
|---|---|---|---|
| Похожий | Q-Optimistic | ok | «в обоих Бразилия Санта Мария». |
| Легче (in place of Мягче) | Эфиопия Бекеле | ok | Same reasoning as Q-Optimistic: a lighter (body 3 against 5), still low-acid coffee that QQ recommends for milk and espresso; espresso roast available. |
| Ярче | Q-Profit | ok | «в обоих Бразилия Санта Мария». |
| Необычнее | Вьетнам Куа Мон (far) | ok | Espresso roast available; recommended for milk. |
| Sold out | Q-Optimistic | ok | As «Похожий». |
| Decaf | Колумбия Декаф | ok | Only decaf QQ sells; labelled «Без кофеина»; its short «Хоть в капуч, хоть в фильтр, хоть ночью…» supports offering it on any page. |

### Уганда Луна

_Кислотность 2, плотность 3, фермент 0. Виноградная косточка, Молочный шоколад, Сухофрукты, Цитрусы. Молочные напитки, Основной эспрессо. «Для тех, кто ценит баланс»_

| Move | Pick | Verdict | Why |
|---|---|---|---|
| Похожий | Эфиопия Бекеле | ok | As before. |
| Легче (in place of Мягче) | Перу Пальма Реаль | ok | Makes sense: same acidity 2, lighter body, «понятный ... кофе на каждый день» in both texts; «тоже шоколад» is correct. |
| Ярче | Вьетнам Куа Мон | ok | As before. |
| Необычнее | Перу Монте Верде (second pick) | ok | As before. |
| Sold out | Эфиопия Бекеле | ok | As before. |
| Decaf | Колумбия Декаф | ok | Only decaf QQ sells; labelled «Без кофеина»; its short «Хоть в капуч, хоть в фильтр, хоть ночью…» supports offering it on any page. |

### Q-Profit

_Кислотность 3, плотность 4, фермент 0. Косточковые фрукты, Орехи, Цитрусы, Шоколад. Молочные напитки, Основной эспрессо. «Классика в новом прочтении»_

| Move | Pick | Verdict | Why |
|---|---|---|---|
| Похожий | Q-Finch (Финч бленд) | ok | «в обоих Бразилия Санта Мария», «тоже орехи, шоколад». |
| Мягче | Уганда Луна | ok | «тоже цитрусы, шоколад» is now true, and «виноградная косточка» is listed as Луна's own; «он есть в этой смеси (50%)». |
| Ярче | Руанда Гицумби | ok | Espresso roast available. |
| Необычнее | Вьетнам Куа Мон | ok | Espresso roast available. |
| Sold out | Q-Finch (Финч бленд) | ok | As «Похожий». |
| Decaf | Колумбия Декаф | ok | Only decaf QQ sells; labelled «Без кофеина»; its short «Хоть в капуч, хоть в фильтр, хоть ночью…» supports offering it on any page. |

### Эфиопия Гуджи

_Кислотность 3, плотность 2, фермент 0. Грейпфрут, Карамель, Чай, Ягоды. Основной эспрессо, Фильтр. «Для любителей классической Эфиопии»_

| Move | Pick | Verdict | Why |
|---|---|---|---|
| Похожий | Руанда Ньяки | ok | «тоже чай, ягоды»; texts match closely. |
| Мягче | Перу Пальма Реаль | ok | Washed, same body, «без яркой кислотности». |
| Ярче | Кения Найваша ПБ | ok | «тоже чай» is correct. |
| Необычнее | Перу Монте Верде | ok | As before. |
| Sold out | Руанда Ньяки | ok | As «Похожий». |
| Decaf | Колумбия Декаф | ok | Only decaf QQ sells; labelled «Без кофеина»; its short «Хоть в капуч, хоть в фильтр, хоть ночью…» supports offering it on any page. |

### Бразилия Ранчо Гранде

_Кислотность 3, плотность 3, фермент 2. Грейпфрут, Грильяж, Фруктовый ликер. Ручное заваривание, Фильтр. «Для тех, кто ищет удивление»_

| Move | Pick | Verdict | Why |
|---|---|---|---|
| Похожий | Кения Кисии | ok | The same words in both texts («легкие ферментированные оттенки»). |
| Мягче | Уганда Луна (far) | **flag L** | Remains from v3. The pick is fair (fruit and chocolate in both texts), but «в остальном заметно другой» undersells it. |
| Ярче | Колумбия Ла Сирена | ok | As before. |
| Классичнее | Индонезия Мерури | ok | Ferment 0, «Высокогорная классика Суматры», «тоже грейпфрут». |
| Sold out | Кения Кисии | ok | As «Похожий». |
| Decaf | Колумбия Декаф | ok | Only decaf QQ sells; labelled «Без кофеина»; its short «Хоть в капуч, хоть в фильтр, хоть ночью…» supports offering it on any page. |

### Кения Кисии

_Кислотность 3, плотность 3, фермент 3. Апельсин, Тропики, Ягодные леденцы. Ручное заваривание. «Для любителей сочных тропических чашек»_

| Move | Pick | Verdict | Why |
|---|---|---|---|
| Похожий | Бразилия Ранчо Гранде | ok | «легкие ферментированные оттенки» in both. |
| Мягче | Уганда Луна (far) | ok | Кисии's text says «насыщенную кислотность»; Луна «мягкая сладость». |
| Ярче | Индонезия Воносалам | **flag L** | Remains from v3. Only the scales make it brighter; Воносалам's text never mentions acidity, Кисии's says «насыщенную кислотность». |
| Классичнее | Индонезия Мерури | ok | Ferment 0, «классика», «тоже тропики». |
| Sold out | Бразилия Ранчо Гранде | ok | As «Похожий». |
| Decaf | Колумбия Декаф | ok | Only decaf QQ sells; labelled «Без кофеина»; its short «Хоть в капуч, хоть в фильтр, хоть ночью…» supports offering it on any page. |

### Руанда Гицумби

_Кислотность 4, плотность 3, фермент 0. Бергамот, Карамель, Малина, Смородина, Цедра апельсина. Фильтр. «Для любителей сочного ягодного кофе»_

| Move | Pick | Verdict | Why |
|---|---|---|---|
| Похожий | Колумбия Чайна Альта | **flag M** | Remains from v3. Гицумби «Для любителей сочного ягодного кофе»; Чайна Альта has no berries and is «легкого питкого». Руанда Ньяки (same country, Red Bourbon, washed, berries, bergamot) is still unused. As the first card, it's now the headline suggestion. |
| Мягче | Колумбия Антиокия | ok | «тоже карамель». |
| Ярче | Кения Найваша ПБ | ok | «тоже смородина, апельсин». |
| Необычнее | Колумбия Вуш-Вуш | ok | As before. |
| Sold out | Колумбия Чайна Альта | **flag M** | Remains from v3. Руанда Ньяки is the natural stand-in. |
| Decaf | Колумбия Декаф | ok | Only decaf QQ sells; labelled «Без кофеина»; its short «Хоть в капуч, хоть в фильтр, хоть ночью…» supports offering it on any page. |

### Колумбия Ла Сирена

_Кислотность 4, плотность 2, фермент 2. Земляничное варенье, Цитрусы, Черный чай. Ручное заваривание. «Ощущается как десерт к чаю»_

| Move | Pick | Verdict | Why |
|---|---|---|---|
| Похожий | Колумбия Вуш-Вуш | ok | Colombian, experimental, hand brew, same acidity and body. |
| Мягче | Бразилия Ранчо Гранде | **flag M** | Remains from v3. Ранчо Гранде «про интенсивность и глубину вкуса. Плотное тело» against Ла Сирена «деликатный и питкий». The scale rule passes it (body +1). Вьетнам Куа Мон (shared strawberry, «мягкая сладость») is the softer pick. |
| Ярче | Колумбия Эль Пласэр ИПА (far) | **flag M** | Remains from v3. «в остальном заметно другой» contradicts the texts; both are culturing lots from Киндио, ferment 2, hand brew. (ИПА is also the textual «Похожий» for Ла Сирена; see ИПА.) |
| Классичнее | Кения Найваша ПБ | ok | «классическим для Кении мытым способом»; «тоже черный чай» is exact. |
| Sold out | Колумбия Вуш-Вуш | ok | As «Похожий». |
| Decaf | Колумбия Декаф | ok | Only decaf QQ sells; labelled «Без кофеина»; its short «Хоть в капуч, хоть в фильтр, хоть ночью…» supports offering it on any page. |

### Индонезия Воносалам

_Кислотность 4, плотность 4, фермент 3. Апельсин, Виноград, Груша, Карамель, Лакрица. Ручное заваривание. «Знакомство с видом кофе эксцельса»_

| Move | Pick | Verdict | Why |
|---|---|---|---|
| Похожий · мягче | Кения Кисии | **flag L** | Remains from v3. «Похожий» is right (Кисии is the closest by process, and it now leads the label). «мягче» rests only on the scales: Кисии's text says «насыщенную кислотность», «с плотным телом». Body 3 against 4 is no longer stated on the card. |
| Мягче | same card as «Похожий» | ok | See the line above. |
| Ярче | Колумбия Эль Пласэр ИПА | ok | Fair as «Ярче». |
| Классичнее | Руанда Гицумби | ok | Washed, ferment 0, «классической мытой Руанды»; «тоже апельсин, карамель». |
| Sold out | Кения Кисии | ok | Closest by process. |
| Decaf | Колумбия Декаф | ok | Only decaf QQ sells; labelled «Без кофеина»; its short «Хоть в капуч, хоть в фильтр, хоть ночью…» supports offering it on any page. |

### Колумбия Вуш-Вуш

_Кислотность 4, плотность 2, фермент 1. Барбариски, Грушевый сидр, Дыня. Ручное заваривание. «Эксклюзив №1 в нашем ассортименте»_

| Move | Pick | Verdict | Why |
|---|---|---|---|
| Похожий · ярче | Кения Найваша ПБ | ok | The joined card now gives both labels a reason («кислотность 4,5 вместо 4» backs «ярче»). |
| Мягче | Вьетнам Куа Мон | ok | No longer labelled «под молоко», so the missing milk reason is moot. Lower acidity, «мягкая сладость». |
| Ярче | same card as «Похожий» | ok | See the line above. |
| Необычнее | Колумбия Ла Сирена | ok | As before. |
| Sold out | Кения Найваша ПБ | ok | Comparable bright, sweet, light-bodied cup. |
| Decaf | Колумбия Декаф | ok | Only decaf QQ sells; labelled «Без кофеина»; its short «Хоть в капуч, хоть в фильтр, хоть ночью…» supports offering it on any page. |

### Колумбия Чайна Альта

_Кислотность 4, плотность 3, фермент 0. Грейпфрут, Карамель, Цветы, Шиповник. Ручное заваривание. «Для любителей легкого питкого кофе»_

| Move | Pick | Verdict | Why |
|---|---|---|---|
| Похожий | Руанда Гицумби | **flag L** | Remains from v3. Гицумби's identity is berries («ягодного кофе»), which Чайна Альта lacks; acceptable since Антиокия is in «Мягче». |
| Мягче | Колумбия Антиокия | ok | Washed Colombian, «тоже карамель». |
| Ярче | Кения Найваша ПБ | ok | As before. |
| Необычнее | Колумбия Вуш-Вуш | ok | As before. |
| Sold out | Руанда Гицумби | **flag L** | Remains from v3. Same as «Похожий». |
| Decaf | Колумбия Декаф | ok | Only decaf QQ sells; labelled «Без кофеина»; its short «Хоть в капуч, хоть в фильтр, хоть ночью…» supports offering it on any page. |

### Кения Найваша ПБ

_Кислотность 4,5, плотность 2, фермент 0. Апельсин, Ежевика, Смородина, Черный чай. Ручное заваривание. «Для любителей сочнейшей Кении»_

| Move | Pick | Verdict | Why |
|---|---|---|---|
| Похожий | Руанда Гицумби | ok | Washed, berry-forward, «тоже апельсин, смородина». |
| Мягче | Руанда Ньяки | ok | Washed, berries and tea, «ненавязчивого фильтра». («тоже черный чай» against Ньяки's «Чай с бергамотом» is defensible.) |
| Плотнее (in place of Ярче) | Колумбия Чайна Альта | **flag M** | New. The label contradicts the pick's own short: Чайна Альта is «Для любителей легкого питкого кофе». A shopper who clicks «Плотнее» from Найваша lands on a page selling lightness. It's denser only on the scale (body 3 against 2), and the page's «Похожий», Руанда Гицумби, already makes the same step (body 3 against 2, acidity 4). Better: join it to the Гицумби card as «Похожий · плотнее» (Гицумби's text doesn't call it light), and use the freed place for another direction. |
| Необычнее | Колумбия Вуш-Вуш | **flag L** | Remains from v3. Кения Кисии («более насыщенную и современную интерпретацию кенийского кофе», the same SL28/Ruiru 11/Batian varieties) is the textual «unusual Kenya». |
| Sold out | Руанда Гицумби | ok | As «Похожий». |
| Decaf | Колумбия Декаф | ok | Only decaf QQ sells; labelled «Без кофеина»; its short «Хоть в капуч, хоть в фильтр, хоть ночью…» supports offering it on any page. |

### Вьетнам Куа Мон

_Кислотность 3, плотность 3, фермент 0,5. Апельсин, Земляника, Курага, Фундук. Молочные напитки, Фильтр. «Для знакомства с азиатским кофе»_

| Move | Pick | Verdict | Why |
|---|---|---|---|
| Похожий · необычнее | Перу Монте Верде | ok | Both natural, dessert-like, same acidity and body, ferment 1 against 0.5. Right for both labels, and the line gives both reasons («фермент 1 вместо 0,5»). |
| Мягче | Уганда Луна | ok | As before. |
| Ярче | Руанда Гицумби | ok | «тоже апельсин». |
| Необычнее | same card as «Похожий» | ok | See the line above. |
| Sold out | Перу Монте Верде | **flag L** | Remains from v3. Монте Верде is filter-roast and hand-brew only, while QQ recommends Куа Мон for milk. With «Под молоко» gone from the page, this matters less, but a milk buyer's sold-out page still leads with a hand-brew lot. Уганда Луна (milk, both roasts) keeps the use. |
| Decaf | Колумбия Декаф | ok | Only decaf QQ sells; labelled «Без кофеина»; its short «Хоть в капуч, хоть в фильтр, хоть ночью…» supports offering it on any page. |

## Suggested fixes, most important first

1. **Антиокия ↔ Мерури** (4 H): settle with the roaster. Meanwhile point Мерури's «Похожий» at Вьетнам Куа Мон (Asian highland, «плотный, насыщенный вкус») and Антиокия's at Колумбия Чайна Альта (washed, same varieties).
2. **Найваша «Плотнее»** (M, new): join it to the Гицумби card («Похожий · плотнее»), or skip it; don't point «Плотнее» at a coffee sold as «легкого питкого».
3. **ИПА sold-out lead and «Похожий» → Колумбия Ла Сирена** (M + L): it's already on the page as «Легче».
4. **Гицумби «Похожий»/sold-out → Руанда Ньяки** (2 M, kept on purpose so far).
5. **Ла Сирена:** «Мягче» → Вьетнам Куа Мон; drop «в остальном заметно другой» from its ИПА card (2 M).
6. **Пальма Реаль «Плотнее»** (L, new): join it to Луна's card.
7. Smaller (L): Найваша «Необычнее» → Кения Кисии; Куа Мон sold-out → Уганда Луна; drop «в остальном заметно другой» from Ранчо Гранде → Луна.
