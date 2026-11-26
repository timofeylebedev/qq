// The adapter of QQ Coffee for site-kit (https://github.com/timofeylebedev/site-kit, SPEC.md there): everything the
// kit's checks, review page, rules and tools need to know about this site. The kit's code never names a site.
import { execFileSync } from "node:child_process";

// the pages of the site (paths in dist/, served as on GitHub Pages: a folder's index.html). Written by build/pages.mjs
// from src/templates/ and data/; `measure: true` pages are measured at every full size too (the system lives on the
// catalog and the coffee pages as much as on the home page). Two coffees: a single origin and a blend.
const PAGES = [
  { path: "", title: "Home", main: true },
  { path: "catalog/", title: "Catalog", measure: true },
  { path: "coffee/keniya-kisii/", title: "Coffee: Кения Кисии (single origin)", measure: true },
  { path: "coffee/q-optimistic/", title: "Coffee: Q Optimistic (blend)", measure: true },
  { path: "cart/", title: "Bag" },
  { path: "favourites/", title: "Favourites" },
  { path: "checkout/", title: "Checkout: contacts" },
  { path: "checkout/details/", title: "Checkout: details" },
  { path: "checkout/delivery/", title: "Checkout: delivery" },
  { path: "account/", title: "Account: profile" },
  { path: "account/beans/", title: "Account: beans" },
  { path: "account/orders/", title: "Account: orders" },
  { path: "account/orders/433273/", title: "Account: one order" },
  { path: "account/purchases/", title: "Account: purchases" },
  { path: "account/settings/", title: "Account: settings" },
  { path: "business/", title: "Business" },
  { path: "faq/", title: "Questions and answers" },
  { path: "delivery/", title: "Delivery and payment" },
  { path: "contacts/", title: "Contacts" },
  { path: "privacy/", title: "Privacy policy" },
  { path: "about/", title: "About" },
  // the site has no 404.html of its own yet: GitHub Pages shows its own page (the checks see the kit's plain one)
  { path: "no-such-page", title: "Not found (404)", status: 404 },
];

// what a visitor has put into this browser before the shop pages are measured (the audit): a bag with a photo coffee,
// a pack coffee, a big quantity and a line put aside; favourites with photos and packs
const STATE = {
  "qq-bag": [{ slug: "braziliya-santa-mariya", weight: "200 г", qty: 1 }, { slug: "vetnam-kua-mon", weight: "1 кг", qty: 12 },
    { slug: "kolumbiya-chayna-alta", weight: "200 г", grind: "Фильтр", roast: "Фильтр", qty: 1 }, { slug: "efiopiya-bekele", weight: "200 г", qty: 1, later: true }],
  "qq-fav": ["q-optimistic", "keniya-kisii", "kolumbiya-chayna-alta", "efiopiya-bekele"],
};

// a page of the site by its path (scenarios get the home page's address in h.url)
const at = (h, path) => new URL(path, h.url).href;

export default {
  name: "QQ Coffee",
  tag: "QQ",
  owner: "Tim",
  repo: "timofeylebedev/qq",
  live: "https://timofeylebedev.github.io/qq/",
  lang: "ru",

  paths: {
    dist: "dist",
    scale: "design/scale.json",
    decisions: "design/decisions.json",
    questions: "design/questions.json",
    styles: "src/styles",
    // custom properties are set in the scripts, the page templates and the view-transition script in <head>
    scripts: ["src/scripts", "src/templates", "public/vt.js"],
    fonts: "src/assets/fonts",
    out: ".site-kit/out",
    report: ".site-kit/report",
    // the review rounds (the same engine's typed blocks as Flow Medium's) and their pictures
    rounds: "design/report/data.json",
    shots: "design/report/shots",
  },

  // the palette: design/colors.json (`colors`: name → #rrggbb[aa]); the CSS writes each as --c-<name>. Groups as its
  // $about says: one ink in alpha steps on light grounds, white in alpha steps on dark ones, the grounds, lavender
  colours: {
    file: "design/colors.json",
    read: (c) => Object.entries(c.colors || {}).map(([name, value]) => ({
      name, value, css: `--c-${name}`,
      group: /^ink/.test(name) ? "ink" : /^white/.test(name) ? "white" : /^lavender/.test(name) ? "brand" : "ground",
      use: "",
    })),
    groups: [
      ["ink", "Ink", "One ink, cool grey #2d2f33, in alpha steps on light grounds (as Figma's «cool gray/NN»): text, lines. Secondary text is ink-70; ink-60 only for large text; ink-30 only for the catalog's inactive tabs.", "on-white"],
      ["ground", "Grounds", "White paper, cloud #f6f6f6 for cards and tiles, graphite and the ink for the business section, black for photos and the hero."],
      ["white", "White in alpha", "White in alpha steps on the dark grounds: text, lines (white-30)."],
      ["brand", "Lavender", "The brand's one colour: eyebrows and the active state, never a surface (lavender-ink on light grounds).", "white-on"],
    ],
  },
  css: { tokens: ["src/styles/base/tokens.gen.css"], media: "src/styles/base/media.css" },

  checks: {
    // lighter checks: a pull request runs them only when one of these changed (or it has the label `checks`)
    designPaths: ["design/**", "src/**", "public/**", "build/**", "data/**", "vite.config.js", "package.json", "package-lock.json", "site-kit.config.mjs"],
    pages: PAGES,
    // the kit's eight screens and a 2560 one (the column stops at 1520px, and from --framed 1616px the blocks are framed)
    sizes: [
      { w: 320, h: 568, dpr: 2, touch: true }, { w: 390, h: 844, dpr: 3, touch: true }, { w: 844, h: 390, dpr: 3, touch: true },
      { w: 768, h: 1024, dpr: 2, touch: true }, { w: 1024, h: 768, dpr: 2, touch: true }, { w: 1366, h: 650, dpr: 1 },
      { w: 1440, h: 900, dpr: 2 }, { w: 1920, h: 1080, dpr: 1 }, { w: 2560, h: 1440, dpr: 1 },
    ],
    // left out of every design check: the 3D canvas and its stills (pictures of packs), the curl sheet of the new arrivals,
    // the hero's video, the icon sprite, QQ Digits (an SVG drawing of the countdown)
    skip: "canvas, .pack, .curl-sheet, video, .hero__bg, .sprite, .digits",
    notIcons: ".pack, .digits, .sprite",
    // text sized to fit its box, not a role of the scale: the hero's title fills its cell (decision hero-title-fills-cell);
    // QQ Digits are a drawing (decision qq-digits)
    typeObjects: ".hero__title, .digits",
    // what lines up: headings, texts, buttons and cards of the sections
    align: "main section h1, main section h2, main section h3, main section p, main section .btn, .card, .fact, .bcard, .ptile, .head, footer p, footer a",
    cards: ".card, .fact, .bcard, .ptile, .cell, .tile",
    paragraphs: "p, li, dd",
    sections: "main > section, body > footer",
    // the texts compared with the fallback font (fonts that never arrive), and the pictures left out of them
    boxes: "main h1, main h2, main h3, main p, .btn",
    boxSkip: ".pack, .digits, .hero__bg",
    // the sweep (every 10px of width) hides the canvases and the video: WebGL makes each resize slow
    sweepStyle: "canvas,video,.curl-sheet{display:none!important}",
    files: ["robots.txt", "sitemap.xml", "site.webmanifest", "favicon.ico", "apple-touch-icon.png"],
    notes: { "privacy.before": "QQ has no third parties: no notice, nothing to consent to (CLAUDE.md, CSP in build/plugins.js)." },
    // no third party, so no consent: the privacy step records the hosts the page calls
    consent: null,

    // measured at every width and height (the report's responsive picture and map): { key: value }; keys starting with
    // "@" are layout states (they make the map). Runs in the home page.
    probes: () => {
      const shown = (e) => e && e.getClientRects().length && getComputedStyle(e).visibility !== "hidden" && getComputedStyle(e).display !== "none";
      const vis = (sel) => [...document.querySelectorAll(sel)].find(shown) || null;
      const all = (sel) => [...document.querySelectorAll(sel)].filter(shown);
      const r2 = (v) => Math.round(v * 100) / 100;
      const f = (sel) => { const e = vis(sel); return e ? r2(parseFloat(getComputedStyle(e).fontSize)) : null; };
      const h = (sel) => { const e = vis(sel); return e ? r2(e.getBoundingClientRect().height) : null; };
      const w = (sel) => { const e = vis(sel); return e ? r2(e.getBoundingClientRect().width) : null; };
      const tok = (v) => { const d = document.createElement("div"); d.style.cssText = "position:absolute;visibility:hidden;width:" + v; document.body.appendChild(d); const x = d.getBoundingClientRect().width; d.remove(); return r2(x); };
      const cols = (sel) => { const k = all(sel); if (!k.length) return null; const xs = []; for (const e of k) { const x = Math.round(e.getBoundingClientRect().left); if (!xs.some((v) => Math.abs(v - x) < 4)) xs.push(x); } return xs.length; };
      const gridCols = (sel) => { const e = vis(sel); if (!e) return null; const s = getComputedStyle(e); return s.display.includes("grid") ? s.gridTemplateColumns.split(" ").filter(Boolean).length : null; };
      // the columns of one block: how many of its children stand side by side (one row, boxes that do not overlap: a
      // picture that bleeds to the screen's edge or lies under the text is no column of its own)
      const kids = (sel) => { const e = vis(sel); if (!e) return null; const bs = [...e.children].filter(shown).map((k) => k.getBoundingClientRect()); if (!bs.length) return null; let most = 1; for (const a of bs) { const row = bs.filter((b) => Math.abs(b.top - a.top) < 4).sort((x, y) => x.left - y.left); let n = 0, end = -Infinity; for (const b of row) if (b.left >= end - 1) { n++; end = b.right; } most = Math.max(most, n); } return most; };
      const inView = (sel) => all(sel).filter((e) => { const r = e.getBoundingClientRect(); return r.left >= -2 && r.right <= innerWidth + 2; }).length;
      return {
        heroTitle: f(".hero__title"), h2: f(".head h2, section h2"), cardTitle: f(".card__title"), body: f("main p"), navLink: f(".nav__links a"),
        gutter: tok("var(--gutter)"), navH: h(".nav"), heroH: h(".hero"), column: w(".featured .col") || w("main .col"), cardW: w(".reel .card"),
        "@nav": vis(".nav__links--full") ? "links (full)" : vis(".nav__links--short") ? "links (short)" : vis(".nav__burger") ? "burger" : "none",
        "@tabbar": vis(".tabbar") && vis(".tabbar").getBoundingClientRect().height > 0 ? "tab bar" : "none",
        "@hero": (() => { const e = vis(".hero__grid"); if (!e) return null; const c = gridCols(".hero__grid"); return c ? c + (c > 1 ? " cols" : " col") : "stack"; })(),   // a flex column below L
        "@reel": (() => { const n = inView(".reel .card"); return n ? n + " in view" : null; })(),
        "@story": (() => { const c = kids(".story__col"); return c ? c + (c > 1 ? " cols" : " col") : null; })(),
        "@business": (() => { const c = cols(".business .bcard"); return c ? c + (c > 1 ? " cols" : " col") : null; })(),
        "@facts": (() => { const c = cols(".facts .fact"); return c ? c + (c > 1 ? " cols" : " col") : null; })(),
        "@footer": (() => { const c = gridCols(".footer__inner") || kids(".footer__inner"); return c ? c + (c > 1 ? " cols" : " col") : null; })(),
        overflow: document.documentElement.scrollWidth > innerWidth + 1 ? document.documentElement.scrollWidth - innerWidth : 0,
      };
    },
    mapRows: { "@nav": "Navbar", "@tabbar": "Tab bar", "@hero": "Hero", "@reel": "New arrivals", "@story": "Story", "@business": "Business", "@facts": "Facts", "@footer": "Footer" },

    // how the site behaves: each scenario is a row of the logic table (given, when, then), played in a fresh page.
    // run(page, h) → true, or a string saying what went wrong. h: { url (the home page), wait(ms), vis(sel) }.
    scenarios: [
      { id: "bag-add", area: "Shop", given: "an empty bag, the catalog", when: "«В корзину» of the first card is pressed", then: "the bag (localStorage qq-bag) holds that coffee and the navbar's count shows 1", size: [1440, 900],
        run: async (page, h) => {
          await page.goto(at(h, "catalog/")); await h.wait(1500);
          const form = page.locator("[data-grid] form[data-buy]").first();
          const slug = await form.getAttribute("data-slug");
          await form.scrollIntoViewIfNeeded(); await form.hover(); await h.wait(500);
          await form.locator('[type="submit"]').first().click({ force: true }); await h.wait(800);
          const r = await page.evaluate(() => ({ bag: JSON.parse(localStorage.getItem("qq-bag") || "[]"), count: [...document.querySelectorAll("[data-bag-count]")].map((e) => !e.hidden && e.textContent.trim()).find(Boolean) }));
          if (r.bag.length !== 1 || r.bag[0].slug !== slug) return `the bag holds ${JSON.stringify(r.bag.map((x) => x.slug))}, not ${slug}`;
          return r.count === "1" ? true : `the navbar's count shows ${r.count || "nothing"}`;
        } },
      { id: "heart-favourites", area: "Shop", given: "no favourites, the catalog", when: "the heart of the first card is pressed, then the favourites page opened", then: "the heart is pressed (aria-pressed true) and the favourites page shows that coffee", size: [1440, 900],
        run: async (page, h) => {
          await page.goto(at(h, "catalog/")); await h.wait(1500);
          const heart = page.locator("[data-grid] [data-fav]").first(), slug = await heart.getAttribute("data-fav");
          await heart.scrollIntoViewIfNeeded(); await heart.click(); await h.wait(500);
          if ((await heart.getAttribute("aria-pressed")) !== "true") return "the heart did not turn pressed";
          await page.goto(at(h, "favourites/")); await h.wait(1500);
          const shown = await page.evaluate((s) => [...document.querySelectorAll("[data-fav-grid] [data-card]")].filter((c) => !c.hidden && c.getClientRects().length).map((c) => c.dataset.slug), slug);
          return shown.length === 1 && shown[0] === slug ? true : `the favourites show ${JSON.stringify(shown)}, not ${slug}`;
        } },
      { id: "catalog-filter", area: "Catalog", given: "the whole catalog", when: "a country is ticked in the filter «Страна»", then: "only that country's coffees stay, and the address keeps the choice (?country=…)", size: [1440, 900],
        run: async (page, h) => {
          await page.goto(at(h, "catalog/")); await h.wait(1500);
          const count = () => page.evaluate(() => [...document.querySelectorAll("[data-grid] > [data-card]")].filter((c) => !c.hasAttribute("data-out") && !c.hidden && c.getClientRects().length).length);
          const before = await count();
          await page.click('details.filter[data-filter="country"] > summary'); await h.wait(400);
          const box = page.locator('details.filter[data-filter="country"] input[name="country"]').first(), value = await box.getAttribute("value");
          await box.check({ force: true }); await h.wait(1200);
          const r = await page.evaluate((v) => ({ search: decodeURIComponent(location.search), wrong: [...document.querySelectorAll("[data-grid] > [data-card]")].filter((c) => !c.hasAttribute("data-out") && !c.hidden && c.getClientRects().length && !c.dataset.countries.split("|").includes(v)).length }), value);
          const after = await count();
          if (!r.search.includes(`country=${value}`)) return `the address is «${r.search}», no country=${value}`;
          if (r.wrong) return `${r.wrong} cards of other countries still shown`;
          return after > 0 && after < before ? true : `${after} of ${before} cards shown`;
        } },
      { id: "menu-cell", area: "Catalog", given: "the catalog's filters", when: "one menu cell is opened, then another, then a click lands elsewhere", then: "one cell is open at a time, and a click elsewhere closes it", size: [1440, 900],
        run: async (page, h) => {
          await page.goto(at(h, "catalog/")); await h.wait(1500);
          const open = () => page.evaluate(() => [...document.querySelectorAll("details.filter[open]")].map((d) => d.dataset.filter));
          await page.click('details.filter[data-filter="country"] > summary'); await h.wait(300);
          if ((await open()).join() !== "country") return `after the first: ${(await open()).join() || "none"} open`;
          await page.click('details.filter[data-filter="process"] > summary'); await h.wait(300);
          if ((await open()).join() !== "process") return `after the second: ${(await open()).join() || "none"} open`;
          await page.mouse.click(8, 600); await h.wait(300);
          return (await open()).length ? `a click elsewhere left ${(await open()).join()} open` : true;
        } },
      { id: "nav-ground", area: "Navbar", given: "the home page (the hero is black, the next section paper)", when: "the page is scrolled from the hero into the next section", then: "the navbar takes the ground under it: black over the hero, paper below", size: [1440, 900],
        run: async (page, h) => {
          await page.goto(h.url); await h.wait(1500);
          const g = () => page.evaluate(() => document.querySelector("[data-nav]")?.dataset.ground);
          if ((await g()) !== "black") return `over the hero the navbar is ${await g()}`;
          await page.evaluate(() => { const s = document.querySelector("main > section:nth-of-type(2)"); scrollTo(0, s.getBoundingClientRect().top + scrollY + 40); }); await h.wait(1200);
          const want = await page.evaluate(() => document.querySelector("main > section:nth-of-type(2)").dataset.ground);
          return (await g()) === want ? true : `over the second section (${want}) the navbar is ${await g()}`;
        } },
      { id: "reload-place", area: "Page", given: "the catalog scrolled down", when: "the page is reloaded", then: "it comes back at the same place (scripts/scroll.js)", size: [1440, 900],
        run: async (page, h) => {
          await page.goto(at(h, "catalog/")); await h.wait(1500);
          await page.mouse.wheel(0, 1800); await h.wait(1500);
          const y0 = await page.evaluate(() => scrollY);
          if (y0 < 600) return `the page scrolled only to ${Math.round(y0)}`;
          await page.reload(); await h.wait(2500);
          const y1 = await page.evaluate(() => scrollY);
          return Math.abs(y1 - y0) < 40 ? true : `after the reload at ${Math.round(y1)}, before at ${Math.round(y0)}`;
        } },
      { id: "burger-menu", area: "Navbar", given: "a phone (the burger)", when: "the burger is pressed, then Escape", then: "the menu opens (aria-expanded true) and closes again", size: [390, 844],
        run: async (page, h) => {
          await page.goto(h.url); await h.wait(1500);
          await page.click("[data-menu-button]"); await h.wait(700);
          if ((await page.getAttribute("[data-menu-button]", "aria-expanded")) !== "true") return "the burger did not open the menu";
          await page.keyboard.press("Escape"); await h.wait(700);
          return (await page.getAttribute("[data-menu-button]", "aria-expanded")) === "false" ? true : "Escape did not close the menu";
        } },
    ],
  },

  rules: {
    // QQ's own rules (build/rules.mjs, which still fails a pull request in the site job) shown on the review page too:
    // the same twelve rules with the same fails, read from its --json output
    code: (ctx) => {
      let out;
      try { out = execFileSync("node", ["build/rules.mjs", "--json"], { cwd: ctx.io.root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }); }
      catch (e) { out = e.stdout || ""; }
      const line = out.trim().split("\n").pop();
      let list;
      try { list = JSON.parse(line); } catch { return [{ id: "qq.rules", area: "Code", title: "QQ's own rules (build/rules.mjs)", how: "node build/rules.mjs --json", fails: [], error: "build/rules.mjs gave no JSON" }]; }
      const slug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      return list.map((r) => ({ id: `qq.${slug(r.title)}`, area: "Code", title: r.title, how: `${r.how} (build/rules.mjs)`, fails: r.fails }));
    },
    // text sized as a part of an object: the hero's title fills its cell
    objectType: ["--hero-title"],
    // container queries on the column at S, M, L and max; the page steps are media.css's
    steps: { shared: ["22rem", "43rem", "58rem", "1520px"], own: [] },
    // what every decision must say (build/rules.mjs rule 9)
    decisionFields: { "*": ["id", "kind", "what", "why", "decided"] },
    // the lessons (site-kit rules/README.md): which file plays which part; QQ has no third parties, so no consent gate
    learnings: { entry: "src/scripts/main.js", boxScript: "node_modules/site-kit/runtime/box.js", consent: false },
  },

  // the responsive audit (site-kit audit/README.md; was build/audit.mjs, the same findings): 21 pages at twelve sizes
  audit: {
    pages: PAGES.filter((p) => !p.status).map((p) => p.path),
    // a folded phone (280), phones, a phone sideways, tablets, laptops short and tall, 1440, 1920 and 2560; a phone and
    // a short laptop with the browser's text at 24px (axe there too)
    sizes: [
      { w: 280, h: 653, touch: true }, { w: 320, h: 568, touch: true, axe: true }, { w: 390, h: 844, touch: true }, { w: 768, h: 1024, touch: true },
      { w: 844, h: 390, touch: true }, { w: 1024, h: 768, touch: true }, { w: 1366, h: 650 }, { w: 1440, h: 900, axe: true },
      { w: 1920, h: 1080 }, { w: 2560, h: 1440 },
      { w: 390, h: 844, touch: true, font: 24, axe: true }, { w: 1366, h: 650, font: 24, axe: true },
    ],
    // the shop pages are measured with a bag and favourites in the browser
    storage: STATE,
    // left out of «text cut off»: the sprite, text for screen readers, rows that scroll sideways, the tabs, the menu, the
    // toast, the skip link (cut off or off screen on purpose)
    skip: ".sprite, .sr, [data-slider], .tabs, .subtabs, .menu, .toast, .skip",
    skipSmall: ".sprite",
    skipTargets: ".skip, .sr",
    unseen: ".sr",
    texts: "h1, h2, h3, p, a, button, dt, dd, span, li, label, output, select, summary",
    targets: "a[href], button, select, summary, input:not([type=radio]):not([type=checkbox])",
    // the text's own boxes (text ending in an ellipsis and clamped card text are cut on purpose)
    textBox: "nodes",
    // the name's link is stretched over its card (CLAUDE.md «A whole card is its link»)
    stretched: "skip",
    // the page is looked at once, at its top, after the scroll-through (as build/audit.mjs did)
    sections: ["body"],
    // the one canvas draws packs, not a ground under text
    canvases: null,
    // QQ's own: the navbar's sections never run into the logo or the tools (each step of media.css must fit its row);
    // the hero's countdown: the day row and the digits (or the date) as wide as a one-line caption, a caption on two
    // lines no wider than the digits (decision countdown-as-caption)
    probe: () => {
      const out = [];
      const shown = (e) => { for (let x = e; x; x = x.parentElement) { const s = getComputedStyle(x); if (s.display === "none" || s.visibility === "hidden" || +s.opacity === 0) return false; } const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
      const vis = (q) => [...document.querySelectorAll(q)].find(shown);
      const logo = vis(".nav__logo"), links = vis(".nav__links"), tools = vis(".nav__tools");
      if (links && logo && tools) {
        const a = logo.getBoundingClientRect(), b = links.querySelector("ul").getBoundingClientRect(), c = tools.getBoundingClientRect();
        if (b.left < a.right + 8 || b.right > c.left - 8) out.push(`bar: navbar: the sections (${Math.round(b.left)}–${Math.round(b.right)}) run into the logo or the tools (${Math.round(a.right)}, ${Math.round(c.left)})`);
      }
      const cap = vis(".hero__caption");
      if (cap) {
        const tw = (e) => { const r = document.createRange(); r.selectNodeContents(e); return r.getBoundingClientRect().width; };
        const lines = new Set([...(() => { const r = document.createRange(); r.selectNodeContents(cap); return r.getClientRects(); })()].map((x) => Math.round(x.top))).size;
        const w = tw(cap), dial = vis(".hero__count .digits") || vis(".hero__date"), now = vis(".hero__now");
        const dw = dial.getBoundingClientRect().width;
        const side = getComputedStyle(cap.parentElement).gridTemplateColumns.split(" ").length > 1;
        if (lines === 1 && !side) for (const [n, x] of [["digits", dw], ["day row", now.getBoundingClientRect().width]]) { if (Math.abs(x - w) > w * 0.04) out.push(`bar: hero: the ${n} ${Math.round(x)}px, the caption ${Math.round(w)}px`); }
        if (lines > 1 && w > dw + 1 && !side) out.push(`bar: hero: the caption ${Math.round(w)}px on ${lines} lines, wider than the digits ${Math.round(dw)}px`);
      }
      return out;
    },
  },

  report: {
    title: "QQ Coffee · the system",
    accent: "#7f4fc9",
    fonts: {
      text: { family: "Apercu", files: { 400: "apercu-400.woff2", 500: "apercu-500.woff2", 700: "apercu-700.woff2" } },
      display: { family: "PT Mono", files: { 700: "pt-mono-700.woff2" } },
    },
    // the column the cards' own sizes are measured against: at most 1520, inside the gutter
    column: { max: 1520, gutter: "gutter" },
    steps: { "22rem": "S", "43rem": "M", "58rem": "L", "1520px": "max" },
    grounds: { paper: "#ffffff", cloud: "#f6f6f6", black: "#000000", ink: "#2d2f33" },
    notes: {
      layout: "One column (at most 1520px), blocks that change at the column's S, M, L and max (container queries on `col`), and the page steps of media.css (the navbar's links, the tab bar, short screens, the frame). Blocks that run full width put their content in a `.col`.",
      steps: "Shared steps are the column's S 22rem, M 43rem, L 58rem and max 1520px; the page steps are media.css's (--links-full 70em, --links 48em, --phone 40em, --short 32em tall, --framed 1616px).",
      radii: "No rounded corners: pills and dots only (decision no-radius).",
    },
    typesetSamples: [
      { lang: "ru", text: "Свежая обжарка каждую неделю\n\nКофе с похожим вкусом: Кения Кисии, Эфиопия Бекеле и Колумбия Чайна Альта — от 1 180 ₽ за 200 г, с доставкой по Москве в т. ч. в день обжарки." },
    ],
    // the blocks of the home page (layer 3 pictures, and the live site in a frame at `#anchor` when the block has an id)
    blocks: [
      { id: "nav", title: "Navbar", selector: ".nav", files: ["src/styles/components/nav.css", "src/scripts/nav.js", "src/templates/layout.mjs"] },
      { id: "hero", title: "Hero", selector: ".hero", files: ["src/styles/sections/home.css", "src/scripts/hero.js", "src/scripts/digits.js", "src/scripts/video.js", "src/templates/home.mjs", "design/intro.json", "design/digits.json"] },
      { id: "featured", title: "New arrivals", selector: ".featured", files: ["src/styles/sections/home.css", "src/scripts/curl.js", "src/scripts/slider.js", "src/templates/home.mjs"] },
      { id: "recs", title: "Recommendations", selector: "main > section:nth-of-type(3)", files: ["src/styles/components/card.css", "src/scripts/slider.js", "src/scripts/packs.js", "src/templates/components.mjs"] },
      { id: "approach", title: "Approach", anchor: "approach", selector: "#approach", files: ["src/styles/sections/home.css", "src/templates/home.mjs"] },
      { id: "about", title: "About", anchor: "about", selector: "#about", files: ["src/styles/sections/home.css", "src/templates/home.mjs"] },
      { id: "business", title: "Business", anchor: "business", selector: "#business", files: ["src/styles/sections/home.css", "src/styles/components/blocks.css", "src/templates/home.mjs"] },
      { id: "facts", title: "Facts", selector: ".facts", files: ["src/styles/sections/home.css", "src/scripts/facts.js", "src/templates/home.mjs"] },
      { id: "footer", title: "Footer", selector: "footer", files: ["src/styles/components/footer.css", "src/templates/layout.mjs"] },
      { id: "tabbar", title: "Tab bar", selector: ".tabbar", files: ["src/styles/components/nav.css", "src/scripts/nav.js", "src/templates/layout.mjs"] },
    ],
  },
};
