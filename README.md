# QQ Coffee — the website

The site of QQ Coffee, a roaster of freshly roasted specialty coffee: the home page, the catalog and a page for every
coffee. A static site built with [Vite](https://vite.dev) into plain files in `dist/`; the pages are written from
templates and the price table, so the catalog and the 25 coffee pages share one set of components.

**Test link:** https://timofeylebedev.github.io/qq/ — built and published by GitHub Actions on every push to `main`
(once: Settings → Pages → Source: "GitHub Actions").

The rules Claude follows when working on the site are in [`CLAUDE.md`](CLAUDE.md). The size system, colours and
decisions are explained in [`design/README.md`](design/README.md).

```sh
npm install          # once (Node 22 or newer)
npm run dev          # the site at http://localhost:5173, reloads on every change (also of a template or the data)
npm run build        # the finished site in dist/
npm run preview      # dist/ at http://localhost:4173
npm run rules        # the rules of the system (colours, sizes, steps, motion, decisions)
npm run check        # validates the HTML of the built pages
npm run audit        # the built pages in a real browser at 11 screen sizes (needs `npx playwright install chromium`)
npm run images       # assets-src/img → src/assets/img (AVIF/WebP; commit the outputs)
npm run fonts        # assets-src/fonts → src/assets/fonts (pip install fonttools brotli)
node build/pack-still.mjs   # the still of the 3D pack (shown before WebGL draws, and without WebGL)
```

## Where things are

| Path | What it is |
| --- | --- |
| `data/products.csv` | the price table as exported (only rows with «На сайте» = «Да» reach the site) |
| `data/prices.json` | **placeholder** prices by price group and weight, until real prices exist |
| `data/site.json` | everything that is not a coffee: navigation, the home page's texts, which coffees each block shows, the roast schedule, the footer |
| `src/templates/` | the pages as functions: `layout.mjs` (head, navbar, footer), `components.mjs` (card, pills, taste chart, 3D slot, buy row), `home.mjs`, `catalog.mjs`, `product.mjs` |
| `src/styles/` | `base/` (tokens, fonts, layout), `components/`, `sections/` (home), `pages/` (catalog, product) |
| `src/scripts/` | one file per part: `main.js` starts them; `pouch3d.js` the 3D renderer, `packs.js` the packs' motion, `product.js` the product stage, `filters.js` the catalog |
| `design/` | `scale.json` (every size), `colors.json` (every colour), `decisions.json` (every exception and stand-in) |
| `build/` | `data.mjs` (CSV → products.json), `pages.mjs` (templates → HTML), `tokens.mjs`, `rules.mjs`, `audit.mjs`, `images.mjs`, `fonts.py`, `pack-still.mjs`, the Vite plugins |
| `public/pack/` | the 3D pack: mesh, effect maps, label art (fetched by the page) |
| `public/lab/3d-pack.html` | the 3D pack test bench (look sliders, a 24–200 pack stress test) |
| `docs/3d-pack-notes.md` | how the 3D pack is built |
| `assets-src/` | originals of the pictures and fonts (not published) |

Generated and not committed: `src/index.html`, `src/catalog/`, `src/coffee/` (by `build/pages.mjs`) and
`src/data/products.json` (by `build/data.mjs`). Edit the templates and the data instead.

## Changing things

- **A coffee:** in the price table, export it as `data/products.csv`. Prices: `data/prices.json` (or a price column).
- **Its label on the 3D pack:** `public/pack/labels/<name>-front-512.webp` (and `-back-`, and `-1024`), then `art` in `build/data.mjs`.
- **A text of the home page, the navigation, the footer, the roast schedule:** `data/site.json`.
- **A size:** `design/scale.json` (two numbers: at a 320 and at a 1440 screen). **A colour:** `design/colors.json`.
- **A picture:** the original into `assets-src/img` under the same name, `npm run images`, commit the outputs.
- **Something decided on purpose** (an exception to a rule, a stand-in): `design/decisions.json`.

## Status

Home, catalog and coffee pages are built and checked (rules, HTML, the audit at 11 sizes). Not built yet: the bag and
checkout, search, favourites page, account, the other categories (cascara, drips, sets, merch), the journal, the
business pages, the mobile menu's design, the animated footer logo. Placeholders (prices, photos, the 3D label, the
roast schedule) are listed in `design/decisions.json` with what replaces each.
