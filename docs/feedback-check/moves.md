# Feedback moves: outside check against the roasters' texts

## Method

I read the roaster's `short`, `about` and `descriptors` for all 25 coffees in `src/data/products.json` and wrote down, for each one, where the text puts acidity, body and fermentation. I then compared that reading with QQ's coded scales (A = acidity 1–5, D = density 1–5, F = ferment 0–3). I judged every card in `paths.json` from step 1 on: 63 cards and the 6 taste lines that name a taste. Step 0 was used only as context. In `feedback-output.md` (134 rows) I judged:

- in each of the 110 non-«в самый раз» rows, the first move card, or the «у нас нет» sentence;
- all 51 «Вот что ближе всего» fallback cards;
- the «Похожий» card, or the «не нашли» claim, in each of the 24 «в самый раз» rows.

In the table each row is answered alone and the other rows are «в самый раз». So a card that changes an unasked row by 2 or more coded steps goes against an explicit answer. Levels:

- **high**: the label is false, or the card throws away a row the person called right. That means 3 coded steps, or the move from one of the most fermented lots to none, when a coffee that keeps that row exists or «у нас нет» should have been said.
- **medium**: a 2-step unrequested change, or a label that holds only on the codes and not in the texts.
- **low**: a nuance.

Where the codes and the text disagree I say which one I went by: "coded" means the scale, "by text" means the roaster's description. Availability of roasts (espresso or filter) for the method was taken into account.

## Flagged cards

T = `feedback-output.md` row (coffee · answer). ПВВ = «По вашему вкусу». rN sN = path customer and step.

| # | Source | Answered about | Answer | Card | Level | Evidence |
|---|---|---|---|---|---|---|
| 1 | r4-3 s3 | Чайна Альта | хочу ярче | Снова · Гицумби | low | Coded acidity is equal (4 = 4). Only the text ("очень яркий" against "яркий") makes it brighter, and the card doesn't say so |
| 2 | r4-3 s3 | Чайна Альта | хочу ярче | ПВВ · Эль Пласэр ИПА | medium | The ferment row was never answered, yet this is the most processed lot (200 h anaerobic twice, lactic acid, hops) and denser (D4 vs 3) |
| 3 | r4-3 s4 | Найваша ПБ | в самый раз | Похожий · Вуш-Вуш | medium | The card itself says softer and more fermented, so it differs on 2 of 3 rows. By text, Гуджи (washed, "яркой кислотностью", light) is the twin; its coded A3 hides it |
| 4 | r4-3 s4 | Найваша ПБ | в самый раз | ПВВ · Ла Сирена | medium | The taste line on the same screen says "без ферментации", but Ла Сирена is co-fermented with yeast and glucose |
| 5 | r50-3 s4 | Q-Punch | слишком плотно | Легче · Бекеле | low | Lighter than a blend with 40 % robusta, but the roaster writes "Тело плотное". Луна ("округлое тело") is the clearer step, so swap the order |
| 6 | r50-3 s4 | Q-Punch | слишком плотно | Снова · Q-Optimistic | medium | Same coded density (5/5) and text "пышное тело". Right after "too dense" the card reads "очень плотный". It needs a reason (half the robusta) or should go |
| 7 | r50-3 s4 | — | — | taste "Мягкий и плотный… довольно точно" | low | Fits Q-Optimistic, but ignores the newest answer ("too dense") and still claims precision |
| 8 | r62-3 s4 | Бекеле | в самый раз | lead "Похожего… не нашли" | low | Пальма Реаль ("без яркой кислотности", chocolate sweetness, filter roast) is a fair new similar coffee, one step lighter |
| 9 | r70-3 s1 | Q-Optimistic | хочу ярче | Тоже ярче · Луна | medium | Body 5 → 3, unasked ("пышное" → "округлое тело"). Luna's text never mentions acidity, so the gain in brightness is weak |
| 10 | r70-3 s3 | Q-Finch | в самый раз | ПВВ · Санта Мария | low | The taste line says "Плотный"; the card says medium body and the roaster says "мягким телом" |
| 11 | r75-3 s1 | Q-Berry | хочу ярче | Тоже ярче · Найваша ПБ | medium | Body 4 → 2, unasked |
| 12 | r75-3 s1 | Q-Berry | хочу ярче | ПВВ · ИПА | medium | Shop-coffee drinker with milk, ferment row unanswered, offered the most extreme lot |
| 13 | r75-3 s2 | ИПА | слишком ярко (body, unusual ok) | Мягче · Чайна Альта | **high** | Ferment was called right but drops F2 → 0 (by text: hops and lactic acid → a clean washed lot). Acidity only 4.5 → 4, and Chayna's text says "яркий". Воносалам (A4, F3) keeps the ferment |
| 14 | r75-3 s2 | ИПА | слишком ярко | Тоже мягче · Вуш-Вуш | medium | Body 4 → 2 unasked, F2 → 1. Its text says "яркий", so not clearly softer |
| 15 | r75-3 s3 | Чайна Альта | хочу плотнее | Плотнее · Q-Finch | medium | A4 → 3 unasked ("яркий" → "легкой цитрусовой"). It has Q-Berry's acidity, which this buyer called not bright enough in s1 |
| 16 | r75-3 s3 | Чайна Альта | хочу плотнее | ПВВ · Куа Мон | low | The card says "средней плотности", the same body the buyer just called too thin (the roaster calls it "плотный", a data issue) |
| 17 | r75-3 s3 | — | — | taste "Яркий и плотный… довольно точно" | low | Not a single «в самый раз» yet (ярче, слишком ярко, плотнее), so "довольно точно" overclaims |
| 18 | r76-3 s2, s3 | Вуш-Вуш; Ла Сирена | в самый раз | ПВВ · Найваша ПБ (×2) | low | The card is honest ("Но без ферментации"), but this is a buyer who wants unusual coffee and liked two fermented lots. Recoded by text, Кисии would fit |
| 19 | T ИПА · слишком ярко | ИПА | слишком ярко | Мягче · Q-Berry | **high** | F2 → 0 (by text: the wildest lot → a classic blend) with Необычность «в самый раз». Воносалам (card 2, A4 F3) is softer and keeps the ferment |
| 20 | T ИПА · хочу плотнее | ИПА | хочу плотнее | Плотнее · Q-Punch | **high** | A4.5 → 1 and F2 → 0, a robusta blend: two rows called right are thrown away. The honest answer is «у нас нет» |
| 21 | T Кисии · слишком ярко | Кисии | слишком ярко | Мягче · Луна | **high** | F3 → 0. No softer fermented lot exists in espresso roast, so it should say «у нас нет… с ферментацией» |
| 22 | T Кисии · слишком плотно | Кисии | слишком плотно | Легче · Ньяки | **high** | F3 → 0; same as above |
| 23 | T Кисии · хочу плотнее | Кисии | хочу плотнее | Плотнее · Q-Berry | **high** | F3 → 0, while Воносалам (D4, F3, espresso roast) is card 2 |
| 24 | T Кисии · хочу ярче | Кисии | хочу ярче | Ярче · Гицумби | **high** | F3 → 0, while Воносалам (A4, F3) is available |
| 25 | T Воносалам · слишком ярко | Воносалам | слишком ярко | Мягче · Q-Berry | **high** | F3 → 0, while Кисии (A3, F3) is card 2 |
| 26 | T Воносалам · слишком плотно | Воносалам | слишком плотно | Легче · Гицумби | **high** | F3 → 0, while Кисии (D3, F3) is card 3 |
| 27 | T Воносалам · хочу плотнее | Воносалам | хочу плотнее | Плотнее · Q-Punch | **high** | A4 → 1 and F3 → 0. It should be «у нас нет» |
| 28 | T Воносалам · хочу ярче | Воносалам | хочу ярче | Ярче · Найваша ПБ | **high** | F3 → 0 and D4 → 2. Nothing brighter and fermented exists in espresso roast, so «у нас нет» |
| 29 | T Q-Optimistic · слишком ярко | Q-Optimistic | слишком ярко («у нас нет») | ПВВ · Q-Finch | **high** | A1 → 3 after "too bright" |
| 30 | T Q-Punch · слишком ярко | Q-Punch | слишком ярко («у нас нет») | ПВВ · Q-Finch | **high** | A1 → 3 after "too bright" |
| 31 | T Q-Optimistic · хочу плотнее | Q-Optimistic | хочу плотнее («у нас нет») | ПВВ · Луна, Бекеле (2) | **high** | D5 → 3 after "want denser" |
| 32 | T Q-Punch · хочу плотнее | Q-Punch | хочу плотнее («у нас нет») | ПВВ · Луна, Бекеле (2) | **high** | D5 → 3 after "want denser" |
| 33 | T Кисии · хочу необычнее | Кисии | хочу необычнее («у нас нет») | ПВВ · Куа Мон, Мерури (2) | **high** | F3 → 0.5 / 0 after "more unusual" |
| 34 | T Воносалам · хочу необычнее | Воносалам | хочу необычнее («у нас нет») | ПВВ · Куа Мон, Гицумби (2) | **high** | F3 → 0.5 / 0 after "more unusual" |
| 35 | T Q-Optimistic, Q-Punch · слишком ярко | both | слишком ярко | ПВВ · Луна (×2) | medium | A1 → 2 after "too bright" |
| 36 | T Пальма Реаль · слишком ярко | Пальма Реаль | слишком ярко | ПВВ · Гуджи | medium | A2 → 3 coded (by text "яркой кислотностью", worse still) |
| 37 | T Бекеле, Луна · слишком ярко | both | слишком ярко | ПВВ · Санта Мария (×2) | medium | Coded A2 → 3. By text it's a tie; the code is the problem |
| 38 | T Пальма Реаль · слишком плотно | Пальма Реаль | слишком плотно | ПВВ · Луна, Бекеле (2) | medium | D2 → 3; Bekele's text says "Тело плотное" |
| 39 | T Ньяки, Гуджи · слишком плотно | both | слишком плотно | ПВВ · Антиокия, Мерури (×2 each) | medium | D2 → 3 after "too dense" |
| 40 | T Найваша · слишком плотно | Найваша ПБ | слишком плотно | ПВВ · Гицумби, Антиокия (2) | medium | D2 → 3 |
| 41 | T Ла Сирена · слишком плотно | Ла Сирена | слишком плотно | ПВВ · Ранчо Гранде, Кисии (2) | medium | D2 → 3; both texts say dense body |
| 42 | T Вуш-Вуш · слишком плотно | Вуш-Вуш | слишком плотно | ПВВ · Чайна Альта | medium | D2 → 3 |
| 43 | T ИПА · хочу ярче | ИПА | хочу ярче | ПВВ · Ранчо Гранде, Кисии (2) | medium | A4.5 → 3 after "want brighter" |
| 44 | T Найваша · хочу ярче | Найваша ПБ | хочу ярче | ПВВ · Ньяки, Антиокия (2) | medium | A4.5 → 3 |
| 45 | T Q-Berry · хочу плотнее | Q-Berry | хочу плотнее | Плотнее · Q-Punch | medium | A3 → 1 ("деликатной кислотностью" → "без резких кислотностей"), 40 % robusta. The Мягче move has a guard against this kind of jump; Плотнее has none |
| 46 | T Q-Finch · хочу плотнее | Q-Finch | хочу плотнее | Плотнее · Q-Punch | medium | A3 → 1 |
| 47 | T Q-Profit · хочу плотнее | Q-Profit | хочу плотнее | Плотнее · Q-Punch | medium | A3 → 1 (text "Профиль яркий" → none) |
| 48 | T Ранчо Гранде · слишком ярко | Ранчо Гранде | слишком ярко | Мягче · Луна | medium | F2 → 0. No softer fermented lot exists, so «у нас нет» |
| 49 | T Ранчо Гранде · слишком плотно | Ранчо Гранде | слишком плотно | Легче · Гуджи | medium | F2 → 0, and by text acidity jumps. Ла Сирена and Вуш-Вуш (cards 2–3) keep the ferment |
| 50 | T Ранчо Гранде · хочу плотнее | Ранчо Гранде | хочу плотнее | Плотнее · Q-Berry | medium | F2 → 0. By text Ранчо is already "Плотное тело", so Q-Berry is not clearly denser |
| 51 | T Ранчо Гранде · хочу ярче | Ранчо Гранде | хочу ярче | Ярче · Чайна Альта | medium | F2 → 0; Ла Сирена (card 2) keeps it |
| 52 | T Ла Сирена · слишком ярко | Ла Сирена | слишком ярко | Мягче · Ньяки | medium | F2 → 0, and by text not softer (Red Bourbon "яркой кислотностью" against "легкие цитрусовые ноты"). Ранчо Гранде (card 3) is softer and fermented |
| 53 | T Ла Сирена · хочу ярче | Ла Сирена | хочу ярче | Ярче · Найваша ПБ | medium | F2 → 0 (co-ferment → washed) |
| 54 | T Санта Мария · слишком ярко | Санта Мария | слишком ярко | Мягче · Луна | medium | By text neither states an acidity. Santa Maria is the nut-and-chocolate base of Q-Optimistic (A1), so "Мягче" holds only on the code |
| 55 | T Санта Мария · слишком плотно | Санта Мария | слишком плотно | Легче · Гуджи | medium | By text acidity jumps ("богатой кислотностью"). Пальма Реаль (card 2) is the right step |
| 56 | T Мерури · слишком плотно | Мерури | слишком плотно | Легче · Гуджи | medium | By text a quiet Sumatra → a bright Ethiopia |
| 57 | T Куа Мон · слишком плотно | Куа Мон | слишком плотно | Легче · Гуджи | medium | Same acidity jump, plus body 4 → 2 by text |
| 58 | T Гицумби · хочу плотнее | Гицумби | хочу плотнее | Плотнее · Q-Berry | medium | "очень яркий" → "деликатной кислотностью" (−1 coded, −1.5 by text), unasked. Кисии recoded by text (bright, dense) fits |
| 59 | T Чайна Альта · хочу плотнее | Чайна Альта | хочу плотнее | Плотнее · Q-Berry | medium | Same, A4 → 3 |
| 60 | T Монте Верде · слишком необычно | Монте Верде | слишком необычно | Классичнее · Мерури | medium | Monte Verde is "классическую натуральную". Wet-hull Meruri ("пряный", tobacco) is not more classic by text; Антиокия (card 2) is |
| 61 | T Кисии · слишком необычно | Кисии | слишком необычно | Классичнее · Мерури | medium | Also drops acidity by text (Kenya "насыщенную кислотность" → none stated). Антиокия is better |
| 62 | T Ранчо Гранде · хочу необычнее | Ранчо Гранде | хочу необычнее | Необычнее · Кисии | medium | Both texts say "легкие ферментированные оттенки", and Kisii's ferment is 72 h against Ranch's 144 h. Воносалам (card 2) fits |
| 63 | T Ла Сирена · хочу необычнее | Ла Сирена | хочу необычнее | Необычнее · Кисии | medium | Kisii's text stresses its "чистоту", against Sirena's yeast-and-glucose co-ferment. Also D2 → 4 by text |
| 64 | T Кисии · хочу необычнее | Кисии | хочу необычнее | lead «у нас нет… самых необычных» | medium | True by code (F3), false by text: ИПА and Воносалам are wilder |
| 65 | T Санта Мария · в самый раз | Санта Мария | в самый раз | Похожий · Антиокия | medium | Equal codes, opposite texts: a soft nut-and-chocolate pulped natural against a washed lot with "яркую кислотность" |
| 66 | T Антиокия · в самый раз | Антиокия | в самый раз | Похожий · Мерури | medium | Bright, clean washed coffee against earthy, spicy wet-hull |
| 67 | T Мерури · в самый раз | Мерури | в самый раз | Похожий · Антиокия | medium | Same pair, other way round |
| 68 | T Куа Мон · в самый раз | Куа Мон | в самый раз | Похожий · Санта Мария | medium | "сладкий, плотный… десертный" against "мягким телом" |
| 69 | T Q-Optimistic · слишком плотно | Q-Optimistic | слишком плотно | Легче · Бекеле | low | Roaster says "Тело плотное"; Луна (card 2) is clearer |
| 70 | T Q-Punch · слишком плотно | Q-Punch | слишком плотно | Легче · Бекеле | low | Same |
| 71 | T Санта Мария · хочу ярче | Санта Мария | хочу ярче | Ярче · Гицумби | low | By text from no stated acidity straight to "очень яркий". Антиокия is the gentler step, hidden by equal codes |
| 72 | T Мерури · хочу ярче | Мерури | хочу ярче | Ярче · Гицумби | low | Same |
| 73 | T Мерури · слишком ярко | Мерури | слишком ярко | Мягче · Бекеле | low | Meruri's text never mentions acidity; softer only on the code |
| 74 | T Бекеле · хочу ярче | Бекеле | хочу ярче | Ярче · Куа Мон | low | Kua Mon's text is silent on acidity ("десертный") |
| 75 | T Луна · хочу ярче | Луна | хочу ярче | Ярче · Куа Мон | low | Same |
| 76 | T ИПА · хочу необычнее | ИПА | хочу необычнее | Необычнее · Воносалам | low | By text a toss-up (hops and lactic acid against Excelsa and mosto) |
| 77 | T ИПА · слишком необычно | ИПА | слишком необычно | Классичнее · Гицумби | low | Right direction, but from the wildest lot to no ferment in one step |
| 78 | T Ранчо Гранде · слишком необычно | Ранчо Гранде | слишком необычно | Классичнее · Мерури | low | Right direction, but Meruri isn't "classic" by text |
| 79 | T Монте Верде · слишком плотно | Монте Верде | слишком плотно | Легче · Гуджи | low | Acidity +1 by text |
| 80 | T Монте Верде · хочу ярче | Монте Верде | хочу ярче | Ярче · Чайна Альта | low | Body by text "Бархатистое" → "легкого питкого" |
| 81 | T Куа Мон · хочу плотнее | Куа Мон | хочу плотнее | Плотнее · Q-Berry | low | The roaster already calls Kua Mon "плотный" |
| 82 | T Q-Finch · слишком плотно | Q-Finch | слишком плотно | Легче · Антиокия | low | Acidity up by text ("легкой цитрусовой" → "яркую") |
| 83 | T Чайна Альта · слишком ярко | Чайна Альта | слишком ярко | Мягче · Антиокия | low | Антиокия's text also says "яркую кислотность" |
| 84 | T Монте Верде · в самый раз | Монте Верде | в самый раз | Похожий · Ранчо Гранде | low | Classic natural against 144 h semi-anaerobic; denser by text |
| 85 | T Ранчо Гранде · в самый раз | Ранчо Гранде | в самый раз | Похожий · Кисии | low | Low-acid Brazil against Kenya with "насыщенную кислотность" |
| 86 | T Кисии · в самый раз | Кисии | в самый раз | lead "Похожего… не нашли" | low | By text Воносалам is similar, and it is card 2 anyway; call it «Похожий» |
| 87 | T Найваша · в самый раз | Найваша ПБ | в самый раз | lead "Похожего… не нашли" | low | By text Гуджи (washed, bright, light) is similar |

## Totals

- **Checked:** 254 items.
  - Paths: 63 cards and 6 taste lines.
  - Table: 93 first move cards, 17 «у нас нет» leads, 51 fallback cards, and 24 «Похожий» cards or «не нашли» claims.
- **Flagged:** 102. High 21, medium 53, low 28.
  - Paths: 19 (1 high, 9 medium, 9 low).
  - Table: 83 (20 high, 44 medium, 19 low).
- **«у нас нет» leads:** all 17 are true on the codes. By text, one is false (Кисии, «хочу необычнее»).
- **The other 76 first move cards** go the asked way on both the codes and the texts, with no big side jump.

## Patterns

- **The Необычность row is not protected.** On fermented lots, an acidity or body move lands on an unfermented coffee in 16 of 25 cases, even when a fermented one exists (often as card 2). This covers every move from Кисии and Воносалам, all four from Ранчо Гранде, and two each from ИПА and Ла Сирена. *Fix:* when Необычность is «в самый раз», limit |ΔF| to 1 or less. If nothing qualifies, say «у нас нет … с ферментацией». The site already does this for softness (Бекеле, Луна, Пальма).
- **The "too different" guard covers only one direction.** For «Мягче», Q-Punch and Q-Optimistic are excluded as "совсем другие". «Плотнее» has no such guard, so it jumps to Q-Punch from Q-Berry, Q-Finch, Q-Profit, ИПА and Воносалам (A −2 to −3.5). *Fix:* use one guard for all six moves, with a 2-step limit on every unasked row.
- **The fallback ignores the direction asked.** In all 17 «у нас нет» rows, at least one «Вот что ближе всего» card goes *against* the answer: 30 of 51 cards (brighter after "too bright", lighter after "want denser", unfermented after "more unusual"). The header line "none moves the visitor against the answer" is not true for these cards. *Fix:* in a fallback, offer only coffees that tie with or improve on the asked row. Otherwise show fewer cards, or «Снова».
- **Ties in the codes hide differences the texts state.** Equal codes make «Похожий» pair opposites (Санта Мария ↔ Антиокия ↔ Мерури, Куа Мон → Санта Мария). They also make «Легче» pick Гуджи, which is "bright" by text, four times. *Fix:* the data items below, plus a tie-breaker on processing and style (washed / natural / wet-hull, origin, descriptors).
- **«Классичнее» and «Необычнее» read only F.** Wet-hull Мерури is used as the classic step three times, and Кисии counts as "more unusual" than Ранчо and Ла Сирена, whose texts describe equal or heavier processing.
- **The taste line, the leads and the ПВВ cards contradict each other.** A ПВВ card with F2 or more appears when the ferment row was never answered (ИПА twice), or next to a line saying "без ферментации". «Снова» offers an equally dense coffee right after "too dense". "Уже довольно точно" appears with no «в самый раз» answers. *Fix:* when a row is unanswered, keep ПВВ within F1. Show "довольно точно" only after at least 2 consistent «в самый раз» answers. «Снова» must not contradict the newest answer on its own row.

## Data questions (for Notion)

- **Бразилия Санта Мария:** A3 → 2. The text mentions no acidity: nuts, chocolate, "легкими фруктовыми акцентами", "мягким телом". It is 60 % of Q-Optimistic and Q-Punch, both coded A1. D3 → 2.5 or 3 is also possible.
- **Колумбия Антиокия:** A3 (shown as "Лёгкая кислинка") vs "яркую кислотность". Suggest 3.5–4.
- **Эфиопия Гуджи:** A3 vs "яркой кислотностью", "богатой кислотностью", "ярко выраженным цитрусовым". Suggest 4. (The product's lot is "Эфиопия Лалибела", the same as in Q-Finch; worth checking.)
- **Кения Кисии:** A3 D3 F3 vs "яркую" and "насыщенную кислотность", "плотным телом", "легкие ферментированные оттенки". Suggest A4 D4 F2.
- **Колумбия Эль Пласэр ИПА:** F2, the same as Ранчо Гранде, although it is the most processed lot on the list (two 100 h anaerobic stages, lactic acid, hops). Suggest F3.
- **Эфиопия Бекеле:** D3 vs "Тело плотное", "плотную текстуру". Suggest 3.5–4.
- **Бразилия Ранчо Гранде:** D3 vs "Плотное тело". Suggest 4.
- **Вьетнам Куа Мон:** D3 vs "сладкий, плотный". Suggest 4.
- **Колумбия Чайна Альта:** D3 vs short "легкого питкого". Suggest 2–2.5.
- **Индонезия Мерури:** A3 while the text never mentions acidity (wet-hull, "пряный", tobacco). Suggest A2. Wet-hull is also not "classic" in this range: either nudge F or "unusual" to 0.5, or stop using it as a «Классичнее» target.
- **Перу Монте Верде:** F1 for what the text calls a classic natural, while the naturals Бекеле, Луна and Санта Мария are F0. Decide on one rule.
- **Колумбия Вуш-Вуш:** `processing` says only "Натуральная", but the text describes 24 h oxidation and 3 days in sealed tanks. F1 may be 1.5. Its D2 has no support in the text ("богатый").
- **Q-Finch:** A3 vs "легкой цитрусовой кислотностью". Suggest 2.5.
- **Not taste, but wrong:** Q-Punch's text says "вьетнамской робусты" while its composition lists Уганда Робуста 18. Руанда Гицумби is coded sweetness 5 against "умеренная сладость".
