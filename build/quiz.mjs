// The quiz «Выбрать кофе за минуту» (session 4 of choosing coffee): what the page needs, and every result listed.
//
//   node build/quiz.mjs   → src/data/quiz.json     (generated; runs before dev and build, after build/choose.mjs)
//                           docs/quiz-output.md    every answer and what it gives (commit it)
//
// Input: data/quiz.json (the questions, what each answer does, the words), src/data/choose.json (the brewing methods
// and what QQ sells for each, the map, every coffee's chips and region: the catalogue's, session 3), src/data/taste.json
// (positions, flavour, the anchors, the coffee page's moves: session 1–2), src/data/products.json. The arithmetic is
// src/scripts/quiz.js. How it works: docs/quiz.md.
// The build fails when any combination of answers offers a sold-out coffee, a decaf, a coffee the method's roast does
// not fit or a roast or grind it is not sold in (checked against products.json and site.json, not quiz.js's own rules),
// the same coffee twice or two near twins, fewer than three coffees, a reason with an empty word, a link to the
// catalogue without the first coffee, a summary that contradicts the first card, or reads «Оценка Q». It also runs
// every answer again with the most offered coffee sold out.
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { familyMatrix } from "../src/scripts/taste.js";
import { result, eligible } from "../src/scripts/quiz.js";

const root = resolve(import.meta.dirname, "..");
const read = (f) => JSON.parse(readFileSync(resolve(root, f), "utf8"));
const Q = read("data/quiz.json"), C = read("src/data/choose.json"), T = read("src/data/taste.json");
const { products } = read("src/data/products.json");
const FLAV = read("data/flavours.json");
const fail = (msg) => { console.error(`build/quiz.mjs: ${msg}`); process.exit(1); };
if (/"q"\s*:|Оценка Q/.test(JSON.stringify(Q.region) + JSON.stringify(Q.alternatives))) fail("a rule reads «Оценка Q»: never rank or pick by it");

const P = new Map(products.map((p) => [p.slug, p])), TM = new Map(T.coffees.map((c) => [c.slug, c]));
const MOVES = ["softer", "brighter", "denser", "lighter", "unusual", "classic"];
const coffees = C.coffees.map((c) => {
  const t = TM.get(c.slug), p = P.get(c.slug);
  const next = Object.fromEntries((t.next?.moves || []).filter((m) => MOVES.includes(m.id)).map((m) => [m.id, m.slug]));
  const dirs = Object.fromEntries(MOVES.map((d) => [d, (t.directions[d]?.ranked || []).map((r) => r.slug)]));
  const small = p.weights.find((w) => w.grams === 50);
  // each descriptor with its flavour families (data/flavours.json), so a reason names the notes that match an answer
  const notes = p.descriptors.map((d) => { const m = FLAV.descriptors[d]; return { d, f: !m ? [] : typeof m === "string" ? [m] : Object.keys(m) }; });
  return {
    slug: c.slug, name: c.name, i: c.i, out: c.out, decaf: c.decaf, line: c.line, short: p.short, descriptors: p.descriptors,
    milk: c.use.includes("Молочные напитки"), chips: c.chips, axes: c.axes, tastes: c.tastes, region: c.region, map: c.map,
    roasts: c.roasts, omni: !!c.omni, robusta: !!t.robusta, coded: c.coded, position: c.position, flavour: t.flavour, notes, methods: c.methods, next, dirs,
    small: small ? { label: small.label, price: small.price } : null
  };
});

// the questions, with the brewing methods of the catalogue (the same eight, the same names) and «Пока не знаю»
const steps = Q.steps.map((s) => s.methods
  ? { id: s.id, ask: s.ask, hint: s.hint, options: [...C.methods.map((m) => ({ id: m.id, ru: m.ru, roast: m.roast })), ...s.extra] }
  : { id: s.id, ask: s.ask, hint: s.hint, options: s.options });
const anchors = Object.fromEntries(T.anchors.drinks.map((d) => [d.name, { center: d.center, spread: d.spread, flavour: d.flavour, coffees: d.coffees }]));
for (const [id, n] of Object.entries(Q.region.now)) for (const name of [n.anchor, n.milkAnchor, ...Object.values(n.methodAnchor || {})].filter(Boolean)) if (!n.start && !anchors[name]) fail(`now.${id}: no anchor «${name}» in taste.json anchors.drinks`);
for (const o of Q.steps.find((s) => s.id === "taste").options) if (!Q.region.taste[o.id]) fail(`taste.${o.id} has no rule in region.taste`);

const D = {
  steps, b2b: Q.b2b, title: Q.title, lead: Q.lead, words: Q.words, rules: Q.region, alternatives: Q.alternatives, anchors,
  S: familyMatrix(FLAV.families, FLAV.similarity), map: { axes: C.map.axes }, dist: C.dist, coffees
};

// ── every combination of answers, checked against the sources (products.json, site.json, the method's roast), not
// against quiz.js's own eligible(): a wrong rule in quiz.js must not pass its own test ───────────────────────────────
const ids = (id) => steps.find((s) => s.id === id).options.map((o) => o.id);
const all = [];
for (const method of ids("method")) for (const milk of ids("milk")) for (const now of ids("now")) for (const taste of ids("taste")) all.push({ method, milk, now, taste });
const name = (s) => coffees.find((c) => c.slug === s).name;
const SITE = read("data/site.json"), METHOD = new Map(C.methods.map((m) => [m.id, m]));
function check(a, r, out) {
  const key = Object.values(a).join(".");
  if (r.picks.length !== 3) fail(`${key}: ${r.picks.length} coffees, not 3`);
  if (new Set(r.picks.map((p) => p.slug)).size !== 3) fail(`${key}: a coffee twice`);
  for (const p of r.picks) {
    const pr = P.get(p.slug), m = METHOD.get(a.method), t = TM.get(p.slug);
    if (out.has(p.slug)) fail(`${key}: offers ${p.slug}, which QQ has run out of (shop.unavailable)`);
    if (t.decaf || /декаф|decaf/i.test(pr.name)) fail(`${key}: offers the decaf ${p.slug}`);
    const omni = coffees.find((c) => c.slug === p.slug).omni;
    if (m && m.roast !== "any" && !omni && !pr.roasts.some((x) => x.use === m.roast)) fail(`${key}: offers ${p.slug}, not roasted ${m.roast}`);
    if (p.set && p.set.roast && !pr.roasts.some((x) => x.use === p.set.roast)) fail(`${key}: sets a roast ${p.set.roast} that ${p.slug} is not sold in`);
    if (p.set && !pr.grind.includes(p.set.grind)) fail(`${key}: sets a grind ${p.set.grind} that ${p.slug} is not sold in`);
    if ([...p.why, p.taste, p.but || "x", p.set?.text || "x"].some((w) => !w || /undefined|null|NaN/.test(w))) fail(`${key}: an empty or broken reason for ${p.slug}`);
  }
  // no twins: three coffees that look different must be different
  const c3 = r.picks.map((p) => coffees.find((c) => c.slug === p.slug));
  for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) if (D.dist[c3[i].i][c3[j].i] < 0.4) fail(`${key}: ${c3[i].slug} and ${c3[j].slug} are near twins`);
  if (r.mode === "spread" && new Set(r.picks.map((p) => p.label)).size !== 3) fail(`${key}: two of the three different coffees have the same label`);
  // the link to the catalogue keeps the first coffee inside
  if (!r.catalogue.params.every(([k, v]) => k === "method" ? c3[0].methods[v].ok : k === "chip" ? c3[0].chips.includes(v) : c3[0].axes[k] === v)) fail(`${key}: the catalogue's part leaves out the first coffee`);
  // the summary never gives the taste as a reason beside a first card that says the opposite
  if (/кислинк|мягче, чем|классичнее|необычнее/.test(r.picks[0].but || "") && /выбрали|хотите/.test(r.summary[0])) fail(`${key}: the summary names the taste the first card contradicts`);
}
const OUTS = new Set(SITE.shop.unavailable);
const seen = new Map();
for (const a of all) {
  const r = result(a, D);
  check(a, r, OUTS);
  for (const p of r.picks) seen.set(p.slug, (seen.get(p.slug) || 0) + 1);
  a.r = r;
}
// a self-test of the sold-out guard: the most offered coffee runs out, and every answer must still give three in stock
const top = [...seen].sort((x, y) => y[1] - x[1])[0][0];
const D2 = { ...D, coffees: coffees.map((c) => c.slug === top ? { ...c, out: true } : c) };
for (const a of all) check(a, result(a, D2), new Set([...OUTS, top]));

const firsts = new Map();
for (const a of all) if (a.r.mode === "pick") firsts.set(a.r.picks[0].slug, (firsts.get(a.r.picks[0].slug) || 0) + 1);
writeFileSync(resolve(root, "src/data/quiz.json"), JSON.stringify({ generated: "build/quiz.mjs from data/quiz.json, src/data/choose.json, src/data/taste.json; do not edit", ...D }) + "\n");
writeFileSync(resolve(root, "docs/quiz-output.md"), report() + "\n");
console.log(`src/data/quiz.json: ${all.length} answer sets, ${seen.size} of ${coffees.filter((c) => !c.out && !c.decaf).length} coffees offered, ${firsts.size} ever first`);

function report() {
  const L = ["# What every answer of the quiz gives", "",
    "Written by `build/quiz.mjs` (`npm run quiz`) from `data/quiz.json`, the catalogue's methods and map and the taste model. Do not edit: change the data or the rules and rebuild. How it works: `docs/quiz.md`.", "",
    `${all.length} answer sets (${ids("method").length} methods × ${ids("milk").length} × ${ids("now").length} × ${ids("taste").length}). «Не знаю» for the taste gives three different coffees (marked ≠); otherwise the first coffee, then two moves away from it. The move's source: page = the coffee page's «Что взять еще», model = the taste model's direction, region = the best in the visitor's region.`, "",
    "## How often each coffee is offered", "", "| Coffee | Offered | First |", "|---|---|---|"];
  for (const c of coffees) L.push(`| ${c.name}${c.out ? " (нет в наличии)" : ""}${c.decaf ? " (без кофеина: never offered)" : ""} | ${seen.get(c.slug) || 0} | ${firsts.get(c.slug) || 0} |`);
  const label = (k, v) => steps.find((s) => s.id === k).options.find((o) => o.id === v).ru;
  for (const method of ids("method")) {
    L.push("", `## ${label("method", method)}`, "");
    for (const milk of ids("milk")) for (const now of ids("now")) for (const taste of ids("taste")) {
      const a = all.find((x) => x.method === method && x.milk === milk && x.now === now && x.taste === taste), r = a.r;
      L.push(`- **${label("milk", milk)} · ${label("now", now)} · ${label("taste", taste)}** — ${r.mode === "spread" ? "≠ " : ""}${r.picks.map((p) => `${p.role === "first" ? "" : `${p.label}: `}${name(p.slug)}${p.from && p.from !== "page" ? ` (${p.from})` : ""}`).join("; ")}. *${r.summary[0]}*`);
    }
  }
  return L.join("\n");
}
