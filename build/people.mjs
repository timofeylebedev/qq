// People on a coffee's page (session 5 of choosing coffee): customers' reviews and named picks, in the taste model's
// terms. No stars anywhere: a review is a cup (how it was brewed, with milk or not, what the reviewer usually drinks)
// and a direction against what they expected, per axis («ярковато / в самый раз / хотелось ярче»), plus the notes they
// heard. A coffee's summary counts those answers; it never averages them into a score.
//
//   node build/people.mjs   → src/data/people.json (runs before dev and build, after build/taste.mjs)
//
// Today every person is a PLACEHOLDER (data/people.json): the reviews' answers are worked out from the taste model
// (where the reviewer's usual coffee sits against this one, and how they brew), so the counts behave as real ones
// would and the page can be judged. The one real named pick is «Выбор Ксюши» (data/products.csv: Теги + Комментарий
// к тегу). When the shop has a backend, the reviews come from it and only the reading part below stays
// (docs/people-backend.md). Taste answers about a wrong grind or «не как в описании» are kept apart: they are not
// taste and never reach the counts.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { slug } from "./data.mjs";

const root = resolve(import.meta.dirname, "..");
const read = (f) => JSON.parse(readFileSync(resolve(root, f), "utf8"));
const OUT = resolve(root, "src/data/people.json");

// the review's answers, one per axis; the words are the page's («слишком ярко / в самый раз / хочу ярче» of session 6).
// The form asks the taste model's three (кислотность, плотность, характер: Tim, 26 Nov); sweetness stays in the
// placeholders' answers, never asked.
export const ANSWERS = {
  sweet: { less: "приторно", ok: "в самый раз", more: "хотелось слаще", title: "Сладость" },
  bright: { less: "ярковато", ok: "в самый раз", more: "хотелось ярче", title: "Кислотность" },
  body: { less: "тяжеловато", ok: "в самый раз", more: "хотелось плотнее", title: "Плотность" },
  unusual: { less: "слишком необычно", ok: "в самый раз", more: "хотелось необычнее", title: "Характер" }
};
export const AXES = ["sweet", "bright", "body", "unusual"];

// a small seeded hash, so the placeholders come out the same on every build
function hash(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; }
const pick = (list, key) => list[Math.floor(hash(key) * list.length)];

const FEMALE = /а$|я$/;           // Russian first names; «Никита» is the one exception in the pool
const fem = (r) => FEMALE.test(r.name.split(" ")[0]) && !/^Никита/.test(r.name);
const gender = (s, r) => s.replace(/\(а\)/g, fem(r) ? "а" : "");

// what a reviewer usually likes, in a few words, from where their usual coffee sits
export function tasteWords(pos) {
  const w = [];
  if (pos.bright >= 3.6) w.push("яркое"); else if (pos.bright <= 2.2) w.push("мягкое");
  if (pos.body >= 4.2) w.push("плотное"); else if (pos.body <= 2.4) w.push("лёгкое");
  if (pos.unusual >= 2) w.push("необычное");
  return w.length ? w.join(", ") : "сбалансированное";
}

export function build() {
  const model = read("src/data/taste.json");
  const { products } = read("src/data/products.json");
  const src = read("data/people.json");
  const C = new Map(model.coffees.map((c) => [c.slug, c]));
  const P = new Map(products.map((p) => [p.slug, p]));
  const posOf = (u) => (C.get(u)?.position ?? src.styles[u]?.pos);
  const usualOf = (u) => C.has(u) ? { slug: u, label: C.get(u).name } : { style: u, label: src.styles[u].label };
  const reviewers = new Map(src.reviewers.map((r) => {
    if (!posOf(r.usual)) throw new Error(`people.json: ${r.id} usually drinks «${r.usual}», which is neither a coffee nor a style`);
    if (!src.methods[r.method]) throw new Error(`people.json: ${r.id} brews by «${r.method}», not in methods`);
    return [r.id, { ...r, pos: posOf(r.usual) }];
  }));
  const T = src.texts;

  // can this reviewer brew this coffee as sold? (a filter brewer doesn't buy an espresso-only roast)
  const fits = (r, p) => {
    const need = src.methods[r.method].roast;
    return need === "any" || p.roasts.some((x) => x.use === need || x.use === "Омни");
  };

  function review(r, c, p) {
    const key = r.id + c.slug, m = src.methods[r.method];
    const noise = (k) => (hash(key + k) - 0.5) * 0.7;
    // what the cup tasted like to them: milk softens acidity and adds body, espresso without milk sharpens it
    // (the reviewer drinks their usual coffee the same way, so the brew moves only how much difference they forgive)
    const db = c.position.bright - r.pos.bright + (r.milk ? -0.3 : 0) + (m.group === "espresso" && !r.milk ? 0.3 : 0) + noise("b");
    const dd = c.position.body - r.pos.body + (r.milk ? 0.2 : 0) + noise("d");
    const ds = (c.position.sweet ?? 3.5) - (r.pos.sweet ?? 3.5) + (r.milk ? 0.3 : 0) + noise("s");
    const du = c.position.unusual - r.pos.unusual + noise("u");
    const answers = {
      sweet: ds > 1.1 ? "less" : ds < -1 ? "more" : "ok",
      unusual: du > 1.2 ? "less" : du < -1.4 ? "more" : "ok",
      bright: db > 0.8 ? "less" : db < -1.2 ? "more" : "ok",
      body: dd > 1 ? "less" : dd < -1 ? "more" : "ok"
    };
    // the notes they heard: fruit and flowers get lost in milk
    const fruity = /ягод|цитрус|апельсин|грейпфрут|цвет|чай|бергамот|малин|смородин|ежевик|земляни|яблок|маракуй|мандарин|тропик|дын|груш|виноград|косточков|цедр|шиповник|барбарис|курага/i;
    const heard = p.descriptors.filter((d, i) => hash(key + "h" + i) < (r.milk && fruity.test(d) ? 0.35 : 0.8));
    const missed = p.descriptors.filter((d) => !heard.includes(d));
    const good = answers.bright === "ok" && answers.body !== "less" || answers.body === "ok" && answers.bright !== "less";
    const silent = hash(key + "t") < 0.22;               // about one in five answers only with taps
    const bits = [];
    if (!silent) {
      bits.push(pick(T.method[r.method], key + "m"));
      if (r.milk) bits.push(pick(T.milk, key + "k"));
      if (heard.length) bits.push(pick(T.heard, key + "hh").replace("{d}", heard[0].toLowerCase()));
      if (missed.length && hash(key + "mm") < 0.4) bits.push(pick(T.missed, key + "ms").replace("{d}", missed[0].toLowerCase()));
      bits.push(pick(T.bright[answers.bright], key + "bb"));
      if (answers.body !== "ok" || hash(key + "bo") < 0.3) bits.push(pick(T.body[answers.body], key + "dd"));
      bits.push(pick(T.end[good ? "good" : "mixed"], key + "e"));
    }
    const day = 1 + Math.floor(hash(key + "day") * 240);
    const date = new Date(Date.UTC(2026, 2, 1) + day * 864e5).toISOString().slice(0, 10);
    return {
      id: `${c.slug}-${r.id}`, who: r.id, date, verified: hash(key + "v") < 0.85, cups: 2 + Math.floor(hash(key + "c") * 9),
      method: r.method, milk: r.milk, answers, heard, reply: src.replies?.[`${c.slug}-${r.id}`] || null,
      text: bits.map((b) => gender(b.charAt(0).toUpperCase() + b.slice(1), r)).join(" ")
    };
  }

  const people = [...reviewers.values()].map((r) => ({
    id: r.id, name: r.name, city: r.city, method: r.method, milk: r.milk, usual: usualOf(r.usual), pos: r.pos, likes: tasteWords(r.pos)
  }));

  // the named picks: the ambassadors' (placeholders) and the team's (real: «Выбор Ксюши» in the table)
  const ambassadors = src.ambassadors.map((a) => {
    for (const x of a.picks) {
      if (!C.has(x.slug)) throw new Error(`people.json: ${a.id} picks «${x.slug}», not a coffee on the site`);
    }
    // a real ambassador says how they relate to QQ (free coffee, a partner café, paid: «Реклама»); invented ones show a stand-in line
    if (!src.placeholder && !a.tie) throw new Error(`people.json: ambassador ${a.id} has no «tie» (how they relate to QQ)`);
    // what they don't take (a taste is readable by its no as well as its yes; music research, session 5)
    if (a.not && !C.has(a.not.slug)) throw new Error(`people.json: ${a.id} declines «${a.not.slug}», not a coffee on the site`);
    return { id: a.id, kind: "ambassador", placeholder: true, name: a.name, status: a.status, where: a.where, how: a.how,
      method: a.method, milk: a.milk, about: a.about, tie: a.tie || null, pos: a.pos, likes: tasteWords(a.pos), picks: a.picks.map((x) => x.slug), not: a.not || null };
  });
  const team = [];   // QQ's own named picks: what the table says and nothing more (no status, no position, no recipe)
  const picksOf = new Map();
  for (const a of src.ambassadors) for (const x of a.picks) {
    if (!picksOf.has(x.slug)) picksOf.set(x.slug, []);
    picksOf.get(x.slug).push({ who: a.id, why: x.why, recipe: x.recipe });
  }
  for (const p of products) {
    const t = p.tags.find((x) => /^Выбор /.test(x));
    if (!t) continue;
    // «Выбор Ксюши» → «Ксюша» (a feminine name's genitive -и/-ы back to -а)
    const name = t.replace(/^Выбор /, "").replace(/[иы]$/, "а");
    const id = "team-" + slug(name);
    if (!team.some((x) => x.id === id)) team.push({ id, kind: "team", placeholder: false, name: name, tag: t, status: null, where: null,
      how: null, about: null, tie: null, pos: null, likes: null, picks: [], not: null });
    team.find((x) => x.id === id).picks.push(p.slug);
    if (!picksOf.has(p.slug)) picksOf.set(p.slug, []);
    picksOf.get(p.slug).unshift({ who: id, why: p.tagNote, recipe: null, real: true });
  }

  const coffees = model.coffees.map((c) => {
    const p = P.get(c.slug);
    const want = src.counts[c.slug] || 0;
    // people buy near their taste, with some who try something new: the nearest by the visible axes, shuffled a little
    const near = (r) => Math.hypot(r.pos.bright - c.position.bright, (r.pos.body - c.position.body) * 0.75, (r.pos.unusual - c.position.unusual) * 0.85) + hash(c.slug + r.id) * 1.6;
    // (and never someone whose usual coffee is this one: «against what you usually drink» would mean nothing)
    const pool = [...reviewers.values()].filter((r) => fits(r, p) && r.usual !== c.slug).sort((a, b) => near(a) - near(b));
    const reviews = pool.slice(0, want).map((r) => review(r, c, p));
    // the answers that are not about taste: kept beside the reviews, never in the counts
    const issues = src.issues.filter((x) => x.slug === c.slug).map((x) => {
      const r = reviewers.get(x.reviewer);
      return { id: `${c.slug}-${x.reviewer}-issue`, who: r.id, issue: x.issue, text: gender(x.text, r), reply: x.reply, method: r.method, milk: r.milk,
        date: new Date(Date.UTC(2026, 9, 1) + Math.floor(hash(x.text) * 50) * 864e5).toISOString().slice(0, 10), verified: true };
    });
    reviews.sort((a, b) => b.date.localeCompare(a.date));
    const tally = (list, axis) => Object.fromEntries(["less", "ok", "more"].map((k) => [k, list.filter((x) => x.answers[axis] === k).length]));
    const groups = ["espresso", "pot", "filter"].map((g) => {
      const list = reviews.filter((x) => src.methods[x.method].group === g);
      return { id: g, label: src.groups[g], n: list.length, bright: tally(list, "bright"), body: tally(list, "body") };
    }).filter((g) => g.n);
    const milk = reviews.filter((x) => x.milk);
    if (milk.length) groups.push({ id: "milk", label: src.groups.milk, n: milk.length, bright: tally(milk, "bright"), body: tally(milk, "body") });
    return {
      slug: c.slug, placeholder: true,
      count: reviews.length, verified: reviews.filter((x) => x.verified).length,
      ...Object.fromEntries(AXES.map((a) => [a, tally(reviews, a)])), groups,
      heard: p.descriptors.map((d) => ({ d, n: reviews.filter((x) => x.heard.includes(d)).length })),
      reviews, issues,
      picks: picksOf.get(c.slug) || [],
      pos: c.position
    };
  });

  return {
    generated: "from data/people.json (placeholders) and the taste model by build/people.mjs — do not edit",
    placeholder: true, answers: ANSWERS, methods: src.methods, groups: src.groups, styles: Object.fromEntries(Object.entries(src.styles).map(([k, v]) => [k, v.label])),
    people, named: [...team, ...ambassadors], coffees
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const data = build();
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(data, null, 1) + "\n");
  const n = data.coffees.reduce((s, c) => s + c.count, 0);
  console.log(`src/data/people.json: ${n} placeholder reviews on ${data.coffees.filter((c) => c.count).length} coffees, ${data.named.length} named (${data.named.filter((x) => !x.placeholder).length} real)`);
}
