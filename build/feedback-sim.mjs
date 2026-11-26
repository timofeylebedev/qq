// The feedback loop, run by hand: a simulated customer takes the quiz, buys, answers after delivery, and sees what the
// site offers next. Session 6's outside check (docs/feedback-check/) gives one customer to one agent, who plays a real
// survey respondent and sees only what the site would show them, plus the roaster's own texts as "the cup".
//
//   node build/feedback-sim.mjs start  <state.json> method=pourover milk=no now=special taste=bright
//   node build/feedback-sim.mjs offer  <state.json>                       what the site offers now (the quiz's three, then nextOf)
//   node build/feedback-sim.mjs cup    <slug>                             the roaster's texts and scales of a coffee (what is in the bag)
//   node build/feedback-sim.mjs buy    <state.json> <slug> [<slug>…]      an order of those coffees, delivered
//   node build/feedback-sim.mjs answer <state.json> <slug> bright=less|ok|more body=… [unusual=…] [method=…] [milk=yes] [issue=grind|described] [need=beans|ground|bags]
//   node build/feedback-sim.mjs show   <state.json>                       the whole path as JSON (orders, answers, regions, offers)
//
// Every step is written to the state file, so the path (where the customer was on the map after each order, and what
// they were offered) can be drawn afterwards (docs/feedback-check/).
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { result } from "../src/scripts/quiz.js";
import { replay, baseRegion, nextOf, tasteName, shiftOf, saidOf, weightOf, area, setFor } from "../src/scripts/feedback.js";

const root = resolve(import.meta.dirname, "..");
const read = (f) => JSON.parse(readFileSync(resolve(root, f), "utf8"));
const Q = read("src/data/quiz.json"), F = read("src/data/feedback.json");
const { products } = read("src/data/products.json");
const P = new Map(products.map((p) => [p.slug, p])), C = new Map(F.coffees.map((c) => [c.slug, c]));
const [cmd, file, ...rest] = process.argv.slice(2);
const kv = Object.fromEntries(rest.filter((x) => x.includes("=")).map((x) => x.split("=")));
const load = () => JSON.parse(readFileSync(file, "utf8"));
const save = (s) => writeFileSync(file, JSON.stringify(s, null, 1));
const die = (m) => { console.error(m); process.exit(1); };

const state = (s) => {
  const st = replay(baseRegion({ quiz: s.quiz.region }, F), s.answers, F);
  return st;
};
const method = (s) => [...s.answers].reverse().find((a) => a.method)?.method || s.quiz.answers.method;
const milkOf = (s) => { const a = [...s.answers].reverse().find((x) => x.method); return a ? !!a.milk : s.quiz.answers.milk === "yes"; };
const bought = (s) => s.orders.flatMap((o) => o.items.map((i) => i.slug));

function offerNow(s) {
  if (!s.orders.length) {
    return { from: "quiz", lead: s.quiz.result.summary.join(" "), picks: s.quiz.result.picks.map((p) => ({ slug: p.slug, name: C.get(p.slug).name, label: p.label, text: [...p.why, p.taste, p.but].filter(Boolean).join(" "), set: p.set.text })) };
  }
  const st = state(s);
  const n = nextOf(st, F, { method: method(s), milk: milkOf(s), bought: bought(s) });
  return { from: "feedback", lead: n.lead, taste: tasteName(st, F).text, picks: n.picks.map((p) => ({ ...p, set: setText(p.slug, method(s), needOf(s)) })) };
}
const needOf = (s) => [...s.answers].reverse().find((x) => x.need)?.need || null;
const setText = (slug, m, need) => { const f = setFor(C.get(slug), m, need); return `${f.omni ? "омни-обжарка" : F.quizWords.roast[f.roast]}, ${F.quizWords.grind[f.grind]}`; };
const print = (o) => console.log(JSON.stringify(o, null, 1));

if (cmd === "start") {
  if (existsSync(file) && !kv.force) die(`${file} exists (add force=1 to start again)`);
  const answers = { method: kv.method, milk: kv.milk, now: kv.now, taste: kv.taste };
  const r = result(answers, Q);
  const s = { quiz: { answers, region: r.region, result: r }, orders: [], answers: [], log: [] };
  s.log.push({ step: "quiz", region: r.region, area: area(r.region, F), offer: offerNow(s) });
  save(s); print(offerNow(s));
} else if (cmd === "offer") {
  print(offerNow(load()));
} else if (cmd === "cup") {
  const p = P.get(file); if (!p) die(`no coffee ${file}`);
  print({ name: p.name, short: p.short, about: p.about, descriptors: p.descriptors, scales: { "кислотность (1–5)": p.taste.acidity, "плотность (1–5)": p.taste.density, "сладость (1–5)": p.taste.sweetness, "ферментация (0–3)": p.taste.ferment },
    type: p.type, processing: p.processing, roasts: p.roasts.map((r) => r.use), composition: p.composition.map((c) => `${c.lot} ${c.share}%`), use: p.use.filter((u) => u !== "Вторая кофемолка") });
} else if (cmd === "buy") {
  const s = load(), slugs = rest.filter((x) => !x.includes("="));
  const offered = offerNow(s).picks.map((p) => p.slug);
  for (const x of slugs) if (!C.has(x)) die(`no coffee ${x}`);
  const m = method(s);
  // the roast and grind: the method's, or what the customer asked for after «помол не подошёл»
  const items = slugs.map((slug) => { const f = setFor(C.get(slug), m, needOf(s)); return { slug, roast: f.roast, grind: f.grind, offered: offered.includes(slug) }; });
  s.orders.push({ id: `o${s.orders.length + 1}`, items });
  save(s); print({ order: s.orders.at(-1) });
} else if (cmd === "answer") {
  const s = load(), slug = rest[0], o = [...s.orders].reverse().find((x) => x.items.some((i) => i.slug === slug));
  if (!o) die(`${slug} was not bought`);
  const it = o.items.find((i) => i.slug === slug);
  const a = { order: o.id, slug, at: `2026-0${s.answers.length + 1 > 9 ? 9 : s.answers.length + 1}-15T10:00`.replace(/-0(\d\d)/, "-$1"), roast: it.roast, method: kv.method || method(s), milk: (kv.milk || (s.quiz.answers.milk === "yes" ? "yes" : "no")) === "yes" };
  a.at = new Date(Date.UTC(2026, 0, 1 + s.answers.length * 10)).toISOString().slice(0, 16);
  for (const k of ["bright", "body", "unusual"]) if (kv[k]) a[k] = kv[k];
  if (kv.issue) a.issue = kv.issue;
  if (kv.need) a.need = kv.need;
  if (!a.issue && (!a.bright || !a.body)) die("bright= and body= are required (or issue=)");
  const before = state(s).region;
  s.answers.push(a);
  const st = state(s);
  const w = weightOf(a, F);
  const offer = offerNow(s);
  s.log.push({ step: "answer", order: o.id, answer: a, said: a.issue ? F.rules.issues[a.issue].label : saidOf(a, F), weight: w, region: st.region, area: area(st.region, F), shift: shiftOf({ center: before.center }, { center: st.region.center }, F, a), offer });
  save(s);
  const issue = a.issue ? [F.rules.issues[a.issue].reply, a.need ? F.rules.issues.grind.need[a.need]?.[1] : ""].filter(Boolean).join(" ") : undefined;
  print({ ...(issue ? { reply: issue } : {}), weight: w, moved: shiftOf({ center: before.center }, { center: st.region.center }, F, a) || (a.issue ? "не сдвинулся: не про вкус" : "уточнился"), taste: tasteName(st, F).text, next: offer });
} else if (cmd === "show") {
  print(load());
} else die("commands: start offer cup buy answer show");
