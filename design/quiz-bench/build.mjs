// The quiz's bench (session 4 of choosing coffee): any answers, and three forms of the result side by side on the real
// data and the site's own arithmetic (src/scripts/quiz.js): «Один и два шага» (built), «Три разных» (built for «Не
// знаю»), «Место на карте» (every coffee inside the visitor's region, nothing chosen). Below, the respondents of the
// B2C survey as the outside check coded them (docs/quiz-check/), each with its verdict: pick one to see its result.
// Published as an artifact (claude.ai), not part of the site.
//   npm run quiz && node design/quiz-bench/build.mjs   → design/quiz-bench/out/ (index.html, fonts/)
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = new URL("../../", import.meta.url).pathname;
const here = join(root, "design/quiz-bench"), out = join(here, "out");
const read = (f) => readFileSync(join(root, f), "utf8");
const D = JSON.parse(read("src/data/quiz.json"));
const C = JSON.parse(read("src/data/choose.json"));
const people = existsSync(join(root, "docs/quiz-check/respondents.json")) ? JSON.parse(read("docs/quiz-check/respondents.json")) : [];
mkdirSync(join(out, "fonts"), { recursive: true });
for (const f of ["apercu-400", "apercu-500", "pt-mono-700"]) copyFileSync(join(root, `src/assets/fonts/${f}.woff2`), join(out, `fonts/${f}.woff2`));
const strip = (src) => src.replace(/^import .*$/gm, "").replace(/^export \{[^}]*\};?$/gm, "").replace(/^export /gm, "");
const lib = `${strip(read("src/scripts/taste.js"))}\n${strip(read("src/scripts/quiz.js"))}`;
const map = { cols: C.map.cols, rows: C.map.rows, aspect: C.map.aspect, regions: C.map.regions };
writeFileSync(join(out, "index.html"), read("design/quiz-bench/page.html")
  .replace("/*{{lib}}*/", () => lib)
  .replace("/*{{data}}*/", () => `const D = ${JSON.stringify(D)}; const MAP = ${JSON.stringify(map)}; const PEOPLE = ${JSON.stringify(people)};`));
console.log(`design/quiz-bench/out/index.html: ${people.length} respondents`);
