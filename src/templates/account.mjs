// The account: the profile (activity, the last order, purchases, coffees for you), the orders, one order, the
// purchases, the beans (a dialog over the profile, and its own address), the settings. The visitor is a placeholder
// (data/account.json, design/decisions.json "account-placeholder"); everything shown is worked out from their orders.
import { page, head } from "./layout.mjs";
import { card } from "./components.mjs";
import { pageHead, subtabs, paneltabs, badge, coffeeMedia, panel, rows, dialog, field, check, meta } from "./blocks.mjs";
import { esc, icon, href, cls, rub, read } from "./util.mjs";
import { account, forYou, dateShort, dateTime, monthOf } from "./account-data.mjs";

const TABS = [["Профиль", "account/"], ["Активность", null], ["Заказы", "account/orders/"], ["Покупки", "account/purchases/"], ["Настройки", "account/settings/"]];
const COUNTRIES = read("design/countries.json");

// the head of every account page: the name, three numbers, the tabs
function accountHead(ctx, acc, here) {
  const stats = `<dl class="stats">${acc.stats.map(([n, t]) => `<div><dt>${esc(t)}</dt><dd>${esc(n)}</dd></div>`).join("")}</dl>`;
  return `${pageHead({ title: `${acc.person.first} ${acc.person.last}`, id: "account-title", aside: stats })}
    ${subtabs(ctx, TABS, { label: "Личный кабинет", here })}`;
}
const accountPage = (ctx, { title, here, body, description, extra = "" }) => {
  const acc = account(ctx.products);
  return page(ctx, {
    title: `${title} — QQ Coffee`, description, main: "account-page",
    body: `<section class="section section--first account" data-ground="paper" aria-labelledby="account-title">
  <div class="col">
    ${accountHead(ctx, acc, here)}
    ${body(acc)}
  </div>
</section>${extra ? "\n" + extra(acc) : ""}`
  });
};

// ── an order as a row: the first coffee's picture with the count, the coffees, where it goes, its number, status ────
function orderRow(ctx, o, { level = 3 } = {}) {
  return `<article class="orow" data-tone="cloud">
      <div class="orow__media">${coffeeMedia(ctx, o.items[0].p, { sizes: "12rem" })}${badge(o.count, `${o.count} шт.`)}</div>
      <div class="orow__body">
        <div class="orow__head">
          <h${level} class="orow__title"><a class="orow__link" href="${href(ctx, `account/orders/${o.id}/`)}">${esc(o.names.join(", "))}</a></h${level}>
          <p class="orow__sum">${rub(o.total)}</p>
        </div>
        <p class="orow__line">${esc(o.delivery.type)}: ${esc(o.delivery.address)}</p>
        ${meta([`№ ${o.id}`, dateTime(o.date)])}
        <p class="${cls("status", `status--${o.statusKind}`)}">${esc(o.statusText)}</p>
      </div>
    </article>`;
}

// ── a coffee bought: its picture with the price and how many were bought, a rating, the name and the last choice ───
function purchaseCard(ctx, x) {
  const photo = !!ctx.site.photos.bySlug[x.slug];
  return `<article class="pcard" data-card data-slug="${x.slug}">
      <div class="pcard__media">${coffeeMedia(ctx, x.p, { sizes: "(min-width: 64em) 25vw, 50vw" })}
        <div class="pcard__top"${photo ? ' data-on-photo' : ""}>${x.count > 1 ? badge(x.count, `Куплено ${x.count} раза`) : "<span></span>"}<span class="pcard__price">${rub(x.price)}</span></div>
      </div>
      <div class="rate" role="group" aria-label="Оценка: ${esc(x.p.name)}" data-tone="${photo ? "black" : "cloud"}">
        <button type="button" aria-pressed="false" data-rate="up" data-slug="${x.slug}" aria-label="Понравился">${icon("like", 'class="i-off"')}${icon("like-fill", 'class="i-on"')}</button>
        <button type="button" aria-pressed="false" data-rate="down" data-slug="${x.slug}" aria-label="Не понравился">${icon("dislike", 'class="i-off"')}${icon("dislike-fill", 'class="i-on"')}</button>
      </div>
      <h3 class="pcard__name"><a class="card__link" href="${href(ctx, `coffee/${x.slug}/`)}">${esc(x.p.name)}</a></h3>
      ${meta([x.weight, x.grind, x.roastText])}
    </article>`;
}

// ── the drawings of the activity: a ring, the taste profile, the countries, the descriptors ──────────────────────
function ring(share, size = 200, w = 24) {
  const r = (size - w) / 2, c = 2 * Math.PI * r, s = Math.max(0, Math.min(1, share));
  return `<svg class="ring" viewBox="0 0 ${size} ${size}" aria-hidden="true" focusable="false"><circle class="ring__track" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${w}"/><circle class="ring__fill" cx="${size / 2}" cy="${size / 2}" r="${r}" stroke-width="${w}" stroke-dasharray="${(c * s).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 ${size / 2} ${size / 2})"/></svg>`;
}
function beansDial(acc, { big = false } = {}) {
  const b = acc.beans;
  return `<div class="${cls("dial", big && "dial--big")}">${ring(b.next ? b.next.share : 1, big ? 240 : 200, big ? 24 : 24)}
      <div class="dial__in"><p class="dial__n">${icon("bean")}<span>${b.balance}</span></p><p class="dial__level">${esc(b.level)}</p>${big && b.next ? `<p class="dial__next">${b.next.left} до ${esc(b.next.name)}</p>` : ""}</div>
    </div>`;
}
// the four scales on four axes: density up, acidity right, sweetness down, ferment left (ferment is 0–4, the rest 1–5)
function radar(t) {
  const S = 160, C = S / 2, R = 72;
  const axes = [["density", "Плотность", 0, -1, 5, 1, "top"], ["acidity", "Кислотность", 1, 0, 5, 1, "right"], ["sweetness", "Сладость", 0, 1, 5, 1, "bottom"], ["ferment", "Фермент", -1, 0, 4, 0, "left"]];
  const pt = (k, dx, dy, max, min) => { const v = Math.max(0.12, ((t[k] ?? min) - min + 1) / (max - min + 1)); return [C + dx * R * v, C + dy * R * v]; };
  const poly = axes.map(([k, , dx, dy, max, min]) => pt(k, dx, dy, max, min).map((n) => n.toFixed(1)).join(",")).join(" ");
  const rings = [0.25, 0.5, 0.75, 1].map((f) => `<polygon class="radar__grid" points="${C},${C - R * f} ${C + R * f},${C} ${C},${C + R * f} ${C - R * f},${C}"/>`).join("");
  const say = `Плотность ${t.density.toFixed(1)}, кислотность ${t.acidity.toFixed(1)}, сладость ${t.sweetness.toFixed(1)} из 5, фермент ${t.ferment.toFixed(1)} из 4`.replace(/\./g, ",");
  return `<figure class="radar" aria-label="${say}">
      <svg class="radar__plot" viewBox="0 0 ${S} ${S}" aria-hidden="true" focusable="false">${rings}<path class="radar__axis" d="M${C} ${C - R}V${C + R}M${C - R} ${C}H${C + R}"/><polygon class="radar__shape" points="${poly}"/></svg>
      ${axes.map(([, l, , , , , at]) => `<span class="radar__label radar__label--${at}" aria-hidden="true">${l}</span>`).join("")}
    </figure>`;
}
function countries(acc, products) {
  const all = [...new Set(products.flatMap((p) => p.countries))];
  const got = new Map(acc.countries);
  const order = [...all].sort((a, b) => (got.get(b) || 0) - (got.get(a) || 0));
  return `<ul class="lands">${order.map((c) => {
    const shape = COUNTRIES[c], n = got.get(c) || 0;
    return `<li class="${cls("land", n && "land--got")}">${shape ? `<svg class="land__shape" viewBox="0 0 ${shape.w} ${shape.h}" aria-hidden="true" focusable="false"><path d="${shape.d}"/></svg>` : ""}<span class="${shape ? "sr" : "land__name"}">${esc(c)}${n ? `: ${n}` : ", ещё не пробовали"}</span>${n ? `<span class="badge land__n" aria-hidden="true">${n}</span>` : ""}</li>`;
  }).join("")}</ul>`;
}
function waffle(acc) {
  const { all, tried } = acc.descriptors;
  return `<div class="waffle" role="img" aria-label="Попробовано ${tried} дескрипторов из ${all}">${Array.from({ length: all }, (_, i) => `<span${i < tried ? ' class="on"' : ""}></span>`).join("")}</div>
    <p class="waffle__say">${tried} из ${all}</p>`;
}

// ── the beans: a dialog over the profile (account/beans/ opens with it) ─────────────────────────────────────────────
function beansDialog(ctx, acc, open) {
  const b = acc.beans;
  const max = Math.max(...b.monthly.map((m) => m[1])), top = Math.ceil(max / 5) * 5;
  const bars = `<figure class="bars" aria-label="Начисления по месяцам: ${b.monthly.map(([m, v]) => `${m} ${v}`).join(", ")}">
      <ol class="bars__scale" aria-hidden="true">${[4, 3, 2, 1, 0].map((i) => `<li>${(top / 4) * i}</li>`).join("")}</ol>
      <ol class="bars__cols" aria-hidden="true">${b.monthly.map(([m, v]) => `<li style="--v: ${(v / top).toFixed(3)}"><span class="bars__bar"></span><span class="bars__label">${m}</span></li>`).join("")}</ol>
    </figure>`;
  const history = (list, sign) => {
    const months = [...new Set(list.map((x) => monthOf(x.o.date)))];
    if (!list.length) return `<p class="dialog__empty">Пока ничего.</p>`;
    return months.map((m) => `<h3 class="history__month">${m}</h3>
      <ul class="history">${list.filter((x) => monthOf(x.o.date) === m).map(({ o, amount }) => `<li class="hrow" data-tone="cloud">
        <p class="hrow__head"><a class="hrow__title" href="${href(ctx, `account/orders/${o.id}/`)}">${esc(o.names.join(", "))}</a><span class="hrow__n">${sign}${Math.abs(amount)}</span></p>
        ${meta([`№ ${o.id}`, rub(o.total)])}
      </li>`).join("")}</ul>`).join("");
  };
  const body = `<div class="dialog__body">
    <div class="beans" data-tone="cloud">
      ${beansDial(acc, { big: true })}
      <p class="beans__foot"><span>${esc(b.rate)}</span>${b.next ? `<span>${b.next.left} до ${esc(b.next.name)}</span>` : ""}</p>
    </div>
    <div class="refer" data-tone="cloud">
      <p class="refer__text"><b>${esc(b.referral.text)}</b><br>${esc(b.referral.hint)}</p>
      <button class="btn refer__copy" type="button" data-copy="https://${esc(b.referral.link)}">${icon("copy")}<span>${esc(b.referral.link)}</span></button>
    </div>
    <div class="beans__tabs">${paneltabs([["Начисления", "in"], ["Списания", "out"], ["Условия", "rules"]], { label: "Зернышки", name: "beans" })}</div>
    <div class="beans__panel" id="beans-in" role="tabpanel" aria-labelledby="beans-tab-in">${bars}${history(b.earned, "+")}</div>
    <div class="beans__panel" id="beans-out" role="tabpanel" aria-labelledby="beans-tab-out" hidden>${history(b.spent, "−")}</div>
    <div class="beans__panel" id="beans-rules" role="tabpanel" aria-labelledby="beans-tab-rules" hidden><ul class="rules">${b.rules.map((r) => `<li>${esc(r)}</li>`).join("")}</ul></div>
  </div>`;
  return dialog({ id: "beans", title: "Зернышки", body, wide: true, open, home: open ? href(ctx, "account/") : "", homeTitle: "Профиль — QQ Coffee" });
}

// ── the profile ──────────────────────────────────────────────────────────────────────────────────────────────────
export function profile(ctx, { beans = false } = {}) {
  return accountPage(ctx, {
    title: beans ? "Зернышки" : "Профиль", here: "account/", description: "Личный кабинет: активность, заказы, покупки.",
    body: (acc) => `<section class="part" aria-labelledby="activity-title">
      <h2 class="part__title" id="activity-title">Активность</h2>
      <ul class="tiles tiles--cloud activity">
        <li class="tile"><div class="tile__head"><h3 class="tile__title">Зернышки</h3><a class="tile__more" href="${href(ctx, "account/beans/")}" data-dialog="beans" aria-label="Подробнее о зернышках">${icon("plus-round")}</a></div>${beansDial(acc)}</li>
        <li class="tile"><div class="tile__head"><h3 class="tile__title">Вкусовой профиль</h3></div>${radar(acc.taste)}</li>
        <li class="tile"><div class="tile__head"><h3 class="tile__title">Страны</h3></div>${countries(acc, ctx.products)}</li>
        <li class="tile"><div class="tile__head"><h3 class="tile__title">Дескрипторы</h3></div>${waffle(acc)}</li>
      </ul>
    </section>
    <section class="part" aria-labelledby="orders-title">
      <div class="part__head"><h2 class="part__title" id="orders-title">Заказы</h2><a class="iconlink" href="${href(ctx, "account/orders/")}"><span>Все заказы</span>${icon("arrow-right")}</a></div>
      <div class="orows">${orderRow(ctx, acc.orders[0])}</div>
    </section>
    <section class="part" aria-labelledby="buys-title">
      <div class="part__head"><h2 class="part__title" id="buys-title">Покупки</h2><a class="iconlink" href="${href(ctx, "account/purchases/")}"><span>Все покупки</span>${icon("arrow-right")}</a></div>
      <div class="grid grid--quarters">${acc.purchases.slice(0, 4).map((x) => purchaseCard(ctx, x)).join("\n      ")}</div>
    </section>
    <section class="part" aria-labelledby="foryou-title">
      <h2 class="part__title" id="foryou-title">Подобрали для вас</h2>
      <div class="grid grid--thirds">${forYou(ctx.products, acc).map((q) => card({ ...ctx, page: "foryou" }, q, { size: "third" })).join("\n      ")}</div>
    </section>`,
    extra: (acc) => beansDialog(ctx, acc, beans)
  });
}

// ── the orders, by month ────────────────────────────────────────────────────────────────────────────────────────
export function orders(ctx) {
  return accountPage(ctx, {
    title: "Заказы", here: "account/orders/", description: "Ваши заказы QQ Coffee.",
    body: (acc) => {
      const months = [...new Set(acc.orders.map((o) => monthOf(o.date)))];
      return `<h2 class="sr">Заказы</h2>${months.map((m, i) => `<section class="part part--month" aria-labelledby="m-${i}">
      <h3 class="part__month" id="m-${i}">${m}</h3>
      <div class="orows">${acc.orders.filter((o) => monthOf(o.date) === m).map((o) => orderRow(ctx, o, { level: 4 })).join("\n      ")}</div>
    </section>`).join("\n    ")}`;
    }
  });
}

// ── the purchases ───────────────────────────────────────────────────────────────────────────────────────────────
export function purchases(ctx) {
  return accountPage(ctx, {
    title: "Покупки", here: "account/purchases/", description: "Кофе, который вы покупали, и ваши оценки.",
    body: (acc) => `<h2 class="sr">Покупки</h2><div class="grid grid--quarters part">${acc.purchases.map((x) => purchaseCard(ctx, x)).join("\n      ")}</div>`
  });
}

// ── the settings ────────────────────────────────────────────────────────────────────────────────────────────────
export function settings(ctx) {
  return accountPage(ctx, {
    title: "Настройки", here: "account/settings/", description: "Ваши данные, адреса доставки и письма.",
    body: (acc) => `<div class="narrow narrow--form settings" data-settings>
      <section class="settings__group" aria-labelledby="set-data">
        <h2 class="settings__title" id="set-data">Ваши данные</h2>
        <div class="form" data-tone="cloud">
          ${field({ name: "first", label: "Имя", value: acc.person.first, autocomplete: "given-name", id: "set-first" })}
          ${field({ name: "last", label: "Фамилия", value: acc.person.last, autocomplete: "family-name", id: "set-last" })}
          ${field({ name: "phone", label: "Телефон", value: acc.person.phone, type: "tel", autocomplete: "tel", id: "set-phone" })}
          ${field({ name: "email", label: "Email", value: acc.person.email, type: "email", autocomplete: "email", id: "set-email" })}
        </div>
      </section>
      <section class="settings__group" aria-labelledby="set-addr">
        <h2 class="settings__title" id="set-addr">Адреса доставки</h2>
        <ul class="form" data-tone="cloud">
          ${acc.addresses.map((a) => `<li class="fcell"><p class="fcell__label">${esc(a.type)}</p><p class="fcell__value">${esc(a.address)}</p></li>`).join("\n          ")}
          <li class="fcell fcell--action"><button class="iconlink" type="button" data-soon="Новый адрес можно будет добавить, когда заработает личный кабинет">${icon("plus")}<span>Добавить</span></button></li>
        </ul>
      </section>
      <section class="settings__group" aria-labelledby="set-mail">
        <h2 class="settings__title" id="set-mail">Получение писем</h2>
        <fieldset class="form" data-tone="cloud"><legend class="sr">Какие письма присылать</legend>
          <div class="fcell fcell--checks">${acc.letters.map(([v, t, on]) => check("letters", t, { value: v, checked: on })).join("")}</div>
        </fieldset>
      </section>
      <p class="settings__out"><button class="link" type="button" data-soon="Выход заработает вместе с личным кабинетом">Выйти</button></p>
    </div>`
  });
}

// ── one order ───────────────────────────────────────────────────────────────────────────────────────────────────
export function order(ctx, id) {
  const acc = account(ctx.products);
  const o = acc.orders.find((x) => x.id === id);
  const items = o.items.map((it) => `<article class="orow orow--item" data-tone="cloud">
      <div class="orow__media">${coffeeMedia(ctx, it.p, { sizes: "12rem" })}${it.qty > 1 ? badge(it.qty, `${it.qty} шт.`) : ""}</div>
      <div class="orow__body">
        <div class="orow__head">
          <h2 class="orow__title"><a class="orow__link" href="${href(ctx, `coffee/${it.slug}/`)}">${esc(it.p.name)}</a></h2>
          <p class="orow__sum">${rub(it.sum)}</p>
        </div>
        ${meta([it.weight, it.grind, it.roastText, it.qty > 1 ? `${it.qty} × ${rub(it.price)}` : ""])}
      </div>
    </article>`).join("\n    ");
  const track = o.status === "roasting" ? `<p class="otrack otrack--wait">Трек-номер СДЭК появится, когда передадим заказ в доставку</p>` : `<ul class="otrack">
        <li><a class="iconlink" href="https://www.cdek.ru/ru/tracking?order_id=${o.track}" target="_blank" rel="noopener">${icon("arrow-out")}<span>Отслеживание у СДЭК</span></a></li>
        <li class="otrack__num"><span>Трек-номер:</span><button class="iconlink" type="button" data-copy="${o.track}" aria-label="Скопировать трек-номер ${o.track}">${icon("copy")}<span>${o.track}</span></button></li>
      </ul>`;
  const aside = panel([
    { title: "Получатель", html: `<p>${esc(o.recipient.name)}</p><p>${esc(o.recipient.phone)}</p><p>${esc(o.recipient.email)}</p>` },
    { title: o.delivery.type === "Самовывоз" ? "Самовывоз" : `Доставка ${o.delivery.type.toLowerCase()}`, html: `<p>${esc(o.delivery.address)}</p>${o.comment ? `<p class="panel__label">Комментарий</p><p class="panel__hint">${esc(o.comment)}</p>` : ""}` },
    { title: o.payment.type, html: `<p class="panel__ok">${icon("check")}<span>${o.payment.paid ? "Оплачено" : "Ожидает оплаты"}</span></p>` },
    { html: rows([
        [`${o.count} ${o.count % 10 === 1 && o.count % 100 !== 11 ? "товар" : o.count % 10 >= 2 && o.count % 10 <= 4 && (o.count % 100 < 10 || o.count % 100 >= 20) ? "товара" : "товаров"}`, rub(o.goods)],
        ["Доставка", rub(o.delivery.price)],
        ...(o.spent ? [["Списано зернышек", `−${rub(o.spent)}`]] : [])
      ], "prows--lines") + `<div class="panel__total"><span>Итого</span><span class="panel__sum">${rub(o.total)}</span></div>` }
  ], { label: "Подробности заказа" });
  const body = `<section class="section section--first shop" data-ground="paper" aria-labelledby="order-title">
  <div class="col"><div class="shop__grid">
    <div class="shop__main">
      ${pageHead({ title: `Заказ ${o.id}`, id: "order-title", line: true, sub: `<div class="ostate"><p class="${cls("status", `status--${o.statusKind}`)}">${esc(o.statusText)}</p>${track}</div>` })}
      <div class="sr">${meta([`Оформлен ${dateTime(o.date)}`])}</div>
      <div class="orows orows--items">
    ${items}
      </div>
      <p class="order__back"><a class="iconlink" href="${href(ctx, "account/orders/")}">${icon("arrow-left")}<span>Все заказы</span></a></p>
    </div>
    ${aside}
  </div></div>
</section>`;
  return page(ctx, { title: `Заказ ${o.id} — QQ Coffee`, description: `Заказ ${o.id} от ${dateShort(o.date)}.`, main: "order-page", body });
}

export const orderIds = (products) => account(products).orders.map((o) => o.id);
