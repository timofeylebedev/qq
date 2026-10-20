# QQ Coffee — the website

The site of QQ Coffee, a roaster of freshly roasted specialty coffee: the home page, the catalog, a page for every
coffee, the bag, the favourites and the checkout, the account, and the pages for business, questions and answers,
delivery and payment, contacts, the privacy policy and about the company. A static site built with [Vite](https://vite.dev) into plain files in `dist/`; the pages are written from
templates and the price table, so the catalog and the 25 coffee pages share one set of components.

**Test link:** https://timofeylebedev.github.io/qq/ — built and published by GitHub Actions on every push to `main`
(once: Settings → Pages → Source: "GitHub Actions").

The rules Claude follows when working on the site are in [`CLAUDE.md`](CLAUDE.md). The size system, colours and
decisions are explained in [`design/README.md`](design/README.md).

```sh
npm install          # once (Node 22 or newer)
npm run dev          # the site at http://localhost:5173, reloads on every change (also of a template or the data)
npm run canvas       # the component canvas at http://localhost:5173/lab/canvas/ (dev server only, never published)
npm run canvas:check # the canvas in a real browser: every variant there, the camera, clicks and keys at any zoom
npm run build        # the finished site in dist/
npm run preview      # dist/ at http://localhost:4173
npm run rules        # the rules of the system (colours, sizes, steps, motion, decisions)
npm run check        # validates the HTML of the built pages
npm run audit        # the built pages in a real browser at 12 screen sizes (needs `npx playwright install chromium`)
npm run images       # assets-src/img → src/assets/img (AVIF/WebP; commit the outputs)
npm run fonts        # assets-src/fonts → src/assets/fonts (pip install fonttools brotli)
node build/pack-still.mjs   # the still of the 3D pack (shown before WebGL draws, and without WebGL)
```

## Where things are

| Path | What it is |
| --- | --- |
| `data/products.csv` | the price table as exported (only rows with «На сайте» = «Да» reach the site) |
| `data/prices.json` | **placeholder** prices by price group and weight, until real prices exist |
| `data/site.json` | everything that is not a coffee: navigation, the home page's texts, which coffees each block shows, the roast schedule, the footer, delivery prices (`shop`) |
| `data/business.json`, `about.json`, `faq.json`, `privacy.json`, `company.json` | the texts of the information pages; the company's places and legal details (the contacts block of three pages) |
| `data/account.json` | **placeholder** visitor of the account pages and their orders (every number on the account is worked out from them) |
| `src/templates/` | the pages as functions: `layout.mjs` (head, navbar, footer), `components.mjs` (card, pills, taste chart, 3D slot, buy row), `blocks.mjs` (page head, tabs, tiles, form cells, the dark panel, dialogs, contacts), `home.mjs`, `catalog.mjs`, `product.mjs`, `shop.mjs` (bag, favourites, checkout), `account.mjs` (+ `account-data.mjs`), `info.mjs` (business, FAQ, delivery, contacts, privacy, about) |
| `src/styles/` | `base/` (tokens, fonts, layout), `components/` (+ `blocks.css`, `forms.css`), `sections/` (home), `pages/` (catalog, product, shop, account, info) |
| `src/scripts/` | one file per part: `main.js` starts them; `pouch3d.js` the 3D renderer, `packs.js` the packs' motion, `product.js` the product stage, `filters.js` the catalog, `cart.js` and `favs.js` the bag and the favourites, `checkout.js` its steps, `ui.js` dialogs, tabs, copy, ratings |
| `design/` | `scale.json` (every size), `colors.json` (every colour), `decisions.json` (every exception and stand-in), `countries.json` (outlines of the coffee countries for the account) |
| `build/` | `data.mjs` (CSV → products.json), `pages.mjs` (templates → HTML), `tokens.mjs`, `rules.mjs`, `audit.mjs`, `images.mjs`, `fonts.py`, `pack-still.mjs`, the Vite plugins |
| `public/pack/` | the 3D pack: mesh, effect maps, label art (fetched by the page) |
| `public/lab/3d-pack.html` | the 3D pack test bench (look sliders, a 24–200 pack stress test) |
| `src/lab/canvas/` | the component canvas: `variants.mjs` (what it shows: groups, sample data, what is left out), `page.mjs` (writes the page), `canvas.js` (layout and camera), `check.mjs` |
| `docs/3d-pack-notes.md` | how the 3D pack is built |
| `assets-src/` | originals of the pictures and fonts (not published) |

Generated and not committed: `src/index.html`, `src/catalog/`, `src/coffee/` and the other page folders (`business/`,
`faq/`, `delivery/`, `contacts/`, `privacy/`, `about/`, `cart/`, `favourites/`, `checkout/`, `account/`: by `build/pages.mjs`),
`src/data/products.json` (by `build/data.mjs`) and `src/lab/canvas/*.html` (by `src/lab/canvas/page.mjs`). Edit the templates and the data instead.

## Changing things

- **A coffee:** in the price table, export it as `data/products.csv`. Prices: `data/prices.json` (or a price column).
- **Its label on the 3D pack:** `public/pack/labels/<name>-front-512.webp` (and `-back-`, and `-1024`), then `art` in `build/data.mjs`.
- **A text of the home page, the navigation, the footer, the roast schedule, delivery prices:** `data/site.json`.
- **A text of an information page:** `data/business.json`, `faq.json`, `about.json`, `privacy.json`; addresses, phones, legal details: `data/company.json`.
- **A new page:** a template function, then its address in `PAGES` of `build/pages.mjs` (and in `.gitignore`, the dev server's `ignored` in `vite.config.js`, `check` in `package.json`, `PAGES` of `build/audit.mjs`).
- **A size:** `design/scale.json` (two numbers: at a 320 and at a 1440 screen). **A colour:** `design/colors.json`.
- **A picture:** the original into `assets-src/img` under the same name, `npm run images`, commit the outputs.
- **Something decided on purpose** (an exception to a rule, a stand-in): `design/decisions.json`.
- **A new component or variant on the canvas:** a group in `src/lab/canvas/variants.mjs` (one prop compared at a time).

### The component canvas

Every component and page block on one surface you pan and zoom, each variant beside the others: pills, the taste
chart, the 3D pack, cards, section heads, buttons, then the navbar, hero, new arrivals, recommended, image blocks,
business, facts, footer, catalog, product stage, buy bar, product story and similar coffees. The parts are cut out of
the real rendered pages, so it shows exactly what the templates make, with the site's own scripts running (the packs,
sliders, filters, buy row). The navbar and the product stage run on screens of their own (iframes 390, 768 and 1440
wide), as they depend on the page's width and scroll.

Drag empty space (or Space + drag, or the middle button) to pan, Ctrl/⌘ + wheel or a pinch to zoom; on the canvas
itself the arrows pan, + and − zoom, 1 fits all and 0 resets. Links to another part of the canvas move the view there;
links that would leave it are not followed (Ctrl/⌘-click opens them). Only the view is saved, in this browser.
«В корзину» and the heart work as on the site and keep their bag in this browser's storage of the dev server.

## Browsers

Chrome and Edge 111+, Safari and iOS 16.4+, Firefox 121+: the layout relies on container queries and `:has()`
(the build targets in `vite.config.js`). Without WebGL the packs are stills.

## Status

Home, catalog, coffee pages and the pages of round 3 (bag, favourites, checkout, account, business, FAQ, delivery,
contacts, privacy, about) are built and checked (rules, HTML, the audit at 12 sizes). There is no shop behind them yet:
the bag and favourites live in the visitor's browser, the checkout and the forms send nothing, the account shows a
placeholder visitor. Not built yet: search, offices, the other categories (cascara, drips, sets, merch), the journal,
the 404 page, sign-up and letters, the mobile menu's design, the animated footer logo. Placeholders (prices, photos, the 3D label, the
roast schedule) are listed in `design/decisions.json` with what replaces each.
