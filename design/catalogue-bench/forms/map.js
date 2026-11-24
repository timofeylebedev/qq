// «Карта вкуса»: the way in is a map of all 25 coffees. Acidity across («мягче» left, «ярче» right), body up
// («плотнее» above, «легче» below); each coffee a dot at its place (c.map.tall: the layout already keeps dots apart).
// The map is cut into nine regions (c.cell) by faint hairlines drawn between the dots' own bands; a region is a
// toggle (state.cells), a dot shows its coffee (name, one line, a button down to its card). The method and scenario
// chips light the dots they match (the others stay, dimmed) and lift the cards, exactly as a region does: a chip
// lights a region, a region is a chip. Acidity, taste and country are one tap away («Ещё фильтры»). Everything is
// ranked by ctx.rank (matches, «Почти», the rest). The tall shape at every width: the wide one would need the column's
// whole width before its dots reach 24px, so from M the map stands beside its controls instead.
(() => {
  const P = "f-map";
  let seq = 0;
  const ACID = ["soft", "mid", "bright"];          // columns, left → right
  const BODY = ["dense", "mid", "light"];          // rows, top → bottom
  const CELL = {
    "soft-dense": "Мягче и плотнее", "mid-dense": "Плотнее", "bright-dense": "Ярче и плотнее",
    "soft-mid": "Мягче", "mid-mid": "Середина", "bright-mid": "Ярче",
    "soft-light": "Мягче и легче", "mid-light": "Легче", "bright-light": "Ярче и легче"
  };
  const LABELS_UPTO = 6;                           // names beside the lit dots when this few are lit
  const plural = (n, one, many) => (n % 10 === 1 && n % 100 !== 11 ? one : many);

  // where the hairlines go: midway between the last dot of one band and the first of the next
  function bands(list, pos, band, order) {
    const span = order.map((id) => {
      const xs = list.filter((c) => band(c) === id).map(pos);
      return xs.length ? [Math.min(...xs), Math.max(...xs)] : null;
    });
    const cuts = [];
    for (let i = 0; i < order.length - 1; i++) {
      const a = span[i], b = span[i + 1];
      const cut = a && b ? (a[1] + b[0]) / 2 : (i + 1) / order.length;
      if (a && b && a[1] >= b[0]) console.warn(`${P}: bands ${order[i]} / ${order[i + 1]} overlap on the map`);
      cuts.push(cut);
    }
    return [0, ...cuts, 1];
  }

  function render(root, ctx) {
    const id = `${P}-${++seq}`;
    const st = ctx.state || {};
    const S = { method: st.method || null, chip: st.chip || null, acid: [...(st.acid || [])], tastes: [...(st.tastes || [])], country: [...(st.country || [])], cells: [...(st.cells || [])] };
    let shown = null, target = null, extraOpen = false;
    const esc = ctx.esc, total = ctx.coffees.length;
    const shape = ctx.map.shapes.tall, aspect = shape.aspect;
    const pos = (c) => c.map.tall;
    const xs = bands(ctx.coffees, (c) => pos(c).u, (c) => c.cell.split("-")[0], ACID);
    const ys = bands(ctx.coffees, (c) => pos(c).v, (c) => c.cell.split("-")[1], BODY);
    const odd = (c) => c.position.unusual >= 2;
    const countries = [...new Set(ctx.coffees.flatMap((c) => c.countries))]
      .map((n) => [n, ctx.coffees.filter((c) => c.countries.includes(n)).length])
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ru")).map(([n]) => n);
    // the dots in reading order (top to bottom, left to right), for a screen reader and the keys
    const dots = ctx.coffees.slice().sort((a, b) => pos(a).v - pos(b).v || pos(a).u - pos(b).u);

    const chip = (k, v, label, title = "") => `<button type="button" class="${P}__chip" data-k="${k}" data-v="${esc(v)}" aria-pressed="false"${title ? ` aria-label="${esc(title)}"` : ""}><span>${esc(label)}</span><span class="${P}__n" aria-hidden="true"></span></button>`;
    const cells = [];
    BODY.forEach((b, r) => ACID.forEach((a, k) => cells.push({ id: `${a}-${b}`, r, k, x0: xs[k], x1: xs[k + 1], y0: ys[r], y1: ys[r + 1] })));
    const pct = (n) => `${(n * 100).toFixed(3)}%`;

    root.innerHTML = `<div class="${P}">
      <div class="${P}__top">
        <div class="${P}__plot">
          <div class="${P}__box" style="aspect-ratio:${aspect}">
            <div class="${P}__cells" role="group" aria-label="Области карты">${cells.map((c, i) => `<button type="button" class="${P}__cell${c.k === 2 ? " is-last-col" : ""}${c.r === 2 ? " is-last-row" : ""}" data-cell="${c.id}" data-r="${c.r}" data-k="${c.k}" aria-pressed="false" tabindex="${i ? -1 : 0}" style="left:${pct(c.x0)};top:${pct(c.y0)};width:${pct(c.x1 - c.x0)};height:${pct(c.y1 - c.y0)}"></button>`).join("")}</div>
            <span class="${P}__ax ${P}__ax--up" aria-hidden="true">↑ Плотнее</span><span class="${P}__ax ${P}__ax--key" aria-hidden="true"><i class="${P}__key is-odd"></i>необычный<i class="${P}__key is-decaf"></i>без кофеина</span>
            <span class="${P}__ax ${P}__ax--soft" aria-hidden="true">← Мягче</span><span class="${P}__ax ${P}__ax--down" aria-hidden="true" style="left:${pct((xs[1] + xs[2]) / 2)}">↓ Легче</span><span class="${P}__ax ${P}__ax--bright" aria-hidden="true">Ярче →</span>
            <div class="${P}__dots" role="group" aria-label="Кофе на карте">${dots.map((c, i) => `<button type="button" class="${P}__dot${odd(c) ? " is-odd" : ""}${c.decaf ? " is-decaf" : ""}" data-slug="${c.slug}" aria-pressed="false" tabindex="${i ? -1 : 0}" style="--u:${pos(c).u};--v:${pos(c).v}"></button>`).join("")}</div>
            <div class="${P}__labels" aria-hidden="true"></div>
          </div>
        </div>
        <div class="${P}__side">
          <div class="${P}__info" hidden></div>
          <div class="${P}__rows">
            <div class="${P}__row" role="group" aria-label="Чем варите">${ctx.methods.map((m) => chip("method", m.id, m.short, m.ru)).join("")}</div>
            <div class="${P}__row" role="group" aria-label="Сценарий">${ctx.chips.map((c) => chip("chip", c.id, c.ru)).join("")}</div>
          </div>
          <div class="${P}__status"><p class="${P}__count" aria-live="polite"></p><span class="${P}__hint">Нажмите на точку или на область карты</span><span class="${P}__pills"></span>
            <button type="button" class="${P}__pill ${P}__reset" hidden>Сбросить</button>
            <button type="button" class="${P}__pill ${P}__more" aria-expanded="false" aria-controls="${id}-extra">Ещё фильтры<span class="${P}__n"></span></button></div>
          <div class="${P}__extra" id="${id}-extra" hidden>
            <div class="${P}__group"><h3 class="${P}__gh">Кислотность</h3><div class="${P}__wrap">${ctx.acidity.map((a) => chip("acid", a.id, `${a.ru} · ${a.hint}`)).join("")}</div></div>
            <div class="${P}__group"><h3 class="${P}__gh">Вкус</h3><div class="${P}__wrap">${ctx.tastes.map((t) => chip("tastes", t.id, t.ru)).join("")}</div></div>
            <div class="${P}__group"><h3 class="${P}__gh">Страна</h3><div class="${P}__wrap">${countries.map((n) => chip("country", n, n)).join("")}</div></div>
          </div>
        </div>
      </div>
      <div class="${P}__grid"></div>
    </div>`;

    const $ = (s) => root.querySelector(s), $$ = (s) => [...root.querySelectorAll(s)];
    const box = $(`.${P}__box`), labelsEl = $(`.${P}__labels`), info = $(`.${P}__info`), grid = $(`.${P}__grid`);
    const dotEls = $$(`.${P}__dot`), cellEls = $$(`.${P}__cell`), chipEls = $$(`.${P}__chip`);
    const dotOf = new Map(dotEls.map((d) => [d.dataset.slug, d]));

    // ── the state ────────────────────────────────────────────────────────────────────────────────────────────
    const has = (s, k, v) => (Array.isArray(s[k]) ? s[k].includes(v) : s[k] === v);
    const toggled = (s, k, v) => {
      const n = structuredClone(s);
      if (Array.isArray(n[k])) n[k] = n[k].includes(v) ? n[k].filter((x) => x !== v) : [...n[k], v];
      else n[k] = n[k] === v ? null : v;
      return n;
    };
    const clean = (s) => Object.fromEntries(Object.entries(s).filter(([, v]) => (Array.isArray(v) ? v.length : v)));
    const extras = () => S.acid.length + S.tastes.length + S.country.length;
    const label = (k, v) => k === "cells" ? CELL[v] : k === "acid" ? `Кислотность: ${ctx.acidity.find((a) => a.id === v).ru.toLowerCase()}`
      : k === "tastes" ? ctx.tastes.find((t) => t.id === v).ru : v;

    let R = null, exact = new Set(), lead = [], any = false;
    function update() {
      const s = clean(S);
      R = ctx.rank(s);
      any = ctx.conditions(s).length > 0;
      exact = new Set(R.exact.map((c) => c.slug));
      // the map lights what the list leads with: the matches, or, when nothing matches, the nearest
      lead = R.exact.length ? R.exact : R.near.map((x) => x.c);
      const leadSet = new Set(lead.map((c) => c.slug));
      // chips: pressed, and how many the press would find
      for (const b of chipEls) {
        const { k, v } = b.dataset, on = has(S, k, v);
        b.setAttribute("aria-pressed", on);
        b.querySelector(`.${P}__n`).textContent = ctx.rank(clean(on ? S : toggled(S, k, v))).exact.length;
      }
      // regions
      for (const b of cellEls) {
        const on = S.cells.includes(b.dataset.cell);
        const n = ctx.coffees.filter((c) => c.cell === b.dataset.cell).length;
        b.setAttribute("aria-pressed", on);
        b.setAttribute("aria-label", `${CELL[b.dataset.cell]}: ${n} кофе`);
      }
      // dots: lit (a match) or dimmed (still there)
      for (const d of dotEls) {
        const c = ctx.by[d.dataset.slug], lit = !any || leadSet.has(c.slug);
        d.classList.toggle("is-dim", !lit);
        d.setAttribute("aria-pressed", shown === c.slug);
        d.setAttribute("aria-label", [c.name, CELL[c.cell].toLowerCase(), odd(c) && "необычный", c.decaf && "без кофеина", any && (exact.has(c.slug) ? "подходит" : lit ? "ближе всего" : "не подходит")].filter(Boolean).join(", "));
      }
      // the status: how many, what is on, the way back
      const n = R.exact.length;
      $(`.${P}__count`).textContent = !any ? "" : n ? `${plural(n, "Подходит", "Подходят")} ${n} из ${total}` : "Точно таких нет";
      $(`.${P}__hint`).hidden = any;
      $(`.${P}__pills`).innerHTML = ["cells", "acid", "tastes", "country"].flatMap((k) => S[k].map((v) =>
        `<button type="button" class="${P}__pill ${P}__off" data-k="${k}" data-v="${esc(v)}" aria-label="Убрать: ${esc(label(k, v))}">${esc(label(k, v))}<span aria-hidden="true">×</span></button>`)).join("");
      $(`.${P}__reset`).hidden = !any;
      const more = $(`.${P}__more`);
      more.setAttribute("aria-expanded", extraOpen);
      more.querySelector(`.${P}__n`).textContent = extras() ? ` · ${extras()}` : "";
      $(`.${P}__extra`).hidden = !extraOpen;
      drawInfo();
      drawGrid();
      placeLabels();
    }

    // ── the coffee of a tapped dot ────────────────────────────────────────────────────────────────────────────
    function drawInfo() {
      const c = shown && ctx.by[shown];
      info.hidden = !c;
      if (!c) { info.innerHTML = ""; return; }
      const miss = any && !exact.has(c.slug) ? ctx.conditions(clean(S)).filter((k) => !k.test(c)).map((k) => k.miss(c)).join(", ") : "";
      const marks = [odd(c) && "необычный", c.decaf && "без кофеина"].filter(Boolean).join(" · ");
      info.innerHTML = `<div class="${P}__ihead"><h3 class="${P}__iname">${esc(c.name)}</h3><button type="button" class="${P}__x" aria-label="Скрыть">×</button></div>
        <p class="${P}__iline">${esc(c.short.replace(/\.$/, ""))}.${marks ? ` <span class="${P}__imark">${esc(marks[0].toUpperCase() + marks.slice(1))}.</span>` : ""}</p>
        ${miss ? `<p class="${P}__imiss">Не подходит: ${esc(miss)}</p>` : ""}
        <button type="button" class="${P}__go" data-slug="${c.slug}">К карточке <span aria-hidden="true">↓</span></button>`;
    }

    // ── the grid: matches, «Почти», the rest ──────────────────────────────────────────────────────────────────
    function drawGrid() {
      const m = S.method;
      const cards = (list, note) => `<div class="bgrid">${list.map((x) => ctx.card(x.c || x, { method: m, note: note ? note(x) : "" })).join("")}</div>`;
      let h = "";
      if (!any) h = cards(R.exact);
      else {
        if (R.exact.length) h += `<section class="${P}__sec"><h3 class="${P}__h">${plural(R.exact.length, "Подходит", "Подходят")} ${R.exact.length} <span>из ${total}</span></h3>${cards(R.exact)}</section>`;
        else h += `<p class="${P}__empty">Точно таких нет — ближе всего:</p>`;
        if (R.near.length) h += `<section class="${P}__sec">${R.exact.length ? `<h3 class="${P}__h">Почти</h3>` : ""}${cards(R.near, (x) => x.missing.join(", "))}</section>`;
        if (R.rest.length) h += `<section class="${P}__sec"><h3 class="${P}__h">Остальные</h3>${cards(R.rest)}</section>`;
      }
      grid.innerHTML = h;
      for (const a of grid.querySelectorAll(".bcard")) { a.id = `${id}-${a.dataset.slug}`; a.tabIndex = -1; a.classList.toggle("is-target", a.dataset.slug === target); }
    }

    // ── names beside the lit dots, where they fit ─────────────────────────────────────────────────────────────
    let W = 0, H = 0;
    function placeLabels() {
      labelsEl.innerHTML = "";
      const lit = any ? lead : [];
      if (!lit.length || lit.length > LABELS_UPTO || !W) return;
      const slot = 2 * shape.r * W, rd = Math.max(12, slot * 0.6) / 2;
      const at = (c) => ({ x: pos(c).u * W, y: pos(c).v * H });
            const placed = [...$$(`.${P}__ax`)].map((e) => ({ x: e.offsetLeft, y: e.offsetTop, w: e.offsetWidth, h: e.offsetHeight }));
      const hit = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
      const onDot = (r, c) => { const p = at(c); const dx = Math.max(r.x - p.x, 0, p.x - r.x - r.w), dy = Math.max(r.y - p.y, 0, p.y - r.y - r.h); return Math.hypot(dx, dy) < rd + 1; };
      for (const c of lit.slice().sort((a, b) => pos(a).u - pos(b).u)) {
        const el = document.createElement("span");
        el.className = `${P}__label`; el.textContent = c.name;
        labelsEl.append(el);
        const w = el.offsetWidth, h = el.offsetHeight, p = at(c), g = rd + 3;
        // beside, then above or below, then slanted
        const d = g * 0.7;
        const tries = [{ x: p.x + g, y: p.y - h / 2 }, { x: p.x - g - w, y: p.y - h / 2 }, { x: p.x - w / 2, y: p.y - g - h }, { x: p.x - w / 2, y: p.y + g },
          { x: p.x + d, y: p.y - d - h }, { x: p.x + d, y: p.y + d }, { x: p.x - d - w, y: p.y - d - h }, { x: p.x - d - w, y: p.y + d }];
        // a lit dot is never covered; a dimmed one only when there is no other place (the name has a halo, the dot shows)
        let best = null, bs = Infinity;
        for (const r of tries.map((t) => ({ ...t, w, h }))) {
          if (r.x < 2 || r.y < 2 || r.x + w > W - 2 || r.y + h > H - 2 || placed.some((q) => hit(r, q))) continue;
          if (lit.some((o) => o !== c && onDot(r, o))) continue;
          const n = ctx.coffees.filter((o) => o !== c && onDot(r, o)).length;
          if (n < bs) { bs = n; best = r; }
        }
        if (!best) { el.remove(); continue; }
        el.style.left = `${best.x}px`; el.style.top = `${best.y}px`;
        placed.push(best);
      }
    }
    const size = () => {
      W = box.clientWidth; H = box.clientHeight;
      box.style.setProperty("--slot", `${(2 * shape.r * W).toFixed(2)}px`);
      if (R) placeLabels();
    };
    new ResizeObserver(size).observe(box);
    size();
    if (document.fonts) document.fonts.ready.then(() => R && placeLabels());

    // ── taps ──────────────────────────────────────────────────────────────────────────────────────────────────
    root.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b || !root.contains(b)) return;
      if (b.matches(`.${P}__chip`)) { Object.assign(S, toggled(S, b.dataset.k, b.dataset.v)); update(); return; }
      if (b.matches(`.${P}__cell`)) { S.cells = toggled(S, "cells", b.dataset.cell).cells; roving(cellEls, b); update(); return; }
      if (b.matches(`.${P}__dot`)) { shown = shown === b.dataset.slug ? null : b.dataset.slug; roving(dotEls, b); update(); return; }
      if (b.matches(`.${P}__off`)) {
        const { k, v } = b.dataset; S[k] = S[k].filter((x) => x !== v); update();
        ($(`.${P}__off`) || $(`.${P}__more`)).focus(); return;
      }
      if (b.matches(`.${P}__reset`)) { Object.assign(S, { method: null, chip: null, acid: [], tastes: [], country: [], cells: [] }); update(); $(`.${P}__more`).focus(); return; }
      if (b.matches(`.${P}__more`)) { extraOpen = !extraOpen; update(); return; }
      if (b.matches(`.${P}__x`)) { const d = dotOf.get(shown); shown = null; update(); d && d.focus(); return; }
      if (b.matches(`.${P}__go`)) {
        target = b.dataset.slug;
        for (const a of grid.querySelectorAll(".bcard")) a.classList.toggle("is-target", a.dataset.slug === target);
        const card = document.getElementById(`${id}-${target}`);
        if (card) { card.scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); card.focus({ preventScroll: true }); }
      }
    });

    // ── keys: one stop for the regions, one for the dots; arrows move inside them ─────────────────────────────
    function roving(list, el) { for (const x of list) x.tabIndex = x === el ? 0 : -1; }
    function step(list, from, dx, dy, where) {
      const a = where(from); let best = null, bs = Infinity;
      for (const el of list) {
        if (el === from) continue;
        const b = where(el), ex = b.x - a.x, ey = b.y - a.y, along = ex * dx + ey * dy;
        if (along <= 1e-6) continue;
        const s = along + 2.5 * Math.abs(ex * dy - ey * dx);
        if (s < bs) { bs = s; best = el; }
      }
      return best;
    }
    const DIR = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] };
    root.addEventListener("keydown", (e) => {
      const d = DIR[e.key]; if (!d) return;
      const b = e.target.closest(`.${P}__dot, .${P}__cell`); if (!b) return;
      const isDot = b.matches(`.${P}__dot`), list = isDot ? dotEls : cellEls;
      const where = isDot ? (el) => ({ x: +el.style.getPropertyValue("--u"), y: +el.style.getPropertyValue("--v") / aspect }) : (el) => ({ x: +el.dataset.k, y: +el.dataset.r });
      const n = step(list, b, d[0], d[1], where);
      if (n) { e.preventDefault(); roving(list, n); n.focus(); }
    });

    update();
    // a chip pressed from the start stays in view in its row (phones scroll the rows sideways)
    for (const row of $$(`.${P}__row`)) {
      const on = row.querySelector('[aria-pressed="true"]');
      if (on && row.scrollWidth > row.clientWidth) row.scrollLeft = Math.max(0, on.offsetLeft - row.offsetLeft - 16);
    }
  }

  QQBench.register({
    id: "map",
    name: "Карта вкуса",
    idea: "Все 25 кофе — точки на карте вкуса (кислотность поперёк, плотность вверх): нажмите на область или выберите способ и сценарий, и карта подсветит подходящие, а список поднимет их наверх.",
    notes: "Карта честно показывает, где кофе стоят друг относительно друга, но середина плотная (восемь кофе с кислотностью 3 и плотностью 3), и новичку надо сначала понять две оси; на телефоне карта занимает около 300 px перед первой карточкой.",
    render
  });
})();
