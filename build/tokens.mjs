// The tokens of the site: design/scale.json (every size) and design/colors.json (every colour) →
// src/styles/base/tokens.gen.css (npm run tokens; runs before every dev and build). Don't edit the CSS: edit the JSON.
//
// The build stops when the system breaks its own rules:
//   - an end of a size role is off the ladder (blocks' measures, "size": true, excepted)
//   - two type levels of type.relations are closer than relations.min at either end of the range
//   - a colour pair of colors.contrast is below its ratio
//
// Every size is one formula: its value on a 320px screen, its value on a 1440px one, a straight line in between, on
// the screen's size --vp (the width, or twice the height minus 400px if that is smaller: a screen counts as only as
// big as its height allows). Type is written in rem, so it follows the text size the visitor set in the browser.
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const read = (p) => JSON.parse(readFileSync(resolve(root, p), "utf8"));
const OUT = resolve(root, "src/styles/base/tokens.gen.css");

const r4 = (n) => Math.round(n * 10000) / 10000;

// ── sizes ────────────────────────────────────────────────────────────────────────────────────────────────────────
export function roles(sc) {
  const out = [];
  for (const [name, r] of Object.entries(sc.type.roles)) out.push({ name, kind: "type", from: r.px[0], to: r.px[1], label: !!r.label, family: r.family, css: "--" + name.replace("/", "-"), use: r.use });
  for (const [name, r] of Object.entries(sc.space.roles)) out.push({ name, kind: r.size ? "size" : "space", from: r.px[0], to: r.px[1], css: r.css, use: r.use });
  return out;
}
export function ladder(sc) {
  const out = [0];
  for (const [step, upTo] of sc.ladder.steps) for (let v = out[out.length - 1] + step; v <= upTo; v += step) out.push(v);
  return out;
}
// the height line: a screen height.from tall counts as range.from wide, height.to as range.to → size = h × times − minus
export function heightLine(range) {
  const times = (range.to - range.from) / (range.height.to - range.height.from);
  return { times, minus: times * range.height.from - range.from };
}
// a role's value on a screen of size vp
export const at = (role, vp, range) => role.from + (role.to - role.from) * Math.min(1, Math.max(0, (vp - range.from) / (range.to - range.from)));

export function check(sc, colors) {
  const errors = [], steps = new Set(ladder(sc)), byName = new Map(roles(sc).map((r) => [r.name, r]));
  for (const r of byName.values()) {
    if (r.kind === "size") continue;
    for (const v of [r.from, r.to]) if (!steps.has(v)) errors.push(`${r.name}: ${v} is not on the ladder`);
  }
  const rel = sc.type.relations;
  for (const [a, b] of rel.pairs) {
    const A = byName.get(a), B = byName.get(b);
    if (!A || !B) { errors.push(`type.relations: no role ${A ? b : a}`); continue; }
    for (const end of ["from", "to"]) {
      const k = A[end] / B[end];
      if (k < rel.min - 1e-9) errors.push(`${a} / ${b} at ${sc.range[end]}: ×${k.toFixed(3)}, less than ×${rel.min}`);
    }
  }
  for (const [fg, bg, min] of colors.contrast.pairs) {
    const k = contrast(colors.colors[fg], colors.colors[bg]);
    if (!(k >= min)) errors.push(`colour ${fg} on ${bg}: ${k.toFixed(2)}:1, less than ${min}:1`);
  }
  if (errors.length) throw new Error("design/ breaks its own rules:\n  " + errors.join("\n  "));
}

function css(role, range) {
  const rem = role.kind === "type";
  const L = (v) => (v === 0 ? "0px" : rem ? `${r4(v / 16)}rem` : `${v}px`);
  if (role.from === role.to) return L(role.from);
  return `clamp(${L(Math.min(role.from, role.to))}, calc(${L(role.from)} + (var(--vp) - ${r4(range.from / 16)}rem) * ${role.to - role.from} / ${range.to - range.from}), ${L(Math.max(role.from, role.to))})`;
}

// ── colours ──────────────────────────────────────────────────────────────────────────────────────────────────────
const rgba = (hex) => { const h = hex.slice(1); return [0, 2, 4, 6].map((i) => (i < h.length ? parseInt(h.slice(i, i + 2), 16) : 255)); };
// a colour with alpha over its ground, as it shows
const over = (fg, bg) => { const [r, g, b, a] = rgba(fg), [R, G, B] = rgba(bg), k = a / 255; return [r * k + R * (1 - k), g * k + G * (1 - k), b * k + B * (1 - k)]; };
const lum = ([r, g, b]) => [r, g, b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }).reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
export function contrast(fg, bg) {
  const ground = over(bg, "#ffffff"), shown = over(fg, "#" + ground.map((v) => Math.round(v).toString(16).padStart(2, "0")).join(""));
  const [a, b] = [lum(shown), lum(ground)].sort((x, y) => y - x);
  return (a + 0.05) / (b + 0.05);
}
const cssColor = (hex) => { const [r, g, b, a] = rgba(hex); return a === 255 ? hex : `rgb(${r} ${g} ${b} / ${Math.round((a / 255) * 100) / 100})`; };

// ── write ────────────────────────────────────────────────────────────────────────────────────────────────────────
// an eased fade: transparent → colour along a cubic-bezier curve, sampled at even steps (the opacity at x is the
// curve's y where its x is x)
// an eased fade: `stops` points of the curve from clear (0) to the colour (1), spread over 0 … reach × 100% of the
// block (the last one holds to its foot when reach < 1)
export function fade(hex, { curve: [x1, y1, x2, y2], stops, reach = 1 }) {
  const bz = (t, a, b) => 3 * (1 - t) ** 2 * t * a + 3 * (1 - t) * t ** 2 * b + t ** 3;
  const yAt = (x) => { let lo = 0, hi = 1; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; bz(m, x1, x2) < x ? (lo = m) : (hi = m); } return bz((lo + hi) / 2, y1, y2); };
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return Array.from({ length: stops }, (_, i) => { const x = i / (stops - 1); return `rgb(${r} ${g} ${b} / ${+Math.min(1, Math.max(0, yAt(x))).toFixed(3)}) ${+(x * reach * 100).toFixed(2)}%`; }).join(", ");
}

export function generate() {
  const sc = read("design/scale.json"), colors = read("design/colors.json");
  check(sc, colors);
  const { times, minus } = heightLine(sc.range);
  const lines = [
    "/* Generated by build/tokens.mjs from design/scale.json and design/colors.json. Don't edit: edit those files. */",
    ":root {",
    `  /* the screen's size: its width, or ${times} × its height − ${minus}px if that is smaller (scale.json range.height) */`,
    `  --vp: min(100vw, ${times} * 100vh - ${r4(minus / 16)}rem);`,
    `  --vp: min(100vw, ${times} * 100svh - ${r4(minus / 16)}rem);`,
    ""
  ];
  let kind = "";
  for (const role of roles(sc)) {
    if (role.kind !== kind) { kind = role.kind; lines.push(`  /* ${kind} */`); }
    lines.push(`  ${role.css}: ${css(role, sc.range)};${" ".repeat(Math.max(1, 24 - role.css.length))}/* ${role.from} → ${role.to}: ${role.use} */`);
  }
  lines.push("", "  /* line heights and tracking */");
  for (const [k, v] of Object.entries(sc.type.lineHeight)) lines.push(`  --lh-${k}: ${v};`);
  for (const [k, v] of Object.entries(sc.type.tracking)) lines.push(`  --track-${k}: ${v};`);
  lines.push("", "  /* colours */");
  for (const [k, v] of Object.entries(colors.colors)) lines.push(`  --c-${k}: ${cssColor(v)};`);
  lines.push("", "  /* eased fades, one per place (colors.json fades): the stops of linear-gradient(to bottom, var(--fade-hero)) */");
  for (const [k, f] of Object.entries(colors.fades || {})) {
    if (k.startsWith("$")) continue;
    const grounds = [].concat(f.color);
    for (const c of grounds) lines.push(`  --fade-${k}${grounds.length > 1 ? "-" + c : ""}: ${fade(colors.colors[c], f)};`);
  }
  lines.push("", "  /* descriptor dots, by flavour family */");
  for (const [k, v] of colors.descriptors.families) lines.push(`  --c-taste-${k}: ${v};`);
  lines.push(`  --c-taste-other: ${cssColor(colors.descriptors.default)};`);
  lines.push("}", "");
  writeFileSync(OUT, lines.join("\n"));
  return { roles: roles(sc).length, colors: Object.keys(colors.colors).length };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const n = generate();
  console.log(`tokens.gen.css: ${n.roles} sizes, ${n.colors} colours, rules hold`);
}
