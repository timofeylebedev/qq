// Form «sentences»: the block as a shop assistant's advice — a short list of «Если хочется… → этот кофе» rows divided
// by hairlines. Left: the condition in mono capitals and a tiny scale mark from `coded` (ring: this coffee, lavender
// dot: the advice). Right: the name (the row is one link), its line, the price with the bag («в корзину»).
// next.decaf is not shown: the site never offers a decaf for a coffee with caffeine (CLAUDE.md, the taste model).
(() => {
  const P = "f-sentences";
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const rub = (n) => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} ₽`;
  const num = (v) => String(v).replace(".", ",");
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  // the condition each move answers, as the first half of a sentence
  const COND = { softer: "хочется мягче", brighter: "хочется ярче", milk: "вы пьёте с молоком", unusual: "хочется необычного",
    classic: "хочется классики", similar: "понравился этот" };
  const cond = (m) => COND[m.id] || m.label.toLowerCase();
  // the axis of the tiny scale mark per move (coded: acidity 1–5, density 1–5, ferment 0–3)
  const AXIS = { softer: "acidity", brighter: "acidity", similar: "acidity", milk: "density", unusual: "ferment", classic: "ferment" };
  const AX = { acidity: { ru: "кислотность", min: 1, max: 5 }, density: { ru: "плотность", min: 1, max: 5 }, ferment: { ru: "фермент", min: 0, max: 3 } };

  const BAG = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M23 22H1V7H7.875C7.74963 8.80047 7.75 10.8589 7.75 13C7.75 13.4142 8.08579 13.75 8.5 13.75C8.91421 13.75 9.25 13.4142 9.25 13C9.25 10.7677 9.25219 8.72833 9.37793 7H14.6221C14.7478 8.72833 14.75 10.7677 14.75 13C14.75 13.4142 15.0858 13.75 15.5 13.75C15.9142 13.75 16.25 13.4142 16.25 13C16.25 10.8589 16.2504 8.80047 16.125 7H23V22ZM12 0.25C13.1016 0.25 13.9722 0.688148 14.6064 1.4707C15.2103 2.21572 15.5696 3.23318 15.7979 4.36621C15.9564 5.15299 16.0581 6.03985 16.125 7H14.6221C14.5594 6.13895 14.4665 5.35508 14.3271 4.66309C14.118 3.62475 13.8209 2.8844 13.4404 2.41504C13.0904 1.98333 12.6482 1.75 12 1.75C11.3518 1.75 10.9096 1.98333 10.5596 2.41504C10.1791 2.8844 9.88204 3.62475 9.67285 4.66309C9.53345 5.35508 9.44057 6.13895 9.37793 7H7.875C7.94186 6.03985 8.04364 5.15299 8.20215 4.36621C8.43045 3.23318 8.78975 2.21572 9.39355 1.4707C10.0278 0.688148 10.8984 0.25 12 0.25Z"/></svg>';
  const CHECK = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4.5 12.5L9.5 17.5L19.5 6.5"/></svg>';

  // tiny scale: ticks at each step, a ring for this coffee, a lavender dot for the advice (none on an edge)
  function mark(axis, here, there) {
    const a = AX[axis]; if (!a || here == null) return "";
    const pos = (v) => ((Math.min(a.max, Math.max(a.min, v)) - a.min) / (a.max - a.min)) * 100;
    let ticks = ""; for (let v = a.min; v <= a.max; v++) ticks += `<i style="left:${pos(v)}%"></i>`;
    const h = pos(here), t = there == null ? null : pos(there);
    const step = t == null ? "" : `<span class="${P}-step" style="left:${Math.min(h, t)}%;width:${Math.abs(t - h)}%"></span>`;
    const val = t == null ? num(here) : (here === there ? num(here) : `${num(here)} → ${num(there)}`);
    return `<span class="${P}-mark" aria-hidden="true"><span class="${P}-track">${ticks}${step}<b class="${P}-here" style="left:${h}%"></b>${t == null ? "" : `<b class="${P}-there" style="left:${t}%"></b>`}</span><span class="${P}-axis">${a.ru} ${val}</span></span>`;
  }

  // the line, split: the move's own reason first (ink), the rest secondary; a far pick's caveat becomes its own sentence
  function lineParts(m) {
    const segs = String(m.line || "").split(" · ").map((s) => s.trim()).filter(Boolean);
    let far = "";
    if (m.far && segs.length) {
      const last = segs[segs.length - 1];
      if (/в остальном заметно другой/.test(last)) {
        segs.pop();
        const s = /Ближе в этом направлении[^.]*\./.exec(m.text || "");
        far = s ? s[0] : "Ближе в эту сторону у QQ ничего нет, но в остальном это заметно другой кофе.";
      } else if (/^ближе /.test(last)) { segs.pop(); far = cap(last) + "."; }
    }
    return { head: segs[0] || "", rest: segs.slice(1), far };
  }

  function buy(c) {
    return `<button type="button" class="${P}-buy" data-slug="${esc(c.slug)}" aria-label="${esc(`В корзину: ${c.name}, 200 г, ${c.price} ₽`)}"><span class="${P}-buy-ico">${BAG}</span><span class="${P}-buy-txt">${rub(c.price)}</span></button>`;
  }

  function conds(list) {
    return `<p class="${P}-if">${list.map((m, i) => `<span>${i ? "или " : "если "}${esc(cond(m))}</span>`).join("")}</p>`;
  }

  function row(m, also, ctx) {
    const here = ctx.coffee, all = [m].concat(also);
    const axis = AXIS[m.id];
    const left = (markHtml) => `<div class="${P}-left">${conds(all)}${markHtml}</div>`;
    if (m.self) {
      return `<li class="${P}-row is-note">${left("")}<div class="${P}-then"><p class="${P}-say">Этот кофе QQ и так советует для молока.</p></div></li>`;
    }
    if (m.edge || !m.slug) {
      const mk = m.id === "similar" ? "" : mark(axis, here.coded[axis], null);
      return `<li class="${P}-row is-note">${left(mk)}<div class="${P}-then"><p class="${P}-say">${esc(m.line)}</p></div></li>`;
    }
    const c = ctx.by[m.slug]; if (!c) return "";
    const L = lineParts(m);
    // a merged milk move: QQ's own tag, checked in the data
    const milkNote = also.some((a) => a.id === "milk") && (c.use || []).includes("Молочные напитки") ? `<span class="${P}-rest"> · QQ советует для молока</span>` : "";
    return `<li class="${P}-row${m.far ? " is-far" : ""}">${left(mark(axis, here.coded[axis], c.coded[axis]))}
      <div class="${P}-then">
        <h3 class="${P}-name"><a href="#coffee/${esc(c.slug)}">${esc(c.name)}</a></h3>
        <p class="${P}-line"><span class="${P}-head">${esc(L.head)}</span>${L.rest.map((s) => `<span class="${P}-rest"> · ${esc(s)}</span>`).join("")}${milkNote}</p>
        ${L.far ? `<p class="${P}-far">${esc(L.far)}</p>` : ""}
      </div>
      <div class="${P}-act">${buy(c)}</div></li>`;
  }

  function rows(moves, ctx) {
    const byId = Object.fromEntries(moves.map((m) => [m.id, m]));
    return moves.filter((m) => !m.joinsLead && !m.sharedWith)
      .map((m) => row(m, (m.also || []).map((a) => byId[a.id] || { id: a.id, label: a.label }), ctx)).join("");
  }

  function lead(next, ctx) {
    const l = next.soldOut && next.soldOut.lead; if (!l) return "";
    const c = ctx.by[l.slug]; if (!c) return "";
    const joins = next.soldOut.moves.filter((m) => m.joinsLead);
    const L = lineParts({ line: l.line, far: l.far, text: l.text });
    return `<div class="${P}-lead">
      <p class="${P}-lead-say"><span class="${P}-lead-out">Лота пока нет, скоро вернётся.</span> Ближе всего&nbsp;— <a class="${P}-lead-name" href="#coffee/${esc(c.slug)}">${esc(c.name)}</a></p>
      <p class="${P}-line"><span class="${P}-head">${esc(L.head)}</span>${L.rest.map((s) => `<span class="${P}-rest"> · ${esc(s)}</span>`).join("")}</p>
      ${L.far ? `<p class="${P}-far">${esc(L.far)}</p>` : ""}
      ${joins.length ? `<p class="${P}-if ${P}-joins">${joins.map((m) => `<span>он же — если ${esc(cond(m))}</span>`).join("")}</p>` : ""}
      <div class="${P}-lead-act">${buy(c)}</div>
    </div>`;
  }

  function wire(root) {
    root.querySelectorAll(`.${P}-buy`).forEach((b) => {
      b.addEventListener("click", (e) => {
        e.preventDefault();
        const on = b.classList.toggle("is-in");
        b.querySelector(`.${P}-buy-ico`).innerHTML = on ? CHECK : BAG;
        b.setAttribute("aria-pressed", on);
      });
    });
  }

  QQBench.register({
    id: "sentences",
    name: "Советы фразами",
    idea: "Короткий список советов продавца: слева условие («Если хочется мягче»), справа один кофе, его строка и цена — без карточек.",
    notes: "Читается быстрее всех: одно предложение на ход, края и «и так под молоко» звучат как часть совета, а не как пустые места. Цена — без картинок: пакет не виден, и ряд держится только на типографике и маленькой шкале.",
    render(root, ctx) {
      const next = ctx.coffee.next || {};
      const out = !!ctx.soldOut;
      const moves = out ? (next.soldOut && next.soldOut.moves) || [] : next.moves || [];
      root.innerHTML = `<div class="${P}${out ? " is-out" : ""}">
        <header class="${P}-top"><h2 class="${P}-h">Что взять дальше</h2>
          <p class="${P}-legend" aria-hidden="true"><span><b class="${P}-here"></b>этот кофе</span><span><b class="${P}-there"></b>совет</span></p></header>
        ${out ? lead(next, ctx) : ""}
        <ul class="${P}-list" role="list">${rows(moves, ctx)}</ul>
      </div>`;
      wire(root);
    },
    bar(root, ctx) {
      const l = ctx.coffee.next && ctx.coffee.next.soldOut && ctx.coffee.next.soldOut.lead;
      const c = l && ctx.by[l.slug];
      root.innerHTML = `<div class="${P}-bar">
        ${c ? `<a class="${P}-bar-say" href="#coffee/${esc(c.slug)}"><span class="${P}-bar-out">Нет в наличии · ближе всего</span><span class="${P}-bar-name">${esc(c.name)}</span></a>` : `<p class="${P}-bar-say"><span class="${P}-bar-out">Нет в наличии</span></p>`}
        ${c ? `<button type="button" class="${P}-bar-buy ${P}-buy" data-slug="${esc(c.slug)}" aria-label="${esc(`В корзину: ${c.name}, 200 г, ${c.price} ₽`)}"><span class="${P}-buy-ico">${BAG}</span><span class="${P}-buy-txt">${rub(c.price)}</span><span class="${P}-bar-cta">В корзину</span></button>` : ""}
      </div>`;
      wire(root);
    },
  });
})();
