// The feedback after delivery, as the account shows it (session 6; docs/feedback.md): what each answer's reply says,
// what an order's row and a purchase card say, the profile's question. The same in the build (src/templates/account.mjs
// writes the placeholder visitor's state into the page) and in the browser (scripts/feedbackpage.js redraws it with this
// browser's answers). The arithmetic is src/scripts/feedback.js; the words are data/feedback.json.
//
// acc: { today, orders: [{ id, status, delivered, date, items: [{ slug, roast, grind }] }], first: [slugs], bought: [slugs] }
import { replay, baseRegion, nextOf, tasteName, askState, methodFor, saidOf, shiftOf, isTaste, area, plural } from "./feedback.js";

const fill = (s, o) => s.replace(/\{(\w+)\}/g, (_, k) => o[k] ?? "");
const capFirst = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
const and = (list) => (list.length > 1 ? `${list.slice(0, -1).join(", ")} и ${list.at(-1)}` : list[0] || "");
const MONTHS = ["январе", "феврале", "марте", "апреле", "мае", "июне", "июле", "августе", "сентябре", "октябре", "ноябре", "декабре"];
const DAYS = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
const dayOf = (iso) => { const d = new Date(iso.slice(0, 10) + "T00:00:00Z"); return `${d.getUTCDate()} ${DAYS[d.getUTCMonth()]}`; };
const key = (a) => `${a.order}/${a.slug}`;

// every answer (the placeholder's, then this browser's: a later one about the same coffee of the same order replaces
// it), each with the roast of its order; the visitor's state; what comes next; the last method and milk
export function stateOf(acc, answers, F, { quiz = null } = {}) {
  const roastOf = new Map(acc.orders.flatMap((o) => o.items.map((it) => [`${o.id}/${it.slug}`, it.roast])));
  const kind = (a) => `${key(a)}/${a.issue ? "issue" : "taste"}`;
  const list = [...new Map(answers.filter((a) => roastOf.has(key(a))).map((a) => [kind(a), { ...a, roast: roastOf.get(key(a)) }])).values()];
  const base = baseRegion({ quiz, first: acc.first }, F);
  const st = replay(base, list, F);
  const last = [...list].sort((x, y) => String(x.at).localeCompare(String(y.at))).reverse().find((a) => a.method && !a.issue);
  const need = [...list].sort((x, y) => String(x.at).localeCompare(String(y.at))).reverse().find((a) => a.need)?.need || null;
  const opts = { method: last?.method || null, milk: !!last?.milk, bought: acc.bought };
  // per bag, the answer the form shows: the taste one when there is one, else the issue
  const byKey = new Map();
  for (const a of list) if (!byKey.has(key(a)) || (byKey.get(key(a)).issue && !a.issue)) byKey.set(key(a), a);
  return { base, st, answers: list, byKey, next: nextOf(st, F, opts), name: tasteName(st, F), opts, need,
    area: area(st.region, F), trail: [base.region, ...st.steps.filter((x) => x.w > 0).map((x) => x.after)].map((r) => area(r, F)) };
}

// the reply under one answer: what was said, how it counted, how the visitor moved, and what comes next from there
export function replyOf(S, acc, a, F) {
  const W = F.words, i = S.st.steps.findIndex((x) => key(x.a) === key(a) && !!x.a.issue === !!a.issue);
  const step = S.st.steps[i];
  if (!step) return null;
  if (a.issue) {
    const I = F.rules.issues[a.issue];
    const need = a.issue === "grind" && a.need ? I.need[a.need]?.[1] : "";
    return { said: I.label, issue: a.issue, lines: [I.reply, need].filter(Boolean), next: null };
  }
  // what came next right after this answer (later answers have moved the visitor on since: the profile shows those)
  const upTo = { ...S.st, steps: S.st.steps.slice(0, i + 1), region: step.after, n: S.st.steps.slice(0, i + 1).filter((x) => x.w > 0).length };
  const n = nextOf(upTo, F, { method: a.method || S.opts.method, milk: !!a.milk, bought: acc.bought });
  const shift = shiftOf(step.before, step.after, F, a);
  const lines = [];
  if (step.why === "roast") lines.push(fill(W.half, { roast: W.roastFor[a.roast] || "", method: W.methodIn[a.method] || "" }));
  lines.push(shift ? fill(W.moved, { where: shift }) : W.surer);
  // one coffee named in the reply: the move, or after «в самый раз» the first new one (the profile shows all three)
  const pick = n.mode === "again" ? n.picks.find((p) => p.role !== "again") : n.picks[0];
  const move = n.mode === "move" ? pick.label.toLowerCase() : "";
  const line = fill(W.nextLine[n.mode] || W.nextLine.none, { move });
  // an issue about the same bag is said too (both are kept: taste moves the visitor, the issue goes to QQ)
  const issue = S.answers.find((x) => x.issue && key(x) === key(a));
  if (issue) lines.push(`${F.rules.issues[issue.issue].label}: ${[F.rules.issues[issue.issue].reply, issue.issue === "grind" && issue.need ? F.rules.issues.grind.need[issue.need]?.[1] : ""].filter(Boolean).join(" ")}`);
  return { said: saidOf(a, F), lines, next: pick ? { slug: pick.slug, name: pick.name, label: pick.label, line } : null, mode: n.mode };
}

// an order's line in the list of orders
export function rowOf(S, o, today, F) {
  const W = F.words, A = askState(o, today, F);
  // not delivered yet: nothing said (Tim, 26 Nov: no «Спросим после доставки»)
  if (o.status !== "delivered") return { kind: "later", text: "" };
  const done = o.items.filter((it) => S.byKey.has(`${o.id}/${it.slug}`)).length;
  if (done === o.items.length) return { kind: "done", text: fill(W.rowDone, { n: done, all: o.items.length }) };
  if (!A.ask) return { kind: "wait", text: fill(W.rowWait, { date: dayOf(addDays(o.delivered, A.from)) }) };
  return { kind: "ask", text: done ? fill(W.rowSome, { n: done, all: o.items.length }) : W.rowAsk };
}
const addDays = (iso, n) => new Date(Date.parse(iso.slice(0, 10)) + n * 864e5).toISOString().slice(0, 10);

// the profile's question: the newest delivered order with coffee not answered about, while it is not old
// (Tim, 26 Nov: the coffees in the title, «Как вам Эфиопия Бекеле?»; the text only «Поделитесь впечатлениями — …»);
// `key` names the order and its coffees, so a closed question (×) stays closed until another order asks
export function promptOf(S, acc, today, F) {
  for (const o of [...acc.orders].sort((x, y) => y.date.localeCompare(x.date))) {
    const A = askState(o, today, F);
    if (!A.ask || A.quiet) continue;
    const left = o.items.filter((it) => !S.byKey.has(`${o.id}/${it.slug}`));
    if (left.length) return { order: o.id, key: `${o.id}:${left.map((it) => it.slug).join(",")}`, title: fill(F.words.promptTitle, { names: and(left.map((it) => it.name)) }), text: F.words.prompt };
  }
  return null;
}

// a coffee bought: what was last said about it, or a way to answer
export function purchaseOf(S, acc, slug, today, F) {
  const W = F.words;
  const mine = [...S.answers].filter((a) => a.slug === slug).sort((x, y) => String(y.at).localeCompare(String(x.at)))[0];
  if (mine) return { kind: "done", order: mine.order, text: mine.issue ? F.rules.issues[mine.issue].label : fill(W.cardSaid, { said: capFirst(saidOf(mine, F)) }) };
  const o = [...acc.orders].sort((x, y) => y.date.localeCompare(x.date)).find((x) => x.items.some((it) => it.slug === slug));
  if (!o || o.status !== "delivered") return { kind: "later", order: o?.id, text: "" };
  return { kind: "ask", order: o.id, text: W.cardAsk };
}

// on a coffee's page: what the visitor said about it, and when («Вы брали его в июле: «слишком ярко»»)
export function mineOf(answers, slug, F, orders = []) {
  const a = [...answers].filter((x) => x.slug === slug).sort((x, y) => String(y.at).localeCompare(String(x.at)))[0];
  if (!a) return null;
  // when it was bought: the order's date (an answer may come weeks later)
  const o = orders.find((x) => x.id === a.order), at = o?.date || a.at;
  const when = `в ${MONTHS[new Date(at.slice(0, 10) + "T00:00:00Z").getUTCMonth()]}`;
  return a.issue ? fill(F.words.mineIssue, { when, said: F.rules.issues[a.issue].label.toLowerCase() }) : fill(F.words.mine, { when, said: saidOf(a, F) });
}

// the form's starting values for one coffee of an order: the method its grind implies (else the last one), milk as last
export function formStart(S, it, F) {
  const method = methodFor(it, S.opts.method, F);
  // milk as the visitor last drank coffee brewed this way (a pour-over black, a machine's with milk), else without
  const same = [...S.answers].filter((a) => a.method === method).sort((x, y) => String(y.at).localeCompare(String(x.at)))[0];
  return { method, milk: !!same?.milk };
}

// the reply's markup (the template and the browser write the same); root is the site's root (href / data-root)
const esc = (x) => String(x ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
export function replyHtml(r, slug, F, root) {
  const W = F.words;
  const next = r.next ? `<p class="fb__next">${esc(r.next.line)} <a class="link" href="${root}coffee/${r.next.slug}/">${esc(r.next.name)}</a>. <a class="link" href="${root}account/#next">${esc(W.allNext)}</a></p>` : "";
  // what was ticked, in quotes and larger; the buttons at the home page's size: «Рассказать на странице кофе» filled,
  // «Изменить ответ» outlined on its right (Tim, 26 Nov)
  const said = String(r.said || ""), cap = said ? said[0].toUpperCase() + said.slice(1) : said;
  return `<p class="fb__said">«${esc(cap)}»</p>
          ${r.lines.map((l) => `<p class="fb__line">${esc(l)}</p>`).join("\n          ")}
          ${next}
          <p class="fb__actions">${r.issue ? "" : `<a class="btn btn--text" href="${root}coffee/${slug}/#people">${esc(W.share)}</a> `}<button class="btn btn--text btn--line" type="button" data-fb-edit>${esc(r.issue ? W.editTaste : W.edit)}</button></p>`;
}

export { isTaste, plural };
