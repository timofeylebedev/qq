// The quiz «Подобрать кофе» (was «Выбрать кофе за минуту» on its own page, start/): a dialog of the catalogue, opened
// by the button at the left of the filters' row (catalog.mjs), by catalog/?quiz (the footer, the profile) and, with a
// quiz kept in this browser, straight onto its answers. No page and no section of its own (Tim, 26 Nov). The last
// answer closes it on the catalogue with «Для вас» ticked: the dialog shows no coffees, only the questions with the
// answers beside them, «Показать в каталоге» and «Пройти заново» (Tim, 26 Nov).
// The questions, the matching and the words: data/quiz.json → build/quiz.mjs → src/data/quiz.json, the arithmetic in
// src/scripts/quiz.js, the dialog's behaviour in src/scripts/quizpage.js. How it works: docs/quiz.md.
import { dialog } from "./blocks.mjs";
import { esc, icon, href, read } from "./util.mjs";

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
  const D = read("src/data/quiz.json");
  const n = D.steps.length;
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
      <div class="quiz__steps">
      ${D.steps.map((s, i) => step(s, i, n)).join("\n      ")}
      </div>
      <p class="quiz__b2b"><a class="iconlink" href="${href(ctx, D.b2b.href)}">${icon("arrow-steps")}<span>${esc(D.b2b.text)}: ${esc(D.b2b.hint)}</span></a></p>
    </form>
    <section class="quiz__result" data-quiz-result hidden aria-labelledby="quiz-summary">
      <h3 class="sr" id="quiz-summary" tabindex="-1">Ваши ответы</h3>
      <dl class="qres__answers" data-quiz-answers></dl>
      <div class="qres__actions">
        <button class="btn btn--text" type="button" data-quiz-show>Показать в каталоге</button>
        <button class="btn btn--text btn--line" type="button" data-quiz-again>Пройти заново</button>
      </div>
    </section>
    <script type="application/json" id="quiz-data">${json}</script>
  </div>`;
}

// the dialog: its title, then the quiz in a box that is its own column (the quiz's and the cards' container queries
// measure the dialog, not the page)
export function quizDialog(ctx) {
  return dialog({ id: "quiz", title: "Подобрать кофе", extra: "dialog--quiz", body: `<div class="quizbox">${quizBlock(ctx)}</div>` });
}
