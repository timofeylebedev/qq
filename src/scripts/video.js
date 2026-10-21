// The heroes' video (heroVideo() in src/templates/util.mjs): it plays, muted and looped, only while it is on screen,
// and not at all with «reduce motion» or Save-Data: then the poster, its first frame, stays. Nothing is fetched
// until it plays (preload="none").
export function initVideo() {
  const calm = matchMedia("(prefers-reduced-motion: reduce)");
  const saveData = navigator.connection?.saveData;
  for (const video of document.querySelectorAll("[data-hero-video]")) {
    let seen = false;
    const update = () => {
      if (seen && !calm.matches && !saveData) video.play().catch(() => {});   // a refused autoplay keeps the poster
      else video.pause();
    };
    new IntersectionObserver(([e]) => { seen = e.isIntersecting; update(); }).observe(video);
    calm.addEventListener("change", update);
  }
}
