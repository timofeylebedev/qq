# QQ quiz «Выбрать кофе за минуту»: second round against 106 survey respondents

The final results (`final-1.json` … `final-4.json`) were judged for the codings as given. A rerun of all four codings files matches the final files exactly. Answers are written method / milk / now / taste. Per-respondent verdicts are in `respondents.json`.

## Totals

| | fits | questionable | misfit |
|---|---|---|---|
| First round (judged-1…4) | 86 | 14 | 6 |
| Final | **98** | **6** | **2** |

- 4 of 6 misfits are fixed (29, 35, 37, 75). 2 are unchanged (17, 102).
- 10 of 14 questionables are now fits. 3 are unchanged (14, 93, 94) and 1 is better but still questionable (25).
- 2 results got worse, fits → questionable (50, 87). Both come from the new rules.

## Every respondent not `fits` in either round

| id | answers | before | after | why |
|---|---|---|---|---|
| 5 | moka / yes / shop / caramel | questionable | fits | Q-Berry now comes first with a true reason. All three are milk-tagged, and there is no «мягче, чем вы описали» clash any more. |
| 14 | drip / no / shop / choc | questionable | questionable | No change. Уганда Луна is a fair start, but the decaf they liked is never offered, and fermented Монте Верде is a poor fit for «с недоверием к новому». |
| 15 | auto / yes / cafe / caramel | questionable | fits | The not-for-milk Гицумби is gone: Q-Berry, Бекеле and Куа Мон are all milk coffees. The coding is still a risk: they buy only ground coffee, so the machine is probably a рожковая. |
| 17 | moka / yes / shop / choc | misfit | **misfit** | No change. «Декаф, у вас он самый вкусный», and the quiz never shows Колумбия Декаф. |
| 22 | auto / yes / special / caramel | questionable | fits | Q-Berry, a dense milk blend, now comes first, and all three suit milk and sugar. |
| 25 | pourover / yes / special / caramel | questionable | questionable | Better: all three are now milk-tagged. But they asked for «Темная» and get filter roasts, and they get ground coffee although they use ready-made drip bags. |
| 29 | espresso / yes / shop / caramel | misfit | fits | Q-Berry has no robusta and the reason is true. It replaces Q-Punch, whose card contradicted itself. |
| 30 | pourover / yes / special / bright | questionable | fits | Гицумби and Найваша now answer «люблю кислинку» and are honestly marked as not for milk. Куа Мон is the milk-friendly step. |
| 35 | moka / yes / shop / caramel | misfit | fits | Q-Berry (berries, chocolate) comes first instead of Q-Punch, with no contradiction. |
| 37 | turka / yes / shop / caramel | misfit | fits | Q-Berry comes first, ground for the turka, with a true reason. |
| 39 | turka / no / special / choc | questionable | fits | Espresso-roast Луна comes first, then a denser Q-Berry. The summary no longer says «лёгкого» to someone who brews in a turka because it is «самый насыщенный». |
| 50 | espresso / some / shop / dunno | fits | questionable | **Worse.** «Три разных кофе» are now Q-Optimistic and Q-Punch, both labelled «Мягкий и плотный», plus Q-Finch. The softer option (Бекеле) was dropped. |
| 62 | pourover / yes / shop / caramel | questionable | fits | Монте Верде is gone: it was a Peru (they said «перу точно не нравится») and not for milk. All three are now milk-tagged. |
| 70 | auto / yes / special / choc | questionable | fits | Dense Q-Optimistic now comes first for a dark-roast drinker who takes milk and sugar. |
| 72 | moka / yes / special / dunno | questionable | fits | The three different coffees are now all milk-tagged, and dense Q-Finch covers «более крепкий». |
| 75 | turka / yes / shop / caramel | misfit | fits | Q-Berry comes first with a true reason, ground for the turka. |
| 76 | pourover / no / special / wild | questionable | fits | Ла Сирена and Кисии keep the set unusual and bright, as «необычными, яркими» asked. |
| 78 | moka / no / special / choc | questionable | fits | Espresso-roast Луна comes first, with denser Q-Berry. The summary no longer says «лёгкого». |
| 87 | turka / some / special / bright | fits | questionable | **Worse (wording).** Куа Мон's card says «Необычнее первого: с ферментацией», but its own taste line names no fermentation (ferment 0.5). |
| 93 | pourover / yes / special / wild | questionable | questionable | No change. All three cards say «Но QQ не советует его для молока» to someone who drinks with milk and spices. |
| 94 | pourover / no / shop / caramel | questionable | questionable | No change. A supermarket robusta drinker starts on Мерури (grapefruit, tobacco), with Чайна Альта (acidity 4) as an option, and gets ground coffee for ready-made drip bags. |
| 102 | press / yes / instant / choc | misfit | **misfit** | Robusta is now stated on the card. But the result is still beans only («крупного помола у QQ пока нет») for someone without a grinder, and it leads with robusta Q-Optimistic although she dislikes robusta. |

## What is left, by cause

### Quiz rules
- **Three different coffees on the shop path (50; it also happens for auto / some / shop / dunno and moka / yes / shop / dunno).** The dense-and-milk spread takes Q-Optimistic and Q-Punch. Both are acidity 1, density 5, robusta blends with the same label. This is a new regression.
- **«Необычнее» is given on a ferment of 0.5 (87).** Куа Мон counts as «с ферментацией», but the taste line only says fermentation from 1 up. This is a new regression.
- **Wild with milk (93).** No unusual coffee is milk-tagged, so all three cards carry the same warning. The suggested milk-friendly slot was not added. The new «Классичнее» Мерури is not for milk either.
- **Shop + filter + caramel (94).** The first coffee is Мерури, and Чайна Альта (acidity 4) is the «Ярче». The shop path is still steep for filter brewers. On espresso methods it got the gentle Q-Berry treatment.
- **Press means beans only (102).** It does not matter whether the person has a grinder.

### Coding
- **102:** capsules at home and steeping in a mug are not quiz options, so `press` was a guess. Coded `turka`, the same picks come «помол для турки», which would work for her. The robusta first pick stays either way.
- **15, 88:** «кофемашина» with ground coffee and no grinder was coded auto, so the quiz sends beans. A real visitor would probably pick «Рожковая» and get «помол для эспрессо». The result fits the coding.
- **25:** caramel is a compromise between «Темная» and fruity/berry notes.

### Limits of QQ's range or of the questions
- **No decaf answer (17, 14).** Decaf is never shown and never mentioned.
- **No dark-roast answer (25).** The choc option does not say «тёмная обжарка», and filter brewers always get the filter roast.
- **Ready-made drip bags (25, 94; 27, 62, 66 among the fits).** QQ's drip bags are «скоро», so these people get 250 g of ground coffee for filter. The set line does not say that this needs a funnel or bags they fill themselves.
- **No coarse grind (102, and every press user).** Moka users also get beans only («помола для гейзера у QQ пока нет»). Everyone in this sample who brews moka owns a grinder or a bean machine, so no one here was hurt by it.

## Words check (every `why`, `taste`, `but`, `set` and summary on the 318 cards)
- True everywhere:
  - Every taste line matches the acidity, density and ferment in `coffees.md`.
  - Robusta is stated only on Q-Optimistic and Q-Punch, the two blends that contain it.
  - «QQ советует его для капучино и латте» appears only on milk-tagged coffees, and «не советует его для молока» only on untagged ones.
  - «похож на кофе из магазина» appears only with now = shop.
  - Every «Мягче / Ярче / Плотнее / Легче / Классичнее» agrees with the coded values against the first coffee.
  - The set lines now say «или в зёрнах, если мелете сами» for filter, espresso and turka.
  - The first round's clashes are all gone: «как вы хотели» together with «мягче, чем вы описали», the summary «сбалансированного» for wild, and the shop reason for instant.
- Still wrong or awkward:
  1. **87:** Куа Мон «Необычнее первого: с ферментацией» is not supported by its own taste line. This is the only comparison in 106 results that its card does not back up.
  2. **50 and the same shop spreads:** two cards labelled «Мягкий и плотный» under «три разных кофе».
  3. **Summary vs card:** «Начните с яркого кофе: вы пьёте с молоком…» is followed by a first card that says «Но QQ не советует его для молока» (30, 93). The summary gives milk as a reason, and the card denies it.
  4. **Q-Optimistic first, 12 results:** the summary says «мягкого и плотного кофе», and the card says «Смесь с робустой: крепче и с горчинкой». «Мягкий» means low acidity here, but it reads against «с горчинкой».
  5. **Уганда Луна:** «карамель и фрукты, как вы хотели: виноградная косточка, сухофрукты» (52, 62). Grape seed is not a fruit note, so cite «сухофрукты» only.
  6. **Mixed roast within one set, unexplained:** 104 has Вуш-Вуш in filter roast in a turka set that is otherwise espresso roast. 102 has Луна in filter roast in a press set that is otherwise espresso roast.

## Suggestions
1. **Fix the shop spread:** never put two coffees with the same label, or the same acidity and density, into a «три разных» set. On the shop path use Q-Optimistic, then Бекеле or Q-Berry, then Q-Finch.
2. **Fermentation threshold:** give «Необычнее: с ферментацией» only when ferment ≥ 1, the same threshold the taste line uses. Otherwise label the step by its real difference («Ярче» or «Легче»).
3. **Milk plus a taste with no milk coffees (bright, wild):** say «не для молока» once in the summary instead of naming milk as a reason. For wild, put the milk-tagged Куа Мон in one slot.
4. **Decaf and drip bags:** add a line under the result, «Нужен без кофеина? Колумбия Декаф», for every milk, moka or machine answer. For «Воронка или дрип-пакет» with no grinder, say «молотый для воронки или пакетов, которые наполняете сами; готовые дрипы скоро».
5. **Press and robusta:** for press, offer «помол для турки — настаивайте дольше» next to beans. When now = instant, consider starting with Q-Profit or Q-Berry (no robusta) and keeping Q-Optimistic second. Respondent 102 rejects robusta, and the quiz has no way to ask about it.
