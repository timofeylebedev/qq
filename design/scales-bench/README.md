# The bench of the card's taste scale

Five forms of a small taste scale in the catalogue's cards, in place of «Плотность 3 из 5. Кислотность 3 из 5.» (row 14
of the marketing list), on all 25 coffees in the site's grid at 360 / 390 / 768 / 1280, and «все»: the five side by
side for six coffees that span the range. Session 3 of choosing coffee. Published as an artifact:
https://claude.ai/artifact/Ki2nLqBTaqmtiU2jrzwnJa

- `forms/<id>.js` + `.css`: bars «Полоски», line «Точка на линии», dots «Точки страницы», words «Словами», map
  «Мини-карта»; `notes.js`: their ideas, axes, costs, the verdicts and the pick.
- Chosen: «Точка на линии», built on the site as `tasteScale()` in `src/templates/components.mjs` (decision `card-scale`).
- The build reads `src/data/choose.json` (build/choose.mjs, which came with the catalogue's pull request).

Rebuild and republish: `npm run choose && node design/scales-bench/build.mjs`, then publish every file of `out/`.
