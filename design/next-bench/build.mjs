// The bench of «Что взять дальше»: five forms of the block on a coffee's page, side by side on the real data, for Tim to
// compare (session 2 of choosing coffee). Published as an artifact (claude.ai), not part of the site.
//   node build/taste.mjs && node design/next-bench/build.mjs   → design/next-bench/out/ (index.html, data.js, forms/, fonts/, pack.webp)
// Every form is design/next-bench/forms/<id>.js (+ .css): it registers itself with QQBench.register({ id, name, idea,
// render(root, ctx), bar?(root, ctx) }) and draws the block for ctx.coffee from ctx.coffee.next (the taste model's
// choice: build/taste.mjs nextBlock), in or out of stock.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const root = new URL("../../", import.meta.url).pathname;
const here = join(root, "design/next-bench"), out = join(here, "out");
const read = (f) => readFileSync(join(root, f), "utf8");
const model = JSON.parse(read("src/data/taste.json"));
const { products } = JSON.parse(read("src/data/products.json"));
const P = new Map(products.map((p) => [p.slug, p]));
const fam = Object.fromEntries(model.families.map((f) => [f.id, f]));
const coffees = model.coffees.map((c) => {
  const p = P.get(c.slug);
  const price = (p.weights.find((w) => w.grams === 200) || p.weights[0]).price;
  return { slug: c.slug, name: c.name, line: c.line, type: c.type, short: c.short, countries: c.countries, descriptors: c.descriptors,
    coded: c.coded, use: c.use.filter((u) => u !== "Вторая кофемолка"), roasts: c.roasts, decaf: c.decaf, price,
    top: Object.entries(c.flavour).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([f]) => fam[f].ru),
    next: c.next };
});
const forms = readdirSync(join(here, "forms")).filter((f) => /\.(js|css)$/.test(f)).sort();
mkdirSync(join(out, "forms"), { recursive: true }); mkdirSync(join(out, "fonts"), { recursive: true });
writeFileSync(join(out, "data.js"), `window.QQ_DATA = ${JSON.stringify({ coffees })};\n`);
for (const f of forms) copyFileSync(join(here, "forms", f), join(out, "forms", f));
for (const f of ["apercu-400", "apercu-500", "pt-mono-700"]) copyFileSync(join(root, `src/assets/fonts/${f}.woff2`), join(out, `fonts/${f}.woff2`));
copyFileSync(join(root, "src/assets/pack/pack-512.webp"), join(out, "pack.webp"));
copyFileSync(join(here, "base.css"), join(out, "base.css"));
copyFileSync(join(here, "notes.js"), join(out, "notes.js"));
const ids = forms.filter((f) => f.endsWith(".js")).map((f) => f.slice(0, -3));
const page = readFileSync(join(here, "page.html"), "utf8")
  .replace("{{forms}}", ids.map((id) => `<link rel="stylesheet" href="forms/${id}.css"><script src="forms/${id}.js" defer></script>`).join("\n"));
writeFileSync(join(out, "index.html"), page);
console.log(`next bench: ${coffees.length} coffees, forms: ${ids.join(", ")}`);
