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
// not fit, the same coffee twice, fewer than three coffees, a reason with an empty word, or reads «Оценка Q».
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
    coded: c.coded, position: c.position, flavour: t.flavour, notes, methods: c.methods, next, dirs,
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

// ── every combination of answers ─────────────────────────────────────────────────────────────────────────────────
const ids = (id) => steps.find((s) => s.id === id).options.map((o) => o.id);
const all = [];
for (const method of ids("method")) for (const milk of ids("milk")) for (const now of ids("now")) for (const taste of ids("taste")) all.push({ method, milk, now, taste });
const name = (s) => coffees.find((c) => c.slug === s).name;
const seen = new Map();
for (const a of all) {
  const r = result(a, D), key = Object.values(a).join(".");
  if (r.picks.length !== 3) fail(`${key}: ${r.picks.length} coffees, not 3`);
  if (new Set(r.picks.map((p) => p.slug)).size !== 3) fail(`${key}: a coffee twice`);
  for (const p of r.picks) {
    const c = coffees.find((x) => x.slug === p.slug);
    if (!eligible(c, a)) fail(`${key}: offers ${c.slug}, which is sold out, a decaf or not roasted for ${a.method}`);
    if ([...p.why, p.taste, p.but || "x"].some((w) => !w || /undefined|null|NaN/.test(w))) fail(`${key}: an empty or broken reason for ${c.slug}`);
  }
  for (const p of r.picks) seen.set(p.slug, (seen.get(p.slug) || 0) + 1);
  all.find((x) => x === a).r = r;
}

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
