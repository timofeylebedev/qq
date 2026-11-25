// Helpers every form of the people bench may use (window.QQKit). Data: window.QQ_DATA (data.js, from build.mjs):
//   coffees[]                 every coffee: slug, name, short, descriptors, coded {density, acidity, sweetness, ferment},
//                             position {bright, body, unusual, sweet} (the taste model's), map {x, y} (2D map of all 25), use, roasts, price
//   pages[slug]               the people of one coffee's page: count, verified, bright {less, ok, more}, body {…},
//                             groups [{ id: espresso|pot|filter|milk, label, n, bright, body }], heard [{ d, n }],
//                             reviews [{ id, who, date, verified, cups, method, milk, answers {bright, body}, heard [], text }],
//                             issues [{ id, who, issue: grind|described, text, reply, method, milk, date }],
//                             picks [{ who, why, recipe, real? }]  (named people who pick this coffee)
//   people.people[]           customers: id, name, city, method, milk, usual {slug|style, label}, pos {bright, body, unusual}, likes
//   people.named[]            named people: id, kind (team|ambassador), placeholder, name, status, where, how, method, milk,
//                             about, pos, likes, picks [slug], not {slug, why} — the team's «Выбор Ксюши» is REAL data
//   people.answers            { bright: {less, ok, more, title}, body: {…} } — the answer words
//   people.methods            { id: { label, group, roast } }, people.groups { espresso, pot, filter, milk: label }
//   dots[descriptor]          its dot colour on the site (#hex)
//   visitors[]                the bench's pretend visitors: { id, label, method, milk, region {center, spread} | null }
(() => {
  const D = window.QQ_DATA;
  const coffee = Object.fromEntries(D.coffees.map((c) => [c.slug, c]));
  const person = Object.fromEntries([...D.people.people, ...D.people.named].map((p) => [p.id, p]));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
  const plural = (n, one, few, many) => { const a = n % 10, b = n % 100; return a === 1 && b !== 11 ? one : a >= 2 && a <= 4 && (b < 10 || b >= 20) ? few : many; };
  const MONTHS = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
  const date = (iso) => { const d = new Date(iso); return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`; };
  const cup = (p) => `${D.people.methods[p.method]?.label || p.how || ""}${p.milk ? ", с молоком" : ""}`;
  // closeness of two tastes on the visible axes (the taste model's weights): words, never a percent
  const W = { bright: 1, body: 0.75, unusual: 0.85 };
  const gap = (a, b) => Math.sqrt(Object.keys(W).reduce((s, k) => s + (W[k] * ((a[k] ?? 0) - (b[k] ?? 0))) ** 2, 0));
  const near = (a, b) => { const g = gap(a, b); return g < 0.8 ? "близко" : g < 1.6 ? "отчасти" : "далеко"; };
  // what two tastes share, in words («оба любите яркое»)
  function shared(a, b) {
    const w = [];
    if (Math.abs(a.bright - b.bright) < 0.8) w.push(a.bright >= 3.4 ? "яркое" : a.bright <= 2.2 ? "мягкое" : "умеренную кислотность");
    if (Math.abs(a.body - b.body) < 0.8) w.push(a.body >= 4 ? "плотное" : a.body <= 2.5 ? "лёгкое" : "среднюю плотность");
    if (a.unusual >= 1.5 && b.unusual >= 1.5) w.push("необычное");
    return w;
  }
  // the one marker every form uses for invented content
  const placeholder = (text = "Пример: настоящих отзывов ещё нет") => `<span class="qq-ph" title="Заглушка: магазина и отзывов ещё нет">${esc(text)}</span>`;
  // a customer's grammatical gender, from the first name («Никита» is the pool's one -а man): «купил» / «купила»
  const fem = (p) => /[ая]$/.test(p.name.split(" ")[0]) && !/^Никита/.test(p.name);
  const ending = (p, word) => word + (fem(p) ? "а" : "");
  window.QQKit = { D, coffee, person, esc, plural, date, cup, gap, near, shared, placeholder, fem, ending };
})();
