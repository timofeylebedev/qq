// The stage of a coffee's page: keeps --buybar-h equal to the buy bar's real height, so the pinned pack fits between
// the navbar and the bar at every size.
export function initStage() {
  const bar = document.querySelector("[data-buybar]");
  if (!bar) return;
  const measureBar = () => document.documentElement.style.setProperty("--buybar-h", bar.offsetHeight + "px");
  measureBar();
  new ResizeObserver(measureBar).observe(bar);
}
