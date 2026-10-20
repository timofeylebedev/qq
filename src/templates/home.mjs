// The home page: hero with the roast countdown, new arrivals, recommended, two image blocks, business, facts.
import { page, head, arrows } from "./layout.mjs";
import { card, pills, tasteChart, cardText } from "./components.mjs";
import { esc, icon, href, picture, cls } from "./util.mjs";
import { digitsSVG } from "../../build/digits.mjs";

export function render(ctx) {
  const { site, products } = ctx;
  const bySlug = new Map(products.map((p) => [p.slug, p]));

  // new arrivals: tagged «Новинка» first, then the newest
  const fresh = [...products].sort((a, b) => (b.tags.includes("Новинка") - a.tags.includes("Новинка")) || String(b.created).localeCompare(String(a.created)))
    .slice(0, site.featured.count);
  const recommended = site.recommended.slugs.map((s) => bySlug.get(s)).filter(Boolean);

  const body = [hero(ctx), featured(ctx, fresh), recs(ctx, recommended), ...site.approach.map((b) => imageBlock(ctx, b)), business(ctx), facts(ctx)].join("\n");
  return page(ctx, {
    title: "QQ Coffee — кофе свежей обжарки",
    description: "QQ Coffee — обжарщик спешелти-кофе: свежая обжарка каждый будний день, доставка по Москве и России.",
    ground: "black", main: "home", body
  });
}

// The hero: a photo, the title, the roast countdown and three links. The countdown and the links stand in a dock
// at the foot of the photo; their three parts each (the day and the time, the digits, the caption; «Каталог»,
// «Бизнесу», «Контакты») line up: in three shared rows from L (the title beside them) and below M, in three shared
// columns between M and L. From L the title is the first of three cells in a row; below L it stands at the top of
// the section, two words a line at most. The digits are QQ Digits drawn as SVG segments (build/digits.mjs), all
// unlit until the script lights them (scripts/digits.js).
function hero(ctx) {
  const { hero, roast } = ctx.site;
  const data = esc(JSON.stringify({ days: roast.days, hour: roast.hour, tz: roast.timezoneOffset }));
  return `<section class="hero" data-hero data-ground="black" aria-labelledby="hero-title">
  ${picture("hero-roast", "", { sizes: "100vw", cls: "hero__bg", eager: true, decorative: true })}
  <div class="hero__info">
    <div class="col"><div class="hero__grid">
      <h1 class="hero__title" id="hero-title" data-hero-title>${esc(hero.title)}</h1>
      <div class="hero__dock">
        <div class="hero__roast" data-roast="${data}">
          <p class="hero__now" data-hero-part><span data-roast-day>&nbsp;</span><span class="hero__clock" data-roast-clock>&nbsp;</span>
            <button class="hero__info-btn" type="button" aria-expanded="false" aria-controls="roast-note" aria-label="Как мы обжариваем" data-toggle>${icon("info")}</button></p>
          <p class="hero__count" data-hero-part><span class="sr"><span data-roast-say>Следующая обжарка через </span><span data-roast-count>00:00:00</span></span>${digitsSVG("00:00:00", { lit: false })}<span class="hero__date" data-roast-date hidden></span></p>
          <p class="hero__caption" aria-hidden="true" data-hero-part>До ближайшей обжарки</p>
          <p class="hero__note" id="roast-note" hidden><span>Обжариваем по будням в ${roast.hour}:00 по Москве. Заказ, оформленный до обжарки, уходит в неё.</span></p>
        </div>
        <ul class="hero__links">${hero.links.map(([t, to, ic]) => `<li data-hero-part><a class="hero__link" href="${href(ctx, to)}"><span>${esc(t)}</span>${icon(ic)}</a></li>`).join("")}</ul>
      </div>
    </div></div>
  </div>
</section>`;
}

// New arrivals: one coffee at a time, a text square and a photo square. Every slide shows a photo: the coffee's own
// (site.json photos), else one of the section's stand-ins in turn (featured.photos, a placeholder). The whole slide
// is the link to the coffee. The pager of numbers stands in the middle of the head.
function featured(ctx, list) {
  const pager = `<div class="pager" role="group" aria-label="Новинки по одной">${list.map((p, i) => `<button class="pager__dot" type="button" data-go="${i}" aria-label="${i + 1}: ${esc(p.name)}"${i === 0 ? ' aria-current="true"' : ""}>${i + 1}</button>`).join("")}</div>`;
  const spare = ctx.site.featured.photos || [];
  let k = 0;
  const slides = list.map((p, i) => {
    const photo = ctx.site.photos.bySlug[p.slug] || spare[k++ % spare.length];
    return `<article class="featured__slide" data-slide aria-roledescription="слайд" aria-label="${i + 1} из ${list.length}">
      <div class="featured__text">
        <div class="featured__intro">
          <h3 class="featured__name"><a href="${href(ctx, `coffee/${p.slug}/`)}">${esc(p.name)}</a></h3>
          <p class="featured__about">${esc(p.about[0] || cardText(p))}</p>
        </div>
        <div class="featured__facts">
          ${tasteChart(p.taste)}
          ${pills(p.descriptors)}
        </div>
      </div>
      <div class="featured__media">${picture(photo[0], photo[1], { sizes: "(min-width: 64em) 50vw, 100vw", decorative: true })}<p class="featured__caption">${esc(p.short)}</p></div>
    </article>`;
  }).join("\n    ");
  return `<section class="section section--first featured" data-ground="paper" aria-labelledby="featured-title">
  <div class="col">
    ${head({ title: ctx.site.featured.title, id: "featured-title", middle: pager, aside: arrows("Новинки", "featured") })}
    <div class="featured__track" data-slider="featured" tabindex="-1">
    ${slides}
    </div>
  </div>
</section>`;
}

function recs(ctx, list) {
  return `<section class="section section--after-tight" data-ground="paper" aria-labelledby="recs-title">
  <div class="col">
    ${head({ title: ctx.site.recommended.title, id: "recs-title", aside: arrows("Рекомендуем", "recs") })}
    <div class="reel" data-slider="recs" tabindex="-1">
      ${list.map((p) => card(ctx, p)).join("\n      ")}
    </div>
  </div>
</section>`;
}

export function imageBlock(ctx, b) {
  return `<section class="${cls("story", `story--${b.theme}`)}" data-ground="${b.theme === "dark" ? "black" : "paper"}" id="${b.id}" aria-labelledby="${b.id}-title">
  <div class="col"><div class="story__col">
    <div class="story__text">
      <p class="eyebrow">${esc(b.eyebrow)}</p>
      <h2 class="story__title" id="${b.id}-title">${esc(b.title)}</h2>
      <a class="btn-arrow" href="${href(ctx, b.action[1])}"><span class="btn-arrow__icon">${icon("arrow-right")}</span><span class="btn-arrow__label">${esc(b.action[0])}</span></a>
    </div>
    ${picture(b.image[0], b.image[1], { sizes: "(min-width: 48em) 55vw, 100vw", cls: "story__image" })}
  </div></div>
</section>`;
}

function business(ctx) {
  const b = ctx.site.business;
  return `<section class="section business" data-ground="ink" id="business" aria-labelledby="business-title">
  <div class="col">
    ${head({ title: b.title, id: "business-title", center: true, lead: b.lead })}
    <div class="business__cards">
      ${b.cards.map((c) => `<article class="bcard">
        ${picture(c.image[0], c.image[1], { sizes: "(min-width: 48em) 50vw, 100vw", cls: "bcard__image" })}
        <div class="bcard__info">
          <div class="bcard__head">
            <h3 class="bcard__title"><a href="${href(ctx, c.href)}">${esc(c.title)}</a></h3>
            <span class="bcard__go" aria-hidden="true">${icon("arrow-right")}</span>
          </div>
          <p class="bcard__text">${esc(c.text)}</p>
        </div>
      </article>`).join("\n      ")}
    </div>
  </div>
</section>`;
}

// The three info blocks (roasting, payment, delivery). A block is one button: it grows into a modal with more about
// it, and the modal steps to the other two (scripts/facts.js). One <dialog> holds the three, one shown at a time.
// «{hour}» in a text is the roast hour, «{roast}» the live line about the next roast (scripts/roast.js).
function facts(ctx) {
  const { facts: list, roast } = ctx.site;
  const cfg = esc(JSON.stringify({ days: roast.days, hour: roast.hour, tz: roast.timezoneOffset }));
  const say = (t) => t === "{roast}" ? `<p data-roast="${cfg}"><span data-roast-in>Ближайшая обжарка — по будням в ${roast.hour}:00.</span></p>` : `<p>${esc(t.replace("{hour}", roast.hour))}</p>`;
  const n = list.length;
  const panels = list.map((f, i) => {
    const prev = list[(i + n - 1) % n], next = list[(i + 1) % n];
    return `<article class="fmodal__panel" id="fact-${i}" data-fact-panel="${i}" aria-labelledby="fact-${i}-title" data-off inert>
      <div class="fmodal__body">
        <span class="fmodal__icon" data-morph="icon">${icon(f.icon)}</span>
        <h2 class="fmodal__title" id="fact-${i}-title" data-morph="title">${esc(f.title)}</h2>
        <div class="fmodal__text">${f.more.map(say).join("")}</div>
      </div>
      <nav class="fmodal__nav" aria-label="Другие блоки">
        <button class="fmodal__step" type="button" data-fact-go="${(i + n - 1) % n}">${icon("chevron-left")}<span>${esc(prev.short)}</span></button>
        <button class="fmodal__step" type="button" data-fact-go="${(i + 1) % n}"><span>${esc(next.short)}</span>${icon("chevron-right")}</button>
      </nav>
    </article>`;
  }).join("\n    ");
  return `<section class="facts" data-ground="paper" aria-label="Как мы работаем">
  <div class="col"><ul class="facts__list">
    ${list.map((f, i) => `<li class="fact">
      <button class="fact__open" type="button" aria-haspopup="dialog" aria-controls="facts-modal" data-fact="${i}">
        <span class="fact__icon" data-morph="icon">${icon(f.icon)}</span>
        <span class="fact__title" data-morph="title">${esc(f.title)}</span>
        <span class="fact__more" aria-hidden="true" data-morph="plus">${icon("plus")}</span>
      </button>
    </li>`).join("\n    ")}
  </ul></div>
  <dialog class="fmodal" id="facts-modal" data-facts-modal data-ground="paper" aria-labelledby="fact-0-title">
    <div class="fmodal__dim"></div>
    <div class="fmodal__box" tabindex="-1" autofocus>
      <div class="fmodal__ground"></div>
      <button class="fmodal__close" type="button" aria-label="Закрыть" data-fact-close><span data-morph="plus">${icon("plus")}</span></button>
      ${panels}
    </div>
  </dialog>
</section>`;
}
