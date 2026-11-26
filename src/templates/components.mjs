// The components every page shares: the product card, the descriptor pills, the taste chart, the pack picture, the
// weight choice with its add-to-bag button. One markup each; their looks are in src/styles/components/.
import { existsSync } from "node:fs";
import { esc, icon, href, cls, picture, rub, taste, lower, read } from "./util.mjs";

// ── descriptors ──────────────────────────────────────────────────────────────────────────────────────────────────
export const pills = (list) => `<ul class="pills">${list.map((d) => `<li class="pill" style="--dot: var(--c-taste-${taste(d)})">${esc(d)}</li>`).join("")}</ul>`;

// ── the taste chart: four scales of five dots, the chosen dots joined by a line ──────────────────────────────────
// Density, acidity and sweetness are 1–5 in the table, ferment 0–4; half points (4.5) sit between two dots.
const SCALES = [["density", "Плотность", 1], ["acidity", "Кислотность", 1], ["sweetness", "Сладость", 1], ["ferment", "Фермент", 0]];
const STEP = 18, ROW = 28, R = 5;
export function tasteChart(t) {
  const rows = SCALES.filter(([k]) => t[k] != null);
  const pts = rows.map(([k, , from], i) => [R + (t[k] - from) * STEP, ROW / 2 + i * ROW]);
  const W = R * 2 + 4 * STEP, H = rows.length * ROW;
  const dots = rows.map((_, i) => [0, 1, 2, 3, 4].map((j) => `<circle cx="${R + j * STEP}" cy="${ROW / 2 + i * ROW}" r="1.5"/>`).join("")).join("");
  const svg = `<svg class="taste__plot" viewBox="0 0 ${W} ${H}" aria-hidden="true" focusable="false">
      <g class="taste__grid">${dots}</g>
      <polyline class="taste__line" points="${pts.map((p) => p.join(",")).join(" ")}"/>
      ${pts.map(([x, y]) => `<circle class="taste__dot" cx="${x}" cy="${y}" r="${R}"/>`).join("")}
    </svg>`;
  const text = (k, from) => `${String(t[k]).replace(".", ",")} из ${from ? 5 : 4}`;
  return `<div class="taste" style="--rows: ${rows.length}">
    <dl class="taste__list">${rows.map(([k, label, from]) => `<div><dt>${label}</dt><dd class="sr">${text(k, from)}</dd></div>`).join("")}</dl>
    ${svg}
  </div>`;
}

// ── the card's taste scale: where this coffee stands among QQ's own 25, on the taste model's three axes ──────────
// A dot on a short line between the axis's words («мягкий · яркий», «лёгкий · плотный», «классический · необычный»;
// Tim, 26 Nov: what the coffee is, not a step from another, as on the filters' switches): the
// line runs from QQ's softest (lightest, most classic) coffee to its brightest (densest, most unusual), so the dot says
// «for QQ», not «for coffee in general». Positions are the taste model's (src/data/taste.json: acidity and ferment
// moved at most a little by the descriptors), never computed here. Only the axes that separate QQ's coffees: no
// sweetness (3–5 everywhere), no «Горечь» (no data), never «Оценка Q». A screen reader hears the table's values and
// their third of QQ's range. Session 3 of choosing coffee (row 14; the bench design/scales-bench/, form «Точка на линии»).
const TASTE = read("src/data/taste.json");
const POS = new Map(TASTE.coffees.map((c) => [c.slug, c.position]));
const AXES = [
  { id: "bright", coded: "acidity", label: "Кислотность", of: 5, words: ["мягкая", "средняя", "яркая"], ends: ["мягкий", "яркий"] },
  { id: "body", coded: "density", label: "Плотность", of: 5, words: ["лёгкая", "средняя", "высокая"], ends: ["лёгкий", "плотный"] },
  { id: "unusual", coded: "ferment", label: "Фермент", of: 4, words: ["классический вкус", "чуть необычный вкус", "необычный вкус"], ends: ["классический", "необычный"] }
].map((a) => {
  const v = TASTE.coffees.map((c) => c.position[a.id]);
  return { ...a, lo: Math.min(...v), hi: Math.max(...v) };
});
// both columns of words are as wide as the longest word of all (each word carries it, unseen: card.css .scale__end)
const LONGEST = AXES.flatMap((a) => a.ends).reduce((w, x) => (x.length > w.length ? x : w), "");
// On a card the scale lies in the picture, a panel apart from the buy row: with a mouse it shows while the card is
// hovered (no button to see); on a touch screen the info button in the picture's bottom left corner shows it
// (scripts/about.js). The button's name reads the values to a screen reader.
// the same rows on their own, for a coffee's page (its «Свойства» tile): seen, with the values read to a screen reader
export function tasteRows(p) {
  const pos = POS.get(p.slug);
  if (!pos) return "";
  const at = (a) => (a.hi > a.lo ? (pos[a.id] - a.lo) / (a.hi - a.lo) : 0.5);
  const say = AXES.map((a) => { const t = at(a); return `${a.label}: ${a.words[t < 1 / 3 ? 0 : t < 2 / 3 ? 1 : 2]} для QQ`; }).join(". ") + ".";
  return `<div class="scale scale--tile"><div class="scale__rows" aria-hidden="true">${AXES.map((a) =>
    `<span class="scale__end" data-w="${esc(LONGEST)}">${esc(a.ends[0])}</span><span class="scale__line"><i class="scale__dot" style="--t: ${at(a).toFixed(3)}"></i></span><span class="scale__end" data-w="${esc(LONGEST)}">${esc(a.ends[1])}</span>`).join("")}</div><p class="sr">${esc(say)}</p></div>`;
}

export function tasteScale(p) {
  const pos = POS.get(p.slug);
  if (!pos) return "";
  const at = (a) => (a.hi > a.lo ? (pos[a.id] - a.lo) / (a.hi - a.lo) : 0.5);
  const say = AXES.map((a) => {
    const t = at(a), w = a.words[t < 1 / 3 ? 0 : t < 2 / 3 ? 1 : 2], v = String(p.taste[a.coded] ?? "").replace(".", ",");
    return `${a.label} ${v} из ${a.of}, ${w} для QQ`;
  }).join(". ") + ".";
  const rows = `<div class="scale__rows">${AXES.map((a) =>
    `<span class="scale__end" data-w="${esc(LONGEST)}">${esc(a.ends[0])}</span><span class="scale__line"><i class="scale__dot" style="--t: ${at(a).toFixed(3)}"></i></span><span class="scale__end" data-w="${esc(LONGEST)}">${esc(a.ends[1])}</span>`).join("")}</div>`;
  return `<div class="about" data-about>
        <div class="about__sheet scale" aria-hidden="true">${rows}</div>
        <button class="about__info" type="button" aria-expanded="false" data-about-toggle>${icon("info")}<span class="sr">Вкус: ${esc(say)}</span></button>
      </div>`;
}

// ── the pack ─────────────────────────────────────────────────────────────────────────────────────────────────────
// A coffee's lot image (assets-src/img/lot-<slug>.jpg: its pack set down in a concrete sculpture of the lot's story,
// rounds 32–33 of the 3D project) fills its slot edge to edge, cropped to the slot's shape (Tim, 26 Nov: «the image
// should always fit the card, no space around it»). A coffee without one keeps the static pack picture
// (src/assets/pack/: a square on a transparent ground, the pack at 0.9 of it; a coffee's own <slug>-512/-1024.webp is
// picked up). No 3D (Tim, 26 Nov).
const PACKS = new URL("../assets/pack/", import.meta.url);
const LOTS = read("src/data/images.json");
export const lotImage = (p) => (LOTS[`lot-${p.slug}`] ? `lot-${p.slug}` : null);
export const packSrc = (slug, px) => existsSync(new URL(`${slug}-${px}.webp`, PACKS)) ? `/assets/pack/${slug}-${px}.webp` : `/assets/pack/pack-${px}.webp`;
export function pack(p, { size = "card", eager = false, sizes } = {}) {
  const lot = lotImage(p);
  if (lot) return `<div class="${cls("pack", `pack--${size}`, "pack--scene")}">
      ${picture(lot, `Пакет кофе ${p.name}`, { sizes: sizes || (size === "hero" ? "(min-width: 48em) 50vw, 100vw" : "(min-width: 64em) 33vw, (min-width: 48em) 50vw, 100vw"), cls: "pack__scene", eager })}
    </div>`;
  const px = size === "hero" ? 1024 : 512;
  return `<div class="${cls("pack", `pack--${size}`)}">
      <img class="pack__img" src="${packSrc(p.slug, px)}" alt="Пакет кофе ${esc(p.name)}" width="${px}" height="${px}"${eager ? "" : ' loading="lazy"'} decoding="async">
    </div>`;
}

// ── weights and the add-to-bag button (the card's bottom row) ────────────────────────────────────────────────────
// Cards offer the two retail weights (200 г and 1 кг): two radios, or below M a dropdown in their place (Figma, Tim,
// round 7; the radios stay the choice, the dropdown sets them: scripts/buy.js). The product page offers every weight.
export function buyRow(p, { tone = "light", idp, out = false, choose = false }) {
  const weights = p.weights.filter((w) => w.grams >= 200).slice(0, 2);
  const first = weights[0];
  // in the catalogue a brewing method sets the roast and grind this card puts into the bag (scripts/filters.js)
  const set = choose ? `<input type="hidden" name="grind" value="" data-set="grind"><input type="hidden" name="roast" value="" data-set="roast">` : "";
  return `<form class="${cls("buy", tone === "dark" && "buy--dark")}" data-buy data-slug="${p.slug}" action="#">${set}
      <div class="buy__weights">
        <span class="buy__radios" role="radiogroup" aria-label="Вес">${weights.map((w, i) => `<label class="weight"><input type="radio" name="w-${idp}" value="${esc(w.label)}" data-price="${w.price ?? ""}"${i === 0 ? " checked" : ""}><span>${esc(w.label)}</span></label>`).join("")}</span>
        <select class="buy__select" aria-label="Вес" data-weight-select>${weights.map((w) => `<option value="${esc(w.label)}">${esc(w.label)}</option>`).join("")}</select>${icon("chevron-down", 'class="buy__chevron"')}
      </div>
      ${out ? `<button class="buy__add" type="submit" disabled>Скоро вернётся</button>` : `<button class="buy__add" type="submit" aria-label="В корзину: ${esc(p.name)}, ${esc(first.label)}, ${rub(first.price)}">${icon("bag-fill")}<span class="buy__price" data-price-out>${rub(first.price)}</span></button>`}
    </form>`;
}

// The sentence under a card: its short line and the descriptors (its acidity, body and ferment are the scale below it)
export function cardText(p) {
  const bits = [p.short && p.short.replace(/\.$/, "") + "."];
  if (p.descriptors.length) bits.push("Во вкусе " + p.descriptors.map(lower).join(", ") + ".");
  return bits.filter(Boolean).join(" ");
}

// ── a coffee's photo: only a Special coffee shows one (Tim, round 7), when data/site.json photos gives it one; the
// rest show their pack
export const photoOf = (ctx, p) => (p?.line === "Special" && ctx.site.photos.bySlug[p.slug]) || null;

// ── the product card ─────────────────────────────────────────────────────────────────────────────────────────────
// Two looks, one markup: a pack on the light ground (its picture), or a photo on dark (a Special coffee that site.json
// gives a photo: photoOf). A card that rises into place when it comes into view (the catalog) starts waiting (wait). The whole card, its text too, links to the coffee's page (the name's link stretched over it); the heart and the buy row sit above that link.
// A card may carry its own text in place of the description (on a coffee's page: why it is offered, one line of the
// taste model; already escaped).
// In the catalogue (choose) a card also carries a line above its text that the choice writes (why it is here, what it
// misses: scripts/filters.js) and the inputs for the roast and grind a brewing method sets.
export function card(ctx, p, { size = "third", heading = 3, wait = false, text = null, choose = false } = {}) {
  const photo = photoOf(ctx, p);
  const tone = photo ? "dark" : "light";
  const id = `${ctx.page}-${p.slug}`;
  const sizes = size === "half" ? "(min-width: 64em) 50vw, (min-width: 48em) 50vw, 100vw" : "(min-width: 64em) 33vw, (min-width: 48em) 50vw, 100vw";
  return `<article class="${cls("card", `card--${size}`, `card--${tone}`)}" data-card data-slug="${p.slug}"${wait ? " data-wait" : ""}${filterData(p)}>
    <div class="card__media">
      ${photo ? picture(photo[0], photo[1], { sizes, cls: "card__photo", decorative: true }) : pack(p, { sizes })}
      <div class="card__top">
        <h${heading} class="card__title"><a class="card__link" href="${href(ctx, `coffee/${p.slug}/`)}">${esc(p.name)}</a></h${heading}>
        <button class="fav" type="button" aria-pressed="false" aria-label="В избранное: ${esc(p.name)}" data-fav="${p.slug}">${icon("heart", 'class="i-off"')}${icon("heart-fill", 'class="i-on"')}</button>
      </div>
      ${tasteScale(p)}
      ${buyRow(p, { tone, idp: id, out: ctx.site.shop.unavailable.includes(p.slug), choose })}
    </div>${choose ? `
    <p class="card__tag" data-tag hidden></p>` : ""}
    <p class="card__text">${text ?? esc(cardText(p))}</p>
  </article>`;
}

// what the catalog's sorting and the favourites' read from a card (the choice itself reads src/data/choose.json)
function filterData(p) {
  const price = p.weights.find((w) => w.grams === 200)?.price ?? p.weights[0]?.price ?? 0;
  return ` data-price="${price}" data-created="${p.created || ""}"`;
}
