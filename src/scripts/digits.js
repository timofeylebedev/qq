// QQ Digits, the program: lights the segments of a countdown drawn by build/digits.mjs. Each digit cell has its seven
// segments (data-s a…g); data-lit on the <svg> lists the segments each digit 0–9 lights. A segment that changes fades
// on or off (motion.css --t-seg-on / --t-seg-off, digits.json); the colons are lit once the clock runs.
export function setDigits(svg, text) {
  const lit = svg.dataset.lit.split(" ");
  const cells = svg.querySelectorAll("[data-cell]");
  let i = 0;
  for (const ch of text) {
    if (ch === ":") continue;
    const cell = cells[i++];
    if (!cell) break;
    const on = lit[+ch] || "";
    for (const seg of cell.children) seg.classList.toggle("on", on.includes(seg.dataset.s));
  }
  for (const c of svg.querySelectorAll("[data-colon]")) c.classList.add("on");
}
