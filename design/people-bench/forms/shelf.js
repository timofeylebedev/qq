// Form «shelf» («Полка»): the people block as a bookshop's shelf talkers + Bandcamp's «supported by». Named people lead:
// each pick on this coffee is a big signed card — the reason in large text first (as said aloud), then the signature
// (name, status, where, how they drink it, the recipe, what they usually like and the one coffee they don't take, why),
// and their shelf (all their picks) opens under the card. Ксюша is QQ's team, never an ambassador. Below, apart, the
// customers: counts in direction words by brew, the notes heard as counted pills, and one line per review (Bandcamp);
// a whole review opens on tap. Issues (grind, «не как в описании») apart again, with QQ's reply.
(() => {
  const P = "f-shelf";
  const K = () => window.QQKit;
  const esc = (s) => K().esc(s);
  const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");
  const low = (s) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : "");

  // the dot of a descriptor: its flavour family (data/flavours.json → the site's --c-taste-* colours), copied here for the bench
  const DOT = { "Апельсиновые чипсы": "citrus", "Какао": "chocolate", "Орехи": "nuts", "Сухофрукты": "vine", "Чай": "tea", "Шоколад": "chocolate", "Ягоды": "berry", "Молочный шоколад": "chocolate", "Урбеч": "nuts", "Яблоко": "orchard", "Мандарин": "citrus", "Маракуйя": "tropical", "Хмель": "spice", "Зеленое яблоко": "orchard", "Карамель": "sweet", "Цитрусы": "citrus", "Сушеные ягоды": "vine", "Цветы": "tea", "Сушеный банан": "vine", "Грейпфрут": "citrus", "Табачный лист": "spice", "Тропики": "tropical", "Желтые фрукты": "tropical", "Пралине": "chocolate", "Крем-брюле": "sweet", "Сушеный апельсин": "citrus", "Темные ягоды": "berry", "Цедра цитрусов": "citrus", "Чай с бергамотом": "tea", "Мед": "sweet", "Песочное печенье": "sweet", "Сладкие специи": "spice", "Цедра": "citrus", "Виноградная косточка": "orchard", "Косточковые фрукты": "orchard", "Грильяж": "sweet", "Фруктовый ликер": "vine", "Апельсин": "citrus", "Ягодные леденцы": "berry", "Бергамот": "tea", "Малина": "berry", "Смородина": "berry", "Цедра апельсина": "citrus", "Земляничное варенье": "berry", "Черный чай": "tea", "Виноград": "orchard", "Груша": "orchard", "Лакрица": "spice", "Барбариски": "berry", "Грушевый сидр": "vine", "Дыня": "orchard", "Шиповник": "tea", "Ежевика": "berry", "Земляника": "berry", "Курага": "vine", "Фундук": "nuts" };
  const pill = (d, extra = "", tag = "span", attrs = "") =>
    `<${tag} class="${P}-pill"${attrs}><i class="${P}-dot" data-t="${DOT[d] || "other"}"></i>${esc(d)}${extra}</${tag}>`;

  // names in the genitive («все выборы Лизы», «Выбор Ксюши»); a new person falls back to the name
  const GEN = { "team-ksyusha": "Ксюши", liza: "Лизы", artem: "Артёма", masha: "Марии", gleb: "Глеба" };
  const gen = (p) => GEN[p.id] || p.name;
  const first = (p) => String(p.name).split(" ")[0];
  // «купил / купила»: by the first name (bench placeholder names; the site will ask)
  const fem = (p) => { const n = first(p); return /[ая]$/.test(n) && !/^(Никита|Илья|Фома|Кузьма|Лука)$/.test(n); };
  const g = (p, m, f) => (fem(p) ? f : m);

  const A = () => K().D.people.answers;
  const GROUPS = () => K().D.people.groups;
  const groupOf = (method) => (K().D.people.methods[method] || {}).group;
  const inGroup = (r, id) => (id === "all" ? true : id === "milk" ? !!r.milk : groupOf(r.method) === id);
  const methodLabel = (m) => (K().D.people.methods[m] || {}).label || "";
  const cupOf = (r) => `${methodLabel(r.method)}, ${r.milk ? "с молоком" : "без молока"}`;
  // the visitor's group: milk first (milk changes acidity more than the device), then the brew
  const visitorGroup = (v) => (v && v.region ? (v.milk ? "milk" : groupOf(v.method)) : null);
  const known = (ctx) => !!(ctx.visitor && ctx.visitor.region);

  // the line of a review: its first sentence that is not about the cup (the cup has its own line), else the taps in words
  const CUP = /^(Варю|Пью эспрессо|Гейзер|Делаю в|Рожковая|Турка|Аэропресс|Воронка|Завариваю|С молоком|Чаще с молоком|Френч|Кемекс)/;
  const sentences = (t) => String(t || "").split(/(?<=[.!?…])\s+/).map((s) => s.trim()).filter(Boolean);
  const answersWords = (r) => `кислотность — ${A().bright[r.answers.bright]}, плотность — ${A().body[r.answers.body]}`;
  function lineOf(r) {
    const s = sentences(r.text).find((x) => !CUP.test(x));
    return s ? { quote: true, text: s } : { quote: false, text: cap(answersWords(r)) };
  }

  // counts of a list of reviews in direction words, in the axis's own order (no answer is better than another)
  function tally(list) {
    const t = { bright: { less: 0, ok: 0, more: 0 }, body: { less: 0, ok: 0, more: 0 }, heard: {} };
    for (const r of list) {
      t.bright[r.answers.bright]++; t.body[r.answers.body]++;
      for (const d of r.heard || []) t.heard[d] = (t.heard[d] || 0) + 1;
    }
    return t;
  }
  const axisWords = (t, axis) => ["less", "ok", "more"].filter((k) => t[axis][k]).map((k) => `<b>${t[axis][k]}</b> ${esc(A()[axis][k])}`).join(" · ");
  const people = (n) => `${n} ${K().plural(n, "человек", "человека", "человек")}`;

  // ─── named people ────────────────────────────────────────────────────────────────────────────────────────────────
  // why a person picks a coffee: from that coffee's page
  const whyOf = (pid, slug) => ((K().D.pages[slug] || {}).picks || []).find((x) => x.who === pid);

  function closeness(ctx, p) {
    if (!known(ctx) || !p.pos) return null;
    const v = ctx.visitor.region.center;
    return { near: K().near(v, p.pos), shared: K().shared(v, p.pos), gap: K().gap(v, p.pos) };
  }
  const sharedWords = (s) => (s.length ? `оба любите ${s.join(" и ")}` : "");

  function card(pick, ctx, i) {
    const k = K(), p = k.person[pick.who]; if (!p) return "";
    const team = p.kind === "team";
    const label = team ? "Команда QQ" : `Амбассадор${p.placeholder ? " · пример" : ""}`;
    const rows = [];
    if (p.how) rows.push(["Пьёт", esc(p.how)]);
    if (pick.recipe) rows.push(["Рецепт", esc(pick.recipe)]);
    if (p.likes) rows.push(["Обычно любит", esc(p.likes)]);
    if (p.not && k.coffee[p.not.slug]) rows.push(["Не берёт", `<a href="#coffee/${esc(p.not.slug)}">${esc(k.coffee[p.not.slug].name)}</a> — ${esc(low(p.not.why))}`]);
    const c = closeness(ctx, p);
    const you = c ? `<p class="${P}-you"><b>Вам: ${esc(c.near)}</b>${c.shared.length ? ` — ${esc(sharedWords(c.shared))}` : ""}</p>` : "";
    const others = (p.picks || []).filter((s) => s !== ctx.coffee.slug && k.coffee[s]);
    const sid = `${P}-${ctx.uid}-shelf-${i}`;
    const shelf = others.length ? `
      <button type="button" class="${P}-more" aria-expanded="false" aria-controls="${sid}">Все выборы ${esc(gen(p))} (${p.picks.length})<span class="${P}-chev" aria-hidden="true"></span></button>
      <ul class="${P}-shelf" id="${sid}" hidden role="list">${others.map((s) => {
        const w = whyOf(p.id, s);
        return `<li><a class="${P}-shelf-name" href="#coffee/${esc(s)}">${esc(k.coffee[s].name)}</a>${w ? `<span class="${P}-shelf-why">${esc(w.why)}</span>` : ""}</li>`;
      }).join("")}</ul>` : "";
    // room for the one-line disclosure of how the person relates to QQ (a paid relation needs «Реклама»)
    const disc = team ? "" : `<p class="${P}-disc">Связь с QQ: здесь будет одна строка — например, «Реклама» или «получает кофе бесплатно»</p>`;
    return `<article class="${P}-card${team ? " is-team" : ""}">
      <p class="${P}-label">${esc(label)}</p>
      <p class="${P}-why">${esc(pick.why)}</p>
      <div class="${P}-sig">
        <p class="${P}-name">${esc(p.name)}</p>
        <p class="${P}-status">${esc([p.status, p.where].filter(Boolean).join(" · "))}</p>
        ${rows.length ? `<dl class="${P}-dl">${rows.map(([t, d]) => `<div><dt>${t}</dt><dd>${d}</dd></div>`).join("")}</dl>` : ""}
        ${you}${disc}${shelf}
      </div>
    </article>`;
  }

  function picksPart(ctx) {
    const k = K(), page = ctx.page;
    const picks = (page.picks || []).filter((x) => k.person[x.who]);
    const nos = k.D.people.named.filter((p) => p.not && p.not.slug === ctx.coffee.slug);
    const invented = picks.some((x) => k.person[x.who].placeholder) || nos.some((p) => p.placeholder);
    const noRow = nos.length ? `<ul class="${P}-nos" role="list">${nos.map((p) => `<li><span class="${P}-nos-k">Не берёт этот кофе</span> <b class="${P}-nos-name">${esc(p.name)}</b>, ${esc(low(p.status))}${p.placeholder ? " (пример)" : ""}: «${esc(p.not.why)}»</li>`).join("")}</ul>` : "";

    if (!picks.length) {
      // nobody picked it: one honest line about the named person whose usual taste is close to this coffee, or nothing
      const near = page.pos ? k.D.people.named.filter((p) => p.pos).map((p) => ({ p, g: k.gap(page.pos, p.pos) })).sort((a, b) => a.g - b.g)[0] : null;
      const line = near && k.near(page.pos, near.p.pos) === "близко"
        ? `<p class="${P}-hint">Никто из наших его пока не выбирал. Похожее обычно берёт ${esc(near.p.name)}: ${near.p.picks.filter((s) => k.coffee[s]).slice(0, 2).map((s) => `<a href="#coffee/${esc(s)}">${esc(k.coffee[s].name)}</a>`).join(", ")}. ${near.p.placeholder ? k.placeholder("Пример") : ""}</p>`
        : "";
      if (!line && !noRow) return "";
      return `<section class="${P}-picks is-none">${line}${noRow}</section>`;
    }

    // the visitor: whose taste among these is closest, in words
    let lead = "";
    if (known(ctx)) {
      const c = picks.map((x) => ({ p: k.person[x.who], c: closeness(ctx, k.person[x.who]) })).filter((x) => x.c).sort((a, b) => a.c.gap - b.c.gap);
      if (c.length > 1) {
        const b = c[0], s = sharedWords(b.c.shared);
        lead = b.c.near === "близко" ? `Ваш вкус ближе всего к вкусу ${esc(gen(b.p))}${s ? `: ${esc(s)}` : ""}.`
          : b.c.near === "отчасти" ? `Из тех, кто советует, к вашему вкусу ближе ${esc(b.p.name)}, но только отчасти${s ? `: ${esc(s)}` : ""}.`
          : `У тех, кто советует этот кофе, вкус далёк от вашего — смотрите, как его пьют покупатели.`;
        lead = `<p class="${P}-lead">${lead}</p>`;
      }
    }
    return `<section class="${P}-picks">
      <h3 class="${P}-h3">Советуют${invented ? " " + k.placeholder("Пример: амбассадоры выдуманы") : ""}</h3>
      ${lead}
      <div class="${P}-cards${picks.length > 1 ? " is-many" : ""}">${picks.map((x, i) => card(x, ctx, i)).join("")}</div>
      ${noRow}
    </section>`;
  }

  // ─── customers ───────────────────────────────────────────────────────────────────────────────────────────────────
  function reviewRow(r, ctx, open) {
    const k = K(), p = k.person[r.who] || { name: "Покупатель" };
    const L = lineOf(r);
    const usual = p.usual ? `обычно пьёт ${p.usual.label}${p.likes ? ` (${p.likes})` : ""}` : "";
    const vg = visitorGroup(ctx.visitor);
    const like = vg && inGroup(r, vg);
    const sub = [cupOf(r), L.quote ? answersWords(r) : "", usual].filter(Boolean).join(" · ");
    const meta = [k.date(r.date), r.verified ? `${g(p, "купил", "купила")} у QQ` : ""].filter(Boolean).join(" · ");
    const heard = (r.heard || []).length
      ? `<p class="${P}-full-row"><span class="${P}-k">${g(p, "Узнал", "Узнала")}</span>${r.heard.map((d) => pill(d)).join("")}</p>`
      : `<p class="${P}-full-row"><span class="${P}-k">Ноты</span><span class="${P}-muted">не ${g(p, "отметил", "отметила")}</span></p>`;
    return `<li class="${P}-rev${like ? " is-like" : ""}"><details${open ? " open" : ""}>
      <summary class="${P}-sum">
        <span class="${P}-who"><b>${esc(p.name)}</b>${p.city ? `<span>${esc(p.city)}</span>` : ""}</span>
        <span class="${P}-main">
          <span class="${P}-line${L.quote ? " is-quote" : ""}">${esc(L.quote ? `«${L.text}»` : L.text)}</span>
          <span class="${P}-cup">${like ? `<b class="${P}-as">заваривает как вы</b> · ` : ""}${esc(sub)}</span>
        </span>
        <span class="${P}-meta">${esc(meta)}</span>
      </summary>
      <div class="${P}-full">
        ${r.text ? `<p class="${P}-text">${esc(r.text)}</p>` : `<p class="${P}-text ${P}-muted">Без текста — только ответы.</p>`}
        <p class="${P}-full-row"><span class="${P}-k">Ответы</span>${esc(cap(answersWords(r)))}</p>
        ${heard}
        <p class="${P}-full-row"><span class="${P}-k">Чашка</span>${esc(cupOf(r))}${r.cups ? `, после ${r.cups} ${k.plural(r.cups, "чашки", "чашек", "чашек")}` : ""}</p>
      </div>
    </details></li>`;
  }

  function summary(list, all, ctx) {
    const t = tally(list), n = list.length;
    const heard = ctx.coffee.descriptors.map((d) => ({ d, n: t.heard[d] || 0 })).filter((x) => x.n).sort((a, b) => b.n - a.n);
    return `<div class="${P}-sumup" aria-live="polite">
      <p class="${P}-count">${esc(people(n))}${n < all ? ` из ${all}` : ""}:</p>
      <dl class="${P}-axes">
        <div><dt>${esc(A().bright.title)}</dt><dd>${axisWords(t, "bright")}</dd></div>
        <div><dt>${esc(A().body.title)}</dt><dd>${axisWords(t, "body")}</dd></div>
      </dl>
      ${heard.length ? `<p class="${P}-heard"><span class="${P}-k">Узнали ноты</span>${heard.map((x) => pill(x.d, ` <b>${x.n} из ${n}</b>`)).join("")}</p>` : `<p class="${P}-heard ${P}-muted">Ноты пока никто не отметил.</p>`}
    </div>`;
  }

  function crowdPart(ctx) {
    const k = K(), rs = ctx.page.reviews || [], n = rs.length;
    const head = `<h3 class="${P}-h3">Как пьют покупатели ${k.placeholder()}</h3>`;
    if (!n) {
      return `<section class="${P}-crowd is-empty"><h3 class="${P}-h3">Как пьют покупатели</h3>
        <div class="${P}-invite"><p class="${P}-invite-say">Пили этот кофе? Расскажите, как заваривали — ваш отзыв будет первым.</p>
        <button type="button" class="${P}-btn" data-write>Написать отзыв</button></div></section>`;
    }
    const vg = visitorGroup(ctx.visitor);
    // the visitor's own brew first in the list, then by date
    const sorted = vg ? rs.slice().sort((a, b) => inGroup(b, vg) - inGroup(a, vg)) : rs;
    if (n === 1) {
      return `<section class="${P}-crowd is-one">${head}
        <p class="${P}-note">Пока один отзыв — это история одного человека, а не общее мнение.</p>
        <ul class="${P}-list" role="list">${reviewRow(rs[0], ctx, true)}</ul></section>`;
    }
    // filter by brew (StoryGraph's «by format»): only with enough reviews to split
    const groups = (ctx.page.groups || []).filter((x) => x.n);
    const chips = n >= 4 && groups.length > 1 ? `<div class="${P}-chips" role="radiogroup" aria-label="Как заваривают">
      ${[{ id: "all", label: "Все", n }].concat(groups).map((x) => `<button type="button" role="radio" class="${P}-chip" data-g="${x.id}" aria-checked="${x.id === "all"}">${esc(x.label)}${x.id === vg ? " — как вы" : ""} <b>${x.n}</b></button>`).join("")}
    </div>` : "";
    const yours = vg && groups.find((x) => x.id === vg && x.n >= 2 && x.n < n);
    const yoursLine = yours ? (() => {
      const t = tally(rs.filter((r) => inGroup(r, vg)));
      return `<p class="${P}-yours"><b>Кто пьёт ${esc(vg === "milk" ? "с молоком" : low(yours.label))}, как вы (${yours.n}):</b> кислотность — ${axisWords(t, "bright")}; плотность — ${axisWords(t, "body")}</p>`;
    })() : "";
    return `<section class="${P}-crowd" data-n="${n}">${head}
      <div class="${P}-summary">${summary(rs, n, ctx)}</div>
      ${yoursLine}${chips}
      <ul class="${P}-list" role="list">${sorted.map((r) => reviewRow(r, ctx, false)).join("")}</ul>
    </section>`;
  }

  function issuesPart(ctx) {
    const k = K(), is = ctx.page.issues || [];
    if (!is.length) return "";
    const WHAT = { grind: "Помол не подошёл", described: "Не как в описании" };
    return `<section class="${P}-issues"><h3 class="${P}-h3">Не про вкус</h3>
      <ul class="${P}-list" role="list">${is.map((x) => {
        const p = k.person[x.who] || { name: "Покупатель" };
        return `<li class="${P}-issue">
          <p class="${P}-issue-what">${esc(WHAT[x.issue] || x.issue)}</p>
          <p class="${P}-issue-text">${esc(x.text)}</p>
          <p class="${P}-cup">${esc([p.name, cupOf(x), k.date(x.date), x.verified ? `${g(p, "купил", "купила")} у QQ` : ""].filter(Boolean).join(" · "))}</p>
          ${x.reply ? `<div class="${P}-reply"><p class="${P}-reply-k">Ответ QQ</p><p>${esc(x.reply.replace(/\s*—\s*QQ\s*$/, ""))}</p></div>` : ""}
        </li>`;
      }).join("")}</ul></section>`;
  }

  function wire(root) {
    root.querySelectorAll(`.${P}-more`).forEach((b) => b.addEventListener("click", () => {
      const el = root.querySelector("#" + b.getAttribute("aria-controls"));
      const on = b.getAttribute("aria-expanded") !== "true";
      b.setAttribute("aria-expanded", on); el.hidden = !on;
    }));
    const crowd = root.querySelector(`.${P}-crowd[data-n]`);
    if (crowd) {
      crowd.querySelectorAll(`.${P}-chip`).forEach((b) => b.addEventListener("click", () => {
        const id = b.dataset.g;
        crowd.querySelectorAll(`.${P}-chip`).forEach((x) => x.setAttribute("aria-checked", x === b));
        const items = [...crowd.querySelectorAll(`.${P}-rev`)];
        const rs = crowd._reviews;
        const keep = rs.filter((r) => inGroup(r, id));
        items.forEach((li, i) => { li.hidden = !inGroup(crowd._order[i], id); });
        crowd.querySelector(`.${P}-summary`).innerHTML = summary(keep, rs.length, crowd._ctx);
      }));
    }
    root.querySelectorAll("[data-write]").forEach((b) => b.addEventListener("click", () => {
      const w = root.closest(".stagewrap") && root.closest(".stagewrap").querySelector(".write");
      if (w) w.scrollIntoView({ behavior: "smooth", block: "start" });
    }));
  }

  // ─── the review form ─────────────────────────────────────────────────────────────────────────────────────────────
  const STYLES = [
    { id: "classic", label: "классику: шоколад и орехи" },
    { id: "bright", label: "яркое и фруктовое" },
    { id: "unusual", label: "необычные обработки" },
    { id: "dark", label: "тёмную обжарку из магазина" }
  ];
  // what the bench's visitor usually drinks (on the site: saved from the quiz or the last review)
  function visitorUsual(v) {
    if (!v || !v.region) return null;
    const c = v.region.center;
    const s = c.bright >= 3.4 ? "bright" : c.bright < 1.5 ? "dark" : "classic";
    return STYLES.find((x) => x.id === s);
  }

  QQBench.register({
    id: "shelf",
    name: "Полка",
    idea: "Как стикеры продавцов в книжном и «supported by» на Bandcamp: впереди подписанные карточки тех, кто советует, — причина крупно, потом подпись, рецепт, что обычно любит и что не берёт, и вся его полка. Ниже, отдельно и мельче, покупатели: счёт ответов словами и по строке на человека с его чашкой.",
    notes: "Сильнее всего, пока советующих мало и они настоящие: карточка — это лицо, и чужой вкус читается по «не берёт». Цена: верх блока занят двумя-тремя людьми, а не толпой; без настоящих амбассадоров половина блока — пример. Строка отзыва берёт первую фразу не про чашку — на настоящих текстах это надо будет проверить. Цвета точек нот скопированы в форму.",
    top(root, ctx) {
      const k = K(), n = ctx.page.count || 0;
      const picks = (ctx.page.picks || []).map((x) => k.person[x.who]).filter(Boolean);
      const parts = [];
      if (n) parts.push(`${n} ${k.plural(n, "отзыв", "отзыва", "отзывов")}`);
      if (picks.length) parts.push(`Выбор ${picks.map(gen).join(" и ")}`);
      if (!n) parts.push(picks.length ? "отзывов пока нет" : "Отзывов пока нет — расскажите первым");
      root.innerHTML = `<a class="${P}-top" href="#${P}-${esc(ctx.uid)}">${esc(parts.join(" · "))}<span class="${P}-arrow" aria-hidden="true">↓</span></a>`;
    },
    render(root, ctx) {
      root.innerHTML = `<div class="${P}" id="${P}-${esc(ctx.uid)}">
        <h2 class="${P}-h2">Кто это пьёт</h2>
        ${picksPart(ctx)}${crowdPart(ctx)}${issuesPart(ctx)}
        ${(ctx.page.reviews || []).length ? `<p class="${P}-foot"><button type="button" class="${P}-btn" data-write>Написать отзыв</button></p>` : ""}
      </div>`;
      const crowd = root.querySelector(`.${P}-crowd[data-n]`);
      if (crowd) {
        const vg = visitorGroup(ctx.visitor), rs = ctx.page.reviews;
        crowd._reviews = rs; crowd._ctx = ctx;
        crowd._order = vg ? rs.slice().sort((a, b) => inGroup(b, vg) - inGroup(a, vg)) : rs;
      }
      wire(root);
    },
    write(root, ctx) {
      const k = K(), u = ctx.uid, M = k.D.people.methods;
      const usual = visitorUsual(ctx.visitor);
      const radios = (name, opts, cls = "") => opts.map(([v, l]) => `<label class="${P}-opt${cls}"><input type="radio" name="${P}-${u}-${name}" value="${esc(v)}"><span>${esc(l)}</span></label>`).join("");
      const three = (axis) => radios(axis, ["less", "ok", "more"].map((x) => [x, A()[axis][x]]), ` ${P}-opt-3`);
      const usualPick = `<div class="${P}-usual-pick"${usual ? " hidden" : ""}>
          <div class="${P}-opts">${radios("usual", STYLES.map((s) => [s.id, cap(s.label)]))}</div>
          <label class="${P}-sel"><span>или кофе QQ</span><select name="${P}-${u}-usualq"><option value="">—</option>${k.D.coffees.map((c) => `<option value="${esc(c.slug)}">${esc(c.name)}</option>`).join("")}</select></label>
        </div>`;
      root.innerHTML = `<form class="${P}-form" novalidate>
        <div class="${P}-fhead"><h3 class="${P}-h3">Ваш отзыв · ${esc(ctx.coffee.name)}</h3><p class="${P}-muted">Лучше после нескольких чашек. Звёзд нет: важно, как заваривали и куда кофе ушёл от ожидания.</p></div>
        <div class="${P}-cells">
          <fieldset class="${P}-cell is-wide" data-req="method"><legend class="${P}-lab">Как заваривали <i>*</i></legend>
            <div class="${P}-opts">${radios("method", Object.entries(M).map(([id, m]) => [id, m.label]))}</div></fieldset>
          <div class="${P}-cell is-wide ${P}-cell-row"><span class="${P}-lab" id="${P}-${u}-milk-l">С молоком</span>
            <label class="${P}-toggle"><input type="checkbox" name="${P}-${u}-milk" role="switch" aria-labelledby="${P}-${u}-milk-l"><span class="${P}-track" aria-hidden="true"></span><span class="${P}-toggle-t" data-off="Нет" data-on="Да"></span></label></div>
          <fieldset class="${P}-cell" data-req="bright"><legend class="${P}-lab">Кислотность <i>*</i></legend><div class="${P}-opts ${P}-three">${three("bright")}</div></fieldset>
          <fieldset class="${P}-cell is-r" data-req="body"><legend class="${P}-lab">Плотность <i>*</i></legend><div class="${P}-opts ${P}-three">${three("body")}</div></fieldset>
          <fieldset class="${P}-cell is-wide"><legend class="${P}-lab">Какие ноты узнали</legend>
            <div class="${P}-opts">${ctx.coffee.descriptors.map((d) => `<label class="${P}-opt ${P}-opt-note"><input type="checkbox" name="${P}-${u}-heard" value="${esc(d)}"><span><i class="${P}-dot" data-t="${DOT[d] || "other"}"></i>${esc(d)}</span></label>`).join("")}</div></fieldset>
          <label class="${P}-cell"><span class="${P}-lab">Посоветую тем, кто…</span><input class="${P}-in" name="${P}-${u}-for" maxlength="120" placeholder="…любит мягкое к молоку"></label>
          <label class="${P}-cell is-r"><span class="${P}-lab">Что бы поменяли</span><input class="${P}-in" name="${P}-${u}-change" maxlength="200" placeholder="Например: чуть плотнее для турки"></label>
          <div class="${P}-cell is-wide ${P}-usual"><span class="${P}-lab">Обычно пью…</span>
            ${usual ? `<p class="${P}-saved"><span>Обычно пью <b>${esc(usual.label)}</b>${ctx.visitor.milk ? ", с молоком" : ""}</span><span class="${P}-muted">сохранено в профиле</span><button type="button" class="${P}-link" data-change>Изменить</button></p>` : ""}
            ${usualPick}</div>
          <label class="${P}-cell"><span class="${P}-lab">Имя <span class="${P}-muted">— можно не писать</span></span><input class="${P}-in" name="${P}-${u}-name" autocomplete="given-name"></label>
          <label class="${P}-cell is-r"><span class="${P}-lab">Город</span><input class="${P}-in" name="${P}-${u}-city" autocomplete="address-level2"></label>
        </div>
        <div class="${P}-send"><button type="submit" class="${P}-btn ${P}-btn-ink">Отправить</button><p class="${P}-err" role="alert"></p></div>
        <div class="${P}-out" hidden></div>
        <div class="${P}-aside">
          <button type="button" class="${P}-link" data-issue aria-expanded="false">Не про вкус: помол не подошёл / не как в описании</button>
          <div class="${P}-issue-form" hidden>
            <div class="${P}-opts">${radios("issue", [["grind", "Помол не подошёл"], ["described", "Не как в описании"]])}</div>
            <input class="${P}-in" name="${P}-${u}-issue-text" placeholder="Что случилось: способ, помол, чего не нашли">
            <p class="${P}-muted">Это не попадёт в счёт вкуса: QQ ответит здесь же и, если надо, заменит пачку.</p>
            <button type="button" class="${P}-btn" data-issue-send>Отправить в QQ</button>
            <p class="${P}-issue-out" role="status"></p>
          </div>
        </div>
      </form>`;

      const f = root.querySelector("form");
      const val = (n) => { const el = f.querySelector(`[name="${P}-${u}-${n}"]:checked`); return el ? el.value : ""; };
      const txt = (n) => f.querySelector(`[name="${P}-${u}-${n}"]`).value.trim();
      const tog = f.querySelector(`[name="${P}-${u}-milk"]`);
      f.querySelector("[data-change]")?.addEventListener("click", (e) => {
        f.querySelector(`.${P}-usual-pick`).hidden = false; e.target.closest(`.${P}-saved`).hidden = true;
      });
      f.addEventListener("change", (e) => {
        const c = e.target.closest("[data-req]"); if (c) c.classList.remove("is-miss");
      });
      const issueBtn = f.querySelector("[data-issue]"), issueForm = f.querySelector(`.${P}-issue-form`);
      issueBtn.addEventListener("click", () => { const on = issueForm.hidden; issueForm.hidden = !on; issueBtn.setAttribute("aria-expanded", on); });
      f.querySelector("[data-issue-send]").addEventListener("click", () => {
        const w = val("issue"), out = f.querySelector(`.${P}-issue-out`);
        out.textContent = w ? `Ушло бы в QQ отдельно от отзывов: «${w === "grind" ? "Помол не подошёл" : "Не как в описании"}»${txt("issue-text") ? ` — ${txt("issue-text")}` : ""}. (На стенде ничего не отправляется.)` : "Выберите, что случилось.";
      });
      f.addEventListener("submit", (e) => {
        e.preventDefault();
        const miss = ["method", "bright", "body"].filter((n) => !val(n));
        f.querySelectorAll("[data-req]").forEach((c) => c.classList.toggle("is-miss", miss.includes(c.dataset.req)));
        const err = f.querySelector(`.${P}-err`), out = f.querySelector(`.${P}-out`);
        if (miss.length) {
          const W = { method: "как заваривали", bright: "кислотность", body: "плотность" };
          err.textContent = `Осталось отметить: ${miss.map((m) => W[m]).join(", ")}.`;
          f.querySelector(`[data-req="${miss[0]}"] input`).focus();
          out.hidden = true; return;
        }
        err.textContent = "";
        const heard = [...f.querySelectorAll(`[name="${P}-${u}-heard"]:checked`)].map((x) => x.value);
        const st = val("usual"), q = txt("usualq");
        const usualNow = q ? k.coffee[q].name : st ? STYLES.find((s) => s.id === st).label : usual && !f.querySelector(`.${P}-saved`)?.hidden ? usual.label : "";
        const rows = [
          ["Чашка", `${M[val("method")].label}, ${tog.checked ? "с молоком" : "без молока"}`],
          ["Кислотность", A().bright[val("bright")]],
          ["Плотность", A().body[val("body")]],
          ["Узнали", heard.length ? heard.join(", ") : "—"],
          ["Посоветую тем, кто", txt("for") || "—"],
          ["Что бы поменяли", txt("change") || "—"],
          ["Обычно пью", usualNow || "—"],
          ["Подпись", [txt("name") || "без имени", txt("city")].filter(Boolean).join(", ")]
        ];
        out.innerHTML = `<p class="${P}-out-h">Отправили бы так</p><dl class="${P}-dl">${rows.map(([t, d]) => `<div><dt>${esc(t)}</dt><dd>${esc(d)}</dd></div>`).join("")}</dl>
          <p class="${P}-muted">На стенде ничего не уходит. На сайте отзыв встанет в список и в счёт ответов; «обычно пью» сохранится в профиле.</p>`;
        out.hidden = false;
      });
    }
  });
})();
