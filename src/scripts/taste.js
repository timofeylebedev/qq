// The taste model's arithmetic, the same in the build (build/taste.mjs) and, later, in the browser (the quiz, the
// feedback after delivery): positions, the distance between two coffees, a visitor as a region, and how an answer
// moves that region. No data here: the build writes the positions and the family similarity to src/data/taste.json.
//
// A position has four numbers on QQ's 1–5 scales and a flavour profile:
//   bright   acidity (QQ's «Кислотность») ± at most 0.2 from what the descriptors say about it
//   body     density (QQ's «Плотность»), as coded
//   unusual  ferment (QQ's «Фермент», 0–3) + 0.3 for an experimental process, + 0.2 for wet-hull or a species that
//            is not arabica, − 0.1 for robusta in a blend, ± 0.1 from the families
//   sweet    sweetness (QQ's «Сладость»): in the distance with a small weight, never shown as an axis (it is 3–5 everywhere)
//   flavour  { family: share }, shares add up to 1
//   process  { washed, natural, wethull: share }: how the cherry was taken off the bean (a blend: its lots' shares).
//            Washed cups read cleaner and brighter, naturals fruitier and heavier; QQ's four scales do not say this,
//            so two coffees alike on the scales but processed differently are a little apart.
// QQ's Q score is not an input anywhere: it follows acidity and ferment (r ≈ 0.7), so using it would rank bright and
// fermented coffees as "better".

// How much one point of each axis counts in the distance, and how much a whole difference of flavour (0 → 1) counts.
// Acidity is the axis people differ on most (session 0), so it counts fully; body and ferment a little less; sweetness
// barely varies in QQ's coding (3–5), so its point counts a third. A complete change of flavour counts like 1.4 points
// of acidity: it is the only thing that tells apart the eight coffees coded acidity 3 / body 3.
// A whole difference of processing (washed vs natural) counts like 0.6 of a point of acidity.
export const WEIGHTS = { bright: 1, body: 0.75, unusual: 0.85, sweet: 0.35, flavour: 1.4, process: 0.6 };
export const AXES = ["bright", "body", "unusual"];

// families' similarity: a matrix { a: { b: sim } } from their angles on the wheel, then the pairs the lexicon links
export function familyMatrix(families, { spread, sameTier, pairs = [] }) {
  const S = {};
  for (const a of families) {
    S[a.id] = {};
    for (const b of families) {
      const d = Math.abs(a.angle - b.angle) % 360, arc = Math.min(d, 360 - d);
      let s = Math.max(0, 1 - arc / spread);
      if (a.id !== b.id && a.tier === b.tier) s = Math.max(s, sameTier);
      S[a.id][b.id] = a.id === b.id ? 1 : +s.toFixed(3);
    }
  }
  for (const [a, b, v] of pairs) { S[a][b] = v; S[b][a] = v; }
  return S;
}

// soft cosine of two flavour profiles: 1 when they are the same, high when their families sit near each other on the
// wheel (chocolate ~ caramel), 0 when nothing is near (chocolate vs citrus)
export function flavourSim(p, q, S) {
  const dot = (x, y) => { let s = 0; for (const i in x) for (const j in y) s += x[i] * y[j] * (S[i]?.[j] ?? 0); return s; };
  const pq = dot(p, q), pp = dot(p, p), qq = dot(q, q);
  return pp && qq ? pq / Math.sqrt(pp * qq) : 0;
}

// the distance between two positions; `skip` leaves out one axis (a direction's own axis, when its candidates are
// compared on everything else)
export function distance(a, b, S, { skip = null, w = WEIGHTS } = {}) {
  let s = 0;
  for (const k of ["bright", "body", "unusual", "sweet"]) if (k !== skip) s += (w[k] * (a[k] - b[k])) ** 2;
  s += (w.flavour * (1 - flavourSim(a.flavour, b.flavour, S))) ** 2;
  if (a.process && b.process) s += (w.process * processGap(a.process, b.process)) ** 2;
  return Math.sqrt(s);
}

// 0 when processed the same way, 1 when wholly different (half the L1 distance of the shares)
export function processGap(p, q) {
  let s = 0;
  for (const k of new Set([...Object.keys(p), ...Object.keys(q)])) s += Math.abs((p[k] || 0) - (q[k] || 0));
  return s / 2;
}

// ── a visitor is a region, not a point ───────────────────────────────────────────────────────────────────────────
// { center: { bright, body, unusual }, spread: { bright, body, unusual }, flavour?: { family: share } }
// The quiz sets a wide region (spread 1–1.5 points); every answer after a delivery narrows it and moves it.
export const START = { center: { bright: 2.5, body: 3.5, unusual: 0.5 }, spread: { bright: 1.5, body: 1.5, unusual: 1.5 } };

// how well a coffee fits a region: 0 at its centre, 1 at one spread away on every axis together
export function fit(region, pos, S) {
  let s = 0;
  for (const k of AXES) s += ((pos[k] - region.center[k]) / region.spread[k]) ** 2;
  if (region.flavour) s += (WEIGHTS.flavour * (1 - flavourSim(region.flavour, pos.flavour, S))) ** 2;
  return Math.sqrt(s / AXES.length);
}

// An answer after a delivery, per axis: "less" («слишком ярко»), "ok" («в самый раз»), "more" («хочу ярче»), about a
// coffee at `pos`. The centre moves halfway towards where the answer points (three quarters of a point past the coffee
// for less / more, the coffee itself for ok) and the region narrows; it never gets narrower than half a point.
// Answers "wrong grind" and "not as described" are not taste answers and must not reach this function.
export function update(region, pos, answers) {
  const center = { ...region.center }, spread = { ...region.spread };
  for (const k of AXES) {
    const a = answers[k]; if (!a) continue;
    const target = a === "less" ? pos[k] - 0.75 : a === "more" ? pos[k] + 0.75 : pos[k];
    center[k] = center[k] + 0.5 * (target - center[k]);
    spread[k] = Math.max(0.5, spread[k] * (a === "ok" ? 0.7 : 0.85));
  }
  return { ...region, center, spread };
}
