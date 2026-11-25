# Outside check: is every result of the catalogue's choice sensible?

Checked cold on 24 Nov 2026 against `docs/choose-output.md` (branch `claude/catalogue-filters`, 25 coffees, nothing
sold out), QQ's own words (`data/products.csv`, `src/data/products.json`), the taste model (`src/data/taste.json`:
the flavour shares behind the taste groups) and `data/choose.json`. Each result: **OK**, **questionable** or **wrong**,
with severity: **high** (a visitor would buy the wrong thing or be misled), **medium**, **low**.

## Count

88 results judged: 8 methods, 4 chips, 3 acidity levels, 7 taste groups, 2 + 2 + 9 + 8 secondary options, 9 map
regions, 4 chips alone with their «Почти», 32 method × chip combinations.

| | High | Medium | Low | Total |
|---|---|---|---|---|
| Wrong | 4 | 0 | 0 | 4 |
| Questionable | 0 | 11 | 10 | 21 |
| OK | | | | 63 |

Two causes explain most of the wrong and questionable results: the taste groups' threshold (§ A) and the decaf's
roast (§ B).

## Wrong and questionable

### A. Taste groups: a four-note coffee is in no group at all

The rule: a coffee is in a group when the group's families make up ≥ 0.3 of its flavour profile. A coffee with four
descriptors has about 0.25 per family, so it misses every group unless two of its notes fall in the same one. **Six
coffees are in no taste group:** Q-Berry, Колумбия Антиокия, Колумбия Декаф, Индонезия Мерури, Эфиопия Гуджи, Вьетнам
Куа Мон. Whether a coffee is «ягодный» depends on how many other notes it has, not on the note: Кения Кисии's «Апельсин»
(one of 3 notes) puts it in «Цитрусы», Кения Найваша's «Апельсин» (one of 4) does not.

| Result | Verdict | Severity | Why |
|---|---|---|---|
| Ягоды (3: Ньяки, Гицумби, Найваша) | **wrong** | high | **Q-Berry**, named for its berries and with «Ягоды» among its four notes (0.25), is not in it. Neither are Колумбия Ла Сирена («Земляничное варенье», 0.23), Эфиопия Гуджи («Ягоды»), Вьетнам Куа Мон (QQ: «Куа Мон в переводе с вьетнамского означает «ягодный»»), Кения Кисии («Ягодные леденцы»), Q-Finch («Сушеные ягоды»). A visitor who ticks «Ягоды» gets Q-Berry under «Остальные». |
| Шоколад и орехи (5) | questionable | medium | Leaves out Q-Berry («Шоколад»), Уганда Луна («Молочный шоколад»), Вьетнам Куа Мон («Фундук»): 0.25 each. |
| Карамель и мёд (3) | questionable | medium | Seven coffees with «Карамель» among their notes are out: Антиокия, Декаф, Мерури, Гуджи, Гицумби, Воносалам, Чайна Альта. Q-Punch is in through «Песочное печенье». |
| Цитрусы (7) | questionable | medium | Q-Punch is in through «Цедра», while Найваша, Воносалам, Куа Мон («Апельсин»), Мерури, Гуджи, Чайна Альта («Грейпфрут»), Антиокия, Декаф, Луна, Q-Profit («Цитрусы») are out. |
| Чай и цветы (4) | questionable | medium | Leaves out Ньяки («Чай с бергамотом», 0.23), Найваша («Черный чай»), Гуджи, Антиокия, Декаф, Q-Berry («Чай»). |
| Фрукты (8) | questionable | low | Leaves out Q-Berry («Сухофрукты»), Q-Profit («Косточковые фрукты»), Мерури («Тропики»), Куа Мон («Курага»). Fewer misses than the others, because three families add up. |
| Ликёр и специи (3) | questionable | low | Leaves out Мерури («Табачный лист», spice 0.25) and Воносалам («Лакрица», 0.2). The three it finds are right. |

Fix: count a coffee in a group when any one of its descriptors belongs there. Or lower `share` to 0.2 and check that
no group fills up (Цитрусы would take 17). Make the build fail if a coffee with descriptors lands in no group, and
check Q-Berry ∈ Ягоды as a fixed case.

### B. The decaf is sold as «Омни», but the site treats it as espresso-only

QQ's Notion row for Колумбия Декаф: «Обжарка: Эспрессо • Средняя [Омни]», «Обжарка в прайсе: Омни», «Применение: …,
Фильтр». `products.json` keeps only «Эспрессо», so the three filter methods leave out the only decaf, and its card says
«Обжариваем только под эспрессо». That contradicts QQ's own price list.

| Result | Verdict | Severity | Why |
|---|---|---|---|
| Воронка или дрип-пакет (18) | **wrong** | high | No decaf for the most common home method (64 of 106 respondents). The decaf's «Почти» line «обжариваем только под эспрессо» is untrue by QQ's price list. |
| Капельная кофеварка (18) | **wrong** | high | Same. |
| Аэропресс (18) | **wrong** | high | Same. An AeroPress also takes an omni or espresso roast well. |

Fix: carry «Омни» into the data as a roast that fits both (`methodFit`: Омни fits «Эспрессо» and «Фильтр»), and have
the card say «Омни». Or ask QQ, and until then don't make the decaf a roast miss for filter methods.

### C. Methods

| Result | Verdict | Severity | Why |
|---|---|---|---|
| Гейзерная кофеварка: Эспрессо · в зёрнах (19) | questionable | medium | The roast is right (an espresso or medium roast suits a moka pot). Whole beans by default means a visitor without a grinder who taps «В корзину» on a card gets beans; the line on the card says so only in small capitals. The usual advice where no moka grind is sold is the espresso grind or slightly coarser. Default to «помол для эспрессо» and say «или зерно, если мелете сами», until QQ answers the `asks`. |
| Френч-пресс: любая, prefer фильтр · в зёрнах (25) | questionable | medium | Any roast is right for a French press. The grind has the same problem as the moka pot: without a grinder the visitor gets beans. QQ's filter grind is finer than ideal but works (and it is what most of the survey's «в кружке/термосе» people use). Default to «помол для фильтра» with the note. |

### D. Chips and their «Почти»

| Result | Verdict | Severity | Why |
|---|---|---|---|
| Без яркой кислотности (5: acidity ≤ 2) | questionable | medium | The site's own acidity scale calls 4–5 «яркая» and 3 «средняя», so «без яркой» promises acidity ≤ 3. The rule is ≤ 2, which leaves out the chocolate espresso coffees a barista would hand to someone avoiding sourness (Санта Мария, Q-Berry, Q-Finch, Q-Profit, Декаф: all 3). It finds exactly the same 5 as «Кислотность: мягкая». Rename it («Мягкая кислотность», «Почти без кислинки»), or keep the name and give it its own rule (e.g. acidity ≤ 3 and density ≥ 3). |
| На каждый день (12) | questionable | low | The 12 are sensible: Classic, no ferment, acidity ≤ 3. Leaving out the decaf on principle is odd (decaf drinkers drink it every day), and its «Почти» line reads «Без кофеина», as if that were a flaw. Drop `decaf: false`, or word the miss «без кофеина — если пьёте с кофеином». |
| Под молоко alone, «Почти» | questionable | low | Антиокия and Гуджи are good near misses (espresso roast; Гуджи is QQ's «Основной эспрессо»). Перу Монте Верде is not: it is filter-only, «Ручное заваривание», a light Special. Руанда Ньяки («Основной эспрессо») would be nearer in use. The miss «QQ не советует его под молоко» reads as «QQ advises against it». Say «QQ не указывает его для молока». |
| На каждый день alone, «Почти» (Декаф «без кофеина») | questionable | low | See «На каждый день». |
| Автоматическая / Рожковая / Гейзерная + Необычное: «Почти» | questionable | medium (×3) | Matches (Кисии, Воносалам) are right. The near misses are Куа Мон «фермент 0,5», Мерури «фермент 0» and **Уганда Луна «фермент 0»**: an ordinary Ugandan natural offered as «almost unusual». «Фермент 0» doesn't say what's missing. This happens because taste misses always rank before roast misses. Эль Пласэр ИПА, Ранчо Гранде and Ла Сирена (unusual, filter roast only) are the honest near misses for an espresso visitor: «обжариваем только под фильтр». Fix: offer a chip miss only while its `nearOf` ≤ 1; past that, the method misses come first. |
| Воронка / Капельная / Аэропресс + Под молоко (3: Бекеле, Луна, Куа Мон, filter roast) | questionable | low (×3) | QQ's milk advice is about espresso drinks: the chip's own «why» is «для капучино и латте». Уганда Луна's «Применение» is milk and espresso, not filter. A filter roast with milk is a fair answer to an odd question, but the «why» shouldn't promise a latte. Word the match line «фильтр с молоком» for filter methods. |

### E. Secondary filters

| Result | Verdict | Severity | Why |
|---|---|---|---|
| Страна: Вьетнам (3: Q-Optimistic, Q-Punch, Куа Мон) | questionable | low | QQ's texts say the blends' robusta is Vietnamese («с Вьетнамской робустой»), but the lot in «Состав смеси» is «Уганда Робуста 18». One of the two is wrong. A question for QQ, not for this branch. |
| Страна: Уганда (2: Луна, Q-Profit) | questionable | low | Same: if the lot name is right, Q-Optimistic and Q-Punch belong here. |
| Обработка: Декаф (1) | questionable | medium | Correct as a result, but it is the **only** way to find a decaf: under «Ещё фильтры → Обработка», among processing methods. No chip, no «без кофеина» option; the map's ring is the one other sign. A decaf drinker is a common visitor. Add «Без кофеина» as an option of «Тип» (or a chip). |

## OK

| Result | Finds | Note |
|---|---|---|
| Автоматическая кофемашина: эспрессо · в зёрнах | 19 | an automatic machine grinds itself; espresso roast is right |
| Рожковая кофемашина: эспрессо · для эспрессо | 19 | right; ground coffee for a home espresso machine is QQ's call, and the card says it |
| Турка: любая (эспрессо if both) · для турки | 25 | any roast works in a turka; QQ sells a turka grind |
| Под молоко | 10 | exactly QQ's «Молочные напитки»; robusta blends, Бекеле, Куа Мон, the decaf: all as QQ says |
| Необычное | 5 | the culturing, anaerobic and semi-anaerobic lots |
| Необычное alone, «Почти»: Вуш-Вуш, Монте Верде, Куа Мон | 3 | really the next most unusual (natural, ferment 1 / 0,5) |
| Без яркой кислотности alone, «Почти»: Куа Мон, Декаф, Q-Finch (кислотность 3) | 3 | one step away |
| На каждый день alone, «Почти»: Мерури (Special), Гицумби (кислотность 4) | 2 of 3 | near and well worded |
| Кислотность: мягкая 1–2 / средняя 3 / яркая 4–5 | 5 / 13 / 7 | QQ's coded values; every coffee in exactly one |
| Тип: моносорт / смесь | 20 / 5 | |
| Линейка: Classic / Special | 14 / 11 | |
| Страна: Бразилия, Индонезия, Кения, Колумбия, Перу, Руанда, Эфиопия | 7, 2, 2, 7, 2, 3, 4 | blends counted under each origin of their lots |
| Обработка: Анаэробная, Вэт-халл, Культуринг, Мытая, Натуральная, Полуанаэробная, Хани | 2, 1, 2, 8, 9, 1, 1 | QQ's «Обработка»; blends have none and match none |
| Map regions (all nine) | 2/3/2/2/8/2/1/2/3 | each coffee by QQ's coded acidity and density; the dense blends top left, the bright light Colombians and Kenya bottom right, as a barista would place them |
| Автоматическая, Рожковая, Гейзерная + Под молоко | 10 each | all have an espresso roast; «Почти» Антиокия, Гуджи, Мерури are espresso-roasted near misses |
| Турка, Френч-пресс + Под молоко | 10 each | |
| Автоматическая, Рожковая, Гейзерная, Турка, Френч-пресс + Без яркой кислотности | 5 each | all five are sold in the espresso roast too |
| Воронка, Капельная, Аэропресс + Без яркой кислотности | 3 each | Пальма Реаль, Бекеле, Луна: all sold in filter roast; Q-Optimistic and Q-Punch rightly drop out |
| Автоматическая, Рожковая, Гейзерная, Турка, Френч-пресс + На каждый день | 12 each | |
| Воронка, Капельная, Аэропресс + На каждый день | 6 each | the six Classic lots sold in filter roast; «Почти» Мерури, Гицумби, Куа Мон are near |
| Турка, Френч-пресс + Необычное | 5 each | |
| Воронка, Капельная, Аэропресс + Необычное | 5 each | all five unusual lots are sold in filter roast |

## The survey's methods → chips (`docs/choose-check/survey.md`)

Every method named in the survey has a chip, and none goes to a wrong one. Capsules and concentrates are rightly left
without a chip: QQ sells neither, and every respondent who named them also named another method. Small points, all
low:

- **Сифон** goes to «Воронка или дрип-пакет». The roast and grind are right, but the chip's text lists «V60, кемекс,
  клевер, дрип-пакет» and not the siphon, so a siphon owner may not see it is meant for them. Add «сифон» to the
  method's `why`.
- **Вьетнамская воронка (пхин)** goes to «Френч-пресс». This is defensible: both brew by steeping, any roast, coarse
  grind. A phin wants a medium grind and usually a darker roast, so «Турка» or espresso roast would serve it as well.
  Fine for 2 respondents.
- **«Кофейник на плите»** goes to «Гейзерная». It could also mean a percolator or a plain pot (closer to the French
  press). It is ambiguous, but «гейзер» is the likelier reading.
- **«Кофемашина», type not said** (20) goes to both machine chips. They find the same 19 coffees but set different
  grinds (beans vs espresso grind). A visitor who picks the wrong one gets the wrong grind in the bag. The card shows
  the grind, so this is low.
- **Melitta** is both a drip-machine brand and a pour-over cone. Either chip gives the same filter roast and grind, so
  nothing goes wrong.

## After the check (what changed, 24 Nov)

Every wrong result and every medium point was acted on; `docs/choose-output.md` is the list after the changes.
- **A, taste groups (wrong, high):** a coffee is in a group from 0.15 of its profile (one note of up to six). Every
  coffee is in a group now, Q-Berry in «Ягоды»; the build fails if a coffee with descriptors lands in none. Ягоды 9,
  Карамель и мёд 11, Шоколад и орехи 8, Чай и цветы 10, Фрукты 14, Ликёр и специи 6, Цитрусы 20 (QQ lists citrus
  almost everywhere: the count says so honestly).
- **B, the decaf's omni roast (wrong, high ×3):** build/choose.mjs reads «Обжарка в прайсе» («Омни»); an omni coffee fits
  the filter methods too (19 each), and its card says «Омни-обжарка · помол для фильтра».
- **C, moka pot and French press grinds (medium):** kept «в зёрнах» (QQ sells no such grind, and which grind to advise is
  QQ's call: question `grinds-moka-press` for Tim). The chosen method's line now says it under the cells: «Отдельного
  помола для гейзера у QQ нет: берите зерно.»
- **D, «Без яркой кислотности» (medium):** renamed «Мягкая кислотность» (rule unchanged, acidity ≤ 2).
- **D, near misses for espresso + «Необычное» (medium ×3):** a taste miss more than a step away now ranks after a roast
  miss; the near misses are Ранчо Гранде, Эль Пласэр ИПА, Ла Сирена, «обжариваем только под фильтр».
- **D, «На каждый день» (low):** the decaf is in it (13). **«Под молоко»'s miss (low):** «не отмечен у QQ для молока».
- **E, decaf only under processing (medium):** «Ещё фильтры» has «Кофеин: с кофеином / без кофеина».
- **Survey (low):** the siphon is named in the pour-over method's line.
- Not changed: the blends' robusta origin (Вьетнам / Уганда) is QQ's data question, already in `docs/notion-fixes.md`;
  filter methods + «Под молоко» keep QQ's milk tag as it is.
