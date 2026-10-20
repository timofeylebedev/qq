// The build of the site: `npm run dev` to work on it, `npm run build` for the finished site in dist/.
// The pages are written from templates and data first (build/pages.mjs); in dev they are written again when a
// template or the data changes, and the browser reloads.
import { defineConfig } from "vite";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { icons, typograph, minifyPages, csp, precompress } from "./build/plugins.js";

const root = import.meta.dirname;
const src = resolve(root, "src");
const dist = resolve(root, "dist");

// run in a fresh node, so a changed template is read again
const writePages = () => JSON.parse(execFileSync(process.execPath, ["-e",
  `import("./build/pages.mjs").then(m => process.stdout.write(JSON.stringify(m.pages())))`], { cwd: root, encoding: "utf8" }));

// the component canvas (src/lab/canvas): written for the dev server only, never part of the build
const canvas = resolve(src, "lab/canvas");
// (a canvas that can't be written — a template changed so a part can't be cut out — is reported, and the site still runs)
function writeCanvas(server) {
  try { execFileSync(process.execPath, ["src/lab/canvas/page.mjs"], { cwd: root, encoding: "utf8", stdio: "pipe" }); }
  catch (e) { server.config.logger.error(`component canvas not written: ${(e.stderr || e.message).trim().split("\n").find((l) => /Error/.test(l)) || e.message}`); }
}

function pages() {
  return {
    name: "qq-pages",
    configureServer(server) {
      writeCanvas(server);
      const watched = [resolve(src, "templates"), resolve(root, "data"), resolve(src, "data"), canvas];
      server.watcher.add(watched);
      server.watcher.on("change", (file) => {
        if (file.startsWith(canvas) && !/[/\\](page|variants)\.mjs$/.test(file)) return;   // only these write it; its .js and .css reload by themselves
        if (watched.some((d) => file.startsWith(d))) {
          if (file.startsWith(resolve(root, "data"))) execFileSync(process.execPath, ["build/data.mjs"], { cwd: root });
          writePages();
          writeCanvas(server);
          server.ws.send({ type: "full-reload" });
        }
      });
    }
  };
}

const list = writePages();
export default defineConfig({
  root: src,
  base: "./",                                   // relative addresses: the site works at a domain's root or in a folder (GitHub Pages)
  publicDir: resolve(root, "public"),
  plugins: [pages(), icons(resolve(src, "assets/icons")), typograph(), minifyPages(), csp(), precompress(dist)],
  css: {
    transformer: "lightningcss",
    lightningcss: { drafts: { customMedia: true }, targets: { chrome: 111 << 16, safari: (16 << 16) | (4 << 8), ios_saf: (16 << 16) | (4 << 8), firefox: 121 << 16, edge: 111 << 16 } }
  },
  server: { watch: { ignored: ["**/src/index.html", "**/src/catalog/**", "**/src/coffee/**", "**/src/lab/canvas/*.html"] } },
  build: {
    outDir: dist,
    emptyOutDir: true,
    target: ["chrome111", "safari16.4", "ios16.4", "firefox121", "edge111"],   // container queries and :has() (README: Browsers)
    cssMinify: "lightningcss",
    assetsInlineLimit: 0,                       // every font and picture stays a file: the CSP allows fonts only from the site itself
    modulePreload: { polyfill: false },
    rollupOptions: { input: Object.fromEntries(list.map((p) => [p.replace(/\/?index\.html$/, "") || "index", resolve(src, p)])) }
  }
});
