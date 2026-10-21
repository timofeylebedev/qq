// New arrivals, turned like the pages of a magazine: «Изгиб» from Tim's artifact «Новинки: листаем журнал» (round 7).
//
//   from L    the slide is a spread: the text on the left page, the photo on the right. Forward, the right page lifts
//             at its free edge, bends over the spine and lands on the left one as the next coffee's text; back, the
//             left page goes the other way
//   below L   the slide is one page (the text over the photo), turned over its left edge: forward it leaves, showing
//             the next one under it; back, the one before comes in over it
//
// The sheet is drawn by WebGL as one bent mesh (128 columns, lit per pixel), its two faces painted from the slides as
// they are laid out on the page (paint below: boxes, borders, gradients, pictures, the taste chart, the pills' dots
// and every letter where the browser put it). While a page turns, the page itself shows the parts under the sheet;
// the sheet takes over from the page it starts as while its corner moves its first half pixel, and hands over to the
// page it lands as in its last, so nothing jumps. A drag sideways turns the page under the hand (past a third, or a
// flick, and it finishes; else it falls back). A number further than the next turns every sheet on the way, each a
// little after the one before. Without WebGL the slides simply change; with «reduce motion» they change at once.
//
// The arrows of the head and the pager drive it; the current number is aria-current, the arrows aria-disabled at the
// ends. Slides not shown are data-off and inert.

const reduced = matchMedia("(prefers-reduced-motion: reduce)");
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const DPR = () => Math.min(devicePixelRatio || 1, 2);   // the faces are textures: 2 is sharp enough, and a phone's tall page stays a few MB
const idle = (f) => (window.requestIdleCallback ? requestIdleCallback(f, { timeout: 400 }) : setTimeout(f, 40));
function bezier(x1, y1, x2, y2) {
  const B = (t, a, b) => 3 * (1 - t) ** 2 * t * a + 3 * (1 - t) * t ** 2 * b + t ** 3;
  return (x) => { let lo = 0, hi = 1; for (let k = 0; k < 30; k++) { const m = (lo + hi) / 2; B(m, x1, x2) < x ? (lo = m) : (hi = m); } return B((lo + hi) / 2, y1, y2); };
}

// the sheet, as Tim's artifact has it («Как сейчас»): the free edge leads as a hand turns it, the bend turns over a
// little past upright; the curve of its way, the light on it, the shade it throws, the perspective
export const CURL = { dur: 900, give: 1, where: 1, x1: 0.55, y1: 0, x2: 0.3, y2: 1, self: 0.4, gloss: 0.2, sharp: 60, cast: 0.7, depth: 1.5, calm: 1, hs: 0.8, he: 0.6, turn: 0.6, perspective: 2400 };
const JUMP = { gap: 110, k2: 0.8, k3: 0.7, k4: 0.6 };   // a jump over n coffees: each sheet takes dur × k_n, the next starts gap ms later
const P = CURL;
const ease = () => bezier(P.x1, P.y1, P.x2, P.y2);
const OUT = bezier(0.16, 1, 0.3, 1);                    // --ease-out: a turn finishing or falling back after a drag
// past the end of its way (an ease that overshoots), the sheet bounces back off the page, never through it
const fold = (q) => (q > 1 ? 2 - q : q < 0 ? -q : q);
// the sheet at q: the angle at the spine and the bend from it to the free edge, in radians. As a hand turns it: the
// free edge goes first, past upright; then the part at the spine lands first and the edge comes down last
function bendAt(q) {
  const w = Math.pow(q, Math.log(0.5) / Math.log(P.turn)), s = Math.sin(2 * Math.PI * w);
  const bend = P.give * (w < 0.5 ? P.hs : P.he) * s;
  return [clamp(Math.PI * q - bend / 2, 0, Math.PI), bend];
}
// a point of the sheet t of the way from the spine (in sheet lengths): along the stage and towards the viewer
function sheetAt(base, D, t) {
  if (Math.abs(P.where - 1) < 1e-3) { const h = D * t / 2, s = Math.abs(h) < 1e-6 ? 1 : Math.sin(h) / h; return [t * Math.cos(base + h) * s, t * Math.sin(base + h) * s]; }
  let x = 0, z = 0; const dt = t / 32;
  for (let k = 0; k < 32; k++) { const a = base + D * Math.pow((k + 0.5) * dt, P.where); x += Math.cos(a) * dt; z += Math.sin(a) * dt; }
  return [x, z];
}

// ── painting a laid-out part of the page into a canvas ──────────────────────────────────────────────────────────────
const seenColour = (c) => c && !/rgba\(.*,\s*0\)$/.test(c) && c !== "transparent";
const ASC = new Map();
const ascent = (ctx) => { let a = ASC.get(ctx.font); if (a == null) { const m = ctx.measureText("Ш"); a = m.fontBoundingBoxAscent ?? m.actualBoundingBoxAscent; ASC.set(ctx.font, a); } return a; };
function gradient(ctx, s, x, y, w, h) {
  const inner = s.slice(s.indexOf("(") + 1, s.lastIndexOf(")"));
  const parts = inner.split(/,(?![^(]*\))/).map((t) => t.trim());
  let g;
  if (/^to /.test(parts[0])) {
    const d = parts.shift();
    g = d === "to top" ? ctx.createLinearGradient(x, y + h, x, y) : d === "to right" ? ctx.createLinearGradient(x, y, x + w, y) : d === "to left" ? ctx.createLinearGradient(x + w, y, x, y) : ctx.createLinearGradient(x, y, x, y + h);
  } else g = ctx.createLinearGradient(x, y, x, y + h);
  parts.forEach((p, k) => { const m = p.match(/^(.*\))\s*([\d.]+)%$/); try { g.addColorStop(m ? clamp(+m[2] / 100, 0, 1) : k / (parts.length - 1), m ? m[1] : p); } catch { /* a stop it can't read */ } });
  return g;
}
function letters(node, o, cs) {
  const s = node.data, rg = document.createRange(), up = cs.textTransform === "uppercase", out = [];
  for (let k = 0; k < s.length; k++) {
    if (/\s/.test(s[k])) continue;
    rg.setStart(node, k); rg.setEnd(node, k + 1);
    const r = rg.getClientRects()[0];
    if (r && r.width) out.push({ c: up ? s[k].toUpperCase() : s[k], x: r.left - o.left, y: r.top - o.top, r: r.right - o.left, b: r.bottom - o.top });
  }
  return out;
}
// the taste chart: its circles and its line, in the colours the styles give them
function paintSvg(ctx, svg, x, y, w, h) {
  const vb = svg.viewBox.baseVal;
  if (!vb || !vb.width) return;
  const kx = w / vb.width, ky = h / vb.height;
  ctx.save(); ctx.translate(x - vb.x * kx, y - vb.y * ky); ctx.scale(kx, ky);
  const walk = (el) => {
    for (const n of el.children) {
      if (n.tagName === "g") { walk(n); continue; }
      const cs = getComputedStyle(n);
      ctx.beginPath();
      if (n.tagName === "circle") { ctx.arc(+n.getAttribute("cx"), +n.getAttribute("cy"), +n.getAttribute("r"), 0, 2 * Math.PI); if (seenColour(cs.fill) && cs.fill !== "none") { ctx.fillStyle = cs.fill; ctx.fill(); } }
      if (n.tagName === "polyline") {
        n.getAttribute("points").trim().split(/\s+/).forEach((p, j) => { const [a, b] = p.split(",").map(Number); j ? ctx.lineTo(a, b) : ctx.moveTo(a, b); });
        if (cs.stroke !== "none") { ctx.lineWidth = parseFloat(cs.strokeWidth) || 1; ctx.strokeStyle = cs.stroke; ctx.stroke(); }
      }
    }
  };
  walk(svg);
  ctx.restore();
}
function paintEl(ctx, e, o) {
  const cs = getComputedStyle(e);
  if (cs.display === "none" || e.getAttribute("aria-hidden") === "true" && e.tagName === "svg" && !e.closest(".taste")) return;
  if (e.classList.contains("sr")) return;
  // boxes on whole device pixels, as the browser draws them (a hairline between two pixels would go grey)
  const k = ctx.getTransform().a, px = (v) => Math.round(v * k) / k, r = e.getBoundingClientRect();
  const x = px(r.left - o.left), y = px(r.top - o.top), w = px(r.right - o.left) - x, h = px(r.bottom - o.top) - y;
  const [bt, br, bb, bl] = ["Top", "Right", "Bottom", "Left"].map((s) => (cs[`border${s}Style`] === "none" ? 0 : parseFloat(cs[`border${s}Width`]) || 0));
  if (w <= 0 || h <= 0) return;   // nothing to draw (and roundRect refuses a negative radius)
  const rad = Math.max(0, Math.min(parseFloat(cs.borderTopLeftRadius) || 0, w / 2, h / 2));
  const box = (a, b, c, d, rr) => { ctx.beginPath(); rr > 0 && c > 0 && d > 0 && ctx.roundRect ? ctx.roundRect(a, b, c, d, rr) : ctx.rect(a, b, c, d); };
  if (seenColour(cs.backgroundColor)) { ctx.fillStyle = cs.backgroundColor; box(x, y, w, h, rad); ctx.fill(); }
  if (cs.backgroundImage.startsWith("linear-gradient")) { ctx.fillStyle = gradient(ctx, cs.backgroundImage, x, y, w, h); box(x, y, w, h, rad); ctx.fill(); }
  if (rad && bt) { ctx.strokeStyle = cs.borderTopColor; ctx.lineWidth = bt; box(x + bt / 2, y + bt / 2, w - bt, h - bt, Math.max(0, rad - bt / 2)); ctx.stroke(); }
  else {
    const side = (wd, col, a, b, c, d) => { if (wd && seenColour(col)) { ctx.fillStyle = col; ctx.fillRect(a, b, c, d); } };
    side(bt, cs.borderTopColor, x, y, w, bt); side(bb, cs.borderBottomColor, x, y + h - bb, w, bb);
    side(bl, cs.borderLeftColor, x, y, bl, h); side(br, cs.borderRightColor, x + w - br, y, br, h);
  }
  if (e.tagName === "IMG") {
    if (!e.naturalWidth) return;
    // object-fit: cover, placed by its destination only: with a srcset, naturalWidth is in CSS pixels (density-corrected)
    // while a source rectangle is in the file's pixels, so a crop by source cut a corner of the photo and blew it up
    const s = Math.max(w / e.naturalWidth, h / e.naturalHeight), dw = e.naturalWidth * s, dh = e.naturalHeight * s;
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.globalAlpha = parseFloat(cs.opacity) || 1;
    ctx.drawImage(e, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
    ctx.restore();
    return;
  }
  if (e.tagName === "svg") return e.closest(".taste") ? paintSvg(ctx, e, x, y, w, h) : undefined;
  const pl = parseFloat(cs.paddingLeft), pt = parseFloat(cs.paddingTop), pb = parseFloat(cs.paddingBottom);
  const bf = getComputedStyle(e, "::before");
  if (bf.content !== "none" && bf.content !== "normal" && seenColour(bf.backgroundColor)) {   // a dot: first flex item, centred across the line
    const dw = parseFloat(bf.width), dh = parseFloat(bf.height), dy = y + bt + pt + (h - bt - bb - pt - pb - dh) / 2;
    ctx.fillStyle = bf.backgroundColor; box(x + bl + pl, dy, dw, dh, Math.max(0, Math.min(dw, dh) / 2)); ctx.fill();
  }
  const clip = cs.overflow !== "visible";
  if (clip) { ctx.save(); ctx.beginPath(); ctx.rect(x + bl, y + bt, w - bl - br, h - bt - bb); ctx.clip(); }
  const clamped = cs.webkitLineClamp && cs.webkitLineClamp !== "none" && e.scrollHeight > e.clientHeight + 1;
  for (const n of e.childNodes) {
    if (n.nodeType === 1) { paintEl(ctx, n, o); continue; }
    if (n.nodeType !== 3 || !n.data.trim()) continue;
    ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`; ctx.fillStyle = cs.color; ctx.textBaseline = "alphabetic";
    if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
    const asc = ascent(ctx);
    let ls = letters(n, o, cs);
    if (clamped) {   // the lines that show; the last one ends in «…», cut back until the ellipsis fits
      const bottom = y + bt + e.clientHeight + 0.5, ell = ctx.measureText("…").width, right = x + w - br - parseFloat(cs.paddingRight);
      ls = ls.filter((l) => l.b <= bottom);
      const top = Math.max(...ls.map((l) => l.y));
      while (ls.length && Math.abs(ls.at(-1).y - top) < 1 && ls.at(-1).r + ell > right + 0.5) ls.pop();
      if (ls.length) ctx.fillText("…", ls.at(-1).r, top + asc);
    }
    for (const l of ls) ctx.fillText(l.c, l.x, l.y + asc);
  }
  if (clip) ctx.restore();
}
// a part of a slide (its text, its photo, or the whole slide) as a canvas, from where it lies on the page
export function paintPart(el, dpr) {
  const o = el.getBoundingClientRect();
  if (!o.width || !o.height) return null;
  if ([...el.querySelectorAll("img")].some((im) => !im.complete || !im.naturalWidth)) return null;
  const cv = document.createElement("canvas");
  cv.width = Math.ceil(o.width * dpr); cv.height = Math.ceil(o.height * dpr);
  cv.fill = [o.width * dpr / cv.width, o.height * dpr / cv.height];   // the part fills a share of its whole texels
  const ctx = cv.getContext("2d"); ctx.scale(dpr, dpr);
  paintEl(ctx, el, o);
  return cv;
}

// ── WebGL: the sheet (a strip mesh bent along x, lit per pixel) and the soft shade it throws on the pages under it ──
function makeGL(host) {
  const cv = document.createElement("canvas"); cv.className = "curl-sheet"; cv.setAttribute("aria-hidden", "true");
  const opt = { antialias: false, depth: false, stencil: false, alpha: true, premultipliedAlpha: true, powerPreference: "high-performance" };
  const gl = cv.getContext("webgl2", opt) || cv.getContext("webgl", opt);
  if (!gl) return null;
  const v2 = typeof WebGL2RenderingContext !== "undefined" && gl instanceof WebGL2RenderingContext;
  const aniso = gl.getExtension("EXT_texture_filter_anisotropic");
  let dead = false;
  cv.addEventListener("webglcontextlost", () => { dead = true; });
  const program = (vs, fs) => {
    const p = gl.createProgram();
    for (const [type, src] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]]) {
      const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      gl.attachShader(p, s);
    }
    gl.bindAttribLocation(p, 0, "a"); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {}; return { p, u: (n) => u[n] ?? (u[n] = gl.getUniformLocation(p, n)) };
  };
  // stage space: CSS px of the stage, y down, z towards the viewer; the eye is the stage's perspective point
  const PROJECT = `
    uniform vec2 uView, uOff; uniform vec3 uEye;
    vec4 project(vec3 P) {
      float w = (uEye.z - P.z) / uEye.z;
      vec2 S = uEye.xy + (P.xy - uEye.xy) / w;
      vec2 c = (S - uOff) / uView * 2.0 - 1.0;
      return vec4(c.x * w, -c.y * w, 0.0, w);
    }`;
  let sheet, shade;
  try {
    sheet = program(`precision highp float;
      attribute vec2 a;
      uniform float uW, uH, uHinge, uSgn, uBase, uBend, uWhere, uDpr;
      varying vec3 vP; varying vec2 vT; varying float vPhi, vS;
      ${PROJECT}
      void main() {
        float t = a.x;
        vec2 s;
        if (abs(uWhere - 1.0) < 1e-3) {
          float h = 0.5 * uBend * t, sinc = abs(h) < 1e-3 ? 1.0 : sin(h) / h;
          s = t * sinc * vec2(cos(uBase + h), sin(uBase + h));
        } else {
          s = vec2(0.0); float dt = t / 32.0;
          for (int i = 0; i < 32; i++) { float ph = uBase + uBend * pow((float(i) + 0.5) * dt, uWhere); s += dt * vec2(cos(ph), sin(ph)); }
        }
        vec3 P = vec3(uHinge + uSgn * uW * s.x, a.y * uH, uW * s.y);
        vP = P; vT = a; vPhi = uBase + uBend * pow(t, uWhere); vS = uDpr * uEye.z / (uEye.z - P.z);
        gl_Position = project(P);
      }`, `precision highp float;
      uniform sampler2D uF, uB; uniform vec2 uFF, uBF; uniform float uSgn, uBlank, uLift, uH, uSelf, uGloss, uSharp; uniform vec3 uEye, uBlankCol;
      varying vec3 vP; varying vec2 vT; varying float vPhi, vS;
      const vec3 L = vec3(-0.3283, -0.4221, 0.9381);
      void main() {
        vec3 n = vec3(-uSgn * sin(vPhi), 0.0, cos(vPhi)), V = normalize(uEye - vP);
        bool front = dot(n, V) > 0.0;
        vec3 N = front ? n : -n;
        float tf = uSgn > 0.0 ? vT.x : 1.0 - vT.x;
        vec3 c = front ? texture2D(uF, vec2(tf, vT.y) * uFF).rgb : (uBlank > 0.5 ? uBlankCol : texture2D(uB, vec2(1.0 - tf, vT.y) * uBF).rgb);
        float light = dot(N, L) / L.z;
        c *= 1.0 - uSelf * clamp(1.0 - light, 0.0, 1.0);
        c += uGloss * uLift * pow(max(dot(N, normalize(L + V)), 0.0), uSharp);
        float edge = clamp(min(vT.y, 1.0 - vT.y) * uH * vS + 0.5, 0.0, 1.0);
        gl_FragColor = vec4(min(c, 1.0) * edge, edge);
      }`);
    shade = program(`precision highp float;
      attribute vec2 a; uniform vec2 uRect; varying float vX;
      ${PROJECT}
      void main() { vec3 P = vec3(a * uRect, 0.0); vX = P.x; gl_Position = project(P); }`, `precision highp float;
      uniform float uHinge, uW, uL, uR; varying float vX;
      void main() {
        float d = abs(vX - uHinge) / uW;
        float g = d < 0.35 ? mix(0.55, 0.18, d / 0.35) : mix(0.18, 0.0, clamp((d - 0.35) / 0.35, 0.0, 1.0));
        gl_FragColor = vec4(0.0, 0.0, 0.0, (vX < uHinge ? uL : uR) * g);
      }`);
  } catch (err) { console.info("page curl off:", err.message); return null; }
  const COLS = 128, mesh = new Float32Array((COLS + 1) * 4);
  for (let c = 0; c <= COLS; c++) mesh.set([c / COLS, 0, c / COLS, 1], c * 4);
  const buf = (data) => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW); return b; };
  const meshB = buf(mesh), quadB = buf(new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]));
  gl.enableVertexAttribArray(0);
  let view = null;
  return {
    cv,
    get ok() { return !dead && !gl.isContextLost(); },
    tex(src) {
      const t = gl.createTexture(); t.fill = src.fill || [1, 1]; gl.bindTexture(gl.TEXTURE_2D, t);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      if (v2) { gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); }
      else gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
      return t;
    },
    drop: (t) => gl.deleteTexture(t),
    // the canvas covers wherever the sheet can reach (lifted, perspective spreads it), never past the screen's sides
    fit(SW, SH, d, hinge, W) {
      const s = d / (d - W), cx = SW / 2, cy = SH / 2, dpr = DPR();
      const sl = host.getBoundingClientRect().left, vw = document.documentElement.clientWidth;
      const x0 = Math.max(Math.floor(Math.min(0, cx + (hinge - W - cx) * s)) - 2, Math.floor(-sl)), x1 = Math.min(Math.ceil(Math.max(SW, cx + (hinge + W - cx) * s)) + 2, Math.ceil(vw - sl));
      const y0 = Math.floor(cy - cy * s) - 2, y1 = Math.ceil(cy + cy * s) + 2;
      view = { x0, y0, w: x1 - x0, h: y1 - y0 };
      const bw = Math.round(view.w * dpr), bh = Math.round(view.h * dpr);
      if (cv.width !== bw || cv.height !== bh) { cv.width = bw; cv.height = bh; }
      Object.assign(cv.style, { left: x0 + "px", top: y0 + "px", width: view.w + "px", height: view.h + "px" });
    },
    park() { if (cv.width > 1) { cv.width = 1; cv.height = 1; } },   // give back the drawing buffer at rest
    frame(f) {
      gl.viewport(0, 0, cv.width, cv.height); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      const common = (pr) => { gl.useProgram(pr.p); gl.uniform2f(pr.u("uView"), view.w, view.h); gl.uniform2f(pr.u("uOff"), view.x0, view.y0); gl.uniform3f(pr.u("uEye"), f.SW / 2, f.SH / 2, f.d); };
      common(shade);
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.uniform2f(shade.u("uRect"), f.SW, f.SH); gl.uniform1f(shade.u("uHinge"), f.hinge); gl.uniform1f(shade.u("uW"), f.W);
      gl.uniform1f(shade.u("uL"), f.shL); gl.uniform1f(shade.u("uR"), f.shR);
      gl.bindBuffer(gl.ARRAY_BUFFER, quadB); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      if (f.shL + f.shR > 0.002) gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      common(sheet);
      for (const [n, v] of [["uW", f.W], ["uH", f.SH], ["uHinge", f.hinge], ["uSgn", f.sgn], ["uWhere", P.where], ["uSelf", P.self], ["uGloss", P.gloss], ["uSharp", P.sharp], ["uDpr", cv.width / view.w]]) gl.uniform1f(sheet.u(n), v);
      gl.uniform3f(sheet.u("uBlankCol"), 246 / 255, 246 / 255, 246 / 255);   // the back of a single page: the cloud ground
      gl.uniform1i(sheet.u("uF"), 0); gl.uniform1i(sheet.u("uB"), 1);
      gl.bindBuffer(gl.ARRAY_BUFFER, meshB); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      for (const o of f.sheets) {   // the lowest first
        for (const [n, v] of [["uBase", o.base], ["uBend", o.bend], ["uLift", o.lift], ["uBlank", o.B ? 0 : 1]]) gl.uniform1f(sheet.u(n), v);
        gl.uniform3f(sheet.u("uEye"), f.SW / 2, f.SH / 2, o.eye ?? f.d);
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, o.F);
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, o.B || o.F);
        gl.uniform2fv(sheet.u("uFF"), o.F.fill); gl.uniform2fv(sheet.u("uBF"), (o.B || o.F).fill);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, (COLS + 1) * 2);
      }
    }
  };
}

// ── one magazine: a track of slides, its arrows and its pager ──────────────────────────────────────────────────────
export function initCurl() {
  for (const stage of document.querySelectorAll("[data-curl]")) magazine(stage);
}

function magazine(stage) {
  const name = stage.dataset.curl;
  const slides = [...stage.querySelectorAll("[data-slide]")];
  const N = slides.length;
  if (N < 2) return;
  const prevB = document.querySelector(`[data-prev="${name}"]`), nextB = document.querySelector(`[data-next="${name}"]`);
  const dots = [...(stage.closest("section")?.querySelectorAll("[data-go]") || [])];
  const S = { i: 0, busy: false, run: null };
  const GL = makeGL(stage);
  if (GL) stage.append(GL.cv);

  // the layout: a spread from L (the slide's text and photo side by side), else one page
  const spread = () => slides[0].querySelector(".featured__media").getBoundingClientRect().left > slides[0].getBoundingClientRect().left + 1;
  const part = (i, at) => at === "f" ? slides[i] : slides[i].querySelector(at === "l" ? ".featured__text" : ".featured__media");
  const size = () => { const r = stage.getBoundingClientRect(); return [r.width, r.height]; };

  // the slide at rest: the current one shown, the others off and out of reach
  function rest(i) {
    S.i = i;
    delete stage.dataset.turning;
    for (const e of stage.querySelectorAll("[data-part]")) { e.removeAttribute("data-part"); e.style.opacity = ""; e.style.zIndex = ""; e.style.visibility = ""; }
    slides.forEach((s, k) => { s.toggleAttribute("data-off", k !== i); s.inert = k !== i; });
    GL?.park();
    dots.forEach((d, k) => d.setAttribute("aria-current", String(k === i)));
    prevB?.setAttribute("aria-disabled", String(i === 0)); nextB?.setAttribute("aria-disabled", String(i === N - 1));
    warm();
  }

  // the faces, as textures, the most recently used last; idle time prepares the next ones
  const TEX = new Map();
  const faceKey = (i, at) => [i, at, ...size().map((v) => v.toFixed(2)), DPR()].join("|");
  const keep = (key, t) => {
    const old = TEX.get(key); if (old) { TEX.delete(key); GL.drop(old); }
    TEX.set(key, t);
    while (TEX.size > 6) { const [k, o] = TEX.entries().next().value; TEX.delete(k); GL.drop(o); }
    return t;
  };
  // the part laid out where it is, painted while the page does not show it (its slide is off: visibility only)
  function face(i, at) {
    const key = faceKey(i, at), hit = TEX.get(key);
    if (hit) { TEX.delete(key); TEX.set(key, hit); return hit; }
    let cv = null;
    try { cv = paintPart(part(i, at), DPR()); } catch { /* a part that can't be painted: the turn falls back to a plain change */ }
    return cv ? keep(key, GL.tex(cv)) : null;
  }
  const images = (i) => Promise.all([...slides[i].querySelectorAll("img")].map((im) => { im.loading = "eager"; return im.decode().catch(() => {}); }));
  let ready = false;
  document.fonts.ready.then(() => { ready = true; warm(); });
  // the parts a turn shows on its sheet (front, back) and under it
  const faces = (from, to, dir, sgl) => sgl ? [[dir > 0 ? from : to, "f"]] : dir > 0 ? [[from, "r"], [to, "l"]] : [[from, "l"], [to, "r"]];
  const unders = (from, to, dir, sgl) => sgl ? [[dir > 0 ? to : from, "f"]] : [[dir > 0 ? from : to, "l"], [dir > 0 ? to : from, "r"]];
  function warm() {
    if (!GL || !ready || S.run) return;
    const i = S.i, sgl = !spread();
    const jobs = [1, -1].filter((d) => i + d >= 0 && i + d < N).flatMap((d) => faces(i, i + d, d, sgl));
    const next = async () => {
      if (S.run || S.i !== i || !GL.ok) return;
      const j = jobs.shift(); if (!j) return;
      await images(j[0]);
      if (S.run || S.i !== i) return;
      face(...j);
      idle(next);
    };
    idle(next);
  }

  // the turn from → to (dir +1 forward, −1 back) as render(p), p from 0 to 1; null if it can't be drawn
  const FADE = 0.5;
  function curlGL(from, to, dir) {
    if (!GL || !GL.ok || !ready) return null;
    const sgl = !spread(), fwd = dir > 0, n = Math.abs(to - from);
    const specs = Array.from({ length: n }, (_, k) => faces(from + dir * k, from + dir * (k + 1), dir, sgl));
    const tex = specs.map((spec) => spec.map((j) => face(...j)));
    if (tex.some(([F, B = null]) => !F || (!sgl && !B))) return null;
    // what the page shows meanwhile: the parts under the sheet, and the page where it starts and where it lands
    stage.dataset.turning = "";
    const under = {};
    for (const [i, at] of unders(from, to, dir, sgl)) { const e = part(i, at); e.dataset.part = "show"; e.style.zIndex = "1"; under[at] = e; }
    const page = ([i, at]) => { const e = part(i, at); e.dataset.part = "show"; e.style.zIndex = "2"; return e; };
    const s0 = !sgl || fwd ? specs[0][0] : null, s1 = !sgl ? specs[n - 1][1] : !fwd ? [to, "f"] : null;
    const first = s0 && page(s0), last = s1 && page(s1);
    const [SW, SH] = size(), W = sgl ? SW : SW / 2, hinge = sgl ? 0 : W, sgn = fwd || sgl ? 1 : -1;
    const eye = () => Math.max(P.perspective * P.depth, 1.5 * W);
    const d = eye();
    GL.fit(SW, SH, d, hinge, W);
    // the perspective grows with the lift (calm ends): near the ends the sheet only ever moves towards the spine
    const eyeAt = (q) => d / Math.max(Math.pow(Math.sin(q * Math.PI), 2 * P.calm), 1e-4);
    const corner = (q) => {
      const [b, D] = bendAt(q), [x, z] = sheetAt(b, D, 1), e = eyeAt(q);
      const X = hinge + sgn * W * x, Z = W * z, k = e / (e - Z);
      return [SW / 2 + (X - SW / 2) * k, SH / 2 - (SH / 2) * k];
    };
    const qOf = (p) => fold(sgl && !fwd ? 1 - p : p), c0 = corner(qOf(0)), c1 = corner(qOf(1));
    const away = (c, o) => Math.hypot(c[0] - o[0], c[1] - o[1]);
    const e0 = ease();
    return (p) => {
      let shL = 0, shR = 0;
      const sheets = local(p, n, e0).map((e, k) => {
        const q = qOf(e), [base, bend] = bendAt(q), lift = Math.sin(q * Math.PI);
        if (sgl) shR = Math.max(shR, P.cast * 6 / 7 * lift * (1 - q * 0.6));
        else {   // the page about to be covered darkens first, then the one the sheet lands on
          const early = P.cast * lift * smooth(0.62, 0.48, q), late = P.cast * lift * smooth(0.48, 0.62, q);
          shL = Math.max(shL, fwd ? late : early); shR = Math.max(shR, fwd ? early : late);
        }
        return { q, base, bend, lift, eye: eyeAt(q), s: sgl && !fwd ? n - k : k + 1, F: tex[k][0], B: tex[k][1] || null };
      });
      // which sheet over which: the nearer to upright, the higher; lying on the same pile, in the pile's order
      const mid = (o) => o.base + o.bend * Math.pow(0.5, P.where), up = (o) => Math.abs(mid(o) - Math.PI / 2);
      const order = [...sheets].sort((a, b) => up(b) - up(a) || (mid(a) < Math.PI / 2 ? b.s - a.s : a.s - b.s));
      GL.frame({ SW, SH, d, W, hinge, sgn, shL, shR, sheets: order });
      // the first sheet to move hands over from the page it starts as, the last to land to the page it lands as
      const ca = corner(sheets[0].q), cb = corner(sheets[n - 1].q);
      const o0 = first ? 1 - smooth(0, FADE, away(ca, c0)) : 0, o1 = last ? 1 - smooth(0, FADE, away(cb, c1)) : 0;
      if (first) first.style.opacity = o0;
      if (last) last.style.opacity = o1;
      GL.cv.style.visibility = o0 >= 1 || o1 >= 1 ? "hidden" : "";
      for (const k in under) under[k].style.visibility = (o0 >= 1 && s0[1] === k) || (o1 >= 1 && s1[1] === k) ? "hidden" : "";
    };
  }

  // a jump over n coffees: n sheets, each over D ms, the next one starting gap ms after it; T for the whole of it
  const jumpTimes = (n) => { const D = P.dur * (n > 1 ? JUMP["k" + Math.min(n, 4)] : 1), gap = n > 1 ? JUMP.gap : 0; return { D, gap, T: D + (n - 1) * gap }; };
  function local(p, n, e0) {
    if (n === 1) return [p];
    const { D, gap, T } = S.jt;
    return Array.from({ length: n }, (_, k) => e0(clamp((p * T - k * gap) / D, 0, 1)));
  }
  function tween(p0, p1, ms, ez, done) {
    const t0 = performance.now(), r = S.run;
    S.busy = true;
    const step = (now) => {
      const t = ms ? Math.min(1, (now - t0) / ms) : 1;
      r.p = p0 + (p1 - p0) * ez(t); r.render(r.p);
      if (t < 1) requestAnimationFrame(step); else { S.busy = false; done(); }
    };
    requestAnimationFrame(step);
  }
  const begin = (to, dir) => {
    const render = curlGL(S.i, to, dir);
    if (!render) return false;
    S.run = { from: S.i, to, dir, render, p: 0 };
    render(0);
    return true;
  };
  async function go(to) {
    if (S.busy || S.run || to === S.i || to < 0 || to >= N) return;
    const dir = to > S.i ? 1 : -1, n = Math.abs(to - S.i);
    if (reduced.matches || !GL) return rest(to);
    S.busy = true;
    const steps = Array.from({ length: n + 1 }, (_, k) => S.i + dir * k);
    await Promise.race([Promise.all(steps.map(images)), new Promise((ok) => setTimeout(ok, 400))]);
    S.busy = false;
    S.jt = jumpTimes(n);
    if (!begin(to, dir)) return rest(to);
    tween(0, 1, S.jt.T, n > 1 ? (x) => x : ease(), () => { const t = S.run.to; S.run = null; rest(t); });
  }

  // drag: the turn follows the pointer, from where the drag was recognised; it eases in over the first part of the
  // way (a page lifting towards the viewer grows away from the spine, against the hand)
  const EASE_IN = 0.1;
  const gentle = (r) => (r < EASE_IN ? (r * r) / (2 * EASE_IN) : r - EASE_IN / 2) / (1 - EASE_IN / 2);
  let drag = null, dragged = false;
  stage.addEventListener("pointerdown", (e) => {
    dragged = false;
    if (S.busy || S.run || e.button > 0) return;
    drag = { x: e.clientX, y: e.clientY, id: e.pointerId, started: false, t: performance.now(), vx: 0, lx: e.clientX };
  });
  stage.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.started) {
      if (Math.abs(dx) < 6 || Math.abs(dx) < Math.abs(dy)) { if (Math.abs(dy) > 10) drag = null; return; }
      const dir = dx < 0 ? 1 : -1, to = S.i + dir;
      drag.started = true; dragged = true; drag.edge = to < 0 || to >= N; drag.dir = dir; drag.x0 = e.clientX;
      stage.setPointerCapture?.(e.pointerId); stage.dataset.dragging = "";
      // no turn to draw (no WebGL, «reduce motion»): the swipe still changes the slide, at once, when it lets go
      drag.plain = !drag.edge && (reduced.matches || !(S.jt = jumpTimes(1), begin(to, dir)));
    }
    if (drag.plain) { drag.r = clamp((-(e.clientX - drag.x0) * drag.dir) / (stage.clientWidth * 0.8), 0, 1); return; }
    // at the first or the last coffee there is nothing to turn to: the slide only gives a little, and springs back
    if (drag.edge) { const s = slides[S.i]; s.style.transition = "none"; s.style.transform = `translateX(${Math.tanh(dx / 300) * 24}px)`; return; }
    const now = performance.now();
    drag.vx = 0.7 * drag.vx + 0.3 * ((e.clientX - drag.lx) / Math.max(1, now - drag.t)); drag.lx = e.clientX; drag.t = now;
    const span = stage.clientWidth * (spread() ? 0.6 : 0.8);
    drag.r = clamp((-(e.clientX - drag.x0) * drag.dir) / span, 0, 1);
    S.run.p = gentle(drag.r); S.run.render(S.run.p);
  });
  const release = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag; drag = null; delete stage.dataset.dragging;
    if (d.started && d.edge) { const s = slides[S.i]; s.style.transition = "transform var(--t-out) var(--ease-out)"; s.style.transform = ""; return; }
    if (d.started && d.plain) { if ((d.r || 0) > 0.15) rest(S.i + d.dir); return; }
    if (!d.started || !S.run) return;
    const p = S.run.p, flick = -d.vx * d.dir > 0.45;
    const finish = (d.r || 0) > 0.33 || (flick && (d.r || 0) > 0.05);
    const ms = P.dur * (finish ? Math.max(0.35, 1 - p) : Math.max(0.3, p));
    tween(p, finish ? 1 : 0, ms, OUT, () => { const t = finish ? S.run.to : S.run.from; S.run = null; rest(t); });
  };
  stage.addEventListener("pointerup", release); stage.addEventListener("pointercancel", release);
  // the browser's own drag of the slide's link or photo would take the pointer away from the turn
  stage.addEventListener("dragstart", (e) => e.preventDefault());
  // a drag is not a click: the slide's link stays where it is
  stage.addEventListener("click", (e) => { if (dragged) { e.preventDefault(); e.stopPropagation(); } dragged = false; }, true);

  prevB?.addEventListener("click", () => prevB.getAttribute("aria-disabled") === "true" || go(S.i - 1));
  nextB?.addEventListener("click", () => nextB.getAttribute("aria-disabled") === "true" || go(S.i + 1));
  dots.forEach((b) => b.addEventListener("click", () => go(Number(b.dataset.go))));
  // a new size: the faces painted for the old one are of no use
  new ResizeObserver(() => { if (!S.run) { for (const t of TEX.values()) GL?.drop(t); TEX.clear(); warm(); } }).observe(stage);
  rest(0);
  // for review in the console: document.querySelector("[data-curl]").qqCurl — go(i), hold(to, p) stops a turn at p
  // (0 → 1), hold() puts the slide back
  const hold = (to, p) => {
    if (to == null) { if (S.run) { const f = S.run.from; S.run = null; rest(f); } return; }
    if (!S.run) { S.jt = jumpTimes(Math.abs(to - S.i)); if (!begin(to, to > S.i ? 1 : -1)) return; }
    S.run.p = p; S.run.render(p);
  };
  stage.qqCurl = { go, hold, settings: P };
}
