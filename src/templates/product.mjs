// A coffee's page (marketing's rows 16 and 17, Tim, 26 Nov): the first screen in two halves from M, the pack's picture on the
// left (pinned under the navbar while the right half scrolls) and on the right the name, the line
// under it and the facts as tiles in a grid; the story (a sentence, a photo, the text of the table in columns); who
// drinks it («Впечатления», people.mjs; the line under the name links to them); then the buy bar, which follows the
// screen's foot through all of that and lets go there, before «Что взять еще» (the taste model's moves).
import { page, head } from "./layout.mjs";
import { card, pills, tasteRows, pack } from "./components.mjs";
import { esc, icon, picture, rub, lower, read, href } from "./util.mjs";
import { menu } from "./blocks.mjs";
import { people, peopleLink } from "./people.mjs";

const TASTE = new Map(read("src/data/taste.json").coffees.map((c) => [c.slug, c]));

export function render(ctx, p) {
  // a coffee QQ has run out of (data/site.json shop.unavailable) keeps its page: a pill under the name says it will be
  // back, the buy bar offers the nearest coffee in stock instead (from the first screen on), and «Что взять еще» begins
  // with that coffee
  const out = ctx.site.shop.unavailable.includes(p.slug);
  // the buy bar stands after everything about this coffee: sticky to the screen's foot, it stays there through the stage,
  // the story and «Впечатления», and lets go where its own place comes, before «Что взять еще» (Tim, 26 Nov; row 17)
  const body = [stage(ctx, p, out), story(p), people(ctx, p), out ? outbar(ctx, p) : buybar(p), next(ctx, p, out)].join("\n");
  return page(ctx, {
    title: `${p.name} — QQ Coffee`,
    description: `${p.name}: ${p.short}. ${p.descriptors.join(", ")}.`,
    main: "product", body
  });
}

function stage(ctx, p, out = false) {
  const tiles = facts(p);
  // the pack's half comes second in the markup (the name is read first) and first on the screen
  return `<section class="pstage" data-stage data-ground="paper" aria-labelledby="product-title">
  <div class="col"><div class="pstage__grid">
    <div class="pstage__info">
      <div class="pstage__head"><div class="pstage__title">
        <h1 class="pstage__name" id="product-title" data-typeset="spaces">${esc(p.name)}</h1>
        <p class="pstage__meta">${[p.line, p.type, p.countries.join(", ")].filter(Boolean).map(esc).join(" · ")}</p>
      </div>
      ${peopleLink(ctx, p)}${fitLine(p)}${out ? `
      <p class="pstage__out">${p.type === "Смесь" ? "Пока нет в наличии" : "Лота пока нет"}, скоро вернётся</p>` : ""}</div>
      <div class="pstage__facts">
        <ul class="pstage__tiles${tiles.length % 2 ? " pstage__tiles--odd" : ""}" aria-label="О кофе">
          ${tiles.map((t) => `<li class="ptile">
            ${t.title ? `<h2 class="ptile__title">${esc(t.title)}</h2>` : ""}
            ${t.body}
          </li>`).join("\n          ")}
        </ul>
        ${brew(p)}
      </div>
    </div>
    <div class="pstage__pin">
      ${pack(p, { size: "hero", eager: true })}
    </div>
  </div></div>
</section>`;
}

// the visitor's way of brewing, from the quiz: the roast and grind the buy bar then starts on (src/data/choose.json, the
// catalogue's; scripts/tastesaved.js reads it). Never shown: no line about it under the name (Tim, 26 Nov)
const CHOOSE = read("src/data/choose.json"), QWORDS = read("data/quiz.json").words;
function fitLine(p) {
  const c = CHOOSE.coffees.find((x) => x.slug === p.slug);
  if (!c) return "";
  const data = { slug: p.slug, roasts: c.roasts, methods: c.methods, names: Object.fromEntries(CHOOSE.methods.map((m) => [m.id, m.ru])), roast: QWORDS.roast, grind: QWORDS.grind };
  return `\n    <p class="pstage__fit" data-fit="${esc(JSON.stringify(data))}" hidden></p>`;
}

const GRIND = { "В зернах": "Зерна", "Турка": "Для турки", "Фильтр": "Для фильтра", "Эспрессо": "Для эспрессо" };
const num = (n) => String(n).replace(".", ",");

function facts(p) {
  const tiles = [];
  if (p.descriptors.length) tiles.push({ title: "Дескрипторы", body: pills(p.descriptors) });
  // the card's taste panel, in the tile (Tim, 26 Nov: «what we have in the info card»)
  tiles.push({ title: "Свойства", body: tasteRows(p) });
  // the lots: a hairline above each but the first
  const lots = `<ul class="ptile__lots">${p.composition.map((c) => `<li><span>${esc(c.lot)}</span><span>${c.share != null ? c.share + "%" : ""}</span></li>`).join("")}</ul>`;
  if (p.processing) tiles.push({ title: `${p.processing} обработка`, body: `<p class="ptile__text">${p.q ? `Оценка Q — <b>${num(p.q)}</b> из 100.` : ""} Как обрабатывают зерно, рассказываем ниже.</p>` });
  else tiles.push({ title: `Смесь ${p.composition.length} лотов`, body: lots });
  // a single origin: its country and lots; a blend: its sentence, larger, without a title (the countries are in the
  // line under the name)
  tiles.push(p.processing ? { title: p.countries.join(" · ") || "Происхождение", body: lots } : { body: `<p class="ptile__lead">${esc(p.short)}</p>` });
  return tiles;
}

// «Как готовить» under the tiles: a menu that opens (details), so it never makes the tiles' rows uneven
function brew(p) {
  const roasts = p.roasts.map((r) => `${r.use}${r.level ? ", " + lower(r.level) : ""}`).join(" / ");
  // «Вторая кофемолка» is QQ's word for cafés; it means nothing to someone buying for home (session 0), so it never shows
  const use = p.use.filter((u) => u !== "Вторая кофемолка");
  return `<details class="pbrew">
          <summary class="pbrew__summary"><h2 class="ptile__title">Как готовить</h2>${icon("chevron-down")}</summary>
          <p class="ptile__text pbrew__text">${roasts ? `Обжарка: ${esc(roasts)}.<br>` : ""}${use.length ? esc(use.join(", ")) + ".<br>" : ""}Помол: ${esc(p.grind.map((g) => lower(GRIND[g] || g)).join(", "))}.</p>
        </details>`;
}

// the buy bar: the options as menu cells (the catalog's filters: blocks.mjs menu, opening upwards), the quantity, the
// price, «В корзину»; on black (Tim, round 7)
function buybar(p) {
  const opt = (name, caption, list, sel) => menu(name, caption, "radio", list, { checked: sel ?? list[0]?.[0], up: true });
  const grind = p.grind.map((g) => [g, GRIND[g] || g]);
  const roast = p.roasts.map((r) => [r.use, r.level || r.use]);
  const weights = p.weights.map((w) => [w.label, w.label, w.price != null ? ` data-price="${w.price}"` : ""]);
  const def = p.weights.find((w) => w.grams === 200) || p.weights[0];
  return `<form class="buybar" data-buybar data-buy data-tone="ink" data-slug="${p.slug}" action="#" aria-label="Купить ${esc(p.name)}">
 <div class="col"><div class="buybar__inner">
  <div class="buybar__cells">
      ${grind.length ? opt("grind", "Помол", grind) : ""}
      ${roast.length ? opt("roast", "Обжарка", roast) : ""}
      ${opt("weight", "Вес", weights, def.label)}
      <div class="cell cell--qty" role="group" aria-label="Количество">
        <button type="button" data-step="-1" aria-label="Меньше">${icon("minus-round")}</button>
        <output name="qty" data-qty>1</output>
        <button type="button" data-step="1" aria-label="Больше">${icon("plus-round")}</button>
      </div>
      <output class="cell cell--price" data-price-out${p.pricePlaceholder ? ' title="Цена-заглушка"' : ""}>${rub(def.price)}</output>
  </div>
  <button class="btn buybar__add" type="submit">В корзину</button>
 </div></div>
</form>`;
}

function story(p) {
  const cols = p.about.length ? p.about : [p.short];
  return `<section class="pstory" data-ground="cloud" aria-labelledby="story-title">
  <div class="col">
    <p class="pstory__statement" id="story-title">${esc(p.short)}</p>
    ${picture("farm-drying", "Сушка кофе на африканских кроватях", { sizes: "(min-width: 90em) 1344px, 100vw", cls: "pstory__image" })}
    <div class="pstory__cols" style="--cols: ${Math.min(cols.length, 3)}">
      ${cols.map((c) => `<p>${esc(c)}</p>`).join("\n      ")}
    </div>
  </div>
</section>`;
}

// «Что взять еще»: what to take after this coffee (session 2 of choosing coffee; Tim chose the bench's form 1, simpler:
// cards and what they are about, in a grid). One card per move of the taste model (build/taste.mjs nextBlock →
// src/data/taste.json `next`): похожий, мягче, ярче, необычнее or классичнее, the move in colour above the card and one
// line from the data as its text. A move with nothing that way gives its place to another (легче, плотнее, тоже
// похожий: the model decides); a coffee two moves picked is one card with both words. Sold out, the nearest coffee comes first, «Ближе всего». The model
// never offers a sold-out coffee, a relabel of the same coffee or a decaf for a coffee with caffeine.
function next(ctx, p, out = false) {
  const by = new Map(ctx.products.map((q) => [q.slug, q]));
  const n = TASTE.get(p.slug)?.next;
  if (!n) return "";
  const moves = out ? n.soldOut.moves : n.moves;
  const byId = new Map(moves.map((m) => [m.id, m]));
  const tags = (list) => `<p class="next__tag">${list.map(esc).join(" · ")}</p>`;
  const item = (q, list, line) => `<div class="next__item">
        ${tags(list)}
        ${card(ctx, q, { size: "third", text: esc(line) })}
      </div>`;
  const items = [];
  if (out) {
    const l = n.soldOut.lead, q = by.get(l.slug);
    if (q) items.push(item(q, ["Ближе всего", ...moves.filter((m) => m.joinsLead).map((m) => m.label)], l.line));
  }
  for (const m of moves) if (m.slug && by.has(m.slug) && !m.joinsLead) items.push(item(by.get(m.slug), [m.label, ...(m.also || []).map((a) => (byId.get(a.id) || a).label)], m.line));
  return `<section class="section next${out ? " next--out" : ""}" id="next" data-ground="paper" aria-labelledby="next-title">
  <div class="col">
    ${head({ title: "Что взять еще", id: "next-title" })}
    <div class="next__grid" style="--n: ${items.length}">
      ${items.join("\n      ")}
    </div>
  </div>
</section>`;
}

// the buy bar while the coffee is out: the same bar, saying so and offering the nearest coffee (its page)
function outbar(ctx, p) {
  const n = TASTE.get(p.slug)?.next, q = n && ctx.products.find((x) => x.slug === n.soldOut.lead.slug);
  const w = q && (q.weights.find((x) => x.grams === 200) || q.weights[0]);
  return `<div class="buybar buybar--out" data-buybar data-tone="ink">
 <div class="col"><div class="buybar__inner">
  <p class="cell buybar__state"><b>Нет в наличии</b><span>Скоро вернётся</span></p>
  ${q ? `<a class="buybar__lead" href="${href(ctx, `coffee/${q.slug}/`)}"><span class="buybar__k">Ближе всего${TASTE.get(p.slug)?.decaf && !TASTE.get(q.slug)?.decaf ? " · с кофеином" : ""}</span><span class="buybar__name">${esc(q.name)}</span><span class="buybar__price">${rub(w.price)}</span>${icon("arrow-right")}</a>` : ""}
 </div></div>
</div>`;
}
