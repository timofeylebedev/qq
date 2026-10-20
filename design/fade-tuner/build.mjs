// The fade tuner (round 5): the built home page in a frame, with controls for the four fades of the site.
//   npm run build && node design/fade-tuner/build.mjs
// writes design/fade-tuner/out/index.html (the tuner) and out/files.json (the map of published paths → files of
// dist/ the Artifact publish needs: the home page, its scripts, styles, fonts, pictures and the 3D pack).
// The values it starts from are the site's: design/colors.json fades, the lead-ins in base.css, --hero-fade in
// design/scale.json. What Tim saves lands in the artifact's database (tuning/fades); see design/fade-tuner/README.md.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = new URL("../../", import.meta.url).pathname;
const dist = join(root, "dist"), out = join(root, "design/fade-tuner/out");
const colors = JSON.parse(readFileSync(join(root, "design/colors.json"), "utf8"));
const scale = JSON.parse(readFileSync(join(root, "design/scale.json"), "utf8"));
const base = readFileSync(join(root, "src/styles/base/base.css"), "utf8");

const fades = {};
for (const [k, f] of Object.entries(colors.fades)) if (!k.startsWith("$")) fades[k] = { curve: f.curve, stops: f.stops, reach: f.reach ?? 1 };
const lead = (name) => +base.match(new RegExp(`--lead-${name}:\\s*(\\d+)px`))[1];
const site = { linked: false, fades, lead: { hero: scale.space.roles["hero/fade"]?.px || findRole("hero/fade"), caption: lead("caption"), card: lead("card"), panel: lead("panel") } };
function findRole(name) { for (const g of Object.values(scale)) if (g?.roles?.[name]) return g.roles[name].px; throw new Error("no role " + name); }

const fonts = readdirSync(join(dist, "assets")).filter((f) => f.endsWith(".woff2"));
const font = (stem) => fonts.find((f) => f.startsWith(stem + "-"));
let page = readFileSync(join(root, "design/fade-tuner/page.html"), "utf8")
  .replace("{{site}}", JSON.stringify(site))
  .replace("{{apercu-400}}", font("apercu-400")).replace("{{apercu-500}}", font("apercu-500")).replace("{{pt-mono-700}}", font("pt-mono-700"));
mkdirSync(out, { recursive: true });
writeFileSync(join(out, "index.html"), page);

// the files of the home page (no precompressed copies, no other pages)
const files = {};
const walk = (dir) => { for (const f of readdirSync(dir)) { const p = join(dir, f); if (statSync(p).isDirectory()) walk(p); else if (!/\.(br|gz)$/.test(f)) files["site/" + relative(dist, p)] = relative(root, p); } };
walk(join(dist, "assets")); walk(join(dist, "pack"));
files["site/index.html"] = "dist/index.html"; files["site/vt.js"] = "dist/vt.js";
writeFileSync(join(out, "files.json"), JSON.stringify(files, null, 1));
console.log(`fade tuner: ${Object.keys(files).length} files, fades ${Object.keys(fades).join(", ")}`);
