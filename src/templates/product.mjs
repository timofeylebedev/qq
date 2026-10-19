// A coffee's page: its name and the 3D pack pinned to the screen, turning as five fact tiles scroll past; the buy bar;
// the story (a sentence, a photo, the text of the table in columns); coffees with a similar taste.
import { page, head } from "./layout.mjs";
import { card, pills, tasteChart, pack } from "./components.mjs";
import { esc, icon, picture, rub, taste, lower } from "./util.mjs";

export function render(ctx, p) {
  const body = [stage(ctx, p), buybar(p), story(p), similar(ctx, p)].join("\n");
  return page(ctx, {
    title: `${p.name} — QQ Coffee`,
    description: `${p.name}: ${p.short}. ${p.descriptors.join(", ")}.`,
    main: "product", body
  });
}

function stage(ctx, p) {
  const tiles = facts(p);
  return `<section class="pstage" data-stage aria-labelledby="product-title" style="--tiles: ${tiles.length}">
  <div class="pstage__pin">
    <div class="pstage__head">
      <h1 class="pstage__name" id="product-title">${esc(p.name)}</h1>
      <p class="pstage__meta">${[p.line, p.type, p.countries.join(", ")].filter(Boolean).map(esc).join(" · ")}</p>
    </div>
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
  tiles.push({ title: "Как готовить", body: `<p class="ptile__text">${roasts ? `Обжарка: ${esc(roasts)}.<br>` : ""}${p.use.length ? esc(p.use.join(", ")) + ".<br>" : ""}Помол: ${esc(p.grind.map((g) => lower(GRIND[g] || g)).join(", "))}.</p>` });
  return tiles;
}

function buybar(p) {
  const options = (name, caption, list, value = (x) => x.value, text = (x) => x.text) => `<label class="cell cell--select">
        <span class="cell__caption">${caption}</span>
        <select name="${name}">${list.map((x, i) => `<option value="${esc(value(x))}"${(x.sel ?? i === 0) ? " selected" : ""}${x.price != null ? ` data-price="${x.price}"` : ""}>${esc(text(x))}</option>`).join("")}</select>
      </label>`;
  const grind = p.grind.map((g) => ({ value: g, text: GRIND[g] || g }));
  const roast = p.roasts.map((r) => ({ value: r.use, text: r.level || r.use }));
  const weights = p.weights.map((w) => ({ value: w.label, text: w.label, price: w.price }));
  const def = p.weights.find((w) => w.grams === 200) || p.weights[0];
  return `<form class="buybar" data-buybar data-buy data-slug="${p.slug}" action="#" aria-label="Купить ${esc(p.name)}">
 <div class="col"><div class="buybar__inner">
  <div class="buybar__cells">
      ${grind.length ? options("grind", "Помол", grind) : ""}
      ${roast.length ? options("roast", "Обжарка", roast) : ""}
      ${options("weight", "Вес", weights.map((w) => ({ ...w, sel: w.value === def.label })))}
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
  return `<section class="pstory" aria-labelledby="story-title">
  <div class="col">
    <p class="pstory__statement" id="story-title">${esc(p.short)}</p>
    ${picture("farm-drying", "Сушка кофе на африканских кроватях", { sizes: "(min-width: 90em) 1344px, 100vw", cls: "pstory__image" })}
    <div class="pstory__cols" style="--cols: ${Math.min(cols.length, 3)}">
      ${cols.map((c) => `<p>${esc(c)}</p>`).join("\n      ")}
    </div>
  </div>
</section>`;
}

// coffees with a similar taste: the distance between the four taste scores, less for every shared flavour family
function similar(ctx, p) {
  const fam = (x) => new Set(x.descriptors.map(taste));
  const mine = fam(p);
  const score = (q) => ["density", "acidity", "sweetness", "ferment"].reduce((s, k) => s + Math.abs((p.taste[k] ?? 0) - (q.taste[k] ?? 0)), 0)
    - 0.75 * [...fam(q)].filter((f) => mine.has(f)).length + (q.line === p.line ? 0 : 0.5);
  const list = ctx.products.filter((q) => q.slug !== p.slug).sort((a, b) => score(a) - score(b)).slice(0, 4);
  return `<section class="section similar" aria-labelledby="similar-title">
  <div class="col">
    ${head({ title: "Кофе с похожим вкусом", id: "similar-title", center: true })}
    <div class="grid grid--wide">
      ${list.map((q) => card(ctx, q, { size: "half" })).join("\n      ")}
    </div>
  </div>
</section>`;
}
