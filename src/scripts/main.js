// The script of every page: each part starts only if its markup is on the page. The 3D packs, the catalog filters
// and the product stage load on demand (their own files).
import { initScroll } from "./scroll.js";
import { initNav } from "./nav.js";
import { initToggles } from "./toggle.js";
import { initRoast } from "./roast.js";
import { initBuy } from "./buy.js";
import { initSliders } from "./slider.js";

initScroll();
initNav();
initToggles();
initRoast();
initBuy();
initSliders();

if (document.querySelector("[data-pack]")) import("./packs.js").then((m) => m.initPacks());
if (document.querySelector("[data-stage]")) import("./product.js").then((m) => m.initStage());
if (document.querySelector("[data-filters]")) import("./filters.js").then((m) => m.initFilters());
