// «Отзывы» on a coffee's page (session 5 of choosing coffee; the bench: design/people-bench/, form «Полка», then Tim's
// changes of 24 Nov): its own section after the story. A centred title; the number of reviews and «Написать отзыв» on
// one line; chips by way of brewing (scripts/people.js shows only those reviews); then the reviews, each headed by the
// reviewer's avatar and name, with how close their taste is to yours (in words and three dots, never a percent), their
// answers against expectation per axis (кислотность: ярковато / в самый раз / хотелось ярче; плотность likewise) and
// their words. No stars, scores or averages. The review form opens in a dialog.
// Every review is a PLACEHOLDER until the shop has a backend (data/people.json → build/people.mjs;
// docs/people-backend.md), and so is «your» taste: the account's placeholder visitor (data/account.json), placed on
// the taste model by the coffees they bought. The page says so.
import { esc, read, icon } from "./util.mjs";
import { head } from "./layout.mjs";
import { dialog } from "./blocks.mjs";
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
const told = (n) => `${n} ${plural(n, "человек рассказал", "человека рассказали", "человек рассказали")}`;
const MONTHS = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
const day = (iso) => { const d = new Date(iso + "T00:00:00Z"); return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`; };
const groupOf = (r) => M[r.method].group;
const GROUP = { espresso: "Эспрессо и кофемашина", pot: "Турка и гейзер", filter: "Фильтр", milk: "С молоком" };
const initials = (name) => name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

// «your» taste: where the coffees the visitor bought sit on the taste model, weighted by how often (the account's
// placeholder visitor until there are real accounts); null with no purchases
let mine;
function visitor(products) {
  if (mine !== undefined) return mine;
  const bought = account(products).purchases.filter((x) => POS.has(x.slug));
  const n = bought.reduce((s, x) => s + x.count, 0);
  if (!n) return (mine = null);
  const avg = (k) => bought.reduce((s, x) => s + POS.get(x.slug)[k] * x.count, 0) / n;
  return (mine = { bright: avg("bright"), body: avg("body"), unusual: avg("unusual") });
}
// how close two tastes are on the visible axes (the taste model's weights), in three steps and in words
const W = { bright: 1, body: 0.75, unusual: 0.85 };
const gap = (a, b) => Math.sqrt(Object.keys(W).reduce((s, k) => s + (W[k] * (a[k] - b[k])) ** 2, 0));
// in words per axis: what a taste leans to (only where it leans)
const lean = (t) => [t.bright >= 3.4 ? "яркое" : t.bright <= 2.2 ? "мягкое" : null, t.body >= 4 ? "плотное" : t.body <= 2.5 ? "лёгкое" : null, t.unusual >= 1.5 ? "необычное" : null].filter(Boolean);
// how close a reviewer's taste is to yours: a line (filled by closeness) and why, in words — never a percent
const and = (w) => w.length > 1 ? `${w.slice(0, -1).join(", ")} и ${w.at(-1)}` : w.join("");
function closeness(them, you) {
  const g = gap(them, you), fill = Math.max(0.08, Math.min(1, 1 - g / 2.5));
  const theirs = lean(them), yours = lean(you), same = theirs.filter((w) => yours.includes(w)), other = theirs.filter((w) => !yours.includes(w));
  const text = g < 0.8 ? `Вкус как у вас${same.length ? `: тоже любит ${and(same)}` : ""}`
    : g < 1.6 ? `Вкус отчасти как ваш${other.length ? `: больше любит ${and(other)}` : same.length ? `: тоже любит ${and(same)}` : ""}`
    : `Вкус другой${other.length ? `: любит ${and(other)}` : ""}`;
  return `<p class="buyer__close"><span class="buyer__meter" aria-hidden="true"><i style="--fill: ${fill.toFixed(2)}"></i></span>${esc(text)}</p>`;
}

// the line under the coffee's name: how many reviews, linking down to them
export function peopleLink(ctx, p) {
  const pg = PAGE.get(p.slug);
  if (!pg) return "";
  const text = pg.count ? `Впечатления: ${told(pg.count)}` : "Впечатлений пока нет — расскажите первым";
  return `<p class="pstage__people"><a class="pstage__link" href="#people">${esc(text)}</a></p>`;
}

export function people(ctx, p) {
  const pg = PAGE.get(p.slug);
  if (!pg) return "";
  const write = `<button class="btn-arrow people__write" type="button" data-dialog="review-${p.slug}"><span class="btn-arrow__label">Рассказать о своей</span>${icon("arrow-right")}</button>`;
  const groups = pg.groups.filter((g) => g.n);
  const you = visitor(ctx.products);
  return `<section class="section people" id="people" data-ground="paper" aria-labelledby="people-title" data-people>
  <div class="col">
    ${head({ title: TITLE, id: "people-title", center: true })}
    <div class="people__grid">
      <div class="people__side">
        <p class="people__count">${pg.count ? told(pg.count) : "Пока никто не рассказал"}</p>
        ${write}
        ${pg.count > 1 && groups.length > 1 ? `<div class="chips" role="group" aria-label="Как заваривали" data-people-filter hidden>
          <button class="chip" type="button" aria-pressed="true" data-g="all">Все <span>${pg.count}</span></button>${groups.map((g) => `<button class="chip" type="button" aria-pressed="false" data-g="${g.id}">${esc(GROUP[g.id])} <span>${g.n}</span></button>`).join("")}
        </div>` : ""}
      </div>
      ${pg.count ? `<ul class="buyers">
        ${pg.reviews.map((r) => review(r, you)).join("\n        ")}
      </ul>` : `<p class="people__empty">Пили этот кофе? Расскажите, как заваривали и куда он ушёл от ожидания: следующему будет проще выбрать.</p>`}
    </div>
  </div>
  ${writeDialog(ctx, p)}
</section>`;
}

// a story: the avatar in its own column, as tall as the name and the closeness line; beside it the name, how close the teller's taste is to yours, the four
// answers in two columns, the words, the date and after how many cups
function review(r, you) {
  const p = PERSON.get(r.who);
  const data = ` data-g="${groupOf(r)}"${r.milk ? " data-milk" : ""}`;
  return `<li class="buyer"${data}>
          <span class="buyer__avatar" aria-hidden="true">${esc(initials(p.name))}</span>
          <div class="buyer__main">
            <h3 class="buyer__name">${esc(p.name)}</h3>
            ${you ? closeness(p.pos, you) : ""}
            <dl class="props">${AXES.map((a) => `<div><dt>${A[a].title}</dt><dd>${A[a][r.answers[a]]}</dd></div>`).join("")}</dl>
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
