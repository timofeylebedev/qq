// The hero's entrance when the page opens (Tim, round 6): the dock rises into place slowly, and inside it each cell
// arrives part by part: the title line by line (GSAP SplitText: the lines are the ones the browser set, at any width;
// once in place the title is whole text again), the countdown row by row (the day and the time, the digits, the
// caption), the links one by one. Each part rises a little from below its own line and clears in; the next starts a
// moment later, so the cell reads as one movement. The digits are unlit while they rise and light up as the clock
// starts (scripts/roast.js), like a display switching on.
//
// Every number of it (when each group starts, how long a part takes, how far it rises, how much later the next part
// starts, the curve) is in design/intro.json, tuned in design/intro-tuner/ (Tim, round 7). window.qqIntro.play(settings)
// plays it again with other values (the tuner uses it); window.qqHero is the timeline, for review in the console.
//
// The moving parts are on their own layers from the first frame to the last (force3D, will-change) and are handed back
// to the page once, when everything has stopped: a part that left its layer as it landed was drawn again a little
// differently, and the end of the entrance looked like a stutter (Tim, round 7).
//
// The page hides the parts from its first frame (an inline script in <head> sets html[data-intro] before anything
// is drawn), so nothing shows and then jumps; this script takes over from there. With «reduce motion» there is no
// entrance and nothing is hidden. If this script never runs, a CSS fallback shows the hero after a moment.
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { CustomEase } from "gsap/CustomEase";
import INTRO from "../../design/intro.json";

gsap.registerPlugin(SplitText, CustomEase);

export async function initHero() {
  const root = document.documentElement;
  const hero = document.querySelector("[data-hero]");
  if (!hero || !root.hasAttribute("data-intro")) return;
  const info = hero.querySelector(".hero__info"), title = hero.querySelector("[data-hero-title]");
  const roastParts = [...hero.querySelectorAll(".hero__roast > [data-hero-part]")];
  const linkParts = [...hero.querySelectorAll(".hero__links > [data-hero-part]")];
  const dock = hero.querySelector(".hero__dock");

  // the title's lines are only known once its font is in
  await document.fonts.ready.catch(() => {});

  let tl = null, split = null, n = 0;
  const off = () => ["pointerdown", "keydown", "wheel", "touchstart"].forEach((e) => removeEventListener(e, skip, true));
  const skip = () => { tl?.progress(1); off(); };

  function play(cfg = INTRO) {
    tl?.kill(); split?.revert(); off();
    // the block that rises: from L the whole row of cells (the title is one of them); below L only the dock at the
    // photo's foot, the title standing at the top of the section
    const css = getComputedStyle(root);
    const wide = info.querySelector(".col").getBoundingClientRect().width >= 58 * parseFloat(css.fontSize);
    const block = wide ? info : dock;
    split = SplitText.create(title, { type: "lines", linesClass: "hero__line" });
    const ease = (c) => CustomEase.create(`qq-intro-${++n}`, c.join(", "));
    const parts = [block, ...split.lines, ...roastParts, ...linkParts];
    gsap.set(parts, { willChange: "transform, opacity", force3D: true });
    hero.dataset.entering = "";
    const from = (g) => ({ y: g.lift, opacity: 0, duration: g.duration, stagger: g.stagger || 0, ease: ease(g.curve), force3D: true });
    tl = gsap.timeline()
      .from(block, from(cfg.block), cfg.block.at)
      .from(split.lines, from(cfg.title), cfg.title.at)
      .from(roastParts, from(cfg.roast), cfg.roast.at)
      .from(linkParts, from(cfg.links), cfg.links.at);
    // a click or a key anywhere ends the entrance at once (nobody waits for it)
    ["pointerdown", "keydown", "wheel", "touchstart"].forEach((e) => addEventListener(e, skip, { capture: true, passive: true, once: true }));
    tl.eventCallback("onComplete", () => {
      split.revert(); split = null;
      gsap.set(parts.filter((p) => p.isConnected), { clearProps: "transform,opacity,willChange" });
      delete hero.dataset.entering; off();
    });
    window.qqHero = tl;
    return tl;
  }

  play();
  // every part now stands at its starting point: the page may show the hero
  root.removeAttribute("data-intro");
  window.qqIntro = { settings: INTRO, play };
}
