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

function pages() {
  return {
    name: "qq-pages",
    configureServer(server) {
      const watched = [resolve(src, "templates"), resolve(root, "data"), resolve(src, "data")];
      server.watcher.add(watched);
      server.watcher.on("change", (file) => {
        if (watched.some((d) => file.startsWith(d))) {
          if (file.startsWith(resolve(root, "data"))) execFileSync(process.execPath, ["build/data.mjs"], { cwd: root });
          writePages();
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
    lightningcss: { drafts: { customMedia: true }, targets: { chrome: 100 << 16, safari: 15 << 16, ios_saf: 15 << 16, firefox: 100 << 16, edge: 100 << 16 } }
  },
  server: { watch: { ignored: ["**/src/index.html", "**/src/catalog/**", "**/src/coffee/**"] } },
  build: {
    outDir: dist,
    emptyOutDir: true,
    target: ["chrome100", "safari15", "ios15", "firefox100", "edge100"],
    cssMinify: "lightningcss",
    assetsInlineLimit: 0,                       // every font and picture stays a file: the CSP allows fonts only from the site itself
    modulePreload: { polyfill: false },
    rollupOptions: { input: Object.fromEntries(list.map((p) => [p.replace(/\/?index\.html$/, "") || "index", resolve(src, p)])) }
  }
});
