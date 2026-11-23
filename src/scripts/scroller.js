// What scrolls: the window, or (in Safari on a Mac) the page's own box. Every script of the site asks this module,
// never the window: where the page is scrolled (y), scroll it (to, by, target.scrollTo for a smooth one), how tall it is
// (height, max), its scrolling (onScroll), its size (watchSize) and the root of an IntersectionObserver (ioRoot).
// The module is site-kit's (site-kit/runtime/scroller.js: the whole story is at its top); this file is the one place the
// site imports it from, so the kit's rule learn.window-scroll knows the module that may read the window.
export { box, target, el, y, to, by, height, max, onScroll, offScroll, ioRoot, watchSize, paper } from "site-kit/runtime/scroller.js";
