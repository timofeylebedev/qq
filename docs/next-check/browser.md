# «Что взять еще» (section.next) and the sold-out state: measurements

Built site `/home/claude/qq/dist` (branch claude/next-coffee), served by `vite preview` on :4182, headless Chromium 1243 (no GPU: packs are `.pack__still`), DPR 1, every page opened anew, scrolled to the block, images forced eager and decoded. 24px text = CDP `Page.setFontSizes` standard/fixed 24 (root font measured 24px). 133 page×size runs: all 25 coffees at 390×844, 1024×768, 1440×900; six key pages (efiopiya-bekele, q-optimistic, kolumbiya-el-plaser-ipa, kolumbiya-dekaf, braziliya-rancho-grande, q-berry) at all 12 sizes; / and /catalog/ at 390 and 1440.
Scripts: `measure.mjs` (→ raw.json), `clicks.mjs` (→ clicks.json: clicks and axe), `photo.mjs` (→ photo.json: names over photos), `analyze.mjs` (the tables). Screenshots: `shots/`.

## 1. Sideways scroll and width

| size | pages | max page scrollWidth − clientWidth | column (inner) px / rem | block elements wider than column | overflowing (scroll>client) |
|---|---|---|---|---|---|
| 280x653 | 6 | 0 | 248 / 15.5 | 0 | 0 |
| 320x568 | 6 | 0 | 288 / 18 | 0 | 0 |
| 390x844 | 25 | 0 | 354 / 22.13 | 0 | 0 |
| 768x1024 | 6 | 0 | 710.4 / 44.4 | 0 | 0 |
| 844x390 | 6 | 0 | 808.6 / 50.54 | 0 | 0 |
| 1024x768 | 25 | 0 | 951.8 / 59.49 | 0 | 0 |
| 1366x650 | 6 | 0 | 1300.8 / 81.3 | 0 | 0 |
| 1440x900 | 25 | 0 | 1346.2 / 84.14 | 0 | 0 |
| 1920x1080 | 6 | 0 | 1520 / 95 | 0 | 0 |
| 2560x1440 | 6 | 0 | 1520 / 95 | 0 | 0 |
| 390x844@24 | 6 | 0 | 358 / 14.92 | 0 | 0 |
| 1366x650@24 | 6 | 0 | 1321.4 / 55.06 | 0 | 0 |

/ and /catalog/: / 390x844: 0 · / 1440x900: 0 · /catalog/ 390x844: 0 · /catalog/ 1440x900: 0

## 2. Name vs pack, cut-off and overlaps (every card of every page measured at the size)

Boxes: `.card__title` against the still's element box (`.pack__still`, = `.pack` slot) and against the bag actually drawn in it (alpha bbox of the still, placed by object-fit: contain). "line∩bag" uses the name's line boxes. Gap = bag top − name bottom (negative = overlap). Cells = the buy row's cells (`.buy__weights`, under the fade). Photo cards (no pack) are left out of the pack columns.

| size | cards | name lines max | name∩still box (max h px, cards) | name∩bag (max h, cards) | name line∩bag max | min gap name→bag | pack margin-top (4 in row) | buy cells∩bag max h | text lines max | cut off (text/name/tag/buy) | tag∩card / text∩buy |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 280x653 | 24 | 2 | 10 (7) | 0 | 0 | -0.3 (efiopiya-bekele → peru-palma-real, 2 l.) | – | 0 | 6 | 0 | 0 / 0 |
| 320x568 | 24 | 2 | 3 (2) | 0 | 0 | 8.3 (kolumbiya-el-plaser-ipa → braziliya-rancho-grande, 2 l.) | – | 0 | 5 | 0 | 0 / 0 |
| 390x844 | 97 | 1 | 0 | 0 | 0 | 42.1 (braziliya-santa-mariya → q-profit, 1 l.) | – | 0 | 5 | 0 | 0 / 0 |
| 768x1024 | 24 | 1 | 0 | 0 | 0 | 35.5 (q-optimistic → q-profit, 1 l.) | – | 0 | 4 | 0 | 0 / 0 |
| 844x390 | 24 | 1 | 0 | 0 | 0 | 51.6 (q-optimistic → q-punch, 1 l.) | – | 0 | 4 | 0 | 0 / 0 |
| 1024x768 | 97 | 3 | 13.8 (2) | 1.9 (2) | 0.9 | -1.9 (indoneziya-vonosalam → kolumbiya-el-plaser-ipa, 2 l.) | 92.14px | 0 | 7 | 0 | 0 / 0 |
| 1366x650 | 24 | 2 | 0 | 0 | 0 | 34.7 (braziliya-rancho-grande → kolumbiya-la-sirena, 2 l.) | 88.9625px | 0 | 5 | 0 | 0 / 0 |
| 1440x900 | 97 | 2 | 0 | 0 | 0 | 37.5 (efiopiya-gudzhi → peru-palma-real, 2 l.) | 101.775px | 0 | 5 | 0 | 0 / 0 |
| 1920x1080 | 24 | 2 | 0 | 0 | 0 | 39.8 (kolumbiya-el-plaser-ipa → indoneziya-vonosalam, 2 l.) | 102.8px | 0 | 5 | 0 | 0 / 0 |
| 2560x1440 | 24 | 2 | 0 | 0 | 0 | 39.8 (kolumbiya-el-plaser-ipa → indoneziya-vonosalam, 2 l.) | 102.8px | 0 | 5 | 0 | 0 / 0 |
| 390x844@24 | 24 | 2 | 11.5 (7) | 0 | 0 | 2.5 (efiopiya-bekele → peru-palma-real, 2 l.) | – | 0 | 6 | 0 | 0 / 0 |
| 1366x650@24 | 24 | 1 | 0 | 0 | 0 | 93.9 (efiopiya-bekele → uganda-luna, 1 l.) | – | 0 | 4 | 0 | 0 / 0 |

- 280x653: name over still box on efiopiya-bekele→peru-palma-real (2 l., 10px, not on the bag); kolumbiya-el-plaser-ipa→indoneziya-vonosalam (2 l., 10px, not on the bag); kolumbiya-el-plaser-ipa→braziliya-rancho-grande (2 l., 10px, not on the bag); kolumbiya-el-plaser-ipa→kolumbiya-la-sirena (2 l., 10px, not on the bag); kolumbiya-dekaf→kolumbiya-antiokiya (2 l., 10px, not on the bag); braziliya-rancho-grande→kolumbiya-la-sirena (2 l., 10px, not on the bag); q-berry→q-finch (2 l., 10px, not on the bag)
- 320x568: name over still box on kolumbiya-el-plaser-ipa→braziliya-rancho-grande (2 l., 3px, not on the bag); q-berry→q-finch (2 l., 2.9px, not on the bag)
- 1024x768: name over still box on indoneziya-vonosalam→kolumbiya-el-plaser-ipa (2 l., 13.8px, bag 1.9px); kolumbiya-vush-vush→kolumbiya-la-sirena (2 l., 13.8px, bag 1.9px)
- 390x844@24: name over still box on efiopiya-bekele→peru-palma-real (2 l., 11.5px, not on the bag); kolumbiya-el-plaser-ipa→indoneziya-vonosalam (2 l., 11.5px, not on the bag); kolumbiya-el-plaser-ipa→braziliya-rancho-grande (2 l., 11.4px, not on the bag); kolumbiya-el-plaser-ipa→kolumbiya-la-sirena (2 l., 11.5px, not on the bag); kolumbiya-dekaf→kolumbiya-antiokiya (2 l., 11.5px, not on the bag); braziliya-rancho-grande→kolumbiya-la-sirena (2 l., 11.4px, not on the bag); q-berry→q-finch (2 l., 11.4px, not on the bag)

## 3. Tap targets (block + sold-out bar), min w×h per kind

| size | card link (stretched) | card name link text | fav | weights (select / radio input) | buy__add | buybar__lead | < 24 | < 44 (kinds) |
|---|---|---|---|---|---|---|---|---|
| 280x653 | 248×363.8 | 81.9×20 | 40×40 | 124×55.2 / – | 124×56.2 | 248×63.8 | card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text | card link text ×24, fav ×24 |
| 320x568 | 288×413.8 | 81.9×20 | 40×40 | 144×55.2 / – | 144×56.2 | 288×63.8 | card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text | card link text ×24, fav ×24 |
| 390x844 | 354×496.6 | 83.5×20 | 40×40 | 177×47.5 / – | 177×48.5 | 212.8×81.2 | card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text | card link text ×97, fav ×97 |
| 768x1024 | 346.8×489.4 | 92.8×23 | 40×40 | – / 63.3×34.5 | 173.4×51.2 | 426.6×52 | card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text | card link text ×24, fav ×24, weight radio (input) ×48 |
| 844x390 | 398×551.5 | 83.3×20 | 40×40 | – / 61.9×33.7 | 199×48.4 | 485.5×52 | card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text,card link text | card link text ×24, fav ×24, weight radio (input) ×48 |
| 1024x768 | 223.3×377.4 | 70.8×24 | 40×40 | – / 64.2×35 | 111.6×53 | 448×72 | 0 | fav ×97, weight radio (input) ×194, card link text ×12 |
| 1366x650 | 311.5×466.3 | 96×24 | 40×40 | – / 63.8×34.7 | 155.8×52.1 | 448×72 | 0 | card link text ×19, fav ×24, weight radio (input) ×48 |
| 1440x900 | 318.9×479.1 | 108.1×27 | 40×40 | – / 65.5×35.7 | 159.5×55.7 | 448×72 | 0 | card link text ×56, fav ×97, weight radio (input) ×194 |
| 1920x1080 | 362×533.3 | 109.2×27 | 40×40 | – / 65.7×35.8 | 181×56 | 448×72 | 0 | card link text ×21, fav ×24, weight radio (input) ×48 |
| 2560x1440 | 362×533.3 | 109.2×27 | 40×40 | – / 65.7×35.8 | 181×56 | 448×72 | 0 | card link text ×21, fav ×24, weight radio (input) ×48 |
| 390x844@24 | 358×520.2 | 122.9×30 | 40×40 | 179×72.8 / – | 179×73.8 | 358×88.7 | 0 | card link text ×17, fav ×24 |
| 1366x650@24 | 653.5×890.7 | 128.1×32 | 40×40 | – / 78.4×42.8 | 326.8×49.6 | 793.3×64.5 | 0 | card link text ×24, fav ×24, weight radio (input) ×48 |

## 4. Block layout

Key pages (6) at every size; "all 25" rows aggregate every coffee. Δ = tallest − shortest item in a row; tops = spread of card tops in a row; buy = spread of buy-row tops in a row; text = spread of text bottoms.

| size | page | items | per row | card w | block h | item h max / min | Δ per row max | card tops spread | buy tops spread | text bottoms spread |
|---|---|---|---|---|---|---|---|---|---|---|
| 280x653 | efiopiya-bekele | 4 | 1+1+1+1 | 248 | 1937.1 | 430.4 / 392.6 | 0 | 0 | 0 | 0 |
| 280x653 | q-optimistic | 4 | 1+1+1+1 | 248 | 2050.4 | 449.3 / 430.4 | 0 | 0 | 0 | 0 |
| 280x653 | kolumbiya-el-plaser-ipa | 4 | 1+1+1+1 | 248 | 1956 | 430.4 / 411.5 | 0 | 0 | 0 | 0 |
| 280x653 | kolumbiya-dekaf | 4 | 1+1+1+1 | 248 | 1918.2 | 411.5 / 392.6 | 0 | 0 | 0 | 0 |
| 280x653 | braziliya-rancho-grande | 4 | 1+1+1+1 | 248 | 1993.8 | 449.3 / 411.5 | 0 | 0 | 0 | 0 |
| 280x653 | q-berry | 4 | 1+1+1+1 | 248 | 1956 | 430.4 / 411.5 | 0 | 0 | 0 | 0 |
| 320x568 | efiopiya-bekele | 4 | 1+1+1+1 | 288 | 2081.4 | 461.5 / 442.6 | 0 | 0 | 0 | 0 |
| 320x568 | q-optimistic | 4 | 1+1+1+1 | 288 | 2138.1 | 480.4 / 461.5 | 0 | 0 | 0 | 0 |
| 320x568 | kolumbiya-el-plaser-ipa | 4 | 1+1+1+1 | 288 | 2081.4 | 461.5 / 442.6 | 0 | 0 | 0 | 0 |
| 320x568 | kolumbiya-dekaf | 4 | 1+1+1+1 | 288 | 2062.5 | 461.5 / 442.6 | 0 | 0 | 0 | 0 |
| 320x568 | braziliya-rancho-grande | 4 | 1+1+1+1 | 288 | 2100.3 | 480.4 / 442.6 | 0 | 0 | 0 | 0 |
| 320x568 | q-berry | 4 | 1+1+1+1 | 288 | 2100.3 | 461.5 / 461.5 | 0 | 0 | 0 | 0 |
| 390x844 | braziliya-rancho-grande | 4 | 1+1+1+1 | 354 | 2391.9 | 544.6 / 525.6 | 0 | 0 | 0 | 0 |
| 390x844 | efiopiya-bekele | 4 | 1+1+1+1 | 354 | 2391.9 | 544.6 / 525.6 | 0 | 0 | 0 | 0 |
| 390x844 | kolumbiya-dekaf | 4 | 1+1+1+1 | 354 | 2372.8 | 525.6 / 525.6 | 0 | 0 | 0 | 0 |
| 390x844 | kolumbiya-el-plaser-ipa | 4 | 1+1+1+1 | 354 | 2372.8 | 525.6 / 525.6 | 0 | 0 | 0 | 0 |
| 390x844 | q-berry | 4 | 1+1+1+1 | 354 | 2391.9 | 544.6 / 525.6 | 0 | 0 | 0 | 0 |
| 390x844 | q-optimistic | 4 | 1+1+1+1 | 354 | 2430 | 544.6 / 525.6 | 0 | 0 | 0 | 0 |
| 390x844 | **all 25** | 4/3 | 1+1+1+1, 1+1+1 | 354 | 1813.3–2430 | – | 0 | 0 | 0 | 0 |
| 768x1024 | efiopiya-bekele | 4 | 2+2 | 347 | 1326.8 | 539.1 / 519.2 | 0 | 0 | 0 | 0 |
| 768x1024 | q-optimistic | 4 | 2+2 | 347 | 1346.7 | 539.1 / 539.1 | 0 | 0 | 0 | 0 |
| 768x1024 | kolumbiya-el-plaser-ipa | 4 | 2+2 | 347 | 1346.7 | 539.1 / 539.1 | 0 | 0 | 0 | 20 |
| 768x1024 | kolumbiya-dekaf | 4 | 2+2 | 347 | 1326.8 | 539.1 / 519.2 | 0 | 0 | 0 | 19.9 |
| 768x1024 | braziliya-rancho-grande | 4 | 2+2 | 347 | 1326.8 | 539.1 / 519.2 | 0 | 0 | 0 | 0 |
| 768x1024 | q-berry | 4 | 2+2 | 347 | 1326.8 | 539.1 / 519.2 | 0 | 0 | 0 | 19.9 |
| 844x390 | efiopiya-bekele | 4 | 2+2 | 398 | 1361.8 | 580.5 / 580.5 | 0 | 0 | 0 | 0.1 |
| 844x390 | q-optimistic | 4 | 2+2 | 398 | 1380.8 | 599.5 / 580.5 | 0 | 0 | 0 | 0.1 |
| 844x390 | kolumbiya-el-plaser-ipa | 4 | 2+2 | 398 | 1361.8 | 580.5 / 580.5 | 0 | 0 | 0.1 | 0 |
| 844x390 | kolumbiya-dekaf | 4 | 2+2 | 398 | 1361.8 | 580.5 / 580.5 | 0 | 0 | 0.1 | 0 |
| 844x390 | braziliya-rancho-grande | 4 | 2+2 | 398 | 1380.8 | 599.5 / 580.5 | 0 | 0 | 0 | 19.1 |
| 844x390 | q-berry | 4 | 2+2 | 398 | 1361.8 | 580.5 / 580.5 | 0 | 0 | 0 | 0 |
| 1024x768 | braziliya-rancho-grande | 4 | 4 | 223 | 709.8 | 448.9 / 448.9 | 0 | 0 | 0 | 61.7 |
| 1024x768 | efiopiya-bekele | 4 | 4 | 223 | 689.3 | 428.3 / 428.3 | 0 | 0 | 0.1 | 41.2 |
| 1024x768 | kolumbiya-dekaf | 4 | 4 | 223 | 689.2 | 428.3 / 428.3 | 0 | 0 | 0 | 41.1 |
| 1024x768 | kolumbiya-el-plaser-ipa | 4 | 4 | 223 | 668.7 | 407.7 / 407.7 | 0 | 0 | 0 | 20.6 |
| 1024x768 | q-berry | 4 | 4 | 223 | 689.2 | 428.3 / 428.3 | 0 | 0 | 0.1 | 41.2 |
| 1024x768 | q-optimistic | 4 | 4 | 223 | 709.8 | 448.9 / 448.9 | 0 | 0 | 0 | 41.2 |
| 1024x768 | **all 25** | 4/3 | 4, 3 | 223, 304 | 668.7–749.3 | – | 0 | 0 | 0.1 | 61.7 |
| 1366x650 | efiopiya-bekele | 4 | 4 | 312 | 739.2 | 496.3 / 496.3 | 0 | 0 | 0 | 20.3 |
| 1366x650 | q-optimistic | 4 | 4 | 312 | 759.5 | 516.6 / 516.6 | 0 | 0 | 0 | 20.4 |
| 1366x650 | kolumbiya-el-plaser-ipa | 4 | 4 | 312 | 739.2 | 496.3 / 496.3 | 0 | 0 | 0 | 20.3 |
| 1366x650 | kolumbiya-dekaf | 4 | 4 | 312 | 739.2 | 496.3 / 496.3 | 0 | 0 | 0 | 20.3 |
| 1366x650 | braziliya-rancho-grande | 4 | 4 | 312 | 759.5 | 516.6 / 516.6 | 0 | 0 | 0 | 40.6 |
| 1366x650 | q-berry | 4 | 4 | 312 | 739.2 | 496.3 / 496.3 | 0 | 0 | 0.1 | 20.3 |
| 1440x900 | braziliya-rancho-grande | 4 | 4 | 319 | 847.4 | 531.7 / 531.7 | 0 | 0 | 0 | 42.9 |
| 1440x900 | efiopiya-bekele | 4 | 4 | 319 | 825.9 | 510.2 / 510.2 | 0 | 0 | 0 | 21.5 |
| 1440x900 | kolumbiya-dekaf | 4 | 4 | 319 | 825.9 | 510.2 / 510.2 | 0 | 0 | 0 | 21.4 |
| 1440x900 | kolumbiya-el-plaser-ipa | 4 | 4 | 319 | 825.9 | 510.2 / 510.2 | 0 | 0 | 0 | 21.5 |
| 1440x900 | q-berry | 4 | 4 | 319 | 825.9 | 510.2 / 510.2 | 0 | 0 | 0 | 0 |
| 1440x900 | q-optimistic | 4 | 4 | 319 | 847.4 | 531.7 / 531.7 | 0 | 0 | 0 | 21.5 |
| 1440x900 | **all 25** | 4/3 | 4, 3 | 319, 433 | 825.9–968.6 | – | 0 | 0 | 0.1 | 43 |
| 1920x1080 | efiopiya-bekele | 4 | 4 | 362 | 886.1 | 564.5 / 564.5 | 0 | 0 | 0 | 21.6 |
| 1920x1080 | q-optimistic | 4 | 4 | 362 | 907.7 | 586.1 / 586.1 | 0 | 0 | 0 | 21.6 |
| 1920x1080 | kolumbiya-el-plaser-ipa | 4 | 4 | 362 | 886.1 | 564.5 / 564.5 | 0 | 0 | 0 | 21.6 |
| 1920x1080 | kolumbiya-dekaf | 4 | 4 | 362 | 886.1 | 564.5 / 564.5 | 0 | 0 | 0 | 21.6 |
| 1920x1080 | braziliya-rancho-grande | 4 | 4 | 362 | 886.1 | 564.5 / 564.5 | 0 | 0 | 0 | 21.6 |
| 1920x1080 | q-berry | 4 | 4 | 362 | 886.1 | 564.5 / 564.5 | 0 | 0 | 0 | 21.5 |
| 2560x1440 | efiopiya-bekele | 4 | 4 | 362 | 886.1 | 564.5 / 564.5 | 0 | 0 | 0 | 21.6 |
| 2560x1440 | q-optimistic | 4 | 4 | 362 | 907.7 | 586.1 / 586.1 | 0 | 0 | 0 | 21.6 |
| 2560x1440 | kolumbiya-el-plaser-ipa | 4 | 4 | 362 | 886.1 | 564.5 / 564.5 | 0 | 0 | 0 | 21.6 |
| 2560x1440 | kolumbiya-dekaf | 4 | 4 | 362 | 886.1 | 564.5 / 564.5 | 0 | 0 | 0 | 21.6 |
| 2560x1440 | braziliya-rancho-grande | 4 | 4 | 362 | 886.1 | 564.5 / 564.5 | 0 | 0 | 0 | 21.6 |
| 2560x1440 | q-berry | 4 | 4 | 362 | 886.1 | 564.5 / 564.5 | 0 | 0 | 0 | 21.6 |
| 390x844@24 | efiopiya-bekele | 4 | 1+1+1+1 | 358 | 2663.7 | 614.1 / 557.4 | 0 | 0 | 0 | 0 |
| 390x844@24 | q-optimistic | 4 | 1+1+1+1 | 358 | 2833.7 | 642.4 / 614.1 | 0 | 0 | 0 | 0 |
| 390x844@24 | kolumbiya-el-plaser-ipa | 4 | 1+1+1+1 | 358 | 2720.3 | 614.1 / 585.7 | 0 | 0 | 0 | 0 |
| 390x844@24 | kolumbiya-dekaf | 4 | 1+1+1+1 | 358 | 2635.3 | 585.7 / 557.4 | 0 | 0 | 0 | 0 |
| 390x844@24 | braziliya-rancho-grande | 4 | 1+1+1+1 | 358 | 2748.7 | 642.4 / 585.7 | 0 | 0 | 0 | 0 |
| 390x844@24 | q-berry | 4 | 1+1+1+1 | 358 | 2692 | 614.1 / 585.7 | 0 | 0 | 0 | 0 |
| 1366x650@24 | efiopiya-bekele | 4 | 2+2 | 654 | 2096.5 | 928.3 / 928.3 | 0 | 0 | 0 | 28.9 |
| 1366x650@24 | q-optimistic | 4 | 2+2 | 654 | 2125.4 | 957.2 / 928.3 | 0 | 0 | 0 | 0 |
| 1366x650@24 | kolumbiya-el-plaser-ipa | 4 | 2+2 | 654 | 2096.6 | 928.3 / 928.3 | 0 | 0 | 0 | 0 |
| 1366x650@24 | kolumbiya-dekaf | 4 | 2+2 | 654 | 2096.6 | 928.3 / 928.3 | 0 | 0 | 0 | 0 |
| 1366x650@24 | braziliya-rancho-grande | 4 | 2+2 | 654 | 2125.4 | 957.2 / 928.3 | 0 | 0 | 0 | 28.9 |
| 1366x650@24 | q-berry | 4 | 2+2 | 654 | 2096.6 | 928.3 / 928.3 | 0 | 0 | 0.1 | 0 |

## 5. /coffee/q-berry/: bar and pill

| size | bar position | bar h (−-buybar-h) | bar at top: in view, viewport top | state | lead | lead h × w | name lines | cut off | pill w×h | pill gap under name | pill∩hero pack box / bag |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 280x653 | sticky | 130.8 (131px) | yes, 466.2 | НЕТ В НАЛИЧИИ / Скоро вернётся | Ближе всего / Q-⁠FINCH (ФИНЧ БЛЕНД) / 680 ₽ → ../../coffee/q-finch/ | 63.8×248 | 2 | 0 | 248×28.8 | 69.7 | 0 / 0 |
| 320x568 | sticky | 130.8 (131px) | yes, 381.2 | НЕТ В НАЛИЧИИ / Скоро вернётся | Ближе всего / Q-⁠FINCH (ФИНЧ БЛЕНД) / 680 ₽ → ../../coffee/q-finch/ | 63.8×288 | 2 | 0 | 288×28.8 | 50.8 | 0 / 0 |
| 390x844 | sticky | 97.2 (97px) | yes, 690.8 | НЕТ В НАЛИЧИИ / Скоро вернётся | Ближе всего / Q-⁠FINCH (ФИНЧ БЛЕНД) / 680 ₽ → ../../coffee/q-finch/ | 81.2×212.8 | 3 | 0 | 291.7×28 | 51.1 | 0 / 0 |
| 768x1024 | sticky | 68 (68px) | yes, 956 | НЕТ В НАЛИЧИИ / Скоро вернётся | Ближе всего / Q-⁠FINCH (ФИНЧ БЛЕНД) / 680 ₽ → ../../coffee/q-finch/ | 52×426.6 | 1 | 0 | 306.8×28 | 52 | 0 / 0 |
| 844x390 | relative | 68 (68px) | no, 2937.3 | НЕТ В НАЛИЧИИ / Скоро вернётся | Ближе всего / Q-⁠FINCH (ФИНЧ БЛЕНД) / 680 ₽ → ../../coffee/q-finch/ | 52×485.5 | 1 | 0 | 291.3×28 | 51.1 | 0 / 0 |
| 1024x768 | sticky | 88 (88px) | yes, 680 | НЕТ В НАЛИЧИИ / Скоро вернётся | Ближе всего / Q-⁠FINCH (ФИНЧ БЛЕНД) / 680 ₽ → ../../coffee/q-finch/ | 72×448 | 1 | 0 | 316.8×28 | 52.6 | 0 / 0 |
| 1366x650 | sticky | 88 (88px) | yes, 562 | НЕТ В НАЛИЧИИ / Скоро вернётся | Ближе всего / Q-⁠FINCH (ФИНЧ БЛЕНД) / 680 ₽ → ../../coffee/q-finch/ | 72×448 | 1 | 0 | 311.7×28 | 52.3 | 0 / 0 |
| 1440x900 | sticky | 88 (88px) | yes, 812 | НЕТ В НАЛИЧИИ / Скоро вернётся | Ближе всего / Q-⁠FINCH (ФИНЧ БЛЕНД) / 680 ₽ → ../../coffee/q-finch/ | 72×448 | 1 | 0 | 331.4×28 | 53.5 | 0 / 0 |
| 1920x1080 | sticky | 88 (88px) | yes, 992 | НЕТ В НАЛИЧИИ / Скоро вернётся | Ближе всего / Q-⁠FINCH (ФИНЧ БЛЕНД) / 680 ₽ → ../../coffee/q-finch/ | 72×448 | 1 | 0 | 333.4×28 | 53.6 | 0 / 0 |
| 2560x1440 | sticky | 88 (88px) | yes, 1352 | НЕТ В НАЛИЧИИ / Скоро вернётся | Ближе всего / Q-⁠FINCH (ФИНЧ БЛЕНД) / 680 ₽ → ../../coffee/q-finch/ | 72×448 | 1 | 0 | 333.4×28 | 53.6 | 0 / 0 |
| 390x844@24 | sticky | 165.6 (166px) | yes, 622.4 | НЕТ В НАЛИЧИИ / Скоро вернётся | Ближе всего / Q-⁠FINCH (ФИНЧ БЛЕНД) / 680 ₽ → ../../coffee/q-finch/ | 88.7×358 | 2 | 0 | 358×43.2 | 88.7 | 0 / 0 |
| 1366x650@24 | relative | 80.5 (80px) | no, 4490.4 | НЕТ В НАЛИЧИИ / Скоро вернётся | Ближе всего / Q-⁠FINCH (ФИНЧ БЛЕНД) / 680 ₽ → ../../coffee/q-finch/ | 64.5×793.3 | 1 | 0 | 430.1×28 | 60.9 | 0 / 0 |

Sold-out pages found (pill present): q-berry. Q-Berry first item tag: Ближе всего. Links to a sold-out coffee or mismatched hrefs in any block/bar: none. Pages offering q-berry in their block: none.
Q-Berry's cards on / and /catalog/: / 390x844: disabled=true «Скоро вернётся» 177×49 aria-label=null · / 1440x900: disabled=true «Скоро вернётся» 217×56 aria-label=null · /catalog/ 390x844: disabled=true «Скоро вернётся» 177×49 aria-label=null · /catalog/ 1440x900: disabled=true «Скоро вернётся» 217×56 aria-label=null

## 6. Clicks

| test | page | size | result | detail |
|---|---|---|---|---|
| card media click opens its coffee | efiopiya-bekele | 390x844 | ok | → /coffee/peru-palma-real/ (hit A.card__link) |
| card text click opens its coffee | efiopiya-bekele | 390x844 | ok | → /coffee/peru-palma-real/ (hit A.card__link) |
| card title click opens its coffee | efiopiya-bekele | 390x844 | ok | → /coffee/peru-palma-real/ (hit A.card__link) |
| card bag adds to qq-bag + toast | efiopiya-bekele | 390x844 | ok |  toast on=true «Уганда Луна — в корзине» bag null → [{"slug":"uganda-luna","weight":"200 г","grind":null,"roast":null,"qty":1,"price":680}] |
| card media click opens its coffee | q-berry | 390x844 | ok | → /coffee/efiopiya-bekele/ (hit A.card__link) |
| card text click opens its coffee | q-berry | 390x844 | ok | → /coffee/efiopiya-bekele/ (hit A.card__link) |
| card title click opens its coffee | q-berry | 390x844 | ok | → /coffee/efiopiya-bekele/ (hit A.card__link) |
| card bag adds to qq-bag + toast | q-berry | 390x844 | ok |  toast on=true «Q-⁠Finch (Финч бленд) — в корзине» bag null → [{"slug":"q-finch","weight":"200 г","grind":null,"roast":null,"qty":1,"price":680}] |
| sold-out bar lead opens nearest coffee | q-berry | 390x844 | ok | → /coffee/q-finch/ (hit –) |
| Q-Berry disabled button does nothing | / | 390x844 | ok |  toast on=false «» bag null → null disabled=true cursor=default |
| Q-Berry disabled button does nothing | /catalog/ | 390x844 | ok |  toast on=false «» bag null → null disabled=true cursor=default |
| card media click opens its coffee | efiopiya-bekele | 1440x900 | ok | → /coffee/peru-palma-real/ (hit A.card__link) |
| card text click opens its coffee | efiopiya-bekele | 1440x900 | ok | → /coffee/peru-palma-real/ (hit A.card__link) |
| card title click opens its coffee | efiopiya-bekele | 1440x900 | ok | → /coffee/peru-palma-real/ (hit A.card__link) |
| card bag adds to qq-bag + toast | efiopiya-bekele | 1440x900 | ok |  toast on=true «Уганда Луна — в корзине» bag null → [{"slug":"uganda-luna","weight":"200 г","grind":null,"roast":null,"qty":1,"price":680}] |
| card media click opens its coffee | q-berry | 1440x900 | ok | → /coffee/efiopiya-bekele/ (hit A.card__link) |
| card text click opens its coffee | q-berry | 1440x900 | ok | → /coffee/efiopiya-bekele/ (hit A.card__link) |
| card title click opens its coffee | q-berry | 1440x900 | ok | → /coffee/efiopiya-bekele/ (hit A.card__link) |
| card bag adds to qq-bag + toast | q-berry | 1440x900 | ok |  toast on=true «Q-⁠Finch (Финч бленд) — в корзине» bag null → [{"slug":"q-finch","weight":"200 г","grind":null,"roast":null,"qty":1,"price":680}] |
| sold-out bar lead opens nearest coffee | q-berry | 1440x900 | ok | → /coffee/q-finch/ (hit –) |
| Q-Berry disabled button does nothing | / | 1440x900 | ok |  toast on=false «» bag null → null disabled=true cursor=default |
| Q-Berry disabled button does nothing | /catalog/ | 1440x900 | ok |  toast on=false «» bag null → null disabled=true cursor=default |

## 7. axe-core

| page | size | scope | violations | incomplete | passes | tag colour / bg / ratio / size |
|---|---|---|---|---|---|---|
| efiopiya-bekele | 390x844 | section.next | 0 | color-contrast ×10 (bgGradient/imgNode) | 27 | rgb(127, 79, 201) on rgb(255, 255, 255): 5.43:1, 14.125px 700 |
| q-berry | 390x844 | section.next | 0 | color-contrast ×9 (bgGradient/imgNode) | 27 | rgb(127, 79, 201) on rgb(255, 255, 255): 5.43:1, 14.125px 700 |
| q-berry | 390x844 | .buybar--out | 0 | 0 | 3 | – |
| kolumbiya-dekaf | 390x844 | section.next | 0 | color-contrast ×9 (bgGradient/imgNode) | 27 | rgb(127, 79, 201) on rgb(255, 255, 255): 5.43:1, 14.125px 700 |
| efiopiya-bekele | 1440x900 | section.next | 0 | color-contrast ×14 (bgGradient/imgNode) | 27 | rgb(127, 79, 201) on rgb(255, 255, 255): 5.43:1, 15.9286px 700 |
| q-berry | 1440x900 | section.next | 0 | color-contrast ×13 (bgGradient/imgNode) | 27 | rgb(127, 79, 201) on rgb(255, 255, 255): 5.43:1, 15.9286px 700 |
| q-berry | 1440x900 | .buybar--out | 0 | 0 | 3 | – |
| kolumbiya-dekaf | 1440x900 | section.next | 0 | color-contrast ×13 (bgGradient/imgNode) | 27 | rgb(127, 79, 201) on rgb(255, 255, 255): 5.43:1, 15.9286px 700 |

## 8. Heading order in the block

- H2 H3 H3 H3 H3: 120 page×size runs
- H2 H3 H3 H3: 9 page×size runs
- page errors: 0; root font at @24 runs: 24px

## 2b. Photo cards (no pack): the white name over the photo

Each name line shot with its text hidden; WCAG contrast of the name colour (paper) against every pixel of the glyph band.

| photo card | size | pages | worst line: % of pixels < 3:1 vs the name | worst line: 5th-percentile contrast |
|---|---|---|---|---|
| vetnam-kua-mon | 1024x768 | 12 | 19.6 | 1.77:1 |
| peru-monte-verde | 1024x768 | 7 | 6.6 | 2.7:1 |
| peru-monte-verde | 390x844@24 | 1 | 4.8 | 3.04:1 |
| peru-monte-verde | 320x568 | 1 | 4 | 3.57:1 |
| peru-monte-verde | 768x1024 | 1 | 2.6 | 4.41:1 |
| peru-monte-verde | 1440x900 | 7 | 1.4 | 4.86:1 |
| peru-monte-verde | 280x653 | 1 | 0.8 | 5.62:1 |
| peru-monte-verde | 1366x650@24 | 1 | 0.4 | 5.59:1 |
| peru-monte-verde | 390x844 | 7 | 0.2 | 5.39:1 |
| peru-monte-verde | 1366x650 | 1 | 0.2 | 5.66:1 |
| vetnam-kua-mon | 390x844 | 12 | 0 | 19.3:1 |
| vetnam-kua-mon | 1440x900 | 12 | 0 | 19.3:1 |
| vetnam-kua-mon | 280x653 | 4 | 0 | 19.44:1 |
| vetnam-kua-mon | 320x568 | 4 | 0 | 19.3:1 |
| vetnam-kua-mon | 844x390 | 4 | 0 | 19.3:1 |
| vetnam-kua-mon | 768x1024 | 4 | 0 | 19.3:1 |
| peru-monte-verde | 844x390 | 1 | 0 | 5.88:1 |
| vetnam-kua-mon | 1366x650 | 4 | 0 | 19.44:1 |
| vetnam-kua-mon | 1920x1080 | 4 | 0 | 19.44:1 |
| vetnam-kua-mon | 390x844@24 | 4 | 0 | 19.3:1 |
| vetnam-kua-mon | 2560x1440 | 4 | 0 | 19.44:1 |
| peru-monte-verde | 1920x1080 | 1 | 0 | 5.17:1 |
| peru-monte-verde | 2560x1440 | 1 | 0 | 5.52:1 |
| vetnam-kua-mon | 1366x650@24 | 4 | 0 | 19.3:1 |
| keniya-kisii | all 12 sizes | 15 | 0 | ≥ 7.1:1 |

Shot: `shots/photo-name-vetnam-1024.png` (line 2 «КУА МОН» lies on the photo's white box).

## Problems, most serious first

1. **Name unreadable over the photo, 1024×768, four in a row** — `.card--dark .card__title` of **vetnam-kua-mon** (photo card, 223px wide): line 2 «КУА МОН» sits on the white box in the photo; 19.6% of that line's pixels are under 3:1 against the white name, 5th percentile 1.77:1. Happens on all 12 pages that offer this coffee. peru-monte-verde at 1024: 6.6%, 2.7:1 (on the patterned sweater); at 390@24 4.8%, 3.04:1. At 390, 1440, 2560 Vietnam's name is one line over black (19:1) and fine. Not caught by axe (it marks photo text "incomplete"). Medium: one card, one size band, but it is the card's name. The card has no top scrim for photos (`.card--dark` has only the bottom fade).
2. **Three in a row has no pack clearance** — `.next__grid` without `--4` at 1024×768 (card 304px; pages indoneziya-vonosalam → kolumbiya-el-plaser-ipa «Колумбия Эль Пласэр ИПА», kolumbiya-vush-vush → kolumbiya-la-sirena): the two-line name's box enters the still's box by 13.8px and the drawn bag by 1.9px (line boxes 0.9px); the name touches the bag's top edge (`shots/three-in-row-1024-*.png`). The margin rule `.next__grid--4 .card .pack` only covers four. Low–medium.
3. **Two-line names touch the bag on narrow phones** — 280×653: 7 cards (e.g. efiopiya-bekele → peru-palma-real, q-berry → q-finch) name box 10px into the still box, gap to the drawn bag −0.3px (touching, no glyph overlap); 390×844@24: 11.5px into the still box, gap 2.5px; 320×568: 3px, gap 8.3px. Low.
4. **Sold-out bar is tall on phones** — `.buybar--out` at 280×653 and 320×568: 131px (state stacked over the lead below the 22rem column) + 56px tab bar = 187px, 29% / 33% of the screen; at 390×844@24: 166px (+56 = 26%); at 390×844: 97px with the lead's name on 3 lines in a 213px cell. `--buybar-h` follows the measured height (131/97/166px), so the stage and toast keep clear. Low–medium (space, not breakage).
5. **No bar on screen at the top on short screens** — 844×390 and 1366×650@24 (`--short`, height < 32em; at 24px text 32em = 768px): the bar is `position: relative`, at the page's top only the pill says sold out. By the system's rule; a note.
6. **Cards taller than the screen** — 844×390: item 580–600px against a 390px screen; 1366×650@24: column 55rem (< 58rem) → two per row, card 654px wide, item 928–957px against 650px, block 2097–2125px. The whole card (name to buy row) is never on screen at once. Low.
7. **Targets under 44px (no failures under 24)** — `.fav` 40×40 on every card at every size; weight radios `.weight input` 62–66 × 34–36px from 43rem (78×43 at 1366@24). The name link's own box is 20px tall below 1024 (e.g. 81.9×20 at 280), but `.card__link::after` stretches it over the whole card (smallest 248×364 at 280), so it is not a real failure. buy__add ≥ 48px tall everywhere (≥ 111px wide), `.buybar__lead` ≥ 52px tall.
8. **Pill at 390×844@24** — `.pstage__out` wraps to two lines (358×43px, full column); with `border-radius: 999px` the ends are half-circles of ~21px against 12px padding, so «СКОРО» runs close to the curve. Cosmetic.
9. **Line breaks of the why-lines** — a separator «·» starts a line (768: efiopiya-bekele → «· мед, сушеный…»; 2560: «· тоже сушеный апельсин», «крем-/брюле»). Cosmetic.

## Fine

- Sideways scroll 0 on every run (/ and /catalog/ too); nothing in the block wider than the column; nothing in it scrolls (overflow) or is cut: `.card__text` unclamped (`line-clamp: none`, up to 7 lines at 1024 three-in-row), names up to 3 lines, tags, buy rows all with scrollHeight = clientHeight; no tag/card or text/buy overlap; buy cells never on the bag (the bag goes only under the buy row's fade).
- Four in a row (1024, 1366, 1440, 1920, 2560): pack margin-top 92 / 89 / 102 / 103px; three-line names at 1024 (Перу Пальма Реаль, Колумбия Чайна Альта, Бразилия Ранчо Гранде) keep 6.1px above the bag; at 1366–2560 names are ≤ 2 lines with ≥ 34.7px.
- Columns as specified: 1 below 43rem (280–390, 390@24), 2 at 768, 844, 1366@24, all in one row from 58rem (1024 up). Card tops and buy rows align across every row (spread ≤ 0.1px); only the why-line bottoms differ (≤ 61.7px), item heights equal.
- q-berry: pill under the name (gap 51–70px below the name box, 89px at 24px text), never over the pack (0 overlap with the hero pack's box); bar «НЕТ В НАЛИЧИИ / Скоро вернётся» + «Ближе всего / Q-FINCH (ФИНЧ БЛЕНД) / 680 ₽» → /coffee/q-finch/; first item tagged «БЛИЖЕ ВСЕГО». Q-Berry is the only sold-out coffee; no block or bar links to it or another sold-out coffee; every card href matches its slug.
- Clicks: picture, text and name open the card's coffee; the bag adds `{slug, weight:"200 г", qty:1, price}` to `qq-bag` and shows «… — в корзине», staying on the page; the bar's lead opens Q-Finch; Q-Berry's `button.buy__add` on / and /catalog/ is `disabled`, «Скоро вернётся», 177×49 / 217×56, a click changes nothing (bag null, no toast, same URL).
- axe-core: 0 violations on `section.next` and `.buybar--out` at 390 and 1440 (efiopiya-bekele, q-berry, kolumbiya-dekaf); "incomplete" only for text over gradients/photos. Lavender tag rgb(127,79,201) on white: 5.43:1 at 14–16px bold (passes AA).
- Headings: H2 then one H3 per card on every run (H2 H3 H3 H3 H3, or three H3 for three items); no page errors.
