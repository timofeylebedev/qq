// 3. The coffee page's taste chart, small: one row of five dots per axis on the table's own scales, the chosen dots
// joined, as on the page (components.mjs tasteChart), without sweetness. Three rows in the page's order: Плотность,
// Кислотность, Фермент. Ferment 0 is the first dot, as the page already draws it, so it reads as a value, not a gap.
(() => {
  const ROWS = [["density", "Плотность", 1], ["acidity", "Кислотность", 1], ["ferment", "Фермент", 0]];
  const STEP = 12, ROW = 17, R = 3.5, r = 1.25;
  QQBench.register({
    id: "dots",
    render(c, ctx) {
      const pts = ROWS.map(([k, , from], i) => [R + (c.coded[k] - from) * STEP, ROW / 2 + i * ROW]);
      const W = R * 2 + 4 * STEP, H = ROWS.length * ROW;
      const grid = ROWS.map((_, i) => [0, 1, 2, 3, 4].map((j) => `<circle data-part="grid" cx="${R + j * STEP}" cy="${ROW / 2 + i * ROW}" r="${r}"/>`).join("")).join("");
      return ctx.srp(ctx.sr(c, ["density", "acidity", "ferment"])) + `<div class="sd" aria-hidden="true">
        <span class="sd__labels">${ROWS.map(([, l]) => `<span class="scale__lbl">${l}</span>`).join("")}</span>
        <svg class="sd__plot" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" focusable="false">
          <g class="sd__grid">${grid}</g>
          <polyline class="sd__line" data-part="joint" points="${pts.map((p) => p.join(",")).join(" ")}"/>
          ${pts.map(([x, y]) => `<circle class="sd__dot" data-part="dot" cx="${x}" cy="${y}" r="${R}"/>`).join("")}
        </svg></div>`;
    }
  });
})();
