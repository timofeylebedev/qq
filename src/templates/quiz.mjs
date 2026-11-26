// The quiz «Подобрать кофе» (was «Выбрать кофе за минуту» on its own page, start/): a dialog of the catalogue, opened
// by the button at the left of the filters' row (catalog.mjs), by catalog/?quiz (the footer, the profile) and, with a
// quiz kept in this browser, straight onto its result. No page and no section of its own (Tim, 26 Nov).
// The questions, the matching and the words: data/quiz.json → build/quiz.mjs → src/data/quiz.json, the arithmetic in
// src/scripts/quiz.js, the dialog's behaviour in src/scripts/quizpage.js. How it works: docs/quiz.md.
import { card } from "./components.mjs";
import { dialog } from "./blocks.mjs";
import { esc, icon, href, read } from "./util.mjs";
import { tasteWords } from "../scripts/quiz.js";

const DOTS = { cocoa: "chocolate", nutty: "nuts", caramel: "sweet", orchard: "orchard", dried: "vine", berry: "berry", citrus: "citrus", fermented: "vine", tropical: "tropical" };

// one question: its options as cells (a radio each); the taste options carry the dots of their flavour families
function step(s, i, n) {
  const opts = s.options.map((o) => `<label class="qopt"><input class="qopt__input" type="radio" name="${s.id}" value="${o.id}"><span class="qopt__name">${esc(o.ru)}</span>${o.hint ? `<span class="qopt__hint">${esc(o.hint)}</span>` : ""}${o.families ? `<span class="qopt__dots" aria-hidden="true">${o.families.map((f) => `<i style="--dot: var(--c-taste-${DOTS[f]})"></i>`).join("")}</span>` : ""}</label>`).join("\n          ");
  return `<fieldset class="qstep" data-step="${s.id}" data-i="${i}" hidden>
        <legend class="qstep__ask" tabindex="-1"><span class="sr">Вопрос ${i + 1} из ${n}. </span><span class="qstep__q">${esc(s.ask)}</span></legend>
        ${s.hint ? `<p class="qstep__hint">${esc(s.hint)}</p>` : ""}
        <div class="qopts qopts--${s.options.length > 6 ? "many" : s.options.length > 3 ? "some" : "few"}">
          ${opts}
        </div>
      </fieldset>`;
}

function quizBlock(ctx) {
  const D = read("src/data/quiz.json"), C = read("src/data/choose.json");
  const { products } = ctx;
  const n = D.steps.length;
  const offered = new Set(D.coffees.filter((c) => !c.out && !c.decaf).map((c) => c.slug));
  const decaf = D.coffees.find((c) => c.decaf && !c.out);
  // what the script needs: the questions, the rules, the words, every coffee's place (src/data/quiz.json, as built)
  const json = JSON.stringify(D).replace(/</g, "\\u003c");
  return `<div class="quiz" data-quiz>
    <form class="quiz__form" data-quiz-form aria-label="${esc(D.title)}">
      <div class="quiz__top">
        <div class="quiz__progress" aria-hidden="true">${D.steps.map((s) => `<i data-bar="${s.id}"></i>`).join("")}</div>
        <div class="quiz__nav">
          <button class="quiz__arrow" type="button" aria-label="Назад" data-quiz-back>${icon("arrow-left")}</button>
          <button class="quiz__arrow" type="submit" aria-label="Дальше" data-quiz-next>${icon("arrow-right")}</button>
        </div>
      </div>
      ${D.steps.map((s, i) => step(s, i, n)).join("\n      ")}
      <p class="quiz__b2b"><a class="iconlink" href="${href(ctx, D.b2b.href)}">${icon("arrow-steps")}<span>${esc(D.b2b.text)}: ${esc(D.b2b.hint)}</span></a></p>
    </form>
    <section class="quiz__result" data-quiz-result hidden aria-labelledby="quiz-summary">
      <div class="qres__head">
        <h3 class="sr" id="quiz-summary">Ваш подбор</h3>
        <p class="qres__summary" tabindex="-1" data-quiz-summary></p>
        <ul class="qres__answers" aria-label="Ваши ответы: нажмите, чтобы изменить" data-quiz-answers></ul>
      </div>
      <div class="grid grid--thirds qres__picks" data-quiz-picks>
        ${products.filter((p) => offered.has(p.slug)).map((p) => card({ ...ctx, page: "quiz" }, p, { size: "third", heading: 4, choose: true })).join("\n        ")}
      </div>
      <div class="qres__actions">
        <button class="btn" type="button" data-quiz-set hidden></button>
        <button class="btn-arrow" type="button" data-quiz-show><span class="btn-arrow__label">Показать в каталоге</span>${icon("arrow-right")}</button>
        <button class="iconlink" type="button" data-quiz-again>${icon("arrow-left")}<span>Пройти заново</span></button>
      </div>
      ${decaf ? `<p class="qres__decaf">Пьёте без кофеина? Есть <a class="link" href="${href(ctx, `coffee/${decaf.slug}/`)}">${esc(decaf.name)}</a>. ${esc(tasteWords(decaf, D.words))}${decaf.milk ? " QQ советует его для капучино и латте." : ""}${C.coffees.find((c) => c.slug === decaf.slug)?.omni ? " Омни-обжарка: подходит к любому способу." : ""}</p>` : ""}
    </section>
    <script type="application/json" id="quiz-data">${json}</script>
  </div>`;
}

// the dialog: its title, then the quiz in a box that is its own column (the quiz's and the cards' container queries
// measure the dialog, not the page)
export function quizDialog(ctx) {
  return dialog({ id: "quiz", title: "Подобрать кофе", extra: "dialog--quiz", body: `<div class="quizbox">${quizBlock(ctx)}</div>` });
}
