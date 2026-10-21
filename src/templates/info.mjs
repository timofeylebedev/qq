// The information pages: business (for coffee shops), questions and answers, delivery and payment, contacts, the
// privacy policy, about the company. Texts from data/*.json; blocks from blocks.mjs.
import { page, head } from "./layout.mjs";
import { imageBlock } from "./home.mjs";
import { pageHead, tiles, field, check, dialog, contacts, linked } from "./blocks.mjs";
import { esc, icon, href, cls, picture, rub, read, heroVideo } from "./util.mjs";

const TITLES = { "Заявка": "Заявка на сотрудничество", "Прайс-лист": "Заявка на прайс-лист", "Консалтинг": "Запись на консалтинг", "Школа бариста": "Запись в школу бариста" };
// a button that opens the request form with its topic (the form's title follows it)
const opener = (topic, inner, c) => `<button class="${c}" type="button" data-dialog="request" data-topic="${esc(topic)}" data-title="${esc(TITLES[topic] || TITLES["Заявка"])}">${inner}</button>`;

// ── business ─────────────────────────────────────────────────────────────────────────────────────────────────────
export function business(ctx) {
  const b = read("data/business.json");
  const hero = `<section class="bhero" data-ground="ink" aria-labelledby="bhero-title">
  <div class="col"><div class="bhero__col">
    <div class="bhero__copy">
      <div class="bhero__text">
        <h1 class="bhero__title" id="bhero-title">${esc(b.title)}</h1>
        <p class="bhero__lead">${esc(b.lead)}</p>
      </div>
      <ul class="bhero__actions">${b.actions.map((a, i) => `<li>${a.dialog
        ? opener(a.topic, `<span>${esc(a.text)}</span>${icon(a.icon)}`, cls("bhero__action", i === 0 && "bhero__action--main"))
        : `<a class="bhero__action" href="${a.href.startsWith("#") ? a.href : href(ctx, a.href)}"><span>${esc(a.text)}</span>${icon(a.icon)}</a>`}</li>`).join("")}</ul>
    </div>
    ${picture(b.image[0], b.image[1], { sizes: "(min-width: 48em) 50vw, 100vw", cls: "bhero__image", eager: true })}
  </div></div>
</section>`;

  const reasons = `<section class="section" data-ground="paper" aria-labelledby="reasons-title">
  <div class="col">
    ${head({ title: b.reasons.title, id: "reasons-title" })}
    ${tiles(b.reasons.items, { cols: "4", cls: "tiles--icons" })}
  </div>
</section>`;

  const start = `<section class="section section--after-tight" data-ground="paper" aria-labelledby="start-title">
  <div class="col">
    ${head({ title: b.start.title, id: "start-title" })}
    <ul class="offers">${b.start.items.map((o) => `<li class="offer" data-tone="black">
      ${picture(o.image[0], o.image[1], { sizes: "(min-width: 48em) 50vw, 100vw", cls: "offer__image" })}
      <div class="offer__info">
        <h3 class="offer__title">${esc(o.title)}</h3>
        <p class="offer__text">${esc(o.text)}</p>
        ${opener(o.topic, `<span class="btn-arrow__label">Записаться</span>${icon("arrow-right")}`, "btn-arrow")}
      </div>
    </li>`).join("\n    ")}</ul>
    ${opener(b.start.price.topic, `<span class="rowlink__icon">${icon("table")}</span><span class="rowlink__title">${esc(b.start.price.title)}</span><span class="rowlink__go">${icon("arrow-right")}</span>`, "rowlink")}
  </div>
</section>`;

  const reviews = `<section class="section section--after-tight" data-ground="paper" aria-labelledby="reviews-title">
  <div class="col">
    ${head({ title: b.reviews.title, id: "reviews-title" })}
    <ul class="reviews">${b.reviews.items.map((r) => `<li class="review">
      ${picture(r.image[0], r.image[1], { sizes: "(min-width: 64em) 33vw, (min-width: 48em) 50vw, 100vw", cls: "review__image" })}
      <figure class="review__body" data-tone="ink">
        <blockquote class="review__text"><p>${esc(r.text)}</p></blockquote>
        <figcaption class="review__who">${esc(r.who)}</figcaption>
      </figure>
    </li>`).join("\n    ")}</ul>
  </div>
</section>`;

  const req = b.request;
  const form = dialog({ id: "request", title: req.title, body: `<form class="form form--dialog" data-tone="cloud" data-request action="#">
    <input type="hidden" name="topic" value="Прайс-лист" data-topic-field>
    ${req.fields.map((f) => field({ ...f, id: `req-${f.name}`, required: f.name === "name" || f.name === "phone" })).join("\n    ")}
    <div class="fcell">${check("news", req.news)}</div>
    <button class="btn form__submit" type="submit">${esc(req.submit)}</button>
  </form>` });

  return page(ctx, {
    title: "QQ Coffee для кофеен",
    description: b.lead,
    ground: "ink", main: "business-page",
    body: [hero, reasons, start, reviews, contactsSection(ctx, "section--after-tight"), form].join("\n")
  });
}

// the contacts of the company as a section of a page (business, about) or as the page itself
function contactsSection(ctx, extra = "", level = 2) {
  return `<section class="${cls("section", extra)}" data-ground="paper" id="contacts" aria-labelledby="contacts-title">
  <div class="col">
    ${head({ title: "Контакты", id: "contacts-title" })}
    ${contacts(ctx, { level })}
  </div>
</section>`;
}

export function contactsPage(ctx) {
  const body = `<section class="section section--first" data-ground="paper" aria-labelledby="contacts-title">
  <div class="col">
    ${pageHead({ title: "Контакты", id: "contacts-title" })}
    ${contacts(ctx, { level: 1 })}
  </div>
</section>`;
  return page(ctx, { title: "Контакты — QQ Coffee", description: "Офис и производство QQ Coffee: адреса, телефоны, почта и реквизиты.", main: "contacts-page", body });
}

// ── questions and answers ────────────────────────────────────────────────────────────────────────────────────────
export function faq(ctx) {
  const f = read("data/faq.json");
  const body = `<section class="section section--first" data-ground="paper" aria-labelledby="faq-title">
  <div class="col"><div class="narrow">
    ${pageHead({ title: f.title, id: "faq-title" })}
    ${f.groups.map((g, gi) => `<section class="qa-group" aria-labelledby="qa-${gi}">
      <h2 class="qa-group__title" id="qa-${gi}">${esc(g.title)}</h2>
      <div class="qa-list" data-tone="cloud">${g.items.map((it) => `<details class="qa"${it.placeholder ? " data-placeholder" : ""}>
        <summary class="qa__q">${esc(it.q)}</summary>
        <div class="qa__a">${it.a.map((p) => `<p>${linked(ctx, p)}</p>`).join("")}</div>
      </details>`).join("")}</div>
    </section>`).join("\n    ")}
  </div></div>
</section>`;
  return page(ctx, { title: "Вопросы и ответы — QQ Coffee", description: "Как выбрать и хранить кофе, как оплатить и когда придёт заказ, кофе для бизнеса.", main: "faq-page", body });
}

// ── delivery and payment: the three facts of the home page, told in full ──────────────────────────────────────────
export function delivery(ctx) {
  const { site } = ctx;
  const data = esc(JSON.stringify({ days: site.roast.days, hour: site.roast.hour, tz: site.roast.timezoneOffset }));
  // the three facts of the home page, their sentences as in its modal: «{hour}» the roast hour, «{roast}» the live line
  // about the next roast (scripts/roast.js); the delivery fact names the free-delivery sum (data/site.json shop)
  const say = (t, f, last) => t === "{roast}"
    ? `<p class="tile__note" data-roast="${data}"><span data-roast-in>Ближайшая обжарка — по будням в ${site.roast.hour}:00.</span></p>`
    : `<p class="tile__text">${esc(t.replace("{hour}", site.roast.hour))}${f.free && last ? ` От ${rub(site.shop.free)}.` : ""}</p>`;
  const items = site.facts.map((f) => ({ icon: f.icon, title: f.title, level: 2, html: f.more.map((t, i) => say(t, f, i === f.more.length - 1)).join("") }));
  const body = `<section class="section section--first" data-ground="paper" aria-labelledby="delivery-title">
  <div class="col">
    ${pageHead({ title: "Доставка и оплата", id: "delivery-title" })}
    ${tiles(items, { cols: "3", cls: "tiles--icons tiles--facts" })}
    <p class="golink-row"><a class="golink" href="${href(ctx, "catalog/")}">Перейти в каталог${icon("arrow-right")}</a></p>
  </div>
</section>`;
  return page(ctx, { title: "Доставка и оплата — QQ Coffee", description: "Обжариваем каждый будний день, принимаем оплату на сайте и при получении, доставляем СДЭК по Москве и России.", main: "delivery-page", body });
}

// ── the privacy policy ───────────────────────────────────────────────────────────────────────────────────────────
export function privacy(ctx) {
  const p = read("data/privacy.json");
  const block = (b) => typeof b === "string" ? `<p>${esc(b)}</p>` : `<ul>${b.list.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`;
  const s = p.summary;
  const body = `<section class="section section--first" data-ground="paper" aria-labelledby="privacy-title">
  <div class="col"><div class="narrow">
    ${pageHead({ title: p.title, id: "privacy-title", sub: `<p class="phead__sub">${esc(p.edition)}</p>` })}
    <aside class="note" data-tone="cloud" aria-labelledby="summary-title">
      <h2 class="note__title" id="summary-title">${esc(s.title)}</h2>
      ${s.items.map((it) => `<div class="note__item">
        <h3>${esc(it.title)}</h3>
        ${it.text ? `<p>${esc(it.text)}</p>` : ""}${it.list ? `<ol>${it.list.map((x) => `<li>${esc(x)}</li>`).join("")}</ol>` : ""}
      </div>`).join("\n      ")}
      ${s.note ? `<p class="note__foot">${esc(s.note)}</p>` : ""}
    </aside>
    <div class="prose">
      ${p.sections.map((sec) => `<h2>${esc(sec.title)}</h2>\n      ${sec.blocks.map(block).join("\n      ")}`).join("\n      ")}
    </div>
  </div></div>
</section>`;
  return page(ctx, { title: "Политика конфиденциальности — QQ Coffee", description: "Как QQ Coffee обрабатывает персональные данные посетителей сайта.", main: "privacy-page", body });
}

// ── about the company ────────────────────────────────────────────────────────────────────────────────────────────
export function about(ctx) {
  const a = read("data/about.json");
  const hero = `<section class="ahero" data-ground="black" aria-labelledby="about-title">
  ${heroVideo("ahero__bg")}
  <div class="col"><h1 class="ahero__title" id="about-title">${esc(a.title)}</h1></div>
</section>
<section class="letter-wrap" data-ground="paper" aria-label="Письмо основателя">
  <div class="col"><article class="letter" data-tone="cloud">
    ${a.letter.map((p) => `<p>${esc(p)}</p>`).join("\n    ")}
    <p class="letter__sign">${picture(a.signature.image, a.signature.name, { sizes: "12rem", cls: "letter__signature" })}</p>
  </article></div>
</section>`;
  const team = `<section class="section" data-ground="paper" aria-labelledby="team-title">
  <div class="col">
    ${head({ title: a.team.title, id: "team-title" })}
    <ul class="team">${a.team.people.map((m) => `<li class="person">
      ${picture(m.image, `${m.name}, ${m.role.toLowerCase()}`, { sizes: "(min-width: 64em) 25vw, (min-width: 22rem) 50vw, 100vw", cls: "person__photo" })}
      <h3 class="person__name">${esc(m.name)}</h3>
      <p class="person__role">${esc(m.role)}</p>
    </li>`).join("\n    ")}</ul>
  </div>
</section>`;
  const approach = imageBlock(ctx, ctx.site.approach.find((b) => b.id === "approach"));
  const insta = `<section class="section" data-ground="paper" aria-labelledby="insta-title">
  <div class="col">
    ${head({ title: a.instagram.title, id: "insta-title" })}
    <ul class="strip" data-slider="insta" tabindex="0">${a.instagram.posts.map(([img, alt]) => `<li class="strip__item">${picture(img, alt, { sizes: "(min-width: 64em) 20vw, 60vw", cls: "strip__photo" })}</li>`).join("")}</ul>
  </div>
</section>`;
  return page(ctx, {
    title: "О компании — QQ Coffee", description: a.letter[0], ground: "black", main: "about-page",
    body: [hero, team, approach, insta, contactsSection(ctx)].join("\n")
  });
}
