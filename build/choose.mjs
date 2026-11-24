// What a visitor can choose by: for every coffee, which brewing methods it suits (and the roast and grind to set),
// which scenario chips and taste groups it belongs to, and its place on the taste map. The catalogue reads it
// (src/templates/catalog.mjs, scripts/filters.js); the quiz (session 4) will read the same.
//
//   node build/choose.mjs   → src/data/choose.json     (generated, like products.json and taste.json; runs before dev/build)
//                             docs/choose-output.md    every method, chip and filter option with the coffees it finds (commit it)
//
// Input: data/choose.json (methods, chips, groups), src/data/products.json, src/data/taste.json, data/site.json
// (`shop.unavailable`: what QQ has run out of). The arithmetic is src/scripts/choose.js. How it works: docs/choose.md.
// The build fails when a method names a roast or a grind QQ does not sell, when a chip or a method finds fewer than
// three coffees, when an acidity level does not cover every coffee exactly once, or when a rule reads «Оценка Q».
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { methodFit, meets, rank, missOf, nearOf, roastMiss, layout, clearance } from "../src/scripts/choose.js";
import { familyMatrix, distance } from "../src/scripts/taste.js";

const root = resolve(import.meta.dirname, "..");
const read = (f) => JSON.parse(readFileSync(resolve(root, f), "utf8"));
const CFG = read("data/choose.json");
const { products } = read("src/data/products.json");
const model = read("src/data/taste.json");
const OUT = new Set(read("data/site.json").shop.unavailable);
const T = new Map(model.coffees.map((c) => [c.slug, c]));
const FLAV = read("data/flavours.json"), S = familyMatrix(FLAV.families, FLAV.similarity);

const fail = (msg) => { console.error(`build/choose.mjs: ${msg}`); process.exit(1); };
if (/"q"\s*:|Оценка Q/.test(JSON.stringify(CFG.chips))) fail("a chip reads «Оценка Q»: never rank or pick by it");

// ── the coffees as choose.js reads them ──────────────────────────────────────────────────────────────────────────
const coffees = products.map((p) => {
  const t = T.get(p.slug);
  if (!t) fail(`${p.slug} is not in the taste model`);
  return {
    slug: p.slug, name: p.name, line: p.line, type: p.type, decaf: !!t.decaf, out: OUT.has(p.slug),
    roasts: p.roasts.map((r) => r.use), grind: p.grind,
    use: p.use.filter((u) => u !== "Вторая кофемолка"),   // QQ's word for cafés; never shown or matched (session 0)
    coded: { acidity: p.taste.acidity, density: p.taste.density, ferment: p.taste.ferment, sweetness: p.taste.sweetness },
    position: { bright: t.position.bright, body: t.position.body, unusual: t.position.unusual },
    flavour: t.flavour
  };
});

// ── methods: every roast and grind must be one QQ sells ──────────────────────────────────────────────────────────
const ROASTS = new Set(coffees.flatMap((c) => c.roasts)), GRINDS = new Set(coffees.flatMap((c) => c.grind));
for (const m of CFG.methods) {
  if (m.roast !== "any" && !ROASTS.has(m.roast)) fail(`method ${m.id}: QQ sells no roast «${m.roast}» (it sells ${[...ROASTS].join(", ")})`);
  if (m.roast === "any" && !ROASTS.has(m.prefer)) fail(`method ${m.id}: QQ sells no roast «${m.prefer}»`);
  if (!GRINDS.has(m.grind)) fail(`method ${m.id}: QQ sells no grind «${m.grind}» (it sells ${[...GRINDS].join(", ")})`);
}

// ── what each coffee is ──────────────────────────────────────────────────────────────────────────────────────────
const groupOf = (c) => CFG.flavours.groups.filter((g) => g.families.reduce((s, f) => s + (c.flavour[f] || 0), 0) >= CFG.flavours.share - 1e-9).map((g) => g.id);
const levelOf = (c) => CFG.acidity.filter((l) => (l.min == null || c.coded.acidity >= l.min) && (l.max == null || c.coded.acidity <= l.max)).map((l) => l.id);
for (const c of coffees) {
  c.methods = Object.fromEntries(CFG.methods.map((m) => [m.id, methodFit(c, m)]));
  c.chips = CFG.chips.filter((k) => meets(c, k.when)).map((k) => k.id);
  const lv = levelOf(c);
  if (lv.length !== 1) fail(`${c.slug}: acidity ${c.coded.acidity} is in ${lv.length} levels of data/choose.json acidity (must be one)`);
  c.acid = lv[0];
  c.tastes = groupOf(c);
}

// ── the taste map: acidity across, body up, in one shape (a little wider than tall) at every width: a wide one would
// need the whole column before its dots reached 24px (the bench's map form). Nine regions: acidity soft / mid / bright
// (data/choose.json `acidity`) × body light (≤ 2) / mid (3) / dense (≥ 4); a coffee is in its region by its coded
// values, and the region's lines are drawn midway between the dots of neighbouring bands (never through a dot). ─────
const BOX = { x0: 0.5, x1: 5.1, y0: 1.4, y1: 5.6 };
const SHAPE = { aspect: 1.1, r: 0.035 };
const BODY = [["dense", (d) => d >= 4], ["mid", (d) => d > 2 && d < 4], ["light", (d) => d <= 2]];
const ACID = CFG.acidity.map((a) => a.id);
const REGION = {
  "soft-dense": "Мягкие и плотные", "mid-dense": "Плотные", "bright-dense": "Яркие и плотные",
  "soft-mid": "Мягкие", "mid-mid": "Середина", "bright-mid": "Яркие",
  "soft-light": "Мягкие и лёгкие", "mid-light": "Лёгкие", "bright-light": "Яркие и лёгкие"
};
const L = layout(coffees.map((c) => ({ id: c.slug, x: c.position.bright, y: c.position.body })), { ...BOX, ...SHAPE });
const gap = clearance(L, SHAPE);
if (gap < 0.98) fail(`the taste map's dots overlap (closest ${gap.toFixed(2)} of a dot apart)`);
for (const p of L) { const c = coffees.find((x) => x.slug === p.id); c.map = { u: p.u, v: p.v }; c.region = `${c.acid}-${BODY.find(([, t]) => t(c.coded.density))[0]}`; }
// the lines between bands: midway between the last dot of one band and the first of the next (in 0–1 of the box)
const cuts = (pos, band, order) => {
  const span = order.map((id) => { const xs = coffees.filter((c) => band(c) === id).map(pos); return xs.length ? [Math.min(...xs), Math.max(...xs)] : null; });
  const out = [0];
  for (let i = 0; i < order.length - 1; i++) {
    const a = span[i], b = span[i + 1];
    if (a && b && a[1] >= b[0]) fail(`taste map: the bands ${order[i]} and ${order[i + 1]} overlap`);
    out.push(+(a && b ? (a[1] + b[0]) / 2 : (i + 1) / order.length).toFixed(4));
  }
  return [...out, 1];
};
const map = {
  axes: { x: { from: "acidity", ru: ["Мягче", "Ярче"], min: BOX.x0, max: BOX.x1 }, y: { from: "density", ru: ["Легче", "Плотнее"], min: BOX.y0, max: BOX.y1 } },
  ...SHAPE, gap: +gap.toFixed(2),
  cols: cuts((c) => c.map.u, (c) => c.acid, ACID), colIds: ACID,
  rows: cuts((c) => c.map.v, (c) => c.region.split("-")[1], BODY.map(([id]) => id)), rowIds: BODY.map(([id]) => id),
  regions: Object.entries(REGION).map(([id, ru]) => ({ id, ru, n: coffees.filter((c) => c.region === id).length }))
};
// a dot must sit inside its region's lines
for (const c of coffees) {
  const [a, b] = c.region.split("-"), i = map.colIds.indexOf(a), j = map.rowIds.indexOf(b);
  if (c.map.u < map.cols[i] || c.map.u > map.cols[i + 1] || c.map.v < map.rows[j] || c.map.v > map.rows[j + 1]) fail(`taste map: ${c.slug} is drawn outside its region ${c.region}`);
}

// ── the taste model's distance between every two coffees (the near misses are the closest to the matches) ────────
const pos = (slug) => { const t = T.get(slug); return { ...t.position, flavour: t.flavour, process: t.process }; };
const dist = coffees.map((a) => coffees.map((b) => +distance(pos(a.slug), pos(b.slug), S).toFixed(2)));
coffees.forEach((c, i) => { c.i = i; delete c.flavour; });

// ── every option must find coffees ───────────────────────────────────────────────────────────────────────────────
const live = coffees.filter((c) => !c.out);
for (const m of CFG.methods) if (live.filter((c) => c.methods[m.id].ok).length < 3) fail(`method ${m.id} fits fewer than three coffees in stock`);
for (const k of CFG.chips) if (live.filter((c) => c.chips.includes(k.id)).length < 3) fail(`chip ${k.id} finds fewer than three coffees in stock`);
for (const g of CFG.flavours.groups) if (live.filter((c) => c.tastes.includes(g.id)).length < 2) fail(`taste group ${g.id} finds fewer than two coffees in stock`);

const out = {
  generated: "build/choose.mjs from data/choose.json, src/data/products.json, src/data/taste.json; do not edit",
  methods: CFG.methods.map(({ survey, ...m }) => m),
  chips: CFG.chips.map(({ id, ru, why }) => ({ id, ru, why })),
  acidity: CFG.acidity.map(({ id, ru, hint }) => ({ id, ru, hint })),
  tastes: CFG.flavours.groups.map(({ id, ru }) => ({ id, ru })),
  map,
  coffees,
  dist
};
writeFileSync(resolve(root, "src/data/choose.json"), JSON.stringify(out, null, 1) + "\n");
writeFileSync(resolve(root, "docs/choose-output.md"), report(out) + "\n");
console.log(`src/data/choose.json: ${coffees.length} coffees, ${CFG.methods.length} methods, ${CFG.chips.length} chips, map gap ${map.gap}, regions ${map.regions.map((r) => r.n).join("/")}`);

// ── the readable list: every option alone, and every method with every chip ──────────────────────────────────────
function report(o) {
  const name = (c) => c.name + (c.out ? " (нет в наличии)" : "");
  const d = (a, b) => o.dist[a.i][b.i];
  const list = (cs) => cs.length ? cs.map(name).join(", ") : "—";
  const L = ["# What every choice finds", "",
    "Written by `build/choose.mjs` (`npm run choose`) from `data/choose.json` and the coffees of the site. Do not edit: change the data or the rules and rebuild. How it works: `docs/choose.md`.", "",
    `${o.coffees.length} coffees${OUT.size ? `; sold out now: ${[...OUT].join(", ")}` : "; nothing is sold out (data/site.json shop.unavailable)"}. The catalogue never hides a coffee: a choice lifts its matches to the top, then the nearest misses with what they miss, then the rest.`, ""];
  L.push("## Brewing methods", "", "| Method | Roast · grind set | Fits | Coffees | Not in this roast |", "|---|---|---|---|---|");
  for (const m of o.methods) {
    const yes = o.coffees.filter((c) => c.methods[m.id].ok), no = o.coffees.filter((c) => !c.methods[m.id].ok);
    const sets = [...new Set(yes.map((c) => `${c.methods[m.id].roast} · ${c.methods[m.id].grind}`))].join("; ");
    L.push(`| ${m.ru} | ${sets} | ${yes.length} | ${list(yes)} | ${list(no)} |`);
  }
  L.push("", "## Chips", "", "| Chip | Rule | Finds | Coffees |", "|---|---|---|---|");
  for (const k of CFG.chips) { const yes = o.coffees.filter((c) => c.chips.includes(k.id)); L.push(`| ${k.ru} | \`${JSON.stringify(k.when)}\` | ${yes.length} | ${list(yes)} |`); }
  L.push("", "## Acidity", "", "| Level | Finds | Coffees |", "|---|---|---|");
  for (const a of o.acidity) { const yes = o.coffees.filter((c) => c.acid === a.id); L.push(`| ${a.ru} (${a.hint}) | ${yes.length} | ${list(yes)} |`); }
  L.push("", `## Taste groups (families ≥ ${CFG.flavours.share} of the profile)`, "", "| Group | Finds | Coffees |", "|---|---|---|");
  for (const g of o.tastes) { const yes = o.coffees.filter((c) => c.tastes.includes(g.id)); L.push(`| ${g.ru} | ${yes.length} | ${list(yes)} |`); }
  L.push("", "## Regions of the taste map", "", "| Region | Finds | Coffees |", "|---|---|---|");
  for (const r of o.map.regions) { const yes = o.coffees.filter((c) => c.region === r.id); L.push(`| ${r.ru} | ${yes.length} | ${list(yes)} |`); }
  L.push("", "## Every chip alone", "", "Matches, then «Почти»: the three coffees nearest in taste to the matches (what each misses in brackets).", "");
  for (const k of CFG.chips) {
    const r = rank(o.coffees, [{ id: k.id, miss: (c) => missOf(c, k), near: (c) => nearOf(c, k), test: (c) => c.chips.includes(k.id) }], { dist: d });
    L.push(`- **${k.ru}:** ${r.exact.length}: ${list(r.exact)}. Почти: ${r.near.map((n) => `${name(n.c)} (${n.missing.join(", ")})`).join("; ")}.`);
  }
  L.push("", "## Every method with every chip", "", "Matches, then the nearest misses (what they miss in brackets): a coffee that only differs in taste before one QQ doesn't roast for the method.", "");
  for (const m of o.methods) for (const k of o.chips) {
    const chip = CFG.chips.find((x) => x.id === k.id);
    const r = rank(o.coffees, [
      { id: m.id, method: true, miss: roastMiss, test: (c) => c.methods[m.id].ok },
      { id: k.id, miss: (c) => missOf(c, chip), near: (c) => nearOf(c, chip), test: (c) => c.chips.includes(k.id) }
    ], { dist: d });
    L.push(`- **${m.ru} + ${k.ru}:** ${r.exact.length ? `${r.exact.length}: ${list(r.exact)}` : "точно таких нет"}${r.near.length ? `. Почти: ${r.near.map((n) => `${name(n.c)} (${n.missing.join(", ")})`).join("; ")}` : ""}.`);
  }
  return L.join("\n");
}
