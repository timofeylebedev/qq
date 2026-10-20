// The shop: the bag, the favourites, the checkout in three steps (sign-in, your details, delivery). The bag and the
// favourites live in the visitor's browser (localStorage, scripts/buy.js); these pages are written with every coffee
// the bag may hold, and scripts/cart.js and scripts/favs.js show the visitor's own. There is no order behind the
// checkout yet (design/decisions.json "no-shop-yet").
import { page, head } from "./layout.mjs";
import { card } from "./components.mjs";
import { pageHead, field, check, radio, panel, rows, coffeeMedia } from "./blocks.mjs";
import { esc, icon, href, rub } from "./util.mjs";
import { account } from "./account-data.mjs";

const roastData = (site) => esc(JSON.stringify({ days: site.roast.days, hour: site.roast.hour, tz: site.roast.timezoneOffset }));

// what the scripts need to know about every coffee: its name, page, weights and prices, grinds and roasts
function catalogData(ctx) {
  const { products, site } = ctx;
  const data = products.map((p) => ({
    slug: p.slug, name: p.name, href: href(ctx, `coffee/${p.slug}/`), line: p.line,
    weights: p.weights.map((w) => [w.label, w.price]), grind: p.grind, roasts: p.roasts.map((r) => [r.use, r.level || r.use]),
    out: site.shop.unavailable.includes(p.slug)
  }));
  return `<script type="application/json" data-catalog>${JSON.stringify(data).replace(/</g, "\\u003c")}</script>`;
}

// ── the bag ──────────────────────────────────────────────────────────────────────────────────────────────────────
export function cart(ctx) {
  const { site, products } = ctx;
  const acc = account(products);
  const courier = site.shop.delivery.find((d) => d.id === "courier");
  const bySlug = new Map(products.map((p) => [p.slug, p]));

  // one picture per coffee, cloned by scripts/cart.js into each line of the bag (so the 3D packs are there when the page starts)
  const media = products.map((p) => `<template data-media="${p.slug}">${coffeeMedia(ctx, p, { sizes: "(min-width: 64em) 30vw, (min-width: 48em) 50vw, 100vw" })}</template>`).join("");

  const item = `<template data-cart-item><article class="bitem" data-bag-item>
    <div class="bitem__media" data-media-slot>
      <div class="bitem__top">
        <label class="bitem__pick"><input class="box" type="checkbox" data-pick checked><span class="sr" data-pick-label>В заказ</span></label>
        <span class="bitem__tools">
          <button class="fav" type="button" aria-pressed="false" aria-label="В избранное" data-fav>${icon("heart", 'class="i-off"')}${icon("heart-fill", 'class="i-on"')}</button>
          <button class="bitem__remove" type="button" aria-label="Убрать из корзины" data-remove>${icon("close-round")}</button>
        </span>
      </div>
      <div class="bitem__row">
        <div class="stepper" role="group" aria-label="Количество">
          <button type="button" data-step="-1" aria-label="Меньше">${icon("minus-round")}</button>
          <output data-qty>1</output>
          <button type="button" data-step="1" aria-label="Больше">${icon("plus-round")}</button>
        </div>
        <output class="bitem__price" data-sum></output>
      </div>
    </div>
    <h3 class="bitem__name"><a data-name>Кофе</a></h3>
    <div class="opts">
      <label class="opt"><span class="sr">Вес</span><select data-opt="weight"></select></label>
      <label class="opt"><span class="sr">Помол</span><select data-opt="grind"></select></label>
      <label class="opt"><span class="sr">Обжарка</span><select data-opt="roast"></select></label>
    </div>
  </article></template>
  <template data-cart-gone><article class="gone" data-bag-item>
    <div class="gone__media" data-media-slot></div>
    <div class="gone__info">
      <div class="gone__head"><h3 class="gone__name"><a data-name>Кофе</a></h3><button class="bitem__remove" type="button" aria-label="Убрать из корзины" data-remove>${icon("close-round")}</button></div>
      <a class="gone__similar" data-similar>Выбрать похожие${icon("arrow-right")}</a>
    </div>
  </article></template>`;

  const free = site.shop.free;
  const summary = panel([
    { title: `Доставка ${courier.title.toLowerCase()}`, html: `<a class="panel__field" href="${href(ctx, "checkout/delivery/")}">
        <span><span class="panel__value">${esc(acc.addresses.find((x) => x.type === courier.title)?.address || acc.addresses[0].address)}</span>
        <span class="panel__hint">${rub(courier.price)} • ${esc(courier.days)}</span></span>${icon("edit")}<span class="sr">Изменить адрес</span></a>
      <div class="freebar" data-free="${free}">
        <div class="freebar__text"><span data-free-text>Бесплатно от ${rub(free)}</span><span class="panel__hint" data-roast="${roastData(site)}"><span data-ship-date>Передадим в доставку на следующий рабочий день после обжарки</span></span></div>
        <div class="freebar__track" aria-hidden="true"><span class="freebar__fill" data-free-fill></span></div>
      </div>` },
    { title: "Оплата", html: `<fieldset class="seg"><legend class="sr">Когда оплатить</legend>
        <label><input type="radio" name="pay" value="now" checked><span>Сразу</span></label>
        <label><input type="radio" name="pay" value="later"><span>При получении</span></label>
      </fieldset>
      <label class="choice choice--check panel__beans"><input class="box" type="checkbox" name="beans" data-use-beans data-balance="${acc.beans.balance}"><span>Списать зернышки</span><span class="choice__aside">Доступно ${acc.beans.balance}</span></label>` },
    { html: rows([
        ["Товары", rub(0), " data-goods"],
        ["Доставка", rub(courier.price), ` data-ship data-price="${courier.price}"`],
        ["Зернышки", "−0 ₽", " data-beans-row"]
      ], "prows--lines") + `
      <div class="panel__total"><span>Итого</span><output class="panel__sum" data-total>${rub(0)}</output></div>
      <p class="panel__earn"><span>Начислим <span data-earn>0</span></span>${icon("bean")}<span class="sr">зернышек</span></p>` },
    { cls: "panel__part--actions", html: `<a class="btn btn--light panel__go" href="${href(ctx, "checkout/")}" data-checkout>Заказать</a>
      <a class="panel__gift" href="${href(ctx, "checkout/")}#gift" data-checkout>Заказать в подарок</a>` }
  ], { label: "Ваш заказ", attrs: ` data-cart-summary data-earn-rate="${acc.beans.earn}"` });

  const like = site.recommended.slugs.map((s) => bySlug.get(s)).filter(Boolean).slice(0, 4);
  const body = `<section class="section section--first shop" data-ground="paper" aria-labelledby="cart-title">
  <div class="col"><div class="shop__grid">
    <div class="shop__main">
      ${pageHead({ title: "Корзина", id: "cart-title", countAttr: " data-cart-count", line: true, sub: `<div class="bagbar">
        <label class="choice choice--check"><input class="box" type="checkbox" data-cart-all checked><span>Выбрать все</span></label>
        <button class="iconlink" type="button" data-cart-clear>${icon("close-round")}<span>Очистить</span></button>
        <p class="bagbar__roast" data-roast="${roastData(site)}">${icon("roast")}<span data-roast-hours>Обжариваем каждый будний день</span></p>
      </div>` })}
      <h2 class="sr">В заказе</h2>
      <div class="grid grid--bag" data-cart-list></div>
      <section class="part" data-cart-later hidden aria-labelledby="later-title"><h2 class="part__title" id="later-title">Отложенные</h2><div class="grid grid--bag" data-cart-later-list></div></section>
      <section class="part" data-cart-gone-part hidden aria-labelledby="gone-title"><h2 class="part__title" id="gone-title">Нет в наличии</h2><div class="gones" data-cart-gone-list></div></section>
      <div class="empty" data-cart-empty hidden>
        <p class="empty__title">В корзине пока пусто</p>
        <p>Выберите кофе в каталоге: мы обжарим его в ближайший будний день.</p>
        <a class="btn" href="${href(ctx, "catalog/")}">В каталог</a>
      </div>
    </div>
    ${summary}
  </div></div>
</section>
<section class="section similar" data-ground="paper" aria-labelledby="like-title">
  <div class="col">
    ${head({ title: "Вам может понравиться", id: "like-title", center: true })}
    <div class="grid grid--wide">
      ${like.map((q) => card({ ...ctx, page: "like" }, q, { size: "half" })).join("\n      ")}
    </div>
  </div>
</section>
${item}${media}${catalogData(ctx)}`;
  return page(ctx, { title: "Корзина — QQ Coffee", description: "Ваша корзина QQ Coffee.", main: "cart-page", body });
}

// ── the favourites ───────────────────────────────────────────────────────────────────────────────────────────────
// Every coffee's card is on the page, hidden; scripts/favs.js shows the visitor's favourites in the order chosen.
export function favourites(ctx) {
  const { site, products } = ctx;
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const rec = site.recommended.slugs.map((s) => bySlug.get(s)).filter(Boolean).slice(0, 3);
  const body = `<section class="section section--first favs" data-ground="paper" aria-labelledby="fav-title">
  <div class="col">
    ${pageHead({ title: "Избранное", id: "fav-title", countAttr: " data-fav-count", line: true, sub: `<div class="bagbar" data-fav-bar>
        <label class="sortby">${icon("sort")}<span class="sr">Порядок</span><select data-fav-sort>
          <option value="date">По дате добавления</option><option value="cheap">Сначала дешевле</option><option value="expensive">Сначала дороже</option><option value="name">По названию</option>
        </select></label>
        <button class="iconlink bagbar__end" type="button" data-fav-clear>${icon("close-round")}<span>Очистить</span></button>
      </div>` })}
    <div class="grid grid--thirds" data-fav-grid>
      ${products.map((p) => card({ ...ctx, page: "fav" }, p, { size: "third", heading: 2 }).replace("<article ", "<article data-out ")).join("\n      ")}
    </div>
    <div class="empty" data-fav-empty hidden>
      <p class="empty__title">В избранном пока пусто</p>
      <p>Отмечайте сердцем кофе, который хотите попробовать, — он соберётся здесь.</p>
      <a class="btn" href="${href(ctx, "catalog/")}">В каталог</a>
    </div>
  </div>
</section>
<section class="section section--after-line" data-ground="paper" aria-labelledby="rec-title">
  <div class="col">
    ${head({ title: site.recommended.title, id: "rec-title", center: true })}
    <div class="grid grid--thirds">
      ${rec.map((q) => card({ ...ctx, page: "rec" }, q, { size: "third" })).join("\n      ")}
    </div>
  </div>
</section>
${catalogData(ctx)}`;
  return page(ctx, { title: "Избранное — QQ Coffee", description: "Кофе, который вы отметили сердцем.", main: "favs-page", body });
}

// ── the checkout: three steps on one narrow form each ────────────────────────────────────────────────────────────
const stepPage = (ctx, { title, id, form, description }) => page(ctx, {
  title: `${title} — QQ Coffee`, description, main: "checkout-page",
  body: `<section class="section section--first checkout" data-ground="paper" aria-labelledby="${id}">
  <div class="col">
    ${pageHead({ title, id, line: true })}
    ${form}
  </div>
</section>`
});

export function checkoutSignIn(ctx) {
  const form = `<form class="signin" data-checkout-step="signin" data-next="${href(ctx, "checkout/details/")}" action="#" novalidate>
    <div class="field field--big" data-tone="cloud">
      <label class="sr" for="signin-id" data-signin-label>Телефон</label>
      <input id="signin-id" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+7 123 456 78 90" required data-signin-input>
      <button type="submit" aria-label="Продолжить">${icon("arrow-right")}</button>
    </div>
    <button class="signin__switch" type="button" data-signin-switch data-other="Вход по телефону">Вход по Email</button>
  </form>`;
  return stepPage(ctx, { title: "Авторизация", id: "signin-title", form, description: "Вход по телефону или почте, чтобы оформить заказ." });
}

export function checkoutDetails(ctx) {
  const self = [
    { name: "first", label: "Имя", hint: "СДЭК спросит при выдаче товара", autocomplete: "given-name" },
    { name: "last", label: "Фамилия", hint: "СДЭК спросит при выдаче товара", autocomplete: "family-name" },
    { name: "phone", label: "Телефон", hint: "Для обновлений о статусе доставки", type: "tel", autocomplete: "tel" },
    { name: "email", label: "Email", hint: "Чтобы получить информацию о заказе", type: "email", autocomplete: "email" }
  ];
  // for a gift the same cells ask about the recipient (data-gift-label / -hint), the email stays the buyer's
  const gift = { first: ["Имя получателя", "СДЭК спросит при выдаче товара"], last: ["Фамилия получателя", "СДЭК спросит при выдаче товара"], phone: ["Телефон получателя", "Курьер позвонит получателю"], email: ["Ваш email", "Пришлём информацию о заказе вам"] };
  const form = `<form class="form" data-tone="cloud" data-checkout-step="details" data-next="${href(ctx, "checkout/delivery/")}" action="#">
    <div class="form__head">
      <div class="subtabs subtabs--form" role="radiogroup" aria-label="Кому заказ">
        <label class="subtabs__tab"><input class="sr" type="radio" name="for" value="self" checked data-for><span>Себе</span></label>
        <label class="subtabs__tab"><input class="sr" type="radio" name="for" value="gift" data-for><span>В подарок</span></label>
      </div>
    </div>
    ${self.map((f) => field({ ...f, id: `co-${f.name}`, required: true }).replace('<div class="fcell">', `<div class="fcell" data-gift-label="${esc(gift[f.name][0])}" data-gift-hint="${esc(gift[f.name][1])}" data-self-label="${esc(f.label)}" data-self-hint="${esc(f.hint)}">`)).join("\n    ")}
    <div class="fcell">${check("news", "Получать письма о скидках и новинках")}</div>
    <button class="btn form__submit" type="submit">Продолжить</button>
  </form>`;
  return stepPage(ctx, { title: "Ваши данные", id: "details-title", form, description: "Кому доставить заказ." });
}

export function checkoutDelivery(ctx) {
  const { site } = ctx;
  const form = `<form class="form" data-tone="cloud" data-checkout-step="delivery" action="#">
    <div class="form__head"><h2 class="form__title">Доставка</h2></div>
    ${field({ name: "city", label: "Город", value: site.shop.city, autocomplete: "address-level2", id: "co-city" })}
    <fieldset class="fcell">
      <legend class="fcell__label">Доставка СДЭК</legend>
      ${site.shop.delivery.map((d, i) => radio("ship", d.id, d.title, `${rub(d.price)} • ${d.days}`, { checked: i === 0 })).join("\n      ")}
    </fieldset>
    <button class="btn form__submit" type="submit">Продолжить</button>
  </form>`;
  return stepPage(ctx, { title: "Оформление заказа", id: "delivery-title", form, description: "Доставка СДЭК курьером или в пункт выдачи." });
}
