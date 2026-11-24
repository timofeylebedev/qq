# The catalogue in a browser, at the audit's sizes

Outside check of session 3: the catalogue's way to choose measured in Chromium (Playwright,
`/opt/pw-browsers/chromium-1243`) on the built site, at the twelve sizes of `site-kit.config.mjs` `audit.sizes`, phones
first, after the fixes of the outside check (24 Nov 2026, commit 5f0f078). Seven states each: nothing chosen;
`?method=moka&chip=soft`; `?method=pourover&chip=milk`; no match (`?acid=soft&taste=berry&country=Бразилия`, which opens
«Ещё фильтры»); the map open with a region (`?region=mid-mid`); the map open and a dot tapped (`?chip=unusual`, Кения
Кисии); «Ещё фильтры» open (`?country=Кения`). The numbers are px from the bottom of the category tabs to the top of the
first thing in the grid (a head or a card): how far the controls push the coffee down. Before this session, with
nothing chosen: 233 at 390, 233 at 1280 (the seven filter cells).

| Size | Nothing chosen | Гейзер + мягкая | Воронка + молоко | No match | Map open | Map + a dot | Ещё фильтры open | Chip rows | Map, dot | Sideways | axe (main) |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 280×653 | 451 | 647 | 618 | 1110 | 880 | 976 | 1014 | 4 | 248×225 · 21px | no | — |
| 320×568 | 451 | 580 | 547 | 1058 | 797 | 994 | 962 | 4 | 288×262 · 24px | no | color-contrast(1): a[href$="#kofe"] |
| 390×844 | 267 | 421 | 392 | 720 | 751 | 877 | 624 | 2 | 354×322 · 30px | no | — |
| 390×844 @24px | 497 | 674 | 703 | 1297 | 1072 | 1196 | 1201 | 4 | 358×325 · 30px | no | color-contrast(1): a[href$="#kofe"] |
| 844×390 | 182 | 243 | 243 | 396 | 656 | 782 | 396 | 1 | 448×407 · 37px | no | — |
| 768×1024 | 170 | 258 | 278 | 415 | 671 | 799 | 415 | 1 | 448×407 · 37px | no | — |
| 1024×768 | 180 | 268 | 268 | 366 | 681 | 810 | 366 | 1 | 448×407 · 37px | no | — |
| 1366×650 | 175 | 264 | 264 | 361 | 676 | 804 | 361 | 1 | 448×407 · 37px | no | — |
| 1366×650 @24px | 178 | 275 | 275 | 391 | 889 | 1034 | 391 | 1 | 672×611 · 56px | no | color-contrast(5): a[href$="#kofe"], li:nth-child(3) > a[href$="#kaskara"] |
| 1440×900 | 194 | 283 | 283 | 383 | 696 | 826 | 383 | 1 | 448×407 · 37px | no | color-contrast(5): a[href$="#kofe"], li:nth-child(3) > a[href$="#kaskara"] |
| 1920×1080 | 195 | 285 | 285 | 322 | 697 | 828 | 322 | 1 | 448×407 · 37px | no | — |
| 2560×1440 | 195 | 285 | 285 | 322 | 697 | 828 | 322 | 1 | 448×407 · 37px | no | — |

- **No sideways scroll** in any of the 84 runs. No console errors (one run at 2560 hit a rebuild of `dist/` mid-run
  and was run again).
- **Chips** are 44px tall everywhere; they take 2 rows at 390, 4 at 280–320 and at 390 with 24px text, 1 from 768.
- **Map dots**: 8.4% of the map's width: 24px at 320, 30px at 390, 31px from M (the map stops at 28rem), 47px with
  24px text. At 280 they are 21px, under the 24px target (WCAG 2.5.8): a known limit, written in `docs/choose.md`.
  The first layout (7% dots) gave 20px at 320, which axe flagged (`target-size`); fixed.
- **axe** (wcag2a/aa, 2.1aa, 2.2aa, on `main`, at 320, 390 and 1366 with 24px text, 1440): the only violations are
  the category tabs' ink-30 (`color-contrast` on «Кофе», «Каскара»…), decision `tabs-30`, as on `main`. Nothing from
  this session.
- **Taps** from nothing to "a moka pot, soft acidity": «Чем варите → Гейзерная кофеварка» (a menu: 2 taps), then
  «Мягкая кислотность»: 3 taps in all; the bench's chip row did it in 2 but showed 3 of 8 methods on a phone.
- The «outside» options the script reported at 390 and 768 belong to the closed «Обработка» menu: Chromium lays out a
  closed `<details>`' content without painting it; opened, `menus.js` turns the list leftwards (no sideways scroll).

The card's taste scale (the other pull request) was measured the same way: `docs/scales-check.md` there.
