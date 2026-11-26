// The feedback after delivery (session 6 of choosing coffee): what the account needs, and every answer's effect listed.
//
//   node build/feedback.mjs   → src/data/feedback.json   (generated; runs before dev and build, after build/quiz.mjs)
//                               docs/feedback-output.md  every coffee × every answer: where the visitor moves, what comes next
//
// Input: data/feedback.json (when to ask, the three rows, what an answer weighs, the words), src/data/quiz.json (the
// coffees as the quiz sees them: positions, flavour, which methods QQ roasts each for, the coffee page's moves),
// src/data/choose.json (the methods and the map's axes), src/data/taste.json (each coffee's nearest, with the model's
// words). The arithmetic is src/scripts/feedback.js. How it works: docs/feedback.md.
// The build fails when any answer, about any coffee, brewed any way, with or without milk:
//   offers a sold-out coffee, a decaf, a coffee not roasted for the method, or one the visitor already answered about
//   as a new coffee (checked against products.json and site.json, not feedback.js's own rules);
//   offers a move that goes the wrong way on QQ's own coded scales;
//   moves the visitor against the answer («слишком ярко» brighter), or moves them at all for «не про вкус»;
//   leaves an empty or broken word, or reads «Оценка Q».
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { replay, baseRegion, nextOf, tasteName, saidOf } from "../src/scripts/feedback.js";

const root = resolve(import.meta.dirname, "..");
const read = (f) => JSON.parse(readFileSync(resolve(root, f), "utf8"));
const R = read("data/feedback.json"), Q = read("src/data/quiz.json"), C = read("src/data/choose.json"), T = read("src/data/taste.json");
const { products } = read("src/data/products.json");
const SITE = read("data/site.json");
const fail = (msg) => { console.error(`build/feedback.mjs: ${msg}`); process.exit(1); };
if (/Оценка Q|"q"\s*:/.test(JSON.stringify(R))) fail("a rule reads «Оценка Q»: never rank or pick by it");

const TM = new Map(T.coffees.map((c) => [c.slug, c]));
const strip = ({ $about, ...o }) => o;
const F = {
  generated: "build/feedback.mjs from data/feedback.json, src/data/quiz.json, src/data/choose.json and src/data/taste.json — do not edit",
  rules: { ask: strip(R.ask), axes: R.axes, issues: R.issues, methodFromGrind: strip(R.methodFromGrind), methodFromRoast: strip(R.methodFromRoast), weights: strip(R.weights), show: strip(R.show), next: strip(R.next) },
  words: R.words,
  methods: Object.fromEntries(C.methods.map((m) => [m.id, { ru: m.ru, short: m.short, roast: m.roast }])),
  axes: C.map.axes,
  quizWords: { acidity: Q.words.acidity, body: Q.words.body, unusual: Q.words.unusual, regions: Q.words.regions, robusta: Q.words.robusta, roast: Q.words.roast, grind: Q.words.grind },
  S: Q.S, dist: Q.dist,
  coffees: Q.coffees.map((c) => ({
    slug: c.slug, name: c.name, i: c.i, out: c.out, decaf: c.decaf, milk: c.milk, region: c.region, map: c.map,
    roasts: c.roasts, omni: c.omni, robusta: c.robusta, coded: c.coded, position: c.position, flavour: c.flavour,
    descriptors: c.descriptors, methods: c.methods, next: c.next, dirs: c.dirs,
    // the coffee's nearest, with the taste model's own words («Та же кислотность (3) и плотность (3). Общее во вкусе…»)
    near: (TM.get(c.slug).neighbours || []).filter((n) => !n.far).slice(0, 5).map((n) => ({ slug: n.slug, text: n.text }))
  }))
};
for (const k of ["bright", "body", "unusual"]) if (!R.axes[k]) fail(`axes.${k} missing`);

// ── every answer, checked against the sources ───────────────────────────────────────────────────────────────────
const P = new Map(products.map((p) => [p.slug, p])), OUT = new Set(SITE.shop.unavailable);
const METHOD = new Map(C.methods.map((m) => [m.id, m]));
const by = new Map(F.coffees.map((c) => [c.slug, c]));
const VALS = ["less", "ok", "more"];
const combos = [];
for (const bright of VALS) for (const body of VALS) for (const unusual of [...VALS, undefined]) combos.push({ bright, body, unusual });
const CODED = { bright: "acidity", body: "density", unusual: "ferment" };
const SIGN = { less: -1, more: 1 };
let runs = 0;
const tally = { move: 0, again: 0, edge: 0, dropped: 0, page: 0, single: 0 };
function checkNext(key, n, L, a, method, tasted) {
  if (!n.picks.length) { if (n.mode !== "edge") fail(`${key}: nothing offered`); tally.empty = (tally.empty || 0) + 1; }
  if (new Set(n.picks.map((p) => p.slug)).size !== n.picks.length) fail(`${key}: a coffee twice`);
  for (const p of n.picks) {
    const pr = P.get(p.slug), t = TM.get(p.slug), m = METHOD.get(method);
    if (OUT.has(p.slug)) fail(`${key}: offers ${p.slug}, which QQ has run out of (shop.unavailable)`);
    if (t.decaf || /декаф|decaf/i.test(pr.name)) fail(`${key}: offers the decaf ${p.slug}`);
    if (m && m.roast !== "any" && !by.get(p.slug).omni && !pr.roasts.some((x) => x.use === m.roast)) fail(`${key}: offers ${p.slug}, not roasted ${m.roast} for ${method}`);
    if (!["again", "closest", "fit"].includes(p.role) && tasted.has(p.slug)) fail(`${key}: offers ${p.slug} as new though it was answered about`);
    if (["again", "closest"].includes(p.role) && p.slug !== L.slug) fail(`${key}: «${p.label}» is not the coffee answered about`);
    if (p.role === "closest" && n.picks.length > 1) fail(`${key}: «Ближе всего — он сам» beside other cards`);
    if ([p.label, p.text].some((w) => !w || /undefined|null|NaN|\{/.test(w))) fail(`${key}: an empty or broken word on ${p.slug}: ${p.label} / ${p.text}`);
    // a move goes the right way on QQ's own coded scales (not the model's positions)
    if (p.role === "move") for (const d of p.dirs) {
      const k = { softer: "bright", brighter: "bright", lighter: "body", denser: "body", classic: "unusual", unusual: "unusual" }[d];
      const want = { softer: -1, brighter: 1, lighter: -1, denser: 1, classic: -1, unusual: 1 }[d];
      const diff = (t.coded[CODED[k]] - TM.get(L.slug).coded[CODED[k]]) * want;
      if (diff < 0 || (diff === 0 && k !== "unusual")) fail(`${key}: «${p.label}» ${p.slug} is not ${d} than ${L.slug} on QQ's scale (${CODED[k]} ${t.coded[CODED[k]]} vs ${TM.get(L.slug).coded[CODED[k]]})`);
    }
  }
  // no card goes back against the answer on QQ's own scale (a tie is allowed; «Снова» is the visitor's own find)
  const want = Object.entries({ bright: a.bright, body: a.body, unusual: a.unusual }).filter(([, v]) => v === "less" || v === "more");
  const Lc = TM.get(L.slug).coded;
  for (const p of n.picks) if (!["again", "closest"].includes(p.role)) for (const [k, v] of want) {
    const d = (TM.get(p.slug).coded[CODED[k]] - Lc[CODED[k]]) * SIGN[v];
    if (d < -0.5) fail(`${key}: «${p.label}» ${p.slug} goes against «${R.axes[k][v]}» (${CODED[k]} ${TM.get(p.slug).coded[CODED[k]]} vs ${Lc[CODED[k]]})`);
  }
  // a move changes what was asked: on a row not asked about, at most about one step of QQ's scale
  // every card keeps the rows not asked about: acidity and body within about one step, ferment never from a lot with it
  // to one without (QQ's coded ferment down by 2 or more), and no wilder by 2 or more
  for (const p of n.picks.filter((x) => !["again", "closest"].includes(x.role))) for (const k of ["bright", "body", "unusual"]) {
    if (want.some(([w]) => w === k)) continue;
    const d = TM.get(p.slug).coded[CODED[k]] - Lc[CODED[k]];
    if (k !== "unusual" && Math.abs(d) > 1.5) fail(`${key}: «${p.label}» ${p.slug} jumps ${d} on ${CODED[k]}, a row not asked about`);
    if (k === "unusual" && (d <= -2 || d >= 2)) fail(`${key}: «${p.label}» ${p.slug} changes ferment by ${d}, a row not asked about`);
  }
  if (!n.lead || /undefined|null|NaN|\{/.test(n.lead)) fail(`${key}: broken lead «${n.lead}»`);
  // «у нас нет … самый» only when it is true of every coffee in stock: none is a step that way from this one, whatever
  // the method or the guards
  if (n.mode === "edge") {
    const d = n.dirs[0], k = { softer: "bright", brighter: "bright", lighter: "body", denser: "body", classic: "unusual", unusual: "unusual" }[d];
    const s = { softer: -1, brighter: 1, lighter: -1, denser: 1, classic: -1, unusual: 1 }[d];
    const any = F.coffees.some((c) => !c.out && !c.decaf && c !== L && (TM.get(c.slug).coded[CODED[k]] - TM.get(L.slug).coded[CODED[k]]) * s > 0.5);
    if (n.edge === "most" && any) fail(`${key}: says ${L.slug} is QQ's ${d}-most, but another coffee is a step ${d} on QQ's own scale`);
    tally[`edge-${n.edge}`] = (tally[`edge-${n.edge}`] || 0) + 1;
  }
}

const rows = [];
const methodsOf = (c) => C.methods.filter((m) => c.methods[m.id]?.ok).map((m) => m.id);
const today = "2026-08-20T10:00";
for (const L of F.coffees) {
  if (L.decaf || L.out) continue;
  const roastFor = (m) => L.methods[m]?.roast || L.roasts[0];
  for (const method of methodsOf(L)) for (const milk of [false, true]) for (const ans of combos) {
    const a = { order: "o1", slug: L.slug, at: today, roast: roastFor(method), method, milk, ...ans };
    if (L.position.unusual < R.axes.unusual.askFrom && a.unusual) continue;   // the row is not asked about this coffee
    if (L.position.unusual >= R.axes.unusual.askFrom && !a.unusual) continue;  // …and required when it is
    const base = baseRegion({ first: [L.slug] }, F);
    const st = replay(base, [a], F);
    const key = `${L.slug}.${method}.${milk ? "milk" : "black"}.${ans.bright}/${ans.body}/${ans.unusual ?? "-"}`;
    // the region moves the way the answer points, on every axis
    for (const k of ["bright", "body", "unusual"]) {
      const d = st.region.center[k] - base.region.center[k];
      if (ans[k] === "less" && d > 1e-9) fail(`${key}: «${R.axes[k].less}» moved the visitor ${k} +${d.toFixed(2)}`);
      if (ans[k] === "more" && d < -1e-9) fail(`${key}: «${R.axes[k].more}» moved the visitor ${k} ${d.toFixed(2)}`);
      if (!ans[k] && Math.abs(d) > 1e-9) fail(`${key}: an unanswered row moved ${k}`);
    }
    const n = nextOf(st, F, { method, milk, bought: [L.slug] });
    checkNext(key, n, L, a, method, new Set([L.slug]));
    runs++;
    tally[n.mode] = (tally[n.mode] || 0) + 1;
    if (/Сразу/.test(n.lead)) tally.dropped++;
    // the listing: one method per coffee (its first), black, one row answered at a time, and «в самый раз» on all
    const single = ["bright", "body", "unusual"].filter((k) => ans[k] && ans[k] !== "ok");
    const fermented = L.position.unusual >= R.axes.unusual.askFrom;
    const oneRow = single.length === 1 && ["bright", "body", "unusual"].every((k) => single.includes(k) || !ans[k] || ans[k] === "ok") && single[0] !== "unusual";
    const allOk = ans.bright === "ok" && ans.body === "ok" && (fermented ? ans.unusual === "ok" : ans.unusual === undefined);
    if (!milk && method === methodsOf(L)[0] && (oneRow && ans.bright !== undefined && ans.body !== undefined && (single[0] === "bright" ? ans.body === "ok" : ans.bright === "ok") || allOk)) rows.push({ L, method, said: saidOf(a, F), n, st, base });
  }
  // the unusual row, alone, for the coffees it is asked about
  if (L.position.unusual >= R.axes.unusual.askFrom && !L.out && !L.decaf) for (const v of ["less", "more"]) {
    const method = methodsOf(L)[0];
    const a = { order: "o1", slug: L.slug, at: today, roast: roastFor(method), method, milk: false, bright: "ok", body: "ok", unusual: v };
    const st = replay(baseRegion({ first: [L.slug] }, F), [a], F);
    rows.push({ L, method, said: saidOf(a, F), n: nextOf(st, F, { method, bought: [L.slug] }), st });
  }
}
// «не про вкус» moves nothing and changes nothing offered
for (const L of F.coffees.filter((c) => !c.out && !c.decaf)) for (const issue of Object.keys(R.issues)) {
  const method = methodsOf(L)[0], base = baseRegion({ first: [L.slug] }, F);
  const st = replay(base, [{ order: "o1", slug: L.slug, at: today, roast: L.roasts[0], method, issue, bright: "less", body: "more" }], F);
  if (JSON.stringify(st.region) !== JSON.stringify(base.region) || st.n) fail(`${L.slug}: «${R.issues[issue].label}» moved the visitor`);
}
// a filter roast brewed in a machine counts half
{
  const L = F.coffees.find((c) => !c.out && c.roasts.length === 1 && c.roasts[0] === "Фильтр" && !c.omni);
  if (L) {
    const base = baseRegion({ first: [L.slug] }, F);
    const full = replay(base, [{ order: "o", slug: L.slug, at: today, roast: "Фильтр", method: "pourover", bright: "less", body: "ok" }], F);
    const half = replay(base, [{ order: "o", slug: L.slug, at: today, roast: "Фильтр", method: "espresso", bright: "less", body: "ok" }], F);
    const df = base.region.center.bright - full.region.center.bright, dh = base.region.center.bright - half.region.center.bright;
    if (!(Math.abs(dh - df * R.weights.wrongRoast) < 0.01)) fail(`wrong roast: ${L.slug} moved ${dh.toFixed(2)} brewed in a machine against ${df.toFixed(2)} in a pour-over`);
  }
}
// a visitor's three answers in a row narrow the region and name the taste after the third
{
  const seq = ["kolumbiya-antiokiya", "efiopiya-bekele", "q-finch"].filter((s) => by.has(s));
  const ans = seq.map((slug, i) => ({ order: `o${i}`, slug, at: `2026-08-0${i + 1}`, roast: by.get(slug).roasts[0], method: by.get(slug).roasts[0] === "Фильтр" ? "pourover" : "espresso", bright: "ok", body: "ok" }));
  const st = replay(baseRegion({ first: [seq[0]] }, F), ans, F);
  if (!tasteName(st, F).named) fail("three answers do not name the taste");
  if (tasteName(replay(baseRegion({ first: [seq[0]] }, F), ans.slice(0, 2), F), F).named) fail("two answers already name the taste");
}

writeFileSync(resolve(root, "src/data/feedback.json"), JSON.stringify(F));

// ── the listing ─────────────────────────────────────────────────────────────────────────────────────────────────
const f1 = (x) => (+x).toFixed(2).replace(/\.?0+$/, "").replace(".", ",");
const md = [
  "# The feedback after delivery: every answer's effect",
  "",
  "Generated by `build/feedback.mjs` (do not edit). How it works: `docs/feedback.md`.",
  "",
  `Checked on every build: ${runs} answers (every coffee in stock × every method QQ roasts it for × with and without milk × every combination of the three rows), plus «не про вкус», a filter roast in a machine and three answers in a row. None offers a sold-out coffee, a decaf or a wrong roast; none moves the visitor against the answer; every move goes the right way on QQ's own scales; every card keeps within about one step on a row not asked about (ferment: never by 2 or more); and no card goes back against the answer (a tie allowed).`,
  "",
  `Over those ${runs}: a move ${tally.move}, «снова» ${tally.again}, «у нас нет» ${tally.edge || 0} (the coffee is QQ's edge that way ${tally["edge-most"] || 0}; there are some, but much denser or wilder ${tally["edge-far"] || 0}; only in another roast ${tally["edge-method"] || 0}), a direction dropped ${tally.dropped}, nothing that keeps to the answer at all (the lead alone, at QQ's corner) ${tally.empty || 0}.`,
  "",
  "Below: each coffee in its first method, black, one row answered at a time (the others «в самый раз»), and «в самый раз» on every row. The visitor starts on the coffee itself, as wide as the model's START (spread 1,5), so the move is the answer's alone; a real visitor's region carries every earlier answer.",
  "",
  "| Coffee | Method | Said | Visitor: acidity / body / ferment after | Lead | Offered |",
  "|---|---|---|---|---|---|"
];
for (const r of rows) {
  const c = r.st.region.center;
  md.push(`| ${r.L.name} | ${F.methods[r.method].short} | ${r.said} | ${f1(c.bright)} / ${f1(c.body)} / ${f1(c.unusual)} | ${r.n.lead.replace(/\|/g, "/")} | ${r.n.picks.map((p) => `**${p.label}:** ${p.name}`).join(" · ")} |`);
}
writeFileSync(resolve(root, "docs/feedback-output.md"), md.join("\n") + "\n");
console.log(`src/data/feedback.json: ${F.coffees.length} coffees; ${runs} answers checked (move ${tally.move}, again ${tally.again}, edge ${tally.edge || 0}, dropped ${tally.dropped})`);
