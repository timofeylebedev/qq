// The intro tuner (round 7): the built home page in a frame, with controls for the hero's entrance.
//   npm run build && node design/intro-tuner/build.mjs
// writes design/intro-tuner/out/index.html (the tuner) and out/files.json (the map of published paths → files of
// dist/ the Artifact publish needs). The values it starts from are the site's: design/intro.json. What Tim saves lands
// in the artifact's database (tuning/intro); see design/intro-tuner/README.md.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = new URL("../../", import.meta.url).pathname;
const dist = join(root, "dist"), out = join(root, "design/intro-tuner/out");
const intro = JSON.parse(readFileSync(join(root, "design/intro.json"), "utf8"));
const site = Object.fromEntries(Object.entries(intro).filter(([k]) => !k.startsWith("$")));

const fonts = readdirSync(join(dist, "assets")).filter((f) => f.endsWith(".woff2"));
const font = (stem) => fonts.find((f) => f.startsWith(stem + "-"));
const page = readFileSync(join(root, "design/intro-tuner/page.html"), "utf8")
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
console.log(`intro tuner: ${Object.keys(files).length} files, groups ${Object.keys(site).join(", ")}`);
