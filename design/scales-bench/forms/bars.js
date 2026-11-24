// 1. Segmented bars: five cells per axis, filled up to the coffee's value on the table's 1–5 scale (4,5 fills half a
// cell). Two axes, acidity and body; how unusual is left out: a bar of ferment 0 is empty on 17 of 25 cards and reads
// as «no data», not as «classic».
(() => {
  const W = 18, G = 2, H = 8, LOW = 2;
  // a filled cell is the full height in ink; an empty one is a low bar in ink-60 (both ≥ 3:1 on paper), so the five
  // cells stay countable without an outline
  const cells = (v) => `<svg class="sb__cells" viewBox="0 0 ${5 * W + 4 * G} ${H}" width="${5 * W + 4 * G}" height="${H}" aria-hidden="true" focusable="false">${[0, 1, 2, 3, 4].map((j) => {
    const x = j * (W + G), on = Math.max(0, Math.min(1, v - j)) * W;
    return (on > 0 ? `<rect class="sb__on" data-part="on" x="${x}" y="0" width="${on}" height="${H}"/>` : "") +
      (on < W ? `<rect class="sb__off" data-part="off" x="${x + on}" y="${H - LOW}" width="${W - on}" height="${LOW}"/>` : "");
  }).join("")}</svg>`;
  QQBench.register({
    id: "bars",
    render(c, ctx) {
      const ids = ["acidity", "density"];
      return ctx.srp(ctx.sr(c, ids)) + `<div class="sb" aria-hidden="true">${ids.map((id) => `<span class="scale__lbl">${ctx.axes[id].label}</span>${cells(ctx.axes[id].value(c))}`).join("")}</div>`;
    }
  });
})();
