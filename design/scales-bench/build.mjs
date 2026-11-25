// The bench of the card's taste scales (row 14 of the plan: small scales in the catalogue's cards in place of
// «Плотность 3 из 5. Кислотность 3 из 5.»). Five forms of the scale on all 25 coffees, as catalogue cards in the
// site's grid, at phone and computer widths, and a view of the five side by side for six coffees that span the range.
// Published as an artifact (claude.ai), not part of the site.
//   npm run choose && node design/scales-bench/build.mjs   (src/data/choose.json comes with the catalogue's pull request, build/choose.mjs)   → design/scales-bench/out/ (index.html, data.js, forms/, fonts/, pack.webp)
// Every form is design/scales-bench/forms/<id>.js (+ .css): it registers itself with
// QQBench.register({ id, render(c, ctx) }) and returns the scale's markup for one coffee (see page.html: ctx).
// Only the axes that separate QQ's coffees, measured against QQ's own 25: acidity, body and (where a form shows it)
// how unusual. Never sweetness (3–5 everywhere), never «Горечь» (no data), never «Оценка Q».
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = new URL("../../", import.meta.url).pathname;
const here = join(root, "design/scales-bench"), out = join(here, "out");
const read = (f) => readFileSync(join(root, f), "utf8");
const choose = JSON.parse(read("src/data/choose.json"));
const model = JSON.parse(read("src/data/taste.json"));
const { products } = JSON.parse(read("src/data/products.json"));
const P = new Map(products.map((p) => [p.slug, p]));
const coffees = choose.coffees.map((c) => {
  const p = P.get(c.slug);
  const w = p.weights.find((x) => x.grams === 200) || p.weights[0];
  return { slug: c.slug, name: c.name, short: p.short, descriptors: p.descriptors, weight: w.label, price: w.price, out: c.out,
    coded: c.coded, position: c.position, tall: c.map.tall || c.map, i: c.i };
});
// QQ's own range of every axis, from the 25 (so a scale says «for QQ», not «for coffee in general»)
const span = (f) => { const v = coffees.map(f); return [Math.min(...v), Math.max(...v)]; };
const range = {
  acidity: span((c) => c.coded.acidity), density: span((c) => c.coded.density), ferment: span((c) => c.coded.ferment),
  bright: span((c) => c.position.bright), body: span((c) => c.position.body), unusual: span((c) => c.position.unusual)
};
// the taste model's visible axes and their end words (taste.json axes: «мягче — ярче», «легче — плотнее», «классичнее — необычнее»)
const ends = Object.fromEntries(model.axes.map((a) => [a.id, a.ru.split(" — ")]));
const data = { coffees, range, ends, map: choose.map,
  all: ["q-punch", "efiopiya-bekele", "braziliya-santa-mariya", "keniya-kisii", "keniya-nayvasha-pb", "kolumbiya-la-sirena"] };
for (const s of data.all) if (!coffees.some((c) => c.slug === s)) throw new Error(`scales bench: no coffee ${s}`);
const forms = readdirSync(join(here, "forms")).filter((f) => /\.(js|css)$/.test(f)).sort();
mkdirSync(join(out, "forms"), { recursive: true }); mkdirSync(join(out, "fonts"), { recursive: true });
writeFileSync(join(out, "data.js"), `window.QQ_DATA = ${JSON.stringify(data)};\n`);
for (const f of forms) copyFileSync(join(here, "forms", f), join(out, "forms", f));
for (const f of ["apercu-400", "apercu-500", "pt-mono-700"]) copyFileSync(join(root, `src/assets/fonts/${f}.woff2`), join(out, `fonts/${f}.woff2`));
copyFileSync(join(root, "src/assets/pack/still-512.webp"), join(out, "pack.webp"));
for (const f of ["base.css", "notes.js"]) copyFileSync(join(here, f), join(out, f));
const ids = forms.filter((f) => f.endsWith(".js")).map((f) => f.slice(0, -3));
writeFileSync(join(out, "index.html"), read("design/scales-bench/page.html")
  .replace("{{forms}}", ids.map((id) => `<link rel="stylesheet" href="forms/${id}.css"><script src="forms/${id}.js" defer></script>`).join("\n")));
console.log(`scales bench: ${coffees.length} coffees, forms: ${ids.join(", ") || "none yet"}; ranges ${JSON.stringify(range)}`);
