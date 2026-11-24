# The bench of «Что взять дальше»

Five forms of the block on a coffee's page, side by side on the real data (any of the 25 coffees, in stock or sold out,
at 360 / 768 / 1280), for Tim to compare. Session 2 of choosing coffee. Published as an artifact:
https://claude.ai/artifact/A1vr3XE1SZDXQYhQRCmqWq

- `forms/<id>.js` + `.css`: one form each (row, switch, compass, sentences, compare), drawn by separate agents from
  one brief; each registers with `QQBench.register({ id, name, idea, notes, render, bar })`.
- `page.html`: the shell (coffee, sold out, width); `base.css`: the site's tokens for the forms; `notes.js`: the
  verdicts and the pick («Советы фразами», built on the site as `next()` in `src/templates/product.mjs`).
- The data is the taste model's `next` (build/taste.mjs `nextBlock`), as on the site.

Rebuild and republish: `npm run taste && node design/next-bench/build.mjs`, then publish every file of `out/` to the
same artifact (index.html, base.css, data.js, notes.js, pack.webp, fonts/*, forms/*).
