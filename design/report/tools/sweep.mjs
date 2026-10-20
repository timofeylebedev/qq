// Sweeps the built site (npm run build; served by this script from dist/) at every 10px of width from 320 to 1920
// (screen 1100 tall) and every 25px of height from 400 to 1100 (1440 wide), and writes design/report/sweep.json:
//   · every size role of design/scale.json as the browser resolves it (a probe element per role)
//   · the sizes of the main blocks (hero, featured coffee, image blocks, product stage, buy bar)
//   · the layout states (columns of each grid, the navbar's mode, the buy bar's rows …)
//   node design/report/tools/sweep.mjs [--dist=<a built site, default dist/>] [--out=<file, default sweep.json>]
// A round sweeps the previous build too (its dist from a worktree of the last commit) into sweep-before.json.
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, join, extname } from "node:path";

const root = resolve(import.meta.dirname, "../../..");
const arg = (k) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
const dist = arg("dist") || join(root, "dist"), OUT = arg("out") || join(root, "design/report/sweep.json");
const scale = JSON.parse(readFileSync(join(root, "design/scale.json"), "utf8"));
const ROLES = [...Object.entries(scale.type.roles).map(([k]) => ["--" + k.replace("/", "-"), k]), ...Object.entries(scale.space.roles).map(([k, r]) => [r.css, k])];
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".webp": "image/webp", ".avif": "image/avif", ".woff2": "font/woff2", ".json": "application/json", ".jpg": "image/jpeg" };
const server = createServer(async (req, res) => {
  const p = decodeURIComponent(new URL(req.url, "http://x").pathname), f = join(dist, p.endsWith("/") ? p + "index.html" : p);
  try { const b = await readFile(f); res.writeHead(200, { "content-type": TYPES[extname(f)] || "application/octet-stream" }); res.end(b); } catch { res.writeHead(404); res.end(); }
}).listen(0);
const base = `http://localhost:${server.address().port}/`;

function probe(roles) {
  const r = (x) => Math.round(x * 100) / 100;
  let box = document.getElementById("__probe");
  if (!box) {
    box = document.createElement("div"); box.id = "__probe"; box.style.cssText = "position:absolute;left:0;top:0;visibility:hidden;pointer-events:none";
    for (const [css] of roles) { const d = document.createElement("div"); d.dataset.css = css; d.style.width = `var(${css})`; d.style.height = "1px"; box.append(d); }
    document.body.append(box);
  }
  const out = {};
  for (const d of box.children) out[d.dataset.css] = r(d.getBoundingClientRect().width);
  const q = (s) => document.querySelector(s), rect = (s) => q(s)?.getBoundingClientRect();
  const cols = (s) => { const e = q(s); if (!e) return null; const t = getComputedStyle(e).gridTemplateColumns; return t === "none" ? 1 : t.split(" ").filter(Boolean).length; };
  const page = location.pathname;
  if (q(".hero")) {
    out.heroH = r(rect(".hero").height); out.heroCols = cols(".hero__grid");
    out.featuredH = r(rect(".featured__slide").height); out.featuredCols = cols(".featured__slide");
    out.storyH = r(rect(".story").height);
    const reel = q(".reel"), card = q(".reel > .card");
    out.recsPerView = r(reel.getBoundingClientRect().width / (card.getBoundingClientRect().width + parseFloat(getComputedStyle(reel).columnGap)));
    out.factsCols = cols(".facts__list"); out.businessCols = cols(".business__cards");
    out.storyLayout = getComputedStyle(q(".story__image")).position === "absolute" ? 2 : 1;
    out.countdownPx = r(parseFloat(getComputedStyle(q(".hero__count .digits")).fontSize));
    const tw = (e) => { if (!e) return null; const g = document.createRange(); g.selectNodeContents(e); return r(g.getBoundingClientRect().width); };
    out.digitsW = tw(q(".hero__count .digits")); out.captionW = tw(q(".hero__caption"));
    out.heroRow = r(q(".hero__links li").getBoundingClientRect().height);
    out.heroCellsH = r(rect(".hero__grid").height);
    out.heroPhoto = r(rect(".hero__info").top - rect(".hero").top);
    // round 5: the title's size, where the line between the first two links ends (0: at the screen's edge), the
    // info block's plus from its corner, the business gap, the taste cell's side
    out.heroTitlePx = r(parseFloat(getComputedStyle(q(".hero__title")).fontSize));
    const li2 = document.querySelectorAll(".hero__links li")[1], lb = li2.getBoundingClientRect(), ps = getComputedStyle(li2, "::before");
    out.heroLineEnd = r(innerWidth - (ps.content !== "none" && ps.borderTopStyle !== "none" ? lb.right - parseFloat(ps.right) : lb.right));
    const fo = rect(".fact__open"), pl = rect(".fact__more svg"); out.factPlusIn = r(fo.right - pl.right);
    out.businessGap = r(rect(".business__cards").top - rect(".business .head").bottom);
    const tc = q(".featured__facts > .taste"); if (tc) { const g = document.createRange(); g.selectNodeContents(tc.querySelector("dt")); out.tasteSide = r(g.getBoundingClientRect().left - tc.getBoundingClientRect().left); }
  }
  if (q("[data-grid]")) { out.catalogTracks = cols("[data-grid]"); out.catalogFirstW = r(rect("[data-grid] > .card").width); out.filterRows = new Set([...document.querySelectorAll(".filter")].map((f) => Math.round(f.getBoundingClientRect().top))).size; }
  if (q(".pstage")) {
    out.pinH = r(rect(".pstage__pin").height); out.packW = r(rect(".pack--hero").width); out.packH = r(rect(".pack--hero").height);
    out.buybarH = r(rect(".buybar").height); out.buybarRows = new Set([...document.querySelectorAll(".buybar .cell, .buybar__add")].map((c) => Math.round(c.getBoundingClientRect().top))).size;
    out.tileW = r(rect(".ptile").width); out.stageRun = r(rect(".pstage").height);
  }
  // the navbar's step: 0 tab bar, 1 burger, 2 short sections, 3 every section (round 1 had burger or links)
  const shown = (s) => { const e = q(s); return !!e && getComputedStyle(e).display !== "none" && e.getBoundingClientRect().width > 0; };
  out.nav = shown(".tabbar") ? 0 : shown(".nav__burger") ? 1 : shown(".nav__links--short") ? 2 : 3;
  const ni = q(".nav__in") || q(".nav__bar");
  out.navContentW = r(ni.getBoundingClientRect().width);
  out.navLogoX = r(q(".nav__logo svg").getBoundingClientRect().left);
  out.footerCols = cols(".footer__inner"); out.colW = r(rect(".col").width);
  // round 3: the footer's halves (squares from L), the flame's mass centre against the square's middle, the legal
  // line's two texts (one baseline), the newsletter's line count
  const fb = rect(".footer__brand"), fl = rect(".footer__links");
  out.footerBrandW = r(fb.width); out.footerBrandH = r(fb.height); out.footerLinksW = r(fl.width);
  out.footerRatio = r(fb.height / fb.width);
  const mk = q(".footer__mark img, .footer__mark svg")?.getBoundingClientRect();
  if (mk) out.footerMarkDy = r(mk.top + mk.height * 0.6287 - (fb.top + fb.height / 2));
  const lg = [...document.querySelectorAll(".footer__legal > *")].map((e) => { const g = document.createRange(); g.selectNodeContents(e); const rr = g.getClientRects(); return rr[rr.length - 1]?.bottom ?? 0; });
  out.legalDy = r(Math.abs(lg[0] - lg[1]));
  const nl = q(".footer__news-label"); out.newsLines = Math.round(nl.getBoundingClientRect().height / parseFloat(getComputedStyle(nl).lineHeight));
  const nf = rect(".footer__news .field"), nlr = nl.getBoundingClientRect(); out.newsHalf = nlr.right <= nf.left + 1 ? r(nf.width) : 0;   // round 5: the field's width when beside the line
  if (q(".featured__slide")) {
    out.featTextW = r(rect(".featured__text").width); out.featMediaW = r(rect(".featured__media").width);
    out.featTextH = r(rect(".featured__text").height); out.featMediaH = r(rect(".featured__media").height);
    const fc = [...document.querySelectorAll(".featured__slide:first-child .featured__facts > *")].map((e) => e.getBoundingClientRect().width);
    out.featFactsDiff = r(Math.abs(fc[0] - (fc[1] ?? fc[0])));
    const h = rect(".featured .head"), pg = rect(".featured .pager"); out.pagerDx = r(pg.left + pg.width / 2 - (h.left + h.width / 2));
    out.reelBleed = r(q(".reel").getBoundingClientRect().width - q(".reel").parentElement.getBoundingClientRect().width);   // how far the row runs past the column
  }
  return out;
}

const browser = await chromium.launch({ args: ["--disable-3d-apis"] });
const result = { measured: new Date().toISOString(), width: {}, height: {} };
for (const path of ["", "catalog/", "coffee/keniya-kisii/"]) {
  const p = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  await p.goto(base + path, { waitUntil: "networkidle" });
  await p.addStyleTag({ content: "canvas{display:none!important} *{transition:none!important;animation:none!important}" });
  const name = path || "home";
  result.width[name] = []; result.height[name] = [];
  for (let w = 320; w <= 1920; w += 10) { await p.setViewportSize({ width: w, height: 1100 }); await p.waitForTimeout(25); result.width[name].push({ w, ...(await p.evaluate(probe, ROLES)) }); }
  for (let h = 400; h <= 1100; h += 25) { await p.setViewportSize({ width: 1440, height: h }); await p.waitForTimeout(25); result.height[name].push({ h, ...(await p.evaluate(probe, ROLES)) }); }
  await p.close();
  console.log(name, "done");
}
await browser.close(); server.close();
writeFileSync(OUT, JSON.stringify(result));
console.log(OUT);
