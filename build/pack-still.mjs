// The still of the 3D pack: the same model, rendered once in a headless browser with the site's own renderer, on a
// transparent ground → src/assets/pack/still-512.webp and still-1024.webp. Every pack slot shows it until the canvas
// has drawn, and for good where WebGL is missing. Run again when the model, the label or the look changes:
//   node build/pack-still.mjs        (needs Playwright's Chromium; uses software WebGL)
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, extname } from "node:path";
import sharp from "sharp";

const root = resolve(import.meta.dirname, "..");
const TYPES = { ".js": "text/javascript", ".json": "application/json", ".webp": "image/webp", ".jpg": "image/jpeg", ".html": "text/html" };
const page = `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:transparent}#slot{width:100vw;height:100vh}</style>
<div id="slot"></div><script type="module">
import { Pouch3D } from "/src/scripts/pouch3d.js";
const A = "/public/pack/";
const px = innerWidth >= 1000 ? 1024 : 512;
const stage = await Pouch3D.createStage({ assets: A, mesh: A + "pouch-glb.json", preserveDrawingBuffer: true, overscan: 0, adaptive: false, maxDpr: 1 });
Object.assign(stage.look, { depth: 1.0, relief: 2.0, light: 0.75, sheen: 0.35, shadow: 0.38 });
const it = stage.add(document.getElementById("slot"), { front: A + "labels/sumatra-front-" + px + ".webp", back: A + "labels/sumatra-back-" + px + ".webp", fit: 0.9 });
const im = new Image(); im.src = it.front; await im.decode();
await new Promise((r) => setTimeout(r, 1500)); stage.invalidate();
await new Promise((r) => setTimeout(r, 800));
window.done = stage.canvas.toDataURL("image/png");
</script>`;

const server = createServer((req, res) => {
  const url = decodeURIComponent(req.url.split("?")[0]);
  if (url === "/") { res.writeHead(200, { "content-type": "text/html" }); return res.end(page); }
  const file = resolve(root, "." + url);
  if (!file.startsWith(root) || !existsSync(file)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream" });
  res.end(readFileSync(file));
}).listen(0);
const port = server.address().port;

const browser = await chromium.launch({ args: ["--use-gl=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
mkdirSync(resolve(root, "src/assets/pack"), { recursive: true });
for (const size of [512, 1024]) {
  const p = await browser.newPage({ viewport: { width: size, height: size } });
  p.on("console", (m) => m.type() === "error" && console.error(m.text()));
  await p.goto(`http://localhost:${port}/`);
  const data = await p.waitForFunction(() => window.done, null, { timeout: 60000 }).then((h) => h.jsonValue());
  const png = Buffer.from(data.split(",")[1], "base64");
  const out = resolve(root, `src/assets/pack/still-${size}.webp`);
  await sharp(png).resize(size, size).webp({ quality: 82, alphaQuality: 90 }).toFile(out);
  console.log(out.replace(root + "/", ""));
  await p.close();
}
await browser.close();
server.close();
