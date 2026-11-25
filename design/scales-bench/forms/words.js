// 4. Words by thirds of QQ's range: «Кислотность — мягкая / средняя / яркая», «Плотность — лёгкая / средняя / высокая»,
// «Вкус — классический / чуть необычный / необычный», each with a tiny mark of three cells, the coffee's third filled.
// Three rows: «классический» is a real word for the 18 coffees with ferment under 1, so the row is never empty.
(() => {
  const ids = ["acidity", "density", "ferment"];
  const W = 8, G = 2, H = 6, LOW = 2;
  const mark = (k) => `<svg class="sw__mark" viewBox="0 0 ${3 * W + 2 * G} ${H}" width="${3 * W + 2 * G}" height="${H}" focusable="false">${[0, 1, 2].map((j) =>
    j === k ? `<rect class="sw__on" data-part="on" x="${j * (W + G)}" y="0" width="${W}" height="${H}"/>` : `<rect class="sw__off" data-part="off" x="${j * (W + G)}" y="${H - LOW}" width="${W}" height="${LOW}"/>`).join("")}</svg>`;
  QQBench.register({
    id: "words",
    render(c, ctx) {
      return ctx.srp(ctx.sr(c, ids)) + `<div class="sw" aria-hidden="true">${ids.map((id) => {
        const a = ctx.axes[id];
        return `<span class="scale__lbl">${a.label}</span>${mark(ctx.third(a.value(c), a.range))}<span class="sw__w">${ctx.word(c, id)}</span>`;
      }).join("")}</div>`;
    }
  });
})();
