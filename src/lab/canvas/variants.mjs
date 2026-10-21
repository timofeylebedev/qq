// The component canvas: what it shows. Each group compares one prop or feature of one component; every other thing
// stays the same in its slots (the same coffee, text, ground and width). Components come from their templates
// (src/templates/components.mjs, layout.mjs) or are cut out of the real rendered pages (home, catalog, a coffee), so
// the canvas always shows what the site's templates produce. Nothing here changes a component.
//
// A group: { id, title, compares, slot (px), slots: [{ label, html } | { label, frame: { src, w, h, crop } }] }
//   html    markup placed in the canvas page itself
//   frame   a preview document (an iframe of a real screen size) for what depends on the page width or on scrolling
// OMITTED lists what the canvas leaves out on purpose, and why.
import { card, pills, tasteChart, pack } from "../../templates/components.mjs";
import { head, arrows, page } from "../../templates/layout.mjs";
import * as home from "../../templates/home.mjs";
import * as catalog from "../../templates/catalog.mjs";
import * as product from "../../templates/product.mjs";
import * as info from "../../templates/info.mjs";
import * as shop from "../../templates/shop.mjs";
import * as acc from "../../templates/account.mjs";
import { pageHead, subtabs, tiles, field, check, radio } from "../../templates/blocks.mjs";

// ── the rendered pages, and a cutter for their parts ─────────────────────────────────────────────────────────────
// cut(html, attrs) finds the first element whose opening tag matches `attrs` (a regex over the tag) and returns the
// whole element, up to its matching closing tag. A template that changes so a part can't be found fails loudly.
export function cut(html, attrs, from = 0) {
  const re = new RegExp(`<([a-z][a-z0-9]*)\\b(?=[^>]*${attrs.source})[^>]*>`, "gi");
  re.lastIndex = from;
  const open = re.exec(html);
  if (!open) throw new Error(`canvas: no element matching ${attrs} in the rendered page (did a template change?)`);
  const tag = open[1].toLowerCase(), any = new RegExp(`<(/?)${tag}\\b[^>]*>`, "gi");
  any.lastIndex = open.index + open[0].length;
  for (let depth = 1, m; (m = any.exec(html)); ) {
    depth += m[1] ? -1 : 1;
    if (!depth) return html.slice(open.index, m.index + m[0].length);
  }
  throw new Error(`canvas: ${tag} matching ${attrs} is never closed`);
}

// every page is rendered as if it sat at the canvas's address (/lab/canvas/): its links and assets lead to the site
// from there (two levels up)
export const REL = "../../";
export const PRODUCT = "keniya-kisii";   // a single origin with a photo; the audit's coffee too

export function rendered(data) {
  const { site, products, company } = data;
  const p = products.find((x) => x.slug === PRODUCT);
  const c = { site, products, company, rel: REL };
  return {
    business: info.business({ ...c, page: "business" }), faq: info.faq({ ...c, page: "faq" }), about: info.about({ ...c, page: "about" }),
    privacy: info.privacy({ ...c, page: "privacy" }), delivery: info.delivery({ ...c, page: "delivery" }),
    cart: shop.cart({ ...c, page: "cart" }), details: shop.checkoutDetails({ ...c, page: "details" }), shipping: shop.checkoutDelivery({ ...c, page: "shipping" }),
    profile: acc.profile({ ...c, page: "account" }), order: acc.order({ ...c, page: "order" }, "433273"), purchases: acc.purchases({ ...c, page: "purchases" }),
    home: home.render({ site, products, page: "home", rel: REL }),
    catalog: catalog.render({ site, products, page: "catalog", rel: REL }),
    product: product.render({ site, products, page: "product", rel: REL }, p),
    frame: (ground) => page({ site, products, page: "canvas", rel: REL }, { title: "Navbar — QQ Coffee", description: "", body: "", ground })
  };
}

// ── sample data ──────────────────────────────────────────────────────────────────────────────────────────────────
// Real coffees from the data, with one field changed where a group compares that field. The descriptors of the
// family group are sample words, one per flavour family of design/colors.json (and one that belongs to none).
const FAMILY_WORDS = [["chocolate", "Молочный шоколад"], ["nuts", "Фундук"], ["citrus", "Апельсин"], ["berry", "Лесные ягоды"],
  ["orchard", "Зелёное яблоко"], ["sweet", "Карамель"], ["tea", "Чёрный чай"], ["tropical", "Маракуйя"], ["vine", "Виноград"],
  ["spice", "Специи"], ["other — no family", "Сливочный"]];
const MANY = ["Сухофрукты", "Чай", "Шоколад", "Лесные ягоды", "Апельсин", "Карамель"];

function samples({ site, products }) {
  const by = Object.fromEntries(products.map((p) => [p.slug, p]));
  const base = by["vetnam-kua-mon"];                              // a Special coffee with four descriptors and a photo
  if (!base || base.line !== "Special" || !site.photos.bySlug[base.slug]) throw new Error("canvas: the sample coffee vetnam-kua-mon (Special, with a photo) is missing");
  const noPhoto = { ...site, photos: { ...site.photos, bySlug: {} } };
  const w200 = base.weights.find((w) => w.grams === 200);
  return {
    by, base,
    light: { site: noPhoto, products, page: "canvas", rel: REL },  // a coffee shows its 3D pack
    dark: { site, products, page: "canvas", rel: REL },            // a coffee shows its photo (data/site.json)
    one: { ...base, weights: [w200] },
    noPrice: { ...base, weights: base.weights.map((w) => ({ ...w, price: null })) },
    bare: { ...base, descriptors: [], taste: {} }
  };
}

// ── the groups ───────────────────────────────────────────────────────────────────────────────────────────────────
// Slot widths are the widths these parts have on a 1440px screen (column 1344 = 1440 − 2 × 48 gutter).
const SCREEN = 1440, CARD = 432, HALF = 660;
const SCREENS = { phone: { w: 390, h: 844 }, tablet: { w: 768, h: 1024 }, desktop: { w: 1440, h: 900 } };
// the navbar's four steps (media.css): the tab bar, the burger, the short sections, every section
const NAV_SCREENS = { "phone (tab bar)": { w: 390, h: 844 }, "small tablet (burger)": { w: 700, h: 900 }, "tablet (short sections)": { w: 768, h: 1024 }, "desktop (every section)": { w: 1440, h: 900 } };
export const GROUNDS = [["paper", "white"], ["cloud", "cloud (the footer, a product's story)"], ["black", "black (the hero, the dark image block)"], ["ink", "cool grey (business)"]];

export function groups(data) {
  const s = samples(data);
  const pages = rendered(data);
  const { home: H, catalog: C, product: P } = pages;
  const lightStory = cut(H, /class="story story--light"/), darkStory = cut(H, /class="story story--dark"/);
  // the account's head and its parts are cut from the order (which has no tabs) and the purchases page: each id once
  const PR = pages.purchases;
  const TABS = [["Профиль", "account/"], ["Активность", null], ["Заказы", "account/orders/"], ["Покупки", "account/purchases/"], ["Настройки", "account/settings/"]];

  return [
    // ── components ──
    {
      id: "pills-family", title: "Descriptor pills · flavour family", compares: "family (the dot's colour)", slot: 200,
      slots: FAMILY_WORDS.map(([family, word]) => ({ label: family, html: pills([word]) }))
    },
    {
      id: "pills-count", title: "Descriptor pills · how many", compares: "number of descriptors", slot: 320,
      slots: [1, 3, 6].map((n) => ({ label: `${n} ${n === 1 ? "descriptor" : "descriptors"}`, html: pills(MANY.slice(0, n)) }))
    },
    {
      id: "taste-values", title: "Taste chart · values", compares: "the four scores", slot: 280,
      slots: [
        { label: "lowest — 1, 1, 1, ferment 0", html: tasteChart({ density: 1, acidity: 1, sweetness: 1, ferment: 0 }) },
        { label: "highest — 5, 5, 5, ferment 4", html: tasteChart({ density: 5, acidity: 5, sweetness: 5, ferment: 4 }) },
        { label: "half points — 2,5 · 4,5 · 3,5 · 0,5", html: tasteChart({ density: 2.5, acidity: 4.5, sweetness: 3.5, ferment: 0.5 }) },
        { label: "three scales — no ferment", html: tasteChart({ density: 3, acidity: 4, sweetness: 4 }) }
      ]
    },
    {
      id: "head-layout", title: "Section head · layout", compares: "what sits beside the title", slot: 1100,
      slots: [
        { label: "title only", html: head({ title: "Рекомендуем", id: "cv-head-1" }) },
        { label: "with arrows", html: head({ title: "Рекомендуем", id: "cv-head-2", aside: arrows("Пример", "cv-none") }) },
        { label: "centred", html: head({ title: "Рекомендуем", id: "cv-head-3", center: true }) },
        { label: "centred, with a lead", html: head({ title: "Рекомендуем", id: "cv-head-4", center: true, lead: data.site.business.lead }) }
      ]
    },
    {
      id: "arrows", title: "Arrows", compares: "—", slot: 200,
      slots: [{ label: "default (the ends grey out only on a row that scrolls: see New arrivals, Recommended)", html: arrows("Пример", "cv-none") }]
    },
    {
      id: "pager", title: "Pager", compares: "—", slot: 280,
      slots: [{ label: "the first in view (it follows its row in New arrivals)", html: cut(H, /class="pager"/) }]
    },
    {
      id: "button", title: "Button", compares: "—", slot: 280,
      slots: [{ label: "default (from the buy bar)", html: `<div class="cv-ground">${cut(P, /class="btn buybar__add"/)}</div>` }]
    },
    {
      id: "btn-arrow-ground", title: "Arrow button · ground", compares: "ground", slot: 280,
      slots: [
        { label: "light ground (image block «О компании»)", html: `<div class="story story--light cv-ground">${cut(lightStory, /class="btn-arrow"/)}</div>` },
        { label: "dark ground (image block «Наш подход»)", html: `<div class="story story--dark cv-ground">${cut(darkStory, /class="btn-arrow"/)}</div>` }
      ]
    },
    {
      id: "pack-size", title: "3D pack · size", compares: "size", slot: 480,
      slots: [
        { label: "card", html: `<div class="cv-box">${pack(s.base)}</div>` },
        { label: "hero (a coffee's page)", html: `<div class="cv-box">${pack(s.base, { size: "hero" })}</div>` }
      ]
    },
    {
      id: "card-tone", title: "Card · tone", compares: "tone", slot: CARD,
      slots: [
        { label: "light — no photo, the 3D pack", html: card(s.light, s.base) },
        { label: "dark — the coffee's photo", html: card(s.dark, s.base) }
      ]
    },
    {
      id: "card-size", title: "Card · size", compares: "size", slot: HALF,
      slots: [
        { label: "third (4 : 5)", html: card(s.light, s.base, { size: "third" }) },
        { label: "half (square)", html: card(s.light, s.base, { size: "half" }) }
      ]
    },
    {
      id: "card-name", title: "Card · name length", compares: "name", slot: CARD,
      slots: [
        { label: "short", html: card(s.light, { ...s.base, name: "Q-Punch" }) },
        { label: "long (the longest in the data)", html: card(s.light, { ...s.base, name: "Колумбия Эль Пласэр ИПА" }) },
        { label: "longer than any yet", html: card(s.light, { ...s.base, name: "Индонезия Воносалам Анаэробная Натуральная" }) }
      ]
    },
    {
      id: "card-weights", title: "Card · weights and price", compares: "weights", slot: CARD,
      slots: [
        { label: "two weights (200 г and 1 кг)", html: card(s.light, s.base) },
        { label: "one weight", html: card(s.light, s.one) },
        { label: "no price yet", html: card(s.light, s.noPrice) }
      ]
    },
    {
      id: "card-text", title: "Card · text", compares: "description", slot: CARD,
      slots: [
        { label: "short line, descriptors, density, acidity", html: card(s.light, s.base) },
        { label: "short line only (no descriptors, no scores)", html: card(s.light, s.bare) }
      ]
    },

    // ── round 4: the blocks of the shop, the account and the information pages (src/templates/blocks.mjs) ──
    {
      id: "phead", title: "Page head · what goes with the title", compares: "count, line, aside", slot: 900,
      slots: [
        { label: "title only (information pages)", html: pageHead({ title: "Контакты", id: "cv-ph-1" }) },
        { label: "a count and the hairline (the bag, the favourites)", html: pageHead({ title: "Корзина", id: "cv-ph-2", count: 6, line: true }) },
        { label: "numbers aside (the account)", html: cut(PR, /class="phead"/) }
      ]
    },
    {
      id: "subtabs", title: "Tabs of a place", compares: "the current one", slot: 900,
      slots: [
        { label: "Профиль current (Активность: a label, no page)", html: subtabs(data.ctx, TABS, { label: "Пример 1", here: "account/" }) },
        { label: "Настройки current", html: subtabs(data.ctx, TABS, { label: "Пример 2", here: "account/settings/" }) }
      ]
    },
    {
      id: "tiles-cols", title: "Tiles · columns", compares: "how many in a row (from L)", slot: SCREEN - 96,
      slots: [
        { label: "three (delivery and payment)", html: cut(pages.delivery, /class="tiles tiles--3/) },
        { label: "four (the business page's reasons)", html: cut(pages.business, /class="tiles tiles--4/) },
        { label: "five (legal details)", html: cut(pages.business, /class="tiles tiles--5/) }
      ]
    },
    {
      id: "form-cells", title: "Form · cells", compares: "kind of cell", slot: 440,
      slots: [
        { label: "fields with hints (your details; Себе / В подарок)", html: cut(pages.details, /data-checkout-step="details"/).replace(/id="co-/g, 'id="cv-co-').replace(/for="co-/g, 'for="cv-co-') },
        { label: "a field and radio choices (delivery)", html: cut(pages.shipping, /data-checkout-step="delivery"/).replace(/id="co-/g, 'id="cv2-co-').replace(/for="co-/g, 'for="cv2-co-') },
        { label: "values, an action, checkboxes", html: `<div class="form" data-tone="cloud">${field({ name: "cv", label: "Телефон", value: "+7 915 800 65 45", id: "cv-f-1" })}<div class="fcell fcell--checks">${check("cv-l", "Скидки", { checked: true })}${check("cv-l", "Новые сорта")}</div><div class="fcell">${radio("cv-r", "a", "Курьером", "415 ₽ • 1–2 дня", { checked: true })}</div></div>` }
      ]
    },
    {
      id: "panel", title: "Dark panel", compares: "what it sums up", slot: 440,
      slots: [
        { label: "the bag (figures filled by its script)", html: cut(pages.cart, /data-cart-summary/) },
        { label: "an order", html: cut(pages.order, /class="panel"/) }
      ]
    },
    {
      id: "orow", title: "Order row", compares: "an order or one coffee of it", slot: 900,
      slots: [
        { label: "an order (the profile, the orders)", html: cut(pages.profile, /class="orow"/) },
        { label: "a coffee of an order (one order's page)", html: cut(pages.order, /class="orow orow--item"/) }
      ]
    },
    {
      id: "pcard", title: "Coffee bought · tone", compares: "tone", slot: 330,
      slots: [
        { label: "the 3D pack, bought twice or more", html: cut(PR, /class="pcard" data-card data-slug="q-finch"/) },
        { label: "a photo", html: cut(PR, /class="pcard" data-card data-slug="peru-monte-verde"/) }
      ]
    },
    { id: "activity", title: "Activity", compares: "—", slot: SCREEN, slots: [{ label: "the profile (the beans' plus opens their dialog)", html: cut(pages.profile, /class="tiles tiles--cloud activity"/) }] },
    { id: "places", title: "Contacts", compares: "—", slot: SCREEN, slots: [{ label: "the contacts, business and about pages", html: cut(pages.business, /class="places"/) }] },
    { id: "qa", title: "Questions and answers", compares: "—", slot: 640, slots: [{ label: "a group (each question opens its answer)", html: cut(pages.faq, /class="qa-group"/) }] },
    { id: "note", title: "Summary note", compares: "—", slot: 640, slots: [{ label: "the privacy policy", html: cut(pages.privacy, /class="note"/) }] },
    { id: "bhero", title: "Business hero", compares: "—", slot: SCREEN, page: "business/", slots: [{ label: "business (the first two actions open the request form)", html: cut(pages.business, /class="bhero"/) }] },
    { id: "offers", title: "Offers", compares: "—", slot: SCREEN, slots: [{ label: "business", html: cut(pages.business, /class="offers"/) }] },
    { id: "reviews", title: "Reviews", compares: "—", slot: SCREEN, slots: [{ label: "business", html: cut(pages.business, /class="reviews"/) }] },
    { id: "team", title: "Team", compares: "—", slot: SCREEN, slots: [{ label: "about", html: cut(pages.about, /class="team"/) }] },

    // ── page blocks ──
    {
      id: "nav-theme", title: "Navbar · ground", compares: "the section under it", slot: SCREEN, break: true,
      slots: GROUNDS.map(([g, name]) => ({ label: `${name} — desktop 1440 × 900 (the top shown)`, frame: { src: `frame-nav-${g}.html`, ...SCREENS.desktop, crop: 160 } }))
    },
    {
      id: "nav-screen", title: "Navbar · screen", compares: "screen width", slot: SCREEN,
      slots: Object.entries(NAV_SCREENS).map(([name, sc]) => ({ label: `${name} ${sc.w} × ${sc.h}, white (the whole screen: the tab bar stands at its foot under 40em; the burger opens the menu under 48em)`, frame: { src: "frame-nav-paper.html", ...sc } }))
    },
    { id: "hero", title: "Hero", compares: "—", slot: SCREEN, page: "", slots: [{ label: "home", html: cut(H, /class="hero"/) }] },
    { id: "featured", title: "New arrivals", compares: "—", slot: SCREEN, slots: [{ label: "home (a text square and a photo square; the pager in the middle and the arrows move them)", html: cut(H, /aria-labelledby="featured-title"/) }] },
    { id: "recs", title: "Recommended", compares: "—", slot: SCREEN, slots: [{ label: "home (a row of cards that scrolls sideways)", html: cut(H, /aria-labelledby="recs-title"/) }] },
    {
      id: "story-theme", title: "Image block · theme", compares: "theme", slot: SCREEN,
      slots: [{ label: "dark («Наш подход»)", html: darkStory }, { label: "light («О компании»)", html: lightStory }]
    },
    { id: "business", title: "Business", compares: "—", slot: SCREEN, slots: [{ label: "home", html: cut(H, /class="section business"/) }] },
    { id: "facts", title: "Facts", compares: "—", slot: SCREEN, slots: [{ label: "home (a block grows into its modal)", html: cut(H, /class="facts"/) }] },
    { id: "footer", title: "Footer", compares: "—", slot: SCREEN, slots: [{ label: "every page", html: cut(H, /class="footer"/) }] },
    { id: "catalog", title: "Catalog", compares: "—", slot: SCREEN, page: "catalog/", slots: [{ label: "the roast line, tabs, filters and every coffee", html: cut(C, /class="section section--first catalog"/) }] },
    {
      id: "stage-screen", title: "Product stage · screen", compares: "screen width", slot: SCREEN, page: `coffee/${PRODUCT}/`,
      slots: [
        { label: `phone ${SCREENS.phone.w} × ${SCREENS.phone.h} — scroll inside: the pack turns as the facts pass`, frame: { src: "frame-stage.html", ...SCREENS.phone } },
        { label: `desktop ${SCREENS.desktop.w} × ${SCREENS.desktop.h} — scroll inside`, frame: { src: "frame-stage.html", ...SCREENS.desktop } }
      ]
    },
    { id: "buybar", title: "Buy bar", compares: "—", slot: SCREEN, slots: [{ label: "a coffee's page (here in its place, not following the screen)", html: cut(P, /class="buybar"/) }] },
    { id: "pstory", title: "Product story", compares: "—", slot: SCREEN, slots: [{ label: "a coffee's page", html: cut(P, /class="pstory"/) }] },
    { id: "similar", title: "Similar coffees", compares: "—", slot: SCREEN, slots: [{ label: "a coffee's page", html: cut(P, /class="section similar"/) }] }
  ];
}

// What the canvas leaves out, and why (also in the report of the PR that added it).
export const OMITTED = [
  ["Pressed heart, bag and favourite counts", "set by clicking: they live in this browser's storage (the dev server's, not the site's); not forced on"],
  ["Arrows at an end, pager on another slide", "set by the row's own script as it scrolls: scroll New arrivals or Recommended"],
  ["Open filter, ticked options, open fact, open roast note, open menu", "states reached by clicking, not forced open"],
  ["Hover and focus looks", "come from the real pointer and keyboard"],
  ["Section head level (h2/h3), card heading level", "the same look; only the tag differs"],
  ["The buy row on its own", "it takes its ground from the card around it: shown in every card group"],
  ["Email field, weight dots, buy-bar cells, menu cells and their options (the filters, the buy bar), tabs", "shown in their blocks (footer, cards, buy bar, catalog), not alone"],
  ["Page blocks at other widths", "the canvas draws in your window: sizes follow its width and height (design/README.md, `--vp`). Only the navbar and the product stage are shown on screens of their own; more screens would each need their own 3D canvas"],
  ["Navbar dark on a phone", "theme and screen are compared separately"],
  ["Catalog's empty and «soon» states", "reached by filtering or by its tabs"],
  ["Every combination of props", "one prop at a time"],
  ["A line of the bag, an empty bag or favourites", "written by scripts/cart.js and scripts/favs.js from this browser's bag: see cart/ and favourites/"],
  ["The request form and the beans dialog", "dialogs over their page: open them on business/ and account/"],
  ["The about page's title over the photo and the founder's letter", "one page block, seen on about/"]
];
