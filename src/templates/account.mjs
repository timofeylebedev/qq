// The account: the profile (activity, the last order, purchases, coffees for you), the orders, one order, the
// purchases, the beans (a dialog over the profile, and its own address), the settings. The visitor is a placeholder
// (data/account.json, design/decisions.json "account-placeholder"); everything shown is worked out from their orders.
import { page, head } from "./layout.mjs";
import { card, photoOf } from "./components.mjs";
import { pageHead, subtabs, paneltabs, badge, coffeeMedia, panel, rows, dialog, field, check, meta } from "./blocks.mjs";
import { esc, icon, href, cls, rub, read, picture } from "./util.mjs";
import { account, dateShort, dateTime, monthOf } from "./account-data.mjs";
import { replyOf, rowOf, promptOf, purchaseOf, formStart, replyHtml } from "../scripts/feedbackview.js";

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
    body: `<section class="section section--first account" data-ground="paper" aria-labelledby="account-title"${fbData(acc)}>
  <div class="col">
    ${accountHead(ctx, acc, here)}
    ${body(acc)}
  </div>
</section>${extra ? "\n" + extra(acc) : ""}`
  });
};

// ── the feedback after delivery (session 6; docs/feedback.md) ───────────────────────────────────────────────────
// The page is written in the placeholder visitor's state (data/account.json feedback); scripts/feedbackpage.js redraws
// it with this browser's answers and the quiz's region. What it needs travels on the section: the orders (ids, status,
// delivery, coffees with roast and grind), the placeholder's answers, the first order's coffees, the coffees bought.
const fbAcc = (acc) => acc.fb.lite;
const fbData = (acc) => ` data-fb-account="${esc(JSON.stringify({ ...fbAcc(acc), answers: acc.fb.answers }))}"`;
const fbState = (acc) => acc.fb.S;

// the line under an order's row: answer, answered, or when the site will ask
function fbLine(ctx, acc, o) {
  const r = rowOf(fbState(acc), fbAcc(acc).orders.find((x) => x.id === o.id), acc.fb.today, acc.fb.F);
  const inner = r.kind === "ask" ? `<a class="orow__fblink" href="${href(ctx, `account/orders/${o.id}/`)}#feedback">${esc(r.text)}</a>` : esc(r.text);
  return `<p class="${cls("orow__fb", `orow__fb--${r.kind}`)}" data-fb-row="${o.id}">${inner}</p>`;
}

// ── an order as a row: the first coffee's picture with the count, the coffees, where it goes, its number, status ────
function orderRow(ctx, o, { level = 3, acc = null } = {}) {
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
        ${acc ? fbLine(ctx, acc, o) : ""}
      </div>
    </article>`;
}

// ── a coffee bought: its picture with the price and how many were bought, a rating, the name and the last choice ───
function purchaseCard(ctx, x, acc = null) {
  const photo = !!photoOf(ctx, x.p);
  return `<article class="pcard" data-card data-slug="${x.slug}">
      <div class="pcard__media">${coffeeMedia(ctx, x.p, { sizes: "(min-width: 64em) 25vw, 50vw" })}
        <div class="pcard__top"${photo ? ' data-on-photo' : ""}>${x.count > 1 ? badge(x.count, `Куплено ${x.count} раза`) : "<span></span>"}<span class="pcard__price">${rub(x.price)}</span></div>
      </div>
      <h3 class="pcard__name"><a class="card__link" href="${href(ctx, `coffee/${x.slug}/`)}">${esc(x.p.name)}</a></h3>
      ${meta([x.weight, x.grind, x.roastText])}
      ${acc ? pcardFb(ctx, acc, x.slug) : ""}
    </article>`;
}
// what the visitor said about a coffee bought (its newest answer), or a way to answer: in place of the thumbs (session 6)
function pcardFb(ctx, acc, slug) {
  const r = purchaseOf(fbState(acc), fbAcc(acc), slug, acc.fb.today, acc.fb.F);
  const inner = r.kind === "later" ? esc(r.text) : `<a class="link" href="${href(ctx, `account/orders/${r.order}/`)}#fb-${r.order}-${slug}">${esc(r.text)}</a>`;
  return `<p class="${cls("pcard__fb", `pcard__fb--${r.kind}`)}" data-fb-card="${slug}">${inner}</p>`;
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
    body: (acc) => `${fbPrompt(ctx, acc)}<section class="part" aria-labelledby="activity-title">
      <h2 class="part__title" id="activity-title">Активность</h2>
      <ul class="tiles tiles--cloud activity">
        <li class="tile"><div class="tile__head"><h3 class="tile__title">Зернышки</h3><a class="tile__more" href="${href(ctx, "account/beans/")}" data-dialog="beans" aria-label="Подробнее о зернышках">${icon("plus-round")}</a></div>${beansDial(acc)}</li>
        <li class="tile"><div class="tile__head"><h3 class="tile__title">Ваш вкус</h3></div>${myMap(ctx, acc)}</li>
        <li class="tile"><div class="tile__head"><h3 class="tile__title">Страны</h3></div>${countries(acc, ctx.products)}</li>
        <li class="tile"><div class="tile__head"><h3 class="tile__title">Дескрипторы</h3></div>${waffle(acc)}</li>
      </ul>
    </section>
    <section class="part" aria-labelledby="orders-title">
      <div class="part__head"><h2 class="part__title" id="orders-title">Заказы</h2><a class="iconlink" href="${href(ctx, "account/orders/")}"><span>Все заказы</span>${icon("arrow-right")}</a></div>
      <div class="orows">${orderRow(ctx, acc.orders[0], { acc })}</div>
    </section>
    <section class="part" aria-labelledby="buys-title">
      <div class="part__head"><h2 class="part__title" id="buys-title">Покупки</h2><a class="iconlink" href="${href(ctx, "account/purchases/")}"><span>Все покупки</span>${icon("arrow-right")}</a></div>
      <div class="grid grid--quarters">${acc.purchases.slice(0, 4).map((x) => purchaseCard(ctx, x, acc)).join("\n      ")}</div>
    </section>
    <section class="part" aria-labelledby="quiztaste-title" data-taste-part hidden>
      <div class="part__head"><h2 class="part__title" id="quiztaste-title">Ваш подбор</h2><a class="iconlink" href="${href(ctx, "catalog/?quiz")}" data-taste-again><span>Открыть подбор</span>${icon("arrow-right")}</a></div>
      <div class="next__grid taste-part" data-taste-list>
        ${ctx.products.filter((q) => acc.fb.F.coffees.some((c) => c.slug === q.slug && !c.decaf)).map((q) => `<div class="next__item" data-taste-item="${q.slug}" hidden>
          <p class="next__tag" data-taste-tag></p>
          ${card({ ...ctx, page: "quiztaste" }, q, { size: "third" })}
        </div>`).join("\n        ")}
      </div>
    </section>
    ${nextPart(ctx, acc)}`,
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
      <div class="orows">${acc.orders.filter((o) => monthOf(o.date) === m).map((o) => orderRow(ctx, o, { level: 4, acc })).join("\n      ")}</div>
    </section>`).join("\n    ")}`;
    }
  });
}

// ── the purchases ───────────────────────────────────────────────────────────────────────────────────────────────
export function purchases(ctx) {
  return accountPage(ctx, {
    title: "Покупки", here: "account/purchases/", description: "Кофе, который вы покупали, и что вы о нём сказали.",
    body: (acc) => `<h2 class="sr">Покупки</h2><div class="grid grid--quarters part">${acc.purchases.map((x) => purchaseCard(ctx, x, acc)).join("\n      ")}</div>`
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
  const body = `<section class="section section--first shop" data-ground="paper" aria-labelledby="order-title"${fbData(acc)}>
  <div class="col"><div class="shop__grid">
    <div class="shop__main">
      ${pageHead({ title: `Заказ ${o.id}`, id: "order-title", line: true, sub: `<div class="ostate"><p class="${cls("status", `status--${o.statusKind}`)}">${esc(o.statusText)}</p>${track}</div>` })}
      <div class="sr">${meta([`Оформлен ${dateTime(o.date)}`])}</div>
      <div class="orows orows--items">
    ${items}
      </div>
      ${fbSection(ctx, acc, o)}
      <p class="order__back"><a class="iconlink" href="${href(ctx, "account/orders/")}">${icon("arrow-left")}<span>Все заказы</span></a></p>
    </div>
    ${aside}
  </div></div>
</section>`;
  return page(ctx, { title: `Заказ ${o.id} — QQ Coffee`, description: `Заказ ${o.id} от ${dateShort(o.date)}.`, main: "order-page", body });
}

// ── the feedback: the visitor on the taste map (the profile's tile «Ваш вкус») ──────────────────────────────────────
// The visitor's region as a soft ellipse, the path of its centre answer by answer (grey dots), the centre now (a «+»:
// not a coffee); every coffee a dot where the taste map puts it (src/data/choose.json map), grey, or lavender for one
// the visitor bought, a link to its page. Hovered or focused, a dot shows the coffee's card (its picture and name, a
// link too) above it (scripts/feedbackpage.js). The four axes are named, without arrows; no words under it (Tim, 26 Nov).
// scripts/feedbackpage.js redraws it with this browser's answers.
const ell = (r) => `cx="${(r.u * 110).toFixed(2)}" cy="${(r.v * 100).toFixed(2)}" rx="${Math.max(3, r.ru * 110).toFixed(2)}" ry="${Math.max(3, r.rv * 100).toFixed(2)}"`;
const trail = (list) => list.map((r) => `${(r.u * 110).toFixed(2)},${(r.v * 100).toFixed(2)}`).join(" ");
function myMap(ctx, acc) {
  const F = acc.fb.F, S = fbState(acc), now = S.trail.at(-1), by = new Map(ctx.products.map((q) => [q.slug, q]));
  const mine = new Set(acc.purchases.map((x) => x.slug));
  const list = F.coffees.filter((c) => !c.decaf && by.has(c.slug));
  const at = (c) => `cx="${(c.map.u * 110).toFixed(2)}" cy="${(c.map.v * 100).toFixed(2)}"`;
  // the visitor's own coffees last, so they lie over the others
  const dots = [...list.filter((c) => !mine.has(c.slug)), ...list.filter((c) => mine.has(c.slug))].map((c) =>
    `<a class="mymap__dot${mine.has(c.slug) ? " mymap__dot--mine" : ""}" href="${href(ctx, `coffee/${c.slug}/`)}" data-dot="${c.slug}" aria-label="${esc(c.name)}${mine.has(c.slug) ? ", вы брали" : ""}"><circle class="mymap__hit" ${at(c)} r="5"/><circle class="mymap__pt" ${at(c)} r="2.4"/></a>`).join("");
  // one card per coffee, hidden until its dot is hovered (a photo for a Special coffee, else the pack)
  const tips = list.map((c) => {
    const q = by.get(c.slug), ph = photoOf(ctx, q);
    const img = ph ? picture(ph[0], "", { sizes: "120px", decorative: true }) : `<img src="/assets/pack/still-512.webp" alt="" width="512" height="512" loading="lazy" decoding="async">`;
    return `<a class="mymap__tip${ph ? " mymap__tip--photo" : ""}" href="${href(ctx, `coffee/${c.slug}/`)}" data-tip="${c.slug}" tabindex="-1" aria-hidden="true" hidden><span class="mymap__img">${img}</span><span class="mymap__name">${esc(c.name)}</span></a>`;
  }).join("");
  return `<figure class="mymap" data-fb-map aria-label="Ваш вкус на карте кофе QQ">
      <div class="mymap__box">
        <svg class="mymap__svg" viewBox="0 0 110 100" focusable="false">
          <ellipse class="mymap__area" data-fb-area ${ell(S.area)} aria-hidden="true"/>
          <polyline class="mymap__trail" data-fb-trail points="${trail(S.trail)}" aria-hidden="true"/>
          <g>${dots}</g>
          <path class="mymap__now" data-fb-now transform="translate(${(now.u * 110).toFixed(2)} ${(now.v * 100).toFixed(2)})" d="M-2.6 0H2.6M0 -2.6V2.6" aria-hidden="true"/>
        </svg>
        <span class="mymap__axis mymap__axis--up" aria-hidden="true">Плотнее</span>
        <span class="mymap__axis mymap__axis--down" aria-hidden="true">Легче</span>
        <span class="mymap__axis mymap__axis--left" aria-hidden="true">Мягче</span>
        <span class="mymap__axis mymap__axis--right" aria-hidden="true">Ярче</span>
        ${tips}
      </div>
    </figure>`;
}

// ── the profile's question: the newest delivered order not answered about ───────────────────────────────────────
function fbPrompt(ctx, acc) {
  const p = promptOf(fbState(acc), fbAcc(acc), acc.fb.today, acc.fb.F);
  // the coffees in the title, the button on the right, × closes it (this browser keeps which: scripts/feedbackpage.js)
  return `<section class="part fbprompt" data-fb-prompt data-fb-key="${esc(p?.key || "")}" aria-labelledby="fbp-title"${p ? "" : " hidden"}>
      <div class="fbprompt__box" data-tone="cloud">
        <div class="fbprompt__words">
          <h2 class="fbprompt__title" id="fbp-title" data-fb-prompt-title>${esc(p?.title || "")}</h2>
          <p class="fbprompt__text">${esc(acc.fb.F.words.prompt)}</p>
        </div>
        <a class="btn btn--text fbprompt__go" href="${href(ctx, `account/orders/${p?.order || acc.orders[0].id}/`)}#feedback" data-fb-prompt-link>Ответить</a>
        <button class="fbprompt__close" type="button" aria-label="Скрыть вопрос" data-fb-prompt-close>${icon("close")}</button>
      </div>
    </section>
    `;
}

// ── the profile's «Следующий кофе»: three cards from feedback.js nextOf, each under its move, with why ──────────────
// Every coffee's card is in the page (hidden but the three), so the browser can show other three after an answer.
function nextPart(ctx, acc) {
  const F = acc.fb.F, S = fbState(acc), by = new Map(ctx.products.map((q) => [q.slug, q]));
  const picks = S.next.picks, shown = new Set(picks.map((p) => p.slug));
  const order = [...picks.map((p) => p.slug), ...F.coffees.map((c) => c.slug).filter((x) => !shown.has(x) && by.has(x))];
  const item = (slug) => {
    const p = picks.find((x) => x.slug === slug), q = by.get(slug);
    return `<div class="next__item" data-fb-item="${slug}"${p ? "" : " hidden"}>
        <p class="next__tag" data-fb-tag>${esc(p?.label || "")}</p>
        ${card({ ...ctx, page: "next" }, q, { size: "third", text: esc(p?.text || ""), choose: true })}
      </div>`;
  };
  return `<section class="part fbnext" id="next" aria-labelledby="next-title" data-fb-next>
      <h2 class="part__title" id="next-title">Следующий кофе</h2>
      <p class="fbnext__lead" data-fb-lead>${esc(S.next.lead)}</p>
      <div class="next__grid fbnext__grid" style="--n: 3">
        ${order.map(item).join("\n        ")}
      </div>
    </section>`;
}

// ── the order's «Как вам кофе?»: a few taps per coffee, or the reply once answered ────────────────────────────────
function fbSection(ctx, acc, o) {
  const F = acc.fb.F, W = F.words, A = F.rules.axes, S = fbState(acc);
  const ask = acc.fb.asks.find((x) => x.id === o.id);
  if (o.status !== "delivered") return `<section class="fbs" id="feedback" aria-labelledby="fb-title">
        <h2 class="fbs__title" id="fb-title">${esc(W.title)}</h2>
        <p class="fbs__lead">${esc(W.later)}</p>
      </section>`;
  const wait = ask.wait ? `<p class="fbs__wait" data-fb-wait>${esc(W.wait.replace("{n}", `${ask.wait} ${ask.wait % 10 === 1 && ask.wait % 100 !== 11 ? "день" : [2, 3, 4].includes(ask.wait % 10) && ![12, 13, 14].includes(ask.wait % 100) ? "дня" : "дней"}`))}</p>` : "";
  const coffee = new Map(F.coffees.map((c) => [c.slug, c]));
  const forms = o.items.map((it) => {
    const id = `fb-${o.id}-${it.slug}`, a = S.byKey.get(`${o.id}/${it.slug}`) || null, start = formStart(S, it, F), c = coffee.get(it.slug);
    const issueOf = S.answers.find((x) => x.issue && x.order === o.id && x.slug === it.slug) || null;
    const unusual = c.position.unusual >= A.unusual.askFrom;
    const row = (k) => `<fieldset class="fb__row">
            <legend class="fb__label">${esc(A[k].title)}</legend>${A[k].hint ? `<p class="fb__hint">${esc(A[k].hint)}</p>` : ""}
            <div class="seg seg--3">${["less", "ok", "more"].map((v) => `<label><input type="radio" name="${k}" value="${v}"${!a?.issue && a?.[k] === v ? " checked" : ""}${A[k].need ? " required" : ""}><span>${esc(A[k][v])}</span></label>`).join("")}</div>
          </fieldset>`;
    const method = a?.method || start.method;
    const r = a ? replyOf(S, fbAcc(acc), a, F) : null;
    return `<form class="fb" id="${id}" data-fb-form data-order="${o.id}" data-slug="${it.slug}" data-tone="cloud" action="#">
        <div class="fb__head">
          <h3 class="fb__name"><a class="fb__link" href="${href(ctx, `coffee/${it.slug}/`)}">${esc(it.p.name)}</a></h3>
          ${meta([it.weight, it.grind, it.roastText])}
        </div>
        <div class="fb__ask" data-fb-ask${a ? " hidden" : ""}>
          <div class="fb__how">
            <div class="fb__method"><label class="fb__label" for="${id}-m">${esc(W.method)}</label>
              <span class="fb__select"><select class="fcell__input" id="${id}-m" name="method"><option value="">Выберите</option>${Object.entries(F.methods).map(([m, x]) => `<option value="${m}"${m === method ? " selected" : ""}>${esc(x.ru)}</option>`).join("")}</select>${icon("chevron-down", 'class="fb__chevron"')}</span></div>
            <label class="choice choice--check fb__milk"><input class="box" type="checkbox" name="milk" value="yes"${(a ? a.milk : start.milk) ? " checked" : ""}><span>${esc(W.milk)}</span></label>
          </div>
          ${row("bright")}
          ${row("body")}
          ${unusual ? row("unusual") : ""}
          <details class="rform__other fb__other"${issueOf ? " open" : ""}>
            <summary>${esc(W.otherSummary)}</summary>
            <p>${esc(W.otherHint)}</p>
            <fieldset class="fb__issues"><legend class="sr">${esc(W.otherSummary)}</legend>
              <div class="ropts">${Object.entries(F.rules.issues).map(([k, x]) => `<label class="ropt"><input type="radio" name="issue" value="${k}"${issueOf?.issue === k ? " checked" : ""}><span>${esc(x.label)}</span></label>`).join("")}</div>
            </fieldset>
            <fieldset class="fb__need" data-fb-need${issueOf?.issue === "grind" ? "" : " hidden"}>
              <legend class="fb__label">${esc(F.rules.issues.grind.ask)}</legend>
              <div class="ropts">${Object.entries(F.rules.issues.grind.need).map(([k, [t]]) => `<label class="ropt"><input type="radio" name="need" value="${k}"${issueOf?.need === k ? " checked" : ""}><span>${esc(t)}</span></label>`).join("")}</div>
            </fieldset>
          </details>
          <div class="fb__send"><button class="btn" type="submit">${esc(W.send)}</button></div>
        </div>
        <div class="fb__reply" data-fb-reply tabindex="-1"${r ? "" : " hidden"}>${r ? replyHtml(r, it.slug, F, href(ctx, "")) : ""}</div>
      </form>`;
  });
  return `<section class="fbs" id="feedback" aria-labelledby="fb-title">
        <h2 class="fbs__title" id="fb-title">${esc(W.title)}</h2>
        <p class="fbs__lead">${esc(W.lead)}</p>
        ${wait}
        <div class="fbs__list">
      ${forms.join("\n      ")}
        </div>
      </section>`;
}


export const orderIds = (products) => account(products).orders.map((o) => o.id);
