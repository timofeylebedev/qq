# The card's taste scale in a browser

Outside check of the card's scale (session 3, row 14; decision `card-scale`), measured in Chromium (Playwright) on the
built site at the twelve sizes of `site-kit.config.mjs` `audit.sizes` (24 Nov 2026), on four pages with cards: the
catalogue (25 cards), the home page (6), a coffee's page («Что взять еще», 4) and the favourites (3, from the audit's
own storage). Per page: how many scales, their height, the shortest line, and whether anything went wrong (an end word
on two lines, the scales of one row not level, a dot outside its line, sideways scroll, a script error).

| Size | Catalogue | Home | A coffee's page | Favourites |
|---|---|---|---|---|
| 280×653 | 25 scales, 47–47px tall, line ≥ 104px | 6 scales, 47–47px tall, line ≥ 104px | 4 scales, 47–47px tall, line ≥ 104px | 3 scales, 47–47px tall, line ≥ 104px |
| 320×568 | 25 scales, 47–47px tall, line ≥ 144px | 6 scales, 47–47px tall, line ≥ 144px | 4 scales, 47–47px tall, line ≥ 144px | 3 scales, 47–47px tall, line ≥ 144px |
| 390×844 | 25 scales, 48–48px tall, line ≥ 208px | 6 scales, 48–48px tall, line ≥ 208px | 4 scales, 48–48px tall, line ≥ 208px | 3 scales, 48–48px tall, line ≥ 208px |
| 390×844@24 | 25 scales, 69–69px tall, line ≥ 149px | 6 scales, 69–69px tall, line ≥ 149px | 4 scales, 69–69px tall, line ≥ 149px | 3 scales, 69–69px tall, line ≥ 149px |
| 844×390 | 25 scales, 48–48px tall, line ≥ 239px | 6 scales, 48–48px tall, line ≥ 239px | 4 scales, 48–48px tall, line ≥ 239px | 3 scales, 48–48px tall, line ≥ 239px |
| 768×1024 | 25 scales, 50–50px tall, line ≥ 194px | 6 scales, 50–50px tall, line ≥ 194px | 4 scales, 50–50px tall, line ≥ 194px | 3 scales, 50–50px tall, line ≥ 194px |
| 1024×768 | 25 scales, 52–52px tall, line ≥ 146px | 6 scales, 52–52px tall, line ≥ 146px | 4 scales, 52–52px tall, line ≥ 66px | 3 scales, 52–52px tall, line ≥ 146px |
| 1366×650 | 25 scales, 51–51px tall, line ≥ 229px | 6 scales, 51–51px tall, line ≥ 229px | 4 scales, 51–51px tall, line ≥ 156px | 3 scales, 51–51px tall, line ≥ 229px |
| 1440×900 | 25 scales, 54–54px tall, line ≥ 219px | 6 scales, 54–54px tall, line ≥ 219px | 4 scales, 54–54px tall, line ≥ 154px | 3 scales, 54–54px tall, line ≥ 219px |
| 1920×1080 | 25 scales, 54–54px tall, line ≥ 218px | 6 scales, 54–54px tall, line ≥ 218px | 4 scales, 54–54px tall, line ≥ 196px | 3 scales, 54–54px tall, line ≥ 218px |
| 2560×1440 | 25 scales, 54–54px tall, line ≥ 218px | 6 scales, 54–54px tall, line ≥ 218px | 4 scales, 54–54px tall, line ≥ 196px | 3 scales, 54–54px tall, line ≥ 218px |

- Nothing went wrong at any size: no end word wraps, every row's scales stand level (the card's text takes the height
  to spare), every dot inside its line, no sideways scroll, no errors. The first build had a row out of level on the
  home page at 390 and on a coffee's page at 1024 (texts of different lengths); fixed by letting the text grow.
- Height 47–54px (69px with the browser's text at 24px). The line is shortest on a coffee's page at 1024, where four
  cards share a row: 66px, still with all six words on one line each.
- Contrast (computed from the tokens): the line ink-60 is 3.84 : 1 on paper and 3.73 : 1 on cloud; the dot ink 13.4 : 1;
  the end words ink-70 5.15 : 1 (WCAG 1.4.11 asks 3 : 1 of a graphic's parts, 1.4.3 4.5 : 1 of small text). The coffee
  page's chart dots were ink-40 (2.28 : 1) and are now ink-60.
- A screen reader hears, per card, e.g. «Кислотность 3 из 5, средняя для QQ. Плотность 3 из 5, средняя для QQ.
  Фермент 0 из 4, классический вкус для QQ.»; the graphic is `aria-hidden`.
