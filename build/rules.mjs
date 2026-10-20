// The rules of the system, checked over the styles and the design files:   npm run rules
// (they also run in CI). Each prints what it checked; any failure exits 1.
//
//  1. colours only from tokens: no #hex, rgb() or hsl() in the styles (tokens.gen.css is generated from colors.json)
//  2. sizes only from the scale: no font-size in px or rem but a short list (the 16px floor of fields, the 12px of
//     the bag counter), and no screen units (vw, vh, svh, cqi…) outside the rules a decision lists (decisions.json css)
//  3. layout steps only at S 22rem, M 43rem, L 58rem, max 1520px (container queries) and the page steps of media.css
//  4. no rounded corners but pills and dots (radius 999px or 50%)
//  5. motion only from motion.css: transitions and animations use var(--t-…) and var(--ease-…)
//  6. faces only through var(--sans), var(--mono), var(--digits)
//  7. every var() is defined somewhere, and every token of the scale is used
//  8. the scale holds its own rules (ladder, type relations, contrast: build/tokens.mjs)
//  9. every decision is complete (id, kind, what, why, decided)
// 10. one line colour: borders are var(--line) (cool grey 20% on light grounds, white 30% on dark ones, set by the
//     ground); only a state (the current dot, a focused field) may draw its border in ink
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
  const NAMED = /(?<![\w-])(white|black|red|green|blue|gray|grey|silver|yellow|orange|purple|pink|navy|teal|maroon|olive|lime|aqua|fuchsia|brown|gold|beige|ivory)(?![\w-])/i;
  const fails = blocks.filter((b) => /#[0-9a-f]{3,8}\b|\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix)\(/i.test(b.body) ||
    b.body.split(";").some((d) => d.includes(":") && !/^\s*--/.test(d) && NAMED.test(d.split(":").slice(1).join(":").replace(/var\([^)]*\)/g, "")))).map(where);
  rule("Colours only from tokens", `no #hex, colour functions or named colours in ${styles.length} stylesheets`, fails);
}
// 2
{
  const allowed = new Set(decisions.flatMap((d) => d.css || []));
  const unit = /(?<![\w-])-?[\d.]*([sdl]?v(w|h|i|b|min|max)|cq(w|h|i|b|min|max))\b/;
  const fails = [];
  for (const b of blocks) {
    const decls = b.body.split(";").filter((d) => d.includes(":") && !/^\s*--vp\s*:/.test(d));
    if (decls.some((d) => unit.test(d.split(":").slice(1).join(":"))) && ![...allowed].some((s) => b.selector === s || b.selector.split(",").map((x) => x.trim()).includes(s))) fails.push(where(b) + " uses screen units");
    for (const d of decls) {
      const [prop, ...v] = d.split(":"); const val = v.join(":").trim();
      if (/^\s*font-size$/.test(prop) && !/var\(--type-|^inherit$|^max\(16px, var\(--type-body\)\)$|^12px$/.test(val)) fails.push(where(b) + ` font-size: ${val}`);
      if (/^\s*font$/.test(prop) && !/var\(--type-|^inherit$/.test(val)) fails.push(where(b) + ` font: ${val} (the size of the shorthand must be a --type-*)`);
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
    for (const m of src.matchAll(/@container\s+([^{]+)\{/g)) {
      const q = m[1].trim(), name = /^([\w-]+)\s*\(/.exec(q)?.[1];
      if (name !== "col") fails.push(`${relative(root, f)}: @container ${q} — layout steps query the column by name (col)`);
      const lens = [...q.matchAll(/(\d+(?:\.\d+)?)([a-z%]+)/g)].map((x) => x[1] + x[2]);
      if (!lens.length || lens.some((v) => !steps.includes(v))) fails.push(`${relative(root, f)}: @container ${q} is not at S, M, L or max`);
    }
    for (const m of src.matchAll(/@media\s+([^{]+)\{/g)) if (!/^\(--[\w-]+\)\s*$|^not \(--[\w-]+\)\s*$/.test(m[1].trim()) && !f.endsWith("media.css")) fails.push(`${relative(root, f)}: @media ${m[1].trim()} — use a condition of media.css`);
  }
  for (const f of scripts) for (const m of read(f).matchAll(/matchMedia\(\s*(["'`])(.+?)\1\s*\)/g)) if (!/^\(prefers-reduced-motion: reduce\)$|^\(width >= 48em\)$|^\(width < 40em\)$/.test(m[2])) fails.push(`${relative(root, f)}: matchMedia(${m[2]})`);
  // the page conditions themselves: only these, each written down in media.css (a new one is a decision of the system)
  const PAGE = { "--links-full": "(width >= 64em)", "--links": "(width >= 48em)", "--phone": "(width < 40em)", "--short": "(height < 32em)", "--mouse": "(hover: hover) and (pointer: fine)", "--calm": "(prefers-reduced-motion: reduce)", "--motion": "(prefers-reduced-motion: no-preference)" };
  const media = read("src/styles/base/media.css").replace(/\/\*[\s\S]*?\*\//g, "");
  for (const m of media.matchAll(/@custom-media\s+(--[\w-]+)\s+([^;]+);/g)) if (PAGE[m[1]] !== m[2].trim()) fails.push(`media.css: ${m[1]} ${m[2].trim()} — not one of the page conditions of build/rules.mjs`);
  rule("Layout steps only at S, M, L", `container queries at ${steps.join(", ")} on the column; media only through media.css (--links-full 64em, --links 48em, --phone 40em, --short 32em tall, input, motion)`, fails);
}
// 4
{
  const fails = blocks.filter((b) => [...b.body.matchAll(/border(-(top|bottom|start|end)-(left|right|start|end))?-radius\s*:\s*([^;]+)/g)].some((m) => !/^(999px|50%)$/.test(m[4].trim())) || /clip-path\s*:[^;]*\bround\b/.test(b.body)).map(where);
  rule("No rounded corners", "border-radius only 999px (pills) or 50% (dots)", fails);
}
// 5
{
  const fails = [];
  for (const b of blocks) for (const d of b.body.split(";")) {
    const [prop, ...v] = d.split(":"); const val = v.join(":");
    if (/^\s*(transition|animation)(-duration|-timing-function|-delay)?\s*$/.test(prop) && /\d(m?s)\b|cubic-bezier|\bease\b|linear\b/.test(val.replace(/var\([^)]*\)/g, "").replace(/\b0s\b/g, "")) && !/@keyframes/.test(b.selector)) {
      if (!(/^\s*animation\s*$/.test(prop) && /\d+s\b/.test(val) && /hero-drift/.test(val)) && !/opacity 0\.3s var\(--ease-out\)/.test(val)) fails.push(where(b) + `: ${prop.trim()}: ${val.trim().slice(0, 50)}`);
    }
  }
  rule("Motion only from motion.css", "transitions use var(--t-in/out/move) and var(--ease-out/move/leave); the hero's slow drift is the one loop", fails);
}
// 6
{
  const fails = blocks.filter((b) => /font-family\s*:(?!\s*(var\(--(sans|mono|digits)\)|"(Apercu|PT Mono|Technology)"))/.test(b.body) || b.body.split(";").some((d) => /^\s*font\s*:/.test(d) && !/var\(--(sans|mono|digits)\)\s*$|:\s*inherit\s*$/.test(d.trim()))).filter((b) => !b.file.endsWith("base.css") && !b.file.endsWith("fonts.css")).map(where);
  rule("Faces only through tokens", "font-family is var(--sans), var(--mono) or var(--digits)", fails);
}
// 7
{
  const all = styles.map(read).join("\n") + read("src/styles/base/tokens.gen.css");
  const defined = new Set([...all.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
  const used = new Set([...(all + scripts.map(read).join("\n")).matchAll(/var\((--[\w-]+)/g)].map((m) => m[1]));
  const fails = [...used].filter((v) => !defined.has(v) && !["--dot", "--i", "--tiles", "--cols", "--rows", "--buybar-h", "--per", "--n", "--ground", "--fg", "--rule", "--bleed-l", "--bleed-r", "--lines", "--sbw", "--v"].includes(v)).map((v) => `${v} is used but never defined`);
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

// 10
{
  const fails = [];
  for (const b of blocks) for (const d of b.body.split(";")) {
    const [prop, ...v] = d.split(":"); const val = v.join(":");
    if (!/^\s*border(-(top|bottom|left|right|inline|block)(-(start|end))?)?(-color)?\s*$/.test(prop) || !/var\(--|currentColor/.test(val)) continue;
    const state = /\[aria-current|:focus|\[aria-pressed|:checked/.test(b.selector);
    if (/var\(--line\)|currentColor|transparent/.test(val) || (state && /var\(--c-ink\)|currentColor/.test(val))) continue;
    fails.push(where(b) + `: ${prop.trim()}: ${val.trim().slice(0, 40)}`);
  }
  const lines = blocks.filter((b) => /(^|;)\s*--line\s*:/.test(b.body)).map((b) => b.body.match(/--line\s*:\s*([^;]+)/)[1].trim());
  for (const l of lines) if (!["var(--c-ink-20)", "var(--c-white-30)"].includes(l)) fails.push(`--line set to ${l}: only ink-20 (light) or white-30 (dark)`);
  rule("One line colour", `every border is var(--line), set by the ground to ink-20 or white-30 (${lines.length} places); states may use ink`, fails);
}
// 11
{
  // a gradient is either an eased fade (colors.json fades) or a solid band (two stops of one colour, a layer of a
  // background); a fade written by hand (transparent → colour) shows a hard edge where it ends
  const fails = [];
  for (const b of blocks) for (const g of b.body.match(/(repeating-)?(linear|radial|conic)-gradient\((?:[^()]|\([^()]*\))*\)/g) || []) {
    const inner = g.slice(g.indexOf("(") + 1, -1);
    if (/var\(--fade(-[\w-]+)?\)/.test(inner)) continue;                                       // a fade, or a card's own (--fade: one of them)
    const vars = inner.match(/var\(--[\w-]+\)/g) || [];
    if (!/transparent/.test(inner) && vars.length === 2 && vars[0] === vars[1]) continue;     // a solid band
    if (/\d+deg/.test(inner) && /currentColor/.test(inner)) continue;                          // a drawn shape (the select's arrow)
    fails.push(where(b) + `: ${g.slice(0, 60)}`);
  }
  // a fade lies over its whole block (Tim, round 5): no solid band beside it in the same background
  for (const b of blocks) for (const d of b.body.split(";")) {
    const gs = d.match(/(linear|radial|conic)-gradient\(/g) || [];
    if (/var\(--fade/.test(d) && gs.length > 1) fails.push(where(b) + `: a fade with a solid band under it (${d.trim().slice(0, 50)}…)`);
  }
  rule("Every fade eased", "gradients are var(--fade-*) (colors.json fades: one per place, eased, over the whole block, no solid band under it) or solid bands for lines", fails);
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
