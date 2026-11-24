// The taste map: every coffee as a dot, acidity across («мягче» left, «ярче» right), body up («плотнее» above,
// «легче» below), cut into nine regions by faint hairlines. The catalogue opens it under «Карта вкуса» (a chip or a
// filter lights its coffees; a region is a choice of its own); the quiz (session 4) will place a visitor on it as a
// wide region (scripts/tastemap.js `area`). Its places come from build/choose.mjs (src/data/choose.json `map`): dots
// never overlap at this shape and size, and every dot sits inside its region's lines.
// Markup only; scripts/tastemap.js makes it work (lighting, regions, a dot's card, names beside lit dots, the keys).
import { esc, read } from "./util.mjs";

const pct = (n) => `${(n * 100).toFixed(2)}%`;

export function tasteMap(ctx, { id = "tmap", label = "Карта вкуса" } = {}) {
  const { map, coffees } = read("src/data/choose.json");
  const regions = [];
  map.rowIds.forEach((b, j) => map.colIds.forEach((a, i) => {
    const r = map.regions.find((x) => x.id === `${a}-${b}`);
    regions.push(`<button type="button" class="tmap__region" data-region="${r.id}"${i === map.colIds.length - 1 ? " data-right" : ""}${j === map.rowIds.length - 1 ? " data-bottom" : ""} aria-pressed="false" tabindex="${regions.length ? -1 : 0}" style="--x0: ${pct(map.cols[i])}; --x1: ${pct(map.cols[i + 1])}; --y0: ${pct(map.rows[j])}; --y1: ${pct(map.rows[j + 1])}"><span class="sr">${esc(r.ru)}: ${r.n} кофе</span></button>`);
  }));
  // the dots in reading order (top to bottom, left to right), for a screen reader and the arrow keys
  const dots = [...coffees].sort((a, b) => a.map.v - b.map.v || a.map.u - b.map.u);
  const odd = (c) => c.position.unusual >= 2;
  const x = map.axes.x.ru, y = map.axes.y.ru;
  return `<div class="tmap" id="${id}" data-tmap>
    <div class="tmap__box" style="--aspect: ${map.aspect}; --dot: ${pct(2 * map.r)}">
      <div class="tmap__regions" role="group" aria-label="${esc(label)}: области">${regions.join("")}</div>
      <span class="tmap__axis tmap__axis--up" aria-hidden="true">↑ ${esc(y[1])}</span>
      <span class="tmap__axis tmap__axis--down" aria-hidden="true" style="--at: ${pct((map.cols[1] + map.cols[2]) / 2)}">↓ ${esc(y[0])}</span>
      <span class="tmap__axis tmap__axis--left" aria-hidden="true">← ${esc(x[0])}</span>
      <span class="tmap__axis tmap__axis--right" aria-hidden="true">${esc(x[1])} →</span>
      <div class="tmap__dots" role="group" aria-label="${esc(label)}: кофе">${dots.map((c, i) => `<button type="button" class="tmap__dot${odd(c) ? " tmap__dot--odd" : ""}${c.decaf ? " tmap__dot--decaf" : ""}" data-slug="${c.slug}" aria-pressed="false" tabindex="${i ? -1 : 0}" style="--u: ${pct(c.map.u)}; --v: ${pct(c.map.v)}"><span class="sr">${esc(c.name)}</span></button>`).join("")}</div>
      <div class="tmap__labels" aria-hidden="true"></div>
    </div>
    <p class="tmap__key"><span class="tmap__k"><i class="tmap__dot tmap__dot--key"></i>кофе</span><span class="tmap__k"><i class="tmap__dot tmap__dot--key tmap__dot--odd"></i>необычный</span><span class="tmap__k"><i class="tmap__dot tmap__dot--key tmap__dot--decaf"></i>без кофеина</span></p>
    <div class="tmap__info" data-tmap-info aria-live="polite" hidden></div>
  </div>`;
}

