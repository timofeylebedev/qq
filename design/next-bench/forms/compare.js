// «Сравнение»: the block as a comparison table. This coffee is the first column (sticky on the left; it also carries
// the rows' names), then one column per move that has a coffee, headed by the move's label. Everything that differs
// from this coffee is ink, everything the same is grey; the dot scales show this coffee as a ring and the other as a
// dot, joined by a stroke, with the word of the change (мягче, плотнее…). A move without a coffee (edge, self) is a
// narrow cloud column with its statement. Below L the columns scroll sideways inside the block, never the page.
(() => {
  const P = "f-compare";
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const num = (v) => String(v).replace(".", ",");
  const rub = (n) => (n == null ? "—" : n.toLocaleString("ru-RU").replace(/\s/g, " ") + " ₽");
  const href = (slug) => `#coffee/${slug}`;

  // the three scales QQ codes (sweetness is 3–5 everywhere, the taste model never shows it as an axis)
  const SCALES = [
    { k: "acidity", name: "Кислотность", from: 1, of: 5, up: "ярче", down: "мягче" },
    { k: "density", name: "Плотность", from: 1, of: 5, up: "плотнее", down: "легче" },
    { k: "ferment", name: "Фермент", from: 0, of: 4, up: "необычнее", down: "классичнее" },
  ];
  // which row a move is about: its own reason gets the filled chip
  const AXIS = { softer: "acidity", brighter: "acidity", unusual: "ferment", classic: "ferment", milk: "use" };
  const MILK = "Молочные напитки";

  // one scale as the site draws it: five small dots; this coffee's value a ring, the other's a dot, a stroke between
  const STEP = 18, R = 5, W = R * 2 + 4 * STEP, H = 20;
  function scale(s, mine, theirs) {
    const x = (v) => R + (v - s.from) * STEP, y = H / 2;
    const grid = [0, 1, 2, 3, 4].map((j) => `<circle class="${P}-g" cx="${R + j * STEP}" cy="${y}" r="1.5"/>`).join("");
    let marks;
    if (theirs == null) marks = `<circle class="${P}-d" cx="${x(mine)}" cy="${y}" r="${R}"/>`;
    else if (theirs === mine) marks = `<circle class="${P}-d is-same" cx="${x(mine)}" cy="${y}" r="${R}"/>`;
    else marks = `<line class="${P}-l" x1="${x(mine)}" y1="${y}" x2="${x(theirs)}" y2="${y}"/><circle class="${P}-r" cx="${x(mine)}" cy="${y}" r="4.5"/><circle class="${P}-d" cx="${x(theirs)}" cy="${y}" r="${R}"/>`;
    return `<svg class="${P}-sc" viewBox="0 0 ${W} ${H}" aria-hidden="true" focusable="false">${grid}${marks}</svg>`;
  }

  // the columns, in the moves' order; a shared move is one column with both labels; sold out: the lead first
  function columns(c, by, soldOut) {
    const nx = c.next, cols = [];
    const moves = soldOut ? nx.soldOut.moves : nx.moves;
    if (soldOut && nx.soldOut.lead) {
      const L = nx.soldOut.lead, joins = moves.filter((m) => m.joinsLead);
      cols.push({ kind: "coffee", lead: true, labels: ["Ближе всего", ...joins.map((m) => m.label)], axes: joins.map((m) => AXIS[m.id]).filter(Boolean),
        milk: joins.some((m) => m.id === "milk"), coffee: by[L.slug], far: L.far, line: L.line });
    }
    for (const m of moves) {
      if (m.joinsLead || m.sharedWith) continue;
      if (m.edge || m.self) { cols.push({ kind: m.self ? "self" : "edge", labels: [m.label], line: m.line }); continue; }
      if (!m.slug || !by[m.slug]) continue;
      const all = [m, ...(m.also || [])];
      cols.push({ kind: "coffee", labels: all.map((x) => x.label), axes: all.map((x) => AXIS[x.id]).filter(Boolean),
        milk: all.some((x) => x.id === "milk"), coffee: by[m.slug], far: m.far, farMilk: m.id === "milk", line: m.line });
    }
    return cols;
  }

  const cap = (text, ghost) => `<span class="${P}-cap"${ghost ? ' aria-hidden="true"' : ""}>${ghost ? " " : esc(text)}</span>`;

  function render(root, ctx) {
    const c = ctx.coffee, by = ctx.by, out = !!ctx.soldOut;
    const cols = columns(c, by, out);
    const nC = cols.filter((x) => x.kind === "coffee").length, nE = cols.length - nC;
    const lead = out && cols[0] && cols[0].lead ? cols[0].coffee : null;
    const has = (list, v) => list.some((x) => x.toLowerCase() === v.toLowerCase());

    // ── head row
    const headThis = `<th scope="col" class="${P}-this ${P}-h"><span class="${P}-lab">Этот</span>
      <span class="${P}-name">${esc(c.name)}</span>
      ${c.decaf ? `<span class="${P}-note">без кофеина</span>` : ""}
      ${out ? `<span class="${P}-out">Лота пока нет, скоро вернётся</span>` : `<span class="${P}-price">${rub(c.price)}</span>`}</th>`;
    const headCols = cols.map((col, i) => {
      const n = i + 1;
      if (col.kind !== "coffee") return `<th scope="col" class="${P}-e ${P}-h" data-col="${n}"><span class="${P}-lab">${esc(col.labels[0])}</span><span class="${P}-stmt">${esc(col.line)}</span></th>`;
      const o = col.coffee, farNote = col.far ? (col.farMilk ? "ближе для молока нет" : "ближе нет, но заметно другой") : "";
      return `<th scope="col" class="${P}-c ${P}-h${col.lead ? ` ${P}-lead` : ""}" data-col="${n}">
        <a class="${P}-go" href="${href(o.slug)}"><span class="${P}-lab">${col.labels.map(esc).join(" · ")}</span>
        ${farNote ? `<span class="${P}-far">${farNote}</span>` : ""}
        <span class="${P}-name">${esc(o.name)}</span>
        ${c.decaf && !o.decaf ? `<span class="${P}-note">с кофеином</span>` : ""}
        <span class="${P}-price${o.price === c.price ? " is-same" : ""}">${rub(o.price)}</span></a></th>`;
    }).join("");

    // ── body rows: the first cell (this coffee) names the row; the others leave the same room above their content
    const row = (key, label, mine, each) => `<tr data-row="${key}"><th scope="row" class="${P}-this">${cap(label)}${mine}</th>${cols.map((col, i) =>
      col.kind === "coffee" ? `<td class="${P}-c" data-col="${i + 1}" data-href="${href(col.coffee.slug)}">${cap("", true)}${each(col)}</td>` : `<td class="${P}-e" data-col="${i + 1}"></td>`).join("")}</tr>`;

    const scaleRows = SCALES.map((s) => row(s.k, s.name,
      `<span class="${P}-v">${scale(s, c.coded[s.k])}<span class="${P}-sr">${num(c.coded[s.k])} из ${s.of}</span></span>`,
      (col) => {
        const a = c.coded[s.k], b = col.coffee.coded[s.k], same = a === b, own = col.axes.includes(s.k);
        const word = same ? "так же" : b > a ? s.up : s.down;
        return `<span class="${P}-v">${scale(s, a, b)}<span class="${P}-w${same ? " is-same" : ""}${own ? ` ${P}-own` : ""}">${word}</span><span class="${P}-sr">${num(b)} из ${s.of}</span></span>`;
      })).join("");

    const descRow = row("desc", "Во вкусе", `<span class="${P}-list">${c.descriptors.map((d) => `<span>${esc(d)}</span>`).join(", ")}</span>`,
      (col) => `<span class="${P}-list">${col.coffee.descriptors.map((d) => `<span${has(c.descriptors, d) ? ' class="is-same"' : ' class="is-new"'}>${esc(d)}</span>`).join(", ")}</span>`);

    const useRow = row("use", "QQ советует для", `<span class="${P}-tags">${c.use.map((u) => `<span>${esc(u)}</span>`).join("")}</span>`,
      (col) => `<span class="${P}-tags">${col.coffee.use.map((u) => {
        const own = col.milk && u === MILK, same = has(c.use, u);
        return `<span class="${own ? `${P}-own` : same ? "is-same" : "is-new"}">${esc(u)}</span>`;
      }).join("")}${col.coffee.use.length ? "" : '<span class="is-same">—</span>'}</span>`);

    const lineRow = row("line", "Коротко", `<span class="${P}-line">${esc(c.short)}</span>`, (col) => `<span class="${P}-line">${esc(col.line)}</span>`);

    const ring = `<svg class="${P}-key-i" viewBox="0 0 12 12" aria-hidden="true"><circle class="${P}-r" cx="6" cy="6" r="4.5"/></svg>`;
    const dot = `<svg class="${P}-key-i" viewBox="0 0 12 12" aria-hidden="true"><circle class="${P}-d" cx="6" cy="6" r="5"/></svg>`;
    const decaf = !c.decaf && c.next.decaf && by[c.next.decaf.slug];

    root.innerHTML = `<div class="${P}${out ? " is-out" : ""}">
      <header class="${P}-top">
        <h2 class="${P}-title">${out ? "Что взять, пока его нет" : "Что взять дальше"}</h2>
        <p class="${P}-lede">${out ? `Лота пока нет, скоро вернётся — ближе всего <b>${esc(lead.name)}</b>${cols[0].far ? ", но в остальном заметно другой" : ""}.` : "Этот кофе и по одному соседу в каждую сторону."}
          <span class="${P}-key">${ring} этот кофе, ${dot} соседний. <b>Чёрным</b> — чем отличается, <span class="is-same">серым</span> — то же, что у этого.</span></p>
        <div class="${P}-nav" hidden><button type="button" class="${P}-btn" data-dir="-1" aria-label="Предыдущие колонки">←</button><button type="button" class="${P}-btn" data-dir="1" aria-label="Следующие колонки">→</button></div>
      </header>
      <div class="${P}-scroll" role="region" aria-label="Сравнение с соседними кофе" tabindex="0">
        <table class="${P}-t" style="--n-c: ${nC}; --n-e: ${nE}">
          <colgroup><col class="${P}-k-this">${cols.map((col) => `<col class="${P}-k-${col.kind === "coffee" ? "c" : "e"}">`).join("")}</colgroup>
          <thead><tr>${headThis}${headCols}</tr></thead>
          <tbody>${scaleRows}${descRow}${useRow}${lineRow}</tbody>
        </table>
      </div>
      ${decaf ? `<a class="${P}-decaf" href="${href(decaf.slug)}"><span class="${P}-lab">Без кофеина</span> ${esc(decaf.name)} — ${esc(c.next.decaf.line.replace(/^Без кофеина:\s*/, ""))}</a>` : ""}
    </div>`;

    wire(root);
  }

  // the column is one link (its head holds the real <a>); the arrows appear only when the columns overflow
  function wire(root) {
    const box = root.querySelector(`.${P}`), sc = root.querySelector(`.${P}-scroll`), nav = root.querySelector(`.${P}-nav`);
    const [prev, next] = nav.querySelectorAll("button");
    sc.addEventListener("click", (e) => {
      if (e.target.closest("a")) return;
      const td = e.target.closest("td[data-href]");
      if (td) { const a = sc.querySelector(`th[data-col="${td.dataset.col}"] a`); if (a) a.click(); }
    });
    const update = () => {
      const over = sc.scrollWidth > sc.clientWidth + 1;
      nav.hidden = !over;
      box.classList.toggle("is-scrolled", sc.scrollLeft > 1);
      prev.disabled = sc.scrollLeft <= 1;
      next.disabled = sc.scrollLeft + sc.clientWidth >= sc.scrollWidth - 1;
    };
    nav.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      const first = sc.querySelector("thead th:not(:first-child)");
      const stick = sc.querySelector("thead th").offsetWidth, step = first ? first.offsetWidth : 160;
      const by = Math.max(step, Math.floor((sc.clientWidth - stick) / step) * step);
      sc.scrollBy({ left: +b.dataset.dir * by, behavior: "smooth" });
    });
    sc.addEventListener("scroll", update, { passive: true });
    if (root._fCompareRO) root._fCompareRO.disconnect();
    if (window.ResizeObserver) { root._fCompareRO = new ResizeObserver(update); root._fCompareRO.observe(sc); }
    update();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(update);
  }

  // the bottom bar while the coffee is out: no menus and no «В корзину»; it says so and offers the lead instead
  function bar(root, ctx) {
    const c = ctx.coffee, L = c.next.soldOut && c.next.soldOut.lead, o = L && ctx.by[L.slug];
    root.innerHTML = `<div class="${P} ${P}-bar">
      <p class="${P}-bar-st"><span class="${P}-bar-name">${esc(c.name)}</span><span>Лота пока нет, скоро вернётся</span></p>
      ${o ? `<a class="${P}-bar-go" href="${href(o.slug)}"><span class="${P}-bar-k">Ближе всего${L.far ? ", но заметно другой" : ""}</span><span class="${P}-bar-n">${esc(o.name)}</span><span class="${P}-bar-p">${rub(o.price)} →</span></a>` : ""}
    </div>`;
  }

  window.QQBench.register({
    id: "compare",
    name: "Таблица сравнения",
    idea: "Таблица: этот кофе — первая колонка, за ним по колонке на каждый ход; всё, что отличается от этого кофе, чёрное, всё, что совпадает, — серое.",
    notes: "Сильная сторона — отличия видны сразу и по всем осям: кольцо «этот», точка «тот», слово «мягче/плотнее» у сдвига. Цена — вес: семь строк остаются таблицей; на телефоне видно одного соседа за раз, остальные листаются вбок (стрелки и снап по колонкам).",
    render,
    bar,
  });
})();
