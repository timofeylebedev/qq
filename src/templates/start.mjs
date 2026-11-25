// «Заказываю кофе впервые» (start/): the quiz «Выбрать кофе за минуту» first, then what to know before a first order
// (marketing's doc, sections 2 and 15; the spreadsheet's rows 4 and 10). One quiz, entered from the home page (its
// section after the hero answers the first question: quizEntry), from the catalogue (a line under the tabs) and here.
// The questions, the matching and the words: data/quiz.json → build/quiz.mjs → src/data/quiz.json, the arithmetic in
// src/scripts/quiz.js, the page's behaviour in src/scripts/quizpage.js. How it works: docs/quiz.md.
//
// Without scripts the four questions stand one under another and «Показать» opens the catalogue on the chosen method.
import { page } from "./layout.mjs";
import { card } from "./components.mjs";
import { pageHead, tiles } from "./blocks.mjs";
import { tasteMap } from "./map.mjs";
import { esc, icon, href, read } from "./util.mjs";
import { result, tasteWords } from "../scripts/quiz.js";

const DOTS = { cocoa: "chocolate", nutty: "nuts", caramel: "sweet", orchard: "orchard", berry: "berry", citrus: "citrus", fermented: "vine", tropical: "tropical" };

// one question: its options as cells (a radio each); the taste options carry the dots of their flavour families
function step(s, i, n) {
  const opts = s.options.map((o) => `<label class="qopt"><input class="qopt__input" type="radio" name="${s.id}" value="${o.id}"><span class="qopt__name">${esc(o.ru)}</span>${o.hint ? `<span class="qopt__hint">${esc(o.hint)}</span>` : ""}${o.families ? `<span class="qopt__dots" aria-hidden="true">${o.families.map((f) => `<i style="--dot: var(--c-taste-${DOTS[f]})"></i>`).join("")}</span>` : ""}</label>`).join("\n          ");
  return `<fieldset class="qstep" data-step="${s.id}" data-i="${i}">
        <legend class="qstep__ask" tabindex="-1"><span class="qstep__n">Вопрос ${i + 1} из ${n}</span><span class="qstep__q">${esc(s.ask)}</span></legend>
        ${s.hint ? `<p class="qstep__hint">${esc(s.hint)}</p>` : ""}
        <div class="qopts qopts--${s.options.length > 6 ? "many" : s.options.length > 3 ? "some" : "few"}">
          ${opts}
        </div>
      </fieldset>`;
}

export function quizBlock(ctx) {
  const D = read("src/data/quiz.json"), C = read("src/data/choose.json");
  const { products } = ctx;
  const n = D.steps.length;
  const offered = new Set(D.coffees.filter((c) => !c.out && !c.decaf).map((c) => c.slug));
  const decaf = D.coffees.find((c) => c.decaf && !c.out);
  // what the script needs: the questions, the rules, the words, every coffee's place (src/data/quiz.json, as built)
  const json = JSON.stringify(D).replace(/</g, "\\u003c");
  return `<div class="quiz" data-quiz>
    <form class="quiz__form" action="${href(ctx, "catalog/")}" method="get" data-quiz-form aria-labelledby="quiz-title">
      <div class="quiz__top">
        <div class="quiz__progress" aria-hidden="true">${D.steps.map((s) => `<i data-bar="${s.id}"></i>`).join("")}</div>
        <button class="iconlink quiz__back" type="button" data-quiz-back hidden>${icon("arrow-left")}<span>Назад</span></button>
      </div>
      ${D.steps.map((s, i) => step(s, i, n)).join("\n      ")}
      <button class="btn quiz__show" type="submit" data-quiz-submit>Показать</button>
      <p class="quiz__b2b"><a class="iconlink" href="${href(ctx, D.b2b.href)}">${icon("arrow-steps")}<span>${esc(D.b2b.text)}: ${esc(D.b2b.hint)}</span></a></p>
    </form>
    <div class="quiz__result" data-quiz-result hidden tabindex="-1" aria-labelledby="quiz-summary">
      <div class="qres__head">
        <h2 class="qres__title-main" id="quiz-summary" tabindex="-1">Ваш подбор</h2>
        <p class="qres__summary" data-quiz-summary></p>
        <p class="qres__start" data-quiz-start></p>
        <ul class="qres__answers" aria-label="Ваши ответы: нажмите, чтобы изменить" data-quiz-answers></ul>
      </div>
      <div class="grid grid--thirds qres__picks" data-quiz-picks>
        ${products.filter((p) => offered.has(p.slug)).map((p) => card({ ...ctx, page: "quiz" }, p, { size: "third", heading: 3, choose: true })).join("\n        ")}
      </div>
      <div class="qres__actions">
        <button class="btn" type="button" data-quiz-set hidden></button>
        <a class="btn-arrow" href="${href(ctx, "catalog/")}" data-quiz-catalogue><span class="btn-arrow__label">В каталоге</span>${icon("arrow-right")}</a>
        <button class="iconlink" type="button" data-quiz-again>${icon("arrow-left")}<span>Пройти заново</span></button>
      </div>
      <p class="qres__saved" data-quiz-saved hidden>Сохранили в <a class="link" href="${href(ctx, "account/")}">профиле</a>: по этим ответам сайт подскажет обжарку и помол на странице кофе.</p>
      <section class="qres__map" aria-labelledby="quiz-map-title">
        <div class="qres__maptext">
          <h3 class="qres__title" id="quiz-map-title">Где ваш вкус на карте</h3>
          <p class="qres__note">Пятно — ваш вкус по ответам. Оно широкое: это начало, а не точка. Точки — все кофе QQ, три из подбора подписаны. Влево — мягче, вправо — ярче, вверх — плотнее.</p>
          ${decaf ? `<p class="qres__decaf">Пьёте без кофеина? Есть <a class="link" href="${href(ctx, `coffee/${decaf.slug}/`)}">${esc(decaf.name)}</a>. ${esc(tasteWords(decaf, D.words))}${decaf.milk ? " QQ советует его для капучино и латте." : ""}${C.coffees.find((c) => c.slug === decaf.slug)?.omni ? " Омни-обжарка: подходит к любому способу." : ""}</p>` : ""}
        </div>
        ${tasteMap(ctx, { id: "quiz-map", label: "Карта вкуса" })}
      </section>
    </div>
    <script type="application/json" id="quiz-data">${json}</script>
  </div>`;
}

// ── the page ─────────────────────────────────────────────────────────────────────────────────────────────────────
export function render(ctx) {
  const D = read("src/data/quiz.json"), C = read("src/data/choose.json");
  const { products, site } = ctx;
  const P = new Map(products.map((p) => [p.slug, p]));
  // «Или начните с этих трёх»: the quiz's own answer to «don't know» everywhere (no method, no milk, no coffee now, no
  // taste): three different coffees across the map
  const plain = result({ method: "none", milk: "no", now: "none", taste: "dunno" }, D);
  const three = plain.picks.map((x) => {
    const p = P.get(x.slug);
    return card({ ...ctx, page: "start" }, p, { size: "third", text: `<b class="card__lead">${esc(x.label)}.</b> ${esc(x.taste)}` });
  }).join("\n      ");
  const methods = (roast) => C.methods.filter((m) => m.roast === roast).map((m) => m.ru.toLowerCase());
  const any = C.methods.filter((m) => m.roast === "any").map((m) => m.ru.toLowerCase());
  const live = C.coffees.filter((c) => !c.out);
  const count = (fn) => live.filter(fn).length;
  const both = count((c) => c.roasts.length > 1);
  const roastTiles = [
    { title: "Под эспрессо", text: `Средняя обжарка: плотнее и слаще, кислинка мягче. Для кофемашин и гейзера: ${methods("Эспрессо").join(", ")}. Хорошо с молоком.` },
    { title: "Под фильтр", text: `Светлая обжарка: прозрачнее, ярче, слышнее фрукты и ягоды. Для ${methods("Фильтр").join(", ")}.` },
    { title: "Турка и френч-пресс", text: `Подойдёт любая обжарка: ${any.join(" и ")}. Под эспрессо — привычнее и плотнее, под фильтр — ярче.` },
    { title: "Помол", text: "Смелем для эспрессо, для турки или для фильтра — или пришлём в зёрнах. Для автомата, гейзера и френч-пресса берите зёрна: отдельного помола для них у нас пока нет." }
  ];
  const wordTiles = [
    { title: "Кислотность", text: "Кислинка, как у яблока или апельсина. Мягкая — почти незаметна, яркая — сочная. Это главное, в чём вкусы людей расходятся: если не уверены, начните с мягкой." },
    { title: "Плотность", text: "Насколько кофе ощущается густым во рту. Плотный — насыщенный и хорош с молоком, лёгкий — прозрачный, как чай." },
    { title: "Ферментация", text: "Особая обработка зерна: даёт винные, ликёрные, тропические ноты. Необычно и интересно, но не на каждый день." },
    { title: "Дескрипторы", text: "Ноты во вкусе: шоколад, карамель, ягоды. Это не добавки — так пахнет и ощущается само зерно." },
    { title: "Classic и Special", text: `Classic — понятный вкус на каждый день, ${count((c) => c.line === "Classic")} кофе. Special — редкие лоты и обработки, ${count((c) => c.line === "Special")}.` },
    { title: "Моносорт и смесь", text: `Моносорт — зерно с одной фермы или региона, смесь — несколько лотов, собранных под эспрессо и молоко. Смесей ${count((c) => c.type === "Смесь")}.` }
  ];
  const facts = site.facts.map((f) => ({ icon: f.icon, title: f.title, text: f.more.filter((t) => t !== "{roast}").join(" ").replace("{hour}", site.roast.hour) }));
  const body = `<section class="section section--first start" data-ground="paper" aria-labelledby="quiz-title">
  <div class="col">
    ${pageHead({ title: "Заказываю кофе впервые", id: "start-title", sub: `<p class="phead__sub"><b>${esc(D.title)}:</b> четыре вопроса — и три кофе с объяснением, почему они. Ниже — что ещё знать перед первым заказом.</p>` })}
    <h2 class="sr" id="quiz-title">${esc(D.title)}</h2>
    ${quizBlock(ctx)}
  </div>
</section>
<section class="section section--after-tight" data-ground="paper" aria-labelledby="three-title">
  <div class="col">
    <h2 class="part__title" id="three-title" data-typeset="off">Или начните с этих трёх</h2>
    <p class="start__lead">Не хотите отвечать — возьмите три разных: ${plain.picks.map((x) => x.label.toLowerCase()).join(", ").replace(/, ([^,]+)$/, " и $1")}. Попробуете и поймёте, какой ваш. ${both} из ${live.length} наших кофе обжариваем и под эспрессо, и под фильтр: подойдут к любому способу.</p>
    <div class="grid grid--thirds">
      ${three}
    </div>
  </div>
</section>
<section class="section section--after-tight" data-ground="paper" aria-labelledby="roast-title">
  <div class="col">
    <h2 class="part__title" id="roast-title" data-typeset="off">Под эспрессо или под фильтр</h2>
    ${tiles(roastTiles, { cols: "4" })}
  </div>
</section>
<section class="section section--after-tight" data-ground="paper" aria-labelledby="words-title">
  <div class="col">
    <h2 class="part__title" id="words-title" data-typeset="off">Что значат слова на странице кофе</h2>
    ${tiles(wordTiles, { cols: "3" })}
  </div>
</section>
<section class="section section--after-tight" data-ground="paper" aria-labelledby="order-title">
  <div class="col">
    <h2 class="part__title" id="order-title" data-typeset="off">Как мы обжариваем и доставляем</h2>
    ${tiles(facts, { cols: "3", cls: "tiles--icons" })}
    <p class="start__more"><a class="btn-arrow" href="${href(ctx, "delivery/")}"><span class="btn-arrow__label">Доставка и оплата</span>${icon("arrow-right")}</a><a class="btn-arrow" href="${href(ctx, "faq/")}"><span class="btn-arrow__label">Вопросы и ответы</span>${icon("arrow-right")}</a></p>
  </div>
</section>`;
  return page(ctx, {
    title: "Заказываю кофе впервые — QQ Coffee",
    description: "Выбрать кофе за минуту: четыре вопроса — и три кофе QQ с объяснением почему. Обжарка, помол, доставка — для первого заказа.",
    main: "start-page", body
  });
}

// ── the home page's way in: the first question, answered in place (each method opens the quiz on question 2) ────
export function quizEntry(ctx) {
  const D = read("src/data/quiz.json");
  const s = D.steps[0];
  return `<section class="section section--first qentry" data-ground="paper" aria-labelledby="qentry-title">
  <div class="col">
    <div class="qentry__head">
      <h2 class="qentry__title" id="qentry-title">${esc(D.title)}</h2>
      <p class="qentry__lead">${esc(D.lead)}</p>
    </div>
    <p class="qstep__n">Вопрос 1 из ${D.steps.length}</p>
    <h3 class="qstep__q qentry__q">${esc(s.ask)}</h3>
    <ul class="qopts qopts--many qentry__opts">${s.options.map((o) => `<li><a class="qopt" href="${href(ctx, `start/?${s.id}=${o.id}`)}"><span class="qopt__name">${esc(o.ru)}</span>${o.hint ? `<span class="qopt__hint">${esc(o.hint)}</span>` : ""}</a></li>`).join("")}</ul>
    <p class="quiz__b2b"><a class="iconlink" href="${href(ctx, D.b2b.href)}">${icon("arrow-steps")}<span>${esc(D.b2b.text)}: ${esc(D.b2b.hint)}</span></a></p>
  </div>
</section>`;
}

