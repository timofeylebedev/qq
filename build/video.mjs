// The hero's video, made from the original (npm run video [file]; commit the outputs).
//
// The original is large (Tim's «Comp 1.mp4»: 1920×1080, 38 s, 28 MB) and stays outside the repo, like the other
// designer sources (source/, .gitignore). It becomes two silent H.264 files in src/assets/video, 1280 px wide for
// phones and small screens and 1920 px from 60em (the <source media> of heroVideo() in src/templates/util.mjs), and
// a poster, the first frame, shown until the video plays and instead of it with «reduce motion».
//
// CRF 32: the splashes are hard to compress (CRF 28 gave 10 MB at 1920); at 32 the frame is near the original under
// the hero's 0.85 opacity and its fades. Needs ffmpeg on the PATH.
import sharp from "sharp";
import { execFileSync } from "node:child_process";
import { mkdirSync, existsSync, statSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const SRC = resolve(root, process.argv[2] || "source/hero.mp4"), OUT = resolve(root, "src/assets/video");
if (!existsSync(SRC)) throw new Error("no video original at " + SRC + " (npm run video -- <file>)");
mkdirSync(OUT, { recursive: true });

const ff = (...args) => execFileSync("ffmpeg", ["-v", "error", "-y", ...args], { stdio: "inherit" });
for (const w of [1280, 1920]) {
  const out = resolve(OUT, `hero-${w}.mp4`);
  ff("-i", SRC, "-an", "-vf", `scale=${w}:-2,format=yuv420p`, "-c:v", "libx264", "-preset", "slow", "-crf", "32",
    "-profile:v", "high", "-movflags", "+faststart", out);
  console.log(`hero-${w}.mp4 ${Math.round(statSync(out).size / 1024)} KB`);
}
const png = resolve(OUT, "poster.tmp.png");
ff("-i", SRC, "-frames:v", "1", "-vf", "scale=1920:-2", png);
await sharp(png).webp({ quality: 72, effort: 6 }).toFile(resolve(OUT, "hero-poster.webp"));
execFileSync("rm", [png]);
console.log(`hero-poster.webp ${Math.round(statSync(resolve(OUT, "hero-poster.webp")).size / 1024)} KB`);
