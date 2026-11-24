# The bench of the catalogue's way in

Four forms of choosing among QQ's 25 coffees, side by side on the real data (src/data/choose.json), at 360 / 390 / 768
/ 1280, each opened in the same starting state (nothing, «гейзер», «без яркой кислотности», «воронка + под молоко»,
«автомат + необычное», «ягоды + мягкая» with no exact match, «Кения»). Session 3 of choosing coffee. Published as an
artifact: https://claude.ai/artifact/6VaiD1zwsYtAoeqQWy212X

- `forms/<id>.js` + `.css`: one form each (chips «Два ряда», map «Карта вкуса», shelves «Полки», sentence «Фраза»), drawn
  by separate agents from one brief; each registers with `QQBench.register({ id, name, idea, notes, render })`.
- `page.html`: the shell (widths, starting states) and `ctx` (the data, `rank`, `conditions`, a simplified card);
  `base.css`: the site's tokens and the bench's card; `notes.js`: the verdicts and the pick.
- The ranking is the site's own (src/scripts/choose.js, copied in as `choose.js`).
- The forms were drawn when the map had two shapes and 7% dots; the build passes the one shape to both (`map.tall`,
  `map.wide`), so the map form now draws the site's 8.4% dots.

What was built on the site: `docs/choose.md` (decision `catalog-choose`).

Rebuild and republish: `npm run choose:bench`, then publish every file of `out/` to the same artifact.
