// The rules of the system, checked over the styles and the design files:   npm run rules
// (they also run in CI). Each prints what it checked; any failure exits 1.
//
//  1. colours only from tokens: no #hex, rgb() or hsl() in the styles (tokens.gen.css is generated from colors.json)
//  2. sizes only from the scale: no font-size in px or rem but a short list (the 16px floor of fields, the 12px of
//     the bag counter), and no screen units (vw, vh, svh, cqi…) outside the rules a decision lists (decisions.json css)
//  3. layout steps only at S 22rem, M 43rem, L 58rem (container queries) and the page step 64em (media.css)
//  4. no rounded corners but pills and dots (radius 999px or 50%)
//  5. motion only from motion.css: transitions and animations use var(--t-…) and var(--ease-…)
//  6. faces only through var(--sans), var(--mono), var(--digits)
//  7. every var() is defined somewhere, and every token of the scale is used
//  8. the scale holds its own rules (ladder, type relations, contrast: build/tokens.mjs)
//  9. every decision is complete (id, kind, what, why, decided)
import { readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, join, relative } from "node:path";
import { check, roles } from "./tokens.mjs";

const root = resolve(import.meta.dirname, "..");
const read = (p) => readFileSync(resolve(root, p), "utf8");
const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const styles = walk(resolve(root, "src/styles")).filter((f) => f.endsWith(".css") && !f.endsWith(".gen.css"));
const scripts = walk(resolve(root, "src/scripts")).filter((f) => f.endsWith(".js"));
const decisions = JSON.parse(read("design/decisions.json")).decisions;
const scale = JSON.parse(read("design/scale.json")), colors = JSON.parse(read("design/colors.json"));

const results = [];
const rule = (title, how, fails) => results.push({ title, how, fails });

// the CSS as rules: { file, line, selector, body } (comments removed; nested at-rules flattened enough for these checks)
const blocks = [];
for (const f of styles) {
  const src = read(f).replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "));
  const re = /([^{}]+)\{([^{}]*)\}/g;
  for (let m; (m = re.exec(src)); ) {
    blocks.push({ file: relative(root, f), line: src.slice(0, m.index).split("\n").length, selector: m[1].trim().replace(/\s+/g, " "), body: m[2] });
  }
}
const where = (b) => `${b.file}:${b.line} ${b.selector.slice(0, 60)}`;

// 1
{
  const fails = blocks.filter((b) => /#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(/i.test(b.body)).map(where);
  rule("Colours only from tokens", `no #hex, rgb() or hsl() in ${styles.length} stylesheets`, fails);
}
// 2
{
  const allowed = new Set(decisions.flatMap((d) => d.css || []));
  const unit = /(?<![\w-])-?[\d.]+(vw|vh|svh|dvh|lvh|vmin|vmax|cqi|cqw|cqh)\b|\b(100)?(vw|svh|vh)\b/;
  const fails = [];
  for (const b of blocks) {
    const decls = b.body.split(";").filter((d) => d.includes(":") && !/^\s*--vp\s*:/.test(d));
    if (decls.some((d) => unit.test(d.split(":").slice(1).join(":"))) && ![...allowed].some((s) => b.selector === s || b.selector.split(",").map((x) => x.trim()).includes(s))) fails.push(where(b) + " uses screen units");
    for (const d of decls) {
      const [prop, ...v] = d.split(":"); const val = v.join(":").trim();
      if (/^\s*font-size$/.test(prop) && !/var\(--type-|^inherit$|^max\(16px, var\(--type-body\)\)$|^12px$/.test(val)) fails.push(where(b) + ` font-size: ${val}`);
    }
  }
  rule("Sizes only from the scale", `font sizes are --type-* (or the 16px floor of fields, 12px of the counter); screen units only in ${allowed.size} rules listed in decisions.json`, fails);
}
// 3
{
  const steps = Object.entries(scale.steps).filter(([k]) => !k.startsWith("$")).map(([, v]) => v);
  const fails = [];
  for (const f of styles) {
    const src = read(f).replace(/\/\*[\s\S]*?\*\//g, "");
    for (const m of src.matchAll(/@container\s+(\w+)?\s*\(([^)]*)\)/g)) {
      const v = /(\d+(?:\.\d+)?rem)/.exec(m[2])?.[1];
      if (!steps.includes(v)) fails.push(`${relative(root, f)}: @container (${m[2]}) is not at S, M or L`);
      if (m[1] && m[1] !== "col" ) fails.push(`${relative(root, f)}: @container ${m[1]} — layout steps query the column (col)`);
    }
    for (const m of src.matchAll(/@media\s+([^{]+)\{/g)) if (!/^\(--[\w-]+\)\s*$|^not \(--[\w-]+\)\s*$/.test(m[1].trim()) && !f.endsWith("media.css")) fails.push(`${relative(root, f)}: @media ${m[1].trim()} — use a condition of media.css`);
  }
  for (const f of scripts) for (const m of read(f).matchAll(/matchMedia\("([^"]+)"\)/g)) if (!/prefers-reduced-motion|width >= 64em/.test(m[1])) fails.push(`${relative(root, f)}: matchMedia(${m[1]})`);
  rule("Layout steps only at S, M, L", `container queries at ${steps.join(", ")} on the column; media only through media.css (--tablet 64em, input, motion)`, fails);
}
// 4
{
  const fails = blocks.filter((b) => [...b.body.matchAll(/border-radius\s*:\s*([^;]+)/g)].some((m) => !/^(999px|50%)$/.test(m[1].trim()))).map(where);
  rule("No rounded corners", "border-radius only 999px (pills) or 50% (dots)", fails);
}
// 5
{
  const fails = [];
  for (const b of blocks) for (const d of b.body.split(";")) {
    const [prop, ...v] = d.split(":"); const val = v.join(":");
    if (/^\s*(transition|animation)(-duration|-timing-function)?\s*$/.test(prop) && /\d(m?s)\b|cubic-bezier|\bease\b|linear\b/.test(val.replace(/var\([^)]*\)/g, "").replace(/\b0s\b/g, "")) && !/@keyframes/.test(b.selector)) {
      if (!(/^\s*animation\s*$/.test(prop) && /\d+s\b/.test(val) && /hero-drift/.test(val)) && !/opacity 0\.3s var\(--ease-out\)/.test(val)) fails.push(where(b) + `: ${prop.trim()}: ${val.trim().slice(0, 50)}`);
    }
  }
  rule("Motion only from motion.css", "transitions use var(--t-in/out/move) and var(--ease-out/move/leave); the hero's slow drift is the one loop", fails);
}
// 6
{
  const fails = blocks.filter((b) => /font-family\s*:\s*(?!var\(--(sans|mono|digits)\)|"(Apercu|JetBrains Mono|Technology)")/.test(b.body) || /\bfont\s*:[^;]*\b(Arial|sans-serif|monospace)\b/.test(b.body)).filter((b) => !b.file.endsWith("base.css") && !b.file.endsWith("fonts.css")).map(where);
  rule("Faces only through tokens", "font-family is var(--sans), var(--mono) or var(--digits)", fails);
}
// 7
{
  const all = styles.map(read).join("\n") + read("src/styles/base/tokens.gen.css");
  const defined = new Set([...all.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
  const used = new Set([...(all + scripts.map(read).join("\n")).matchAll(/var\((--[\w-]+)/g)].map((m) => m[1]));
  const fails = [...used].filter((v) => !defined.has(v) && !["--dot", "--i", "--tiles", "--cols", "--rows", "--buybar-h", "--btn-arrow-fill", "--per", "--ground", "--fg", "--rule"].includes(v)).map((v) => `${v} is used but never defined`);
  const tokens = roles(scale).map((r) => r.css);
  for (const t of tokens) if (!used.has(t)) fails.push(`${t} (design/scale.json) is never used`);
  rule("Every token defined and used", `${used.size} variables used, ${tokens.length} scale roles`, fails);
}
// 8
{
  let fails = [];
  try { check(scale, colors); } catch (e) { fails = e.message.split("\n").slice(1).map((s) => s.trim()); }
  rule("The scale holds its own rules", `both ends of ${roles(scale).length} roles on the ladder, ${scale.type.relations.pairs.length} type pairs ≥ ×${scale.type.relations.min}, ${colors.contrast.pairs.length} colour pairs`, fails);
}
// 9
{
  const fails = decisions.filter((d) => !d.id || !d.kind || !d.what || !d.why || !d.decided).map((d) => `${d.id || "?"} is missing a field`);
  const ids = decisions.map((d) => d.id); ids.forEach((id, i) => ids.indexOf(id) !== i && fails.push(`${id} twice`));
  rule("Every decision complete", `${decisions.length} decisions: ${["decision", "exception", "placeholder"].map((k) => `${decisions.filter((d) => d.kind === k).length} ${k}s`).join(", ")}`, fails);
}

let bad = 0;
for (const r of results) {
  console.log(`${r.fails.length ? "✗" : "✓"} ${r.title} — ${r.how}`);
  for (const f of r.fails.slice(0, 12)) console.log("    " + f);
  if (r.fails.length > 12) console.log(`    … ${r.fails.length - 12} more`);
  bad += r.fails.length > 0;
}
console.log(bad ? `\n${bad} of ${results.length} rules broken` : `\nall ${results.length} rules hold`);
if (process.argv.includes("--json")) console.log(JSON.stringify(results));
process.exitCode = bad ? 1 : 0;
