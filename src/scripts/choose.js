// Choosing among QQ's coffees: the arithmetic shared by the catalogue (scripts/filters.js), the build
// (build/choose.mjs) and, next, the quiz (session 4). No data here: data/choose.json holds the methods, the chips and the
// taste groups; build/choose.mjs writes what each coffee is (src/data/choose.json). Runs in Node and in the browser.
//
//   methodFit(coffee, method)   whether QQ sells this coffee in a roast the method takes, and the roast and grind to set
//   meets(coffee, when)         whether a coffee meets a chip's conditions (data/choose.json `when`)
//   rank(coffees, conditions)   matches first, then the nearest misses with what they miss, then the rest: never empty
//   missOf(c, chip), roastMiss(c)  the words for what a coffee misses; nearOf(c, chip) how far it is from a chip
//   layout(points, opts)        the taste map: places dots so none covers another (deterministic)
//   clearance(layout, opts)     the smallest gap between two of its dots, in dots
//
// A coffee here is { slug, roasts: ["Эспрессо", "Фильтр"], grind: [...], use: [...], line, decaf, coded: { acidity,
// density, ferment, sweetness }, position: { bright, body, unusual }, out } (src/data/choose.json `coffees`).

// ── a brewing method → what QQ sells ──────────────────────────────────────────────────────────────────────────────
// ok: QQ roasts this coffee for the method (a method that takes "any" roast fits every coffee; an omni roast, c.omni,
// fits espresso and filter both). roast: the roast to set (the method's own; for "any" its `prefer` when the coffee is
// sold in it, else the coffee's first; an omni coffee's own roast). grind: the method's grind when QQ grinds this
// coffee so, else whole beans. omni: the roast is QQ's omni roast (the card says so).
export function methodFit(c, m) {
  const own = m.roast === "any" || c.roasts.includes(m.roast);
  const ok = own || !!c.omni;
  const roast = m.roast === "any" ? (c.roasts.includes(m.prefer) ? m.prefer : c.roasts[0]) : own ? m.roast : ok ? c.roasts[0] : null;
  const grind = c.grind.includes(m.grind) ? m.grind : c.grind.includes("В зернах") ? "В зернах" : c.grind[0];
  return { ok, roast, grind, omni: !!c.omni };
}

// ── a chip's conditions ──────────────────────────────────────────────────────────────────────────────────────────
const SCALE = { acidity: "coded", density: "coded", ferment: "coded", sweetness: "coded", bright: "position", body: "position", unusual: "position" };
export function meets(c, when) {
  for (const [k, v] of Object.entries(when)) {
    if (k === "use") { if (!c.use.includes(v)) return false; continue; }
    if (k === "line" || k === "type") { if (c[k] !== v) return false; continue; }
    if (k === "decaf") { if (!!c.decaf !== v) return false; continue; }
    if (SCALE[k]) {
      const x = c[SCALE[k]]?.[k];
      if (x == null) return false;
      if (v.min != null && x < v.min) return false;
      if (v.max != null && x > v.max) return false;
      continue;
    }
    throw new Error(`choose: unknown condition «${k}»`);
  }
  return true;
}

// ── matches, near misses, the rest ───────────────────────────────────────────────────────────────────────────────
// conditions: [{ id, test(c) → bool, miss(c) → the words for what this coffee misses («кислотность 3»), method?: true,
// near?(c) → how far it is from meeting (0 = meets) }]. dist(a, b): the taste model's distance between two coffees
// (src/data/choose.json `dist`). A coffee QQ has run out of (c.out) is never a match nor offered as a near miss.
// · exact: every condition holds, in the order given (the page's sort).
// · near:  the coffees closest to the matches that miss as little as possible (one condition when anything matches),
//          each with the words for what it misses: first those a step or less from a condition (its own `near`), then
//          those QQ doesn't roast for the chosen method, then those further off; inside each, the nearest in taste to a
//          match. When nothing meets every condition: those that meet the most, measured against the coffees that
//          would match but are sold out, if any (so a sold-out decaf still leads to its nearest).
// · rest:  everyone else, in the order given.
// The list is never empty: with no exact match, `near` leads (`empty` says so).
export function rank(coffees, conditions, { dist = () => 0, nearMax = 3, nearMaxEmpty = 6 } = {}) {
  const live = coffees.filter((c) => !c.out);
  if (!conditions.length) return { exact: live, near: [], rest: coffees.filter((c) => c.out), empty: false };
  const scored = live.map((c) => ({ c, missing: conditions.filter((k) => !k.test(c)) }));
  const exact = scored.filter((s) => !s.missing.length).map((s) => s.c);
  const misses = scored.filter((s) => s.missing.length);
  const fewest = Math.min(...misses.map((s) => s.missing.length));
  // what the near misses are measured against: the matches, or with none, every coffee that meets the choice though
  // QQ has run out of it (the only decaf sold out: the nearest to it)
  const targets = exact.length ? exact : coffees.filter((c) => c.out && conditions.every((k) => k.test(c)));
  const toTarget = (c) => targets.length ? Math.min(...targets.map((e) => dist(c, e))) : 0;
  const own = (s) => s.missing.reduce((a, k) => a + (k.near ? k.near(s.c) : 0), 0);
  // the order of near misses: those that only differ a little in taste (a step or less from the condition), then those
  // QQ doesn't roast for the chosen method, then those that differ more; inside each, the nearest first
  const tier = (s) => s.missing.some((k) => k.method) ? 1 : own(s) > 1 ? 2 : 0;
  const can = misses.filter((s) => s.missing.length === fewest && (exact.length || fewest < conditions.length || conditions.some((k) => k.near) || targets.length));
  const near = can.map((s) => ({ ...s, t: tier(s), o: own(s), d: toTarget(s.c) }))
    .sort((a, b) => a.t - b.t || a.o - b.o || a.d - b.d)
    .slice(0, exact.length ? nearMax : nearMaxEmpty);
  const inNear = new Set(near.map((s) => s.c));
  return {
    exact,
    near: near.map((s) => ({ c: s.c, missing: s.missing.map((k) => k.miss(s.c)) })),
    rest: coffees.filter((c) => !exact.includes(c) && !inNear.has(c)),
    empty: !exact.length
  };
}

// The words for what a coffee misses of a chip: each failed condition of `when`, through the chip's `miss` texts
// ({acidity} etc. are the coffee's coded values, with a decimal comma).
export function missOf(c, chip) {
  const out = [];
  for (const [k, v] of Object.entries(chip.when)) {
    if (meets(c, { [k]: v })) continue;
    const t = chip.miss?.[k] ?? `не «${chip.ru.toLowerCase()}»`;
    out.push(t.replace(/\{(\w+)\}/g, (_, f) => String(c.coded?.[f] ?? c[f] ?? "").replace(".", ",")));
  }
  return out.join(", ");
}

// How far a coffee is from meeting a chip: the points outside each range it misses, plus one for each other condition
// it misses (so «необычное» comes nearest through the coffee with ferment 1, not through one that is merely alike)
export function nearOf(c, chip) {
  let s = 0;
  for (const [k, v] of Object.entries(chip.when)) {
    if (meets(c, { [k]: v })) continue;
    const x = SCALE[k] ? c[SCALE[k]]?.[k] : null;
    s += x == null || typeof v !== "object" ? 1 : v.min != null && x < v.min ? v.min - x : x - v.max;
  }
  return s;
}

// The words for a coffee QQ doesn't roast for a method: what it is roasted for
export const roastMiss = (c) => c.omni ? "омни-обжарка" : c.roasts.length === 1 ? `обжариваем только под ${c.roasts[0].toLowerCase()}` : "нет такой обжарки";

// ── the taste map ────────────────────────────────────────────────────────────────────────────────────────────────
// points: [{ id, x, y }] in the map's own units (x: acidity, y: body); the map is x0–x1 by y0–y1 of those units, drawn
// at `aspect` (width / height on screen). A dot's radius is `r` of the map's width. Dots sit on a honeycomb of places
// one dot and a little apart; each coffee takes the free place nearest to where it belongs (the closest pairs of coffee
// and place first), a sideways step counting `keepX` times a step up or down, so that the order across (acidity, the
// axis people differ on) holds between coffees a step apart. Coffees coded alike (eight at 3 / 3) gather round their
// point. Deterministic. Returns [{ id, x, y, u, v }]: u, v in 0–1 of the map's box (v from the top).
export function layout(points, { x0, x1, y0, y1, aspect = 1.6, r = 0.03, keepX = 1.6, gap = 1.1 } = {}) {
  const W = x1 - x0, H = y1 - y0, h = 1 / aspect;            // the box is 1 across and h down, in screen proportion
  const home = points.map((p) => ({ ...p, u: (p.x - x0) / W, v: (1 - (p.y - y0) / H) * h }));
  const d = 2 * r * gap, row = d * Math.sqrt(3) / 2, slots = [];
  for (let j = 0, v = r; v <= h - r + 1e-9; j++, v += row)
    for (let u = r + (j % 2 ? d / 2 : 0); u <= 1 - r + 1e-9; u += d) slots.push({ u, v });
  const pairs = [];
  for (let i = 0; i < home.length; i++) for (let k = 0; k < slots.length; k++)
    pairs.push([Math.hypot(keepX * (slots[k].u - home[i].u), slots[k].v - home[i].v), i, k]);
  pairs.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);
  const at = new Array(home.length), taken = new Set();
  for (const [, i, k] of pairs) { if (at[i] != null || taken.has(k)) continue; at[i] = k; taken.add(k); }
  return home.map((p, i) => ({ id: p.id, x: p.x, y: p.y, u: +slots[at[i]].u.toFixed(4), v: +(slots[at[i]].v / h).toFixed(4),
    moved: +Math.hypot(slots[at[i]].u - p.u, slots[at[i]].v - p.v).toFixed(4) }));
}

// the smallest gap between two dots of a layout, as a share of the dot's diameter (1 = touching, ≥ 1 = no overlap)
export function clearance(L, { aspect = 1.6, r = 0.03 } = {}) {
  let m = Infinity;
  for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++)
    m = Math.min(m, Math.hypot(L[i].u - L[j].u, (L[i].v - L[j].v) / aspect) / (2 * r));
  return m;
}
