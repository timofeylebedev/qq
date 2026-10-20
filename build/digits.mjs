// QQ Digits as a program: the countdown's digits drawn as SVG segments (design/digits.json), so each segment can be lit,
// faded and later animated on its own (Tim, round 6). The drawing is the one of the artifact «QQ Digits»: the same
// geometry, ported as it is (pointed LCD segments cut at 45° across a slit, outer corners capped by `corner`).
//
// digitsSVG("00:00:00") writes the markup: one <svg> 3000 × height units (fit3em: «00:00:00» is exactly 3 em), a <g>
// per character, seven <path class="sg"> per digit (data-s a…g) and one for a colon. Every segment is drawn; the
// script (src/scripts/digits.js) gives the lit ones the class `on`, the rest show as the trace. data-lit holds the
// segments each digit 0–9 lights, so the script needs no copy of the drawing's rules.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const MAP = { 0: "abcdef", 1: "bc", 2: "abdeg", 3: "abcdg", 4: "bcfg", 5: "acdfg", 6: "cdefg", 7: "abc", 8: "abcdefg", 9: "abcfg" };
const SEGS = "abcdefg";

export const settings = JSON.parse(readFileSync(resolve(import.meta.dirname, "../design/digits.json"), "utf8")).settings;

export const litOf = (p, d) => {
  let s = MAP[d];
  if (d === 6 && p.tail6) s += "a";
  if (d === 9 && p.tail9) s += "d";
  if (d === 7 && p.hook7) s += "f";
  return s;
};

function metrics(p) {
  const C = Math.round(p.dot + 2 * p.colonSide);
  const A = p.fit3em ? (3000 - 2 * C) / 6 : p.advance;
  const w = Math.max(A - 2 * p.side, 2 * p.stroke + 40);
  return { A, C, w, H: p.height };
}

// the seven segments of a digit cell, as polygons (x right, y up), before slanting
function segments(p, m) {
  const t = p.stroke, h = t / 2, g = p.slit, H = m.H, s = p.side, w = m.w;
  const ym = h + p.middle * (H - t);
  const out = {};
  if (p.ends === "block") {
    const R = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
    out.a = R(s + t + g, H - t, s + w - t - g, H);
    out.g = R(s + t + g, ym - h, s + w - t - g, ym + h);
    out.d = R(s + t + g, 0, s + w - t - g, t);
    out.f = R(s, ym + g / 2, s + t, H);
    out.e = R(s, 0, s + t, ym - g / 2);
    out.b = R(s + w - t, ym + g / 2, s + w, H);
    out.c = R(s + w - t, 0, s + w, ym - g / 2);
    return { segs: out, ym };
  }
  // pointed: each end is cut at 45°, across a slit of width g from its neighbour's end; an end in one of the four
  // outer corners reaches into the corner square, its tip sliding from the stroke's middle (corner 1) to the corner's
  // outer point (corner 0)
  const k = g / Math.SQRT2, bd = Math.min(Math.max(p.tip, 0), 0.999) * h * Math.SQRT2;
  const lam = Math.min(Math.max(p.corner ?? 1, 0), 1) / 2;
  const xl = s + h, xr = s + w - h, yb = h, yt = H - h;
  const unit = ([x, y]) => { const l = Math.hypot(x, y) || 1; return [x / l, y / l]; };
  const end = (u0, v, o, l) => {
    const O = [u0 + k - h, v + o * h], I = [u0 + k + h, v - o * h];
    const P = [O[0] + l * (I[0] - O[0]), O[1] + l * (I[1] - O[1])];
    const Q = [u0 + k - h + 4 * h * l, v + o * h];
    const dQ = l > 1e-6 ? unit([Q[0] - P[0], Q[1] - P[1]]) : [1, 0], dI = unit([I[0] - P[0], I[1] - P[1]]);
    const lQ = l > 1e-6 ? Math.hypot(Q[0] - P[0], Q[1] - P[1]) : 2 * h, lI = Math.hypot(I[0] - P[0], I[1] - P[1]);
    const tip = bd > 0.5
      ? [[P[0] + dQ[0] * Math.min(bd, lQ * 0.9), P[1] + dQ[1] * Math.min(bd, lQ * 0.9)], [P[0] + dI[0] * Math.min(bd, lI * 0.9), P[1] + dI[1] * Math.min(bd, lI * 0.9)]]
      : [P];
    const outerFirst = [Q, ...tip, I];
    return o > 0 ? outerFirst : outerFirst.reverse();
  };
  const bar = (u0, u1, v, hz, o, c0, c1) => {
    const a = end(u0, v, o, c0 ? lam : 0.5);
    const z = end(-u1, v, o, c1 ? lam : 0.5).map(([u, vv]) => [-u, vv]).reverse();
    const pts = [...a, ...z];
    return hz ? pts : pts.map(([u, vv]) => [vv, u]);
  };
  out.a = bar(xl, xr, yt, true, +1, true, true);
  out.g = bar(xl, xr, ym, true, +1, false, false);
  out.d = bar(xl, xr, yb, true, -1, true, true);
  out.f = bar(ym, yt, xl, false, -1, false, true);
  out.e = bar(yb, ym, xl, false, -1, true, false);
  out.b = bar(ym, yt, xr, false, +1, false, true);
  out.c = bar(yb, ym, xr, false, +1, true, false);
  return { segs: out, ym };
}

function colon(p, m, ym) {
  const r = p.dot / 2, cx = m.C / 2, d = p.spread * (m.H / 2 - p.stroke / 2);
  const dot = (cy) => p.dotShape === "diamond"
    ? [[cx, cy - r * Math.SQRT2], [cx + r * Math.SQRT2, cy], [cx, cy + r * Math.SQRT2], [cx - r * Math.SQRT2, cy]]
    : [[cx - r, cy - r], [cx + r, cy - r], [cx + r, cy + r], [cx - r, cy + r]];
  return [dot(ym - d), dot(ym + d)];
}

// every glyph: polygons slanted and rounded to whole units
export function geometry(p = settings) {
  const m = metrics(p);
  const { segs, ym } = segments(p, m);
  const tan = Math.tan((p.slant * Math.PI) / 180);
  const fix = (poly) => {
    const q = poly.map(([x, y]) => [Math.round(x + (y - m.H / 2) * tan), Math.round(y)]);
    return q.filter((pt, i) => { const n = q[(i + 1) % q.length]; return pt[0] !== n[0] || pt[1] !== n[1]; });
  };
  const seg = {};
  for (const s of SEGS) seg[s] = fix(segs[s]);
  return { m: { ...m, ym }, seg, colon: colon(p, m, ym).map(fix), tan };
}

// SVG's y runs down: the polygons are flipped here, so the markup needs no transform
const pathOf = (polys, H, x0 = 0) => polys.map((q) => "M" + q.map(([x, y]) => `${x + x0} ${H - y}`).join("L") + "Z").join("");

export function digitsSVG(pattern = "00:00:00", { cls = "digits", p = settings, lit: lighted = true } = {}) {
  const G = geometry(p), H = G.m.H;
  let x = 0, body = "";
  for (const ch of pattern) {
    if (ch === ":") { body += `<path class="sg${lighted ? " on" : ""}" data-colon d="${pathOf(G.colon, H, Math.round(x))}"/>`; x += G.m.C; continue; }
    const lit = litOf(p, +ch);
    body += `<g data-cell>${[...SEGS].map((s) => `<path class="sg${lighted && lit.includes(s) ? " on" : ""}" data-s="${s}" d="${pathOf([G.seg[s]], H, Math.round(x))}"/>`).join("")}</g>`;
    x += G.m.A;
  }
  const lits = Array.from({ length: 10 }, (_, d) => litOf(p, d)).join(" ");
  return `<svg class="${cls}" viewBox="0 0 ${Math.round(x)} ${H}" aria-hidden="true" focusable="false" data-lit="${lits}">${body}</svg>`;
}
