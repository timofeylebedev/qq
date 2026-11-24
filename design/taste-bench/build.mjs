// The taste bench: a map of QQ's coffees from the taste model, to pick a coffee and see its neighbours and its six
// steps, each with its reason, next to the blind check. Published as an artifact (claude.ai), not part of the site.
//   node build/taste.mjs && node design/taste-bench/build.mjs   → design/taste-bench/out/ (index.html + fonts/)
// It reads src/data/taste.json (the model), docs/taste-check/ (the blind check) and design/colors.json (the dots),
// and inlines src/scripts/taste.js, so the bench's weights sliders recompute with the same arithmetic as the build.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("../../", import.meta.url).pathname;
const out = join(root, "design/taste-bench/out");
const read = (f) => readFileSync(join(root, f), "utf8");
const model = JSON.parse(read("src/data/taste.json"));
const findings = JSON.parse(read("docs/taste-check/findings.json"));
const judges = ["A", "B"].map((k) => JSON.parse(read(`docs/taste-check/judge-${k}.json`)));
const norm = (s) => (s || "").replace(/\s*\(.*?\)/g, "").trim();
const slugOf = (name) => norm(name) === "none" ? "none" : (model.coffees.find((c) => norm(c.name) === norm(name)) || {}).slug || (() => { throw new Error("bench: no coffee " + name); })();
const check = {
  notes: findings.notes,
  targets: findings.targets.map((t) => {
    const name = model.coffees.find((c) => c.slug === t.slug).name;
    const side = (j) => { const x = j.targets.find((y) => norm(y.target) === norm(name)); return { closest: x.closest.map((c) => slugOf(c.name)), brighter: slugOf(x.brighter.name), softer: slugOf(x.softer.name) }; };
    return { slug: t.slug, verdict: t.verdict, A: side(judges[0]), B: side(judges[1]) };
  })
};
const colors = JSON.parse(read("design/colors.json"));
const dots = Object.fromEntries(colors.descriptors.families.map(([k, v]) => [k, v]));
const tastejs = read("src/scripts/taste.js").replace(/^export /gm, "");
const lean = { ...model }; delete lean.fixes;   // the Notion list is not the bench's
const page = read("design/taste-bench/page.html")
  .replace("{{model}}", () => JSON.stringify(lean))
  .replace("{{check}}", () => JSON.stringify(check))
  .replace("{{dots}}", () => JSON.stringify(dots))
  .replace("{{tastejs}}", () => tastejs);
mkdirSync(join(out, "fonts"), { recursive: true });
writeFileSync(join(out, "index.html"), page);
for (const f of ["apercu-400", "apercu-500", "pt-mono-700"]) copyFileSync(join(root, `src/assets/fonts/${f}.woff2`), join(out, `fonts/${f}.woff2`));
console.log(`taste bench: ${model.coffees.length} coffees, ${check.targets.length} checked, ${Math.round(page.length / 1024)} KB`);
