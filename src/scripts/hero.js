// The hero's entrance when the page opens (Tim, round 6): the dock rises into place slowly (--t-intro), and inside it
// each cell arrives part by part: the title line by line (GSAP SplitText: the lines are the ones the browser set,
// at any width; once in place the title is whole text again), the countdown row by row (the day and the time, the digits, the caption), the links one by one.
// Each part rises a little from below its own line and clears in; the next starts when the one before is about a
// third of the way, so the cell reads as one movement. The digits are unlit while they rise and light up as the
// clock starts (scripts/roast.js), like a display switching on.
//
// The page hides the parts from its first frame (an inline script in <head> sets html[data-intro] before anything
// is drawn), so nothing shows and then jumps; this script takes over from there. With «reduce motion» there is no
// entrance and nothing is hidden. If this script never runs, a CSS fallback shows the hero after a moment.
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { CustomEase } from "gsap/CustomEase";

gsap.registerPlugin(SplitText, CustomEase);

export async function initHero() {
  const root = document.documentElement;
  const hero = document.querySelector("[data-hero]");
  if (!hero || !root.hasAttribute("data-intro")) return;
  const info = hero.querySelector(".hero__info"), title = hero.querySelector("[data-hero-title]");
  const roastParts = [...hero.querySelectorAll(".hero__roast > [data-hero-part]")];
  const linkParts = [...hero.querySelectorAll(".hero__links > [data-hero-part]")];

  // the system's own times and curve (motion.css): --ease-out for everything arriving
  const css = getComputedStyle(root);
  const sec = (v, d) => { const n = parseFloat(v); return Number.isFinite(n) ? (/ms$/.test(v.trim()) ? n / 1000 : n) : d; };
  const T = sec(css.getPropertyValue("--t-intro"), 1.4), PART = sec(css.getPropertyValue("--t-rise"), 0.9);
  const ease = CustomEase.create("qq-out", "0.16, 1, 0.3, 1");
  const lift = parseFloat(getComputedStyle(info).getPropertyValue("--section-gap")) || 48;

  // the title's lines are only known once its font is in
  await document.fonts.ready.catch(() => {});
  const split = SplitText.create(title, { type: "lines", linesClass: "hero__line" });

  // the block that rises: from L the whole row of cells (the title is one of them); below L only the dock at the
  // photo's foot, the title standing at the top of the section
  const dock = hero.querySelector(".hero__dock");
  const wide = info.querySelector(".col").getBoundingClientRect().width >= 58 * parseFloat(css.fontSize);
  const block = wide ? info : dock;

  const tl = gsap.timeline({ defaults: { ease } });
  tl.from(block, { y: lift, opacity: 0, duration: T }, 0.15)
    .from(split.lines, { y: 24, opacity: 0, duration: PART, stagger: PART / 3 }, 0.45)
    .from(roastParts, { y: 16, opacity: 0, duration: PART, stagger: PART / 3 }, 0.6)
    .from(linkParts, { y: 16, opacity: 0, duration: PART, stagger: PART / 3 }, 0.7);
  // every part now stands at its starting point: the page may show the hero
  root.removeAttribute("data-intro");

  // a click or a key anywhere ends the entrance at once (nobody waits for it)
  const skip = () => { tl.progress(1); off(); };
  const off = () => ["pointerdown", "keydown", "wheel", "touchstart"].forEach((e) => removeEventListener(e, skip, true));
  ["pointerdown", "keydown", "wheel", "touchstart"].forEach((e) => addEventListener(e, skip, { capture: true, passive: true, once: true }));
  tl.eventCallback("onComplete", () => { split.revert(); gsap.set([block, ...roastParts, ...linkParts], { clearProps: "transform,opacity" }); off(); });
  window.qqHero = tl;   // the timeline, for review (pause, seek) in the console
}
