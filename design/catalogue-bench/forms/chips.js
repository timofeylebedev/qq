// Form «Два ряда» (id chips): the familiar catalogue filter done right for 25 coffees. Two single-select rows of chips
// above the grid, each chip with how many it finds: «Чем варите» (the 8 methods) and «Что хочется» (the 4 scenarios).
// One cell «Ещё фильтры» opens, in place, the secondary filters (multi-select within a group). A row of the active
// choices with × and «Сбросить всё». Then the grid: «Подходят N», «Почти» (lavender: what each misses), «Остальные N».
// Ranking is the site's own (ctx.choose.rank over ctx.conditions plus the three filters the shell has no condition for).
QQBench.register({
  id: "chips",
  name: "Два ряда",
  idea: "Два ряда кнопок над сеткой — «Чем варите» и «Что хочется», на каждой число кофе, которые она найдёт; всё остальное — за одной ячейкой «Ещё фильтры».",
  notes: "Знакомо и быстро: гейзер без кислотности — два нажатия. Но вкус здесь — слова, а не ощущение: новичок не всегда знает, чего ему «хочется», а на телефоне часть способов уезжает за край ряда и находится только прокруткой.",
  render(root, ctx) {
    const { esc } = ctx;
    const s0 = ctx.state || {};
    const LISTS = ["acid", "tastes", "country", "process", "type", "line"];
    const st = { method: s0.method || null, chip: s0.chip || null, cells: [...(s0.cells || [])] };
    for (const k of LISTS) st[k] = [...(s0[k] || [])];
    let open = false;

    // values of a list field, the most common first (ties: alphabetically)
    const valuesOf = (get) => {
      const n = new Map();
      for (const c of ctx.coffees) for (const v of get(c)) n.set(v, (n.get(v) || 0) + 1);
      return [...n.keys()].sort((a, b) => n.get(b) - n.get(a) || a.localeCompare(b, "ru"));
    };
    const GROUPS = [
      { key: "acid", ru: "Кислотность", opts: ctx.acidity.map((a) => ({ v: a.id, ru: a.ru })), tag: (o) => `кислотность ${o.ru.toLowerCase()}` },
      { key: "tastes", ru: "Вкус", opts: ctx.tastes.map((t) => ({ v: t.id, ru: t.ru })) },
      { key: "country", ru: "Страна", opts: valuesOf((c) => c.countries).map((v) => ({ v, ru: v })) },
      { key: "process", ru: "Обработка", opts: valuesOf((c) => c.processes).map((v) => ({ v, ru: v })) },
      { key: "type", ru: "Моносорт / смесь", opts: valuesOf((c) => [c.type]).map((v) => ({ v, ru: v })) },
      { key: "line", ru: "Линейка", opts: ["Classic", "Special"].map((v) => ({ v, ru: v })) }
    ];
    // the shell's conditions cover method, chip, acidity, taste, country and cells; processing, type and line are
    // written the same way (a test and the words for what a coffee misses)
    const extra = (s) => {
      const k = [];
      if (s.process.length) k.push({ id: "process", test: (c) => s.process.some((p) => c.processes.includes(p)), miss: (c) => c.processes.length ? `обработка ${c.processes.join(", ").toLowerCase()}` : "смесь, без одной обработки" });
      if (s.type.length) k.push({ id: "type", test: (c) => s.type.includes(c.type), miss: (c) => c.type.toLowerCase() });
      if (s.line.length) k.push({ id: "line", test: (c) => s.line.includes(c.line), miss: (c) => `линейка ${c.line}` });
      return k;
    };
    const rankOf = (s) => ctx.choose.rank(ctx.coffees, [...ctx.conditions(s), ...extra(s)], { dist: ctx.dist });
    const count = (patch) => rankOf({ ...st, ...patch }).exact.length;
    const nSecondary = () => LISTS.reduce((a, k) => a + st[k].length, 0);

    const pill = (k, label, n, on, extraAttr = "") =>
      `<button type="button" class="f-chips-pill${on ? " is-on" : ""}${n === 0 && !on ? " is-zero" : ""}" data-k="${esc(k)}" aria-pressed="${on}"${extraAttr}>${label}<span class="f-chips-n" aria-label="${n} кофе">${n}</span></button>`;

    function controls() {
      const methods = ctx.methods.map((m) => pill(`m:${m.id}`,
        m.short === m.ru ? `<span>${esc(m.ru)}</span>` : `<span class="f-chips-full">${esc(m.ru)}</span><span class="f-chips-short" aria-hidden="true">${esc(m.short)}</span>`,
        count({ method: m.id }), st.method === m.id, m.short === m.ru ? "" : ` title="${esc(m.ru)}"`)).join("");
      const chips = ctx.chips.map((ch) => pill(`c:${ch.id}`, `<span>${esc(ch.ru)}</span>`, count({ chip: ch.id }), st.chip === ch.id)).join("");
      const ns = nSecondary();
      const groups = GROUPS.map((g) => `<div class="f-chips-group" role="group" aria-labelledby="f-chips-g-${g.key}">
          <p class="f-chips-label mono" id="f-chips-g-${g.key}">${esc(g.ru)}</p>
          <div class="f-chips-opts">${g.opts.map((o) => pill(`${g.key}:${o.v}`, `<span>${esc(o.ru)}</span>`, count({ [g.key]: [o.v] }), st[g.key].includes(o.v))).join("")}</div>
        </div>`).join("");
      return `
        <div class="f-chips-rows">
          <div class="f-chips-block"><p class="f-chips-label mono" id="f-chips-l-m">Чем варите</p>
            <div class="f-chips-row" data-row="m" role="group" aria-labelledby="f-chips-l-m">${methods}</div></div>
          <div class="f-chips-block"><p class="f-chips-label mono" id="f-chips-l-c">Что хочется</p>
            <div class="f-chips-row" data-row="c" role="group" aria-labelledby="f-chips-l-c">${chips}</div></div>
        </div>
        <div class="f-chips-more${open ? " is-open" : ""}">
          <button type="button" class="f-chips-cell" data-k="more" aria-expanded="${open}" aria-controls="f-chips-panel-${ctx.width}">
            <span class="f-chips-cell__t"><span class="mono">Ещё фильтры</span><span class="f-chips-cell__hint">кислотность, вкус, страна, обработка</span></span>
            <span class="f-chips-cell__end">${ns ? `<span class="f-chips-badge">${ns}</span>` : ""}<span class="f-chips-sign mono" aria-hidden="true">${open ? "−" : "+"}</span></span>
          </button>
          <div class="f-chips-panel" id="f-chips-panel-${ctx.width}"${open ? "" : " hidden"}>
            <div class="f-chips-groups">${groups}</div>
            <button type="button" class="f-chips-fold" data-k="fold">Свернуть · подходят ${rankOf(st).exact.length}</button>
          </div>
        </div>`;
    }

    function active() {
      const items = [];
      if (st.method) { const m = ctx.methods.find((x) => x.id === st.method); items.push([`m:${m.id}`, m.short]); }
      if (st.chip) { const ch = ctx.chips.find((x) => x.id === st.chip); items.push([`c:${ch.id}`, ch.ru]); }
      for (const g of GROUPS) for (const v of st[g.key]) {
        const o = g.opts.find((x) => x.v === v) || { v, ru: v };
        items.push([`${g.key}:${v}`, g.tag ? g.tag(o) : o.ru]);
      }
      if (st.cells.length) items.push(["cells", "место на карте вкуса"]);
      if (!items.length) return "";
      return `<div class="f-chips-active" role="group" aria-label="Выбрано">
        ${items.map(([k, ru]) => `<button type="button" class="f-chips-tag" data-k="x:${esc(k)}" aria-label="Убрать «${esc(ru)}»">${esc(ru)}<span class="f-chips-x" aria-hidden="true">×</span></button>`).join("")}
        ${items.length > 1 ? `<button type="button" class="f-chips-reset" data-k="reset">Сбросить всё</button>` : ""}
      </div>`;
    }

    function results() {
      const r = rankOf(st);
      const method = st.method;
      const m = method && ctx.methods.find((x) => x.id === method);
      const any = !!(method || st.chip || nSecondary() || st.cells.length);
      const grid = (list, f) => `<div class="bgrid">${list.map(f).join("")}</div>`;
      const card = (c, o = {}) => ctx.card(c, { method, ...o });
      let h = "";
      if (!any) return `<section class="f-chips-sec"><h3 class="f-chips-h">Все ${r.exact.length} кофе</h3>${grid(r.exact, (c) => card(c))}</section>`;
      if (r.exact.length) {
        h += `<section class="f-chips-sec"><h3 class="f-chips-h">Подходят ${r.exact.length}</h3>${m ? `<p class="f-chips-why">${esc(m.why)}</p>` : ""}${grid(r.exact, (c) => card(c))}</section>`;
        if (r.near.length) h += `<section class="f-chips-sec"><h3 class="f-chips-h">Почти</h3><p class="f-chips-why">Ближе всего по вкусу к подошедшим, но чего-то не хватает.</p>${grid(r.near, (x) => card(x.c, { note: x.missing.join(", ") }))}</section>`;
      } else {
        h += `<section class="f-chips-sec"><h3 class="f-chips-h">Точно таких нет — ближе всего</h3><p class="f-chips-why">У каждого написано, чего не хватает. Уберите одно условие выше — и появятся точные.</p>${grid(r.near, (x) => card(x.c, { note: x.missing.join(", ") }))}</section>`;
      }
      if (r.rest.length) h += `<section class="f-chips-sec"><h3 class="f-chips-h">Остальные ${r.rest.length}</h3>${grid(r.rest, (c) => card(c, { muted: true }))}</section>`;
      return h;
    }

    // keep a row's sideways place over a redraw; on the first draw, bring the chosen chip into its row's view
    // (by the row's own scrollLeft, never scrollIntoView: the page must not move)
    function draw(focusKey, first) {
      const keep = {};
      root.querySelectorAll("[data-row]").forEach((r) => (keep[r.dataset.row] = r.scrollLeft));
      root.innerHTML = `<div class="f-chips f-chips--scroll">${controls()}${active()}<div class="f-chips-results">${results()}</div></div>`;
      // the full names of the methods where they fit in two lines of a wrapping row; else the short ones (on phones the
      // row scrolls and always takes the short names: chips.css)
      const f = root.firstElementChild, mrow = root.querySelector('[data-row="m"]');
      if (getComputedStyle(mrow).flexWrap === "wrap") {
        const lines = new Set([...mrow.children].map((p) => Math.round(p.offsetTop))).size;
        f.classList.toggle("f-chips--short", lines > 2);
      }
      root.querySelectorAll("[data-row]").forEach((row) => {
        if (!first) { row.scrollLeft = keep[row.dataset.row] || 0; return; }
        const on = row.querySelector(".is-on");
        if (!on || row.scrollWidth <= row.clientWidth) return;
        const a = row.getBoundingClientRect(), b = on.getBoundingClientRect();
        if (b.right > a.right - 16) row.scrollLeft += b.right - a.right + 48;
      });
      if (focusKey) {
        const el = root.querySelector(`[data-k="${CSS.escape(focusKey)}"]`) || root.querySelector('[data-k="more"]');
        if (el) el.focus({ preventScroll: true });
      }
    }

    root.addEventListener("click", (e) => {
      const b = e.target.closest("[data-k]");
      if (!b || !root.contains(b)) return;
      let k = b.dataset.k, focus = k;
      if (k === "more" || k === "fold") { open = k === "more" ? !open : false; focus = "more"; }
      else if (k === "reset") { st.method = st.chip = null; st.cells = []; for (const l of LISTS) st[l] = []; focus = null; }
      else {
        const remove = k.startsWith("x:");
        if (remove) k = k.slice(2);
        const i = k.indexOf(":"), g = i < 0 ? k : k.slice(0, i), v = k.slice(i + 1);
        if (g === "cells") st.cells = [];
        else if (g === "m") st.method = st.method === v ? null : v;
        else if (g === "c") st.chip = st.chip === v ? null : v;
        else st[g] = st[g].includes(v) ? st[g].filter((x) => x !== v) : [...st[g], v];
        // a removed tag hands the focus to the next tag (or the reset), so the keyboard is not thrown to the top
        if (remove) {
          const tags = [...root.querySelectorAll(".f-chips-tag")], at = tags.indexOf(b);
          const next = tags[at + 1] || tags[at - 1];
          focus = next ? next.dataset.k : "more";
        }
      }
      draw(focus);
    });
    draw(null, true);
  }
});
