# The taste model's outside check (23 Nov 2026)

No roaster was available, so QQ's own words were the judge. Two agents that had not seen the model read only each
coffee's «Краткое описание» and «О сорте». They didn't see the scales, the descriptors or the model. For 7 coffees
each judge ranked the 5 closest of the other 24 and named one brighter and one softer step. Their answers are in
`docs/taste-check/judge-A.json` and `judge-B.json`, and the verdict for each coffee (in Russian, as the bench shows it)
is in `findings.json`. The model was built first; the judges' answers were opened only after its first version was
frozen.

The targets cover the map: a robusta milk blend (Q-Punch), the classic Brazil (Санта Мария), the coffee that is
identical to it on all four scales but not in flavour (Мерури), a soft natural (Бекеле), a middle washed (Ньяки), the
brightest (Найваша) and a co-fermented one (Ла Сирена).

## Numbers

| | Closest 5, in common | Brighter, same pick | Softer, same pick |
|---|---|---|---|
| Judge A vs judge B | 4.4 of 5 | 3 of 7 | 6 of 7 |
| Model vs a judge | 2.4 of 5 | 1.5 of 7 | 2 of 7 |

- 74% of the judges' closest picks are in the model's top 10 of 24 (median rank 6). Their first picks match the
  model's first for 4 of 7 coffees (Q-Punch, Бекеле, Найваша, Ла Сирена).
- **The judges agreeing with each other doesn't make them right.** They are two readings of the same text, by the
  same kind of reader, and the texts mostly describe the farm and the process, not the cup.
- **10 of the judges' 28 brighter/softer picks contradict QQ's own acidity scale.** For example, they call Пальма
  Реаль "brighter" than Мерури, but QQ codes it 2 against 3. A step in the model has to be a step on QQ's scale.
- Weight sensitivity: across flavour weights 1–3, process 0–1 and acidity 0.6–1, agreement stays between 2.1 and 2.9
  of 5. No setting comes close to the judges' 4.4, because the judges don't see the scales. The model was not fitted
  to them.

## What the check changed

1. **Decaf as an alternative.** Колумбия Декаф was a neighbour or a "brighter" step for four caffeinated coffees. The
   judges never picked it (its text says nothing about the cup), and the real fault was elsewhere: decaf is a need,
   not a taste. It is now never offered for a coffee with caffeine, and the build fails if it is.
2. **Processing.** Both judges said they leaned on washed vs natural, and four of Бекеле's five closest by the judges are
   naturals (the fifth, Q-Berry, is mostly natural). QQ's four scales don't encode processing, so it is now a hidden term worth 0.6 of an acidity point.
   Agreement went from 2.1 to 2.3 (2.4 with the decaf fix). It is not weighted more, because the texts are mostly about processing, so a
   text-reading judge leans on it more than a palate would.
3. **Far neighbours are marked.** Q-Punch has one real neighbour (Q-Optimistic). Everything after it is more than 1.6
   away, and the output now says so instead of presenting it as close.

## What stands, and why

| Coffee | Disagreement | Why the model keeps its answer |
|---|---|---|
| Q-Punch | Judges: Санта Мария, Пальма Реаль next; model: coffees at acidity 2–3 | Санта Мария is 60% of Q-Punch, but QQ codes it 3/3 against 1/5. The judges didn't see that. All of these are "far" anyway |
| Санта Мария | Judges: Пальма Реаль first (model #11), Q-Punch/Q-Optimistic (#18–19) | Пальма Реаль is a point softer and lighter on QQ's scales. The robusta blends are two points off on both |
| Санта Мария | Brighter: Антиокия / Q-Finch; softer: Q-Punch | Антиокия and Q-Finch are at the same acidity, 3, so neither is a step. Q-Punch is two steps down, and the nearest single step is Луна (2) |
| Мерури | Judges: Q-Punch, Q-Optimistic, Ранчо Гранде; "brighter: Пальма Реаль"; "nothing softer" | The text says deep, spicy, soft body and nothing about acidity. QQ's scales and descriptors say acidity 3, grapefruit, tropical. **A question for the roaster** (in `notion-fixes.md` and the blind sheet) |
| Бекеле | Softer: Q-Profit | Q-Profit is coded acidity 3, higher than Бекеле's 2 |
| Ньяки | Brighter: Гицумби (same country, variety, process); model: Найваша | Найваша is "the same, but brighter": same body 2, same flavours, washed. Гицумби is coded body 3. The model ignores origin and variety on purpose (one-attribute "similar" is the competitors' trap) |
| Найваша | Кения Кисии close (model #20) | Kenya to Kenya is origin. QQ codes Кисии acidity 3, ferment 3 (anaerobic), against 4.5 and 0. Its text says «насыщенная кислотность», «плотное тело»: **a question for the roaster** |
| Ла Сирена | Brighter: Кисии / Гицумби; softer: Куа Мон / Бекеле; Гицумби close (#10) | Кисии is coded softer (3) and Гицумби equal (4). The model keeps the ferment level when stepping (Ранчо Гранде, ferment 2); the judges let it drop. Гицумби has the same flavours but is washed with no ferment |

## What this check can't tell

- It is two readers of one text, not a palate. Agreement with them only shows how far the model is from QQ's own
  words. Where the words and the scales disagree, the scales win until a taster says otherwise.
- 7 coffees out of 25. The bench shows the rest for a human to inspect.

## Next: the roaster's blind sheet

One page for a roaster or head barista, filled from memory, without the site or the cards. It covers the same 7
coffees (3 closest, brighter, softer, denser, confidence), plus three questions the check raised: the 3/3 trio
(Санта Мария, Антиокия, Мерури), the acidity and body of Мерури, Кисии and Гуджи, and what never to offer a Q-Punch
drinker. Claude Docs: https://claude.ai/artifact/4L53PWu2yPp4JQ7JpAZqDc (exports to PDF). When it comes back, add
it as `docs/taste-check/roaster.json` in the judges' format and compare it the same way.
