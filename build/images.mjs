// The pictures of the site, made from the originals in assets-src/img (npm run images; commit the outputs).
//
// Each original becomes AVIF and WebP files at the widths listed below (never wider than the original), in
// src/assets/img, and src/data/images.json records what exists (widths, aspect ratio), so the pages can write
// srcset, sizes and width/height without guessing.
//
// The originals in assets-src/img are renders exported from Figma at the size they are drawn there (most 1368px
// square, the hero 1280px wide): replace them with the photographers' files for sharper pictures on big screens.
import sharp from "sharp";
import { readdirSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { resolve, basename, extname } from "node:path";

const root = resolve(import.meta.dirname, "..");
const SRC = resolve(root, "assets-src/img"), OUT = resolve(root, "src/assets/img"), MAP = resolve(root, "src/data/images.json");

// widths per picture (px); the default suits a card or a half-column picture
const WIDTHS = {
  "hero-roast": [640, 960, 1280],
  "approach-people": [720, 1080, 1440],
  "approach-bean": [600, 900, 1208],
  "farm-drying": [672, 1008, 1344],
  "pack-flat": [512]
};
const DEFAULT = [480, 800, 1200];

mkdirSync(OUT, { recursive: true });
const manifest = {};
for (const file of readdirSync(SRC).filter((f) => /\.(png|jpe?g|webp|tiff?)$/i.test(f)).sort()) {
  const name = basename(file, extname(file));
  const img = sharp(resolve(SRC, file));
  const { width, height } = await img.metadata();
  const widths = [...new Set((WIDTHS[name] || DEFAULT).map((w) => Math.min(w, width)))];
  for (const w of widths) {
    const base = resolve(OUT, `${name}-${w}`);
    if (!existsSync(base + ".avif")) await sharp(resolve(SRC, file)).resize(w).avif({ quality: 52, effort: 6 }).toFile(base + ".avif");
    if (!existsSync(base + ".webp")) await sharp(resolve(SRC, file)).resize(w).webp({ quality: 78, effort: 6 }).toFile(base + ".webp");
  }
  manifest[name] = { widths, ratio: Math.round((width / height) * 10000) / 10000 };
  console.log(`${name.padEnd(18)} ${width}×${height} → ${widths.join(", ")}`);
}
writeFileSync(MAP, JSON.stringify(manifest, null, 1) + "\n");
