// The quiz's result, kept in this browser until the account has a backend (localStorage "qq-taste"; docs/quiz.md says
// what a backend keeps): the answers, the region on the taste map, the three coffees. Read by
//   the catalogue      «Для вас», the first checkbox, in place of the line «Выбираете впервые?» (scripts/filters.js,
//                      through loadTaste and loadFeedback: the coffees inside the region, choose.js forYou)
//   a coffee's page    [data-fit]: whether QQ roasts it for the visitor's way of brewing, and with what grind; the buy
//                      bar starts on that roast and grind (unless the address chose them: ?roast=…&grind=…)
//   «Впечатления»      [data-people][data-close]: how close each teller's taste is to the visitor's quiz region
//   the profile        [data-taste-part]: what the quiz said, with a way back to it
// The feedback after delivery (session 6, scripts/feedbackpage.js) keeps its answers and the region they moved the
// visitor to in localStorage "qq-feedback" ({ v: 1, answers, region, mine: { slug: text } }): «Впечатления» then
// measures closeness from that region, and a coffee's page says what the visitor said about it ([data-mine]).
import { load, save } from "./buy.js";

export const TASTE = "qq-taste";
// a record of another shape (an older version, a hand edit) counts as none
const num = (x) => Number.isFinite(x);
export const loadTaste = () => {
  const t = load(TASTE, {});
  const ok = t && t.v === 1 && t.answers && typeof t.answers === "object" && Array.isArray(t.picks) && t.picks.every((p) => p && p.slug && p.name)
    && t.region?.center && ["bright", "body", "unusual"].every((k) => num(t.region.center[k]) && num(t.region.spread?.[k]));
  return ok ? t : null;
};
// true when it is really kept (private mode or a full storage keep nothing)
export const saveTaste = (t) => {
  const rec = { v: 1, at: new Date().toISOString(), ...t };
  save(TASTE, rec);
  try { return localStorage.getItem(TASTE) === JSON.stringify(rec); } catch { return false; }
};

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const rootHref = () => document.documentElement.dataset.root || "";
const quizHref = (t) => `${rootHref()}start/?${new URLSearchParams(t.answers)}`;

export const FEEDBACK = "qq-feedback";
export const loadFeedback = () => {
  const f = load(FEEDBACK, {});
  if (!f || f.v !== 1 || !Array.isArray(f.answers)) return null;
  // a hand edit or an older shape: keep only answers that name a bag
  return { ...f, answers: f.answers.filter((a) => a && typeof a === "object" && typeof a.order === "string" && typeof a.slug === "string") };
};

export function initSaved() {
  const t = loadTaste(), f = loadFeedback();
  // «Впечатления» and a coffee's own line read the feedback's region and answers, which need no quiz
  const region = f?.region?.center && ["bright", "body", "unusual"].every((k) => num(f.region.center[k])) ? f.region : t?.region;
  for (const part of [() => region && people({ region }), () => f && mine(f)]) try { part(); } catch (e) { console.warn("qq-feedback:", e); }
  if (!t) return;
  // each reader on its own: one that fails leaves the others working
  for (const part of [coffeePage, profile]) try { part(t); } catch (e) { console.warn("qq-taste:", e); }
}

// a coffee's page: what the visitor said about it after a delivery, this browser's newer answer in place of the page's
function mine(f) {
  const el = document.querySelector("[data-mine]"), text = el && f.mine?.[el.dataset.mine];
  if (text) { el.textContent = text; el.hidden = false; }
}

// a coffee's page: the visitor's way of brewing, and whether it is one of the three
function coffeePage(t) {
  const fit = document.querySelector("[data-fit]");
  if (!fit) return;
  const F = JSON.parse(fit.dataset.fit), mine = t.picks.find((p) => p.slug === F.slug);
  const f = t.answers.method && t.answers.method !== "none" ? F.methods[t.answers.method] : null, m = f && F.names[t.answers.method];
  if (!f && !mine) return;
  fit.textContent = (mine ? `Из вашего подбора. ` : "") + (!f ? "" : f.ok
    ? `Ваш способ — ${m.toLowerCase()}: ${f.omni ? "омни-обжарка" : F.roast[f.roast]}, ${F.grind[f.grind]}.`
    : `Ваш способ — ${m.toLowerCase()} — не подходит: этот кофе обжариваем только ${F.roast[F.roasts[0]].replace("обжарка ", "")}.`);
  fit.hidden = false;
  // the buy bar starts on the method's roast and grind, unless the address chose them (a card's link from the catalogue)
  const q = new URLSearchParams(location.search), bar = document.querySelector("[data-buybar]");
  if (f?.ok && bar && !q.has("roast") && !q.has("grind")) for (const [k, v] of [["roast", f.roast], ["grind", f.grind]]) {
    const r = [...bar.querySelectorAll(`input[name="${k}"]`)].find((x) => x.value === v);
    if (r && !r.checked) { r.checked = true; r.dispatchEvent(new Event("change", { bubbles: true })); }
  }
}

// «Впечатления» on a coffee's page: how close each teller's taste is to the visitor's, from the region the feedback
// after delivery moved them to, else the quiz's (src/templates/people.mjs drew it against the account's placeholder)
function people(t) {
  const people = document.querySelector("[data-people][data-close]");
  if (people) {
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
}

// the profile: what the quiz said
function profile(t) {
  const part = document.querySelector("[data-taste-part]");
  if (part) {
    part.querySelector("[data-taste-list]").innerHTML = t.picks.map((p) => `<li><a class="link" href="${rootHref()}coffee/${esc(p.slug)}/">${esc(p.name)}</a> <span class="taste-part__label">${esc(p.label)}</span></li>`).join("");
    part.querySelector("[data-taste-again]").setAttribute("href", quizHref(t));
    part.hidden = false;
  }
}

export { save };
