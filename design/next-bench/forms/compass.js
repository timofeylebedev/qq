// «Компас»: this coffee in the middle of a drawn plane, the moves around it. Horizontal axis — acidity (QQ's main
// axis): «Мягче» left, «Ярче» right. Vertical — ferment: «Необычнее» up, «Классичнее» down. «Похожий» shares the
// centre's spot (same box), «Под молоко» stands off the axes in a corner (it is a use, not a direction). A far pick
// stands further out on its arm (longer dashed lead); an edge is a hatched wall right at the centre. Below 43rem the
// cross folds into a vertical list along the ↑↓ axis, with ← and → picks pushed to their sides.
(() => {
  const P = "f-compass";
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const num = (n) => String(n).replace(".", ",");
  const rub = (n) => (n ? `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} ₽` : "");
  const SLOT = { softer: "lft", brighter: "rgt", unusual: "up", classic: "down", milk: "milk" };
  // the label as it reads on its arm: the arrow points away from the centre
  const lab = (id, label) => {
    const t = esc(label);
    if (id === "softer") return `<span class="${P}__ar" aria-hidden="true">←</span> ${t}`;
    if (id === "brighter") return `${t} <span class="${P}__ar" aria-hidden="true">→</span>`;
    if (id === "unusual") return `<span class="${P}__ar" aria-hidden="true">↑</span> ${t}`;
    if (id === "classic") return `<span class="${P}__ar" aria-hidden="true">↓</span> ${t}`;
    return t;
  };
  // the data's one-liner, one step per row: the first row is the move itself, «заметно другой» is set apart
  const why = (line) => {
    const parts = String(line || "").split(" · ").filter(Boolean);
    return `<span class="${P}__why">${parts.map((s, i) => {
      const cls = i === 0 ? " is-step" : /заметно другой|ближе по вкусу/.test(s) ? " is-far" : "";
      return `<span class="${P}__w${cls}">${esc(s)}</span>`;
    }).join("")}</span>`;
  };
  const meta = (c) => `<span class="${P}__meta">${esc(c.line)}${c.price ? ` · ${rub(c.price)}` : ""}</span>`;
  const chips = (labels) => labels.length ? `<span class="${P}__chips">${labels.map((l) => `<span class="${P}__chip">${esc(l)}</span>`).join("")}</span>` : "";

  function card(move, c, extra = []) {
    return `<a class="${P}__card${move.far ? " is-far" : ""}" href="#coffee/${esc(c.slug)}">
      <span class="${P}__lab">${lab(move.id, move.label)}${chips(extra)}</span>
      <span class="${P}__name">${esc(c.name)}</span>${why(move.line)}${meta(c)}</a>`;
  }

  // one arm (or the milk corner): a card with its lead to the centre, a wall, or a pointer to the card that took it
  function arm(move, ctx, leadSlug) {
    const slot = SLOT[move.id];
    const c = move.slug && ctx.by[move.slug];
    let body = "", kind = "";
    if (move.joinsLead) {
      const l = ctx.by[leadSlug];
      kind = " is-stub";
      body = `<a class="${P}__stub" href="#coffee/${esc(leadSlug)}"><span class="${P}__lab">${lab(move.id, move.label)}</span><span class="${P}__stubt">тот же кофе, что ближе всего: ${esc(l ? l.name : "")}</span></a>`;
    } else if (move.sharedWith) {
      const other = (ctx.moves || []).find((m) => m.id === move.sharedWith);
      const oc = other && other.slug && ctx.by[other.slug];
      kind = " is-stub";
      body = oc ? `<a class="${P}__stub" href="#coffee/${esc(oc.slug)}"><span class="${P}__lab">${lab(move.id, move.label)}</span><span class="${P}__stubt">тот же кофе, что «${esc(other.label)}»: ${esc(oc.name)}</span></a>` : "";
    } else if (move.edge) {
      kind = " is-edge";
      body = `<div class="${P}__wall"><span class="${P}__lab">${lab(move.id, move.label)}</span><span class="${P}__wallt">${esc(move.line)}</span></div>`;
    } else if (c) {
      kind = move.far ? " is-far" : "";
      body = card(move, c, (move.also || []).map((a) => a.label));
    }
    if (!body) return "";
    const lead = slot === "milk" ? "" : `<i class="${P}__lead" aria-hidden="true"></i>`;
    return `<div class="${P}__arm ${P}__arm--${slot}${kind}">${body}${lead}</div>`;
  }

  function centre(ctx, moves) {
    const c = ctx.coffee, n = c.next, k = c.coded || {};
    const self = moves.find((m) => m.id === "milk" && m.self);
    const scale = `<span class="${P}__scale">Кислотность ${num(k.acidity)} · плотность ${num(k.density)} · фермент ${num(k.ferment)}</span>`;
    const here = `<div class="${P}__here">
      <span class="${P}__lab">${ctx.soldOut ? "Этот кофе · нет в наличии" : "Этот кофе"}</span>
      <span class="${P}__name ${P}__name--here">${esc(c.name)}</span>
      ${ctx.soldOut ? `<span class="${P}__gone">Лота пока нет, скоро вернётся</span>` : ""}${scale}
      ${self ? `<span class="${P}__self"><span class="${P}__lab">${esc(self.label)}</span> ${esc(self.line)}</span>` : ""}</div>`;
    let near = "";
    if (ctx.soldOut) {
      const lead = n.soldOut && n.soldOut.lead, lc = lead && ctx.by[lead.slug];
      if (lc) {
        const joins = (n.soldOut.moves || []).filter((m) => m.joinsLead).map((m) => m.label);
        const line = lead.far && !/заметно другой/.test(lead.line) ? `${lead.line} · в остальном заметно другой` : lead.line;
        near = `<a class="${P}__card ${P}__card--lead${lead.far ? " is-far" : ""}" href="#coffee/${esc(lc.slug)}">
          <span class="${P}__lab">Ближе всего${chips(joins)}</span>
          <span class="${P}__name">${esc(lc.name)}</span>${why(line)}${meta(lc)}</a>`;
      }
    } else {
      const sim = moves.find((m) => m.id === "similar");
      if (sim && sim.slug && ctx.by[sim.slug]) near = card(Object.assign({}, sim, { label: "• " + sim.label }), ctx.by[sim.slug]).replace(`${P}__card`, `${P}__card ${P}__card--near`);
      else if (sim && sim.edge) near = `<div class="${P}__nearnone"><span class="${P}__lab">${esc(sim.label)}</span><span class="${P}__wallt">${esc(sim.line)}</span></div>`;
    }
    return `<div class="${P}__mid${ctx.soldOut ? " is-out" : ""}">${here}${near}</div>`;
  }

  function render(root, ctx) {
    const c = ctx.coffee, n = c.next || {};
    const moves = (ctx.soldOut ? (n.soldOut && n.soldOut.moves) : n.moves) || [];
    const leadSlug = ctx.soldOut && n.soldOut && n.soldOut.lead && n.soldOut.lead.slug;
    const x = { ...ctx, moves: n.moves || [] };
    const arms = moves.filter((m) => SLOT[m.id] && !(m.id === "milk" && m.self));
    const get = (slot) => arms.filter((m) => SLOT[m.id] === slot).map((m) => arm(m, x, leadSlug)).join("");
    const vert = moves.find((m) => m.id === "unusual" || m.id === "classic");
    const legend = `По горизонтали — кислотность: <b>← мягче</b>, <b>ярче →</b>. По вертикали — фермент: ${vert && vert.id === "classic" ? "<b>↓ классичнее</b>" : "<b>↑ необычнее</b>"}.`;
    const d = n.decaf && ctx.by[n.decaf.slug];
    const decaf = d ? `<a class="${P}__decaf" href="#coffee/${esc(d.slug)}"><span class="${P}__name">${esc(d.name)}</span> <span>${esc(n.decaf.line)}</span></a>` : "";
    root.innerHTML = `<div class="${P}${ctx.soldOut ? " is-out" : ""}">
      <h2 class="${P}__h">Что взять дальше</h2>
      <p class="${P}__legend">${legend}</p>
      <div class="${P}__map">
        <div class="${P}__axis">${get("up")}${get("lft")}${centre(ctx, moves)}${get("rgt")}${get("down")}</div>
        ${get("milk")}
      </div>${decaf}</div>`;
  }

  function bar(root, ctx) {
    const n = ctx.coffee.next || {}, lead = n.soldOut && n.soldOut.lead, lc = lead && ctx.by[lead.slug];
    if (!lc) { root.innerHTML = ""; return; }
    root.innerHTML = `<div class="${P} ${P}--bar"><div class="${P}__bar">
      <span class="${P}__bart"><span class="${P}__lab">Лота пока нет, скоро вернётся</span><span>Ближе всего — <b class="${P}__barn">${esc(lc.name)}</b>${lc.price ? ` · ${rub(lc.price)}` : ""}</span></span>
      <a class="${P}__bargo" href="#coffee/${esc(lc.slug)}"><span>Смотреть</span><span aria-hidden="true">→</span></a></div></div>`;
  }

  window.QQBench.register({
    id: "compass",
    name: "Компас",
    idea: "Этот кофе в центре нарисованной плоскости: слева мягче, справа ярче, сверху необычнее (или снизу классичнее), похожий в той же точке, под молоко в углу.",
    notes: "Направление читается без слов: где кофе стоит, туда он и отличается; далёкий шаг стоит дальше на оси, край ассортимента нарисован стеной у самого центра. Цена — место: схема на телефоне складывается в вертикальный список, а пустые углы на широком экране ничего не несут.",
    render, bar,
  });
})();
