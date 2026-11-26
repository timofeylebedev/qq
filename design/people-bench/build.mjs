// The bench of the people block (session 5 of choosing coffee): several forms of reviews + ambassadors + writing a
// review, side by side on the same placeholder data, for Tim to compare. Published as an artifact, not part of the site.
//   node build/taste.mjs && node build/people.mjs && node design/people-bench/build.mjs   → design/people-bench/out/
// Every form is forms/<id>.js (+ .css) and registers with QQBench.register({ id, name, idea, notes, render(root, ctx),
// top(root, ctx), write(root, ctx) }): render draws the block on the coffee's page, top the link under the coffee's
// name, write the way to write a review (opened from the block; drawn on the bench in its own stage).
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { taste } from "../../src/templates/util.mjs";

const root = new URL("../../", import.meta.url).pathname;
const here = join(root, "design/people-bench"), out = join(here, "out");
const read = (f) => JSON.parse(readFileSync(join(root, f), "utf8"));
const model = read("src/data/taste.json"), people = read("src/data/people.json");
const { products } = read("src/data/products.json");
const P = new Map(products.map((p) => [p.slug, p]));
const fam = Object.fromEntries(model.families.map((f) => [f.id, f]));
const coffees = model.coffees.map((c) => {
  const p = P.get(c.slug);
  const price = (p.weights.find((w) => w.grams === 200) || p.weights[0]).price;
  return { slug: c.slug, name: c.name, line: c.line, type: c.type, short: c.short, countries: c.countries, descriptors: c.descriptors,
    coded: c.coded, position: c.position, map: c.map, use: c.use.filter((u) => u !== "Вторая кофемолка"), roasts: c.roasts.map((r) => r.use ?? r), decaf: c.decaf, price,
    top: Object.entries(c.flavour).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([f]) => fam[f].ru) };
});
const pagesOf = Object.fromEntries(people.coffees.map((c) => [c.slug, c]));
// visitors the bench can pretend to be (the quiz or the feedback after delivery will set this on the site)
const visitors = [
  { id: "none", label: "Неизвестен (первый визит)", region: null },
  { id: "milk", label: "Эспрессо с молоком, любит шоколад", method: "espresso", milk: true, region: { center: { bright: 1.8, body: 4, unusual: 0 }, spread: { bright: 1, body: 1, unusual: 1 } } },
  { id: "filter", label: "Воронка, любит яркое", method: "v60", milk: false, region: { center: { bright: 4.2, body: 2.4, unusual: 0.6 }, spread: { bright: 1, body: 1, unusual: 1 } } },
  { id: "turka", label: "Турка, «как в магазине»", method: "turka", milk: false, region: { center: { bright: 1.3, body: 4.5, unusual: 0 }, spread: { bright: 1.2, body: 1.2, unusual: 1 } } }
];
mkdirSync(join(out, "forms"), { recursive: true }); mkdirSync(join(out, "fonts"), { recursive: true });
// each descriptor's dot colour (the site's: data/flavours.json → --c-taste-*), as a colour the forms can use
const css = readFileSync(join(root, "src/styles/base/tokens.gen.css"), "utf8");
const colour = (k) => (css.match(new RegExp(`--c-taste-${k}:\\s*([^;]+);`)) || [])[1] || "#999";
const dots = Object.fromEntries([...new Set(coffees.flatMap((c) => c.descriptors))].map((d) => [d, colour(taste(d))]));
writeFileSync(join(out, "data.js"), `window.QQ_DATA = ${JSON.stringify({ dots, coffees, people: { ...people, coffees: undefined }, pages: pagesOf, visitors, families: model.families.map((f) => ({ id: f.id, ru: f.ru })) })};\n`);
const forms = readdirSync(join(here, "forms")).filter((f) => /\.(js|css)$/.test(f)).sort();
for (const f of forms) copyFileSync(join(here, "forms", f), join(out, "forms", f));
for (const f of ["apercu-400", "apercu-500", "pt-mono-700"]) copyFileSync(join(root, `src/assets/fonts/${f}.woff2`), join(out, `fonts/${f}.woff2`));
copyFileSync(join(root, "src/assets/pack/pack-512.webp"), join(out, "pack.webp"));
for (const f of ["base.css", "kit.js", "notes.js"]) copyFileSync(join(here, f), join(out, f));
const ids = forms.filter((f) => f.endsWith(".js")).map((f) => f.slice(0, -3));
writeFileSync(join(out, "index.html"), readFileSync(join(here, "page.html"), "utf8")
  .replace("{{forms}}", ids.map((id) => `<link rel="stylesheet" href="forms/${id}.css"><script src="forms/${id}.js" defer></script>`).join("\n")));
console.log(`people bench: ${coffees.length} coffees, ${Object.values(pagesOf).reduce((s, c) => s + c.count, 0)} placeholder reviews, forms: ${ids.join(", ")}`);
