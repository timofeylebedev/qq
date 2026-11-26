// «Впечатления» on a coffee's page (session 5 of choosing coffee; the bench: design/people-bench/, form «Полка», then
// Tim's changes of 24 and 26 Nov): its own section after the story. Two tabs on the left, «Впечатления» and «Вопросы»
// (paneltabs, scripts/ui.js), and on the right of their row the one button of the tab shown («Поделиться
// впечатлениями» or «Задать вопрос»: the same size, no arrow). Below, historically: chips by way of brewing (scripts/people.js shows only those reviews); then the reviews, each headed by the
// reviewer's avatar and name, with how close their taste is to yours (in words and three dots, never a percent), their
// answers against expectation per axis (кислотность: ярковато / в самый раз / хотелось ярче; плотность likewise) and
// their words. No stars, scores or averages. The review form opens in a dialog.
// Every review is a PLACEHOLDER until the shop has a backend (data/people.json → build/people.mjs;
// docs/people-backend.md), and so is «your» taste: the account's placeholder visitor (data/account.json), placed on
// the taste model by their first order and moved by their answers after delivery (session 6). Unmarked on the page (Tim).
import { esc, read } from "./util.mjs";
import { dialog, paneltabs } from "./blocks.mjs";
import { account } from "./account-data.mjs";

const D = read("src/data/people.json");
const PAGE = new Map(D.coffees.map((c) => [c.slug, c]));
const PERSON = new Map([...D.people, ...D.named].map((p) => [p.id, p]));
const POS = new Map(read("src/data/taste.json").coffees.map((c) => [c.slug, c.position]));
const A = D.answers, M = D.methods;
const AXES = ["sweet", "bright", "body", "unusual"];

const plural = (n, one, few, many) => { const a = n % 10, b = n % 100; return a === 1 && b !== 11 ? one : a >= 2 && a <= 4 && (b < 10 || b >= 20) ? few : many; };
// the section is about how the coffee turned out in people's cups (Tim, 24 Nov: not «Отзывы»)
export const TITLE = "Впечатления";
const MONTHS = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
const day = (iso) => { const d = new Date(iso + "T00:00:00Z"); return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`; };
const groupOf = (r) => M[r.method].group;
const initials = (name) => name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

// «your» taste: the account's placeholder visitor's place on the taste model, moved by their answers after delivery
// (session 6: account-data.mjs feedback(), from the first order's coffees through every answer); null with no orders
let mine;
function visitor(products) {
  if (mine !== undefined) return mine;
  const acc = account(products);
  return (mine = acc.orders.length ? { ...acc.fb.st.region.center } : null);
}
// how close two tastes are on the visible axes (the taste model's weights), in three steps and in words
const W = { bright: 1, body: 0.75, unusual: 0.85 };
const gap = (a, b) => Math.sqrt(Object.keys(W).reduce((s, k) => s + (W[k] * (a[k] - b[k])) ** 2, 0));
// how close a teller's taste is to yours: a line filled by closeness and one of three standard labels — never a percent
const CLOSE = [[0.8, "Очень похожие вкусы"], [1.6, "Похожие вкусы"], [Infinity, "Разные вкусы"]];
function closeness(them, you) {
  const g = gap(them, you), fill = Math.max(0.08, Math.min(1, 1 - g / 2.5));
  const [, text] = CLOSE.find(([max]) => g < max);
  return `<p class="buyer__close"><span class="buyer__meter" aria-hidden="true"><i style="--fill: ${fill.toFixed(2)}"></i></span>${text}</p>`;
}

// the line under the coffee's name: how many reviews, linking down to them
export function peopleLink(ctx, p) {
  const pg = PAGE.get(p.slug);
  if (!pg) return "";
  // the stories with words (taps alone are counted for the taste model, not shown)
  const n = pg.reviews.filter((r) => r.text).length;
  // «6 впечатлений» (Tim, 26 Nov)
  const text = n ? `${n} ${plural(n, "впечатление", "впечатления", "впечатлений")}` : "Впечатлений пока нет — расскажите первым";
  return `<p class="pstage__people"><a class="pstage__link" href="#people">${esc(text)}</a></p>`;
}

export function people(ctx, p) {
  const pg = PAGE.get(p.slug);
  if (!pg) return "";
  // one button a tab, the same in size and words' spacing, no arrow: the one of the tab shown (CSS, pages/product.css)
  const share = `<button class="btn btn--text people__act" type="button" data-for="stories" data-dialog="review-${p.slug}">Поделиться впечатлениями</button>`;
  const ask = `<button class="btn btn--text people__act" type="button" data-for="questions" data-dialog="ask-${p.slug}">Задать вопрос</button>`;
  const you = visitor(ctx.products);
  return `<section class="section people" id="people" data-ground="paper" aria-label="${TITLE} и вопросы" data-people data-close="${esc(JSON.stringify({ w: W, close: CLOSE.map(([m, t]) => [Number.isFinite(m) ? m : 99, t]) }))}">
  <div class="col">
    <div class="people__bar">
      ${paneltabs([[TITLE, "stories"], ["Вопросы", "questions"]], { label: `${TITLE} и вопросы`, name: "people" })}
      <div class="people__actions">${share}${ask}</div>
    </div>
    <div class="people__panel" id="people-stories" role="tabpanel" aria-labelledby="people-tab-stories">
      ${pg.reviews.some((r) => r.text) ? `<ul class="buyers">
        ${pg.reviews.filter((r) => r.text).map((r) => review(r, you)).join("\n        ")}
      </ul>` : `<p class="people__empty">Пили этот кофе? Расскажите, как заваривали и как он вам: следующему будет проще выбрать.</p>`}
    </div>
    <div class="people__panel" id="people-questions" role="tabpanel" aria-labelledby="people-tab-questions" hidden>
      <p class="people__empty">Вопросов пока нет. Спросите, как его заварить, под какую обжарку брать или чем он отличается от другого: ответит обжарщик QQ.</p>
    </div>
  </div>
  ${writeDialog(ctx, p)}
  ${askDialog(p)}
</section>`;
}

// a story: the avatar in its own column, as tall as the name and the closeness line; beside it the name, how close the teller's taste is to yours, (the answers are counted, not printed)
// answers in two columns, the words, the date and after how many cups
function review(r, you) {
  const p = PERSON.get(r.who);
  // the teller's place (bright, body, unusual): a saved quiz redraws the closeness against the visitor's own region
  // (scripts/tastesaved.js), with the same weights and labels (data-close on the section)
  const data = ` data-g="${groupOf(r)}"${r.milk ? " data-milk" : ""} data-pos="${[p.pos.bright, p.pos.body, p.pos.unusual].map((x) => +x.toFixed(3)).join(",")}"`;
  return `<li class="buyer"${data}>
          <span class="buyer__avatar" aria-hidden="true">${esc(initials(p.name))}</span>
          <div class="buyer__main">
            <h3 class="buyer__name">${esc(p.name)}</h3>
            ${you ? closeness(p.pos, you) : ""}
            ${r.text ? `<p class="buyer__text">${esc(r.text)}</p>` : ""}${r.reply ? `
            <p class="buyer__reply">${esc(r.reply)}</p>` : ""}
            <p class="buyer__date">${day(r.date)} · после ${r.cups} ${plural(r.cups, "чашки", "чашек", "чашек")}</p>
          </div>
        </li>`;
}

// ── the review form (a dialog) ───────────────────────────────────────────────────────────────────────────────────
function writeDialog(ctx, p) {
  const id = `review-${p.slug}`;
  const opt = (name, value, text, type = "radio", extra = "") => `<label class="ropt"><input type="${type}" name="${name}" value="${esc(value)}"${extra}><span>${esc(text)}</span></label>`;
  const three = (axis, need = true) => `<fieldset class="fcell rform__axis">
        <legend class="fcell__label">${A[axis].title}${need ? ` <span class="rform__req">обязательно</span>` : ""}</legend>
        <p class="rform__hint">Против того, что вы обычно пьёте. Ни один ответ не лучше другого.</p>
        <div class="seg seg--3">${["less", "ok", "more"].map((k) => `<label><input type="radio" name="${axis}" value="${k}"${need ? " required" : ""}><span>${A[axis][k]}</span></label>`).join("")}</div>
      </fieldset>`;
  // what you usually drink is never this coffee: the answers are against something else
  const usual = [...ctx.products.filter((q) => q.slug !== p.slug).map((q) => [q.slug, q.name]), ...Object.entries(D.styles).map(([k, v]) => [k, v.charAt(0).toUpperCase() + v.slice(1)])];
  const body = `<form class="form form--dialog rform" data-tone="cloud" data-review-form data-coffee="${esc(p.name)}" action="#">
      <p class="fcell rform__lead">Лучше после нескольких чашек. Важно, как вы заваривали и куда кофе ушёл от того, что вы обычно пьёте.</p>
      <fieldset class="fcell">
        <legend class="fcell__label">Как заваривали <span class="rform__req">обязательно</span></legend>
        <div class="ropts">${Object.entries(M).map(([k, m]) => opt("method", k, m.label, "radio", " required")).join("")}</div>
        <label class="choice choice--check rform__milk"><input class="box" type="checkbox" name="milk" value="yes"><span>С молоком</span></label>
      </fieldset>
      ${three("sweet", false)}
      ${three("bright")}
      ${three("body")}
      ${three("unusual", false)}
      ${p.descriptors.length ? `<fieldset class="fcell">
        <legend class="fcell__label">Какие ноты узнали</legend>
        <div class="ropts">${p.descriptors.map((d) => opt("heard", d, d, "checkbox")).join("")}</div>
      </fieldset>` : ""}
      <fieldset class="fcell">
        <legend class="fcell__label">Сколько чашек уже выпили</legend>
        <div class="ropts">${[["2", "1–2"], ["4", "3–5"], ["6", "6 и больше"]].map(([v, t]) => opt("cups", v, t)).join("")}</div>
      </fieldset>
      <div class="fcell"><label class="fcell__label" for="${id}-text">Пара слов о кофе</label><textarea class="fcell__input rform__text" id="${id}-text" name="text" rows="3" placeholder="Что понравилось, что бы поменяли, кому посоветуете"></textarea></div>
      <div class="fcell"><label class="fcell__label" for="${id}-usual">Обычно пью</label><select class="fcell__input" id="${id}-usual" name="usual"><option value="">Выберите — сохранится в профиле</option>${usual.map(([v, t]) => `<option value="${esc(v)}">${esc(t)}</option>`).join("")}</select></div>
      <div class="fcell rform__pair">
        <div><label class="fcell__label" for="${id}-name">Имя</label><input class="fcell__input" id="${id}-name" name="name" autocomplete="given-name" placeholder="на сайте — имя и первая буква фамилии"></div>
        <div><label class="fcell__label" for="${id}-city">Город</label><input class="fcell__input" id="${id}-city" name="city" autocomplete="address-level2" placeholder="по желанию"></div>
      </div>
      <div class="fcell fcell--checks"><label class="choice choice--check"><input class="box" type="checkbox" name="consent" required><span>Согласен(на), что имя, город и ответы будут видны на сайте</span></label></div>
      <details class="fcell rform__other">
        <summary>Не про вкус: помол не подошёл или не как в описании</summary>
        <p>Такие ответы не идут в счёт вкуса: их читает QQ и отвечает. Отметьте и напишите в поле «Пара слов о кофе».</p>
        <div class="ropts">${opt("issue", "grind", "помол не подошёл", "radio")}${opt("issue", "described", "не как в описании", "radio")}</div>
      </details>
      <button class="btn form__submit" type="submit">Отправить</button>
    </form>`;
  return dialog({ id, title: `Ваша чашка · ${p.name}`, body });
}

// «Задать вопрос»: a question about this coffee to QQ (answered by QQ; there is no backend yet: scripts/people.js says so)
function askDialog(p) {
  const id = `ask-${p.slug}`;
  const body = `<form class="form form--dialog rform" data-tone="cloud" data-review-form action="#">
      <div class="fcell"><label class="fcell__label" for="${id}-q">Ваш вопрос</label><textarea class="fcell__input rform__text" id="${id}-q" name="question" rows="4" required placeholder="Например: как заварить его в гейзере?"></textarea></div>
      <div class="fcell"><label class="fcell__label" for="${id}-name">Имя</label><input class="fcell__input" id="${id}-name" name="name" autocomplete="given-name"></div>
      <button class="btn form__submit" type="submit">Отправить</button>
    </form>`;
  return dialog({ id, title: `Вопрос · ${p.name}`, body });
}
