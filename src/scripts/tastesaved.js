// The quiz's result, kept in this browser until the account has a backend (localStorage "qq-taste"; docs/quiz.md says
// what a backend keeps): the answers, the region on the taste map, the three coffees. Read by
//   the catalogue      [data-quiz-entry]: «Ваш подбор: …» in place of «Выбираете впервые?»
//   a coffee's page    [data-fit]: whether QQ roasts it for the visitor's way of brewing, and with what grind; the buy
//                      bar starts on that roast and grind (unless the address chose them: ?roast=…&grind=…)
//   «Впечатления»      [data-people][data-close]: how close each teller's taste is to the visitor's quiz region
//   the profile        [data-taste-part]: what the quiz said, with a way back to it
// and later by the feedback after delivery (session 6): its answers move this region (src/scripts/taste.js update).
import { load, save } from "./buy.js";

export const TASTE = "qq-taste";
export const loadTaste = () => { const t = load(TASTE, {}); return t && t.v === 1 && t.answers ? t : null; };
export const saveTaste = (t) => save(TASTE, { v: 1, at: new Date().toISOString(), ...t });

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const rootHref = () => document.documentElement.dataset.root || "";
const quizHref = (t) => `${rootHref()}start/?${new URLSearchParams(t.answers)}`;
const names = (t) => { const n = t.picks.map((p) => p.name); return n.length > 1 ? `${n.slice(0, -1).join(", ")} и ${n.at(-1)}` : n[0]; };

export function initSaved() {
  const t = loadTaste();
  if (!t) return;
  // the catalogue: the visitor's three, and the way back to the result
  const entry = document.querySelector("[data-quiz-entry]");
  if (entry) {
    entry.querySelector("[data-quiz-entry-text]").textContent = `Ваш подбор: ${names(t)}.`;
    const a = entry.querySelector("[data-quiz-entry-link]");
    a.textContent = "Открыть подбор"; a.setAttribute("href", quizHref(t));
  }
  // a coffee's page: the visitor's way of brewing
  const fit = document.querySelector("[data-fit]");
  if (fit && t.answers.method && t.answers.method !== "none") {
    const F = JSON.parse(fit.dataset.fit), f = F.methods[t.answers.method], m = F.names[t.answers.method];
    const mine = t.picks.find((p) => p.slug === F.slug);
    if (f) {
      fit.textContent = (mine ? `Из вашего подбора. ` : "") + (f.ok
        ? `Ваш способ — ${m.toLowerCase()}: ${f.omni ? "омни-обжарка" : F.roast[f.roast]}, ${F.grind[f.grind]}.`
        : `Для вашего способа — ${m.toLowerCase()} — не подходит: его обжариваем только ${F.roast[F.roasts[0]].replace("обжарка ", "")}.`);
      fit.hidden = false;
      const q = new URLSearchParams(location.search), bar = document.querySelector("[data-buybar]");
      if (f.ok && bar && !q.has("roast") && !q.has("grind")) for (const [k, v] of [["roast", f.roast], ["grind", f.grind]]) {
        const r = [...bar.querySelectorAll(`input[name="${k}"]`)].find((x) => x.value === v);
        if (r && !r.checked) { r.checked = true; r.dispatchEvent(new Event("change", { bubbles: true })); }
      }
    }
  }
  // «Впечатления» on a coffee's page: how close each teller's taste is to the visitor's, now from the quiz's region
  // (src/templates/people.mjs drew it against the account's placeholder purchases)
  const people = document.querySelector("[data-people][data-close]");
  if (people && t.region) {
    const { w, close } = JSON.parse(people.dataset.close), c = t.region.center;
    for (const li of people.querySelectorAll("[data-pos]")) {
      const [bright, body, unusual] = li.dataset.pos.split(",").map(Number), pos = { bright, body, unusual };
      const g = Math.sqrt(Object.keys(w).reduce((s, k) => s + (w[k] * (pos[k] - c[k])) ** 2, 0));
      const line = li.querySelector(".buyer__close");
      if (!line) continue;
      line.querySelector("i")?.style.setProperty("--fill", Math.max(0.08, Math.min(1, 1 - g / 2.5)).toFixed(2));
      line.lastChild.textContent = close.find(([max]) => g < max)[1];
    }
  }
  // the profile: what the quiz said
  const part = document.querySelector("[data-taste-part]");
  if (part) {
    part.querySelector("[data-taste-list]").innerHTML = t.picks.map((p) => `<li><a class="link" href="${rootHref()}coffee/${esc(p.slug)}/">${esc(p.name)}</a> <span class="taste-part__label">${esc(p.label)}</span></li>`).join("");
    part.querySelector("[data-taste-again]").setAttribute("href", quizHref(t));
    part.hidden = false;
  }
}

export { save };
