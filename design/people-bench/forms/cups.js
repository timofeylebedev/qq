// «Чашки»: a ledger. Named picks first, on the ink ground, apart; then the customers: two bars of answers against
// expectation (Zappos' fit bar), the notes heard as counts, a filter by how people brew (it filters the bars too), and
// the reviews, each led by its cup (method, milk, what the person usually drinks). Write: the questions are anchored to
// what QQ says of the coffee («QQ: кислотность 3 из 5 — вам показалось…»).
(() => {
  const K = window.QQKit, { esc, plural, date, cup, near, shared, placeholder } = K;
  const A = K.D.people.answers, M = K.D.people.methods, G = K.D.people.groups;
  const P = "f-cups-";
  const n = (k, one, few, many) => `${k} ${plural(k, one, few, many)}`;
  const tally = (list, axis) => ({ less: list.filter((r) => r.answers[axis] === "less").length, ok: list.filter((r) => r.answers[axis] === "ok").length, more: list.filter((r) => r.answers[axis] === "more").length });
  const inGroup = (r, g) => g === "all" || (g === "milk" ? r.milk : M[r.method].group === g);

  function bar(axis, t, total) {
    const parts = ["less", "ok", "more"].map((k) => [k, t[k]]);
    const words = parts.filter(([, v]) => v).map(([k, v]) => `${v} — ${A[axis][k]}`).join(", ");
    return `<div class="${P}bar">
      <p class="${P}bar__title">${A[axis].title}</p>
      <div class="${P}bar__track" aria-hidden="true">${parts.map(([k, v]) => `<span class="${P}bar__seg ${P}bar__seg--${k}" style="flex-grow:${v}"></span>`).join("")}</div>
      <div class="${P}bar__ends" aria-hidden="true"><span>${A[axis].less}</span><span>${A[axis].ok}</span><span>${A[axis].more}</span></div>
      <p class="${P}bar__words">${words || "—"}</p>
    </div>`;
  }

  function named(ctx) {
    const picks = ctx.page.picks;
    if (!picks.length) return "";
    return `<div class="${P}named" data-tone="ink">
      <p class="${P}label">Советуют</p>
      <ul class="${P}named__list">${picks.map((x) => {
        const p = K.person[x.who];
        const close = ctx.visitor?.region && p.pos ? near(ctx.visitor.region.center, p.pos) : null;
        return `<li class="${P}pick">
          <p class="${P}pick__who"><b>${esc(p.name)}</b> · ${esc(p.kind === "team" ? "Команда QQ" : p.status)}${p.placeholder ? ` <span class="${P}ex">пример</span>` : ""}</p>
          <p class="${P}pick__why">${esc(x.why)}</p>
          ${p.kind === "team" ? "" : `<p class="${P}pick__how">${esc(p.how)}${x.recipe ? ` · ${esc(x.recipe)}` : ""}</p>
          <p class="${P}pick__likes">Обычно любит ${esc(p.likes)}${p.not ? `; не берёт ${esc(K.coffee[p.not.slug].name)}` : ""}${close ? ` · вкус ${close === "далеко" ? "далёк от вашего" : close === "близко" ? "близок к вашему" : "отчасти как ваш"}` : ""}</p>`}
        </li>`;
      }).join("")}</ul>
      ${picks.some((x) => K.person[x.who].kind === "ambassador") ? `<p class="${P}named__note">Амбассадоры — люди, которых QQ просит советовать кофе. Как они связаны с QQ, сказано у каждого.</p>` : ""}
    </div>`;
  }

  function review(r, ctx) {
    const p = K.person[r.who];
    const mine = ctx.visitor?.region && near(ctx.visitor.region.center, p.pos) === "близко";
    return `<li class="${P}rev${mine ? ` ${P}rev--mine` : ""}">
      <p class="${P}rev__cup">${esc(M[r.method].label)}${r.milk ? " · с молоком" : ""}${mine ? `<span class="${P}rev__mine">вкус как ваш</span>` : ""}</p>
      <p class="${P}rev__usual">Обычно пьёт ${esc(p.usual.label)} <span>(${esc(p.likes)})</span></p>
      <p class="${P}rev__ans"><span>Кислотность: <b>${A.bright[r.answers.bright]}</b></span><span>Плотность: <b>${A.body[r.answers.body]}</b></span></p>
      ${r.heard.length ? `<p class="${P}rev__heard">${K.ending(p, "Узнал")}: ${r.heard.map((d) => d.toLowerCase()).join(", ")}</p>` : ""}
      ${r.text ? `<p class="${P}rev__text">${esc(r.text)}</p>` : ""}
      <p class="${P}rev__sign">${esc(p.name)}, ${esc(p.city)} · ${date(r.date)}${r.verified ? ` · ${K.ending(p, "купил")} у QQ` : ""} · после ${n(r.cups, "чашки", "чашек", "чашек")}</p>
    </li>`;
  }

  function customers(ctx, root) {
    const pg = ctx.page;
    const box = document.createElement("div");
    box.className = P + "cust";
    root.append(box);
    if (!pg.count) {
      box.innerHTML = `<p class="${P}label">Покупатели</p><div class="${P}empty"><p>Отзывов пока нет. Пили этот кофе? Расскажите, как заваривали и куда он ушёл от ожидания — это поможет следующему.</p><button type="button" class="${P}btn">Написать отзыв</button></div>`;
      return;
    }
    let g = ctx.visitor?.milk ? "milk" : ctx.visitor?.method ? M[ctx.visitor.method].group : "all";
    if (!pg.groups.some((x) => x.id === g)) g = "all";
    const draw = () => {
      const list = pg.reviews.filter((r) => inGroup(r, g));
      const sorted = ctx.visitor?.region ? [...list].sort((a, b) => K.gap(ctx.visitor.region.center, K.person[a.who].pos) - K.gap(ctx.visitor.region.center, K.person[b.who].pos)) : list;
      const heard = ctx.coffee.descriptors.map((d) => [d, list.filter((r) => r.heard.includes(d)).length]);
      box.innerHTML = `<div class="${P}cust__head"><p class="${P}label">Покупатели · ${n(pg.count, "отзыв", "отзыва", "отзывов")}</p><button type="button" class="${P}btn ${P}btn--line">Написать отзыв</button></div>
        ${pg.count > 1 ? `<div class="${P}chips" role="group" aria-label="Как заваривали">${[["all", "Все", pg.count], ...pg.groups.map((x) => [x.id, x.id === "pot" ? "Турка и гейзер" : x.id === "espresso" ? "Эспрессо" : x.label, x.n])].map(([id, t, k]) => `<button type="button" class="${P}chip" aria-pressed="${id === g}" data-g="${id}">${esc(t)} <span>${k}</span></button>`).join("")}</div>` : ""}
        ${list.length > 1 ? `<div class="${P}sum">${bar("bright", tally(list, "bright"), list.length)}${bar("body", tally(list, "body"), list.length)}
          <div class="${P}heard"><p class="${P}bar__title">Какие ноты узнали</p><ul>${heard.map(([d, k]) => `<li><span>${esc(d)}</span><b>${k} из ${list.length}</b></li>`).join("")}</ul></div></div>` : ""}
        <ul class="${P}revs">${sorted.map((r) => review(r, ctx)).join("")}</ul>
        ${pg.issues.length ? `<div class="${P}issues"><p class="${P}bar__title">Не про вкус</p>${pg.issues.map((x) => `<p class="${P}issue"><b>${x.issue === "grind" ? "Помол не подошёл" : "Не как в описании"}</b> — ${esc(x.text)} <span>${esc(K.person[x.who].name)}, ${M[x.method].label.toLowerCase()}</span></p><p class="${P}reply">${esc(x.reply)}</p>`).join("")}</div>` : ""}`;
      box.querySelectorAll("[data-g]").forEach((b) => (b.onclick = () => { g = b.dataset.g; draw(); }));
    };
    draw();
  }

  QQBench.register({
    id: "cups", name: "Чашки",
    idea: "Журнал чашек. Сначала — кто советует (на тёмном, отдельно); потом покупатели: две шкалы ответов относительно ожидания (как «маломерит / в размер» у обуви), ноты со счётом и отзывы, каждый начинается с чашки: как заварили и что человек обычно пьёт. Фильтр по способу меняет и шкалы.",
    notes: "Цена: самая длинная форма; шкалы честны только от 2–3 отзывов (до этого их нет). Похожесть на посетителя — пометкой «вкус как ваш», без процентов.",
    top(root, ctx) {
      const pg = ctx.page, bits = [];
      if (pg.count) bits.push(n(pg.count, "отзыв", "отзыва", "отзывов"));
      for (const x of pg.picks) { const p = K.person[x.who]; bits.push(p.kind === "team" ? `выбор ${p.name === "Ксюша" ? "Ксюши" : p.name}` : `советует ${p.name.split(" ")[0]}`); }
      root.innerHTML = `<a class="${P}top" href="#people">${bits.length ? esc(bits.join(" · ")) : "Отзывов пока нет — написать первый"}</a>`;
    },
    render(root, ctx) {
      root.innerHTML = `<div class="${P}head"><h2 class="${P}title">Кто пил</h2>${placeholder()}</div>${named(ctx)}`;
      customers(ctx, root);
    },
    write(root, ctx) {
      const c = ctx.coffee, u = ctx.uid, v = ctx.visitor;
      const code = { bright: c.coded.acidity, body: c.coded.density };
      const three = (axis) => `<fieldset class="${P}q"><legend>${A[axis].title}: QQ пишет ${String(code[axis]).replace(".", ",")} из 5. Вам показалось…</legend><div class="${P}seg">${["less", "ok", "more"].map((k) => `<label><input type="radio" name="${u}-${axis}" value="${k}" required><span>${A[axis][k]}</span></label>`).join("")}</div></fieldset>`;
      const usual = v?.region ? v.label : null;
      root.innerHTML = `<form class="${P}write" novalidate>
        <p class="${P}write__title">Ваш отзыв о ${esc(c.name)}</p>
        <fieldset class="${P}q"><legend>Как заваривали</legend><div class="${P}opts">${Object.entries(M).map(([id, m]) => `<label><input type="radio" name="${u}-m" value="${id}"${v?.method === id ? " checked" : ""} required><span>${esc(m.label)}</span></label>`).join("")}<label><input type="checkbox" name="${u}-milk"${v?.milk ? " checked" : ""}><span>с молоком</span></label></div></fieldset>
        ${three("bright")}${three("body")}
        <fieldset class="${P}q"><legend>Какие ноты узнали <span>(QQ пишет эти)</span></legend><div class="${P}opts">${c.descriptors.map((d) => `<label><input type="checkbox" name="${u}-h" value="${esc(d)}"><span>${esc(d)}</span></label>`).join("")}</div></fieldset>
        <label class="${P}q"><span class="${P}legend">Пара слов <span>(не обязательно)</span></span><textarea rows="3" name="${u}-t" placeholder="Что понравилось, что бы поменяли"></textarea></label>
        <p class="${P}usual">${usual ? `Обычно пьёте: <b>${esc(usual)}</b> <button type="button">изменить</button>` : `Что вы обычно пьёте? <button type="button">выбрать</button> <span>— один раз, сохранится в профиле</span>`}</p>
        <div class="${P}write__foot"><button type="submit" class="${P}btn">Отправить</button><button type="button" class="${P}link">Не про вкус: помол не подошёл / не как в описании</button></div>
        <output class="${P}sent"></output>
      </form>`;
      const f = root.querySelector("form");
      f.onsubmit = (e) => {
        e.preventDefault();
        const val = (name) => f.querySelector(`[name="${u}-${name}"]:checked`)?.value;
        const miss = [!val("m") && "способ", !val("bright") && "кислотность", !val("body") && "плотность"].filter(Boolean);
        f.querySelector("output").innerHTML = miss.length ? `Осталось ответить: ${miss.join(", ")}.` : `Ушло бы: ${esc(M[val("m")].label)}${f.querySelector(`[name="${u}-milk"]`).checked ? ", с молоком" : ""}; кислотность — ${A.bright[val("bright")]}, плотность — ${A.body[val("body")]}; ноты: ${[...f.querySelectorAll(`[name="${u}-h"]:checked`)].map((x) => x.value).join(", ") || "—"}. Появится после проверки покупки.`;
      };
    }
  });
})();
