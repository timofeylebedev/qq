// Form «Переключатель» of the bench «Что взять дальше»: the visitor says which way (a row of toggles, each showing what
// it holds), and ONE big result shows the coffee of that move with its line and its longer reason. All results lie in
// one grid cell (the hidden ones invisible, not removed), so the block keeps the height of its tallest and never jumps.
(() => {
  const P = "f-switch-";
  let uid = 0;
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
  const rub = (n) => `${String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} ₽`;
  // a far move's line ends with its caveat: shown apart, in the same words
  const TAILS = [" · в остальном заметно другой", " · ближе по вкусу для молока у QQ нет"];
  const splitFar = (line) => { for (const t of TAILS) if (line && line.endsWith(t)) return [line.slice(0, -t.length), t.slice(3)]; return [line || "", ""]; };

  // the tabs and the results they show (a shared move and a move that joins the lead show the same result)
  function model(c, soldOut) {
    const n = c.next, tabs = [], panels = [], byId = {};
    const coffee = (m, extra) => { const p = { kind: "coffee", slug: m.slug, line: m.line, text: m.text, far: !!m.far, labels: [], ...extra }; panels.push(p); return p; };
    let lead = null;
    if (soldOut && n.soldOut && n.soldOut.lead) {
      lead = coffee(n.soldOut.lead, { lead: true });
      tabs.push({ id: "lead", label: "Ближе всего", panel: lead });
    }
    const moves = soldOut && n.soldOut ? n.soldOut.moves : n.moves;
    for (const m of moves) {
      let p = null;
      if (m.joinsLead) p = lead;
      else if (m.sharedWith) p = null;
      else if (m.slug) p = coffee(m);
      else { p = { kind: "say", id: m.id, edge: !!m.edge, self: !!m.self, line: m.line, labels: [] }; panels.push(p); }
      const t = { id: m.id, label: m.label, panel: p, m };
      tabs.push(t); byId[m.id] = t;
    }
    for (const t of tabs) if (t.m && t.m.sharedWith && byId[t.m.sharedWith]) t.panel = byId[t.m.sharedWith].panel;
    const live = tabs.filter((t) => t.panel);
    for (const t of live) if (!t.panel.labels.includes(t.label)) t.panel.labels.push(t.label);
    // the default: the lead when sold out; else «Похожий» when it has a coffee; else the first move with one
    let def = live.findIndex((t) => t.id === (lead ? "lead" : "similar") && t.panel.kind === "coffee");
    if (def < 0) def = live.findIndex((t) => t.panel.kind === "coffee");
    if (def < 0) def = 0;
    // where a statement points: to the nearest coffee's move (for «похожих нет»), else to the default
    for (const p of panels) if (p.kind === "say") {
      let to = -1;
      if (p.id === "similar" && n.nearest) to = live.findIndex((t) => t.panel.slug === n.nearest.slug);
      if (to < 0) to = live[def] && live[def].panel.kind === "coffee" ? def : -1;
      p.point = to;
    }
    return { tabs: live, panels, def, lead };
  }

  function hintOf(t, by) {
    const p = t.panel;
    if (p.kind === "coffee") return `${p.far ? `<span class="${P}ring" aria-hidden="true"></span>` : ""}${esc(by[p.slug] ? by[p.slug].name : p.slug)}`;
    if (p.self) return "этот же";
    return "у QQ нет";
  }

  function coffeePanel(p, by, pid) {
    const c = by[p.slug] || { name: p.slug, price: 0 };
    const [line, far] = splitFar(p.line);
    const kick = p.labels.map(esc).join(" · ");
    return `<article class="${P}card">
  <a class="${P}link" href="#coffee/${esc(p.slug)}">
    <span class="${P}pic"><img src="pack.webp" alt="" width="512" height="512" loading="lazy" decoding="async"></span>
    <span class="${P}body">
      <span class="${P}kick">${kick}</span>
      <span class="${P}name">${esc(c.name)}</span>
      <span class="${P}line">${esc(line)}</span>
      ${far ? `<span class="${P}far"><span class="${P}ring" aria-hidden="true"></span>${esc(far)}</span>` : ""}
      ${p.text ? `<span class="${P}text">${esc(p.text)}</span>` : ""}
    </span>
  </a>
  <div class="${P}buy">
    <span class="${P}cell ${P}cell--w">200 г</span>
    <span class="${P}cell ${P}cell--price">${rub(c.price)}</span>
    <button type="button" class="${P}add" data-add="${pid}" aria-label="В корзину: ${esc(c.name)}, ${rub(c.price)}">В корзину</button>
  </div>
</article>`;
  }

  function sayPanel(p, tabs, by, tabIds) {
    const to = p.point >= 0 ? tabs[p.point] : null;
    const name = to && by[to.panel.slug] ? by[to.panel.slug].name : "";
    const lead = to && to.id === "lead";
    const point = to
      ? `<button type="button" class="${P}point" data-go="${p.point}" aria-controls="${tabIds[p.point]}">${p.id === "similar" || lead ? "Ближе всего" : "Или"} — «${esc(to.label)}»: <b>${esc(name)}</b><span aria-hidden="true"> →</span></button>`
      : "";
    return `<div class="${P}say${p.self ? ` ${P}say--self` : ""}">
  <span class="${P}kick">${p.labels.map(esc).join(" · ")}</span>
  <p class="${P}said">${esc(p.line)}</p>
  ${point}
</div>`;
  }

  function render(root, ctx) {
    const { coffee: c, by, soldOut } = ctx;
    const u = `${P}${++uid}`;
    const { tabs, panels, def } = model(c, soldOut);
    const tabIds = tabs.map((_, i) => `${u}-t${i}`);
    const panelIds = panels.map((_, j) => `${u}-p${j}`);
    const pIndex = (t) => panels.indexOf(t.panel);
    const odd = tabs.length % 2 === 1;
    // below M the toggles stand two to a row; with an odd count the nearest one (lead, else «Похожий») takes a whole row
    const wide = odd ? (tabs.findIndex((t) => t.id === "lead") >= 0 ? tabs.findIndex((t) => t.id === "lead") : tabs.length - 1) : -1;
    const leadName = soldOut && c.next.soldOut && c.next.soldOut.lead && by[c.next.soldOut.lead.slug] ? by[c.next.soldOut.lead.slug].name : "";
    const head = soldOut
      ? `<h2 class="${P}h" id="${u}-h">Лота пока нет, скоро вернётся</h2><p class="${P}ask">Ближе всего — ${esc(leadName)}. Или скажите, в какую сторону</p>`
      : `<h2 class="${P}h" id="${u}-h">Хочется другого?</h2><p class="${P}ask">Скажите, в какую сторону</p>`;
    const dec = c.next.decaf && by[c.next.decaf.slug]
      ? `<p class="${P}decaf">${esc(c.next.decaf.line)} <a href="#coffee/${esc(c.next.decaf.slug)}">${esc(by[c.next.decaf.slug].name)}<span aria-hidden="true">\u00a0→</span></a></p>` : "";
    root.innerHTML = `<div class="f-switch" style="--n:${tabs.length}">
  <div class="${P}head">${head}</div>
  <div class="${P}tabs" role="tablist" aria-labelledby="${u}-h">
    ${tabs.map((t, i) => `<button type="button" role="tab" id="${tabIds[i]}" class="${P}tab${i === wide ? ` ${P}tab--wide` : ""}${t.panel.kind === "say" ? ` ${P}tab--say` : ""}" aria-selected="false" aria-controls="${panelIds[pIndex(t)]}" tabindex="-1" data-i="${i}"><span class="${P}tab-label">${esc(t.label)}</span><span class="${P}tab-hint">${hintOf(t, by)}</span></button>`).join("")}
  </div>
  <div class="${P}stack">
    ${panels.map((p, j) => `<div class="${P}panel" role="tabpanel" id="${panelIds[j]}" data-j="${j}">${p.kind === "coffee" ? coffeePanel(p, by, j) : sayPanel(p, tabs, by, tabIds)}</div>`).join("")}
  </div>
  ${dec}
</div>`;
    const box = root.querySelector(".f-switch");
    const tabEls = [...box.querySelectorAll(`.${P}tab`)];
    const panelEls = [...box.querySelectorAll(`.${P}panel`)];
    function select(i, focus) {
      const j = pIndex(tabs[i]);
      tabEls.forEach((el, k) => { const on = k === i; el.setAttribute("aria-selected", on); el.tabIndex = on ? 0 : -1; });
      panelEls.forEach((el, k) => {
        const on = k === j;
        el.classList.toggle("is-on", on);
        if (on) { el.setAttribute("aria-labelledby", tabIds[i]); el.removeAttribute("inert"); el.removeAttribute("aria-hidden"); }
        else { el.setAttribute("inert", ""); el.setAttribute("aria-hidden", "true"); el.removeAttribute("aria-labelledby"); }
      });
      if (focus) tabEls[i].focus();
    }
    box.querySelector(`.${P}tabs`).addEventListener("click", (e) => { const b = e.target.closest(`.${P}tab`); if (b) select(+b.dataset.i, false); });
    box.querySelector(`.${P}tabs`).addEventListener("keydown", (e) => {
      const i = tabEls.indexOf(document.activeElement); if (i < 0) return;
      const n = tabEls.length;
      const to = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: n - 1 }[e.key];
      if (to === undefined) return;
      e.preventDefault(); select((to + n) % n, true);
    });
    box.querySelector(`.${P}stack`).addEventListener("click", (e) => {
      const go = e.target.closest(`.${P}point`);
      if (go) { select(+go.dataset.go, true); return; }
      const add = e.target.closest(`.${P}add`);
      if (add) { add.textContent = "В корзине ✓"; add.classList.add("is-done"); }
    });
    select(def, false);
  }

  // the page's bottom bar while this coffee is out: it says so and offers the lead
  function bar(root, ctx) {
    const { coffee: c, by } = ctx;
    const L = c.next.soldOut && c.next.soldOut.lead && by[c.next.soldOut.lead.slug];
    root.innerHTML = `<div class="f-switch f-switch-bar">
  <div class="${P}bar-in">
    <p class="${P}bar-cell ${P}bar-status"><span class="${P}bar-k">${esc(c.name)}</span><span>Лота пока нет, скоро вернётся</span></p>
    ${L ? `<a class="${P}bar-cell ${P}bar-lead" href="#coffee/${esc(L.slug)}"><span class="${P}bar-k">Ближе всего</span><span class="${P}bar-name">${esc(L.name)}</span></a>
    <span class="${P}bar-cell ${P}bar-price">200 г · ${rub(L.price)}</span>
    <button type="button" class="${P}bar-add" aria-label="В корзину: ${esc(L.name)}, ${rub(L.price)}">В корзину</button>` : ""}
  </div>
</div>`;
    const add = root.querySelector(`.${P}bar-add`);
    if (add) add.addEventListener("click", () => { add.textContent = "В корзине ✓"; });
  }

  window.QQBench.register({
    id: "switch",
    name: "Переключатель",
    idea: "Посетитель сам говорит, в какую сторону — «мягче», «ярче», «под молоко», «необычнее», «похожий», — и видит один большой ответ: кофе, строку и длинное объяснение, почему он.",
    notes: "Сильная сторона — один крупный ответ с полным «почему» и место для честных «у QQ нет»; на каждом переключателе подписано, что за ним, так что пять ответов видны хотя бы по именам. Цена — четыре из пяти кофе не видны целиком, и сравнить их рядом нельзя: нужно переключать.",
    render,
    bar,
  });
})();
