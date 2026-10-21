// Small helpers shared by every template. Templates are plain functions that return HTML strings; build/pages.mjs
// calls them with the data and writes the pages. Nothing here runs in the browser.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
export const read = (p) => JSON.parse(readFileSync(resolve(root, p), "utf8"));

export const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
export const cls = (...c) => c.filter(Boolean).join(" ");
export const icon = (name, attrs = "") => `<svg data-icon="${name}"${attrs ? " " + attrs : ""}></svg>`;

// A link inside the site. `to` is relative to the site's root ("catalog/", "coffee/q-berry/", "#business");
// ctx.rel is the way back to the root from the page being built ("", "../", "../../"). An anchor of the home page
// stays an anchor on the home page and becomes "<root>#anchor" elsewhere. "#" alone is a page that does not exist yet.
export function href(ctx, to) {
  if (to === "#") return "#";
  if (to.startsWith("#")) return ctx.page === "home" ? to : ctx.rel + to;
  if (/^https?:/.test(to)) return to;
  return ctx.rel + to;
}

// A picture from src/assets/img (made by build/images.mjs): AVIF and WebP at every width that exists, the right
// width and height for its shape, lazy unless it is the first thing on the screen.
const IMAGES = read("src/data/images.json");
export function picture(name, alt, { sizes = "100vw", cls: c = "", eager = false, decorative = false } = {}) {
  const im = IMAGES[name];
  if (!im) throw new Error("no picture " + name + " (run npm run images)");
  const set = (ext) => im.widths.map((w) => `/assets/img/${name}-${w}.${ext} ${w}w`).join(", ");
  const w = im.widths[im.widths.length - 1], h = Math.round(w / im.ratio);
  return `<picture${c ? ` class="${c}"` : ""}><source type="image/avif" srcset="${set("avif")}" sizes="${sizes}">` +
    `<img src="/assets/img/${name}-${im.widths[0]}.webp" srcset="${set("webp")}" sizes="${sizes}" width="${w}" height="${h}"` +
    ` alt="${decorative ? "" : esc(alt)}"${eager ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async"></picture>`;
}

// the heroes' video (build/video.mjs): silent, looped, decorative; scripts/video.js plays it while it is on screen,
// and with «reduce motion» or Save-Data it stays the poster (its first frame)
export function heroVideo(c) {
  return `<div class="${c}"><video muted loop playsinline preload="none" poster="/assets/video/hero-poster.webp" aria-hidden="true" data-hero-video>` +
    `<source src="/assets/video/hero-1920.mp4" type="video/mp4" media="(min-width: 60em)">` +
    `<source src="/assets/video/hero-1280.mp4" type="video/mp4"></video></div>`;
}

export const rub = (n) => (n == null ? "—" : n.toLocaleString("ru-RU").replace(/ /g, " ") + " ₽");
export const lower = (s) => s.charAt(0).toLowerCase() + s.slice(1);

// the dot colour of a descriptor: its flavour family (design/colors.json)
const FAMILIES = read("design/colors.json").descriptors.families;
export function taste(descriptor) {
  const d = descriptor.toLowerCase();
  const f = FAMILIES.find(([, , words]) => words.some((w) => d.includes(w)));
  return f ? f[0] : "other";
}
