# The card's taste scale in a browser

The scale lives in the card's picture, hidden until it is asked for (Tim, 25 Nov 2026): an info button in the
picture's bottom left corner, just above the buy row; hovered with a mouse, or pressed (a tap, a click, Enter), it
raises a sheet from the buy row with the three rows of the scale (decision `card-scale`). The card's text says no
«… из 5».

Measured in Chromium (Playwright) on the built site at the twelve sizes of `site-kit.config.mjs` `audit.sizes`
(25 Nov 2026), and at 320 with 24px text, on four pages with cards: the catalogue, the home page, a coffee's page
(«Что взять еще») and the favourites. Every sheet of a page opened in turn; per page the worst card: the sheet's
height against the picture's, the room left between the sheet and the name row, the shortest line, and whether the
rows are wider than the sheet or the page scrolls sideways.

| Size | Catalogue | Home | A coffee's page | Favourites |
|---|---|---|---|---|
| 280×653 | 25 cards, sheet 124px of 310px, 72px below the name, line ≥ 80px | 6 cards, sheet 124px of 310px, 72px below the name, line ≥ 80px | 3 cards, sheet 124px of 310px, 90px below the name, line ≥ 80px | 3 cards, sheet 124px of 310px, 72px below the name, line ≥ 80px |
| 320×568 | 25 cards, sheet 124px of 360px, 122px below the name, line ≥ 120px | 6 cards, sheet 124px of 360px, 122px below the name, line ≥ 120px | 3 cards, sheet 124px of 360px, 140px below the name, line ≥ 120px | 3 cards, sheet 124px of 360px, 122px below the name, line ≥ 120px |
| 390×844 | 25 cards, sheet 125px of 443px, 220px below the name, line ≥ 175px | 6 cards, sheet 125px of 443px, 220px below the name, line ≥ 175px | 3 cards, sheet 125px of 443px, 220px below the name, line ≥ 175px | 3 cards, sheet 125px of 443px, 220px below the name, line ≥ 175px |
| 768×1024 | 25 cards, sheet 127px of 347px, 114px below the name, line ≥ 156px | 6 cards, sheet 127px of 433px, 201px below the name, line ≥ 156px | 3 cards, sheet 127px of 433px, 201px below the name, line ≥ 156px | 3 cards, sheet 127px of 433px, 201px below the name, line ≥ 156px |
| 844×390 | 25 cards, sheet 125px of 398px, 176px below the name, line ≥ 220px | 6 cards, sheet 125px of 497px, 276px below the name, line ≥ 220px | 3 cards, sheet 125px of 497px, 276px below the name, line ≥ 220px | 3 cards, sheet 125px of 497px, 276px below the name, line ≥ 220px |
| 1024×768 | 25 cards, sheet 129px of 380px, 115px below the name, line ≥ 104px | 6 cards, sheet 129px of 380px, 115px below the name, line ≥ 104px | 3 cards, sheet 129px of 380px, 140px below the name, line ≥ 104px | 3 cards, sheet 129px of 380px, 115px below the name, line ≥ 104px |
| 1366×650 | 25 cards, sheet 128px of 527px, 290px below the name, line ≥ 226px | 6 cards, sheet 128px of 527px, 290px below the name, line ≥ 226px | 3 cards, sheet 128px of 527px, 290px below the name, line ≥ 226px | 3 cards, sheet 128px of 527px, 290px below the name, line ≥ 226px |
| 1440×900 | 25 cards, sheet 131px of 541px, 288px below the name, line ≥ 221px | 6 cards, sheet 131px of 541px, 288px below the name, line ≥ 221px | 3 cards, sheet 131px of 541px, 288px below the name, line ≥ 221px | 3 cards, sheet 131px of 541px, 288px below the name, line ≥ 221px |
| 1920×1080 | 25 cards, sheet 131px of 613px, 358px below the name, line ≥ 277px | 6 cards, sheet 131px of 613px, 358px below the name, line ≥ 277px | 3 cards, sheet 131px of 613px, 358px below the name, line ≥ 277px | 3 cards, sheet 131px of 613px, 358px below the name, line ≥ 277px |
| 2560×1440 | 25 cards, sheet 131px of 613px, 358px below the name, line ≥ 277px | 6 cards, sheet 131px of 613px, 358px below the name, line ≥ 277px | 3 cards, sheet 131px of 613px, 358px below the name, line ≥ 277px | 3 cards, sheet 131px of 613px, 358px below the name, line ≥ 277px |
| 390×844@24 | 25 cards, sheet 146px of 448px, 168px below the name, line ≥ 125px | 6 cards, sheet 146px of 448px, 168px below the name, line ≥ 125px | 3 cards, sheet 146px of 448px, 199px below the name, line ≥ 125px | 3 cards, sheet 146px of 448px, 168px below the name, line ≥ 125px |
| 1366×650@24 | 25 cards, sheet 147px of 654px, 397px below the name, line ≥ 406px | 6 cards, sheet 147px of 817px, 561px below the name, line ≥ 406px | 3 cards, sheet 147px of 817px, 561px below the name, line ≥ 406px | 3 cards, sheet 147px of 817px, 561px below the name, line ≥ 406px |
| 320×568@24 | 25 cards, sheet 146px of 360px, 80px below the name, line ≥ 55px | 6 cards, sheet 146px of 360px, 80px below the name, line ≥ 55px, page 39px sideways | 3 cards, sheet 146px of 360px, 80px below the name, line ≥ 55px, page 39px sideways | 3 cards, sheet 146px of 360px, 80px below the name, line ≥ 55px, page 39px sideways |

- The sheet never reaches the name: at least 72px stay between them (280 wide), 80px at 320 with 24px text. It is
  124–131px tall (146–147px with 24px text), a quarter to two fifths of the picture.
- No row is wider than its sheet. The first build's line kept a `3rem` minimum, which grows with the text: at 320 with
  24px text the rows were 25px too wide. The minimum is 24px now, and the gap 8px below S; the shortest line is 55px.
- The 39px sideways at 320 with 24px text is the page head's title (`head__title`, 359px), the same before this
  change; the catalogue, whose head is shorter, has none.
- The button is 40 × 40px everywhere (the heart's size).
- Touch (390, `hasTouch`): a tap opens the sheet and does not follow the card's link; a tap elsewhere closes it. Mouse
  (1280): hovering the button shows the sheet, a click pins it and stays on the page. Keyboard: Tab reaches the button
  (its ring after a key), Enter opens, Esc closes and keeps the focus on the button. A screen reader hears the button
  as «Вкус: Кислотность 4,5 из 5, яркая для QQ. Плотность 2 из 5, лёгкая для QQ. Фермент 0 из 4, классический вкус
  для QQ.»; the sheet itself is hidden from it.
- Contrast (computed from the tokens): on a light card (cloud) the line ink-60 3.73 : 1, the dot ink 12.4 : 1, the
  words ink-70 4.96 : 1; on a dark card (black) the line white-60 7.37 : 1, the dot paper 21 : 1, the words white-80
  13.1 : 1 (WCAG 1.4.11 asks 3 : 1 of a graphic's parts, 1.4.3 4.5 : 1 of small text).
- `npm run canvas:check`: no id twice on the canvas page (the sheet has no id; the button names the values itself).
  Two of its 35 checks fail as they did before this change («next: different names» and a step that reads a missing
  element), on the merged main.
