// «Как вы пьёте»: the block asks ONE question first — how the reader brews (espresso / турка и гейзер / filter / milk;
// preselected from the visitor when known, else «Все») — and then speaks only about people who brew that way: one
// sentence of counts in words, the notes those people heard as counts, their reviews (each led by the cup line), the
// others folded. Named people who brew the same way come first, in their own strip on the ink ground («Советуют»);
// Ксюша stands in the same strip as QQ's team, not as an ambassador. Issues (помол, «не как в описании») apart, with
// QQ's reply. 0 reviews: no widget, an invitation; 1: one person's story; 2: the sentence without the question.
// write: one question per screen with a progress line and back; a separate small path for «не про вкус».
(() => {
  const P = "f-method-";
  const GROUPS = ["espresso", "pot", "filter", "milk"];
  // «Из 5 человек с эспрессо»; «6 человек пьют с молоком»
  const WITH = { all: "", espresso: "с эспрессо", pot: "с туркой или гейзером", filter: "с фильтром", milk: "с молоком" };
  const ABOUT = { espresso: "про эспрессо", pot: "про турку и гейзер", filter: "про фильтр", milk: "про молоко" };
  const ISSUE = { grind: "Помол не подошёл", described: "Не как в описании" };
  const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

  function tools(kit) {
    const { D, esc, plural } = kit;
    const M = D.people.methods, A = D.people.answers;
    const groupOf = (method) => (M[method] ? M[method].group : null);
    const inGroup = (x, g) => g === "all" || (g === "milk" ? !!x.milk : groupOf(x.method) === g);
    const reviewsWord = (n) => plural(n, "отзыв", "отзыва", "отзывов");
    // one axis in words: «3 — в самый раз, 2 — ярковато» or «всем в самый раз»
    function axis(counts, n, key) {
      const parts = ["ok", "less", "more"].map((k) => [k, counts[k] || 0]).filter(([, c]) => c > 0).sort((a, b) => b[1] - a[1]);
      const by = `по ${A[key].title.toLowerCase().replace(/ь$/, "и")}`; // по кислотности, по плотности
      if (parts.length === 1) return `${by} — ${n === 2 ? "обоим" : "всем"} ${A[key][parts[0][0]]}`;
      return `${by} ${parts.map(([k, c]) => `${c}\u00a0— ${A[key][k]}`).join(", ")}`;
    }
    function count(list) {
      const c = { bright: { less: 0, ok: 0, more: 0 }, body: { less: 0, ok: 0, more: 0 } };
      for (const r of list) { c.bright[r.answers.bright]++; c.body[r.answers.body]++; }
      return c;
    }
    const lines = (list) => { const c = count(list), n = list.length; return [axis(c.bright, n, "bright"), axis(c.body, n, "body")]; };
    const sentence = (list) => lines(list).join("; ");
    // the visitor's way, from what the quiz / feedback knows
    const visitorGroup = (v) => (v && v.method ? (v.milk ? "milk" : groupOf(v.method)) : null);
    // the cup: «Гейзер · без молока»
    const cupLine = (x) => `${(M[x.method] && M[x.method].label) || x.how || ""} · ${x.milk ? "с молоком" : "без молока"}`;
    function usualLine(p, coffee) {
      if (!p || !p.usual) return "";
      const u = p.usual;
      const what = u.slug === coffee.slug ? "именно этот кофе" : u.slug ? `<b>${esc(u.label)}</b>` : esc(u.label);
      return `Обычно пьёт ${what}${p.likes ? ` · любит ${esc(p.likes)}` : ""}`;
    }
    return { D, M, A, esc, plural, groupOf, inGroup, reviewsWord, axis, count, lines, sentence, visitorGroup, cupLine, usualLine };
  }

  // ---------- the block ----------
  function reviewCard(r, t, coffee, big) {
    const { esc, A, plural } = t;
    const p = t.D.people.people.find((x) => x.id === r.who) || {};
    const ans = (key) => `<span class="${P}ans${r.answers[key] !== "ok" ? ` ${P}is-off` : ""}"><span class="${P}anskey">${A[key].title}</span><span class="${P}ansval">${esc(A[key][r.answers[key]])}</span></span>`;
    const heard = r.heard.length
      ? `<span class="${P}heard"><span class="${P}heardkey">Узнали</span>${r.heard.map((d) => `<span class="${P}pill ${P}pill-s"><i class="${P}dot" aria-hidden="true"></i>${esc(d)}</span>`).join("")}</span>`
      : "";
    const meta = [
      [p.name, p.city].filter(Boolean).map(esc).join(", "),
      t.D && r.date ? window.QQKit.date(r.date) : "",
      r.cups ? `после ${r.cups} ${plural(r.cups, "чашки", "чашек", "чашек")}` : "",
      r.verified ? "куплено у QQ" : ""
    ].filter(Boolean);
    return `<article class="${P}review${big ? ` ${P}is-big` : ""}">
      <p class="${P}cup">${esc(t.cupLine(r))}</p>
      <p class="${P}usual">${t.usualLine(p, coffee)}</p>
      <p class="${P}answers">${ans("bright")}${ans("body")}</p>
      ${heard}
      ${r.text ? `<p class="${P}text">${esc(r.text)}</p>` : `<p class="${P}text ${P}is-taps">Без текста — только ответы</p>`}
      <p class="${P}meta">${meta.map((m) => `<span>${m}</span>`).join("")}</p>
    </article>`;
  }

  function personCard(pk, t, ctx) {
    const { esc } = t, kit = ctx.kit;
    const p = kit.person[pk.who];
    if (!p) return "";
    const team = p.kind === "team";
    const v = ctx.visitor && ctx.visitor.region;
    let close = "";
    if (v && p.pos) {
      const n = kit.near(v.center, p.pos), sh = kit.shared(v.center, p.pos);
      close = `<p class="${P}close"><span class="${P}k">С вашим вкусом</span>${n}${sh.length ? ` — оба любите ${esc(sh.join(" и "))}` : ""}</p>`;
    }
    const not = p.not && kit.coffee[p.not.slug]
      ? `<p class="${P}not"><span class="${P}k">Не берёт</span><b>${esc(kit.coffee[p.not.slug].name)}</b>: ${esc(p.not.why)}</p>` : "";
    return `<article class="${P}person${team ? ` ${P}is-team` : ""}">
      <p class="${P}role">${team ? "Команда QQ · не амбассадор" : "Амбассадор QQ"}${p.placeholder ? ` ${kit.placeholder("Пример")}` : ""}</p>
      <h4 class="${P}pname">${esc(team ? p.tag || p.name : p.name)}</h4>
      <p class="${P}status">${esc([p.status, p.where].filter(Boolean).join(" · "))}</p>
      ${p.how || p.method ? `<p class="${P}how"><span class="${P}k">Пьёт</span>${esc(p.how || t.cupLine(p))}${p.likes ? ` · любит ${esc(p.likes)}` : ""}</p>` : ""}
      <p class="${P}why">«${esc(pk.why)}»</p>
      ${pk.recipe ? `<p class="${P}recipe"><span class="${P}k">Рецепт</span>${esc(pk.recipe)}</p>` : ""}
      ${close}${not}
      <p class="${P}disclose">${team ? "Из команды QQ (кто Ксюша — уточнить)" : "Связь с QQ: амбассадор, кофе для проб бесплатно (строка раскрытия; если платно — «Реклама»)"}</p>
    </article>`;
  }

  function strip(t, ctx, g) {
    const kit = ctx.kit, picks = ctx.page.picks || [];
    if (!picks.length) return "";
    const named = picks.map((pk) => ({ pk, p: kit.person[pk.who] })).filter((x) => x.p);
    const team = named.filter((x) => x.p.kind === "team");
    const same = named.filter((x) => x.p.kind !== "team" && t.inGroup(x.p, g));
    const other = named.filter((x) => x.p.kind !== "team" && !t.inGroup(x.p, g));
    const shown = [...same, ...team];
    const many = other.length > 1;
    const head = !shown.length ? `${many ? "Советуют" : "Советует"} — но ${many ? "заваривают" : "заваривает"} по-другому` : g === "all" || !same.length ? "Советуют" : "Советуют · заваривают так же";
    const jumps = other.map((x) => `<button type="button" class="${P}jump" data-g="${t.visitorGroup(x.p) || t.groupOf(x.p.method)}">${t.esc(x.p.name)} — ${t.esc(x.p.how || t.cupLine(x.p))}</button>`);
    const others = other.length
      ? `<p class="${P}others-named">${shown.length ? `${many ? "Ещё советуют" : "Ещё советует"}${g !== "all" ? ` (${many ? "заваривают" : "заваривает"} по-другому)` : ""}: ` : ""}${jumps.join(", ")}</p>` : "";
    return `<section class="${P}strip" aria-label="Советуют — отдельно от отзывов покупателей">
      <h3 class="${P}striph">${head}</h3>
      ${shown.length ? `<div class="${P}people n${Math.min(shown.length, 3)}">${shown.map((x) => personCard(x.pk, t, ctx)).join("")}</div>` : ""}
      ${others}
    </section>`;
  }

  function heardHtml(t, coffee, list) {
    const n = list.length;
    const items = coffee.descriptors.map((d) => [d, list.filter((r) => r.heard.includes(d)).length]).sort((a, b) => b[1] - a[1]);
    return `<div class="${P}notes"><span class="${P}noteshead">Какие ноты узнали</span><span class="${P}noteslist">${items.map(([d, c]) =>
      `<span class="${P}pill${c ? "" : ` ${P}is-zero`}"><i class="${P}dot" aria-hidden="true"></i>${t.esc(d)}<span class="${P}cnt">${c} из ${n}</span></span>`).join("")}</span></div>`;
  }

  function invite(t, ctx, text) {
    return `<div class="${P}invite">
      <p class="${P}invq">${text}</p>
      <p class="${P}invbtns">${GROUPS.map((g) => `<button type="button" class="${P}invbtn" data-write="${g}">${t.esc(t.D.people.groups[g])}</button>`).join("")}</p>
    </div>`;
  }

  function cta() {
    return `<div class="${P}cta"><button type="button" class="${P}primary" data-write="">Написать отзыв</button><button type="button" class="${P}issuelink" data-issue="1">Не про вкус: помол не подошёл / не как в описании</button></div>`;
  }

  function issues(t, ctx) {
    const list = ctx.page.issues || [];
    if (!list.length) return "";
    const { esc } = t;
    return `<section class="${P}issues"><h3 class="${P}h3">Не про вкус</h3><p class="${P}sub">Помол и расхождения с описанием — отдельно: в счёт выше они не входят.</p>
      ${list.map((x) => { const p = t.D.people.people.find((y) => y.id === x.who) || {}; return `<article class="${P}issue">
        <p class="${P}issuetag">${ISSUE[x.issue] || x.issue}</p>
        <p class="${P}cup">${esc(t.cupLine(x))}</p>
        <p class="${P}text">${esc(x.text)}</p>
        <p class="${P}meta"><span>${esc([p.name, p.city].filter(Boolean).join(", "))}</span><span>${window.QQKit.date(x.date)}</span>${x.verified ? "<span>куплено у QQ</span>" : ""}</p>
        ${x.reply ? `<div class="${P}reply"><span class="${P}k">Ответ QQ</span>${esc(x.reply.replace(/\s*— QQ$/, ""))}</div>` : ""}
      </article>`; }).join("")}</section>`;
  }

  function wire(root, ctx, onGroup) {
    root.querySelectorAll("[data-g]").forEach((b) => (b.onclick = () => onGroup(b.dataset.g)));
    const writeEl = () => { const st = root.closest(".stage"); return st && st.querySelector(".write"); };
    root.querySelectorAll("[data-write]").forEach((b) => (b.onclick = () => {
      const w = writeEl();
      if (w && w.__fMethodOpen) w.__fMethodOpen({ group: b.dataset.write || null });
      if (w) w.scrollIntoView({ block: "start", behavior: "smooth" });
    }));
    root.querySelectorAll("[data-issue]").forEach((b) => (b.onclick = () => {
      const w = writeEl();
      if (w && w.__fMethodOpen) w.__fMethodOpen({ issue: true });
      if (w) w.scrollIntoView({ block: "start", behavior: "smooth" });
    }));
  }

  function render(root, ctx) {
    const t = tools(ctx.kit), { esc } = t;
    const { coffee, page } = ctx;
    const reviews = page.reviews || [];
    const n = reviews.length;
    const used = new Set(reviews.flatMap((r) => [t.groupOf(r.method), r.milk ? "milk" : null]).filter(Boolean));
    const ask = n >= 3 || (n >= 2 && new Set(reviews.map((r) => t.groupOf(r.method))).size > 1);
    const vg = t.visitorGroup(ctx.visitor);
    let g = ask && vg ? vg : "all";
    const ph = page.placeholder && (n || (page.issues || []).length) ? ctx.kit.placeholder() : "";
    const id = `people-${ctx.uid}`;

    function control() {
      const opts = [...GROUPS, "all"].map((k) => {
        const c = k === "all" ? n : reviews.filter((r) => t.inGroup(r, k)).length;
        const label = k === "all" ? "Все способы" : t.D.people.groups[k];
        return `<button type="button" class="${P}seg${k === "all" ? ` ${P}seg-all` : ""}" data-g="${k}" aria-pressed="${k === g}"><span class="${P}seglabel">${esc(label)}</span><span class="${P}segn">${c ? `${c} ${t.reviewsWord(c)}` : "пока нет"}</span></button>`;
      }).join("");
      const from = vg && g === vg ? `<p class="${P}from">Выбрано по вашему профилю: ${esc(ctx.visitor.label.toLowerCase())}. Можно сменить.</p>` : "";
      return `<div class="${P}ask"><h3 class="${P}askq">Как вы пьёте кофе?</h3><div class="${P}segs" role="group" aria-label="Как вы пьёте кофе">${opts}</div>${from}</div>`;
    }

    function byWay() {
      const rows = GROUPS.filter((k) => used.has(k)).map((k) => {
        const list = reviews.filter((r) => t.inGroup(r, k));
        return `<button type="button" class="${P}way" data-g="${k}"><span class="${P}wayname">${esc(t.D.people.groups[k])} · ${list.length}</span><span class="${P}wayline">${t.lines(list).map((l) => `<span>${esc(cap(l))}</span>`).join("")}${list.length === 1 ? `<span class="${P}waynote">один человек — не счёт</span>` : ""}</span></button>`;
      }).join("");
      return `<div class="${P}ways"><p class="${P}wayshead">Кислотность зависит от способа не меньше, чем от зерна. По способам:</p>${rows}</div>`;
    }

    function body() {
      if (!n) {
        return `${strip(t, ctx, "all")}${invite(t, ctx, `${page.picks && page.picks.length ? "Отзывов покупателей пока нет." : "Отзывов пока нет."} Пили? Расскажите, как заваривали:`)}${issues(t, ctx)}<div class="${P}cta"><button type="button" class="${P}issuelink" data-issue="1">Не про вкус: помол не подошёл / не как в описании</button></div>`;
      }
      if (!ask) {
        // 1 review: one person's story; 2 of one way: the sentence with the way, no question
        const lead = n === 1
          ? `Пока один отзыв — история одного человека, не общий счёт.`
          : `${n} ${t.plural(n, "человек", "человека", "человек")} ${WITH[t.groupOf(reviews[0].method)]}: ${esc(t.sentence(reviews))}.`;
        const gap = vg && !reviews.some((r) => t.inGroup(r, vg)) ? `<p class="${P}gapnote">${cap(ABOUT[vg])} пока никто не писал — вы будете первым.</p>` : "";
        return `${strip(t, ctx, "all")}<p class="${P}lead">${lead}</p>${gap}${n > 1 ? heardHtml(t, coffee, reviews) : ""}
          <div class="${P}reviews${n === 1 ? ` ${P}is-one` : ""}">${reviews.map((r) => reviewCard(r, t, coffee, n === 1)).join("")}</div>${issues(t, ctx)}${cta()}`;
      }
      const mine = reviews.filter((r) => t.inGroup(r, g));
      const rest = reviews.filter((r) => !t.inGroup(r, g));
      let lead, extra = "";
      if (g === "all") { lead = `Из ${n} человек: ${esc(t.sentence(reviews))}.`; extra = byWay(); }
      else if (!mine.length) lead = `${cap(ABOUT[g])} пока никто не писал. Пьёте так? Расскажите первым — <button type="button" class="${P}inline" data-write="${g}">написать отзыв</button>.`;
      else if (mine.length === 1) lead = `Пока один человек ${WITH[g]} — его отзыв ниже, это одна история, не счёт.`;
      else lead = `Из ${mine.length} человек ${WITH[g]}: ${esc(t.sentence(mine))}.`;
      return `${strip(t, ctx, g)}
        <p class="${P}lead">${lead}</p>${extra}
        ${mine.length > 1 ? heardHtml(t, coffee, mine) : ""}
        ${mine.length ? `<div class="${P}reviews">${mine.map((r) => reviewCard(r, t, coffee)).join("")}</div>` : ""}
        ${rest.length && g !== "all" ? `<details class="${P}rest"${mine.length ? "" : " open"}><summary class="${P}restsum">Ещё ${rest.length} ${t.reviewsWord(rest.length)} — другие способы</summary><div class="${P}reviews">${rest.map((r) => reviewCard(r, t, coffee)).join("")}</div></details>` : ""}
        ${issues(t, ctx)}${cta()}`;
    }

    function draw() {
      root.innerHTML = `<section class="f-method" id="${id}">
        <header class="${P}head"><h2 class="${P}h">Отзывы</h2>${ph}</header>
        ${n ? `<p class="${P}sub">Без звёзд и оценок: у каждого отзыва — как человек заваривал и что пьёт обычно, чтобы было видно, похож ли он на вас.</p>` : ""}
        ${ask ? control() : ""}
        <div class="${P}body">${body()}</div>
      </section>`;
      wire(root, ctx, (k) => { if (!ask) return; g = k; draw(); const s = root.querySelector(`.${P}segs`); if (s && s.getBoundingClientRect().top < 0) s.scrollIntoView({ block: "start" }); });
    }
    draw();
  }

  function top(root, ctx) {
    const t = tools(ctx.kit), { esc, plural } = t;
    const { page } = ctx, n = (page.reviews || []).length;
    const named = (page.picks || []).map((pk) => ctx.kit.person[pk.who]).filter(Boolean);
    const team = named.find((p) => p.kind === "team");
    const amb = named.filter((p) => p.kind !== "team");
    const vg = t.visitorGroup(ctx.visitor);
    const parts = [];
    parts.push(n ? `${n} ${t.reviewsWord(n)}` : "Отзывов пока нет");
    let mine = "";
    if (n && vg) { const c = page.reviews.filter((r) => t.inGroup(r, vg)).length; mine = c ? `${c} ${WITH[vg]}, как вы` : `${ABOUT[vg]} пока нет`; }
    if (team) parts.push(team.tag || team.name);
    else if (amb.length) parts.push(amb.length === 1 ? `советует ${amb[0].name}` : `советуют ${amb.length} ${plural(amb.length, "амбассадор", "амбассадора", "амбассадоров")}`);
    if (!n && !named.length) parts[0] = "Отзывов пока нет — напишите первый";
    root.innerHTML = `<a class="f-method-top" href="#people-${ctx.uid}"><span>${esc(parts[0])}</span>${mine ? `<span class="${P}topmine"> · ${esc(mine)}</span>` : ""}${parts[1] ? `<span> · ${esc(parts[1])}</span>` : ""}<span class="${P}arrow" aria-hidden="true">↓</span></a>`;
  }

  // ---------- write: one question per screen ----------
  const STEPS = ["Как заваривали", "С молоком?", "Кислотность", "Плотность", "Какие ноты узнали", "Что скажете", "Обычно пью…"];

  function write(root, ctx) {
    const t = tools(ctx.kit), { esc, M, A, D } = t;
    const { coffee, visitor } = ctx, uid = ctx.uid;
    const styleOf = (v) => { if (!v || !v.region) return null; const c = v.region.center; return c.bright >= 3.4 ? "bright" : c.bright <= 1.5 && c.body >= 4.3 ? "dark" : "classic"; };
    const known = visitor && visitor.id !== "none" ? visitor : null;
    const fresh = () => ({
      step: 1, mode: "review", sent: false,
      method: known ? known.method : null, milk: known ? !!known.milk : null,
      bright: null, body: null, heard: [], none: false, liked: "", change: "",
      usual: known && styleOf(known) ? { style: styleOf(known), label: D.people.styles[styleOf(known)] } : null, usualEdit: !known,
      name: "", city: "",
      issue: null, issueMethod: known ? known.method : null, issueText: ""
    });
    let s = fresh();

    const opt = (attr, val, label, on, hint) => `<button type="button" class="${P}opt" ${attr}="${esc(val)}" aria-pressed="${on}"><span>${esc(label)}</span>${hint ? `<span class="${P}opthint">${esc(hint)}</span>` : ""}</button>`;
    const methodGrid = (attr, cur) => ["espresso", "pot", "filter"].sort((a, b) => (b === s.preGroup) - (a === s.preGroup)).map((g) => `<div class="${P}mgroup"><span class="${P}mglabel">${esc(D.people.groups[g])}</span><div class="${P}opts ${P}opts-m">${Object.entries(M).filter(([, m]) => m.group === g).map(([id, m]) => opt(attr, id, m.label, cur === id, known && known.method === id ? "как в профиле" : "")).join("")}</div></div>`).join("");

    function screen() {
      switch (s.step) {
        case 1: return `<p class="${P}q">Как заваривали?</p><p class="${P}qhint">От способа кислотность меняется не меньше, чем от зерна, — поэтому начнём с него.</p>${methodGrid("data-method", s.method)}`;
        case 2: return `<p class="${P}q">С молоком?</p><div class="${P}opts ${P}opts-2">${opt("data-milk", "0", "Без молока", s.milk === false)}${opt("data-milk", "1", "С молоком", s.milk === true)}</div>`;
        case 3: case 4: {
          const key = s.step === 3 ? "bright" : "body";
          return `<p class="${P}q">${A[key].title}</p><p class="${P}qhint">Относительно того, что вы ждали${s.step === 3 ? " — по описанию и по тому, что пьёте обычно" : ""}.</p><div class="${P}opts ${P}opts-3">${["less", "ok", "more"].map((k) => opt(`data-${key}`, k, cap(A[key][k]), s[key] === k)).join("")}</div>`;
        }
        case 5: return `<p class="${P}q">Какие ноты узнали?</p><p class="${P}qhint">Из описания ${esc(coffee.name)}. Можно несколько или ни одной.</p>
          <div class="${P}toggles">${coffee.descriptors.map((d) => `<button type="button" class="${P}pill ${P}tog" data-heard="${esc(d)}" aria-pressed="${s.heard.includes(d)}"><i class="${P}dot" aria-hidden="true"></i>${esc(d)}</button>`).join("")}<button type="button" class="${P}pill ${P}tog ${P}tog-none" data-none="1" aria-pressed="${s.none}">Ни одной не узнал(а)</button></div>`;
        case 6: return `<p class="${P}q">Что скажете своими словами?</p><p class="${P}qhint">Необязательно — ответов выше уже достаточно.</p>
          <label class="${P}field" for="${uid}-liked"><span>Что понравилось</span><textarea id="${uid}-liked" data-text="liked" rows="3" maxlength="600">${esc(s.liked)}</textarea></label>
          <label class="${P}field" for="${uid}-change"><span>Что бы поменяли</span><textarea id="${uid}-change" data-text="change" rows="3" maxlength="600" placeholder="помол, рецепт, чего не хватило">${esc(s.change)}</textarea></label>`;
        case 7: {
          const saved = s.usual && !s.usualEdit
            ? `<div class="${P}saved"><span class="${P}k">Сохранено в профиле</span><span class="${P}savedval">Обычно пью ${s.usual.slug ? `<b>${esc(s.usual.label)}</b>` : esc(s.usual.label)}</span><button type="button" class="${P}textbtn" data-edit-usual="1">Изменить</button></div>`
            : `<p class="${P}qhint">Это ваша точка отсчёта: по ней другие поймут, похож ли ваш вкус на их. Спросим один раз — сохраним в профиле.</p>
              <div class="${P}opts ${P}opts-2">${Object.entries(D.people.styles).map(([id, l]) => opt("data-style", id, cap(l), s.usual && s.usual.style === id)).join("")}</div>
              <label class="${P}field" for="${uid}-usual"><span>или кофе QQ</span><select id="${uid}-usual" data-usual-slug="1"><option value="">—</option>${D.coffees.map((c) => `<option value="${esc(c.slug)}"${s.usual && s.usual.slug === c.slug ? " selected" : ""}>${esc(c.name)}</option>`).join("")}</select></label>`;
          return `<p class="${P}q">Обычно пью…</p>${saved}
            <div class="${P}pair"><label class="${P}field" for="${uid}-name"><span>Имя <i>необязательно</i></span><input id="${uid}-name" data-text="name" value="${esc(s.name)}" autocomplete="given-name"></label>
            <label class="${P}field" for="${uid}-city"><span>Город <i>необязательно</i></span><input id="${uid}-city" data-text="city" value="${esc(s.city)}" autocomplete="address-level2"></label></div>`;
        }
      }
      return "";
    }

    const ready = () => ({ 1: !!s.method, 2: s.milk !== null, 3: !!s.bright, 4: !!s.body, 5: true, 6: true, 7: true })[s.step];

    function summary() {
      const row = (k, v) => `<div class="${P}sumrow"><dt>${k}</dt><dd>${v}</dd></div>`;
      const heard = s.none ? "ни одной" : s.heard.length ? s.heard.map(esc).join(", ") : "не отмечены";
      return `<div class="${P}done"><p class="${P}q">Готово. Вот что уйдёт в QQ</p>
        <dl class="${P}sum">${row("Кофе", esc(coffee.name))}${row("Чашка", esc(`${M[s.method].label} · ${s.milk ? "с молоком" : "без молока"}`))}
        ${row(A.bright.title, esc(A.bright[s.bright]))}${row(A.body.title, esc(A.body[s.body]))}${row("Ноты", heard)}
        ${s.liked ? row("Что понравилось", esc(s.liked)) : ""}${s.change ? row("Что бы поменяли", esc(s.change)) : ""}
        ${row("Обычно пью (в профиль)", s.usual ? esc(s.usual.label) : "не указано")}${row("Подпись", esc([s.name || "без имени", s.city].filter(Boolean).join(", ")))}</dl>
        <p class="${P}qhint">На стенде ничего не отправляется. На сайте отзыв появится в группе «${esc(D.people.groups[s.milk ? "milk" : t.groupOf(s.method)])}», а ответы войдут в счёт.</p>
        <p class="${P}navrow"><button type="button" class="${P}ghost" data-to="1">Изменить ответы</button><button type="button" class="${P}ghost" data-reset="1">Написать ещё один</button></p></div>`;
    }

    function issueScreen() {
      if (s.sent) return `<div class="${P}done"><p class="${P}q">Отправлено в QQ</p><dl class="${P}sum">
        <div class="${P}sumrow"><dt>Что</dt><dd>${esc(ISSUE[s.issue])}</dd></div><div class="${P}sumrow"><dt>Как заваривали</dt><dd>${esc(s.issueMethod ? M[s.issueMethod].label : "не указано")}</dd></div>
        <div class="${P}sumrow"><dt>Текст</dt><dd>${esc(s.issueText || "—")}</dd></div></dl>
        <p class="${P}qhint">В счёт вкуса это не входит. QQ ответит под сообщением на странице и предложит замену, если дело в помоле. На стенде ничего не отправляется.</p>
        <p class="${P}navrow"><button type="button" class="${P}ghost" data-back-review="1">← К отзыву о вкусе</button></p></div>`;
      return `<p class="${P}q">Не про вкус</p><p class="${P}qhint">Это не войдёт в счёт вкуса — QQ ответит отдельно.</p>
        <div class="${P}opts ${P}opts-2">${Object.entries(ISSUE).map(([k, l]) => opt("data-issuekind", k, l, s.issue === k, k === "grind" ? "забивается, течёт водой" : "не те ноты, другая кислотность")).join("")}</div>
        <span class="${P}mglabel ${P}mglabel-top">Как заваривали</span>
        <div class="${P}opts ${P}opts-m ${P}opts-compact">${Object.entries(M).map(([id, m]) => opt("data-issuemethod", id, m.label, s.issueMethod === id)).join("")}</div>
        <label class="${P}field" for="${uid}-issue"><span>Что случилось</span><textarea id="${uid}-issue" data-text="issueText" rows="3" maxlength="600">${esc(s.issueText)}</textarea></label>
        <p class="${P}navrow"><button type="button" class="${P}ghost" data-back-review="1">← К отзыву о вкусе</button><button type="button" class="${P}primary" data-send-issue="1"${s.issue ? "" : " disabled"}>Отправить в QQ</button></p>`;
    }

    function draw(focus) {
      let inner;
      if (s.mode === "issue") inner = issueScreen();
      else if (s.step > 7) inner = summary();
      else {
        const prog = STEPS.map((l, i) => `<li class="${P}seg-p${i + 1 < s.step ? ` ${P}is-past` : i + 1 === s.step ? ` ${P}is-now` : ""}"><span class="${P}vh">${i + 1}. ${esc(l)}</span></li>`).join("");
        const nextLabel = s.step === 7 ? "Отправить" : s.step === 6 && !(s.liked || s.change) ? "Пропустить" : "Дальше";
        inner = `<div class="${P}progress"><p class="${P}progline"><span>Шаг ${s.step} из 7 · ${esc(STEPS[s.step - 1])}</span>${s.step > 1 ? `<button type="button" class="${P}textbtn" data-back="1">← Назад</button>` : ""}</p><ol class="${P}bar" aria-hidden="true">${prog}</ol></div>
          <div class="${P}screen">${screen()}</div>
          <p class="${P}navrow">${s.step <= 4 && !ready() ? `<span class="${P}navnote">Нажмите на ответ — перейдём дальше</span>` : `<button type="button" class="${P}primary" data-next="1">${nextLabel}</button>`}</p>`;
      }
      root.innerHTML = `<div class="f-method f-method-write">
        <header class="${P}whead"><h3 class="${P}wh">Отзыв · ${esc(coffee.name)}</h3>${s.mode === "review" && s.step <= 7 ? `<button type="button" class="${P}issuelink" data-issue="1">Не про вкус: помол не подошёл / не как в описании</button>` : ""}</header>
        ${s.mode === "review" && s.step === 1 ? `<p class="${P}after">Лучше после трёх-четырёх чашек: к этому времени помол и рецепт уже подобраны.</p>` : ""}
        <div class="${P}card">${inner}</div></div>`;
      bind();
      if (focus) { const f = root.querySelector(`.${P}q`); if (f) { f.tabIndex = -1; f.focus({ preventScroll: true }); } }
    }

    const go = (n) => { s.step = n; draw(true); };
    let timer = 0;
    const pickAndGo = () => { clearTimeout(timer); draw(); timer = setTimeout(() => { if (ready()) go(s.step + 1); }, 260); };

    function bind() {
      const on = (sel, fn) => root.querySelectorAll(sel).forEach((b) => (b.onclick = () => fn(b)));
      on("[data-method]", (b) => { s.method = b.dataset.method; pickAndGo(); });
      on("[data-milk]", (b) => { s.milk = b.dataset.milk === "1"; pickAndGo(); });
      on("[data-bright]", (b) => { s.bright = b.dataset.bright; pickAndGo(); });
      on("[data-body]", (b) => { s.body = b.dataset.body; pickAndGo(); });
      on("[data-heard]", (b) => { const d = b.dataset.heard; s.none = false; s.heard = s.heard.includes(d) ? s.heard.filter((x) => x !== d) : [...s.heard, d]; draw(); });
      on("[data-none]", () => { s.none = !s.none; if (s.none) s.heard = []; draw(); });
      on("[data-style]", (b) => { s.usual = { style: b.dataset.style, label: D.people.styles[b.dataset.style] }; draw(); });
      on("[data-edit-usual]", () => { s.usualEdit = true; draw(); });
      on("[data-next]", () => { if (ready()) go(s.step + 1); });
      on("[data-back]", () => go(s.step - 1));
      on("[data-to]", (b) => go(+b.dataset.to));
      on("[data-reset]", () => { s = fresh(); draw(true); });
      on("[data-issue]", () => { s.mode = "issue"; s.sent = false; if (!s.issueMethod) s.issueMethod = s.method; draw(true); });
      on("[data-back-review]", () => { s.mode = "review"; draw(true); });
      on("[data-issuekind]", (b) => { s.issue = b.dataset.issuekind; draw(); });
      on("[data-issuemethod]", (b) => { s.issueMethod = b.dataset.issuemethod; draw(); });
      on("[data-send-issue]", () => { if (s.issue) { s.sent = true; draw(true); } });
      root.querySelectorAll("[data-text]").forEach((el) => (el.oninput = () => {
        s[el.dataset.text] = el.value;
        const nb = root.querySelector("[data-next]");
        if (nb && s.step === 6) nb.textContent = s.liked || s.change ? "Дальше" : "Пропустить";
      }));
      const sel = root.querySelector("[data-usual-slug]");
      if (sel) sel.onchange = () => { const c = ctx.kit.coffee[sel.value]; s.usual = c ? { slug: c.slug, label: c.name } : null; draw(); };
    }

    // opened from the block: «Написать отзыв», a way from the invitation, or «не про вкус»
    root.__fMethodOpen = (o) => {
      if (o.issue) { s.mode = "issue"; s.sent = false; if (!s.issueMethod) s.issueMethod = s.method; }
      else {
        s.mode = "review";
        if (s.step > 7) s = fresh();
        if (o.group === "milk") { s.milk = true; }
        else if (o.group && t.groupOf(s.method) !== o.group) { s.method = null; }
        s.step = 1;
        s.preGroup = o.group && o.group !== "milk" ? o.group : null;
      }
      draw(true);
    };
    draw();
  }

  window.QQBench.register({
    id: "method",
    name: "Как вы пьёте",
    idea: "Блок сначала задаёт один вопрос — как вы пьёте кофе — и дальше говорит только о тех, кто заваривает так же: счёт словами, их ноты, их отзывы; амбассадоры с тем же способом — первыми, на тёмной полосе «Советуют».",
    notes: "Стоит одного нажатия до сути (если вкус посетителя неизвестен — открыто «Все» со счётом по способам). Отзывы других способов свёрнуты, их легко не заметить. При 1–2 отзывах вопрос не задаётся: делить нечего. Точки нот — нейтральные: в данных стенда нет семейства у дескриптора.",
    top, render, write
  });
})();
