// The quiz «Подобрать кофе» in its dialog on the catalogue (src/templates/quiz.mjs; docs/quiz.md). One question at a
// time; ← and → at the top go back and on (→ only once the question is answered; Enter does the same). A tap on an
// option answers and moves on; the arrow keys only choose. The answers live in the dialog (no address of their own):
// opened again, it shows the result kept in this browser, if any.
// The result is src/scripts/quiz.js's: it is saved in this browser (scripts/tastesaved.js, localStorage "qq-taste")
// and the catalogue learns of it (event "qq:taste"). The last answer closes the dialog with «Для вас» ticked under the
// filters (with the visitor's method): the coffees are seen in the catalogue, never in the dialog (Tim, 26 Nov).
// Opened again, the dialog shows the questions with the answers beside them, «Показать в каталоге», «Пройти заново».
// catalog/?quiz opens the dialog on load (the footer, the profile).
import { result, answered } from "./quiz.js";
import { focusFrom } from "./focus.js";
import { saveTaste, loadTaste } from "./tastesaved.js";

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function initQuiz() {
  const root = document.querySelector("[data-quiz]");
  const dialog = root.closest("dialog");
  const D = JSON.parse(document.getElementById("quiz-data").textContent);
  const form = root.querySelector("[data-quiz-form]"), res = root.querySelector("[data-quiz-result]");
  const steps = [...form.querySelectorAll("[data-step]")], bars = [...form.querySelectorAll("[data-bar]")];
  const back = form.querySelector("[data-quiz-back]"), next = form.querySelector("[data-quiz-next]");
  const IDS = D.steps.map((s) => s.id);
  const coffee = new Map(D.coffees.map((c) => [c.slug, c]));
  root.setAttribute("data-js", "");

  // ── where the dialog is: the answers, the question shown (null: the result), and whether a question was opened from
  //    the result (then answering it goes straight back there) ──
  const saved = loadTaste();
  const S = { a: saved ? { ...saved.answers } : {}, at: saved && answered(saved.answers, D) >= IDS.length ? null : 0, ret: false };
  const go = (at, { ret = false, moved = true } = {}) => { S.at = at; S.ret = ret; draw(moved); };
  const scrollTop = () => { dialog.scrollTop = 0; };

  function draw(moved) {
    const done = answered(S.a, D);
    if (S.at == null && done < IDS.length) S.at = done;
    for (const s of steps) for (const r of s.querySelectorAll("input")) r.checked = S.a[s.dataset.step] === r.value;
    if (S.at == null) return showResult(moved);
    // never past the first unanswered question
    const cur = Math.min(S.at, done);
    S.at = cur;
    form.hidden = false; res.hidden = true;
    // the questions share one cell: the others keep their place, unseen and out of reach (the dialog never jumps)
    steps.forEach((s, k) => { s.hidden = false; s.toggleAttribute("data-off", k !== cur); s.inert = k !== cur; });
    bars.forEach((b, k) => b.toggleAttribute("data-on", k <= cur));
    back.disabled = cur === 0;
    next.disabled = !S.a[IDS[cur]];
    changedAt = performance.now();
    if (moved) { focusFrom(steps[cur].querySelector("legend")); scrollTop(); }
  }

  // ── answering and moving ──
  // a double tap must not answer the next question too: answers within 350 ms of a step change are ignored
  let changedAt = 0, arrow = false, mine = false;
  const tooSoon = () => performance.now() - changedAt < 350;
  const advance = () => {
    mine = true;
    const i = S.at;
    if (S.ret || i === IDS.length - 1) return go(answered(S.a, D) >= IDS.length ? null : answered(S.a, D));
    go(i + 1);
  };
  form.addEventListener("keydown", (e) => { arrow = /^Arrow/.test(e.key) && e.target.matches(".qopt__input"); });
  form.addEventListener("pointerdown", () => { arrow = false; });
  form.addEventListener("change", (e) => {
    const s = e.target.closest("[data-step]");
    if (!s) return;
    if (tooSoon() && !arrow) { draw(false); return; }
    S.a[s.dataset.step] = e.target.value;
    // the arrow keys only choose (the focus stays on the option); Enter or → moves on
    if (arrow) { arrow = false; mine = true; next.disabled = false; return; }
    advance();
  });
  // a tap on the option already chosen moves on too (no change event for it)
  form.addEventListener("click", (e) => {
    const input = e.target.closest(".qopt__input");
    if (!input || e.detail === 0 || tooSoon()) return;
    const s = input.closest("[data-step]");
    if (S.a[s.dataset.step] === input.value && Number(s.dataset.i) === S.at) advance();
  });
  form.addEventListener("submit", (e) => { e.preventDefault(); if (S.a[IDS[S.at]]) advance(); });
  back.addEventListener("click", () => { if (S.at > 0) go(S.at - 1); });
  res.querySelector("[data-quiz-again]").addEventListener("click", () => { S.a = {}; go(0); });

  // ── the result ──
  // worked out and kept (a result opened from what was kept is already there); answered here, the dialog closes onto
  // the catalogue with «Для вас» ticked; opened again, it shows the questions and the answers beside them
  let last = null;
  function showResult(moved) {
    const a = S.a, r = result(a, D);
    last = { answers: { ...a }, region: r.region, mode: r.mode, picks: r.picks.map((p) => ({ slug: p.slug, label: p.label, name: coffee.get(p.slug).name })) };
    if (mine) {
      mine = false;
      saveTaste(last);
      // back to the first question for the next time it opens empty-handed (the answers stay: it opens on them)
      return show();
    }
    form.hidden = true; res.hidden = false;
    res.querySelector("[data-quiz-answers]").innerHTML = D.steps.map((s) => {
      const o = s.options.find((x) => x.id === a[s.id]);
      return `<div class="qres__row"><dt>${esc(s.ask)}</dt><dd>${esc(o?.ru || "")}</dd></div>`;
    }).join("");
    dispatchEvent(new CustomEvent("qq:taste", { detail: { taste: last } }));
    if (moved) { focusFrom(res.querySelector("#quiz-summary")); scrollTop(); }
  }
  // «Показать в каталоге» (and the last answer): «Для вас» ticked under the filters (scripts/filters.js), the dialog closed
  function show() {
    dispatchEvent(new CustomEvent("qq:taste", { detail: { taste: last, show: true } }));
    if (dialog.open) dialog.querySelector("[data-dialog-close]").click();
  }
  res.querySelector("[data-quiz-show]").addEventListener("click", show);

  // the dialog opens on the question or the result it was left on; catalog/?quiz opens it on load
  new MutationObserver(() => { if (dialog.open) draw(true); }).observe(dialog, { attributes: true, attributeFilter: ["open"] });
  draw(false);
  const q = new URLSearchParams(location.search);
  if (q.has("quiz")) {
    q.delete("quiz");
    const s = q.toString();
    history.replaceState(history.state, "", location.pathname + (s ? "?" + s : "") + location.hash);
    dialog.showModal();
  }
}
