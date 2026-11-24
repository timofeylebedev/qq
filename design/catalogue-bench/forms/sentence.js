// The sentence («Фраза»): the choice reads as one sentence the visitor completes at the top of the catalogue.
// «Варю [в чём угодно ▾], пью [как угодно ▾], люблю [любой кофе ▾] [с любым вкусом ▾].» Each bracket is a native
// <select> laid invisibly over its words (the phone's own picker, 44px tall, the words stay part of the sentence).
// Every option says how many coffees it would find with the other brackets as they are. Below: «Вот 3, с которых
// стоит начать» (larger cards, why in lavender), «Ещё подходят», «Почти» (what each misses), «Остальные». Nothing
// matches: the sentence says so, offers to loosen one bracket (with the count it would give), and the near misses lead.
// Ranking is the site's: ctx.choose.rank over ctx.conditions (+ the secondary filters' own conditions).
(() => {
  // the method in the sentence's case («варю в …»), by id; a method not listed falls back to its own name
  const IN = {
    auto: "в автоматической кофемашине", espresso: "в рожковой кофемашине", moka: "в гейзерной кофеварке", turka: "в турке",
    pourover: "в воронке или дрип-пакете", drip: "в капельной кофеварке", aeropress: "в аэропрессе", press: "во френч-прессе"
  };
  // «со вкусом …» in the genitive, by taste group
  const OF = { choc: "шоколада и орехов", caramel: "карамели и мёда", berry: "ягод", citrus: "цитрусов", fruit: "фруктов", tea: "чая и цветов", wild: "ликёра и специй" };
  const DRINK = [["", "как угодно"], ["milk", "с молоком"], ["black", "чёрный"]];
  // «люблю …»: acidity levels and the two character chips; «без яркой кислотности» is the chip «soft» (acidity 1–2)
  const LIKE = [["", "любой кофе"], ["soft", "кофе без яркой кислотности"], ["mid", "кофе со средней кислотностью"], ["bright", "кофе с яркой кислотностью"],
    ["everyday", "простой кофе на каждый день"], ["unusual", "необычный кофе"]];
  const LEVELS = ["soft", "mid", "bright"];
  const MORE = [["country", "Страна", (c) => c.countries], ["process", "Обработка", (c) => c.processes], ["type", "Моносорт или смесь", (c) => [c.type]], ["line", "Линейка", (c) => [c.line]]];
  const plural = (n, one, few, many) => { const a = n % 10, b = n % 100; return a === 1 && b !== 11 ? one : a >= 2 && a <= 4 && (b < 12 || b > 14) ? few : many; };

  function render(root, ctx) {
    const { esc } = ctx;
    const s0 = ctx.state || {};
    // the form's own state: one value per bracket, the secondary filters as sets
    const st = { method: s0.method || "", drink: "", like: "", taste: (s0.tastes || [])[0] || "", more: { country: new Set(s0.country || []), process: new Set(), type: new Set(), line: new Set() }, open: false };
    if (s0.chip === "milk") st.drink = "milk"; else if (s0.chip) st.like = s0.chip;
    if (!st.like && s0.acid?.length) st.like = s0.acid[0];
    st.open = MORE.some(([k]) => st.more[k].size > 0);

    const methodOf = (id) => ctx.methods.find((m) => m.id === id);
    const chipOf = (id) => ctx.chips.find((c) => c.id === id);
    // the bracket values → the shell's state ({ method, chip, acid, tastes, country }) + conditions for the rest
    function toState(v) {
      const s = { method: v.method || undefined, acid: [], tastes: v.taste ? [v.taste] : [], country: [...v.more.country] };
      if (v.drink === "milk") s.chip = "milk";
      if (LEVELS.includes(v.like)) { if (v.like === "soft" && !s.chip) s.chip = "soft"; else s.acid = [v.like]; }
      else if (v.like) { if (!s.chip) s.chip = v.like; else s.extraChip = v.like; }
      return s;
    }
    function conditionsOf(v) {
      const s = toState(v), k = ctx.conditions(s);
      if (s.extraChip) k.push(...ctx.conditions({ chip: s.extraChip }));
      for (const [key, , get] of MORE.slice(1)) {
        const set = v.more[key];
        if (set.size) k.push({ id: key, test: (c) => get(c).some((x) => set.has(x)), miss: (c) => get(c).join(", ").toLowerCase() || "—" });
      }
      return k;
    }
    const rankOf = (v) => ctx.choose.rank(ctx.coffees, conditionsOf(v), { dist: ctx.dist });
    const count = (v) => rankOf(v).exact.length;
    const withV = (patch) => ({ ...st, ...patch, more: patch.more || st.more });
    const anySet = (v = st) => !!(v.method || v.drink || v.like || v.taste || MORE.some(([k]) => v.more[k].size));

    // why a match is here, in lavender: the method's roast and grind, then the bracket's own reason
    function why(c) {
      const out = [];
      if (st.method) {
        const f = c.methods[st.method];
        out.push(`${f.roast === "Эспрессо" ? "обжарка под эспрессо" : "обжарка под фильтр"}, ${f.grind === "В зернах" ? "в зёрнах" : "помол " + ({ Эспрессо: "для эспрессо", Фильтр: "для фильтра", Турка: "для турки" })[f.grind]}`);
      }
      if (st.drink === "milk") out.push(chipOf("milk").why.replace("QQ советует его", "советуем"));
      if (LEVELS.includes(st.like)) out.push(`кислотность ${String(c.coded.acidity).replace(".", ",")} из 5`);
      else if (st.like) out.push(chipOf(st.like).why);
      if (st.taste) out.push(`во вкусе ${c.descriptors.slice(0, 2).map((d) => d.toLowerCase()).join(", ")}`);
      return out.join(" · ");
    }

    // ── the sentence ──
    function slot(key, label, options, value, aria, tail = "") {
      const on = value !== "";
      return `<span class="f-sentence-slot${on ? " is-on" : ""}"><span class="f-sentence-word" aria-hidden="true">${esc(label)}</span><span class="f-sentence-caret" aria-hidden="true">▾</span>${tail}` +
        `<select class="f-sentence-select" data-k="${key}" aria-label="${esc(aria)}">${options.map(([v, t, n]) =>
          `<option value="${esc(v)}"${v === value ? " selected" : ""}>${esc(t)}${n == null ? "" : ` · ${n}`}</option>`).join("")}</select></span>`;
    }
    function sentence() {
      const opt = (key, list) => list.map(([v, t]) => [v, t, count(withV({ [key]: v }))]);
      const methods = [["", "в чём угодно"], ...ctx.methods.map((m) => [m.id, IN[m.id] || "— " + m.ru.toLowerCase()])];
      const tastes = [["", "с любым вкусом"], ...ctx.tastes.map((t) => [t.id, "со вкусом " + (OF[t.id] || t.ru.toLowerCase())])];
      const lab = (list, v) => list.find((x) => x[0] === v)[1];
      return `<p class="f-sentence-phrase">Варю ${slot("method", lab(methods, st.method), opt("method", methods), st.method, "Как варите", ",")} ` +
        `пью ${slot("drink", lab(DRINK, st.drink), opt("drink", DRINK), st.drink, "Как пьёте", ",")} ` +
        `люблю ${slot("like", lab(LIKE, st.like), opt("like", LIKE), st.like, "Какой кофе любите")} ` +
        `${slot("taste", lab(tastes, st.taste), opt("taste", tastes), st.taste, "Какой вкус", ".")}</p>`;
    }
    // the secondary filters: one link, then pills (multi-choice) with counts
    function more() {
      const n = MORE.reduce((a, [k]) => a + st.more[k].size, 0);
      let h = `<div class="f-sentence-tools"><button type="button" class="f-sentence-link" data-act="more" aria-expanded="${st.open}">${st.open ? "Скрыть" : "Ещё"}: страна, обработка, линейка${n ? ` · ${n}` : ""}</button>` +
        (anySet() ? `<button type="button" class="f-sentence-link" data-act="reset">× Сбросить</button>` : "") + `</div>`;
      if (!st.open) return h;
      h += `<div class="f-sentence-more">`;
      for (const [key, title, get] of MORE) {
        const vals = [...new Set(ctx.coffees.flatMap(get))].sort((a, b) => a.localeCompare(b, "ru"));
        h += `<div class="f-sentence-group"><h3 class="f-sentence-gh">${title}</h3><div class="f-sentence-pills">` + vals.map((x) => {
          const on = st.more[key].has(x), next = new Set(st.more[key]); on ? next.delete(x) : next.add(x);
          const m = count(withV({ more: { ...st.more, [key]: next } }));
          return `<button type="button" class="pill f-sentence-pill" data-more="${key}" data-v="${esc(x)}" aria-pressed="${on}">${esc(x)}${on ? " ×" : ` <span class="f-sentence-n">${m}</span>`}</button>`;
        }).join("") + `</div></div>`;
      }
      return h + `</div>`;
    }
    // with nothing matching: loosen one bracket, each with what it would find
    function loosen() {
      const opts = [];
      if (st.method) opts.push(["method", "", "в чём угодно"]);
      if (st.drink) opts.push(["drink", "", "пью как угодно"]);
      if (st.like) opts.push(["like", "", "любой кофе"]);
      if (st.taste) opts.push(["taste", "", "с любым вкусом"]);
      for (const [k] of MORE) for (const x of st.more[k]) opts.push(["more:" + k, x, "не только " + x]);
      const scored = opts.map((o) => {
        let v;
        if (o[0].startsWith("more:")) { const k = o[0].slice(5), next = new Set(st.more[k]); next.delete(o[1]); v = withV({ more: { ...st.more, [k]: next } }); }
        else v = withV({ [o[0]]: "" });
        return [...o, count(v)];
      }).filter((o) => o[3] > 0).sort((a, b) => b[3] - a[3]);
      if (!scored.length) return "";
      return `<div class="f-sentence-loosen"><span>Найдутся, если выбрать:</span>` + scored.map(([k, v, t, n]) =>
        `<button type="button" class="pill f-sentence-pill" data-loose="${k}" data-v="${esc(v)}">${esc(t)} <span class="f-sentence-n">${n}</span></button>`).join("") + `</div>`;
    }

    // ── the result ──
    // a match says its roast and grind in lavender (why), so its card doesn't repeat them; the others say them in the card
    const grid = (list, big, note) => `<div class="${big ? "f-sentence-lead" : "f-sentence-grid"}">${list.map((x) => ctx.card(x.c || x, { note: note(x), method: note === why ? null : st.method || null, size: big ? "lead" : "small" })).join("")}</div>`;
    const head = (t, n) => `<h3 class="f-sentence-h">${t}${n != null ? ` <span class="f-sentence-hn">${n}</span>` : ""}</h3>`;
    function result() {
      const r = rankOf(st), total = ctx.coffees.length;
      if (!anySet()) return `<section class="f-sentence-sec">${head("Все кофе", total)}${grid(r.exact, false, () => "")}</section>`;
      let h = "";
      const missNote = (x) => x.missing.join(" · ");
      if (r.empty) {
        h += `<div class="f-sentence-answer"><p><b>Точно таких нет.</b> Ниже — ближайшие, у каждого написано, чего не хватает.</p>${loosen()}</div>`;
        if (r.near.length) h += `<section class="f-sentence-sec">${head("Ближе всего", r.near.length)}${grid(r.near.slice(0, 3), true, missNote)}${r.near.length > 3 ? grid(r.near.slice(3), false, missNote) : ""}</section>`;
      } else {
        const n = r.exact.length;
        h += `<div class="f-sentence-answer"><p>${plural(n, "Подходит", "Подходят", "Подходят")} ${n} из ${total}.</p></div>`;
        const lead = r.exact.slice(0, 3);
        h += `<section class="f-sentence-sec">${head(n === 1 ? "Вот один — с него и начните" : `Вот ${lead.length}, с которых стоит начать`)}${grid(lead, true, why)}</section>`;
        if (n > 3) h += `<section class="f-sentence-sec">${head("Ещё подходят", n - 3)}${grid(r.exact.slice(3), false, why)}</section>`;
        if (r.near.length) h += `<section class="f-sentence-sec">${head("Почти", r.near.length)}${grid(r.near, false, missNote)}</section>`;
      }
      if (r.rest.length) h += `<section class="f-sentence-sec">${head("Остальные", r.rest.length)}${grid(r.rest, false, () => "")}</section>`;
      return h;
    }

    function draw(focusKey) {
      root.innerHTML = `<div class="f-sentence">
        <div class="f-sentence-ask"><p class="f-sentence-kicker">Закончите фразу — подберём кофе</p>${sentence()}${more()}</div>
        <div class="f-sentence-out" aria-live="polite">${result()}</div></div>`;
      if (focusKey) root.querySelector(focusKey)?.focus({ preventScroll: true });
    }
    root.addEventListener("change", (e) => {
      const sel = e.target.closest(".f-sentence-select");
      if (!sel) return;
      st[sel.dataset.k] = sel.value;
      draw(`.f-sentence-select[data-k="${sel.dataset.k}"]`);
    });
    root.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b || !root.contains(b)) return;
      if (b.dataset.act === "more") { st.open = !st.open; draw('[data-act="more"]'); return; }
      if (b.dataset.act === "reset") { Object.assign(st, { method: "", drink: "", like: "", taste: "" }); for (const [k] of MORE) st.more[k] = new Set(); draw(".f-sentence-select"); return; }
      if (b.dataset.more) { const set = st.more[b.dataset.more], v = b.dataset.v; set.has(v) ? set.delete(v) : set.add(v); draw(`[data-more="${b.dataset.more}"][data-v="${CSS.escape(v)}"]`); return; }
      if (b.dataset.loose) {
        const k = b.dataset.loose;
        if (k.startsWith("more:")) st.more[k.slice(5)].delete(b.dataset.v); else st[k] = "";
        draw(k.startsWith("more:") ? '[data-act="more"]' : `.f-sentence-select[data-k="${k}"]`);
      }
    });
    draw();
  }

  QQBench.register({
    id: "sentence",
    name: "Фраза",
    idea: "Выбор читается как одна фраза, которую посетитель дописывает сам — «Варю в гейзерной кофеварке, пью с молоком, люблю кофе без яркой кислотности», — и каталог тут же перестраивается под ней: три, с которых стоит начать, остальные подходящие, «почти» и все прочие.",
    notes: "В отличие от квиза, фраза не ведёт по шагам и не прячет каталог до конца: все вопросы видны сразу, каждый можно не трогать или поменять, и ответ — это сам каталог под фразой, а не страница-вердикт. Цена: фразу надо прочесть целиком, чтобы понять, что слова в ней меняются, у селекта нет места для подсказок (только число в каждом варианте), а страна, обработка и линейка в фразу не ложатся и спрятаны за ссылкой.",
    render
  });
})();
