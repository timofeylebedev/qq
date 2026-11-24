# The bench of the people block

Four forms of reviews + named picks + writing a review on a coffee's page, side by side on the same placeholder data
(any of the 25 coffees, a pretend visitor whose taste is known or not, at 360 / 768 / 1280), for Tim to compare.
Session 5 of choosing coffee. Published as an artifact (link in `claude/choosing-coffee-plan.md`, session 5).

- `forms/<id>.js` + `.css`: one form each (shelf, method, cups, map); method, map and shelf were drawn by separate
  agents from one brief (`BRIEF.md`), cups by the session. Each registers with
  `QQBench.register({ id, name, idea, notes, top, render, write })`.
- `page.html`: the shell (coffee, visitor, width; three stages per form: the line under the name, the block, the
  review form). `base.css`: the site's tokens. `kit.js`: helpers and the data's fields. `notes.js`: order, verdicts,
  the pick («Полка», built on the site as `people()` in `src/templates/product.mjs`).
- The data is `src/data/people.json` (`build/people.mjs` from the placeholders in `data/people.json`), as on the site.

Rebuild: `npm run people:bench`, then publish every file of `out/` to the same artifact.
