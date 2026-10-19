# CLAUDE.md — working on the QQ Coffee site

Read this before changing anything. `README.md` is the human how-to; `design/README.md` explains the system. The
project's notes for the claude.ai project "QQ" are in its doc `claude/website-system.md`.

## The project

- The site of QQ Coffee (a roaster of specialty coffee): home, catalog, a page per coffee. Static, Vite, Russian.
- `main` is the test site: every push builds and publishes to https://timofeylebedev.github.io/qq/ (`deploy.yml`).
- Owner and reviewer: Tim (timofeylebedev). Talk to Tim in the language he writes in.
- Design: Figma https://www.figma.com/design/xwaKVTaFLFNc2yhMfsB5us/QQ-website — pages «Главная» (the most complete,
  frame [1280 — 1439]), «Каталог», «Продукт» (frame [1440 — 1919]). Figma is inspiration, not values: the site has its
  own fluid system, and only a few Figma frames are responsive.

## How to work

- **Never commit to `main`.** A branch, a pull request, Tim reviews and merges. One topic per PR; say what changed,
  what was measured and what Tim should look at.
- Commit as `timofeylebedev <49580438+timofeylebedev@users.noreply.github.com>`.
- Before a PR: `npm run rules && npm run build && npm run check && npm run audit`. CI runs them too.
- Measure, don't guess: numbers in PRs come from a browser (Playwright), not from reading the CSS.
- For a larger round Tim gets an independent review: a separate agent that has not seen the work re-checks it;
  its findings are fixed in a commit "Fixes from the independent review".
- A design-system round ends with the full system report (skill `full-system-report`): one living page, every round.
- Anything decided on purpose (an exception, a stand-in) goes into `design/decisions.json`.

## Rules in the code (build/rules.mjs checks them)

- **Sizes** come from `design/scale.json` only: a value at 320 and at 1440, a straight line between, the screen's
  height counting through `--vp`. No `vw`/`vh`/`cqi` in the styles except in rules a decision lists (`css` field).
  Font sizes are `var(--type-*)`. Both ends of a role sit on the ladder; type levels in `relations` stay ×1.125 apart.
- **Colours** from `design/colors.json` only (`--c-*`). Secondary text is `--c-ink-70`; ink-60 only for large text.
- **Layout steps**: container queries on the column `col` at S 22rem, M 43rem, L 58rem. Blocks that run full width
  (hero, image blocks, facts, footer, buy bar) put their content in a `.col` so they change with everything else. A
  container query cannot style its own container: wrap (`<div class="col"><div class="block">`). Page steps only
  through `media.css` (`--tablet` 64em for the navbar, `--narrow` 25em).
- **Grammar**: no rounded corners (pills and dots only); cells divided by hairlines (`--hair`, `--line`); mono bold
  capitals for names and headings, Apercu for text; one hover timing (`--t-in` 0.2s in, `--t-out` 0.45s out) and the
  curves of `motion.css`.
- **Every row that scrolls sideways is `position: relative`** (else positioned children escape its clip and the page
  scrolls sideways).
- **3D**: one canvas per page at z-index 5. What must show above packs is positioned with z-index ≥ 6 (fact tiles,
  captions); the navbar 50, the buy bar 20. A pack inside a `[data-slider]` row is clipped to it.
- **Pages** are written by `build/pages.mjs` from `src/templates/`; never edit `src/index.html`, `src/catalog/`,
  `src/coffee/` (generated, not committed). Links inside the site go through `href(ctx, to)`.
- **Icons**: `<svg data-icon="name">` → a sprite per page (`build/plugins.js`). Parts of an icon cannot be styled
  inside `<use>`: two states are two icons (`heart` / `heart-fill`).
- **Texts**: write Russian normally; `build/typograph.js` adds non-breaking spaces at build time.
- **CSP**: the build writes a strict policy (`build/plugins.js` POLICY). Fonts and pictures are files, never data URIs
  (`assetsInlineLimit: 0`).

## Testing tips

- Full-page screenshots lie about the 3D packs (the canvas covers the screen, not the page): take screen-sized frames
  at scroll positions instead. Headless Chromium: `--use-gl=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`.
- `window.qqPacks` (the stage and `TUNE`) and `window.qqStage.progress` in the console.
- Bigger browser text: DevTools `Page.setFontSizes` (the audit does 24px).

## Where Claude runs

- In the cloud (claude.ai project "QQ"): the shell can't reach figma.com (use the Figma MCP tools; pictures come out
  through `get_screenshot` with a base64 response), `gh pr create` fails (open PRs with the REST API), Google Fonts
  files come from npm (`@fontsource/*`).
- Whichever side changes a rule here, update this file in the same PR.
