// A coffee's page: its name and the 3D pack pinned to the screen, turning as five fact tiles scroll past; the buy bar;
// the story (a sentence, a photo, the text of the table in columns); «Что взять еще» (the taste model's moves).
import { page, head, arrows } from "./layout.mjs";
import { card, pills, tasteChart, pack } from "./components.mjs";
import { esc, icon, picture, rub, lower, read, href } from "./util.mjs";
import { menu } from "./blocks.mjs";

const TASTE = new Map(read("src/data/taste.json").coffees.map((c) => [c.slug, c]));

export function render(ctx, p) {
  // a coffee QQ has run out of (data/site.json shop.unavailable) keeps its page: it says the lot will be back, the buy
  // bar offers the nearest coffee instead, and «Что взять еще» comes straight after the stage, led by that coffee
  const out = ctx.site.shop.unavailable.includes(p.slug);
  const body = (out ? [stage(ctx, p, out), outbar(ctx, p), next(ctx, p, out), story(p)] : [stage(ctx, p), buybar(p), story(p), next(ctx, p)]).join("\n");
  return page(ctx, {
    title: `${p.name} — QQ Coffee`,
    description: `${p.name}: ${p.short}. ${p.descriptors.join(", ")}.`,
    main: "product", body
  });
}

function stage(ctx, p, out = false) {
  const tiles = facts(p);
  return `<section class="pstage" data-stage data-ground="paper" aria-labelledby="product-title" style="--tiles: ${tiles.length}">
  <div class="pstage__pin">
    <div class="pstage__head"><div class="pstage__title">
      <h1 class="pstage__name" id="product-title" data-typeset="spaces">${esc(p.name)}</h1>
      <p class="pstage__meta">${[p.line, p.type, p.countries.join(", ")].filter(Boolean).map(esc).join(" · ")}</p>${out ? `
      <p class="pstage__out">Лота пока нет, скоро вернётся</p>` : ""}
    </div></div>
    ${pack(p, { size: "hero", eager: true })}
  </div>
  <div class="col pstage__col"><ul class="pstage__facts" aria-label="О кофе">
    ${tiles.map((t, i) => `<li class="ptile" style="--i: ${i}">
      <h2 class="ptile__title">${esc(t.title)}</h2>
      ${t.body}
    </li>`).join("\n    ")}
  </ul></div>
</section>`;
}

const GRIND = { "В зернах": "Зерна", "Турка": "Для турки", "Фильтр": "Для фильтра", "Эспрессо": "Для эспрессо" };
const num = (n) => String(n).replace(".", ",");

function facts(p) {
  const tiles = [];
  if (p.descriptors.length) tiles.push({ title: "Дескрипторы", body: pills(p.descriptors) });
  tiles.push({ title: "Свойства", body: tasteChart(p.taste) });
  const lots = `<ul class="ptile__lots">${p.composition.map((c) => `<li><span>${esc(c.lot)}</span><span>${c.share != null ? c.share + "%" : ""}</span></li>`).join("")}</ul>`;
  if (p.processing) tiles.push({ title: `${p.processing} обработка`, body: `<p class="ptile__text">${p.q ? `Оценка Q — <b>${num(p.q)}</b> из 100.` : ""} Как обрабатывают зерно, рассказываем ниже.</p>` });
  else tiles.push({ title: `Смесь ${p.composition.length} лотов`, body: lots });
  tiles.push({ title: p.countries.join(" · ") || "Происхождение", body: p.processing ? lots : `<p class="ptile__text">${esc(p.short)}</p>` });
  const roasts = p.roasts.map((r) => `${r.use}${r.level ? ", " + lower(r.level) : ""}`).join(" / ");
  // «Вторая кофемолка» is QQ's word for cafés; it means nothing to someone buying for home (session 0), so it never shows
  const use = p.use.filter((u) => u !== "Вторая кофемолка");
  tiles.push({ title: "Как готовить", body: `<p class="ptile__text">${roasts ? `Обжарка: ${esc(roasts)}.<br>` : ""}${use.length ? esc(use.join(", ")) + ".<br>" : ""}Помол: ${esc(p.grind.map((g) => lower(GRIND[g] || g)).join(", "))}.</p>` });
  return tiles;
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
// cards and what they are about). One card per move of the taste model (build/taste.mjs nextBlock → src/data/taste.json
// `next`): похожий, мягче, ярче, необычнее or классичнее, the move as the card's label and one line from the data as
// its text, in the reel of the home page's «Рекомендуем». A move with nothing that way is one quiet sentence under the
// cards; a coffee two moves picked is one card with both labels. Sold out, the nearest coffee comes first, «Ближе
// всего». The model never offers a relabel of the same coffee or a decaf for a coffee with caffeine; the only decaf is
// a quiet line under the cards.
const FAR = /^(в остальном заметно другой|из кофе для молока он ближе всех по вкусу)$/;

// the card's text: the move's own number first (ink), a far pick's warning next, the rest secondary
function why(text) {
  const parts = String(text || "").split(" · ").filter(Boolean);
  const far = parts.length > 1 && FAR.test(parts.at(-1)) ? parts.pop() : "";
  const [key, ...rest] = far ? [parts[0], far, ...parts.slice(1)] : parts;
  return `<span class="card__key">${esc(key || "")}</span>${rest.map((x) => ` · ${esc(x)}`).join("")}`;
}

function next(ctx, p, out = false) {
  const by = new Map(ctx.products.map((q) => [q.slug, q]));
  const n = TASTE.get(p.slug)?.next;
  if (!n) return "";
  const moves = out ? n.soldOut.moves : n.moves;
  const byId = new Map(moves.map((m) => [m.id, m]));
  const labels = (m) => [m.label, ...(m.also || []).map((a) => (byId.get(a.id) || a).label.toLowerCase())].join(" · ");
  const cards = [];
  if (out) {
    const l = n.soldOut.lead, q = by.get(l.slug);
    const joins = moves.filter((m) => m.joinsLead).map((m) => m.label.toLowerCase());
    if (q) cards.push(card(ctx, q, { label: ["Ближе всего", ...joins].join(" · "), text: why(l.line) }));
  }
  for (const m of moves) if (m.slug && by.has(m.slug) && !m.joinsLead) cards.push(card(ctx, by.get(m.slug), { label: labels(m), text: why(m.line) }));
  const said = [...moves.filter((m) => m.edge).map((m) => m.line), out ? n.soldOut.note : null].filter(Boolean);
  const d = n.decaf && by.get(n.decaf.slug);
  const decaf = d ? `Нужен без кофеина? <a href="${href(ctx, `coffee/${d.slug}/`)}">${esc(d.name)}</a>: ${esc(n.decaf.line.replace(/^Без кофеина:\s*/, ""))}` : "";
  const notes = [...said.map(esc), decaf].filter(Boolean);
  return `<section class="section next${out ? " next--out" : ""}" id="next" data-ground="paper" aria-labelledby="next-title">
  <div class="col">
    ${head({ title: "Что взять еще", id: "next-title", aside: arrows("Что взять еще", "next") })}
    <div class="reel next__reel" data-slider="next" tabindex="-1">
      ${cards.join("\n      ")}
    </div>
    ${notes.length ? `<div class="next__notes">${notes.map((x) => `<p>${x}</p>`).join("")}</div>` : ""}
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
  ${q ? `<a class="buybar__lead" href="${href(ctx, `coffee/${q.slug}/`)}"><span class="buybar__k">Ближе всего</span><span class="buybar__name">${esc(q.name)}</span><span class="buybar__price">${rub(w.price)}</span>${icon("arrow-right")}</a>` : ""}
 </div></div>
</div>`;
}
