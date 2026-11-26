// The simulated customers' paths (session 6's outside check, docs/feedback-check/): each customer's choices and
// answers as an agent played them (build/feedback-sim.mjs state files), replayed on the current rules, so the path on the
// map and what the site offers at each step are today's, not those of the round the agent played.
//
//   node build/feedback-paths.mjs <state.json>… → docs/feedback-check/paths.json
//
// A step: the order, the coffee bought (and whether the site had offered it), the answer, how it counted, the region
// after it (on the taste map: area()), the taste in words, and the three cards offered next with their labels and words.
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, basename } from "node:path";
import { result } from "../src/scripts/quiz.js";
import { replay, baseRegion, nextOf, tasteName, saidOf, weightOf, area, shiftOf } from "../src/scripts/feedback.js";

const root = resolve(import.meta.dirname, "..");
const read = (f) => JSON.parse(readFileSync(resolve(root, f), "utf8"));
const Q = read("src/data/quiz.json"), F = read("src/data/feedback.json");
const C = new Map(F.coffees.map((c) => [c.slug, c]));
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const out = [];
for (const file of process.argv.slice(2)) {
  const s = JSON.parse(readFileSync(file, "utf8"));
  const q = result(s.quiz.answers, Q);
  const base = baseRegion({ quiz: q.region }, F);
  const steps = [{ step: 0, kind: "quiz", region: q.region, area: area(q.region, F), lead: q.summary[0],
    offer: q.picks.map((p) => ({ slug: p.slug, name: C.get(p.slug).name, label: p.label, text: [p.why.length ? cap(p.why.join(", ")) + "." : "", p.taste, p.but].filter(Boolean).join(" ") })) }];
  const done = [];
  for (const a of s.answers) {
    done.push(a);
    const st = replay(base, done, F);
    const before = replay(base, done.slice(0, -1), F).region;
    const last = [...done].reverse().find((x) => x.method);
    const bought = s.orders.filter((o) => +o.id.slice(1) <= +a.order.slice(1)).flatMap((o) => o.items.map((i) => i.slug));
    const n = nextOf(st, F, { method: last?.method || s.quiz.answers.method, milk: !!last?.milk, bought });
    const o = s.orders.find((x) => x.id === a.order);
    steps.push({ step: steps.length, kind: a.issue ? "issue" : "answer", order: a.order, slug: a.slug, name: C.get(a.slug).name, offered: !!o.items.find((i) => i.slug === a.slug)?.offered,
      said: a.issue ? F.rules.issues[a.issue].label + (a.need ? ` (${F.rules.issues.grind.need[a.need][0]})` : "") : saidOf(a, F), answer: { bright: a.bright, body: a.body, unusual: a.unusual, milk: a.milk, method: a.method },
      weight: weightOf(a, F).w, region: st.region, area: area(st.region, F), shift: shiftOf(before, st.region, F, a) || "", taste: tasteName(st, F).text, lead: n.lead,
      offer: n.picks.map((p) => ({ slug: p.slug, name: p.name, label: p.label, text: p.text })) });
  }
  out.push({ id: basename(file).replace(/\.json$/, ""), quiz: s.quiz.answers, orders: s.orders.map((o) => ({ id: o.id, items: o.items.map((i) => ({ slug: i.slug, name: C.get(i.slug).name, offered: i.offered })) })), steps });
}
const coffees = F.coffees.map((c) => ({ slug: c.slug, name: c.name, map: c.map, decaf: c.decaf, unusual: c.position.unusual }));
writeFileSync(resolve(root, "docs/feedback-check/paths.json"), JSON.stringify({ generated: "build/feedback-paths.mjs — do not edit", axes: F.axes, coffees, customers: out }, null, 1));
console.log(`docs/feedback-check/paths.json: ${out.length} customers, ${out.reduce((s, c) => s + c.steps.length, 0)} steps`);
