# The quiz's outside check against the B2C survey

Session 4 of choosing coffee (26 Nov 2026). The survey's 106 respondents (98 form answers and 8 phone interviews, all
current or former QQ buyers) are the only real people we have; none of them is a newcomer, so the question for each was
«would this be a sensible start for this person», not «is it their favourite».

**How:**
1. **Round 1:** four agents that had not seen the quiz's rules each took a quarter of the respondents
   (`codings-1…4.json`).
   - They coded how each would answer the four questions, from their own words (how they brew, the method they prefer,
     what they add, the roast and notes they like, what they buy and where), with the evidence and what was a guess.
   - They ran the quiz on those answers and judged every result against what the person said (`judged-1…4.md`).
2. **The rules were changed** for what they found (below).
3. **Round 2:** a fifth agent re-judged all 106 on the changed quiz, checking every reason on every card
   (`survey.md`, `respondents.json`).
4. **After round 2,** the two regressions it found and two clashes of words were fixed. The new results of those four
   respondents are noted in `respondents.json` (`note`). They were not re-judged by an outside agent; the independent
   review of the PR looked at them.

**Totals:**

| | fits | questionable | misfit |
|---|---|---|---|
| Round 1 | 86 | 14 | 6 |
| Round 2 | 98 | 6 | 2 |

**What the rounds changed in the quiz:**
- **A taste reason** names the coffee's own notes that match the answer («шоколад и орехи, как вы хотели: какао, орехи»),
  and is never shown beside a downside that contradicts it. Round 1's misfits 29, 35, 37 and 75 were cards that said
  «как вы хотели» and «Но мягче, чем вы описали» at once.
- **The stated taste counts more** than what the person drinks now (0.85). A supermarket drinker who asked for caramel and
  fruit no longer starts on an acidity-1 robusta blend.
- **With milk,** the moves are onto coffees QQ tags for milk (the safe moves even when bright or unusual coffee was
  asked), and the summary names milk only when the first coffee suits it.
- **The method thickens the cup** (moka, turka, machines), and a specialty drinker with an espresso method starts from
  the espresso anchor, not the filter one. Turka and moka brewers who wanted «насыщенный» got light coffees before.
- **The three different coffees** take one soft, one middle and one bright (for milk or a full-cup method: dense), each
  in a different region of the map and a step apart. No twins.
- **«Что-то необычное»** moves to brighter and more unusual coffees, not to calmer ones, and the summary says
  «необычного».
- **Words:**
  - a blend with robusta says so;
  - the grind line adds «или в зёрнах, если мелете сами»;
  - the move «Необычнее» says «смелее по обработке и вкусу».

**What is left** (`survey.md`):
- **Two misfits that the questions can't reach:**
  - 17 loves only QQ's decaf. The result page names Колумбия Декаф under the cards, but the quiz doesn't offer it.
  - 102 has no grinder and brews in a mug or a French press. QQ has no coarse grind (question `grinds-moka-press`), and
    she dislikes robusta, which the quiz doesn't ask.
- **Questionable:**
  - 14 (wants decaf, distrusts the new);
  - 25 (asked for a dark roast, brews in ready-made drip bags, which QQ doesn't sell yet);
  - 94 (a supermarket drinker on a pour-over starts on Мерури: grapefruit and tobacco).
- **Data notes for the taste model:** «виноградная косточка» counts as fruit (data/flavours.json); Q-Punch sits in
  «Ликёр и специи» (data/choose.json).

Browser measurements: `browser.md`.
