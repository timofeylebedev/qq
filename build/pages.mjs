// The pages of the site, written from the templates (src/templates) and the data (src/data/products.json,
// data/site.json) into src/ as plain HTML, which Vite then builds like any page:
//
//   src/index.html                 the home page
//   src/catalog/index.html         the catalog
//   src/coffee/<slug>/index.html   one page per coffee
//
// node build/pages.mjs (vite.config.js runs it before dev and build, and again when a template or the data changes).
// The written pages are not committed (.gitignore): change the templates or the data instead.
import { writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { read } from "../src/templates/util.mjs";
import * as home from "../src/templates/home.mjs";
import * as catalog from "../src/templates/catalog.mjs";
import * as product from "../src/templates/product.mjs";

const src = resolve(import.meta.dirname, "../src");

export function pages() {
  const site = read("data/site.json"), { products } = read("src/data/products.json");
  const base = { site, products };
  const out = [
    ["index.html", home.render({ ...base, page: "home", rel: "" })],
    ["catalog/index.html", catalog.render({ ...base, page: "catalog", here: "catalog/", rel: "../" })],
    ...products.map((p) => [`coffee/${p.slug}/index.html`, product.render({ ...base, page: "product", rel: "../../" }, p)])
  ];
  if (existsSync(resolve(src, "coffee"))) rmSync(resolve(src, "coffee"), { recursive: true });
  for (const [path, html] of out) {
    mkdirSync(dirname(resolve(src, path)), { recursive: true });
    writeFileSync(resolve(src, path), html);
  }
  return out.map(([p]) => p);
}

if (import.meta.url === `file://${process.argv[1]}`) console.log(`pages: ${pages().length} written`);
