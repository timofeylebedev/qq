// «Карта вкусов»: people are positions on the taste map. This coffee is the main mark; every reviewer is a dot at the
// taste they usually drink (person.pos), its shape their answer on one axis (an arrow points where they would move the
// coffee: ◀ «ярковато», ● «в самый раз», ▶ «хотелось ярче»; on «плотность» ▲ / ● / ▼). Named people are labelled
// marks: ambassadors lavender diamonds, «Выбор Ксюши» (QQ's team, no position) a black square tied to the coffee.
// The visitor's region is a soft ellipse «вы». Tapping a mark opens its card beside (L) or under the map. Under the
// map: the counts in words, split by brew, the notes heard, «Советуют» apart, «не про вкус», and every review as a
// list, so nothing needs the map. The write form starts on the same map: «Сначала — где ваш вкус».
(() => {
  const P = "f-map";
  const K = () => window.QQKit;
  const BR = [0.6, 5.0], BO = [1.4, 5.4];                 // the drawn domain: bright → x, body → y (light on top)
  const fx = (b) => (b - BR[0]) / (BR[1] - BR[0]);
  const fy = (b) => (b - BO[0]) / (BO[1] - BO[0]);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ORDER = ["ok", "less", "more"];

  // shapes: the arrow points where the person would move the coffee
  const SHAPE = {
    bright: { less: "-6.5,0 5,-6 5,6", more: "6.5,0 -5,-6 -5,6" },
    body: { less: "0,-6.5 6,5 -6,5", more: "0,6.5 6,-5 -6,-5" },
  };
  const GLYPH = { bright: { less: "◀", ok: "●", more: "▶" }, body: { less: "▲", ok: "●", more: "▼" } };
  function shape(axis, a, cls = "") {
    const inner = a === "ok" || !SHAPE[axis][a] ? `<circle r="5.5"/>` : `<polygon points="${SHAPE[axis][a]}"/>`;
    return `<svg class="${P}__sh ${cls}" viewBox="-9 -9 18 18" aria-hidden="true" focusable="false">${inner}</svg>`;
  }
  const ring = `<svg class="${P}__ring" viewBox="-14 -14 28 28" aria-hidden="true" focusable="false"><circle r="11.5"/></svg>`;
  const diamond = (cls) => `<svg class="${P}__sh ${cls}" viewBox="-9 -9 18 18" aria-hidden="true" focusable="false"><polygon points="0,-7.5 7.5,0 0,7.5 -7.5,0"/></svg>`;
  const square = `<svg class="${P}__sh ${P}__sh--team" viewBox="-9 -9 18 18" aria-hidden="true" focusable="false"><rect x="-5.5" y="-5.5" width="11" height="11"/></svg>`;

  const join = (w) => w.length <= 1 ? (w[0] || "") : `${w.slice(0, -1).join(", ")} и ${w[w.length - 1]}`;
  const lc = (s) => String(s || "").charAt(0).toLowerCase() + String(s || "").slice(1);
  function countLine(o, axis) {
    const A = K().D.people.answers[axis];
    return ORDER.filter((k) => o[k]).sort((a, b) => o[b] - o[a] || ORDER.indexOf(a) - ORDER.indexOf(b)).map((k) => `${o[k]} — ${A[k]}`).join(", ");
  }
  // where a point sits against this coffee, in words
  function against(pos, c) {
    const db = pos.bright - c.bright, dy = pos.body - c.body, w = [];
    w.push(Math.abs(db) < 0.4 ? "по кислотности как этот" : db > 0 ? "ярче этого" : "мягче этого");
    w.push(Math.abs(dy) < 0.4 ? "по плотности как этот" : dy > 0 ? "плотнее" : "легче");
    return w.join(", ");
  }
  function nearestCoffee(pos) {
    let best = null, g = 1e9;
    for (const c of K().D.coffees) { const d = Math.hypot(c.position.bright - pos.bright, 0.75 * (c.position.body - pos.body)); if (d < g) { g = d; best = c; } }
    return best;
  }
  function stylePos(id) {
    const p = K().D.people.people.find((x) => x.usual && x.usual.style === id);
    return p ? p.pos : null;
  }

  // ── the map: an HTML plane (marks are buttons) over an SVG of the grid, the region and the leads ──
  // items: { id, kind: review|amb|not|team|me, pos, label?, aria, unusual?, answers? }
  function mapHTML(ctx, cls = "") {
    return `<div class="${P}__frame ${cls}">
      <span class="${P}__ax ${P}__ax--t" aria-hidden="true">↑ легче</span>
      <div class="${P}__plane"></div>
      <span class="${P}__ax ${P}__ax--l" aria-hidden="true">← мягче</span>
      <span class="${P}__ax ${P}__ax--b" aria-hidden="true">↓ плотнее</span>
      <span class="${P}__ax ${P}__ax--r" aria-hidden="true">ярче →</span>
    </div>`;
  }

  function place(plane, ctx, items, opt = {}) {
    const W = plane.clientWidth || Math.max(240, (ctx.width || 360) - 40), H = plane.clientHeight || Math.round(W * 0.8);
    const pad = 14;
    const px = (pos) => ({ x: clamp(fx(pos.bright) * W, pad, W - pad), y: clamp(fy(pos.body) * H, pad, H - pad) });
    const cpos = ctx.coffee.position, c = px(cpos);
    // relax: marks never sit on each other; the coffee stays put
    const M = items.map((it, i) => ({ it, ...px(it.pos), t: px(it.pos), r: 11, i }));
    const fixed = { x: c.x, y: c.y, r: cpos.unusual >= 1.5 ? 20 : 15 };
    for (let k = 0; k < 120; k++) {
      let moved = false;
      for (let a = 0; a < M.length; a++) {
        const A = M[a];
        const others = [fixed, ...M.filter((_, b) => b !== a)];
        for (const B of others) {
          let dx = A.x - B.x, dy = A.y - B.y, d = Math.hypot(dx, dy);
          const min = A.r + B.r - 1;
          if (d >= min) continue;
          if (d < 0.01) { const ang = (A.i * 2.39996) + 0.6; dx = Math.cos(ang); dy = Math.sin(ang); d = 1; }
          const push = (min - d) / (B === fixed ? 1 : 2);
          A.x = clamp(A.x + (dx / d) * push, pad, W - pad); A.y = clamp(A.y + (dy / d) * push, pad, H - pad);
          moved = true;
        }
      }
      if (!moved) break;
    }
    // labels: try right, left, above, below; keep the one that hits least
    const boxes = [{ x: c.x - 15, y: c.y - 15, w: 30, h: 30 }, ...M.map((m) => ({ x: m.x - m.r, y: m.y - m.r, w: 2 * m.r, h: 2 * m.r }))];
    const hit = (b) => boxes.reduce((s, o) => s + Math.max(0, Math.min(b.x + b.w, o.x + o.w) - Math.max(b.x, o.x)) * Math.max(0, Math.min(b.y + b.h, o.y + o.h) - Math.max(b.y, o.y)), 0)
      + (b.x < 0 ? -b.x * 40 : 0) + (b.x + b.w > W ? (b.x + b.w - W) * 40 : 0) + (b.y < 0 ? -b.y * 40 : 0) + (b.y + b.h > H ? (b.y + b.h - H) * 40 : 0);
    for (const m of M) if (Math.hypot(m.x - m.t.x, m.y - m.t.y) > 4) boxes.push({ x: m.t.x - 3, y: m.t.y - 3, w: 6, h: 6 });
    // a label's box in the plane's px: 8 directions at two distances, slid inside the plane; returns its offset
    // from the mark's own box (size × size, centred on x, y)
    const labelAt = (x, y, text, r, h = 15) => {
      const w = text.length * 6.7 + 6 + (h > 15 ? 14 : 0);
      let best = null;
      for (const e of [0, 10]) {
        const R = r + 3 + e, d = (r + e) * 0.72;
        const cand = [[x + R, y - h / 2], [x - R - w, y - h / 2], [x - w / 2, y - R - h], [x - w / 2, y + R],
          [x + d, y - d - h], [x - d - w, y - d - h], [x + d, y + d], [x - d - w, y + d]];
        for (const [bx, by] of cand) {
          const b = { x: clamp(bx, 1, W - w - 1), y: clamp(by, 1, H - h - 1), w, h };
          const sc = hit(b) + e * 2 + Math.hypot(b.x - bx, b.y - by) * 0.5;
          if (!best || sc < best.s - 0.5) best = { b, s: sc };
        }
      }
      boxes.push(best.b);
      return { left: best.b.x - (x - r), top: best.b.y - (y - r) };
    };
    const team = opt.team;
    const coffeeLab = labelAt(c.x, c.y, team ? team.label.toUpperCase() : "ЭТОТ КОФЕ", 15, team ? 30 : 15);
    for (const m of M) if (m.it.label) m.lab = labelAt(m.x, m.y, m.it.label.toUpperCase(), m.r);

    // the SVG under the marks
    const reg = opt.region;
    let svg = `<svg class="${P}__bg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true" focusable="false">`;
    for (let i = 1; i < 4; i++) svg += `<line class="${P}__grid" x1="${(W * i) / 4}" y1="0" x2="${(W * i) / 4}" y2="${H}"/><line class="${P}__grid" x1="0" y1="${(H * i) / 4}" x2="${W}" y2="${(H * i) / 4}"/>`;
    svg += `<line class="${P}__cross" x1="${c.x}" y1="0" x2="${c.x}" y2="${H}"/><line class="${P}__cross" x1="0" y1="${c.y}" x2="${W}" y2="${c.y}"/>`;
    // the write map: every QQ coffee as a faint point, to find your own by
    if (opt.context) for (const x of K().D.coffees) if (x.slug !== ctx.coffee.slug) { const q = px(x.position); svg += `<circle class="${P}__ctx" cx="${q.x}" cy="${q.y}" r="2.5"><title>${K().esc(x.name)}</title></circle>`; }
    let regLab = "";
    if (reg) {
      const rc = { x: fx(reg.center.bright) * W, y: fy(reg.center.body) * H };
      const rx = (reg.spread.bright / (BR[1] - BR[0])) * W, ry = (reg.spread.body / (BO[1] - BO[0])) * H;
      svg += `<ellipse class="${P}__reg" cx="${rc.x}" cy="${rc.y}" rx="${rx}" ry="${ry}"/>`;
      // «вы» inside the ellipse, where it hits least
      const cands = [[rc.x, rc.y - ry * 0.62], [rc.x, rc.y + ry * 0.62], [rc.x - rx * 0.6, rc.y], [rc.x + rx * 0.6, rc.y], [rc.x, rc.y]]
        .map(([x, y]) => ({ x: clamp(x, 16, W - 16), y: clamp(y, 10, H - 10) }));
      let best = null;
      for (const p of cands) { const s = hit({ x: p.x - 16, y: p.y - 11, w: 32, h: 22 }); if (!best || s < best.s - 0.5) best = { ...p, s }; }
      regLab = `<span class="${P}__you" style="left:${best.x}px;top:${best.y}px" aria-hidden="true">вы</span>`;
    }
    for (const m of M) if (Math.hypot(m.x - m.t.x, m.y - m.t.y) > 4 || m.it.kind === "team") svg += `<line class="${P}__lead" x1="${m.t.x}" y1="${m.t.y}" x2="${m.x}" y2="${m.y}"/><circle class="${P}__true" cx="${m.t.x}" cy="${m.t.y}" r="1.6"/>`;
    svg += `</svg>`;

    const axis = opt.axis || "bright";
    const mark = (m) => {
      const it = m.it;
      let g = "";
      if (it.kind === "review") g = shape(axis, it.answers[axis], `${P}__sh--cust`);
      else if (it.kind === "amb") g = diamond(`${P}__sh--amb`);
      else if (it.kind === "not") g = diamond(`${P}__sh--not`);
      else if (it.kind === "team") g = square;
      else if (it.kind === "me") g = it.answers ? shape(axis, it.answers[axis], `${P}__sh--me`) : `<svg class="${P}__sh ${P}__sh--me" viewBox="-9 -9 18 18" aria-hidden="true"><circle r="6.5"/></svg>`;
      const u = it.unusual ? ring : "";
      const lab = it.label ? `<span class="${P}__lab ${P}__lab--${it.kind}" style="left:${m.lab.left.toFixed(1)}px;top:${m.lab.top.toFixed(1)}px">${K().esc(it.label)}</span>` : "";
      const tag = it.kind === "me" ? "span" : "button";
      const attr = tag === "button" ? ` type="button" data-id="${K().esc(it.id)}" aria-pressed="false" aria-label="${K().esc(it.aria)}"` : ` aria-hidden="true"`;
      return `<${tag} class="${P}__mk ${P}__mk--${it.kind}" style="left:${m.x.toFixed(1)}px;top:${m.y.toFixed(1)}px"${attr}>${u}${g}${lab}</${tag}>`;
    };
    const ctag = team ? "button" : "span";
    const cattr = team ? ` type="button" data-id="${K().esc(team.id)}" aria-pressed="false" aria-label="${K().esc(team.aria)}"` : ` aria-hidden="true"`;
    const coffee = `<${ctag} class="${P}__mk ${P}__mk--coffee"${cattr} style="left:${c.x}px;top:${c.y}px">
      ${cpos.unusual >= 1.5 ? `<svg class="${P}__ring ${P}__ring--coffee" viewBox="-20 -20 40 40"><circle r="17.5"/></svg>` : ""}
      <svg class="${P}__sh ${P}__sh--coffee" viewBox="-15 -15 30 30"><circle class="o" r="11"/><circle class="i" r="3.5"/></svg>
      <span class="${P}__lab ${P}__lab--coffee" style="left:${coffeeLab.left.toFixed(1)}px;top:${coffeeLab.top.toFixed(1)}px">Этот кофе${team ? `<span class="${P}__lab-team">${square}${K().esc(team.label)}</span>` : ""}</span></${ctag}>`;
    // tab order: left to right
    const order = M.slice().sort((a, b) => a.x - b.x || a.y - b.y);
    plane.innerHTML = svg + regLab + coffee + order.map(mark).join("");
    return { W, H, px };
  }

  // ── people of this page ──
  function people(ctx) {
    const k = K(), pg = ctx.page, slug = ctx.coffee.slug;
    const reviews = (pg.reviews || []).map((r) => ({ r, p: k.person[r.who] })).filter((x) => x.p);
    const picks = (pg.picks || []).map((pk) => ({ pk, p: k.person[pk.who] })).filter((x) => x.p);
    const nots = k.D.people.named.filter((n) => n.not && n.not.slug === slug && !picks.some((x) => x.p.id === n.id));
    return { reviews, picks, nots };
  }
  function itemsOf(ctx, ppl) {
    const items = [];
    for (const { r, p } of ppl.reviews) items.push({ id: r.id, kind: "review", pos: p.pos, unusual: p.pos.unusual >= 1.5, answers: r.answers,
      aria: `${p.name}, ${K().cup(r)}: кислотность — ${K().D.people.answers.bright[r.answers.bright]}, плотность — ${K().D.people.answers.body[r.answers.body]}` });
    for (const { pk, p } of ppl.picks) {
      if (p.kind === "team") continue;
      if (p.pos) items.push({ id: p.id, kind: "amb", pos: p.pos, unusual: p.pos.unusual >= 1.5, label: p.name, aria: `${p.name}, ${lc(p.status)}: советует этот кофе` });
    }
    for (const p of ppl.nots) if (p.pos) items.push({ id: p.id, kind: "not", pos: p.pos, unusual: p.pos.unusual >= 1.5, label: `${p.name} · не берёт`, aria: `${p.name}, ${lc(p.status)}: этот кофе не берёт` });
    return items;
  }
  function teamOf(ppl) {
    const t = ppl.picks.find((x) => x.p.kind === "team");
    return t ? { id: t.p.id, label: t.p.tag || `Выбор ${t.p.name}`, aria: `Этот кофе — ${t.p.tag || t.p.name}, команда QQ. У Ксюши нет точки на карте: её выбор стоит на самом кофе` } : null;
  }
  const visPos = (ctx) => ctx.visitor && ctx.visitor.region ? ctx.visitor.region.center : null;
  function nearest(ctx, ppl) {
    const v = visPos(ctx); if (!v) return null;
    const k = K(), all = [];
    for (const { r, p } of ppl.reviews) all.push({ id: r.id, p, r, g: k.gap(v, p.pos) });
    for (const { pk, p } of ppl.picks) if (p.pos) all.push({ id: p.id, p, pk, g: k.gap(v, p.pos) });
    for (const p of ppl.nots) if (p.pos) all.push({ id: p.id, p, not: true, g: k.gap(v, p.pos) });
    all.sort((a, b) => a.g - b.g);
    return all[0] || null;
  }
  function closeness(ctx, pos) {
    const v = visPos(ctx); if (!v || !pos) return "";
    const k = K(), n = k.near(v, pos), sh = k.shared(v, pos);
    return `<p class="${P}__close"><span class="${P}__k">С вашим вкусом</span> ${n}${sh.length ? ` — вы оба любите ${join(sh)}` : ""}</p>`;
  }

  // ── cards ──
  function usualLine(p) {
    return `${K().esc(p.usual ? p.usual.label : "")}${p.likes ? ` · любит ${K().esc(p.likes)}` : ""}`;
  }
  function heardPills(ctx, heard) {
    const d = ctx.coffee.descriptors || [];
    return `<span class="${P}__pills">${d.map((x) => `<span class="${P}__pill${heard.includes(x) ? "" : " is-off"}"><i class="${P}__dot" aria-hidden="true"></i>${K().esc(x)}${heard.includes(x) ? "" : `<span class="${P}__sr"> — не узнали</span>`}</span>`).join("")}</span>`;
  }
  function reviewCard(ctx, r, p, h = "h3") {
    const k = K(), A = k.D.people.answers, same = p.usual && p.usual.slug === ctx.coffee.slug;
    return `<article class="${P}__card">
      <p class="${P}__kind">Отзыв покупателя</p>
      <${h} class="${P}__name">${k.esc(p.name)}</${h}>
      <p class="${P}__meta">${[p.city, k.date(r.date), r.verified ? "Купил(а) у QQ" : "", r.cups ? `после ${r.cups} ${k.plural(r.cups, "чашки", "чашек", "чашек")}` : ""].filter(Boolean).map(k.esc).join(" · ")}</p>
      <dl class="${P}__dl">
        <div><dt>Чашка</dt><dd>${k.esc(k.cup(r))}</dd></div>
        <div><dt>Обычно пьёт</dt><dd>${usualLine(p)}${same ? " (этот же кофе)" : ""}</dd></div>
        <div><dt>Кислотность</dt><dd class="${P}__ans">${shape("bright", r.answers.bright, `${P}__sh--cust`)} ${k.esc(A.bright[r.answers.bright])}</dd></div>
        <div><dt>Плотность</dt><dd class="${P}__ans">${shape("body", r.answers.body, `${P}__sh--cust`)} ${k.esc(A.body[r.answers.body])}</dd></div>
        <div><dt>Узнали ноты</dt><dd>${r.heard.length ? heardPills(ctx, r.heard) : "не узнали ни одной"}</dd></div>
      </dl>
      ${r.text ? `<p class="${P}__text">${k.esc(r.text)}</p>` : `<p class="${P}__none">Без текста — только ответы.</p>`}
      ${closeness(ctx, p.pos)}
    </article>`;
  }
  const disclose = `<p class="${P}__disc"><span class="${P}__k">Связь с QQ</span> здесь одна строка: как человек связан с QQ (если платно — «Реклама»)</p>`;
  function namedCard(ctx, p, pk, h = "h3") {
    const k = K();
    if (p.kind === "team") return `<article class="${P}__card ${P}__card--team">
      <p class="${P}__kind">Команда QQ</p>
      <${h} class="${P}__name">${k.esc(p.tag || p.name)}</${h}>
      <p class="${P}__meta">${k.esc(p.name)} · ${k.esc(p.status)}</p>
      ${pk && pk.why ? `<p class="${P}__why">${k.esc(pk.why)}</p>` : ""}
      <p class="${P}__none">У Ксюши нет точки на карте вкусов: её выбор стоит на самом кофе.</p>
    </article>`;
    const not = p.not && k.coffee[p.not.slug];
    const here = p.not && p.not.slug === ctx.coffee.slug;
    const others = (p.picks || []).filter((s) => s !== ctx.coffee.slug).map((s) => k.coffee[s]).filter(Boolean);
    return `<article class="${P}__card ${P}__card--amb">
      <p class="${P}__kind">${here ? "Амбассадор · не берёт этот кофе" : "Амбассадор · советует"} ${p.placeholder ? k.placeholder("Пример: амбассадор выдуман") : ""}</p>
      <${h} class="${P}__name">${k.esc(p.name)}</${h}>
      <p class="${P}__meta">${k.esc(p.status)}${p.where ? ` · ${k.esc(p.where)}` : ""}</p>
      ${disclose}
      ${pk && pk.why ? `<p class="${P}__why">${k.esc(pk.why)}</p>` : ""}
      <dl class="${P}__dl">
        ${pk && pk.recipe ? `<div><dt>Рецепт</dt><dd>${k.esc(pk.recipe)}</dd></div>` : ""}
        <div><dt>Пьёт</dt><dd>${k.esc(p.how || k.cup(p))}${p.likes ? ` · любит ${k.esc(p.likes)}` : ""}</dd></div>
        ${p.about ? `<div><dt>О себе</dt><dd>${k.esc(p.about)}</dd></div>` : ""}
        ${not ? `<div class="${here ? "is-here" : ""}"><dt>Не беру</dt><dd><b>${k.esc(not.name)}</b> — ${k.esc(p.not.why)}</dd></div>` : ""}
        ${others.length ? `<div><dt>${here ? "Берёт" : "Ещё советует"}</dt><dd>${others.map((c) => k.esc(c.name)).join(", ")}</dd></div>` : ""}
      </dl>
      ${closeness(ctx, p.pos)}
    </article>`;
  }

  // ── the block ──
  function summary(ctx, ppl) {
    const k = K(), pg = ctx.page, n = pg.count;
    if (n < 2) return "";
    const v = ctx.visitor && ctx.visitor.method ? (k.D.people.methods[ctx.visitor.method] || {}).group : null;
    const vMilk = ctx.visitor && ctx.visitor.milk;
    const groups = (pg.groups || []).filter((g) => g.n > 0);
    return `<section class="${P}__sum" aria-label="Сводка ответов">
      <p class="${P}__count"><b>${n} ${k.plural(n, "отзыв", "отзыва", "отзывов")}</b> про кислотность: ${countLine(pg.bright, "bright")}.</p>
      <p class="${P}__count">Про плотность: ${countLine(pg.body, "body")}.</p>
      ${groups.length > 1 ? `<div class="${P}__groups"><p class="${P}__k">Как заваривали</p><ul class="${P}__gl">${groups.map((g) => {
        const mine = g.id === "milk" ? vMilk : g.id === v;
        return `<li class="${P}__g${mine ? " is-mine" : ""}"><span class="${P}__gt">${k.esc(g.label)} · ${g.n}${mine ? ` <span class="${P}__mine">как вы</span>` : ""}</span>
          <span>Кислотность: ${countLine(g.bright, "bright")}</span><span>Плотность: ${countLine(g.body, "body")}</span></li>`;
      }).join("")}</ul>${groups.some((g) => g.id === "milk") ? `<p class="${P}__fine">«С молоком» — те же люди, что выше, кто пил с молоком.</p>` : ""}</div>` : ""}
      ${pg.heard && pg.heard.length ? `<div class="${P}__heard"><p class="${P}__k">Какие ноты узнали</p><span class="${P}__pills">${pg.heard.map((h) => `<span class="${P}__pill"><i class="${P}__dot" aria-hidden="true"></i>${k.esc(h.d)} — ${h.n} из ${n}</span>`).join("")}</span></div>` : ""}
    </section>`;
  }
  function legend(ctx, items, axis, ppl) {
    const A = K().D.people.answers[axis];
    const has = (kind) => items.some((i) => i.kind === kind);
    const used = new Set(items.filter((i) => i.kind === "review").map((i) => i.answers[axis]));
    const row = (g, t) => `<li>${g}<span>${t}</span></li>`;
    return `<ul class="${P}__legend">
      ${row(`<svg class="${P}__sh ${P}__sh--coffee" viewBox="-15 -15 30 30" aria-hidden="true"><circle class="o" r="11"/><circle class="i" r="3.5"/></svg>`, "этот кофе")}
      ${ORDER.filter((a) => used.has(a)).map((a) => row(shape(axis, a, `${P}__sh--cust`), `${A[a]}`)).join("")}
      ${has("amb") ? row(diamond(`${P}__sh--amb`), "амбассадор советует") : ""}
      ${has("not") ? row(diamond(`${P}__sh--not`), "амбассадор не берёт") : ""}
      ${ppl && teamOf(ppl) ? row(square, "выбор команды QQ — на самом кофе") : ""}
      ${items.some((i) => i.unusual) || ctx.coffee.position.unusual >= 1.5 ? row(`<svg class="${P}__ring ${P}__ring--lg" viewBox="-14 -14 28 28" aria-hidden="true"><circle r="11.5"/></svg>`, "кольцо — необычное") : ""}
      ${visPos(ctx) ? row(`<i class="${P}__lg-reg" aria-hidden="true"></i>`, "вы: что вы обычно пьёте") : ""}
    </ul>`;
  }

  function render(root, ctx) {
    const k = K(), pg = ctx.page, U = ctx.uid, ppl = people(ctx);
    const n = pg.count, named = ppl.picks.length + ppl.nots.length;
    const write = `<a class="${P}__btn" href="#${U}-write">Написать отзыв</a>`;
    if (!n && !named) {
      root.innerHTML = `<section class="${P}" id="${U}-people"><h2 class="${P}__h">Отзывы</h2>
        <div class="${P}__invite"><p>Отзывов ещё нет. Пили? Расскажите, как заваривали и куда кофе ушёл от вашего обычного: ярче или мягче, плотнее или легче.</p>${write}</div></section>`;
      return;
    }
    const items = itemsOf(ctx, ppl);
    const near = nearest(ctx, ppl);
    let sel = near ? near.id : ppl.reviews[0] ? ppl.reviews[0].r.id : null;
    let axis = "bright";
    const nearLine = (() => {
      if (!near) return "";
      const p = near.p, sh = k.shared(visPos(ctx), p.pos), word = k.near(visPos(ctx), p.pos);
      const who = `${k.esc(p.name)} (${k.esc(near.r ? lc(k.cup(near.r)) : lc(p.status))})`;
      const what = near.r ? `кислотность — ${k.D.people.answers.bright[near.r.answers.bright]}, плотность — ${k.D.people.answers.body[near.r.answers.body]}`
        : near.not ? `этот кофе не берёт: «${k.esc(p.not.why)}»` : near.pk && near.pk.why ? `советует: «${k.esc(near.pk.why)}»` : "";
      if (word === "далеко") return `<p class="${P}__near">Похожего на ваш вкус здесь никого: ближе всех — ${who}, и то далеко. ${what ? `Ответ: ${what}.` : ""} <button type="button" class="${P}__link" data-go="${k.esc(near.id)}">Показать на карте</button></p>`;
      return `<p class="${P}__near">Ближе всего к вам по вкусу — <b>${who}</b>: ${word}${sh.length ? `, вы оба любите ${join(sh)}` : ""}. ${what ? `${what.charAt(0).toUpperCase() + what.slice(1)}.` : ""} <button type="button" class="${P}__link" data-go="${k.esc(near.id)}">Показать на карте</button></p>`;
    })();
    const ambs = [...ppl.picks, ...ppl.nots.map((p) => ({ p, pk: null }))];
    const team = ambs.filter((x) => x.p.kind === "team"), amb = ambs.filter((x) => x.p.kind !== "team");
    const advise = ambs.length ? `<section class="${P}__adv" aria-labelledby="${U}-adv">
      <h3 class="${P}__h3" id="${U}-adv">Советуют</h3>
      <p class="${P}__fine">Не покупатели: команда QQ и амбассадоры, у каждого свой вкус и своё «не беру».</p>
      <ul class="${P}__al">${[...team, ...amb].map(({ p, pk }) => {
        const notHere = p.not && p.not.slug === ctx.coffee.slug && !pk;
        return `<li class="${P}__a ${P}__a--${p.kind}${notHere ? " is-not" : ""}">
          <p class="${P}__kind">${p.kind === "team" ? "Команда QQ" : notHere ? "Амбассадор · не берёт" : "Амбассадор"}${p.placeholder ? " " + k.placeholder("Пример") : ""}</p>
          <p class="${P}__aname">${k.esc(p.kind === "team" ? p.tag || p.name : p.name)} <span>${k.esc(p.kind === "team" ? `${p.name} · ${p.status}` : p.status)}</span></p>
          ${pk && pk.why ? `<p class="${P}__why">${k.esc(pk.why)}</p>` : notHere ? `<p class="${P}__why">${k.esc(p.not.why)}</p>` : ""}
          ${pk && pk.recipe ? `<p class="${P}__rec"><span class="${P}__k">Рецепт</span> ${k.esc(pk.recipe)}</p>` : ""}
          ${p.kind !== "team" && p.not && !notHere && k.coffee[p.not.slug] ? `<p class="${P}__rec"><span class="${P}__k">Не беру</span> ${k.esc(k.coffee[p.not.slug].name)} — ${k.esc(p.not.why)}</p>` : ""}
          ${p.kind !== "team" ? `<p class="${P}__disc">Связь с QQ: одна строка (если платно — «Реклама»)</p>` : ""}
          <button type="button" class="${P}__link" data-go="${k.esc(p.id)}">${p.kind === "team" ? "На карте: на самом кофе" : "На карте и подробнее"}</button>
        </li>`;
      }).join("")}</ul></section>` : "";
    const issues = (pg.issues || []).length ? `<section class="${P}__iss" aria-labelledby="${U}-iss">
      <h3 class="${P}__h3" id="${U}-iss">Не про вкус</h3>
      <p class="${P}__fine">Не входят в счёт выше: это про помол и описание, а не про то, как кофе на вкус.</p>
      <ul class="${P}__il">${pg.issues.map((i) => { const p = k.person[i.who]; return `<li class="${P}__i">
        <p class="${P}__kind">${i.issue === "grind" ? "Помол не подошёл" : "Не как в описании"}</p>
        <p class="${P}__meta">${k.esc(p ? p.name : "")} · ${k.esc(k.cup(i))} · ${k.esc(k.date(i.date))}${i.verified ? " · Купил(а) у QQ" : ""}</p>
        <p class="${P}__text">${k.esc(i.text)}</p>${i.reply ? `<p class="${P}__reply"><span class="${P}__k">Ответ QQ</span> ${k.esc(i.reply.replace(/\s*— QQ$/, ""))}</p>` : ""}</li>`; }).join("")}</ul></section>` : "";
    const list = ppl.reviews.length > 1 ? `<details class="${P}__all"><summary>Все ${ppl.reviews.length} ${k.plural(ppl.reviews.length, "отзыв", "отзыва", "отзывов")} списком, без карты</summary>
      <ol class="${P}__rl">${ppl.reviews.map(({ r, p }) => `<li>${reviewCard(ctx, r, p, "h4")}</li>`).join("")}</ol></details>` : "";
    const head = n === 0 ? `<p class="${P}__lead">Отзывов ещё нет — на карте те, кто советует этот кофе или не берёт его, и где их вкус.</p>`
      : n === 1 ? `<p class="${P}__lead">Пока один отзыв — это история одного человека, не счёт. Точка — что он обычно пьёт.</p>`
      : `<p class="${P}__lead">Каждая точка — человек на месте того кофе, что он обычно пьёт. Форма — его ответ: стрелка показывает, куда он сдвинул бы этот кофе.</p>`;
    const toggle = ppl.reviews.length ? `<div class="${P}__seg" role="group" aria-label="Форма точек — ответ про">
      <span class="${P}__k">Точки — ответ про</span><button type="button" data-axis="bright" aria-pressed="true">кислотность</button><button type="button" data-axis="body" aria-pressed="false">плотность</button></div>` : "";

    root.innerHTML = `<section class="${P}" id="${U}-people">
      <div class="${P}__top"><h2 class="${P}__h">Отзывы</h2>${k.placeholder()}</div>
      ${head}${nearLine}
      <div class="${P}__stage">
        <div class="${P}__mapcol">${toggle}${mapHTML(ctx)}<div class="${P}__lg"></div></div>
        <div class="${P}__slot" aria-live="polite"></div>
      </div>
      ${n === 0 ? `<div class="${P}__invite"><p>Пили? Расскажите, как заваривали.</p>${write}</div>` : ""}
      <div class="${P}__below">${summary(ctx, ppl)}${advise}</div>
      ${issues}${list}
      ${n > 0 ? `<p class="${P}__wr">${write}</p>` : ""}
    </section>`;
    const plane = root.querySelector(`.${P}__plane`), slot = root.querySelector(`.${P}__slot`), lg = root.querySelector(`.${P}__lg`);
    const draw = () => {
      place(plane, ctx, items, { region: ctx.visitor && ctx.visitor.region, axis, team: teamOf(ppl) });
      lg.innerHTML = legend(ctx, items, axis, ppl);
      plane.querySelectorAll("[data-id]").forEach((b) => { b.setAttribute("aria-pressed", String(b.dataset.id === sel)); b.onclick = () => pick(b.dataset.id); });
    };
    const pick = (id, focus) => {
      sel = id;
      const rv = ppl.reviews.find((x) => x.r.id === id);
      const nm = ambs.find((x) => x.p.id === id);
      slot.innerHTML = rv ? reviewCard(ctx, rv.r, rv.p) : nm ? namedCard(ctx, nm.p, nm.pk) : `<p class="${P}__none ${P}__tap">Нажмите на имя на карте — откроется карточка: как человек пьёт кофе, почему советует и что не берёт.</p>`;
      plane.querySelectorAll("[data-id]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.id === sel)));
      if (focus) { const b = plane.querySelector(`[data-id="${CSS.escape(id)}"]`); if (b) b.focus({ preventScroll: true }); }
    };
    draw(); pick(sel);
    root.querySelectorAll("[data-axis]").forEach((b) => (b.onclick = () => {
      axis = b.dataset.axis; root.querySelectorAll("[data-axis]").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); draw();
    }));
    root.querySelectorAll("[data-go]").forEach((b) => (b.onclick = () => { pick(b.dataset.go, true); plane.scrollIntoView({ block: "nearest" }); }));
  }

  function top(root, ctx) {
    const k = K(), pg = ctx.page, ppl = people(ctx), n = pg.count, parts = [];
    if (n) parts.push(`${n} ${k.plural(n, "отзыв", "отзыва", "отзывов")}`);
    const team = ppl.picks.find((x) => x.p.kind === "team");
    if (team) parts.push(team.p.tag || `Выбор ${team.p.name}`);
    const amb = ppl.picks.filter((x) => x.p.kind !== "team");
    if (amb.length) parts.push(`советует ${amb.map((x) => x.p.name).join(", ")}`);
    if (!parts.length) parts.push("Отзывов пока нет — расскажите первым");
    else if (!n) parts.push("отзывов пока нет");
    const v = visPos(ctx), near = v && nearest(ctx, ppl);
    root.innerHTML = `<a class="${P}__toplink" href="#${ctx.uid}-${n || ppl.picks.length ? "people" : "write"}"><span class="${P}__topdot" aria-hidden="true"></span>${k.esc(parts.join(" · "))}${near && k.near(v, near.p.pos) === "близко" ? `<span class="${P}__topnear"> · есть близкий вам вкус</span>` : ""}</a>`;
  }

  // ── write: the map first ──
  function write(root, ctx) {
    const k = K(), U = ctx.uid, c = ctx.coffee, A = k.D.people.answers, M = k.D.people.methods;
    const reg = ctx.visitor && ctx.visitor.region;
    const st = { pos: reg ? { ...reg.center } : null, from: reg ? "profile" : null, usual: reg ? ctx.visitor.label : "", method: (ctx.visitor && ctx.visitor.method) || "", milk: !!(ctx.visitor && ctx.visitor.milk), bright: "", body: "", heard: [] };
    const styles = Object.entries(k.D.people.styles).map(([id, label]) => ({ id, label, pos: stylePos(id) })).filter((s) => s.pos);
    const pills = (name, opts, type = "radio", checked = () => false) => opts.map(([v, t, g]) => `<label class="${P}__opt"><input type="${type}" name="${U}-${name}" value="${k.esc(v)}"${checked(v) ? " checked" : ""}>${g || ""}<span>${k.esc(t)}</span></label>`).join("");
    root.id = root.id || `${U}-write`;
    root.innerHTML = `<form class="${P} ${P}__form" novalidate>
      <h2 class="${P}__h">Ваш отзыв о ${k.esc(c.name)}</h2>
      <fieldset class="${P}__fs ${P}__fs--map">
        <legend class="${P}__lgd"><span class="${P}__n">1</span> Сначала — где ваш вкус</legend>
        <p class="${P}__hint">Нажмите на карте, где стоит то, что вы обычно пьёте, или выберите из списка (серые точки — другие кофе QQ). ${reg ? "" : "Сохраним в профиле, второй раз спрашивать не будем."}</p>
        ${reg ? `<p class="${P}__saved"><span class="${P}__k">Из профиля</span> ${k.esc(ctx.visitor.label)} <span class="${P}__fine">— поменять можно здесь же</span></p>` : ""}
        <div class="${P}__wmap">
          <div class="${P}__mapcol">${mapHTML(ctx, `${P}__frame--write`)}</div>
          <div class="${P}__wside">
            <label class="${P}__field"><span class="${P}__k">Обычно пью</span>
              <select class="${P}__sel" name="${U}-usual">
                <option value="">${reg ? "как в профиле" : "— выберите или нажмите на карте —"}</option>
                <optgroup label="Кофе QQ">${k.D.coffees.map((x) => `<option value="c:${x.slug}">${k.esc(x.name)}</option>`).join("")}</optgroup>
                <optgroup label="Или стиль">${styles.map((s) => `<option value="s:${s.id}">${k.esc(s.label)}</option>`).join("")}</optgroup>
              </select></label>
            <p class="${P}__where" aria-live="polite"></p>
          </div>
        </div>
      </fieldset>
      <fieldset class="${P}__fs"><legend class="${P}__lgd"><span class="${P}__n">2</span> Как заваривали <span class="${P}__req">обязательно</span></legend>
        <div class="${P}__opts">${pills("method", Object.entries(M).map(([id, m]) => [id, m.label]), "radio", (v) => v === st.method)}</div>
        <div class="${P}__opts">${pills("milk", [["0", "без молока"], ["1", "с молоком"]], "radio", (v) => v === (st.milk ? "1" : "0"))}</div>
      </fieldset>
      <fieldset class="${P}__fs"><legend class="${P}__lgd"><span class="${P}__n">3</span> Против вашего обычного — кислотность <span class="${P}__req">обязательно</span></legend>
        <div class="${P}__opts">${pills("bright", ORDER.map((a) => [a, A.bright[a], shape("bright", a, `${P}__sh--cust`)]))}</div>
      </fieldset>
      <fieldset class="${P}__fs"><legend class="${P}__lgd"><span class="${P}__n">4</span> Плотность</legend>
        <div class="${P}__opts">${pills("body", ORDER.map((a) => [a, A.body[a], shape("body", a, `${P}__sh--cust`)]))}</div>
      </fieldset>
      <fieldset class="${P}__fs"><legend class="${P}__lgd"><span class="${P}__n">5</span> Какие ноты узнали</legend>
        <div class="${P}__opts">${pills("heard", (c.descriptors || []).map((d) => [d, d, `<i class="${P}__dot" aria-hidden="true"></i>`]), "checkbox")}</div>
      </fieldset>
      <label class="${P}__field ${P}__fs"><span class="${P}__lgd"><span class="${P}__n">6</span> Что понравилось, что бы поменяли <span class="${P}__fine">— по желанию</span></span>
        <textarea class="${P}__ta" name="${U}-text" rows="3" placeholder="Как сказали бы другу: «варю в гейзере, кислинка в самый раз…»"></textarea></label>
      <div class="${P}__fs ${P}__who">
        <label class="${P}__field"><span class="${P}__k">Имя</span><input class="${P}__in" name="${U}-name" placeholder="по желанию"></label>
        <label class="${P}__field"><span class="${P}__k">Город</span><input class="${P}__in" name="${U}-city" placeholder="по желанию"></label>
      </div>
      <p class="${P}__err" role="alert"></p>
      <div class="${P}__actions"><button type="submit" class="${P}__btn">Отправить</button>
        <button type="button" class="${P}__link" data-issue aria-expanded="false" aria-controls="${U}-issue">Не про вкус: помол не подошёл / не как в описании</button></div>
      <div class="${P}__issue" id="${U}-issue" hidden>
        <fieldset class="${P}__fs"><legend class="${P}__lgd">Что не так — не про вкус</legend>
          <p class="${P}__fine">Это не попадёт в счёт отзывов. QQ ответит здесь же, под отзывом.</p>
          <div class="${P}__opts">${pills("issue", [["grind", "помол не подошёл"], ["described", "не как в описании"]])}</div>
          <textarea class="${P}__ta" name="${U}-itext" rows="2" placeholder="Например: взял помол для эспрессо под гейзер — забивается сито"></textarea>
          <button type="button" class="${P}__btn ${P}__btn--ghost" data-isend>Отправить в QQ</button>
          <p class="${P}__isent" aria-live="polite"></p></fieldset>
      </div>
      <div class="${P}__sent" aria-live="polite" hidden></div>
    </form>`;
    const form = root.querySelector("form"), plane = root.querySelector(`.${P}__plane`), where = root.querySelector(`.${P}__where`), selEl = form.querySelector("select");
    const meItem = () => st.pos ? [{ id: "me", kind: "me", pos: st.pos, unusual: (st.pos.unusual || 0) >= 1.5, label: "вы", aria: "ваша точка", answers: st.bright ? { bright: st.bright, body: st.body || "ok" } : null }] : [];
    const drawMe = () => {
      place(plane, ctx, meItem(), { context: true });
      if (!st.pos) { where.innerHTML = `<span class="${P}__fine">Точки пока нет. Нажмите на карту или стрелками с клавиатуры, когда карта в фокусе.</span>`; return; }
      const nc = nearestCoffee(st.pos);
      const ag = against(st.pos, c.position);
      where.innerHTML = `<span class="${P}__k">Ваша точка</span> ${st.usual ? `${k.esc(st.usual)}: ${ag}` : ag.charAt(0).toUpperCase() + ag.slice(1)}${nc && st.from !== "coffee" ? `. Рядом на карте — ${k.esc(nc.name)}` : ""}.`;
    };
    const setPos = (pos, from, usual) => { st.pos = { bright: clamp(pos.bright, BR[0], BR[1]), body: clamp(pos.body, BO[0], BO[1]), unusual: pos.unusual || 0 }; st.from = from; st.usual = usual; drawMe(); };
    plane.tabIndex = 0; plane.setAttribute("role", "application");
    plane.setAttribute("aria-label", "Карта вкусов: нажмите, где стоит ваш обычный кофе. Стрелки двигают точку: влево мягче, вправо ярче, вверх легче, вниз плотнее.");
    plane.addEventListener("click", (e) => {
      const r = plane.getBoundingClientRect();
      setPos({ bright: BR[0] + ((e.clientX - r.left) / r.width) * (BR[1] - BR[0]), body: BO[0] + ((e.clientY - r.top) / r.height) * (BO[1] - BO[0]), unusual: 0 }, "tap", "");
      selEl.value = "";
    });
    plane.addEventListener("keydown", (e) => {
      const d = { ArrowLeft: [-0.2, 0], ArrowRight: [0.2, 0], ArrowUp: [0, -0.2], ArrowDown: [0, 0.2] }[e.key];
      if (!d) return; e.preventDefault();
      const p = st.pos || { ...c.position };
      setPos({ bright: p.bright + d[0], body: p.body + d[1], unusual: p.unusual || 0 }, "tap", ""); selEl.value = "";
    });
    selEl.onchange = () => {
      const v = selEl.value;
      if (!v) { if (reg) setPos(reg.center, "profile", ctx.visitor.label); return; }
      const [t, id] = v.split(":");
      if (t === "c") { const x = k.coffee[id]; setPos(x.position, "coffee", x.name); }
      else { const s = styles.find((x) => x.id === id); setPos(s.pos, "style", s.label); }
    };
    form.addEventListener("change", (e) => {
      const n = e.target.name || "";
      if (n === `${U}-bright`) st.bright = e.target.value;
      if (n === `${U}-body`) st.body = e.target.value;
      if (n === `${U}-bright` || n === `${U}-body`) drawMe();
    });
    const tog = form.querySelector("[data-issue]"), iss = form.querySelector(`.${P}__issue`);
    tog.onclick = () => { const o = iss.hidden; iss.hidden = !o; tog.setAttribute("aria-expanded", String(o)); };
    form.querySelector("[data-isend]").onclick = () => {
      const t = form.querySelector(`[name="${U}-issue"]:checked`);
      form.querySelector(`.${P}__isent`).textContent = t ? `Уйдёт в QQ отдельно от отзывов: «${t.value === "grind" ? "помол не подошёл" : "не как в описании"}»${form.querySelector(`[name="${U}-itext"]`).value.trim() ? " с вашим текстом" : ""}. (Стенд: сети нет.)` : "Выберите, что не так.";
    };
    form.onsubmit = (e) => {
      e.preventDefault();
      const g = (n) => { const x = form.querySelector(`[name="${U}-${n}"]:checked`); return x ? x.value : ""; };
      const method = g("method"), bright = g("bright"), body = g("body"), milk = g("milk") === "1";
      const heard = [...form.querySelectorAll(`[name="${U}-heard"]:checked`)].map((x) => x.value);
      const miss = [!st.pos && "где ваш вкус", !method && "как заваривали", !bright && "кислотность"].filter(Boolean);
      const err = form.querySelector(`.${P}__err`);
      if (miss.length) { err.textContent = `Не хватает: ${miss.join(", ")}.`; return; }
      err.textContent = "";
      const text = form.querySelector(`[name="${U}-text"]`).value.trim(), name = form.querySelector(`[name="${U}-name"]`).value.trim(), city = form.querySelector(`[name="${U}-city"]`).value.trim();
      const out = form.querySelector(`.${P}__sent`);
      out.hidden = false;
      out.innerHTML = `<p class="${P}__kind">Вот что уйдёт (стенд: сети нет)</p>
        <dl class="${P}__dl">
          <div><dt>Обычно пьёте</dt><dd>${k.esc(st.usual || "точка на карте")} — ${against(st.pos, c.position)}${st.from !== "profile" ? " · сохраним в профиль" : ""}</dd></div>
          <div><dt>Чашка</dt><dd>${k.esc(M[method].label)}${milk ? ", с молоком" : ""}</dd></div>
          <div><dt>Кислотность</dt><dd class="${P}__ans">${shape("bright", bright, `${P}__sh--cust`)} ${k.esc(A.bright[bright])}</dd></div>
          <div><dt>Плотность</dt><dd class="${P}__ans">${body ? `${shape("body", body, `${P}__sh--cust`)} ${k.esc(A.body[body])}` : "не ответили"}</dd></div>
          <div><dt>Ноты</dt><dd>${heard.length ? heard.map(k.esc).join(", ") : "не отмечены"}</dd></div>
          <div><dt>Текст</dt><dd>${text ? k.esc(text) : "без текста"}</dd></div>
          <div><dt>Подпись</dt><dd>${k.esc([name || "без имени", city].filter(Boolean).join(", "))}</dd></div>
        </dl>
        <p class="${P}__fine">Так ваш отзыв встанет на карту — рядом с остальными:</p>
        <div class="${P}__mapcol">${mapHTML(ctx, `${P}__frame--sent`)}</div>`;
      const ppl = people(ctx);
      const items = [...itemsOf(ctx, ppl).filter((i) => i.kind === "review"), { id: "me", kind: "me", pos: st.pos, label: "ваш отзыв", aria: "ваш отзыв", unusual: (st.pos.unusual || 0) >= 1.5, answers: { bright, body: body || "ok" } }];
      place(out.querySelector(`.${P}__plane`), ctx, items, { axis: "bright" });
      out.querySelectorAll(`.${P}__plane button`).forEach((b) => { b.tabIndex = -1; b.disabled = true; });
      out.scrollIntoView({ block: "nearest" });
    };
    drawMe();
  }

  window.QQBench.register({
    id: "map",
    name: "Карта вкусов",
    idea: "Люди — точки на карте вкусов: каждый стоит там, что он обычно пьёт, а форма точки — его ответ (стрелка показывает, куда он сдвинул бы этот кофе). Видно сразу, ярковато ли этот кофе тем, кто пьёт как вы, — и отзыв начинается с того же: «где ваш вкус».",
    notes: "Читается без звёзд и без процентов, близость — словами; под картой тот же счёт текстом и все отзывы списком. Цена: карту надо один раз понять (легенда, переключатель кислотность/плотность), точки двоих с одинаковым вкусом расходятся с выноской, и без знания вкуса посетителя карта говорит меньше. Отзыв требует сначала отметить свой вкус — лишний шаг, если профиля нет.",
    top, render, write,
  });
})();
