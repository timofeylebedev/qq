# Checks of «Что взять еще» (session 2)

- `lines.md`, `lines.json`: an outside check. A separate agent, which never saw the model, read every line the block shows
  (`docs/next-output.md`) against the roasters' own texts («Краткое описание», «О сорте», descriptors, scales, uses) and
  flagged what misleads or makes no sense. Four rounds: v1 50 flagged of 174 (10 high), v2 31 (4 high), v3 18 (4 high),
  v4 19 of 150 (4 high, 6 medium, 9 low). Each round's findings became rules in `nextBlock`, not hand-picks. After v4,
  one more rule (a replacement never repeats a step a card already takes) fixed its two «Плотнее» flags: **17 remain,
  4 high, 5 medium, 8 low**. The four highs are one pair, Антиокия ↔ Мерури, equal on QQ's scales and opposite in the
  texts: kept on purpose, the Мерури question is already the roaster's (docs/notion-fixes.md).
- `browser.md`: the block measured in Chromium at the audit's 12 sizes (all 25 coffees at 390, 1024, 1440). It found a
  two-line name running into the pack with three cards in a row at 1024 (14 px) and touching the bag at 280 and with
  24 px text; fixed in the commit after it (the pack keeps clear of two lines of the name below L, three from L) and
  measured again on all 25 pages at 11 sizes: no overlap, no sideways scroll.
