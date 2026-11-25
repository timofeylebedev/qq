// 2. A dot on a short line between the taste model's end words («мягче · ярче»): the line spans QQ's own range, from
// its softest coffee to its brightest, so the dot says where this coffee stands among the 25. Three axes: here how
// unusual needs no special case, because «классичнее» is an end word: the 17 coffees without ferment sit at that end,
// which reads as «classic», not as «nothing».
(() => {
  const ids = ["acidity", "density", "ferment"];
  QQBench.register({
    id: "line",
    render(c, ctx) {
      return ctx.srp(ctx.sr(c, ids)) + `<div class="sl" aria-hidden="true">${ids.map((id) => {
        const a = ctx.axes[id], t = ctx.share(a.pos(c), a.prange);
        return `<span class="scale__lbl sl__a">${a.ends[0]}</span><span class="sl__track" data-part="line"><i class="sl__dot" data-part="dot" style="--t: ${t.toFixed(3)}"></i></span><span class="scale__lbl sl__b">${a.ends[1]}</span>`;
      }).join("")}</div>`;
    }
  });
})();
