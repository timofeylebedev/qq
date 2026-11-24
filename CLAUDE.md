# CLAUDE.md — working on the QQ Coffee site

Read this before changing anything. `README.md` is the human how-to; `design/README.md` explains the system. The
project's notes for the claude.ai project "QQ" are in its doc `claude/website-system.md`.

## The project

- The site of QQ Coffee (a roaster of specialty coffee): home, catalog, a page per coffee; the bag, favourites, checkout,
  account (a placeholder visitor) and the information pages (round 4). Static, Vite, Russian; no shop behind it yet.
- `main` is the test site: every push builds and publishes to https://timofeylebedev.github.io/qq/ (`deploy.yml`).
- **Every pull request gets a preview:** the same workflow publishes it to
  `https://timofeylebedev.github.io/qq/pr-preview/pr-<number>/`, posts the link as a comment on the PR, updates it on
  every push and removes it when the PR is closed. Pages serves the `gh-pages` branch: the site at its root, the
  previews in `pr-preview/`. Give Tim the preview link in the PR description.
- **site-kit** (https://github.com/timofeylebedev/site-kit): Tim's shared kit for his sites. The checks, the review
  page, the audit, the lessons learned as code rules and the CI workflows are the kit's; what is particular to QQ is in
  its adapter, `site-kit.config.mjs` (pages, sizes, palette groups, probes, scenarios, QQ's rules, audit, report blocks).
  The kit is pinned to a release tag (now `v0.1.2`) in two places: `package.json` (`"site-kit": "github:timofeylebedev/site-kit#v0.1.2"`)
  and the `uses: …@…` lines of `.github/workflows/`. Raise both together, on purpose, in a PR of its own. A change to
  the kit's code goes in a site-kit PR, never into `node_modules/`. The kit's own lessons: `node_modules/site-kit/AGENTS.md`.
- **The review page of the design system** (every colour, size, step, rule, finding, decision, question, and the review
  rounds of `design/report/data.json`): site-kit's page, built by `npm run report` into `.site-kit/report/` (open its
  `index.html`), published at https://timofeylebedev.github.io/qq/report/ (CI builds it on every deploy). The older
  per-round pages (skill `full-system-report`, links in `design/report/README.md`) stay where they are.
- **The checks of the design system** (site-kit checks; QQ's settings in `site-kit.config.mjs`): every rule measured in
  a browser on every deploy (job `checks` of deploy.yml, after the site is out; on a PR only when a design file changed,
  or with the label `checks`): findings, decisions that cover them, questions for Tim and «what needs you», in one
  `state.json` (live: `…/qq/report/state.json`; history on the `report-data` branch, never edited by hand). Read it at
  the start of design work. `npm run checks` runs it locally after a build (records in `.site-kit/out/`). The home page,
  the catalog and two coffee pages are measured at every size (`measure: true` in the adapter); every page's head,
  links and sideways scroll are checked. Tim answers a question with a button on the report that copies
  «QQ answer · <id>: <answer>»; record it with `npx site-kit checks answer <id> "<answer>" ["note"]` in the PR it leads to.
- Owner and reviewer: Tim (timofeylebedev). Talk to Tim in the language he writes in.
- Design: Figma https://www.figma.com/design/xwaKVTaFLFNc2yhMfsB5us/QQ-website — pages «Главная» (the most complete,
  frame [1280 — 1439]), «Каталог», «Продукт» (frame [1440 — 1919]); round 4 used the [1440 — 1920] frames of «Корзина»,
  «Избранное», «Оформление заказа», «Профиль», «Заказы», «Заказ», «Покупки», «Зернышки», «Настройки», «Бизнесу»,
  «Вопросы и ответы», «Доставка и оплата», «Контакты», «Политика конфиденциальности», «О компании». Figma is
  inspiration, not values: the site has its own fluid system, and only a few Figma frames are responsive. Older Figma
  pages use older colours and details: follow the system, not the frame (decision `older-colours`).

## How to work

- **Never commit to `main`.** A branch, a pull request, Tim reviews and merges. One topic per PR; say what changed,
  what was measured and what Tim should look at.
- Commit as `timofeylebedev <49580438+timofeylebedev@users.noreply.github.com>`.
- Before a PR: `npm run rules && npm run build && npm run check && npm run audit`. CI runs them too (`npm run rules`
  and `check` in the site job of deploy.yml, the audit in audit.yml: Chromium fails on problems, Firefox and WebKit
  only warn).
- Measure, don't guess: numbers in PRs come from a browser (Playwright), not from reading the CSS.
- For a larger round Tim gets an independent review: a separate agent that has not seen the work re-checks it;
  its findings are fixed in a commit "Fixes from the independent review".
- A design-system round ends with the full system report (skill `full-system-report`): a new page each round (the
  earlier ones stay where they are), always the whole system. Links in `design/report/README.md`.
- Anything decided on purpose (an exception, a stand-in) goes into `design/decisions.json`. When it covers what a check
  finds, bind it: `"checks": [{ "rule": "<id>", "match": "<regex>", "band": [least, greatest] }]` (site-kit's
  checks/README.md): the check then accepts it and brings it back when its value moves.
- A question for Tim that a check cannot answer (a look on his iPhone, a choice) goes into `design/questions.json` (with
  the files it is about): the review page shows it with answer buttons.

## Rules in the code (build/rules.mjs checks them)

`npm run rules` runs build/rules.mjs (it fails on a broken rule, also in CI), then `site-kit rules`: the same twelve
rules as the review page shows them (`qq.*`, read from `build/rules.mjs --json` by the adapter's `rules.code`) and the
kit's lessons (`code.learn.*`: they report, and fail a PR only once the site job's `rules-strict` is on).

- **Sizes** come from `design/scale.json` only: a value at 320 and at 1440, a straight line between, the screen's
  height counting through `--vp`. No `vw`/`vh`/`cqi` in the styles except in rules a decision lists (`css` field).
  Font sizes are `var(--type-*)`. Both ends of a role sit on the ladder; type levels in `relations` stay ×1.125 apart.
- **Colours** from `design/colors.json` only (`--c-*`). Secondary text is `--c-ink-70` (`--g-soft` of the ground); ink-60 only for large
  text; ink-30 only for the catalog's inactive tabs (decision `tabs-30`).
- **Layout steps**: container queries on the column `col` at S 22rem, M 43rem, L 58rem (and `max` 1520px: the column at
  its most, for a frame). Blocks that run full width (hero, image blocks, facts, footer, buy bar) put their content in a `.col` so they change with everything else. A
  container query cannot style its own container: wrap (`<div class="col"><div class="block">`). Page steps only
  through `media.css` (the navbar's `--links-full` 70em and `--links` 48em, the tab bar's `--phone` under 40em, `--short`
  32em tall for the product's buy bar, `--framed` 1616px: every rule of the container step max is repeated under it,
  because Safari zoomed out measures container queries in its own units). Fixed bars stand on the tab bar: `bottom: var(--tabbar-h)` (0 without one).
- **Grounds**: every section has `data-ground` (paper, cloud, black, ink); colours on it come from there (`--g-bg`,
  `--g-fg`, `--g-soft`, `--line`, `--tint`), and the navbar and tab bar follow the section under them (`scripts/nav.js`). A block on
  another ground inside a section (the dark panel, a cloud form, a photo) says `data-tone` instead: the same colours,
  painted by the block, but the bars do not follow it.
- **One line colour**: every border is `var(--line)` (ink-20 on light grounds, white-30 on dark); states may use ink.
  The footer has no line above it; a section whose own lines run down to it closes itself with a hairline (the home's
  facts: decision `footer-no-line`).
- **Navbar links** go only to pages that exist; an item without a page is `<a>` without `href` (data/site.json nav).
  The hero's and the footer's links are not under this rule yet (a question to Tim, round 2).
- **Grammar**: no rounded corners (pills and dots only); cells divided by hairlines (`--hair`, `--line`); mono bold
  capitals (PT Mono Bold) for names and headings, Apercu for text; one hover timing (`--t-in` 0.2s in, `--t-out` 0.45s out) and the
  curves of `motion.css`; a hover tints only its own item (`--tint`: white on dark grounds, ink on light) and never
  moves anything (no transform in a `:hover` rule: «Hovers never move»; the one exception, the photo of a card coming a
  little closer, is decision `hover-zoom`, its selectors in its `hover` field). Titles of the h2 role are trimmed
  (`text-box: trim-both cap alphabetic`). A pointer's focus changes nothing; scripts
  that move the focus use `focusFrom()` of `scripts/focus.js` (the ring only after a key).
- **Every fade is eased and whole**: a gradient is a `var(--fade-*)` of `design/colors.json` fades (one per place:
  hero, top, caption, panel, card; one curve, 0.5, 0, 0.5, 1, in 16 stops, tuned in `design/fade-tuner/`) laid over the whole block, with no
  solid band under it; or a solid band for a line. Never a hand-written transparent → colour.
- **Lines run out**: below the column's max, the hairlines between a full-width block's cells run to the screen's
  edges (a positioned line with `--out-l` / `--out-r` = `--gutter`); from the max the block is framed instead. The
  hero goes further: its cells themselves reach over the gutters (`--bleed`) and each is padded by the gutter on both
  sides (Tim, round 6: a cell's padding is its own, never a higher box's).
- **The card's taste scale** (`tasteScale()` in components.mjs; decision `card-scale`): every card ends with three
  rows, a dot on a line between the taste model's words, the line QQ's own range; positions from taste.json, never
  computed in a template; no sweetness, no «Горечь», no «Оценка Q». The card's text no longer says «… из 5».
- **Photos** on cards only for Special coffees (`photoOf` in `components.mjs`; decision `photos-in-catalog`).
- **A whole card is its link**: the name's link is stretched (`::after`) over `.card`; nothing between them may be
  positioned (the picture's layers share one grid cell). The heart and the buy row sit above it (z-index 7).
- **Every row that scrolls sideways is `position: relative`** (else positioned children escape its clip and the page
  scrolls sideways).
- **3D**: one canvas per page at z-index 5. While the product's pinned pack is on screen the canvas is fixed to the
  screen (`stage.fixed`, else it would ride a scroll for a frame); the pack turns exactly with the scroll and can be
  dragged (it turns back on release: decision `pack-drag`). What must show above packs is positioned with z-index ≥ 6 (fact tiles,
  captions); the navbar 50, the buy bar 20. A pack inside a `[data-slider]` row is clipped to it.
- **Page transitions**: `public/vt.js` (a plain script in `<head>`, not bundled) names a card's name and pack for the
  cross-document view transition to its coffee's page (on that page the name and the line under it, `.pstage__title`).
  Leaving, `qqPacks.freeze()` leaves a picture of every pack as the canvas draws it (`stage.shot`); arriving, packs
  face front until the pages have changed. A still must stand exactly where the canvas draws its pack (rerun
  `build/pack-still.mjs` when the model or the look changes). `data-out` is the catalog filter's; the reel's and the catalog's waiting
  cards are `data-wait` (on a reload or a step back the cards in view do not rise again; the catalog's rise one after
  another: `riseGrid` in `scripts/slider.js`, `html[data-enter]`).
- **New arrivals turn like pages** (`scripts/curl.js`, «Изгиб» of Tim's artifact): the slides lie in one cell
  (`data-off` + inert but the current one), the sheet is WebGL with faces painted from the slides as laid out; a
  spread from L, one page below. `qqCurl.hold(to, p)` on the track stops a turn for review.
- **Pages** are written by `build/pages.mjs` from `src/templates/`; never edit `src/index.html`, `src/catalog/`,
  `src/coffee/` or the other page folders (generated, not committed). Links inside the site go through `href(ctx, to)`;
  an anchor of the same page that is not the home page is written as is (`#contacts`), not through `href`.
- **Shared blocks** of the new pages are in `src/templates/blocks.mjs` (page head, tabs, tiles, form cells, the dark
  panel, dialogs, contacts, the menu cell of the filters and the buy bar: `menu`, `scripts/menus.js`): reuse them before writing new markup. The bag and the favourites are written by their
  scripts before the 3D packs start (`main.js`), so their packs are drawn; a change of layout dispatches `qq:layout`.
- **The countdown's digits** are QQ Digits drawn as SVG (`build/digits.mjs` from `design/digits.json`, Tim's settings
  from the artifact «QQ Digits»); `scripts/digits.js` lights the segments. Change the drawing in the JSON, not the SVG.
- **The hero's entrance** is GSAP (`scripts/hero.js`, loaded only on the home page): `html[data-intro]`, set by the
  inline script in `<head>`, hides its parts from the first frame. Its numbers are `design/intro.json` (tuned in the
  artifact «QQ Intro Tuner», `design/intro-tuner/`); `window.qqHero` is the timeline, `qqIntro.play(settings)` plays it.
- **The heroes' video** (home, about): `heroVideo()` in `src/templates/util.mjs`, files from `npm run video` (`build/video.mjs`; the original in `source/`, outside the repo); `scripts/video.js` plays it only on screen, never with «reduce motion» (decision `hero-video`).
- **Icons**: `<svg data-icon="name">` → a sprite per page (`build/plugins.js`). Parts of an icon cannot be styled
  inside `<use>`: two states are two icons (`heart` / `heart-fill`).
- **The taste model** (`build/taste.mjs` → `src/data/taste.json`; `docs/taste-model.md`): every surface that says
  which coffees are alike or offers a step (brighter, softer, denser, lighter, more unusual, more classic) reads it,
  and no new one scores similarity on its own (the account's `forYou()` still does, until session 5 or 6). Never rank or boost by «Оценка Q»; never offer a relabel of the same green coffee
  or a decaf for a coffee with caffeine (the build fails if it does). The data is cleaned in the build, never by hand
  in `data/products.csv`; a new descriptor gets its family in `data/flavours.json`, which also colours its dot.
- **«Что взять еще»** (a coffee's page, `next()` in `src/templates/product.mjs`): the taste model's moves for that
  coffee (`next` in taste.json, `nextBlock` in build/taste.mjs; every coffee's list in `docs/next-output.md`): похожий,
  мягче, ярче, необычнее or классичнее, as product cards in a grid, each under its move in lavender and with
  one line from the data as its text (`card()` option `text`). Never a second scoring in the template: a new move or
  rule goes into `nextBlock`, which also never offers a sold-out coffee. **Sold out** = `data/site.json`
  `shop.unavailable`: the page stays, a pill under the name says it will be back, the buy bar (`buybar--out`) offers
  the nearest coffee in stock, the block begins with it («Ближе всего»), and cards show a disabled «Скоро вернётся». Tim chose the form on the bench `design/next-bench/` (decision
  `similar-coffees`).
- **Texts**: write them normally; site-kit's typesetter (`site-kit/typeset/vite` in vite.config.js; settings: `typeset`
  in site-kit.config.mjs, none so far) decides where lines may break (no-break spaces, word joiners, `<wbr>` in long
  links) by each text's `lang`, and never changes a visible letter: `npx site-kit typeset --lint src/index.html` lists
  what a proofreader would fix (`node_modules/site-kit/typeset/README.md`). The hero's title is split into lines only
  (GSAP SplitText keeps the holds); a heading split letter by letter must be named in `typeset.spacesOnly`. Keep links
  and other tags out of split headings: a hold at a tag's edge is lost in every split. The display headings where a
  held piece is wider than the column at 280–320px (or with 24px text) say so: the story titles `data-typeset="off"`
  with the holds that fit typed as no-break spaces in data/site.json (not «Как⍽мы⍽раскрываем»), the business page's
  «Почему кофейни выбирают нас» `off` (`head({ typeset })`: its one hold, «выбирают⍽нас», was 3px wider than the
  screen at 390 with 24px text), the product's name `data-typeset="spaces"` (no joiner in «Q-Optimistic»).
- **CSP**: the build writes a strict policy (`build/plugins.js` POLICY). Fonts and pictures are files, never data URIs
  (`assetsInlineLimit: 0`).
- **Styles before scripts**: `main.js` waits for every stylesheet (`stylesReady()` of `site-kit/runtime/styles.js`) before
  it starts anything (Safari may run a module first: WebKit bug 261655); never read a computed colour or size once and
  write it inline for good. A window `load` listener is `whenLoaded(fn)` (`site-kit/runtime/loaded.js`): a module that
  starts late comes after `load`.
- **Scrolling**: never read `window.scrollY`, listen to the window's `scroll` or scroll the window in new code: use
  `src/scripts/scroller.js` (site-kit's: `y()`, `to()`, `by()`, `height()`, `max()`, `onScroll()`, `watchSize()`, `ioRoot`,
  `box`, `target.scrollTo` for a smooth one). `public/vt.js`, a plain script, asks the box itself. In Safari 26+ on a Mac
  the page scrolls inside its own box (`html.boxed`, `<div class="page" data-page>` around everything in `<body>`:
  `src/templates/layout.mjs`), so Safari's top bar stays solid; `site-kit/runtime/box.js` decides it, inlined first in
  every `<head>` (`inlineScripts` in build/plugins.js), and `?qqbox=1` / `?qqbox=0` turn the box on or off in any
  browser. In the box the navbar is sticky, not fixed (`src/styles/base/safari.css`), the 3D canvas is inside the box,
  and an IntersectionObserver with a `rootMargin` takes `root: ioRoot`. `.bar-guard` (site-kit/runtime/safari.css: an
  empty fixed block that takes taps) keeps Safari's bottom bar on iPhone plain glass; never give it a background or a
  backdrop filter. Whether it does so over QQ's own tab bar is Tim's iPhone's to say (design/questions.json).
- **WebGL only on a real GPU**: `pouch3d.js` and `curl.js` take their context through `gpuContext()` of
  `site-kit/runtime/gpu.js`. Without a real GPU (Chrome copies a WebGL canvas back to the processor every frame) the
  packs keep their stills and the new arrivals change without a turn; `?qqgl=1` forces WebGL (tests; build/pack-still.mjs
  forces it too).

## The component canvas (`src/lab/canvas`, `npm run canvas`)

- Dev server only (`/lab/canvas/`): it is not a build input and never reaches the test site. Publishing it is Tim's call.
- It never changes a component: parts are the template functions or are cut out of the rendered pages (`cut()` in
  `variants.mjs`). A template change that breaks a cut fails loudly; fix the cut, not the template.
- One group per prop compared; everything else in its slots stays the same (coffee, text, ground, width). What is left
  out goes into `OMITTED` with the reason. No id may appear twice on the canvas page (each block is there once).
- No transform around components (the world is placed with left/top and CSS `zoom`), or the 3D canvas at z-index 5
  stops falling between a card's ground and its name.
- A new component or block: add its group and run `npm run canvas:check` (it lists every variant it checked).

## Testing tips

- Headless Chromium has no GPU: the packs are stills and the curl is off unless the address has `?qqgl=1`. Test the
  box with `?qqbox=1` (the navbar following the grounds, the product's pinned pack, the reload's place, the buy bar on
  the tab bar). The parameter is read by each page from its own address and links do not carry it: a page reached by a
  link (a card, the navbar) opens without the box. So a view transition from a boxed page to a boxed page is seen only
  in Safari 26+ on a Mac (the box on by itself); elsewhere open each page with `?qqbox=1` and test them one by one.
  The catalog's filters keep the address's other parameters, so `?qqbox` / `?qqgl` stay there while filtering.
- `npm run rules` runs QQ's `build/rules.mjs` (the twelve rules of the system; it fails) and then `site-kit rules`
  (the same twelve as `qq.*` and the kit's lessons, `learn.*`); `npx site-kit rules` alone runs only the second part.
- Full-page screenshots lie about the 3D packs (the canvas covers the screen, not the page): take screen-sized frames
  at scroll positions instead. Headless Chromium: `--use-gl=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`.
- `window.qqPacks` (the stage and `TUNE`: turn, hover, the carry of a rising card, the press) and `window.qqStage.progress` in the console.
- A reload keeps the scroll place (`scripts/scroll.js`, sessionStorage): to test from the top, open the page anew.
- Bigger browser text: DevTools `Page.setFontSizes` (the audit does 24px).
- The audit (`site-kit audit`, settings under `audit` in the adapter) puts a bag and favourites into the browser before
  every page (`audit.storage`) and runs QQ's own checks of the navbar's row and the countdown (`audit.probe`).
- The kit's commands find Chromium by `PLAYWRIGHT_CHROMIUM` (in the cloud: `/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`
  as of Nov 23, 2026; `ls /opt/pw-browsers`). The checks take ~35 min (four pages at nine sizes; CI's run, Nov 23: 36 of its 60 min), the audit in CI up to ~36 min (WebKit; its job may take 60).

## Where Claude runs

- In the cloud (claude.ai project "QQ"): the shell can't reach figma.com (use the Figma MCP tools; pictures come out
  through `get_screenshot` with a base64 response), `gh pr create` fails (open PRs with the REST API), Google Fonts
  files come from npm (`@fontsource/*`).
- Whichever side changes a rule here, update this file in the same PR.
