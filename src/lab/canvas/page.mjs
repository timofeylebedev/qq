// The component canvas page and its preview documents, written into this folder (not committed: .gitignore):
//
//   index.html          the canvas: every group of variants.mjs on one surface you pan and zoom (canvas.js)
//   frame-*.html        preview documents shown in iframes of real screen sizes (the navbar, the product stage)
//
// Written by `npm run dev` (vite.config.js), and again when a template, the data or this folder's .mjs changes.
// Open http://localhost:5173/lab/canvas/. The canvas is not part of `npm run build`: it never reaches the test site.
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { read, esc } from "../../templates/util.mjs";
import { groups, rendered, cut, REL } from "./variants.mjs";

const here = import.meta.dirname;
const WIDEST = 3360;     // a group spans at most two of canvas.js's columns (2 × 1600 + the gap between): wider rows wrap
const PAD = 48, GAP = 48; // a group's padding and the gap between its slots (canvas.css)

export function data() {
  return { site: read("data/site.json"), products: read("src/data/products.json").products };
}

function slot(g, s) {
  const body = s.frame
    ? `<div class="cv-screen" style="width: ${s.frame.w}px; height: ${s.frame.crop || s.frame.h}px">
          <div class="cv-screen__glass" data-cv-glass><iframe data-src="./${s.frame.src}" width="${s.frame.w}" height="${s.frame.h}" title="${esc(`${g.title}: ${s.label}`)}" data-cv-frame></iframe></div>
        </div>`
    : s.html;
  return `<figure class="cv-slot-wrap">
        <figcaption class="cv-slot__label">${esc(s.label)}</figcaption>
        <div class="cv-slot" data-cv-slot>${body}</div>
      </figure>`;
}

function group(g) {
  const cols = Math.max(1, Math.min(g.slots.length, Math.floor((WIDEST - 2 * PAD + GAP) / (g.slot + GAP))));
  return `<div class="cv-group" id="cv-${g.id}" data-cv-group="${g.id}" data-cv-compares="${esc(g.compares)}"${g.page != null ? ` data-cv-page="${esc(g.page)}"` : ""}${g.break ? " data-cv-break" : ""} style="--slot: ${g.slot}px; --cols: ${cols}">
    <h2 class="cv-group__title">${esc(g.title)}</h2>
    <div class="cv-group__box">
      ${g.slots.map((s) => slot(g, s)).join("\n      ")}
    </div>
  </div>`;
}

const ICONS = {
  out: '<path d="M5 12h14"/>',
  in: '<path d="M5 12h14M12 5v14"/>',
  fit: '<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/>',
  reset: '<path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4"/>'
};
const icon = (k) => `<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.5">${ICONS[k]}</svg>`;

export function canvasPage(d = data()) {
  const pages = rendered(d);
  const toast = cut(pages.home, /class="toast"/);
  return `<!doctype html>
<html lang="en" data-root="${REL}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Component canvas — QQ Coffee</title>
<meta name="robots" content="noindex">
<link rel="icon" href="/assets/icons/mark.svg" type="image/svg+xml">
<link rel="stylesheet" href="/styles/main.css">
<link rel="stylesheet" href="./canvas.css">
<script type="module" src="/scripts/main.js"></script>
<script type="module" src="./canvas.js"></script>
</head>
<body class="cv">
<div class="cv-stage" data-cv-stage role="region" aria-label="Components of the QQ site">
  <div class="cv-shell" data-cv-shell tabindex="0" role="application" aria-roledescription="canvas" aria-label="Canvas view. Arrow keys pan, plus and minus zoom, 1 fits all, 0 resets."></div>
  <div class="cv-world" data-cv-world lang="ru">
  ${groups(d).map(group).join("\n  ")}
  </div>
</div>
<div class="cv-ui" data-cv-ui role="toolbar" aria-label="Camera">
  <button class="cv-ui__btn" type="button" data-cv-zoom="out" aria-label="Zoom out" aria-keyshortcuts="-">${icon("out")}</button>
  <output class="cv-ui__zoom" data-cv-readout aria-label="Zoom">100%</output>
  <button class="cv-ui__btn" type="button" data-cv-zoom="in" aria-label="Zoom in" aria-keyshortcuts="+">${icon("in")}</button>
  <button class="cv-ui__btn" type="button" data-cv-fit aria-label="Fit all" aria-keyshortcuts="1">${icon("fit")}</button>
  <button class="cv-ui__btn" type="button" data-cv-reset aria-label="Reset view" aria-keyshortcuts="0">${icon("reset")}</button>
</div>
<p class="cv-status" data-cv-status role="status" aria-live="polite"></p>
${toast}
</body>
</html>
`;
}

// the preview documents: real pages with everything but the part on show taken out
export function framePages(d = data()) {
  const pages = rendered(d);
  const without = (html, ...parts) => parts.reduce((h, re) => h.replace(cut(h, re), ""), html);
  return {
    "frame-nav-light.html": without(pages.frame("light"), /class="footer"/),
    "frame-nav-dark.html": without(pages.frame("dark"), /class="footer"/),
    "frame-stage.html": without(pages.product, /class="nav"/, /class="footer"/, /class="pstory"/, /class="section similar"/)
  };
}

export function write() {
  const d = data();
  const out = { "index.html": canvasPage(d), ...framePages(d) };
  for (const [name, html] of Object.entries(out)) writeFileSync(resolve(here, name), html);
  return Object.keys(out);
}

if (import.meta.url === `file://${process.argv[1]}`) console.log(`canvas: ${write().join(", ")} written`);
