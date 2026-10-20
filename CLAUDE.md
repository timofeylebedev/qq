# CLAUDE.md — working on the QQ Coffee site

Read this before changing anything. `README.md` is the human how-to; `design/README.md` explains the system. The
project's notes for the claude.ai project "QQ" are in its doc `claude/website-system.md`.

## The project

- The site of QQ Coffee (a roaster of specialty coffee): home, catalog, a page per coffee; the bag, favourites, checkout,
  account (a placeholder visitor) and the information pages (round 4). Static, Vite, Russian; no shop behind it yet.
- `main` is the test site: every push builds and publishes to https://timofeylebedev.github.io/qq/ (`deploy.yml`).
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
- Before a PR: `npm run rules && npm run build && npm run check && npm run audit`. CI runs them too.
- Measure, don't guess: numbers in PRs come from a browser (Playwright), not from reading the CSS.
- For a larger round Tim gets an independent review: a separate agent that has not seen the work re-checks it;
  its findings are fixed in a commit "Fixes from the independent review".
- A design-system round ends with the full system report (skill `full-system-report`): a new page each round (the
  earlier ones stay where they are), always the whole system. Links in `design/report/README.md`.
- Anything decided on purpose (an exception, a stand-in) goes into `design/decisions.json`.

## Rules in the code (build/rules.mjs checks them)

- **Sizes** come from `design/scale.json` only: a value at 320 and at 1440, a straight line between, the screen's
  height counting through `--vp`. No `vw`/`vh`/`cqi` in the styles except in rules a decision lists (`css` field).
  Font sizes are `var(--type-*)`. Both ends of a role sit on the ladder; type levels in `relations` stay ×1.125 apart.
- **Colours** from `design/colors.json` only (`--c-*`). Secondary text is `--c-ink-70`; ink-60 only for large text.
- **Layout steps**: container queries on the column `col` at S 22rem, M 43rem, L 58rem (and `max` 1520px: the column at
  its most, for a frame). Blocks that run full width (hero, image blocks, facts, footer, buy bar) put their content in a `.col` so they change with everything else. A
  container query cannot style its own container: wrap (`<div class="col"><div class="block">`). Page steps only
  through `media.css` (the navbar's `--links-full` 64em and `--links` 48em, the tab bar's `--phone` under 40em, `--short`
  32em tall for the product's buy bar). Fixed bars stand on the tab bar: `bottom: var(--tabbar-h)` (0 without one).
- **Grounds**: every section has `data-ground` (paper, cloud, black, ink); colours on it come from there (`--g-bg`,
  `--g-fg`, `--line`, `--tint`), and the navbar and tab bar follow the section under them (`scripts/nav.js`). A block on
  another ground inside a section (the dark panel, a cloud form, a photo) says `data-tone` instead: the same colours,
  painted by the block, but the bars do not follow it.
- **One line colour**: every border is `var(--line)` (ink-20 on light grounds, white-30 on dark); states may use ink.
- **Navbar links** go only to pages that exist; an item without a page is `<a>` without `href` (data/site.json nav).
  The hero's and the footer's links are not under this rule yet (a question to Tim, round 2).
- **Grammar**: no rounded corners (pills and dots only); cells divided by hairlines (`--hair`, `--line`); mono bold
  capitals (PT Mono Bold) for names and headings, Apercu for text; one hover timing (`--t-in` 0.2s in, `--t-out` 0.45s out) and the
  curves of `motion.css`; a hover tints only its own item (`--tint`: white on dark grounds, ink on light).
- **Every fade is eased**: a gradient is a `var(--fade-*)` of `design/colors.json` fades (the «ease» curve of
  tw-easing-gradients, 16 stops) or a solid band; never a hand-written transparent → colour.
- **A whole card is its link**: the name's link is stretched (`::after`) over `.card`; nothing between them may be
  positioned (the picture's layers share one grid cell). The heart and the buy row sit above it (z-index 7).
- **Every row that scrolls sideways is `position: relative`** (else positioned children escape its clip and the page
  scrolls sideways).
- **3D**: one canvas per page at z-index 5. What must show above packs is positioned with z-index ≥ 6 (fact tiles,
  captions); the navbar 50, the buy bar 20. A pack inside a `[data-slider]` row is clipped to it.
- **Page transitions**: `public/vt.js` (a plain script in `<head>`, not bundled) names a card's name and pack for the
  cross-document view transition to its coffee's page. `data-out` is the catalog filter's; the reel's waiting cards
  are `data-wait`.
- **Pages** are written by `build/pages.mjs` from `src/templates/`; never edit `src/index.html`, `src/catalog/`,
  `src/coffee/` or the other page folders (generated, not committed). Links inside the site go through `href(ctx, to)`;
  an anchor of the same page that is not the home page is written as is (`#contacts`), not through `href`.
- **Shared blocks** of the new pages are in `src/templates/blocks.mjs` (page head, tabs, tiles, form cells, the dark
  panel, dialogs, contacts): reuse them before writing new markup. The bag and the favourites are written by their
  scripts before the 3D packs start (`main.js`), so their packs are drawn; a change of layout dispatches `qq:layout`.
- **Icons**: `<svg data-icon="name">` → a sprite per page (`build/plugins.js`). Parts of an icon cannot be styled
  inside `<use>`: two states are two icons (`heart` / `heart-fill`).
- **Texts**: write Russian normally; `build/typograph.js` adds non-breaking spaces at build time.
- **CSP**: the build writes a strict policy (`build/plugins.js` POLICY). Fonts and pictures are files, never data URIs
  (`assetsInlineLimit: 0`).

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

- Full-page screenshots lie about the 3D packs (the canvas covers the screen, not the page): take screen-sized frames
  at scroll positions instead. Headless Chromium: `--use-gl=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`.
- `window.qqPacks` (the stage and `TUNE`: turn, hover, the carry of a rising card, the press) and `window.qqStage.progress` in the console.
- A reload keeps the scroll place (`scripts/scroll.js`, sessionStorage): to test from the top, open the page anew.
- Bigger browser text: DevTools `Page.setFontSizes` (the audit does 24px).

## Where Claude runs

- In the cloud (claude.ai project "QQ"): the shell can't reach figma.com (use the Figma MCP tools; pictures come out
  through `get_screenshot` with a base64 response), `gh pr create` fails (open PRs with the REST API), Google Fonts
  files come from npm (`@fontsource/*`).
- Whichever side changes a rule here, update this file in the same PR.
