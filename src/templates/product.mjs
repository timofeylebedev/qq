// A coffee's page: its name and the 3D pack pinned to the screen, turning as five fact tiles scroll past; the buy bar;
// the story (a sentence, a photo, the text of the table in columns); what to take next (the taste model's moves).
import { page, head } from "./layout.mjs";
import { pills, tasteChart, pack } from "./components.mjs";
import { esc, icon, picture, rub, lower, read, href } from "./util.mjs";
import { menu } from "./blocks.mjs";

const TASTE = new Map(read("src/data/taste.json").coffees.map((c) => [c.slug, c]));

export function render(ctx, p) {
  // a coffee QQ has run out of (data/site.json shop.unavailable) keeps its page: it says the lot will be back, the buy
  // bar offers the nearest coffee instead, and «Что взять дальше» comes straight after the stage, led by that coffee
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

// «Что взять дальше»: what to take after this coffee, as a shop assistant would say it (session 2 of choosing coffee;
// the forms compared on the bench design/next-bench/). One row per move of the taste model (build/taste.mjs nextBlock
// → src/data/taste.json `next`): the condition in the visitor's words, the coffee, one line from the data on why, and
// the bag. A move with nothing that way says so in words (an edge); a coffee two moves picked is one row with both
// conditions. Sold out, the nearest coffee leads. The model never offers a relabel of the same coffee or a decaf for a
// coffee with caffeine; the only decaf is a quiet line under the list.
const IF = { softer: "Если хочется мягче", brighter: "Если хочется ярче", milk: "Если вы пьёте с молоком", unusual: "Если хочется необычного",
  classic: "Если хочется классики", similar: "Если понравился этот" };
const ifOf = (m) => IF[m.id] || m.label;
// the scale a move is about, on QQ's own coding: acidity 1–5, body 1–5, ferment 0–3 (drawn on 0–4, as the taste chart)
const MARK = { softer: ["acidity", "кислотность", 1], brighter: ["acidity", "кислотность", 1], milk: ["density", "плотность", 1],
  unusual: ["ferment", "фермент", 0], classic: ["ferment", "фермент", 0] };
const FAR = /^(в остальном заметно другой|из кофе для молока он ближе всех по вкусу)$/;

// five dots like the taste chart: this coffee a ring, the other a dot, a line between
function mark(id, here, there) {
  const m = MARK[id]; if (!m) return "";
  const [k, label, from] = m, S = 14, R = 4.5, W = R * 2 + 4 * S + 2, H = 12, x = (v) => R + 1 + (v - from) * S;
  const a = here.taste[k], b = there?.taste[k];
  const dots = [0, 1, 2, 3, 4].map((j) => `<circle cx="${R + 1 + j * S}" cy="6" r="1.5"/>`).join("");
  const step = b == null ? "" : `<line x1="${x(a)}" y1="6" x2="${x(b)}" y2="6"/><circle class="next__there" cx="${x(b)}" cy="6" r="${R}"/>`;
  const val = (v) => String(v).replace(".", ",");
  return `<span class="next__mark"><svg viewBox="0 0 ${W} ${H}" aria-hidden="true" focusable="false"><g class="next__dots">${dots}</g>${step}<circle class="next__here" cx="${x(a)}" cy="6" r="${R - 0.75}"/></svg><span>${label} ${val(a)}${b == null ? "" : ` → ${val(b)}`}</span></span>`;
}

// the line: the move's own number first (ink), the rest secondary; a far pick's tail becomes its own sentence
function line(text) {
  const parts = String(text || "").split(" · ").filter(Boolean);
  const far = parts.length > 1 && FAR.test(parts.at(-1)) ? parts.pop() : "";
  const cap = (s) => s[0].toUpperCase() + s.slice(1);
  return `<p class="next__line"><span class="next__key">${esc(parts[0] || "")}</span>${parts.slice(1).map((x) => ` · ${esc(x)}`).join("")}</p>${far ? `
        <p class="next__far">${esc(cap(far))}.</p>` : ""}`;
}

// the bag: 200 г of that coffee, as on a card (scripts/buy.js)
function buy(q) {
  const w = q.weights.find((x) => x.grams === 200) || q.weights[0];
  return `<form class="next__buy" data-buy data-slug="${q.slug}" data-name="${esc(q.name)}" action="#">
          <input class="sr" type="radio" name="weight" value="${esc(w.label)}" data-price="${w.price ?? ""}" checked tabindex="-1" aria-hidden="true">
          <button class="next__add" type="submit" data-add aria-label="В корзину: ${esc(q.name)}, ${esc(w.label)}, ${rub(w.price)}">${icon("bag-fill")}<span data-price-out>${rub(w.price)}</span></button>
        </form>`;
}

function row(ctx, p, m, also, by) {
  const conds = [m, ...also].map((x) => `<span>${esc(ifOf(x))}</span>`).join("");
  if (!m.slug) return `<li class="next__row next__row--say">
      <p class="next__if">${conds}</p>
      <p class="next__say">${esc(m.self ? "Этот кофе QQ и так советует для молока." : m.line)}</p>
    </li>`;
  const q = by.get(m.slug);
  return `<li class="next__row${m.far ? " next__row--far" : ""}" data-move="${m.id}">
      <div class="next__left"><p class="next__if">${conds}</p>${mark(m.id, p, q)}</div>
      <div class="next__then">
        <h3 class="next__name"><a class="next__link" href="${href(ctx, `coffee/${q.slug}/`)}">${esc(q.name)}</a></h3>
        ${line(m.line)}
      </div>
      ${buy(q)}
    </li>`;
}

function next(ctx, p, out = false) {
  const by = new Map(ctx.products.map((q) => [q.slug, q]));
  const n = TASTE.get(p.slug)?.next;
  if (!n) return "";
  const moves = out ? n.soldOut.moves : n.moves;
  const byId = new Map(moves.map((m) => [m.id, m]));
  const rows = moves.filter((m) => !m.sharedWith && !m.joinsLead && (m.slug ? by.has(m.slug) : true))
    .map((m) => row(ctx, p, m, (m.also || []).map((a) => byId.get(a.id) || a), by)).join("\n    ");
  let lead = "";
  if (out) {
    const l = n.soldOut.lead, q = by.get(l.slug), joins = moves.filter((m) => m.joinsLead);
    lead = `<div class="next__lead" data-tone="cloud">
      <p class="next__lead-say"><span class="next__lead-out">Лота пока нет, скоро вернётся.</span> Ближе всего&nbsp;— <a class="next__link" href="${href(ctx, `coffee/${q.slug}/`)}">${esc(q.name)}</a></p>
      ${line(l.line)}
      ${n.soldOut.note ? `<p class="next__note">${esc(n.soldOut.note)}</p>` : ""}${joins.length ? `<p class="next__note">Он же — ${joins.map((m) => ifOf(m).toLowerCase()).join(", ")}.</p>` : ""}
      ${buy(q)}
    </div>`;
  }
  const d = n.decaf && by.get(n.decaf.slug);
  const decaf = d ? `<p class="next__decaf">Нужен без кофеина? <a href="${href(ctx, `coffee/${d.slug}/`)}">${esc(d.name)}</a>: ${esc(n.decaf.line.replace(/^Без кофеина:\s*/, ""))}</p>` : "";
  return `<section class="section next${out ? " next--out" : ""}" id="next" data-ground="paper" aria-labelledby="next-title">
  <div class="col">
    ${head({ title: out ? "Что взять, пока его нет" : "Что взять дальше", id: "next-title" })}
    ${lead}
    <ul class="next__list" role="list">
    ${rows}
    </ul>
    ${decaf}
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
