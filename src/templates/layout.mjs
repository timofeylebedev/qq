// The frame of every page: <head>, the navbar, the footer, and the one stylesheet and script of the site.
import { esc, icon, href, cls } from "./util.mjs";

export function page(ctx, { title, description, body, navTheme = "light", main = "" }) {
  const { site } = ctx;
  return `<!doctype html>
<html lang="ru" data-root="${ctx.rel || "./"}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="robots" content="noindex">
<meta name="theme-color" content="#ffffff">
<link rel="icon" href="/assets/icons/mark.svg" type="image/svg+xml">
<link rel="stylesheet" href="/styles/main.css">
<script type="module" src="/scripts/main.js"></script>
</head>
<body>
<a class="skip" href="#main">К содержанию</a>
${navbar(ctx, navTheme)}
<main id="main"${main ? ` class="${main}"` : ""}>
${body}
</main>
${footer(ctx)}
<div class="toast" role="status" aria-live="polite" data-toast></div>
</body>
</html>
`;
}

// The navbar: the logo, the sections in three groups, the tools (search, favourites, bag, profile). Under 64em the
// sections go into a menu behind the burger (the menu is not designed yet: a plain list, see design/decisions.json).
// navTheme "dark" is the navbar over the black hero; it turns light once the hero has scrolled away (scripts/nav.js).
function navbar(ctx, navTheme) {
  const groups = ctx.site.nav.groups;
  const links = groups.map((g) => `<li class="nav__group"><ul>${g.map(([t, to]) => `<li><a href="${href(ctx, to)}">${esc(t)}</a></li>`).join("")}</ul></li>`).join("");
  return `<header class="nav" data-nav data-theme="${navTheme}">
  <div class="nav__bar">
    <a class="nav__logo" href="${ctx.rel || "./"}" aria-label="QQ Coffee, на главную">${icon("logo")}</a>
    <nav class="nav__links" aria-label="Разделы"><ul>${links}</ul></nav>
    <div class="nav__tools">
      <a class="nav__tool nav__tool--wide" href="#" aria-label="Поиск">${icon("search")}</a>
      <a class="nav__tool" href="#" aria-label="Избранное">${icon("heart")}<span class="nav__count" data-fav-count hidden></span></a>
      <a class="nav__tool" href="#" aria-label="Корзина" data-bag>${icon("bag")}<span class="nav__count" data-bag-count hidden></span></a>
      <button class="nav__tool nav__burger" type="button" aria-expanded="false" aria-controls="menu" aria-label="Меню" data-menu-button>${icon("menu")}</button>
    </div>
  </div>
  <div class="menu" id="menu" data-menu hidden>
    <nav aria-label="Меню"><ul>${groups.flat().map(([t, to]) => `<li><a href="${href(ctx, to)}">${esc(t)}</a></li>`).join("")}</ul></nav>
  </div>
</header>`;
}

// The footer: the flame mark with the copyright on the left, the newsletter and four groups of links on the right.
// The mark is static for now: the animated logo goes into .footer__mark when it arrives.
function footer(ctx) {
  const f = ctx.site.footer;
  const groups = f.groups.map(([title, links]) => `<div class="footer__group">
      <h2 class="footer__title">${esc(title)}</h2>
      <ul>${links.map(([t, to]) => `<li><a href="${href(ctx, to)}">${esc(t)}</a></li>`).join("")}</ul>
    </div>`).join("\n    ");
  return `<footer class="footer" id="contacts">
 <div class="col"><div class="footer__inner">
  <div class="footer__brand">
    <div class="footer__mark" data-logo-slot>${icon("mark", 'role="img" aria-label="QQ Coffee"')}</div>
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
export function head({ title, id, level = 2, aside = "", center = false, lead = "" }) {
  return `<div class="${cls("head", center && "head--center")}">
    <h${level} class="head__title"${id ? ` id="${id}"` : ""}>${esc(title)}</h${level}>${lead ? `\n    <p class="head__lead">${esc(lead)}</p>` : ""}${aside ? `\n    <div class="head__aside">${aside}</div>` : ""}
  </div>`;
}

// Prev / next arrows: two square cells divided by a hairline (Figma «Product details block»)
export const arrows = (label, target) => `<div class="arrows" role="group" aria-label="${esc(label)}">
      <button class="arrows__btn" type="button" data-prev="${target}" aria-label="Назад">${icon("arrow-left")}</button>
      <button class="arrows__btn" type="button" data-next="${target}" aria-label="Вперёд">${icon("arrow-right")}</button>
    </div>`;
