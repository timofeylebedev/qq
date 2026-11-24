// People on a coffee's page (session 5 of choosing coffee; the bench: design/people-bench/, form «Полка»): who
// recommends it and how buyers drink it, without stars. Named people first, apart, as signed cards (the reason large,
// then who: status, how they drink it, their recipe, what they usually like and the coffee they don't take); then the
// buyers, a line each with their cup (how they brewed, milk, what they usually drink) and their answers against
// expectation, counted in words above the list, never averaged; the notes they heard, counted; a filter by how they
// brew (scripts/people.js recounts). The review form opens in a dialog.
// Every person and review is a PLACEHOLDER until the shop has a backend (data/people.json → build/people.mjs;
// docs/people-backend.md) and the page says so; «Выбор Ксюши» (data/products.csv) is the one real pick.
import { esc, href, read, cls, icon } from "./util.mjs";
import { head } from "./layout.mjs";
import { dialog } from "./blocks.mjs";
import { taste } from "./util.mjs";

const D = read("src/data/people.json");
const PAGE = new Map(D.coffees.map((c) => [c.slug, c]));
const PERSON = new Map([...D.people, ...D.named].map((p) => [p.id, p]));
const A = D.answers, M = D.methods;

const plural = (n, one, few, many) => { const a = n % 10, b = n % 100; return a === 1 && b !== 11 ? one : a >= 2 && a <= 4 && (b < 10 || b >= 20) ? few : many; };
const count = (n, one, few, many) => `${n} ${plural(n, one, few, many)}`;
const MONTHS = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
const day = (iso) => { const d = new Date(iso + "T00:00:00Z"); return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`; };
// a customer's grammatical gender from the first name («Никита» is the pool's one -а man): «купил» / «купила»
const fem = (p) => /[ая]$/.test(p.name.split(" ")[0]) && !/^Никита/.test(p.name);
const said = (p, word) => word + (fem(p) ? "а" : "");
const groupOf = (r) => M[r.method].group;
const GROUP = { espresso: "Эспрессо и кофемашина", pot: "Турка и гейзер", filter: "Фильтр", milk: "С молоком" };
// «Выбор Ксюши»: the tag of a team pick reads in the genitive
const pickTitle = (p) => p.tag || `Выбор: ${p.name}`;

export const placeholder = (text) => `<span class="ph">${esc(text)}</span>`;

// the line under the coffee's name: how many reviews and whose picks, linking down to the block
export function peopleLink(ctx, p) {
  const pg = PAGE.get(p.slug);
  if (!pg) return "";
  const named = pg.picks.map((x) => PERSON.get(x.who));
  const team = named.filter((x) => x.kind === "team"), amb = named.filter((x) => x.kind === "ambassador");
  const bits = team.map(pickTitle);
  if (pg.count) bits.push(count(pg.count, "отзыв", "отзыва", "отзывов"));
  if (amb.length) bits.push(`${amb.length === 1 ? "советует" : "советуют"} ${amb.map((x) => x.name.split(" ")[0]).join(" и ")}`);
  const text = bits.length ? bits.join(" · ") : "Отзывов пока нет — расскажите первым";
  // the pill names what is invented, so it never covers a real pick («Выбор Ксюши»)
  const invented = pg.placeholder && (pg.count || amb.some((x) => x.placeholder));
  const what = team.length ? [pg.count && "отзывы", amb.length && "амбассадоры"].filter(Boolean).join(" и ") + " — пример" : "пример";
  return `<p class="pstage__people"><a class="pstage__link" href="#people">${esc(text)}</a>${invented ? placeholder(what) : ""}</p>`;
}

export function people(ctx, p) {
  const pg = PAGE.get(p.slug);
  if (!pg) return "";
  const picks = pg.picks.map((x) => ({ ...x, p: PERSON.get(x.who) }));
  const invented = pg.placeholder && (pg.count || picks.some((x) => x.p.placeholder));
  const real = picks.filter((x) => !x.p.placeholder).map((x) => pickTitle(x.p));
  const mark = real.length ? `Пример: покупатели и амбассадоры выдуманы, ${real.map((t) => `«${t}»`).join(", ")} — настоящий` : "Пример: магазина ещё нет, люди и отзывы выдуманы";
  return `<section class="section people" id="people" data-ground="paper" aria-labelledby="people-title" data-people>
  <div class="col">
    ${head({ title: "Кто это пьёт", id: "people-title", aside: invented ? placeholder(mark) : "" })}
    ${picks.length ? namedBlock(ctx, p, picks) : ""}
    ${buyers(ctx, p, pg, !picks.length)}
  </div>
  ${writeDialog(ctx, p)}
</section>`;
}

// ── named people: QQ's team and ambassadors, each a signed card ────────────────────────────────────────────────────
function namedBlock(ctx, p, picks) {
  return `<div class="people__part">
    <h3 class="people__sub">Советуют</h3>
    <ul class="picks" style="--n: ${picks.length}">
      ${picks.map((x) => pickCard(ctx, p, x)).join("\n      ")}
    </ul>
  </div>`;
}

function pickCard(ctx, p, x) {
  const n = x.p;
  const coffee = (slug) => ctx.products.find((q) => q.slug === slug);
  const rows = [];
  if (n.how) rows.push(["Пьёт", esc(n.how)]);
  if (x.recipe) rows.push(["Рецепт", esc(x.recipe)]);
  if (n.likes) rows.push(["Обычно любит", esc(n.likes)]);
  if (n.not && coffee(n.not.slug)) rows.push(["Не берёт", `<a class="link" href="${href(ctx, `coffee/${n.not.slug}/`)}">${esc(coffee(n.not.slug).name)}</a> — ${esc(n.not.why.charAt(0).toLowerCase() + n.not.why.slice(1))}`]);
  const others = (n.picks || []).filter((s) => s !== p.slug && coffee(s));
  // QQ's own pick says what the table says: its tag and its text (written about the person, so not a quote)
  if (n.kind === "team") return `<li class="pick" data-tone="cloud">
        <p class="pick__kind">${esc(pickTitle(n))}</p>
        <p class="pick__why">${esc(x.why)}</p>
      </li>`;
  return `<li class="pick" data-tone="cloud">
        <p class="pick__kind">Амбассадор${n.placeholder ? " · пример" : ""}</p>
        <blockquote class="pick__why"><p>${esc(x.why)}</p></blockquote>
        <div class="pick__who">
          <p class="pick__name">${esc(n.name)}</p>
          <p class="pick__status">${esc([n.status, n.where].filter(Boolean).join(" · "))}</p>${n.about ? `
          <p class="pick__about">${esc(n.about)}</p>` : ""}
        </div>
        ${rows.length ? `<dl class="pick__rows">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("")}</dl>` : ""}
        <p class="pick__tie">Связь с QQ: ${n.tie ? esc(n.tie) : "строка-заглушка (бесплатный кофе, кофейня-партнёр или «Реклама», если платно)"}</p>
        ${others.length ? `<details class="pick__more">
          <summary>Все выборы: ${esc(n.name.split(" ")[0])} (${others.length + 1})${icon("chevron-down")}</summary>
          <ul>${others.map((s) => `<li><a class="link" href="${href(ctx, `coffee/${s}/`)}">${esc(coffee(s).name)}</a></li>`).join("")}</ul>
        </details>` : ""}
      </li>`;
}

// ── buyers ────────────────────────────────────────────────────────────────────────────────────────────────────────
function buyers(ctx, p, pg, alone = false) {
  const write = `<button class="btn-arrow people__write" type="button" data-dialog="review-${p.slug}"><span class="btn-arrow__label">Написать отзыв</span>${icon("arrow-right")}</button>`;
  // nobody yet: no empty counts, an invitation (and no subheading when there is nothing else under the title)
  if (!pg.count) return `<div class="people__part">${alone ? "" : `
    <h3 class="people__sub">Как пьют покупатели</h3>`}
    <div class="people__empty">
      <p>Отзывов пока нет. Пили этот кофе? Расскажите, как заваривали и куда он ушёл от ожидания: следующему будет проще выбрать.</p>
      ${write}
    </div>
  </div>`;
  const groups = pg.groups.filter((g) => g.n);
  return `<div class="people__part">
    <h3 class="people__sub">Как пьют покупатели</h3>
    ${pg.count > 1 ? summary(p, pg) : ""}
    ${pg.count > 2 && groups.length > 1 ? `<div class="chips" role="group" aria-label="Как заваривали" data-people-filter hidden>
      <button class="chip" type="button" aria-pressed="true" data-g="all">Все <span>${pg.count}</span></button>${groups.map((g) => `<button class="chip" type="button" aria-pressed="false" data-g="${g.id}">${esc(GROUP[g.id])} <span>${g.n}</span></button>`).join("")}
    </div>` : ""}
    <ul class="buyers">
      ${pg.reviews.map((r) => review(ctx, r, pg.count === 1)).join("\n      ")}
    </ul>
    ${pg.issues.length ? issues(pg) : ""}
    <div class="people__foot">${write}</div>
  </div>`;
}

// the counts in words, per axis; the notes heard, counted (scripts/people.js redraws them for one way of brewing)
function summary(p, pg) {
  const line = (axis) => ["ok", "less", "more"].filter((k) => pg[axis][k]).map((k) => `${pg[axis][k]} ${A[axis][k]}`).join(" · ");
  return `<div class="tally" data-tally>
      <p class="tally__n" data-tally-n>${count(pg.count, "человек", "человека", "человек")}:</p>
      <dl class="tally__rows">
        <div><dt>${A.bright.title}</dt><dd data-tally-axis="bright">${line("bright")}</dd></div>
        <div><dt>${A.body.title}</dt><dd data-tally-axis="body">${line("body")}</dd></div>
        <div><dt>Узнали ноты</dt><dd><ul class="pills">${pg.heard.map((h) => `<li class="pill" style="--dot: var(--c-taste-${taste(h.d)})">${esc(h.d)} <b data-heard="${esc(h.d)}">${h.n} из ${pg.count}</b></li>`).join("")}</ul></dd></div>
      </dl>
    </div>`;
}

function review(ctx, r, open) {
  const p = PERSON.get(r.who);
  const usual = p.usual.slug ? `<a class="link" href="${href(ctx, `coffee/${p.usual.slug}/`)}">${esc(p.usual.label)}</a>` : esc(p.usual.label);
  const answers = `кислотность — ${A.bright[r.answers.bright]}, плотность — ${A.body[r.answers.body]}`;
  // the row: the answers (what the counts above add up), the cup they come from, and a sentence of the text that is
  // about the coffee rather than the cup; the whole review opens below
  const first = (r.text.match(/[^.!?]+[.!?]/g) || []).map((x) => x.trim()).find((x) => !/^(Варю|Пью|Рожков|Автомат|Делаю|Гейзер|Турка|Воронка|Завариваю|Кемекс|Аэропресс|Капельн|Френч|С молоком|Чаще с молоком)/.test(x));
  const data = ` data-g="${groupOf(r)}"${r.milk ? " data-milk" : ""} data-bright="${r.answers.bright}" data-body="${r.answers.body}" data-heard="${esc(r.heard.join("|"))}"`;
  return `<li class="buyer"${data}>
        <details class="buyer__box"${open ? " open" : ""}>
          <summary class="buyer__row">
            <span class="buyer__who"><b>${esc(p.name)}</b> <span>${esc(p.city)}</span></span>
            <span class="buyer__line">${esc(answers.charAt(0).toUpperCase() + answers.slice(1))}</span>
            <span class="buyer__cup">${esc(M[r.method].label)}${r.milk ? ", с молоком" : ""} · обычно пьёт ${esc(p.usual.label)}</span>${first ? `
            <span class="buyer__quote">«${esc(first)}»</span>` : ""}
            <span class="buyer__date">${day(r.date)}${r.verified ? ` · ${said(p, "купил")} у QQ` : ""}</span>
          </summary>
          <div class="buyer__body">
            <dl class="buyer__rows">
              <div><dt>Как заваривал${fem(p) ? "а" : ""}</dt><dd>${esc(M[r.method].label)}${r.milk ? ", с молоком" : ", без молока"} · после ${count(r.cups, "чашки", "чашек", "чашек")}</dd></div>
              <div><dt>Обычно пьёт</dt><dd>${usual} (${esc(p.likes)})</dd></div>
              <div><dt>${A.bright.title}</dt><dd>${A.bright[r.answers.bright]}</dd></div>
              <div><dt>${A.body.title}</dt><dd>${A.body[r.answers.body]}</dd></div>
              <div><dt>Узнал${fem(p) ? "а" : ""}</dt><dd>${r.heard.length ? esc(r.heard.map((d) => d.toLowerCase()).join(", ")) : "ни одной ноты из описания"}</dd></div>
            </dl>
            ${r.text ? `<p class="buyer__text">${esc(r.text)}</p>` : `<p class="buyer__text buyer__text--none">Без текста, только ответы.</p>`}${r.reply ? `
            <p class="issue__reply">${esc(r.reply)}</p>` : ""}
          </div>
        </details>
      </li>`;
}

// not about taste: a wrong grind, «не как в описании»; with QQ's reply; never in the counts
function issues(pg) {
  return `<div class="issues">
      <h4 class="issues__title">Не про вкус</h4>
      ${pg.issues.map((x) => { const p = PERSON.get(x.who); return `<div class="issue">
        <p><b>${x.issue === "grind" ? "Помол не подошёл" : "Не как в описании"}</b> — ${esc(x.text)} <span class="issue__who">${esc(p.name)}, ${esc(M[x.method].label.toLowerCase())}, ${day(x.date)}</span></p>
        ${x.reply ? `<p class="issue__reply">${esc(x.reply)}</p>` : ""}
      </div>`; }).join("\n      ")}
    </div>`;
}

// ── the review form (a dialog) ───────────────────────────────────────────────────────────────────────────────────
function writeDialog(ctx, p) {
  const id = `review-${p.slug}`;
  const opt = (name, value, text, type = "radio", extra = "") => `<label class="ropt"><input type="${type}" name="${name}" value="${esc(value)}"${extra}><span>${esc(text)}</span></label>`;
  const three = (axis) => `<fieldset class="fcell rform__axis">
        <legend class="fcell__label">${A[axis].title} <span class="rform__req">обязательно</span></legend>
        <p class="rform__hint">Против того, что вы обычно пьёте. Ни один ответ не лучше другого.</p>
        <div class="seg seg--3">${["less", "ok", "more"].map((k) => `<label><input type="radio" name="${axis}" value="${k}" required><span>${A[axis][k]}</span></label>`).join("")}</div>
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
      ${three("bright")}
      ${three("body")}
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
  return dialog({ id, title: `Отзыв · ${p.name}`, body });
}
