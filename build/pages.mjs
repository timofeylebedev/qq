// The pages of the site, written from the templates (src/templates) and the data (src/data/products.json,
// data/site.json) into src/ as plain HTML, which Vite then builds like any page:
//
//   src/index.html                 the home page
//   src/catalog/index.html         the catalog
//   src/coffee/<slug>/index.html   one page per coffee
//   src/<page>/index.html          the shop (cart, favourites, checkout), the account, the information pages
//                                  (PAGES below: the address, the template, the navbar item it is)
//
// node build/pages.mjs (vite.config.js runs it before dev and build, and again when a template or the data changes).
// The written pages are not committed (.gitignore): change the templates or the data instead.
import { writeFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { read } from "../src/templates/util.mjs";
import * as home from "../src/templates/home.mjs";
import * as catalog from "../src/templates/catalog.mjs";
import * as product from "../src/templates/product.mjs";
import * as info from "../src/templates/info.mjs";
import * as shop from "../src/templates/shop.mjs";
import * as acc from "../src/templates/account.mjs";

const src = resolve(import.meta.dirname, "../src");

// the pages of round 3: address → [the template, the navbar item that is current there]
const PAGES = [
  ["business/", info.business, "business/"], ["faq/", info.faq], ["delivery/", info.delivery], ["contacts/", info.contactsPage, "contacts/"],
  ["privacy/", info.privacy], ["about/", info.about],
  ["cart/", shop.cart, "cart/"], ["favourites/", shop.favourites, "favourites/"],
  ["checkout/", shop.checkoutSignIn], ["checkout/details/", shop.checkoutDetails], ["checkout/delivery/", shop.checkoutDelivery],
  ["account/", acc.profile, "account/"], ["account/beans/", (ctx) => acc.profile(ctx, { beans: true }), "account/"],
  ["account/orders/", acc.orders, "account/"], ["account/purchases/", acc.purchases, "account/"], ["account/settings/", acc.settings, "account/"]
];
export const DIRS = ["coffee", ...new Set(PAGES.map(([path]) => path.split("/")[0]))];

export function pages() {
  const site = read("data/site.json"), { products } = read("src/data/products.json"), company = read("data/company.json");
  const base = { site, products, company };
  const rel = (path) => "../".repeat(path.split("/").filter(Boolean).length);
  const out = [
    ["index.html", home.render({ ...base, page: "home", rel: "" })],
    ["catalog/index.html", catalog.render({ ...base, page: "catalog", here: "catalog/", rel: "../" })],
    ...products.map((p) => [`coffee/${p.slug}/index.html`, product.render({ ...base, page: "product", rel: "../../" }, p)]),
    ...PAGES.map(([path, render, here]) => [path + "index.html", render({ ...base, page: path.replace(/\/$/, "").replace(/\//g, "-"), here, rel: rel(path) })]),
    ...acc.orderIds(products).map((id) => [`account/orders/${id}/index.html`, acc.order({ ...base, page: "order", here: "account/", rel: "../../../" }, id)])
  ];
  for (const d of DIRS) if (existsSync(resolve(src, d))) rmSync(resolve(src, d), { recursive: true });
  for (const [path, html] of out) {
    mkdirSync(dirname(resolve(src, path)), { recursive: true });
    writeFileSync(resolve(src, path), html);
  }
  return out.map(([p]) => p);
}

if (import.meta.url === `file://${process.argv[1]}`) console.log(`pages: ${pages().length} written`);
