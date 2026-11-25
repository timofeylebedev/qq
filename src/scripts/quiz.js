// The quiz «Выбрать кофе за минуту» (session 4 of choosing coffee): the arithmetic, the same in the build
// (build/quiz.mjs, which lists every result in docs/quiz-output.md and fails on a bad one) and in the browser
// (scripts/quizpage.js). No data here: build/quiz.mjs writes src/data/quiz.json from data/quiz.json, the catalogue's
// src/data/choose.json (brewing methods → what QQ sells, the map) and the taste model's src/data/taste.json.
//
//   regionOf(answers, D)   the visitor's place on the taste map: a wide region (centre + spread), as in taste.js
//   result(answers, D)     what the page shows: the form (one coffee and two moves away from it, or three different
//                          ones), each coffee with its reasons in plain words, the region, the catalogue's part
//   area(region, D)        the region in the taste map's box (0–1), for scripts/tastemap.js area()
//   answered(answers, D)   how many questions are answered, in order (the page shows the next one)
//
// answers: { method, milk, now, taste } with the ids of data/quiz.json (method: a method of data/choose.json or "none").
import { fit, START, distance, AXES } from "./taste.js";

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const word = (list, x) => list.find(([max]) => x <= max)?.[1] ?? "";

// ── where the visitor is ─────────────────────────────────────────────────────────────────────────────────────────
// `now` starts the region (an anchor of the taste model, widened; or the model's START); `taste` pulls the centre
// towards its own point and narrows the spread on acidity and ferment; `milk` softens and thickens it a little.
export function regionOf(a, D) {
  const R = D.rules;
  const now = R.now[a.now] || R.now.none;
  let center, spread, flavour = null;
  if (now.start || !a.now) { center = { ...START.center }; spread = { ...START.spread }; }
  else {
    // a specialty drinker who brews in a machine, a moka pot or a turka drinks espresso-roast specialty, not filter
    const roast = D.steps[0].options.find((o) => o.id === a.method)?.roast;
    const an = D.anchors[(a.milk === "yes" && now.milkAnchor) || (roast && now.methodAnchor?.[roast]) || now.anchor];
    center = { ...an.center }; spread = { ...now.spread };
  }
  const t = R.taste[a.taste];
  if (t && !t.spread) {
    center.bright = center.bright + t.weight * (t.bright - center.bright);
    center.unusual = center.unusual + t.weight * (t.unusual - center.unusual);
    spread.bright = t.brightSpread; spread.unusual = t.unusualSpread;
    flavour = t.flavour;
  }
  const m = R.milk[a.milk] || R.milk.no;
  center.bright += m.bright; center.body += m.body + (R.method?.[a.method] || 0);
  center.bright = clamp(center.bright, 1, 4.6); center.body = clamp(center.body, 2, 5); center.unusual = clamp(center.unusual, 0, 3.3);
  for (const k of AXES) { center[k] = +center[k].toFixed(3); spread[k] = +spread[k].toFixed(3); }
  return { center, spread, ...(flavour ? { flavour } : {}) };
}

// the region in the map's box: centre and half-sizes as shares of its width and height (v from the top)
export function area(r, D) {
  const { x, y } = D.map.axes;
  const W = x.max - x.min, H = y.max - y.min;
  return { u: +((r.center.bright - x.min) / W).toFixed(4), v: +(1 - (r.center.body - y.min) / H).toFixed(4),
    ru: +(r.spread.bright / W).toFixed(4), rv: +(r.spread.body / H).toFixed(4) };
}

// ── which coffees may be offered, and how well each fits ─────────────────────────────────────────────────────────
// never a coffee QQ has run out of, never a decaf (nobody asked for one), never one QQ does not roast for the method
export const eligible = (c, a) => !c.out && !c.decaf && (!a.method || a.method === "none" || c.methods[a.method]?.ok);
const costOf = (c, region, a, D) => fit(region, { ...c.position, flavour: c.flavour }, D.S) + (c.milk ? 0 : (D.rules.milk[a.milk] || D.rules.milk.no).untagged);

// a move from coffee x to y: one real step on its axis (≥ 0.45, the taste model's), with the coffee page's guards
// («мягче» not much denser or wilder; «классичнее» only onto a coffee without ferment and without an experimental process)
// On the other axes a move stays near the first coffee (acidity and body within about a point, ferment not more than half a
// point wilder), so «плотнее» after a soft chocolate coffee is never a bright fermented one.
const STEP = 0.45;
const near = (x, y, own) => ["bright", "body"].every((k) => k === own || Math.abs(y.position[k] - x.position[k]) <= 1.1) && (own === "unusual" || own === "classic" || y.position.unusual - x.position.unusual <= 0.6);
const AXIS = { softer: "bright", brighter: "bright", denser: "body", lighter: "body", unusual: "unusual", classic: "classic" };
const MOVES = {
  softer: (x, y) => y.position.bright - x.position.bright <= -STEP && y.position.body - x.position.body <= 1 && y.position.unusual - x.position.unusual <= 0.5,
  brighter: (x, y) => y.position.bright - x.position.bright >= STEP,
  denser: (x, y) => y.position.body - x.position.body >= STEP,
  lighter: (x, y) => y.position.body - x.position.body <= -STEP,
  unusual: (x, y) => y.position.unusual - x.position.unusual >= STEP && y.position.unusual >= 0.9,   // fermented enough for its card to say so
  classic: (x, y) => x.position.unusual - y.position.unusual >= STEP && y.coded.ferment === 0 && y.position.unusual < 0.3
};

// ── the result ───────────────────────────────────────────────────────────────────────────────────────────────────
// `form` forces one form ("pick" or "spread") whatever the answers: the bench compares them on the same answers
// `only` narrows the coffees offered (the page's «start here» set: those QQ roasts for espresso and filter both)
export function result(a, D, { form = null, only = null } = {}) {
  const W = D.words, region = regionOf(a, D);
  const pool = D.coffees.filter((c) => eligible(c, a) && (!only || only(c)));
  const cost = new Map(pool.map((c) => [c, costOf(c, region, a, D)]));
  const spread = form ? form === "spread" : !a.taste || D.rules.taste[a.taste]?.spread;
  // three different coffees are a tasting: those QQ also sells in 50 g come a little first, so all three can be small
  if (spread) for (const c of pool) if (!c.small) cost.set(c, cost.get(c) + 0.15);
  const byCost = [...pool].sort((x, y) => cost.get(x) - cost.get(y) || x.i - y.i);
  const dist = (x, y) => D.dist[x.i][y.i];
  let picks;
  if (spread) {
    // three different coffees inside the region. Acidity first (the axis people differ on most): the best soft, middle
    // and bright coffee, each while it costs at most a spread more than the best of all; what is left is filled by the
    // best in another region of the map and a step away in taste from those already taken. Softest to brightest.
    // the slots: soft, middle, bright; for milk, or a method chosen for a fuller cup, a dense coffee instead of the bright
    const SP = D.alternatives.spread;
    const slots = a.milk === "yes" || SP.fullMethods.includes(a.method) ? SP.full : SP.plain;
    const inSlot = { soft: (c) => c.coded.acidity <= 2, mid: (c) => c.coded.acidity > 2 && c.coded.acidity < 3.5 && (slots !== SP.full || c.coded.density < 4), bright: (c) => c.coded.acidity >= 3.5, dense: (c) => c.coded.density >= 4 };
    const top = cost.get(byCost[0]);
    const got = [];
    const apart = (c) => got.every((g) => g.region !== c.region && dist(g, c) >= 0.8);
    for (const sl of slots) { const c = byCost.find((x) => !got.includes(x) && inSlot[sl](x) && cost.get(x) <= top + 1 && apart(x)); if (c) got.push(c); }
    if (!got.includes(byCost[0]) && got.length === 3) got.splice(got.indexOf(got.reduce((w, c) => cost.get(c) > cost.get(w) ? c : w)), 1, byCost[0]);
    for (const strict of [true, false]) for (const c of byCost) {
      if (got.length === 3) break;
      if (got.includes(c)) continue;
      if (strict ? got.every((g) => g.region !== c.region && dist(g, c) >= 0.8) : got.every((g) => dist(g, c) >= 0.5)) got.push(c);
    }
    got.sort((x, y) => x.position.bright - y.position.bright || x.position.body - y.position.body);
    picks = got.map((c) => ({ c, role: "spread", label: W.regions[c.region][0] }));
  } else {
    const first = byCost[0];
    picks = [{ c: first, role: "first", label: W.moves.first }];
    const want = [...(D.alternatives[`${a.taste}-milk`] && a.milk === "yes" ? D.alternatives[`${a.taste}-milk`] : D.alternatives[a.taste] || []), ...D.alternatives.fallback];
    const tried = new Set();
    for (let d of want) {
      if (picks.length === 3) break;
      if (d === "body") d = first.position.body <= 3.4 ? "denser" : "lighter";
      if (tried.has(d)) continue;
      tried.add(d);
      const alt = move(first, d);
      if (alt) picks.push({ c: alt.c, role: d, label: W.moves[d], from: alt.from });
    }
    // «Тоже подходит»: the next best that is not a near twin of one already shown (two robusta blends side by side)
    for (const strict of [true, false]) for (const c of byCost) {
      if (picks.length === 3) break;
      if (!picks.some((p) => p.c === c) && (!strict || picks.every((p) => dist(p.c, c) >= 0.6))) picks.push({ c, role: "also", label: W.moves.also });
    }
  }
  // a move from the first coffee: the coffee page's own move when it fits this visitor almost as well as the best
  // candidate (so the quiz and «Что взять еще» agree), else the best fit in the region among those a real step away
  function move(first, d) {
    // a real step, near on the other axes, and still inside the visitor's region (at most one and a half spreads further than the first)
    // and never a near twin of a move already shown («Ярче» and «Плотнее» on the same spot)
    const ok = (c) => c !== first && !picks.some((p) => p.c === c || dist(p.c, c) < 0.6) && MOVES[d](first, c) && near(first, c, AXIS[d]) && cost.get(c) <= cost.get(first) + 1.5;
    let can = byCost.filter(ok);
    // with milk, only a coffee QQ tags for milk (none in that direction: it gives way to the next). A visitor who asked
    // for bright or unusual coffee keeps those moves open, and gets a milk coffee for the safe ones when there is one.
    if (a.milk === "yes" && !["bright", "wild"].includes(a.taste)) can = can.filter((c) => c.milk);
    else if (a.milk === "yes" && ["classic", "softer", "denser"].includes(d) && can.some((c) => c.milk)) can = can.filter((c) => c.milk);
    if (!can.length) return null;
    const best = can[0];
    const page = [first.next[d], ...(first.dirs[d] || [])].map((s) => can.find((c) => c.slug === s)).find(Boolean);
    if (page && cost.get(page) <= cost.get(best) + 0.25) return { c: page, from: page.slug === first.next[d] ? "page" : "model" };
    return { c: best, from: "region" };
  }
  const out = picks.map((p) => ({ slug: p.c.slug, role: p.role, label: p.label, ...(p.from ? { from: p.from } : {}), ...reasons(p, picks[0].c, a, region, D) }));
  return { mode: spread ? "spread" : "pick", region, area: area(region, D), summary: summary(a, picks[0].c, spread, D, out[0]), picks: out, catalogue: catalogue(a, D, picks[0].c) };
}

// ── the words ────────────────────────────────────────────────────────────────────────────────────────────────────
export const tasteWords = (c, W) => {
  const bits = [word(W.acidity, c.coded.acidity), word(W.body, c.coded.density), word(W.unusual, c.position.unusual)].filter(Boolean);
  const s = bits.join(", ");
  return s[0].toUpperCase() + s.slice(1) + "." + (c.descriptors.length ? ` Во вкусе ${c.descriptors.map((d) => d.toLowerCase()).join(", ")}.` : "") + (c.robusta && W.robusta ? ` ${W.robusta}` : "");
};

// what the method sets on this coffee, in words («Обжарка под эспрессо, в зёрнах»), or null without a method
export function setOf(c, a, W) {
  // no method (a gift, or not decided): beans, in the espresso roast when QQ sells it (machines, moka and turka are most
  // homes), and both can be changed on the coffee's page
  if (!a.method || a.method === "none") {
    const roast = c.roasts.includes("Эспрессо") ? "Эспрессо" : c.roasts[0];
    return { roast, grind: "В зернах", omni: !!c.omni, text: `В зёрнах, ${c.omni ? "омни-обжарка" : W.roast[roast]} — ${W.grindNote.none}` };
  }
  const f = c.methods[a.method];
  const note = f.grind === "В зернах" ? W.grindNote[a.method] : W.grindNote.ground;
  return { roast: f.roast, grind: f.grind, omni: f.omni, text: `${f.omni ? "Омни-обжарка" : cap(W.roast[f.roast])}, ${W.grind[f.grind]}${note ? ` — ${note}` : ""}` };
}
const cap = (s) => s[0].toUpperCase() + s.slice(1);

function reasons(p, first, a, region, D) {
  const W = D.words, c = p.c, why = [];
  // the downside, one at most: where this coffee is furthest from what was asked (not for three different ones, which
  // differ on purpose, nor for a move, whose difference is its point), or milk when QQ does not advise it
  let but = null;
  if (p.role === "first" || p.role === "also") {
    const asked = a.taste && !D.rules.taste[a.taste]?.spread;
    const gaps = [
      ["bright", c.position.bright - region.center.bright, 0.9, ["мягче, чем вы описали", "кислинка ярче, чем вы описали"]],
      ["body", c.position.body - region.center.body, 1.1, a.now && a.now !== "none" ? ["легче, чем вы привыкли", "плотнее, чем вы привыкли"] : ["легче, чем подсказали ответы", "плотнее, чем подсказали ответы"]],
      ["unusual", c.position.unusual - region.center.unusual, 1.2, ["классичнее, чем вы просили", "необычнее, чем вы просили: с ферментацией"]]
    ].filter(([k, g, lim]) => Math.abs(g) >= lim && (asked || k === "body")).sort((x, y) => Math.abs(y[1]) / y[2] - Math.abs(x[1]) / x[2]);
    if (gaps.length) but = `Но ${gaps[0][3][gaps[0][1] > 0 ? 1 : 0]}.`;
  }
  // what ties it to the answers: the taste asked for (only when its own notes say so, and never beside a
  // downside about acidity or ferment), milk, what the visitor drinks now
  if (p.role === "first" || p.role === "also") {
    const fams = D.steps.find((st) => st.id === "taste").options.find((o) => o.id === a.taste)?.families;
    const hit = fams ? c.notes.filter((n) => n.f.some((f) => fams.includes(f))).map((n) => n.d.toLowerCase()) : [];
    const unusual = a.taste === "wild" && c.position.unusual >= 1;
    if ((hit.length || unusual) && !CONTRARY.test(but || "")) why.push(unusual ? W.tasteMatch.wild : W.tasteMatch[a.taste]);   // the notes themselves follow in the taste line
  } else if (p.role !== "spread") why.push(W.moveWhy[p.role].replace(/\.$/, ""));
  if ((a.milk === "yes" || a.milk === "some") && c.milk) why.push(W.milk);
  if (a.now === "shop" && D.anchors["пачка из супермаркета"].coffees.includes(c.slug) && p.role !== "spread") why.push(W.shop);
  if (!but && a.milk === "yes" && !c.milk) but = `Но ${W.milkNot}.`;
  return { why, taste: tasteWords(c, W), but, set: setOf(c, a, W) };
}

// the result in one sentence: what kind of coffee to start with (the first coffee's region of the map), and why (from
// the answers), then that it is a start
const CONTRARY = /кислинк|мягче, чем|классичнее|необычнее/;
function summary(a, first, spread, D, card) {
  const W = D.words;
  if (spread) return [W.spread, W.start];
  // milk is a reason only when the first coffee is one QQ advises for milk
  const because = [(a.milk === "yes" || a.milk === "some") && first.milk ? W.because[`milk-${a.milk}`] : "", a.now && a.now !== "none" ? W.because[`now-${a.now}`] : "", CONTRARY.test(card?.but || "") ? "" : W.because[`taste-${a.taste}`] || ""].filter(Boolean);
  const list = because.length > 1 ? `${because.slice(0, -1).join(", ")} и ${because.at(-1)}` : because[0] || "";
  const adj = first.position.unusual >= 1.5 ? W.unusualStart : W.regions[first.region][1];
  return [`Начните ${/^с[^аеёиоуыэюя]/.test(adj) ? "со" : "с"} ${adj} кофе${list ? `: вы ${list}` : ""}.`, W.start];
}

// the part of the catalogue that fits: the method, milk, and the taste as the catalogue's own switches and checkboxes
// (data/choose.json); a condition that would leave fewer than three coffees, or leave out the quiz's first coffee, is
// dropped, the taste first
export function catalogue(a, D, first = null) {
  const tasteParam = { choc: ["acid", "low"], bright: ["acid", "high"], wild: ["chip", "unusual"] }[a.taste];
  const live = D.coffees.filter((c) => !c.out);
  const tests = [];
  if (a.method && a.method !== "none") tests.push(["method", a.method, (c) => c.methods[a.method].ok]);
  if (a.milk === "yes") tests.push(["chip", "milk", (c) => c.chips.includes("milk")]);
  if (tasteParam) tests.push([...tasteParam, tasteParam[0] === "acid" ? (c) => c.axes.acid === tasteParam[1] : (c) => c.chips.includes("unusual")]);
  let use = tests;
  const n = (list) => live.filter((c) => list.every(([, , t]) => t(c))).length;
  // never a part of the catalogue without the quiz's own first coffee, nor one of fewer than three
  const keeps = (list) => !first || list.every(([, , t]) => t(first));
  while (use.length && (n(use) < 3 || !keeps(use))) use = use.slice(0, -1);
  return { params: use.map(([k, v]) => [k, v]), n: n(use) };
}

// how many questions are answered, in their order (the page shows the first unanswered one)
export function answered(a, D) {
  let i = 0;
  for (const s of D.steps) { if (!a[s.id] || !s.options.some((o) => o.id === a[s.id])) break; i++; }
  return i;
}

export { distance };
