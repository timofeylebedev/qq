// The account worked out from its orders (data/account.json, a placeholder visitor): every order with its coffees,
// prices and totals; the purchases (each coffee once, how many times bought, the last choice); the numbers of the
// profile (lots, processes, the best Q score), the countries, the descriptors tried, the taste profile; the history of
// the beans. Pages read this, so every number on them adds up.
import { read } from "./util.mjs";
import { askState } from "../scripts/feedback.js";
import { stateOf } from "../scripts/feedbackview.js";

const MONTHS = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
const MONTHS_SHORT = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
export const dateShort = (iso) => { const d = new Date(iso); return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`; };
export const dateTime = (iso) => `${dateShort(iso)}, ${iso.slice(11, 16)}`;
export const monthOf = (iso) => MONTHS[new Date(iso).getMonth()];

const STATUS = {
  roasting: () => ["Ожидает обжарки", "now"],
  shipping: () => ["Передан в доставку", "now"],
  delivered: (o) => [`Доставлен ${dateShort(o.delivered)}`, "done"]
};

export function account(products) {
  const a = read("data/account.json");
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const orders = a.orders.map((o) => {
    const items = o.items.map((it) => {
      const p = bySlug.get(it.slug);
      if (!p) throw new Error(`account.json: no coffee ${it.slug}`);
      const w = p.weights.find((x) => x.label === it.weight) || p.weights[0];
      const roast = p.roasts.find((r) => r.use === it.roast) || p.roasts[0];
      return { ...it, p, price: w.price, sum: w.price * it.qty, roastText: roast?.level ? `${roast.level} обжарка` : roast?.use || "" };
    });
    const goods = items.reduce((s, x) => s + x.sum, 0), count = items.reduce((s, x) => s + x.qty, 0);
    const spent = o.beansSpent || 0;
    const total = goods + o.delivery.price - spent;
    const [statusText, statusKind] = STATUS[o.status](o);
    return { ...o, items, goods, count, total, spent, earned: Math.round(goods * a.beans.earn), statusText, statusKind, names: [...new Set(items.map((x) => x.p.name))] };
  });

  // purchases: each coffee once, the newest choice first, with how many packs of it were bought
  const seen = new Map();
  for (const o of orders) for (const it of o.items) {
    const s = seen.get(it.slug);
    if (s) s.count += it.qty; else seen.set(it.slug, { ...it, count: it.qty, order: o.id });
  }
  const purchases = [...seen.values()];
  const coffees = purchases.map((x) => x.p);

  // the numbers of the profile, from the coffees bought
  const lots = new Set(coffees.flatMap((p) => p.composition.length ? p.composition.map((c) => c.lot) : [p.name]));
  const processes = new Set(coffees.flatMap((p) => p.processes));
  const q = Math.max(0, ...coffees.map((p) => p.q || 0));
  const stats = [[lots.size, plural(lots.size, "Лот", "Лота", "Лотов")], [processes.size, plural(processes.size, "Обработка", "Обработки", "Обработок")], [String(q).replace(".", ","), "Q максимум"]];

  // countries: how many coffees of each were bought (a blend counts for each of its countries)
  const countries = new Map();
  for (const x of purchases) for (const c of x.p.countries) countries.set(c, (countries.get(c) || 0) + x.count);
  const countryList = [...countries].sort((x, y) => y[1] - x[1]);

  // descriptors: of every descriptor in the catalog, those of the coffees bought
  const all = [...new Set(products.flatMap((p) => p.descriptors))];
  const tried = new Set(coffees.flatMap((p) => p.descriptors));

  // the taste profile: the four scales of the coffees bought, weighted by how often
  const n = purchases.reduce((s, x) => s + x.count, 0) || 1;
  const avg = (k) => purchases.reduce((s, x) => s + (x.p.taste[k] ?? 0) * x.count, 0) / n;
  const taste = { density: avg("density"), acidity: avg("acidity"), sweetness: avg("sweetness"), ferment: avg("ferment") };

  // beans: what came in (1% of each delivered order) and what orders spent; the balance from the opening one; the
  // bars by month (earlier months from beans.before, the months of these orders from them); the level and the next
  const earned = orders.filter((o) => o.status === "delivered").map((o) => ({ o, amount: o.earned }));
  const spentList = orders.filter((o) => o.spent).map((o) => ({ o, amount: -o.spent }));
  const balance = a.beans.opening + earned.reduce((s, x) => s + x.amount, 0) + spentList.reduce((s, x) => s + x.amount, 0);
  const SHORT = ["Янв", "Фев", "Мар", "Апр", "Май", "Июнь", "Июль", "Авг", "Сен", "Окт", "Ноя", "Дек"];
  const byMonth = new Map(a.beans.before);
  for (const x of earned) { const m = SHORT[new Date(x.o.date).getMonth()]; byMonth.set(m, (byMonth.get(m) || 0) + x.amount); }
  const monthly = a.beans.months.map((m) => [m, byMonth.get(m) || 0]);
  const [level, next] = levelOf({ ...a.beans, balance });

  return { ...a, orders, purchases, coffees, stats, countries: countryList, descriptors: { all: all.length, tried: tried.size }, taste,
    beans: { ...a.beans, balance, monthly, level, next, earned, spent: spentList }, fb: feedback(a, orders, purchases) };
}

// ── the feedback after delivery (session 6; docs/feedback.md) ────────────────────────────────────────────────────
// The placeholder's answers (data/account.json feedback), each with the roast of its order, and the visitor's state
// worked out once, by src/scripts/feedbackview.js stateOf (the browser does the same with this browser's answers added:
// scripts/feedbackpage.js). The visitor starts from the first order's coffees (the account has no quiz of its own).
const F = read("src/data/feedback.json");
export function feedback(a, orders, purchases) {
  const today = a.today || new Date().toISOString().slice(0, 10);
  const answers = (a.feedback?.answers || []).map((x) => {
    const it = orders.find((y) => y.id === x.order)?.items.find((i) => i.slug === x.slug);
    if (!it) throw new Error(`account.json feedback: order ${x.order} has no ${x.slug}`);
    return { ...x, roast: it.roast };
  });
  const first = [...orders].sort((x, y) => x.date.localeCompare(y.date))[0];
  const bought = purchases.map((x) => x.slug);
  const lite = { today, first: first ? first.items.map((x) => x.slug) : [], bought,
    orders: orders.map((o) => ({ id: o.id, status: o.status, date: o.date, delivered: o.delivered || null, items: o.items.map((it) => ({ slug: it.slug, name: it.p.name, roast: it.roast, grind: it.grind })) })) };
  const S = stateOf(lite, answers, F);
  return { F, today, answers, lite, S, st: S.st, bought, asks: orders.map((o) => ({ id: o.id, ...askState(o, today, F) })) };
}

function levelOf(b) {
  const sorted = [...b.levels].sort((x, y) => x[1] - y[1]);
  let i = 0; while (i + 1 < sorted.length && b.balance >= sorted[i + 1][1]) i++;
  const cur = sorted[i], nxt = sorted[i + 1];
  return [cur[0], nxt ? { name: nxt[0], left: nxt[1] - b.balance, share: (b.balance - cur[1]) / (nxt[1] - cur[1]) } : null];
}
export function plural(n, one, few, many) {
  const m10 = n % 10, m100 = n % 100;
  return m10 === 1 && m100 !== 11 ? one : m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20) ? few : many;
}
