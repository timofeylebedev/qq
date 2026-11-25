// 5. A mini taste map (acidity × body, the catalogue's tall map: choose.json map.tall): the coffee's dot among the other
// 24, the axes' far end words with an arrow («ярче →» under it, «плотнее →» up its left side: both ends of a turned axis did not fit its 80px), and its place in words beside it. Two axes, the map's; how unusual is a word
// beside the map only where the coffee is (ferment 1 or more: 7 of 25), as a third axis would need a third dimension.
(() => {
  const VW = 110, VH = 100, PAD = 7;
  QQBench.register({
    id: "map",
    render(c, ctx) {
      const xy = (o) => [PAD + o.tall.u * (VW - 2 * PAD), PAD + o.tall.v * (VH - 2 * PAD)];
      const others = ctx.coffees.filter((o) => o.slug !== c.slug).map((o) => { const [x, y] = xy(o); return `<circle class="smap__o" data-part="other" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.6"/>`; }).join("");
      const [x, y] = xy(c);
      const odd = ctx.third(ctx.axes.ferment.value(c), ctx.axes.ferment.range) > 0;
      const say = `На карте вкуса QQ: ${ctx.sr(c, odd ? ["acidity", "density", "ferment"] : ["acidity", "density"])}`;
      return ctx.srp(say) + `<div class="smap" aria-hidden="true">
        <span class="smap__y scale__lbl">${ctx.ends.body[1]} →</span>
        <svg class="smap__plot" viewBox="0 0 ${VW} ${VH}" width="88" height="80" focusable="false">
          <rect class="smap__frame" x="0.5" y="0.5" width="${VW - 1}" height="${VH - 1}"/>
          ${others}
          <circle class="smap__me" data-part="dot" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6"/>
        </svg>
        <span class="smap__x scale__lbl">${ctx.ends.bright[1]} →</span>
        <span class="smap__words"><span>Кислотность ${ctx.word(c, "acidity")}</span><span>Плотность ${ctx.word(c, "density")}</span>${odd ? `<span>Вкус ${ctx.word(c, "ferment")}</span>` : ""}</span>
      </div>`;
    }
  });
})();
