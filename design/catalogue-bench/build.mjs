// The bench of the catalogue's way in: several forms of choosing among QQ's 25 coffees (chips, a taste map, shelves, a
// sentence), side by side on the real data, at phone and computer widths. Session 3 of choosing coffee. Published as an
// artifact (claude.ai), not part of the site.
//   npm run choose && node design/catalogue-bench/build.mjs   → design/catalogue-bench/out/ (index.html, data.js, choose.js, forms/, fonts/, pack.webp)
// Every form is design/catalogue-bench/forms/<id>.js (+ .css): it registers itself with
// QQBench.register({ id, name, idea, notes, render(root, ctx) }) and draws the whole way in (its controls and the grid
// of cards) from ctx (see page.html: coffees, methods, chips, acidity, tastes, map, dist, choose, card()).
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = new URL("../../", import.meta.url).pathname;
const here = join(root, "design/catalogue-bench"), out = join(here, "out");
const read = (f) => readFileSync(join(root, f), "utf8");
const choose = JSON.parse(read("src/data/choose.json"));
const model = JSON.parse(read("src/data/taste.json"));
const cfg = JSON.parse(read("data/choose.json"));
const { products } = JSON.parse(read("src/data/products.json"));
const P = new Map(products.map((p) => [p.slug, p]));
const T = new Map(model.coffees.map((c) => [c.slug, c]));
const fam = Object.fromEntries(model.families.map((f) => [f.id, f]));
const coffees = choose.coffees.map((c) => {
  const p = P.get(c.slug), t = T.get(c.slug);
  const price = (p.weights.find((w) => w.grams === 200) || p.weights[0]).price;
  // the bench's forms were drawn when the map had two shapes (tall, wide) and `cell`; the site has one shape and `region`
  return { ...c, map: { tall: c.map, wide: c.map }, cell: c.region, short: p.short, descriptors: p.descriptors, countries: p.countries, processes: p.processes, price, created: p.created,
    tags: p.tags, top: Object.entries(t.flavour).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([f]) => fam[f].ru) };
});
const data = { coffees, methods: choose.methods, chips: cfg.chips, acidity: cfg.acidity, tastes: cfg.flavours.groups.map(({ id, ru }) => ({ id, ru })), map: { ...choose.map, shapes: { tall: { aspect: choose.map.aspect, r: choose.map.r }, wide: { aspect: choose.map.aspect, r: choose.map.r } } }, dist: choose.dist };
const forms = readdirSync(join(here, "forms")).filter((f) => /\.(js|css)$/.test(f)).sort();
mkdirSync(join(out, "forms"), { recursive: true }); mkdirSync(join(out, "fonts"), { recursive: true });
writeFileSync(join(out, "data.js"), `window.QQ_DATA = ${JSON.stringify(data)};\n`);
// the site's own arithmetic (src/scripts/choose.js), as a plain script: window.QQChoose
writeFileSync(join(out, "choose.js"), `window.QQChoose = (() => {\n${read("src/scripts/choose.js").replace(/^export /gm, "")}\nreturn { methodFit, meets, rank, missOf, nearOf, roastMiss, layout, clearance };\n})();\n`);
for (const f of forms) copyFileSync(join(here, "forms", f), join(out, "forms", f));
for (const f of ["apercu-400", "apercu-500", "pt-mono-700"]) copyFileSync(join(root, `src/assets/fonts/${f}.woff2`), join(out, `fonts/${f}.woff2`));
copyFileSync(join(root, "src/assets/pack/pack-512.webp"), join(out, "pack.webp"));
for (const f of ["base.css", "notes.js"]) copyFileSync(join(here, f), join(out, f));
const ids = forms.filter((f) => f.endsWith(".js")).map((f) => f.slice(0, -3));
writeFileSync(join(out, "index.html"), read("design/catalogue-bench/page.html")
  .replace("{{forms}}", ids.map((id) => `<link rel="stylesheet" href="forms/${id}.css"><script src="forms/${id}.js" defer></script>`).join("\n")));
console.log(`catalogue bench: ${coffees.length} coffees, forms: ${ids.join(", ") || "none yet"}`);
