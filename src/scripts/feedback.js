// The feedback after delivery (session 6 of choosing coffee; docs/feedback.md): the arithmetic, the same in the build
// (build/feedback.mjs lists every answer's effect in docs/feedback-output.md and fails on a bad one), the simulation
// (build/feedback-sim.mjs) and the browser (scripts/feedbackpage.js). No data here: build/feedback.mjs writes
// src/data/feedback.json (F) from data/feedback.json, the quiz's coffees (src/data/quiz.json) and the taste model.
//
//   baseRegion({ quiz, first }, F)   where the visitor starts: the quiz's region, else the first order's coffees, else START
//   replay(base, answers, F)         every taste answer in turn through update() of taste.js: the region now, and each step
//   nextOf(state, F, { method, milk, bought })   what to offer next: one move that honours the last answer, a second in
//                                    the same direction, one by the whole region; with the words that say why
//   tasteName(state, F)              «Ваш вкус» in words, only after F.rules.show.named taste answers
//   area(region, F)                  the region in the taste map's box (0–1), as quiz.js area()
//
// An answer: { order, slug, at (ISO), roast (the roast bought: "Эспрессо" | "Фильтр"), method (a method of
// data/choose.json), milk (bool), bright, body, unusual ("less" | "ok" | "more" | undefined), issue ("grind" |
// "described" | undefined) }. An answer with an issue is not about taste and never moves anything.
import { update, fit, START, AXES } from "./taste.js";

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
// the centre's range when F has none (the build writes F.limits: QQ's own range, from its coffees)
const LIMITS = { bright: [0.9, 4.65], body: [2, 5], unusual: [-0.12, 3.52] };
const word = (list, x) => list.find(([max]) => x <= max)?.[1] ?? "";
const fill = (s, o) => s.replace(/\{(\w+)\}/g, (_, k) => o[k] ?? "");
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const and = (list) => (list.length > 1 ? `${list.slice(0, -1).join(", ")} и ${list.at(-1)}` : list[0] || "");
const BY = new WeakMap();
const byOf = (F) => { let m = BY.get(F); if (!m) BY.set(F, (m = new Map(F.coffees.map((c) => [c.slug, c])))); return m; };
const posOf = (c) => ({ ...c.position, flavour: c.flavour });

export const isTaste = (a) => !a.issue && AXES.some((k) => a[k]);

// ── how much an answer counts ────────────────────────────────────────────────────────────────────────────────────
// 0 for «не про вкус»; half when the coffee was brewed with a method its roast is not for (QQ's omni roast suits all)
export function weightOf(a, F) {
  if (!isTaste(a)) return { w: 0, why: a.issue ? "issue" : "empty" };
  const c = byOf(F).get(a.slug), m = F.methods[a.method];
  if (c && m && m.roast !== "any" && a.roast && a.roast !== m.roast && !c.omni) return { w: F.rules.weights.wrongRoast, why: "roast" };
  return { w: 1, why: "" };
}

// ── where the visitor starts ─────────────────────────────────────────────────────────────────────────────────────
// the quiz's region when there is one (it is the visitor's own first answer); else the middle of the first order's
// coffees, as wide as the model's START (choosing is a weak sign of taste); else START
export function baseRegion({ quiz = null, first = [] } = {}, F) {
  if (quiz?.center) return { region: { center: { ...quiz.center }, spread: { ...quiz.spread }, ...(quiz.flavour ? { flavour: quiz.flavour } : {}) }, from: "quiz" };
  const cs = first.map((s) => byOf(F).get(s)).filter(Boolean);
  if (!cs.length) return { region: { center: { ...START.center }, spread: { ...START.spread } }, from: "none" };
  const center = Object.fromEntries(AXES.map((k) => [k, +(cs.reduce((s, c) => s + c.position[k], 0) / cs.length).toFixed(3)]));
  return { region: { center, spread: { ...START.spread } }, from: "orders" };
}

// ── every answer in turn ─────────────────────────────────────────────────────────────────────────────────────────
// update() moves the centre halfway to where the answer points and narrows the spread; a half answer moves it half as
// far and narrows it half as much. The centre stays inside QQ's range (a «хочу плотнее» about the densest coffee
// cannot carry the visitor off the map). Answers are taken in the order they were given; a later answer about the
// same coffee from the same order replaces the earlier one of its kind, taste or «не про вкус»: an edit counts as the
// visitor's newest answer (their latest opinion), not in the place of the first.
export function replay(base, answers, F) {
  const last = new Map();
  for (const a of answers) last.set(`${a.order}/${a.slug}/${a.issue ? "issue" : "taste"}`, a);   // a taste answer and an issue about one bag are two
  const list = [...last.values()].sort((x, y) => String(x.at).localeCompare(String(y.at)));
  let region = base.region;
  const steps = [];
  for (const a of list) {
    const { w, why } = weightOf(a, F), c = byOf(F).get(a.slug);
    const before = region;
    if (w > 0 && c) {
      const full = update(region, c.position, a);
      const center = { ...region.center }, spread = { ...region.spread };
      for (const k of AXES) {
        const [lo, hi] = (F.limits || LIMITS)[k], was = region.center[k];   // never pushed by the limits: only kept from going past them
        center[k] = +clamp(was + w * (full.center[k] - was), Math.min(lo, was), Math.max(hi, was)).toFixed(3);
        spread[k] = +(region.spread[k] * (full.spread[k] / region.spread[k]) ** w).toFixed(3);
      }
      region = { ...region, center, spread };
    }
    steps.push({ a, w, why, before, after: region });
  }
  const n = steps.filter((s) => s.w > 0).length;
  return { region, steps, n, from: base.from };
}

// how the region moved, in words («мягче и плотнее»), only on the rows that asked for a change: a «в самый раз» moves
// the centre onto that coffee too, but to the visitor it is not a move (the simulation's customers read «плотнее» after
// «в самый раз» as not listening), so those rows only make the region surer. "" when nothing asked to move.
export function shiftOf(before, after, F, a = null) {
  const W = F.words.shift;
  return and(AXES.filter((k) => !a || a[k] === "less" || a[k] === "more").map((k) => [k, after.center[k] - before.center[k]]).filter(([, d]) => Math.abs(d) >= 0.12).map(([k, d]) => W[k][d > 0 ? 1 : 0]));
}

// what an answer said, in its own words («слишком ярко, хочу плотнее»; «в самый раз» when every row said so)
export function saidOf(a, F) {
  const bits = AXES.filter((k) => a[k] && a[k] !== "ok").map((k) => F.rules.axes[k][a[k]].toLowerCase());
  return bits.length ? bits.join(", ") : F.rules.axes.bright.ok.toLowerCase();
}

// what the answers so far say on each axis, coffee by coffee: below the softest coffee called «слишком ярко», above the
// brightest called «хочу ярче» (and so on). A move tries to land between them first, so «хочу ярче» on 3 then
// «слишком ярко» on 4,5 leads to a 4, not back to 3 (the simulation, respondent 75).
function boundsOf(st, F) {
  const by = byOf(F), lo = {}, hi = {}, last = new Map();
  for (const s of st.steps) if (s.w > 0) last.set(s.a.slug, s.a);
  for (const [slug, a] of last) {
    const c = by.get(slug); if (!c) continue;
    for (const k of AXES) {
      if (a[k] === "more") lo[k] = Math.max(lo[k] ?? -9, c.position[k]);
      if (a[k] === "less") hi[k] = Math.min(hi[k] ?? 9, c.position[k]);
    }
  }
  return { lo, hi, last };
}
// the coffees whose last answer said «в самый раз» on every row asked: the visitor's own finds, offered again («Снова»)
// when a later bag missed, so one miss never hides a coffee they liked (the simulation, respondents 50 and 70)
const okAll = (a) => isTaste(a) && AXES.every((k) => !a[k] || a[k] === "ok");

// ── what to offer next ───────────────────────────────────────────────────────────────────────────────────────────
// Three cards at most, each a coffee QQ roasts for the visitor's method, in stock, with caffeine, never one already
// answered about (it was tried) and, while there is anything else, never one already bought:
//   1. the move: one real step from the last coffee answered about in every direction the answer asked
//      («слишком ярко» → мягче), near it on the axes answered «в самый раз», the best fit of the moved region. With
//      one direction, the coffee page's own move («Что взять еще») when it fits almost as well, so the two agree.
//      When nothing honours every direction, the least certain one is dropped (F.rules.next.drop) and said.
//      When the coffee is already the softest (densest…) of all, that is said, and the nearest come instead.
//   2. a second coffee in the same direction, not a near twin of the first;
//   3. the best fit of the whole region (every answer so far, not only the last).
// A last answer of «в самый раз» on every row offers that coffee again, the nearest new one, and the region's best.
export function nextOf(st, F, { method = null, milk = false, bought = [] } = {}) {
  const N = F.rules.next, W = F.words, by = byOf(F), region = st.region;
  const tasted = new Set(st.steps.filter((s) => s.w > 0).map((s) => s.a.slug));
  const had = new Set(bought);
  const pool = F.coffees.filter((c) => !c.out && !c.decaf && (!method || c.methods[method]?.ok));
  const cost = (c) => fit(region, posOf(c), F.S) + (milk && !c.milk ? N.milkCost : 0);
  const sorted = (list) => [...list].sort((x, y) => cost(x) - cost(y) || x.i - y.i);
  const dist = (x, y) => F.dist[x.i][y.i];
  const fresh = pool.filter((c) => !tasted.has(c.slug) && !had.has(c.slug));
  const untried = pool.filter((c) => !tasted.has(c.slug));
  const picks = [];
  const add = (c, role, label, text, extra = {}) => c && !picks.some((p) => p.c === c) && picks.push({ c, role, label, text, ...extra });
  const notTwin = (c) => picks.every((p) => dist(p.c, c) >= N.twin);
  const fitText = (c) => tasteWords(c, F) + (region.center.unusual >= 1.4 && c.position.unusual < 0.9 ? ` ${W.butClassic}` : "");
  // the region's card never goes back the way the last answer turned away from: after «слишком ярко» nothing as bright
  let away = () => true;
  // in turn: away from the last answer and inside the region; not against it and inside (the region must never be
  // contradicted by «По вашему вкусу»); not against it only. Never against the last answer: fewer cards rather than that.
  // A blend with robusta only for a visitor who has had one.
  let notAgainst = () => true;
  // After a move the region's card really goes the asked way (a tie only at QQ's edge, where nothing goes further).
  // and never far from a row the visitor called «в самый раз» (fewer cards rather than that)
  let okNear = () => true;
  // Every card keeps the rows the visitor didn't ask to change (the outside check, round 2: «Вот что ближе всего» cards
  // that dropped a ferment-3 to none); fewer cards rather than that, and at the very corner the coffee itself.
  const TIERS = [[(c) => away(c), true], [(c) => away(c), false], [(c) => notAgainst(c), true], [(c) => notAgainst(c), false]];
  let tiers = [0, 1, 2, 3];
  const best = (list, t = 0) => sorted(list).find((c) => !picks.some((p) => p.c === c) && notTwin(c) && TIERS[t][0](c) && okNear(c) && (!TIERS[t][1] || inside(c)) && (!c.robusta || hadRobusta));
  const again = () => { const f = favs.find((c) => c !== L && !picks.some((p) => p.c === c)); if (f && picks.length < 3) add(f, "again", W.labels.again, `${W.okSaid} ${tasteWords(f, F)}`); };
  // at QQ's edge (already the softest and the densest) nothing is away on every axis: then the region's best
  const finishFit = (upto = 3) => {
    for (const t of tiers) for (const list of [fresh, untried]) while (picks.length < upto) { const c = best(list, t); if (!c) break; add(c, "fit", W.labels.fit, fitText(c)); }
  };

  const B = boundsOf(st, F);
  const between = (c) => AXES.every((k) => (B.lo[k] == null || c.position[k] > B.lo[k] + 0.2) && (B.hi[k] == null || c.position[k] < B.hi[k] - 0.2));
  const favs = sorted([...B.last].filter(([, x]) => okAll(x)).map(([slug]) => by.get(slug)).filter((c) => c && pool.includes(c)));
  // the region's card stays inside the region on the visible axes, so it never contradicts «Ваш вкус» above it
  const R = region.center, SP = region.spread;
  // (acidity and body within a point at most even while the region is wide; ferment a softer wish: not much wilder,
  // but a less fermented coffee may come, saying so; a blend with robusta only for a visitor who has had one — the
  // simulation, round 3: Q-Punch offered to an arabica-only fruit lover)
  const hadRobusta = st.steps.some((x) => x.w > 0 && by.get(x.a.slug)?.robusta);
  const inside = (c) => Math.abs(c.position.bright - R.bright) <= clamp(SP.bright, 0.8, 1) && Math.abs(c.position.body - R.body) <= clamp(SP.body, 0.8, 1)
    && c.position.unusual - R.unusual <= 0.8 && R.unusual - c.position.unusual <= 2 && (!c.robusta || hadRobusta);
  const lastStep = [...st.steps].reverse().find((s) => s.w > 0);
  if (!lastStep) {
    finishFit();
    return { mode: "none", lead: W.noTaste, picks: out(picks) };
  }
  const a = lastStep.a, L = by.get(a.slug);
  const said = saidOf(a, F);
  const want = AXES.filter((k) => a[k] === "less" || a[k] === "more");
  const oks = AXES.filter((k) => a[k] === "ok");
  okNear = (c) => AXES.every((k) => {
    if (a[k] === "less" || a[k] === "more") return true;
    const d = c.position[k] - L.position[k];
    if (k !== "unusual") return Math.abs(d) <= 1.1;
    return d <= 0.6 && d >= (a.unusual === "ok" ? -0.9 : -1.3);
  });

  if (!want.length) {
    // «в самый раз»: the same coffee again (in stock, for this method), the nearest new one, the region's best
    if (pool.includes(L)) add(L, "again", W.labels.again, `${cap(said)} — так вы сказали в прошлый раз.`);
    // «Похожий» keeps every scale the visitor approved: acidity and body within half a point, as fermented as the coffee
    // they liked (the simulation, respondent 76: ferment 2 → 1 → 0 in three «в самый раз»); the taste model's distance
    // (which counts flavour) orders them. Wider only when nothing is that close.
    const close = (c, w) => Math.abs(c.position.bright - L.position.bright) <= w && Math.abs(c.position.body - L.position.body) <= w
      && (L.position.unusual < 0.9 ? c.position.unusual < 0.9 : c.position.unusual >= 0.9 && Math.abs(c.position.unusual - L.position.unusual) <= w);
    // no wider fallback: a «Похожий» that differs on a row the visitor approved is not similar (respondent 76, round 2)
    let sim = null;
    for (const list of [fresh, untried]) sim ||= [...list].filter((c) => c !== L && close(c, 0.6) && picks.every((p) => p.c === L || dist(p.c, c) >= N.twin)).sort((x, y) => dist(L, x) - dist(L, y))[0] || null;
    if (sim) add(sim, "similar", W.labels.similar, likeText(sim, L, F)); else again();
    finishFit();
    // nothing kept every row near (a coffee at QQ's edge, brewed a way it isn't roasted for): «в самый раз» went nowhere,
    // so the region's nearest are honest here
    if (!picks.length) for (const list of [fresh, untried]) for (const c of sorted(list)) if (picks.length < 3 && c !== L && !picks.some((p) => p.c === c) && notTwin(c) && (!c.robusta || hadRobusta)) add(c, "method", W.labels.method, fitText(c));
    // with a method QQ doesn't roast this coffee for, it can't be offered again for it: the lead says so, not «снова»
    const leadAgain = !pool.includes(L) ? W.againNot : sim ? W.again : W.againOnly;
    return { mode: "again", lead: `${L.name}: вы сказали «${said}». ${leadAgain}`, picks: out(picks) };
  }

  // the directions asked, and what a candidate must do for each (the coffee page's guards: «мягче» not much denser or
  // wilder, «классичнее» only onto a coffee without ferment, «необычнее» onto one fermented enough for its card to say so)
  const dirOf = (k) => F.rules.axes[k].move[a[k]];
  away = (c) => want.every((k) => (a[k] === "less" ? c.position[k] < L.position[k] - 0.2 : c.position[k] > L.position[k] + 0.2));
  // never against the answer: at most a tie with the coffee on the rows that asked for a change (at QQ's edge, «Вот что
  // ближе всего» shows fewer cards rather than one that goes back the other way: the outside check, 30 of 51 such cards)
  notAgainst = (c) => want.every((k) => (a[k] === "less" ? c.position[k] <= L.position[k] + 0.25 : c.position[k] >= L.position[k] - 0.25));
  const steps = (c, ks) => ks.every((k) => {
    const d = c.position[k] - L.position[k], dir = dirOf(k);
    if (dir === "softer") return d <= -N.step && c.position.body - L.position.body <= 1 && c.position.unusual - L.position.unusual <= 0.5;
    if (dir === "classic") return d <= -N.step && c.coded.ferment === 0 && c.position.unusual < 0.3;
    if (dir === "unusual") return d >= N.step && c.position.unusual >= 0.9;
    return a[k] === "more" ? d >= N.step : d <= -N.step;
  });
  // Every row the move was not asked to change keeps close, whatever the move (the outside check against the texts:
  // «Плотнее» from a bright fermented lot onto Q-Punch; a fermented coffee losing its ferment in 16 of 25 moves):
  //   acidity and body within 1.1 (about one step of QQ's scale), always;
  //   ferment never more than 0.6 wilder, and never more than 1.3 tamer (a ferment-2 lot may go to a ferment-1, not to 0);
  //   a row answered «в самый раз» closer still while anything that close exists (0.8; ferment 0.6 either way).
  const asked = (ws) => new Set(ws);
  const keeps = (c, ws) => AXES.every((k) => {
    if (asked(ws).has(k)) return true;
    const d = c.position[k] - L.position[k];
    // a direction asked but dropped (nothing goes both ways) may not go back the other way: at most a tie
    if (want.includes(k)) return a[k] === "less" ? d <= 0.25 : d >= -0.25;
    return k === "unusual" ? d <= 0.6 && d >= -1.3 : Math.abs(d) <= 1.1;
  });
  const stays = (c, ks) => ks.every((k) => k === "unusual" ? Math.abs(c.position.unusual - L.position.unusual) <= 0.6 : Math.abs(c.position[k] - L.position[k]) <= N.near);
  // the sets tried in turn: every direction with every «в самый раз» kept close and between earlier answers; then the
  // «в самый раз» of acidity and body let go (ferment's kept); then not between; then one direction fewer each time
  const oksU = oks.filter((k) => k === "unusual");
  const plan = (ws) => [[ws, oks, true], [ws, oksU, true], [ws, oks, false], [ws, oksU, false], [ws, [], false]];
  const tries = plan(want);
  let ks = [...want];
  for (const k of N.drop) if (ks.length > 1 && ks.includes(k)) { ks = ks.filter((x) => x !== k); tries.push(...plan(ks)); }
  let got = null, kept = want, lostFerment = false;
  for (const [ws, os, inBetween] of tries) {
    for (const list of [fresh, untried]) {
      const can = sorted(list.filter((c) => c !== L && steps(c, ws) && keeps(c, ws) && stays(c, os) && (!inBetween || between(c))));
      if (can.length) { got = can; kept = ws; lostFerment = oks.includes("unusual") && !os.includes("unusual"); break; }
    }
    if (got) break;
  }
  const moveWord = and(kept.map((k) => W.moves[dirOf(k)]));
  const why = (c) => `${fitText(c)} ${fill(W.compare, { name: L.name, words: kept.map((k) => axisWord(L, k, F)).join(", ") })}`;
  if (got) {
    // a blend with robusta only for a visitor who has had one, while anything else goes that way
    if (!hadRobusta && got.some((c) => !c.robusta)) got = got.filter((c) => !c.robusta);
    let first = got[0];
    // one direction: the coffee page's own move when it is a candidate and fits almost as well
    if (kept.length === 1) {
      const d = dirOf(kept[0]);
      const page = [L.next[d], ...(L.dirs[d] || [])].map((s) => got.find((c) => c.slug === s)).find(Boolean);
      if (page && cost(page) <= cost(first) + N.pagePrefer) first = page;
    }
    add(first, "move", cap(moveWord), why(first), { dirs: kept.map(dirOf) });
    const second = got.find((c) => !picks.some((p) => p.c === c) && notTwin(c));
    if (second) add(second, "move", `${W.labels.also} ${moveWord}`, why(second), { dirs: kept.map(dirOf) });
    tiers = [0, 1];
    again(); finishFit();
    const dropped = (kept.length < want.length ? " " + fill(W.dropped, { all: and(want.map((k) => W.moves[dirOf(k)])), kept: moveWord }) : "")
      + (lostFerment && first.position.unusual < L.position.unusual - 0.6 ? " " + fill(W.lostFerment, { move: moveWord }) : "");
    return { mode: "move", lead: `${L.name}: вы сказали «${said}». ${fill(W.nextIs, { move: moveWord })}${dropped}`, picks: out(picks), dirs: kept.map(dirOf) };
  }
  // nothing honours the answer. Say which it is, truthfully: the coffee is QQ's softest (densest…) of all; or there are
  // softer ones, but each is much denser or wilder (the guards of «мягче»); or only in a roast not for this method.
  const d = dirOf(want[0]), k0 = want[0];
  const way = (c) => c !== L && !c.out && !c.decaf && (a[k0] === "more" ? c.position[k0] - L.position[k0] >= N.step : c.position[k0] - L.position[k0] <= -N.step);
  const others = F.coffees.filter(way), here = others.filter((c) => pool.includes(c));
  const named = sorted(here).slice(0, 2);
  // the coffees the lead calls «совсем другие» are not offered under it as «По вашему вкусу»
  if (named.length) { const was = notAgainst; notAgainst = (c) => !named.includes(c) && was(c); }
  const tell = !others.length ? fill(W.edge, { dir: W.edgeDir[d], name: L.name, most: W.edgeMost[d] })
    : here.length ? fill(W.edgeFar, { dir: W.edgeDir[d], name: L.name, list: and(named.map((c) => c.name)),
      rows: and(AXES.filter((k) => k !== k0 && named.some((c) => k === "unusual" ? Math.abs(c.position.unusual - L.position.unusual) > 0.6 : Math.abs(c.position[k] - L.position[k]) > 1.1)).map((k) => W.rowsBy[k])) || W.rowsBy.body })
    : fill(W.edgeMethod, { dir: W.edgeDir[d], name: L.name, method: W.methodIn[method] || "" });
  again(); finishFit();
  // nothing at all that keeps to the answer: at QQ's corner the lead alone says so (the outside check, round 3: offering
  // the same coffee again after «слишком…» reads as «Снова» after a miss)
  const lead = `${L.name}: вы сказали «${said}». ${picks.length ? tell : tell.replace(/ Вот что ближе всего:$/, "") + " " + W.edgeNone}`;
  return { mode: "edge", edge: !others.length ? "most" : here.length ? "far" : "method", lead, picks: out(picks), dirs: [d] };

  function out(list) { return list.map((p) => ({ slug: p.c.slug, name: p.c.name, role: p.role, label: p.label, text: p.text, ...(p.dirs ? { dirs: p.dirs } : {}) })); }
}
// one axis of a coffee in the cards' own words («яркая кислинка», «лёгкий», «без ферментации»)
function axisWord(c, k, F) {
  const W = F.quizWords;
  if (k === "bright") return word(W.acidity, c.coded.acidity);
  if (k === "body") return word(W.body, c.coded.density);
  return word(W.unusual, c.position.unusual) || F.words.noFerment;
}
// «Похожий»: what it keeps of the coffee liked and what differs, in a sentence («Кислинка и плотность те же, ферментации
// больше.»), then its notes
function likeText(c, L, F) {
  const W = F.words.like, same = [], diff = [];
  for (const k of AXES) {
    const d = c.position[k] - L.position[k];
    if (k === "unusual" && L.position.unusual < 0.9 && c.position.unusual < 0.9) continue;
    if (Math.abs(d) < 0.3) same.push(W.same[k]); else diff.push(W.diff[k][d > 0 ? 1 : 0]);
  }
  const head = [same.length ? `${and(same)} ${same.length > 1 ? W.theSame[1] : W.theSame[0]}` : "", and(diff)].filter(Boolean).join(", ");
  return `${cap(head)}.${c.descriptors.length ? ` Во вкусе ${c.descriptors.map((x) => x.toLowerCase()).join(", ")}.` : ""}${c.robusta ? ` ${F.quizWords.robusta}` : ""}`;
}

// the coffee in words, as the quiz says it («Мягкая кислинка, плотный. Во вкусе какао, орехи.»)
export function tasteWords(c, F) {
  const W = F.quizWords;
  const bits = [word(W.acidity, c.coded.acidity), word(W.body, c.coded.density), word(W.unusual, c.position.unusual)].filter(Boolean);
  return cap(bits.join(", ")) + "." + (c.descriptors.length ? ` Во вкусе ${c.descriptors.map((d) => d.toLowerCase()).join(", ")}.` : "") + (c.robusta ? ` ${W.robusta}` : "");
}

// ── «Ваш вкус» ───────────────────────────────────────────────────────────────────────────────────────────────────
// in words only after enough taste answers; before that, a guess and how many answers it waits for
export function tasteName(st, F) {
  const W = F.words, S = F.rules.show, c = st.region.center;
  if (st.n < S.named) {
    const left = S.named - st.n, from = W.guessFrom[st.from === "quiz" ? "quiz" : "orders"];
    const n = st.n ? fill(W.guessAnd, { n: `${st.n} ${plural(st.n, "ответу", "ответам", "ответам")}` }) : "";
    return { named: false, text: fill(W.guess, { from: from + n, n: `${left} ${plural(left, "ответ", "ответа", "ответов")}` }) };
  }
  const acid = c.bright < 2.5 ? "soft" : c.bright < 3.5 ? "mid" : "bright";
  const body = c.body >= 3.5 ? "dense" : c.body >= 2.5 ? "mid" : "light";
  let mean = AXES.reduce((s, k) => s + st.region.spread[k], 0) / AXES.length;
  // never «уже довольно точно» when no answer said «в самый раз», or when one row was answered both ways
  const taps = st.steps.filter((x) => x.w > 0).map((x) => x.a);
  const torn = AXES.some((k) => taps.some((x) => x[k] === "less") && taps.some((x) => x[k] === "more"));
  if (!taps.some((x) => AXES.some((k) => x[k] === "ok")) || torn) mean = Math.max(mean, 1);
  // fermentation as the visitor said it: a fermented coffee called «в самый раз» on that row says «можно с …», even
  // when the centre sits lower (respondents 4 and 76 liked a ferment-1 and a ferment-2 lot and were told «без ферментации»)
  const liked = st.steps.filter((x) => x.w > 0 && x.a.unusual === "ok").map((x) => byOf(F).get(x.a.slug)?.position.unusual ?? 0);
  const top = liked.length ? Math.max(...liked) : -1;
  const ferment = top >= 1.9 ? W.okFerment[1] : top >= 0.9 && c.unusual < 0.9 ? W.okFerment[0] : word(W.unusualWords, c.unusual);
  const taste = F.quizWords.regions[`${acid}-${body}`][0] + ferment;
  return { named: true, region: `${acid}-${body}`, text: fill(W.named, { taste, sure: word(W.sureWords, mean) }) };
}
export function plural(n, one, few, many) {
  const m10 = n % 10, m100 = n % 100;
  return m10 === 1 && m100 !== 11 ? one : m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20) ? few : many;
}

// the region in the map's box: centre and half-sizes as shares of its width and height (v from the top)
export function area(r, F) {
  const { x, y } = F.axes, W = x.max - x.min, H = y.max - y.min;
  return { u: +((r.center.bright - x.min) / W).toFixed(4), v: +(1 - (r.center.body - y.min) / H).toFixed(4),
    ru: +(r.spread.bright / W).toFixed(4), rv: +(r.spread.body / H).toFixed(4) };
}

// ── when to ask ──────────────────────────────────────────────────────────────────────────────────────────────────
// days since the delivery (whole days, by the calendar), and whether the account asks now
export const daysSince = (iso, today) => Math.floor((Date.parse(today.slice(0, 10)) - Date.parse(iso.slice(0, 10))) / 864e5);
// (filter beans are ready sooner than espresso; an order of both roasts follows the later)
export function askState(order, today, F) {
  if (order.status !== "delivered") return { ask: false, wait: null };
  const d = daysSince(order.delivered, today), A = F.rules.ask;
  const from = Math.max(...order.items.map((it) => A.from[it.roast] ?? A.from["Эспрессо"]));
  return { ask: d >= from, wait: d < from ? from - d : 0, quiet: d > A.quiet, days: d, from };
}

// the roast and grind to offer a coffee in: the method's (data/choose.json), unless the visitor said after «помол не
// подошёл» how they want it: beans; ground (the method's grind, or for filter if the method has none, e.g. a press);
// drip bags (QQ sells none yet: ground for filter, which fills a bag)
export function setFor(c, method, need) {
  const f = method ? c.methods[method] : null;
  const roast = f?.ok ? f.roast : c.roasts.includes("Эспрессо") ? "Эспрессо" : c.roasts[0];
  let grind = f?.grind || "В зернах";
  if (need === "beans") grind = "В зернах";
  else if (need === "bags" || (need === "ground" && grind === "В зернах")) grind = "Фильтр";
  return { roast, grind, omni: !!f?.omni };
}

// which method the form starts on: the one the order's grind implies; for beans, the visitor's last method when it
// suits the roast bought, else the roast's own (filter → a pour-over, espresso → a machine); else none
export function methodFor(item, last, F) {
  const g = F.rules.methodFromGrind[item.grind];
  if (g) return g;
  const want = (m) => F.methods[m]?.roast;
  if (last && (want(last) === "any" || want(last) === item.roast)) return last;
  return F.rules.methodFromRoast?.[item.roast] || last || null;
}
