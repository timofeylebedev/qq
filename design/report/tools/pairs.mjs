// Pictures for the report: the built site's sections, screen-sized frames taken with the 3D canvas drawn, joined with
// the Figma render of the same section (design/report/figma/*.png): "Figma" in grey on the left, "Site" in the accent
// on the right. JPEG at quality 82, at most 1000 wide and 620 tall.   node design/report/tools/pairs.mjs <base url>
import { chromium } from "playwright";
import sharp from "sharp";
import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const here = resolve(import.meta.dirname, ".."), FIG = resolve(here, "figma"), OUT = resolve(here, "shots");
mkdirSync(OUT, { recursive: true });
const base = process.argv[2] || "http://localhost:4173/";
// [name, page, width, height, how to frame it (a selector to scroll to, or a scroll y), figma file or null, figma crop]
const SHOTS = [
  ["hero-1280", "", 1280, 900, 0, "hero-1280.png", null],
  ["featured-1280", "", 1280, 900, ".featured .head", "featured-1280.png", null],
  ["recs-1280", "", 1280, 900, "#recs-title", "recs-1280.png", null],
  ["approach-1280", "", 1280, 900, "#approach", "approach-1280.png", null],
  ["business-1280", "", 1280, 1150, "#business", "business-1280.png", null],
  ["facts-footer-1280", "", 1280, 900, ".facts", "main-1280.png", { left: 0, top: 2006, width: 545, height: 394 }],
  ["product-top-1440", "coffee/q-optimistic/", 1440, 900, 0, "product-1440.png", { left: 0, top: 0, width: 562, height: 351 }],
  ["product-tiles-1440", "coffee/q-optimistic/", 1440, 900, 1100, "product-stage-1440.png", { left: 0, top: 700, width: 1440, height: 900 }],
  ["product-story-1440", "coffee/q-optimistic/", 1440, 900, ".pstory", "product-1440.png", { left: 0, top: 1020, width: 562, height: 351 }],
  ["product-similar-1440", "coffee/q-optimistic/", 1440, 900, ".similar", "product-1440.png", { left: 0, top: 1450, width: 562, height: 351 }],
  ["catalog-1440", "catalog/", 1440, 900, 0, "catalog-1440.png", { left: 0, top: 0, width: 622, height: 389 }],
  ["home-390", "", 390, 844, 0, null, null],
  ["featured-390", "", 390, 844, ".featured .head", null, null],
  ["catalog-390", "catalog/", 390, 844, 0, null, null],
  ["product-390", "coffee/keniya-kisii/", 390, 844, 0, null, null],
  ["product-390-tiles", "coffee/keniya-kisii/", 390, 844, 1400, null, null],
  ["home-844x390", "", 844, 390, 0, null, null],
  ["home-2560", "", 2560, 1440, ".featured .head", null, null]
];
const only = process.argv[3]?.split(",");
const label = (text, color, w) => Buffer.from(`<svg width="${w}" height="34" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#0a0a0a"/><text x="2" y="23" font-family="Inter, Arial, sans-serif" font-size="17" font-weight="600" fill="${color}">${text}</text></svg>`);

const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
for (const [name, path, w, h, at, fig, crop] of SHOTS) {
  if (only && !only.includes(name)) continue;
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  await page.goto(base + path, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const y = typeof at === "number" ? at : await page.evaluate((s) => document.querySelector(s).getBoundingClientRect().top + scrollY - 48, at);
  await page.evaluate((y) => scrollTo(0, y), y);
  await page.waitForTimeout(2200);
  const site = await page.screenshot();
  await page.close();
  const H = fig ? 560 : 586;
  const siteImg = await sharp(site).resize({ height: H, width: fig ? 496 : 1000, fit: "inside" }).toBuffer({ resolveWithObject: true });
  const parts = [];
  if (fig && existsSync(resolve(FIG, fig))) {
    let f = sharp(resolve(FIG, fig));
    if (crop) f = f.extract(crop);
    const meta = await sharp(await f.toBuffer()).metadata();
    const figImg = await sharp(await (crop ? sharp(resolve(FIG, fig)).extract(crop) : sharp(resolve(FIG, fig))).toBuffer()).resize({ height: H, width: 496, fit: "inside" }).toBuffer({ resolveWithObject: true });
    parts.push(["Figma", "#8a8a8a", figImg]);
  }
  parts.push(["Site", "#38bdf8", siteImg]);
  const width = parts.reduce((s, [, , im]) => s + im.info.width, 0) + 8 * (parts.length - 1);
  const height = 34 + Math.max(...parts.map(([, , im]) => im.info.height));
  let x = 0; const comp = [];
  for (const [t, c, im] of parts) { comp.push({ input: label(t, c, im.info.width), left: x, top: 0 }, { input: im.data, left: x, top: 34 }); x += im.info.width + 8; }
  await sharp({ create: { width, height, channels: 3, background: "#0a0a0a" } }).composite(comp).jpeg({ quality: 82 }).toFile(resolve(OUT, name + ".jpg"));
  console.log(name);
}
await browser.close();
