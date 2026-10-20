// The blocks shared by the pages of round 4 (shop, account, information pages). One markup each; their looks are in
// src/styles/components/blocks.css and forms.css. Every block stands on the content column (.col) or inside it,
// so it changes its layout at the shared steps S, M, L.
import { esc, icon, href, cls, picture, rub } from "./util.mjs";
import { pack } from "./components.mjs";

// ── the head of a page: its title (h1, the size of section headings), an optional count beside it, and an aside on
//    the right (the account's numbers, actions). line: a hairline under it (the shop and the checkout).
export function pageHead({ title, id = "", count = null, countAttr = "", aside = "", line = false, sub = "" }) {
  return `<div class="${cls("phead", line && "phead--line")}">
    <div class="phead__main">
      <h1 class="phead__title"${id ? ` id="${id}"` : ""}>${esc(title)}${count != null || countAttr ? `<span class="phead__count"${countAttr}>${count ?? ""}</span>` : ""}</h1>${sub ? `\n      ${sub}` : ""}
    </div>${aside ? `\n    <div class="phead__aside">${aside}</div>` : ""}
  </div>`;
}

// ── tabs between pages of one place (the account) or panels of one block (the beans): mono capitals, the current one
//    in ink with a bar on the hairline, the others in ink-70. items: [text, path or null]; panels: [text, id].
export function subtabs(ctx, items, { label, here } = {}) {
  return `<nav class="subtabs" aria-label="${esc(label)}"><ul>${items.map(([t, to]) => `<li>${to
    ? `<a class="subtabs__tab" href="${href(ctx, to)}"${here === to ? ' aria-current="page"' : ""}>${esc(t)}</a>`
    : `<a class="subtabs__tab">${esc(t)}</a>`}</li>`).join("")}</ul></nav>`;
}
export function paneltabs(items, { label, name }) {
  return `<div class="subtabs subtabs--panels" role="tablist" aria-label="${esc(label)}" data-tabs="${name}">${items.map(([t, id], i) => `<button class="subtabs__tab" type="button" role="tab" id="${name}-tab-${id}" aria-controls="${name}-${id}" aria-selected="${i === 0}"${i ? ' tabindex="-1"' : ""}>${esc(t)}</button>`).join("")}</div>`;
}

// ── a count in a dot (how many coffees an order holds, how often one was bought)
export const badge = (n, label) => `<span class="badge"><span aria-hidden="true">${n}</span><span class="sr">${esc(label)}</span></span>`;

// ── the picture of a coffee: its photo when it has one (data/site.json photos), else the 3D pack on the cloud ground
export function coffeeMedia(ctx, p, { sizes = "(min-width: 64em) 25vw, 50vw" } = {}) {
  const photo = ctx.site.photos.bySlug[p.slug];
  return photo
    ? `<div class="media media--photo" data-tone="black">${picture(photo[0], photo[1], { sizes, cls: "media__photo", decorative: true })}</div>`
    : `<div class="media" data-tone="cloud">${pack(p)}</div>`;
}

// ── cells: a row or grid of tiles divided by hairlines (the delivery facts, the business reasons, the legal details)
export function tiles(list, { cols = "3", cls: c = "" } = {}) {
  return `<ul class="${cls("tiles", `tiles--${cols}`, c)}">${list.map((t) => `<li class="tile">
      ${t.icon ? `<span class="tile__icon">${icon(t.icon)}</span>` : ""}
      ${t.title ? `<h${t.level || 3} class="tile__title">${esc(t.title)}</h${t.level || 3}>` : ""}
      ${t.html ?? (t.text ? `<p class="tile__text">${esc(t.text)}</p>` : "")}
    </li>`).join("\n    ")}</ul>`;
}

// ── a form of cells on the cloud ground (the checkout, the settings, the request of the business page): a head, field
//    cells (a caption in small capitals over the field), a choice cell, a check cell, the button across the foot
export function field({ name, label, hint = "", type = "text", value = "", autocomplete = "", required = false, id }) {
  const fid = id || `f-${name}`;
  return `<div class="fcell">
      <label class="fcell__label" for="${fid}">${esc(label)}</label>
      <input class="fcell__input" id="${fid}" name="${name}" type="${type}"${value ? ` value="${esc(value)}"` : ""}${hint ? ` placeholder="${esc(hint)}"` : ""}${autocomplete ? ` autocomplete="${autocomplete}"` : ""}${type === "tel" ? ' inputmode="tel"' : ""}${required ? " required" : ""}>
    </div>`;
}
export const check = (name, text, { checked = false, value = "" } = {}) => `<label class="choice choice--check"><input class="box" type="checkbox" name="${name}"${value ? ` value="${esc(value)}"` : ""}${checked ? " checked" : ""}><span>${esc(text)}</span></label>`;
export const radio = (name, value, text, aside = "", { checked = false, data = "" } = {}) => `<label class="choice"><input class="box box--round" type="radio" name="${name}" value="${esc(value)}"${checked ? " checked" : ""}${data}><span>${esc(text)}</span>${aside ? `<span class="choice__aside">${esc(aside)}</span>` : ""}</label>`;

// ── the dark panel beside a list (the summary of the bag, the details of an order): parts divided by hairlines
export function panel(parts, { label = "", tag = "aside", attrs = "" } = {}) {
  return `<${tag} class="panel" data-tone="ink"${label ? ` aria-label="${esc(label)}"` : ""}${attrs}>
    ${parts.map((p) => `<div class="${cls("panel__part", p.cls)}">${p.title ? `\n      <h2 class="panel__title">${esc(p.title)}</h2>` : ""}
      ${p.html}
    </div>`).join("\n    ")}
  </${tag}>`;
}
// rows of a panel: [label, value, attrs on the value]
export const rows = (list, c = "") => `<dl class="${cls("prows", c)}">${list.map(([k, v, a = ""]) => `<div><dt>${esc(k)}</dt><dd${a}>${v}</dd></div>`).join("")}</dl>`;

// ── a dialog over the page (the request of the business page, the beans of the account): a head with its title and
//    the close cross, then the content. Opened by [data-dialog="id"], closed by its cross, Escape or a click outside.
export function dialog({ id, title, body, wide = false, open = false, home = "", homeTitle = "" }) {
  return `<dialog class="${cls("dialog", wide && "dialog--wide")}" id="${id}" aria-labelledby="${id}-title" data-dialog-box${open ? " data-open-on-load" : ""}${home ? ` data-home="${home}" data-home-title="${esc(homeTitle)}"` : ""}>
  <div class="dialog__head">
    <h2 class="dialog__title" id="${id}-title" data-dialog-title>${esc(title)}</h2>
    <button class="dialog__close" type="button" aria-label="Закрыть" data-dialog-close>${icon("close")}</button>
  </div>
  ${body}
</dialog>`;
}

// ── the contacts of the company (the contacts, business and about pages): two places on their maps, the legal details
export function contacts(ctx, { level = 2, id = "contacts-title" } = {}) {
  const c = ctx.company;
  const tel = (t) => `<a href="tel:${t.replace(/[^\d+]/g, "")}">${esc(t).replace(/ /g, "&nbsp;")}</a>`;
  const places = c.places.map((p) => `<li class="place">
      <a class="place__map" href="${esc(p.maps)}" target="_blank" rel="noopener" aria-label="${esc(p.title)} на Яндекс Картах">${picture(p.map[0], p.map[1], { sizes: "(min-width: 48em) 50vw, 100vw", cls: "place__image" })}<span class="place__pin">${icon("pin")}</span></a>
      <div class="place__card" data-tone="ink">
        <h${level + 1} class="place__title">${esc(p.title)}</h${level + 1}>
        <p>${esc(p.address)}</p>
        <p>${tel(p.phone)}</p>
        <p><a href="mailto:${esc(p.email)}">${esc(p.email)}</a></p>
      </div>
    </li>`).join("\n    ");
  return `<ul class="places">
    ${places}
  </ul>
  <h${level + 1} class="legal__title">${esc(c.legal.title)}</h${level + 1}>
  ${tiles(c.legal.rows.map(([k, v]) => ({ html: `<p class="legal__key">${esc(k)}</p><p class="legal__value">${/^\+7/.test(v) ? tel(v) : /@/.test(v) ? `<a href="mailto:${esc(v)}">${esc(v)}</a>` : esc(v)}</p>` })), { cols: "5", cls: "legal" })}`;
}

// ── a sentence with links inside the site: [[text|path]] links to a page, [[text]] stays text until its page exists
export function linked(ctx, s) {
  return esc(s).replace(/\[\[([^|\]]+)(?:\|([^\]]+))?\]\]/g, (_, t, to) => to ? `<a class="link" href="${href(ctx, to)}">${t}</a>` : t);
}

// ── the meta line of a coffee in a list: «200 г · В зернах · Средняя обжарка»
export const meta = (bits) => `<p class="meta">${bits.filter(Boolean).map((b) => `<span>${esc(b)}</span>`).join("")}</p>`;

export { rub };
