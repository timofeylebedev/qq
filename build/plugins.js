// The small build steps of the site, as Vite plugins.
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve, dirname } from "node:path";
import { minify as minifyJs } from "terser";
import { minify as minifyHtml } from "html-minifier-terser";
import { typographHtml } from "./typograph.js";

// <svg data-icon="name" class="…"></svg> in the HTML → <svg class="…"><use href="#i-name"/></svg>, and one sprite at the
// top of <body> holding each icon the page uses once (src/assets/icons/name.svg). A catalog of 25 cards then carries
// the heart and the bag once, not 25 times. Icons without a label are hidden from screen readers. An icon whose SVG
// holds several parts styled by class (the heart: .i-off / .i-on) keeps those classes inside the symbol.
export function icons(dir) {
  return {
    name: "qq-icons",
    transformIndexHtml: {
      order: "pre",
      handler(html) {
        const used = new Map();
        html = html.replace(/<svg data-icon="([\w-]+)"([^>]*)><\/svg>/g, (tag, name, attrs) => {
          if (!used.has(name)) used.set(name, readFileSync(resolve(dir, name + ".svg"), "utf8").trim());
          const svg = used.get(name), box = /viewBox="([^"]+)"/.exec(svg)[1], [, , w, h] = box.split(" ");
          const label = /\baria-label=|\brole=/.test(attrs) ? "" : ' aria-hidden="true"';
          return `<svg viewBox="${box}" width="${w}" height="${h}"${attrs}${label} focusable="false"><use href="#i-${name}"/></svg>`;
        });
        if (!used.size) return html;
        const symbols = [...used].map(([name, svg]) => {
          const box = /viewBox="([^"]+)"/.exec(svg)[1];
          const paint = ['fill', 'stroke', 'stroke-width'].map((a) => { const m = new RegExp(`^<svg[^>]*\\s${a}="([^"]+)"`).exec(svg); return m ? ` ${a}="${m[1]}"` : ""; }).join("");
          return `<symbol id="i-${name}" viewBox="${box}"${paint}>${svg.replace(/^<svg[^>]*>|<\/svg>$/g, "")}</symbol>`;
        }).join("");
        return html.replace(/<body([^>]*)>/, `<body$1><svg class="sprite" aria-hidden="true" style="position:absolute;width:0;height:0;overflow:hidden">${symbols}</svg>`);
      }
    }
  };
}

// <script data-inline src="./scripts/boot.js"></script> → the script itself, inside the page (minified when building):
// it has to run before the page is drawn, without waiting for a file.
export function inlineScripts(root) {
  let building = false;
  return {
    name: "qq-inline-scripts",
    configResolved(config) { building = config.command === "build"; },
    transformIndexHtml: {
      order: "pre",
      async handler(html, ctx) {
        const tags = [...html.matchAll(/<script data-inline src="([^"]+)"><\/script>/g)];
        for (const [tag, src] of tags) {
          let code = readFileSync(resolve(dirname(ctx.filename), src), "utf8");
          if (building) code = (await minifyJs(code, { ecma: 2020, compress: { passes: 2 }, mangle: true })).code;
          html = html.replace(tag, "<script>" + code + "</script>");
        }
        return html;
      }
    }
  };
}

// Russian non-breaking spaces (see typograph.js)
export function typograph() {
  return { name: "qq-typograph", transformIndexHtml: { order: "pre", handler: (html) => typographHtml(html) } };
}

// The finished pages, minified: no comments, no indentation (whitespace that shows on the page is kept)
export function minifyPages() {
  return {
    name: "qq-minify-html",
    apply: "build",
    transformIndexHtml: {
      order: "post",
      handler: (html) => minifyHtml(html, {
        collapseWhitespace: true, conservativeCollapse: true, removeComments: true,
        removeRedundantAttributes: true, removeScriptTypeAttributes: true, useShortDoctype: true,
        minifyJS: false, minifyCSS: true, sortAttributes: false
      })
    }
  };
}

// A Content Security Policy for every page, written into it when the site is built: the page may run only its own
// scripts (and the inline ones it was built with: their hashes are worked out here). Whatever else tried to run (an injected script, a browser extension's code put into the page) is blocked.
// When something new is added to the site (an analytics counter, a chat), add its addresses to POLICY below.
// (frame-ancestors cannot be set from the page itself: the server sends it, see deploy/.)
const POLICY = {
  "default-src": ["'self'"],
  "script-src": ["'self'"],
  "style-src": ["'self'", "'unsafe-inline'"],          // scripts set styles on the elements they move (the 3D canvas, the pinned pack)
  "img-src": ["'self'", "data:", "blob:"],
  "media-src": ["'self'"],                          // the heroes' video (build/video.mjs)
  "font-src": ["'self'"],
  "connect-src": ["'self'"],                           // the 3D pack fetches its mesh and labels from the site itself
  "frame-src": ["'none'"],
  "object-src": ["'none'"],
  "base-uri": ["'self'"],
  "form-action": ["'self'"]
};
export function csp() {
  return {
    name: "qq-csp",
    apply: "build",
    transformIndexHtml: {
      order: "post",
      handler(html) {
        const hashes = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
          .map(([, code]) => "'sha256-" + createHash("sha256").update(code).digest("base64") + "'");
        const policy = Object.entries(POLICY).map(([k, v]) => k + " " + (k === "script-src" ? v.concat(hashes) : v).join(" ")).join("; ");
        return html.replace(/<meta charset="utf-8">/i, (m) => m + '<meta http-equiv="Content-Security-Policy" content="' + policy + '">');
      }
    }
  };
}

// Every text file of the finished site is also saved compressed (.br and .gz next to it), at the strongest level, once:
// a server that can send these (nginx gzip_static / brotli_static, Caddy precompressed) does not compress on every request.
export function precompress(outDir) {
  return {
    name: "qq-precompress",
    apply: "build",
    async closeBundle() {
      const { readdirSync, statSync, readFileSync, writeFileSync } = await import("node:fs");
      const { join } = await import("node:path");
      const zlib = await import("node:zlib");
      const walk = (dir) => readdirSync(dir).flatMap((f) => { const p = join(dir, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
      for (const file of walk(outDir).filter((f) => /\.(html|css|js|svg|json|webmanifest|xml|txt)$/.test(f))) {
        const data = readFileSync(file);
        if (data.length < 1024) continue;
        writeFileSync(file + ".br", zlib.brotliCompressSync(data, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 } }));
        writeFileSync(file + ".gz", zlib.gzipSync(data, { level: 9 }));
      }
    }
  };
}
