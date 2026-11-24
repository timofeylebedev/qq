// «Полки»: the catalogue's way in as a small roaster's shop shelves (La Cabra's sections, Methodical's Classic /
// Contemporary / Avant-Garde, Master of Malt's flavour groups). No filter panel at the first level: the 25 coffees stand
// on five shelves by taste, each with a plain name, one line of what it tastes like and an everyday food to compare.
// Above them, one row of brewing methods (it marks the roast and grind on every card and moves the coffees QQ doesn't
// roast for it to the end of their shelf) and one row of scenario chips (they light their coffees across the shelves
// and jump to the first lit shelf). «Все фильтры» opens acidity, taste and country. Every match comes from ctx.rank.
(() => {
  const ID = "shelves";
  // The shelves, from the coded data (in this order, the first that fits wins):
  //  · Необычные: the «Необычное» chip itself (the taste model's position.unusual ≥ 2: ferment, anaerobic, culturing);
  //  · Мягкие: acidity 1–2 (the «Мягкая» level);
  //  · Яркие и сочные: acidity 4–5 (the «Яркая» level);
  //  · Фруктовые и лёгкие: acidity 3 with a light body (density 2) or a touch of ferment (unusual 0.4–2);
  //  · Сбалансированные: acidity 3, body 3–5, no ferment.
  // The decaf stays on its taste's shelf (Сбалансированные): caffeine isn't a taste, a shelf of one coffee is no shelf,
  // and a visitor who drinks decaf still chooses it by taste. Its card says «Без кофеина».
  const SHELVES = [
    { id: "soft", ru: "Мягкие", line: "Кислинки почти нет, вкус сладкий и спокойный", like: "как молочный шоколад" },
    { id: "balanced", ru: "Сбалансированные", line: "Немного кислинки и много сладости", like: "как орехи с сухофруктами" },
    { id: "fruit", ru: "Фруктовые и лёгкие", line: "Сочно и легко, кислинка средняя", like: "как фруктовый чай" },
    { id: "bright", ru: "Яркие и сочные", line: "Яркая кислинка, ягоды и цитрус", like: "как ягодный морс" },
    { id: "unusual", ru: "Необычные", line: "Ферментация и смелые обработки", like: "как сидр или ликёрная конфета" }
  ];
  const shelfOf = (c) => c.chips.includes("unusual") ? "unusual" : c.acid === "soft" ? "soft" : c.acid === "bright" ? "bright"
    : c.coded.density <= 2 || c.position.unusual >= 0.4 ? "fruit" : "balanced";
  const fits = (n) => `${n % 10 === 1 && n % 100 !== 11 ? "Подходит" : "Подходят"} ${n}`;
  let uid = 0;

  function render(root, ctx) {
    const { esc } = ctx, s0 = ctx.state || {};
    const me = ++uid;
    let method = s0.method || null, chip = s0.chip || null;
    let acid = [...(s0.acid || [])], tastes = [...(s0.tastes || [])], country = [...(s0.country || [])], cells = [...(s0.cells || [])];
    let open = acid.length + tastes.length + country.length > 0;
    const state = (over = {}) => ({ method, chip, acid, tastes, country, cells, ...over });
    const count = (over) => ctx.rank(state(over)).exact.length;
    const on = (list, v) => list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
    // the countries, the most coffees first
    const cn = new Map();
    for (const c of ctx.coffees) for (const x of c.countries) cn.set(x, (cn.get(x) || 0) + 1);
    const countries = [...cn].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ru")).map(([x]) => x);

    const pill = (key, label, pressed, n, attrs = "") =>
      `<button type="button" class="f-shelves-pill" data-k="${key}" aria-pressed="${pressed}"${attrs}>${esc(label)}${n == null ? "" : ` <span class="f-shelves-n">${n}</span>`}</button>`;

    function draw(jump) {
      // keep the place of the sideways rows and the focus across the redraw
      const rows = Object.fromEntries([...root.querySelectorAll("[data-row]")].map((r) => [r.dataset.row, r.scrollLeft]));
      const focus = root.contains(document.activeElement) ? document.activeElement.dataset.k : null;
      const s = state(), r = ctx.rank(s), active = ctx.conditions(s).length > 0;
      const exact = new Set(r.exact), near = new Map(r.near.map((n) => [n.c, n.missing]));
      const lit = (c) => !active || exact.has(c) || (r.empty && near.has(c));
      const miss = (c) => method && !c.methods[method].ok;
      const order = [...r.exact, ...r.near.map((n) => n.c), ...r.rest];
      const nSec = acid.length + tastes.length + country.length + cells.length;

      // the summary: how many fit, and the way back
      let sum;
      if (!active) sum = `<p class="f-shelves-say">${ctx.coffees.length} кофе на ${SHELVES.length} полках</p>`;
      else if (r.empty) sum = `<p class="f-shelves-say"><b>Точно таких нет</b></p>`;
      else sum = `<p class="f-shelves-say"><b>${fits(r.exact.length)}</b></p>`;
      // when the lit coffees stand on some shelves only, a line names them, each a jump to its shelf
      const litOn = active ? SHELVES.map((sh) => [sh, order.filter((c) => shelfOf(c) === sh.id && lit(c)).length]).filter(([, n]) => n) : [];
      const where = litOn.length && litOn.length < SHELVES.length
        ? `<p class="f-shelves-where">${r.empty ? `Ближе всего ${r.near.length}: на` : "На"} ${litOn.length > 1 ? "полках" : "полке"} ${litOn.map(([sh, n]) => `<button type="button" class="f-shelves-go" data-k="go:${sh.id}">${esc(sh.ru)}</button>&nbsp;${n}`).join(", ")}</p>` : "";

      const shelves = SHELVES.map((sh) => {
        const list = order.filter((c) => shelfOf(c) === sh.id);
        const sorted = [...list.filter((c) => !miss(c)), ...list.filter(miss)];
        const nLit = list.filter(lit).length;
        const head = !active ? `<span class="f-shelves-count">${list.length}</span>`
          : nLit ? `<span class="f-shelves-count is-lit">${r.empty ? `Ближе всего ${nLit}` : `${fits(nLit)} из ${list.length}`}</span>`
          : `<span class="f-shelves-count">Нет подходящих</span>`;
        const cards = sorted.map((c) => {
          const notes = [];
          if (c.decaf) notes.push("Без кофеина");
          if (near.has(c)) { const m = near.get(c); notes.push((r.empty || m.every((x) => x === ctx.choose.roastMiss(c)) ? "" : "Почти: ") + m.join(", ")); }
          else if (miss(c)) notes.push(ctx.choose.roastMiss(c));
          return ctx.card(c, { method, note: notes.join(" · "), muted: active && !lit(c) });
        }).join("");
        return `<section class="f-shelves-shelf${active && nLit ? " is-lit" : ""}" data-shelf="${sh.id}" aria-label="${esc(sh.ru)}">
          <header class="f-shelves-head"><h3 class="f-shelves-name">${esc(sh.ru)}</h3>${head}
            <p class="f-shelves-line">${esc(sh.line)} — <span class="f-shelves-like">${esc(sh.like)}</span></p></header>
          <div class="f-shelves-row" data-row="shelf-${sh.id}">${cards}</div>
        </section>`;
      }).join("");

      const group = (title, key, items, list) => `<div class="f-shelves-group"><span class="f-shelves-lab">${esc(title)}</span><div class="f-shelves-scroll" data-row="g-${key}" role="group" aria-label="${esc(title)}">${
        items.map(([v, label]) => pill(`${key}:${v}`, label, list.includes(v), list.includes(v) ? null : count({ [key]: [...list, v] }))).join("")}</div></div>`;

      root.innerHTML = `<div class="f-shelves">
        <div class="f-shelves-ctl">
          <div class="f-shelves-scroll" data-row="m" role="group" aria-label="Чем варите">
            <span class="f-shelves-lab">Чем варите</span>
            ${ctx.methods.map((m) => pill(`m:${m.id}`, m.short, method === m.id, count({ method: m.id }), ` title="${esc(m.ru)}"`)).join("")}
          </div>
          <div class="f-shelves-scroll" data-row="c" role="group" aria-label="Что хочется">
            <span class="f-shelves-lab">Что хочется</span>
            ${ctx.chips.map((ch) => pill(`c:${ch.id}`, ch.ru, chip === ch.id, count({ chip: ch.id }))).join("")}
          </div>
          <div class="f-shelves-sum" aria-live="polite">${sum}
            <span class="f-shelves-acts">${active ? `<button type="button" class="f-shelves-link" data-k="reset">Сбросить</button>` : ""}
            <button type="button" class="f-shelves-link" data-k="more" aria-expanded="${open}" aria-controls="f-shelves-more-${me}">Все фильтры${nSec ? ` · ${nSec}` : ""}</button></span>
          </div>${where}
          <div class="f-shelves-more" id="f-shelves-more-${me}"${open ? "" : " hidden"}>
            ${group("Кислотность", "acid", ctx.acidity.map((a) => [a.id, `${a.ru} ${a.hint}`]), acid)}
            ${group("Вкус", "tastes", ctx.tastes.map((t) => [t.id, t.ru]), tastes)}
            ${group("Страна", "country", countries.map((x) => [x, x]), country)}
            ${cells.length ? `<div class="f-shelves-group"><span class="f-shelves-lab">Карта</span><div class="f-shelves-scroll">${pill("cells", "Место на карте ×", true, null)}</div></div>` : ""}
          </div>
        </div>
        <div class="f-shelves-shelves">${shelves}</div>
      </div>`;

      // a row keeps its place; a row drawn anew shows its first pressed pill
      for (const el of root.querySelectorAll("[data-row]")) {
        if (el.dataset.row.startsWith("shelf-")) continue;
        if (rows[el.dataset.row] != null) { el.scrollLeft = rows[el.dataset.row]; continue; }
        const p = el.querySelector('[aria-pressed="true"]');
        if (p && p.offsetLeft + p.offsetWidth > el.clientWidth) el.scrollLeft = p.offsetLeft + p.offsetWidth - el.clientWidth + 48;
      }
      if (focus) (root.querySelector(`[data-k="${CSS.escape(focus)}"]`) || root.querySelector('[data-k="more"]')).focus({ preventScroll: true });
      // a chip jumps to the first shelf it lights, when that shelf isn't on the screen already
      if (jump) {
        const first = typeof jump === "string" ? root.querySelector(`[data-shelf="${jump}"]`) : root.querySelector(".f-shelves-shelf.is-lit");
        if (first) {
          const box = first.getBoundingClientRect();
          if (typeof jump === "string" || box.top > innerHeight * 0.6 || box.bottom < 0)
            first.scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
        }
      }
    }

    root.addEventListener("click", (e) => {
      const b = e.target.closest("[data-k]");
      if (!b || !root.contains(b)) return;
      const [kind, v] = b.dataset.k.split(/:(.*)/s);
      let jump = false;
      if (kind === "m") method = method === v ? null : v;
      else if (kind === "c") { chip = chip === v ? null : v; jump = !!chip; }
      else if (kind === "acid") acid = on(acid, v);
      else if (kind === "tastes") tastes = on(tastes, v);
      else if (kind === "country") country = on(country, v);
      else if (kind === "cells") cells = [];
      else if (kind === "more") open = !open;
      else if (kind === "go") jump = v;
      else if (kind === "reset") { method = chip = null; acid = []; tastes = []; country = []; cells = []; }
      draw(jump);
    });
    draw(false);
  }

  QQBench.register({
    id: ID,
    name: "Полки",
    idea: "Все 25 кофе стоят на пяти полках по вкусу — от мягких к необычным, у каждой понятное имя и знакомый вкус для сравнения; способ заваривания и сценарий подсвечивают подходящие прямо на полках.",
    notes: "Полки не сужают выбор: подходящие встают первыми на своей полке и подсвечиваются, но на телефоне их приходится искать по рядам, а не видеть одним списком. Границы полок — наше решение: кофе на краю (Перу Монте Верде, Вьетнам Куа Мон) мог бы стоять и на соседней.",
    render
  });
})();
