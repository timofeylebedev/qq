// The frame of every page: <head>, the navbar, the footer, and the one stylesheet and script of the site.
import { esc, icon, href, cls } from "./util.mjs";

export function page(ctx, { title, description, body, ground = "paper", main = "" }) {
  const { site } = ctx;
  return `<!doctype html>
<html lang="ru" data-root="${ctx.rel || "./"}" data-over="${ground}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="robots" content="noindex">
<meta name="theme-color" content="#ffffff">
<link rel="icon" href="/assets/icons/mark.svg" type="image/svg+xml">
<link rel="stylesheet" href="/styles/main.css">
<link rel="expect" href="${ctx.page === "product" ? "#product-title" : "#contacts"}" blocking="render">
<script vite-ignore src="${ctx.rel || ""}vt.js"></script>
<script type="module" src="/scripts/main.js"></script>
</head>
<body>
<a class="skip" href="#main">К содержанию</a>
${navbar(ctx, ground)}
<main id="main"${main ? ` class="${main}"` : ""}>
${body}
</main>
${footer(ctx)}
<div class="toast" role="status" aria-live="polite" data-toast></div>
</body>
</html>
`;
}

// The navbar: the logo, the sections, the tools (search, favourites, bag, profile), in four steps (media.css):
//   wide        every section, in three groups («Кофе, Каскара, Дрипы, Сеты · Кофейням, Офисам · Журнал, Контакты»)
//   --links     four short sections («Каталог, Бизнесу, Журнал, Контакты»)
//   below       the burger: the menu lists the groups (not designed yet: a plain list, design/decisions.json)
//   --phone     the bag, favourites and profile leave the bar for the tab bar at the foot of the screen
// An item links only to a page that exists (data/site.json nav): the others are labels without a link (<a> without
// href) until their page is made. The navbar takes the colour of the section under it (data-ground, scripts/nav.js).
const navItem = (ctx, [t, to], c = "") => to
  ? `<a${c ? ` class="${c}"` : ""} href="${href(ctx, to)}"${ctx.here === to ? ' aria-current="page"' : ""}>${esc(t)}</a>`
  : `<a${c ? ` class="${c}"` : ""}>${esc(t)}</a>`;

function navbar(ctx, ground) {
  const { groups, short, tabs } = ctx.site.nav;
  const full = groups.map((g) => `<li class="nav__group"><ul>${g.map((x) => `<li>${navItem(ctx, x)}</li>`).join("")}</ul></li>`).join("");
  const tool = (name, label, extra = "", cls = "", inner = "") => `<a class="nav__tool${cls}"${extra}>${icon(name)}<span class="sr">${label}</span>${inner}</a>`;
  return `<header class="nav" data-nav data-ground="${ground}">
  <div class="nav__bar"><div class="nav__in">
    <a class="nav__logo" href="${ctx.rel || "./"}" aria-label="QQ Coffee, на главную">${icon("logo")}</a>
    <nav class="nav__links nav__links--full" aria-label="Разделы"><ul>${full}</ul></nav>
    <nav class="nav__links nav__links--short" aria-label="Разделы"><ul>${short.map((x) => `<li>${navItem(ctx, x)}</li>`).join("")}</ul></nav>
    <div class="nav__tools">
      ${tool("search", "Поиск")}
      ${tool("heart", "Избранное", "", " nav__tool--tab")}
      ${tool("bag", "Корзина", " data-bag", " nav__tool--tab", '<span class="nav__count" data-bag-count hidden></span>')}
      ${tool("profile", "Профиль", "", " nav__tool--tab")}
      <button class="nav__tool nav__burger" type="button" aria-expanded="false" aria-controls="menu" aria-label="Меню" data-menu-button>${icon("menu")}</button>
    </div>
  </div></div>
  <div class="menu" id="menu" data-menu hidden>
    <nav aria-label="Меню"><ul>${groups.flat().map((x) => `<li>${navItem(ctx, x)}</li>`).join("")}</ul></nav>
  </div>
</header>
<nav class="tabbar" data-tabbar data-ground="paper" aria-label="Покупки"><ul>${tabs.map(([t, to, ic]) => `<li>${to
    ? `<a class="tabbar__item" href="${href(ctx, to)}"${ctx.here === to ? ' aria-current="page"' : ""}>`
    : `<a class="tabbar__item"${ic === "bag" ? " data-bag" : ""}>`}${icon(ic)}<span>${esc(t)}</span>${ic === "bag" ? '<span class="nav__count" data-bag-count hidden></span>' : ""}</a></li>`).join("")}</ul></nav>`;
}

// The footer: the animated flame (the logo from Tim, round 3) with the copyright on the left, the newsletter and four
// groups of links on the right. From L the two halves are squares. The flame is a file (SMIL, about 27 KB gzipped,
// loaded lazily); with «reduce motion» its first frame stands still.
function footer(ctx) {
  const f = ctx.site.footer;
  const groups = f.groups.map(([title, links]) => `<div class="footer__group">
      <h2 class="footer__title">${esc(title)}</h2>
      <ul>${links.map(([t, to]) => `<li><a href="${href(ctx, to)}">${esc(t)}</a></li>`).join("")}</ul>
    </div>`).join("\n    ");
  return `<footer class="footer" id="contacts" data-ground="cloud">
 <div class="col"><div class="footer__inner">
  <div class="footer__brand">
    <picture class="footer__mark"><source media="(prefers-reduced-motion: reduce)" srcset="/assets/img/logo-flame-still.svg"><img src="/assets/img/logo-flame.svg" alt="QQ Coffee" width="218" height="332" loading="lazy" decoding="async"></picture>
    <div class="footer__legal">
      <p>${esc(f.copyright)}</p>
      <a href="${href(ctx, f.privacy[1])}">${esc(f.privacy[0])}</a>
    </div>
  </div>
  <div class="footer__links">
    <form class="footer__news" data-newsletter>
      <label class="footer__news-label" for="news-email">${esc(f.newsletter)}</label>
      <div class="field">
        <input id="news-email" type="email" name="email" placeholder="Ваш Email" autocomplete="email" required>
        <button type="submit" aria-label="Подписаться">${icon("arrow-right")}</button>
      </div>
    </form>
    ${groups}
  </div>
 </div></div>
</footer>`;
}

// A section heading with its controls on the right (arrows, a counter); the same on every page.
// `middle` stands in the middle of the head (the pager of new arrivals): from M between the title and the aside,
// below M on its own row under them.
export function head({ title, id, level = 2, aside = "", center = false, lead = "", middle = "" }) {
  return `<div class="${cls("head", center && "head--center", middle && "head--middle")}">
    <h${level} class="head__title"${id ? ` id="${id}"` : ""}>${esc(title)}</h${level}>${lead ? `\n    <p class="head__lead">${esc(lead)}</p>` : ""}${middle ? `\n    <div class="head__middle">${middle}</div>` : ""}${aside ? `\n    <div class="head__aside">${aside}</div>` : ""}
  </div>`;
}

// Prev / next arrows: two square cells divided by a hairline (Figma «Product details block»)
export const arrows = (label, target) => `<div class="arrows" role="group" aria-label="${esc(label)}">
      <button class="arrows__btn" type="button" data-prev="${target}" aria-label="Назад">${icon("arrow-left")}</button>
      <button class="arrows__btn" type="button" data-next="${target}" aria-label="Вперёд">${icon("arrow-right")}</button>
    </div>`;
