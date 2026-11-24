// «Ряд ходов»: one hairline grid of labelled move cards. Each cell: the move's label (mono capitals), the caveat of a far
// step (from the line's tail), the coffee (pack, name, price), the line. Edges and «self» are quieter cells with the
// label and the line only. L: one row (statement cells narrower; rows aligned by subgrid). S/M: two columns, statement
// cells and a lone coffee cell span the row as strips. Below S (280): one column. Sold out: the lead coffee first, as a
// wide cell framed «Лота пока нет, скоро вернётся», carrying the labels of the moves that joined it.
(() => {
  const P = "f-row-";
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
  const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
  const rub = (n) => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} ₽`;
  const FAR_TAILS = ["в остальном заметно другой", "ближе по вкусу для молока у QQ нет"];

  // split a far move's line into the line proper and its caveat (the data's own words)
  function splitLine(m) {
    const parts = String(m.line || "").split(" · ");
    let caveat = "";
    if (m.far && parts.length > 1 && FAR_TAILS.includes(parts[parts.length - 1].trim())) caveat = parts.pop().trim();
    return { line: parts.join(" · "), caveat };
  }

  // the cells of a move list: shared moves fold into the card that carries them; joinsLead moves go to the lead
  function cellsOf(moves) {
    const cells = [];
    for (const m of moves) {
      if (m.sharedWith || m.joinsLead) continue;
      const labels = [m.label, ...((m.also || []).map((a) => a.label))];
      if (m.slug) {
        const { line, caveat } = splitLine(m);
        let l = line;
        if ((m.also || []).some((a) => a.id === "milk") && !/молок/i.test(l)) l = `QQ советует для молока · ${l.charAt(0).toLowerCase()}${l.slice(1)}`;
        cells.push({ kind: "coffee", id: m.id, labels, slug: m.slug, line: l, caveat, far: !!m.far });
      } else if (m.edge || m.self) {
        cells.push({ kind: "note", id: m.id, labels, line: m.line || "", self: !!m.self });
      }
    }
    // S/M pairing: two columns; a note spans the row; a coffee left alone before a note (or at the end) spans too
    let col = 0, prev = null;
    for (const c of cells) {
      if (c.kind === "note") { if (col === 1 && prev) prev.span = true; c.span = true; col = 0; }
      else { col = col === 0 ? 1 : 0; }
      prev = c;
    }
    if (col === 1 && prev) prev.span = true;
    return cells;
  }

  const labelsHtml = (labels) => labels.map((l) => `<span>${esc(l)}</span>`).join(`<span class="${P}sep" aria-hidden="true">·</span>`);

  function coffeeCell(c, by) {
    const k = by[c.slug];
    if (!k) return "";
    return `<a class="${P}cell ${P}move${c.far ? ` ${P}is-far` : ""}${c.span ? ` ${P}span` : ""}" href="#coffee/${esc(c.slug)}" data-move="${esc(c.id)}">
      <span class="${P}label">${labelsHtml(c.labels)}</span>
      <span class="${P}caveat">${c.caveat ? `<i class="${P}ring" aria-hidden="true"></i>${esc(cap(c.caveat))}` : ""}</span>
      <span class="${P}coffee">
        <img class="${P}pack" src="pack.webp" alt="" width="512" height="512" loading="lazy">
        <span class="${P}id"><span class="${P}name">${esc(k.name)}</span><span class="${P}price">${rub(k.price)} · 200 г</span></span>
      </span>
      <span class="${P}line">${esc(c.line)}</span>
    </a>`;
  }

  function noteCell(c) {
    return `<div class="${P}cell ${P}note ${c.self ? `${P}is-self` : `${P}is-edge`}${c.span ? ` ${P}span` : ""}" data-move="${esc(c.id)}">
      <span class="${P}label">${labelsHtml(c.labels)}</span>
      <span class="${P}line">${esc(c.line)}</span>
    </div>`;
  }

  function grid(cells, by) {
    // L: one row; a note is a narrower column
    const cols = cells.map((c) => (c.kind === "note" ? "minmax(0, 0.62fr)" : "minmax(0, 1fr)")).join(" ");
    return `<div class="${P}grid" style="--f-row-cols: ${cols}">${cells.map((c) => (c.kind === "coffee" ? coffeeCell(c, by) : noteCell(c))).join("")}</div>`;
  }

  function leadCell(next, by) {
    const lead = next.soldOut && next.soldOut.lead;
    const k = lead && by[lead.slug];
    if (!k) return "";
    const joined = (next.soldOut.moves || []).filter((m) => m.joinsLead).map((m) => m.label);
    const { line, caveat } = splitLine(lead);
    return `<a class="${P}lead${lead.far ? ` ${P}is-far` : ""}" href="#coffee/${esc(lead.slug)}">
      <span class="${P}frame">Лота пока нет, скоро вернётся</span>
      <img class="${P}pack ${P}leadpack" src="pack.webp" alt="" width="512" height="512">
      <span class="${P}leadbody">
        <span class="${P}label">${labelsHtml(["Ближе всего", ...joined])}</span>
        ${caveat ? `<span class="${P}caveat"><i class="${P}ring" aria-hidden="true"></i>${esc(cap(caveat))}</span>` : ""}
        <span class="${P}name ${P}leadname">${esc(k.name)}</span>
        <span class="${P}short">${esc(k.short)}</span>
        <span class="${P}line">${esc(line)}</span>
        <span class="${P}price">${rub(k.price)} · 200 г</span>
      </span>
    </a>`;
  }

  function decafRow(next, by) {
    const d = next.decaf, k = d && by[d.slug];
    if (!k) return "";
    return `<a class="${P}decaf" href="#coffee/${esc(d.slug)}"><span class="${P}name">${esc(k.name)}</span><span class="${P}decafline">${esc(d.line)}</span></a>`;
  }

  window.QQBench.register({
    id: "row",
    name: "Ряд ходов",
    idea: "Один ряд подписанных карточек: над каждым кофе — куда он ведёт (мягче, ярче, под молоко…), под ним — одна строка почему.",
    notes: "Ближе всего к сегодняшнему ряду карточек, но короче в разы и с причиной у каждого кофе; дальний шаг помечен до названия, край и «сам под молоко» — тихие ячейки без кофе. На телефоне — две колонки без скрытых карточек, поэтому строки узкие и блок выше, чем у ленты.",
    render(root, ctx) {
      const { coffee, by, soldOut } = ctx;
      const next = coffee.next || {};
      const moves = soldOut ? (next.soldOut && next.soldOut.moves) || [] : next.moves || [];
      const cells = cellsOf(moves);
      root.innerHTML = `<div class="f-row${soldOut ? ` ${P}is-out` : ""}">
        <h2 class="${P}h">${soldOut ? "Что взять, пока его нет" : "Что взять дальше"}</h2>
        <p class="${P}sub">${soldOut ? "Ближайший кофе, затем шаги в стороны от " : "Шаги в разные стороны от "}${esc(coffee.name)}: над кофе — куда шаг, под ним — чем он отличается.</p>
        <div class="${P}board">${soldOut ? leadCell(next, by) : ""}${grid(cells, by)}</div>
        ${decafRow(next, by)}
      </div>`;
    },
    bar(root, ctx) {
      const { coffee, by } = ctx;
      const lead = coffee.next && coffee.next.soldOut && coffee.next.soldOut.lead;
      const k = lead && by[lead.slug];
      root.innerHTML = `<div class="f-row ${P}bar">
        <span class="${P}barstate"><span class="${P}barname"><span class="${P}barcoffee">${esc(coffee.name)}</span>Лота пока нет</span><span class="${P}barmsg">Скоро вернётся</span></span>
        ${k ? `<a class="${P}baroffer" href="#coffee/${esc(lead.slug)}"><span class="${P}barlbl">Ближе всего</span><span class="${P}barname">${esc(k.name)}</span><span class="${P}barprice">${rub(k.price)}</span><span class="${P}arrow" aria-hidden="true">→</span></a>` : ""}
      </div>`;
    },
  });
})();
