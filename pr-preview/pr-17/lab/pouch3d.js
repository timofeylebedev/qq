/*!
 * pouch3d — one WebGL canvas that draws many coffee pouches into ordinary DOM slots.
 *
 * Built for long catalog pages on weak devices:
 *   - one WebGL context and one canvas for the whole page, however many packs there are
 *   - one shared mesh (2,880 triangles) and two shared effect maps; only the label art differs per pack
 *   - nothing is drawn unless something changed (scroll, resize, pointer, a running animation)
 *   - only packs near the viewport are drawn; their art is loaded on demand and evicted when far away
 *   - the canvas travels with the page between frames, so packs stay glued to their cards
 *     even when the main thread drops frames during a fling
 *
 * No dependencies.  Usage:
 *
 *   const stage = await Pouch3D.createStage({ assets: 'assets/' });
 *   const pack  = stage.add(document.querySelector('.slot'), {
 *     front: 'assets/sumatra-front-512.webp',
 *     back:  'assets/sumatra-back-512.webp',
 *   });
 *   pack.ry = 0.4;            // radians; rx, ry, scale, lift, shadow are plain numbers
 *   stage.invalidate();       // ask for one redraw
 *   stage.onTick = (dt) => { ...animate packs...; return stillMoving; };
 */
(function (root) {
  'use strict';

  var PACK_H = 1717 / 1176;          // mesh height in units (width = 1)
  var CAM_DIST = 6.0;                // camera distance in units: a long lens, like a product shot
  var L0 = norm3([-0.15, 0.75, 0.65]); // the light the studio photo was shot with (top, a little left, frontal)

  // ---------------------------------------------------------------- shaders
  var PACK_VS = [
    'attribute vec3 aPos; attribute vec3 aNor; attribute vec2 aUv; attribute float aSide;',
    'uniform mat4 uMVP; uniform vec3 uLight; uniform vec3 uEye; uniform float uDepth;',
    'varying vec2 vUv; varying vec3 vN; varying vec3 vL; varying vec3 vV; varying float vFx;',
    'void main(){',
    '  vec3 p = vec3(aPos.xy, aPos.z * uDepth);',
    '  vec3 n = normalize(vec3(aNor.xy * uDepth, aNor.z));',
    // The back panel is shaded in its own mirrored frame, so one set of maps serves both sides.
    '  float sd = aSide < 0.0 ? -1.0 : 1.0;',
    '  vec3 s = vec3(sd, 1.0, sd);',
    '  vUv = aUv; vN = n * s; vL = uLight * s; vV = (uEye - p) * s;',
    '  vFx = abs(aSide);',                      // 0 on the bottom gusset: plain dark film, no photo effects
    '  gl_Position = uMVP * vec4(p, 1.0);',
    '}'
  ].join('\n');

  // Colour maths is the Photoshop mockup: art x light layer (multiply 50%), then dark layer on top (screen).
  // On top of that, the wrinkle normals shift the shading by the *difference* between the current light
  // and the light in the photo — so a pack at rest is the approved mockup, and it only departs from it as it moves.
  var PACK_FS = [
    'precision mediump float;',
    'uniform sampler2D uArt; uniform sampler2D uRelief; uniform sampler2D uGloss;',
    'uniform vec3 uL0; uniform vec3 uH0; uniform vec4 uK;', // uK = relief, light response, sheen, rim
    'varying vec2 vUv; varying vec3 vN; varying vec3 vL; varying vec3 vV; varying float vFx;',
    'void main(){',
    '  vec3 art = texture2D(uArt, vUv).rgb;',
    '  vec3 rl  = texture2D(uRelief, vUv).rgb;',
    '  float gl = texture2D(uGloss, vUv).r;',
    '  vec3 n = normalize(vec3(vN.xy + (rl.xy - 0.5) * uK.x * vFx, vN.z));',
    '  vec3 v = normalize(vV);',
    '  vec3 h = normalize(vL + v);',
    '  float dNow = dot(n, vL), dRest = dot(n, uL0);',
    '  float sNow = pow(max(dot(n, h), 0.0), 24.0), sRest = pow(max(dot(n, uH0), 0.0), 24.0);',
    '  float rim  = pow(1.0 - max(dot(n, v), 0.0), 3.0) - pow(1.0 - max(n.z, 0.0), 3.0);',
    '  float mul  = max(mix(0.45 + 0.4 * dNow, 0.5 + 0.5 * rl.b + uK.y * (dNow - dRest), vFx), 0.06);',
    '  float scr  = clamp(1.15 * gl + uK.z * (sNow - sRest) + uK.w * max(rim, 0.0), 0.0, 1.0) * vFx;',
    '  vec3 c = art * mul;',
    '  c += scr * (1.0 - c);',
    '  gl_FragColor = vec4(c, 1.0);',
    '}'
  ].join('\n');

  var SHADOW_VS = [
    'attribute vec2 aQuad;',
    'uniform mat4 uVP; uniform vec4 uRect; uniform float uPad;', // uRect = centre xy, half size xy
    'varying vec2 vQ; varying vec2 vB;',
    'void main(){',
    '  vB = uRect.zw;',
    '  vQ = aQuad * (uRect.zw + uPad);',
    '  gl_Position = uVP * vec4(uRect.xy + vQ, -0.22, 1.0);',
    '}'
  ].join('\n');

  // Two soft boxes: a tight contact shadow and a wide ambient one. No texture, no blur pass.
  var SHADOW_FS = [
    'precision mediump float;',
    'uniform vec3 uSh;', // contact softness, ambient softness, opacity
    'varying vec2 vQ; varying vec2 vB;',
    'float box(vec2 p, vec2 b, float s){',
    '  vec2 a = smoothstep(-b - s, -b + s, p) - smoothstep(b - s, b + s, p);',
    '  return a.x * a.y;',
    '}',
    'void main(){',
    '  float a = 0.55 * box(vQ, vB, uSh.x) + 0.45 * box(vQ - vec2(0.05, -0.07), vB * 0.96, uSh.y);',
    '  gl_FragColor = vec4(0.0, 0.0, 0.0, a * uSh.z);',
    '}'
  ].join('\n');

  // ---------------------------------------------------------------- small helpers
  function norm3(v) { var l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }

  function compile(gl, vs, fs, attribs) {
    function sh(type, src) {
      var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error('pouch3d shader: ' + gl.getShaderInfoLog(s));
      return s;
    }
    var p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
    attribs.forEach(function (name, i) { gl.bindAttribLocation(p, i, name); });
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('pouch3d link: ' + gl.getProgramInfoLog(p));
    var u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (var i = 0; i < n; i++) { var info = gl.getActiveUniform(p, i); u[info.name] = gl.getUniformLocation(p, info.name); }
    return { program: p, u: u };
  }

  /** Minimal .glb reader: float32 POSITION / NORMAL / TEXCOORD_0 and uint16 indices, as written by build_mesh.py. */
  function parseGLB(buf) {
    var dv = new DataView(buf);
    if (dv.getUint32(0, true) !== 0x46546C67) throw new Error('pouch3d: not a .glb file');
    var jsonLen = dv.getUint32(12, true);
    var json = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 20, jsonLen)));
    var binStart = 20 + jsonLen + 8;
    function acc(i, Type, size) {
      var a = json.accessors[i], bv = json.bufferViews[a.bufferView];
      return new Type(buf.slice(binStart + (bv.byteOffset || 0) + (a.byteOffset || 0), binStart + (bv.byteOffset || 0) + (a.byteOffset || 0) + a.count * size * Type.BYTES_PER_ELEMENT));
    }
    var verts = [], indices = [], ranges = {}, base = 0;
    json.meshes[0].primitives.forEach(function (prim) {
      var name = json.materials[prim.material].name;
      var P = acc(prim.attributes.POSITION, Float32Array, 3), N = acc(prim.attributes.NORMAL, Float32Array, 3);
      var T = acc(prim.attributes.TEXCOORD_0, Float32Array, 2), I = acc(prim.indices, Uint16Array, 1);
      var side = name === 'back' ? -1 : name === 'front' ? 1 : 0, count = P.length / 3;
      for (var k = 0; k < count; k++) verts.push(P[3 * k], P[3 * k + 1], P[3 * k + 2], N[3 * k], N[3 * k + 1], N[3 * k + 2], T[2 * k], T[2 * k + 1], side);
      ranges[name] = { start: indices.length, count: I.length };
      for (var j = 0; j < I.length; j++) indices.push(I[j] + base);
      base += count;
    });
    // Reorder to front | gusset | back so "front + gusset" and "gusset + back" are each one draw call.
    var order = ['front', 'gusset', 'back'], out = [], r2 = {};
    order.forEach(function (nme) { var r = ranges[nme]; r2[nme] = { start: out.length, count: r.count }; for (var j = 0; j < r.count; j++) out.push(indices[r.start + j]); });
    return { vertices: new Float32Array(verts), indices: new Uint16Array(out), ranges: r2, triangles: out.length / 3 };
  }

  // ---------------------------------------------------------------- stage
  function createStage(opts) {
    opts = opts || {};
    var assets = opts.assets || 'assets/';
    var overscan = opts.overscan == null ? 0.12 : opts.overscan;   // extra canvas above and below the viewport
    var maxDpr = opts.maxDpr || 2;
    // label textures kept on the GPU before the least recently drawn are dropped; smaller on low-memory phones
    var texBudget = (opts.textureBudgetMB || (navigator.deviceMemory && navigator.deviceMemory <= 4 ? 48 : 96)) * 1048576;

    var canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:absolute;left:0;top:0;pointer-events:none;will-change:transform;z-index:' + (opts.zIndex == null ? 5 : opts.zIndex);
    (opts.parent || document.body).appendChild(canvas);

    // Multisampling is worth most on low-density screens and costs most on big dense ones — pick once, up front.
    var estPixels = innerWidth * innerHeight * (1 + 2 * overscan) * Math.pow(Math.min(devicePixelRatio || 1, maxDpr), 2);
    var attrs = { alpha: true, premultipliedAlpha: true, antialias: estPixels <= 4.5e6, depth: true, stencil: false, powerPreference: 'default', preserveDrawingBuffer: !!opts.preserveDrawingBuffer };
    var gl = canvas.getContext('webgl2', attrs), isGL2 = !!gl;
    if (!gl) gl = canvas.getContext('webgl', attrs);
    if (!gl) { canvas.remove(); return Promise.reject(new Error('WebGL is not available')); }

    var items = [], meshData = null, res = null, texCache = new Map(), texBytes = 0;
    var dirty = true, rafId = 0, lastT = 0, frameNo = 0, lost = false;
    var dpr = 1, dprCap = maxDpr, cssW = 0, cssH = 0, canvasTop = 0, slowFrames = 0, adapt = { on: opts.adaptive !== false, trial: null };
    var mvp = new Float32Array(16), vp = new Float32Array(16);
    var stats = { fps: 0, cpuMs: 0, visible: 0, drawCalls: 0, triangles: 0, textures: 0, textureMB: 0, dpr: 1, msaa: attrs.antialias, webgl: isGL2 ? 2 : 1, pixels: 0 };

    var stage = {
      canvas: canvas, gl: gl, items: items, stats: stats,
      look: { depth: 1.0, relief: 2.0, light: 0.75, sheen: 0.35, rim: 0.10, shadow: 0.38 },
      onTick: null,
      add: add, remove: remove, invalidate: invalidate, measure: measure, destroy: destroy
    };

    // ---- GPU resources (re-created after a context loss)
    function initGL() {
      res = {};
      res.pack = compile(gl, PACK_VS, PACK_FS, ['aPos', 'aNor', 'aUv', 'aSide']);
      res.shadow = compile(gl, SHADOW_VS, SHADOW_FS, ['aQuad']);
      res.vbo = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, res.vbo); gl.bufferData(gl.ARRAY_BUFFER, meshData.vertices, gl.STATIC_DRAW);
      res.ibo = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, res.ibo); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, meshData.indices, gl.STATIC_DRAW);
      res.quad = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, res.quad); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      res.aniso = gl.getExtension('EXT_texture_filter_anisotropic');
      res.blank = solidTexture([58, 58, 60]);
      texCache.clear(); texBytes = 0;
      res.relief = texture(assets + 'relief.jpg', { pinned: true, flat: [128, 128, 200] });
      res.gloss = texture(assets + 'gloss.jpg', { pinned: true, flat: [20, 20, 20] });
      gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.clearColor(0, 0, 0, 0);
      gl.depthFunc(gl.LEQUAL);
      gl.cullFace(gl.BACK);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    }

    function solidTexture(rgb) {
      var t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array(rgb));
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      return t;
    }

    /** Cached, lazily loaded texture. `key` lets two packs keep separate GPU copies of the same file. */
    function texture(url, o) {
      o = o || {};
      var key = o.key || url, e = texCache.get(key);
      if (e) { e.used = frameNo; return e; }
      e = { tex: o.flat ? solidTexture(o.flat) : res.blank, ready: false, used: frameNo, bytes: 0, pinned: !!o.pinned, own: !!o.flat };
      texCache.set(key, e);
      var epoch = res;
      decode(url).then(function (img) {
        if (lost || epoch !== res || texCache.get(key) !== e) { if (img.close) img.close(); return; }
        var t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        var w = img.width, h = img.height, pot = (w & (w - 1)) === 0 && (h & (h - 1)) === 0;
        if (isGL2 || pot) {
          gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
          if (res.aniso) gl.texParameterf(gl.TEXTURE_2D, res.aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(4, gl.getParameter(res.aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
        } else gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        if (e.own) gl.deleteTexture(e.tex);
        e.tex = t; e.own = true; e.ready = true; e.bytes = Math.round(w * h * 4 * (isGL2 || pot ? 1.334 : 1));
        texBytes += e.bytes;
        if (img.close) img.close();
        invalidate();
      }).catch(function (err) { console.warn('pouch3d: could not load', url, err); });
      return e;
    }

    function decode(url) {
      function viaImg() { return new Promise(function (ok, bad) { var im = new Image(); im.decoding = 'async'; im.onload = function () { ok(im); }; im.onerror = function () { bad(new Error('image failed: ' + url)); }; im.src = url; }); }
      // Decode off the main thread where possible, so new packs scrolling in do not stall the frame.
      if (root.createImageBitmap && root.fetch) {
        return fetch(url).then(function (r) { if (!r.ok) throw new Error(r.status + ' ' + url); return r.blob(); })
          .then(function (b) { return createImageBitmap(b, { premultiplyAlpha: 'none', colorSpaceConversion: 'none' }); })
          .catch(viaImg);
      }
      return viaImg();
    }

    function evict() {
      if (texBytes <= texBudget) return;
      var old = [];
      texCache.forEach(function (e, key) { if (!e.pinned && e.ready && e.used < frameNo) old.push([key, e]); });
      old.sort(function (a, b) { return a[1].used - b[1].used; });
      for (var i = 0; i < old.length && texBytes > texBudget * 0.8; i++) {
        gl.deleteTexture(old[i][1].tex); texBytes -= old[i][1].bytes; texCache.delete(old[i][0]);
      }
    }

    // ---- slots
    function add(el, art) {
      var it = {
        el: el, front: art.front, back: art.back || art.front, key: art.key || '',
        rx: 0, ry: 0, scale: 1, lift: 0, shadow: 1, fit: art.fit || 0.80, visible: false,
        x: 0, y: 0, w: 0, h: 0
      };
      items.push(it); measureOne(it); invalidate();
      return it;
    }
    function remove(it) { var i = items.indexOf(it); if (i >= 0) items.splice(i, 1); invalidate(); }

    function measureOne(it) {
      var r = it.el.getBoundingClientRect();
      it.x = r.left + scrollX; it.y = r.top + scrollY; it.w = r.width; it.h = r.height;
    }
    /** Re-read slot positions. Called on resize; call it yourself after changing the layout. */
    function measure() { for (var i = 0; i < items.length; i++) measureOne(items[i]); invalidate(); }

    function invalidate() { dirty = true; if (!rafId && !lost) rafId = requestAnimationFrame(frame); }

    // ---- canvas placement: viewport-sized plus an overscan band, moved to the scroll position every frame
    function place() {
      var vw = document.documentElement.clientWidth, vh = Math.min(innerHeight, 2400);
      // page height from the content itself: the canvas must never be what keeps the page tall
      var docH = Math.max(Math.ceil(document.body.getBoundingClientRect().bottom + scrollY), vh);
      var h = Math.min(Math.round(vh * (1 + 2 * overscan)), docH);
      var top = Math.max(0, Math.min(Math.round(scrollY - vh * overscan), docH - h));
      var d = Math.min(devicePixelRatio || 1, dprCap);
      var budget = 9e6;                                             // hard cap on backing-store pixels
      if (vw * h * d * d > budget) d = Math.sqrt(budget / (vw * h));
      if (vw !== cssW || h !== cssH || d !== dpr) {
        cssW = vw; cssH = h; dpr = d;
        canvas.width = Math.max(1, Math.round(vw * d)); canvas.height = Math.max(1, Math.round(h * d));
        canvas.style.width = vw + 'px'; canvas.style.height = h + 'px';
        stats.dpr = Math.round(d * 100) / 100; stats.pixels = canvas.width * canvas.height;
      }
      if (top !== canvasTop || !canvas.style.transform) { canvasTop = top; canvas.style.transform = 'translate3d(0,' + top + 'px,0)'; }
    }

    // ---- matrices (column-major, no allocation per frame)
    function setMVP(out, f, aspect, near, far, it) {
      var cx = Math.cos(it.rx), sx = Math.sin(it.rx), cy = Math.cos(it.ry), sy = Math.sin(it.ry), s = it.scale;
      var A = (far + near) / (near - far), B = 2 * far * near / (near - far), fx = f / aspect, tz = -CAM_DIST + it.lift;
      // model rotation R = Rx * Ry, columns c0 c1 c2
      var r00 = cy * s, r10 = sx * sy * s, r20 = -cx * sy * s;
      var r01 = 0, r11 = cx * s, r21 = sx * s;
      var r02 = sy * s, r12 = -sx * cy * s, r22 = cx * cy * s;
      out[0] = fx * r00; out[1] = f * r10; out[2] = A * r20; out[3] = -r20;
      out[4] = fx * r01; out[5] = f * r11; out[6] = A * r21; out[7] = -r21;
      out[8] = fx * r02; out[9] = f * r12; out[10] = A * r22; out[11] = -r22;
      out[12] = 0; out[13] = 0; out[14] = A * tz + B; out[15] = -tz;
    }
    function setVP(out, f, aspect, near, far) {
      var A = (far + near) / (near - far), B = 2 * far * near / (near - far);
      out.fill(0); out[0] = f / aspect; out[5] = f; out[10] = A; out[11] = -1; out[14] = -A * CAM_DIST + B; out[15] = CAM_DIST;
    }

    // ---- one frame
    function frame(now) {
      rafId = 0;
      if (lost) return;
      var t0 = performance.now();
      var interval = lastT ? now - lastT : 0;
      var dt = interval > 0 && interval < 250 ? Math.min(interval / 1000, 0.05) : 1 / 60;   // first frame after idling
      lastT = now; frameNo++;

      var moving = stage.onTick ? stage.onTick(dt, now) === true : false;
      place();

      var pad = 1.5, near = CAM_DIST - 2.5, far = CAM_DIST + 2.5;
      var look = stage.look, calls = 0, vis = 0, tris = 0, H = canvas.height, i, it;
      gl.viewport(0, 0, canvas.width, H);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      // which slots are on the canvas?
      for (i = 0; i < items.length; i++) {
        it = items[i];
        var mY = it.h * (pad - 1) * 0.5;
        it.visible = it.w > 0 && it.y + it.h + mY > canvasTop && it.y - mY < canvasTop + cssH;
        if (it.visible) vis++;
      }

      function viewportFor(it) {
        var w = it.w * pad, h = it.h * pad;
        var x = (it.x - (w - it.w) / 2) * dpr, yTop = (it.y - canvasTop - (h - it.h) / 2) * dpr;
        gl.viewport(Math.round(x), Math.round(H - yTop - h * dpr), Math.round(w * dpr), Math.round(h * dpr));
        // world height seen through this viewport, so the pack fills `fit` of the slot's height (or width, if narrower)
        var slotFit = Math.min(it.h, it.w * PACK_H) * it.fit;
        it._hw = pad * it.h * PACK_H / slotFit;
        it._f = 2 * CAM_DIST / it._hw; it._aspect = w / h;
      }

      // pass 1: shadows (blended, no depth)
      if (look.shadow > 0.001 && vis) {
        var sp = res.shadow;
        gl.useProgram(sp.program); gl.enable(gl.BLEND); gl.disable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE); gl.depthMask(false);
        gl.bindBuffer(gl.ARRAY_BUFFER, res.quad);
        gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
        gl.disableVertexAttribArray(1); gl.disableVertexAttribArray(2); gl.disableVertexAttribArray(3);
        gl.uniform1f(sp.u.uPad, 0.50);
        for (i = 0; i < items.length; i++) {
          it = items[i]; if (!it.visible || it.shadow <= 0.001) continue;
          viewportFor(it); setVP(vp, it._f, it._aspect, near, far);
          var cy = Math.abs(Math.cos(it.ry)), sy = Math.abs(Math.sin(it.ry)), cx = Math.abs(Math.cos(it.rx)), sx = Math.abs(Math.sin(it.rx));
          var hw = (0.5 * cy + 0.15 * look.depth * sy) * it.scale * 0.94, hh = (PACK_H * 0.5 * cx + 0.15 * look.depth * sx) * it.scale * 0.96;
          var far2 = 1 + it.lift * 2.2;                             // a lifted pack throws a longer, softer shadow
          gl.uniformMatrix4fv(sp.u.uVP, false, vp);
          gl.uniform4f(sp.u.uRect, 0.07 * far2, -0.09 * far2, hw, hh);
          gl.uniform3f(sp.u.uSh, 0.06 * far2, 0.34 * far2, look.shadow * it.shadow / Math.sqrt(far2));
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); calls++;
        }
        gl.depthMask(true);
      }

      // pass 2: packs (opaque)
      if (vis) {
        var pp = res.pack, R = meshData.ranges, H0 = norm3([L0[0], L0[1], L0[2] + 1]);
        gl.useProgram(pp.program); gl.disable(gl.BLEND); gl.enable(gl.DEPTH_TEST); gl.enable(gl.CULL_FACE);
        gl.bindBuffer(gl.ARRAY_BUFFER, res.vbo); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, res.ibo);
        for (var a = 0; a < 4; a++) gl.enableVertexAttribArray(a);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 36, 0); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 36, 12);
        gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 36, 24); gl.vertexAttribPointer(3, 1, gl.FLOAT, false, 36, 32);
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, res.relief.tex);
        gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, res.gloss.tex);
        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(pp.u.uArt, 0); gl.uniform1i(pp.u.uRelief, 1); gl.uniform1i(pp.u.uGloss, 2);
        gl.uniform3f(pp.u.uL0, L0[0], L0[1], L0[2]); gl.uniform3f(pp.u.uH0, H0[0], H0[1], H0[2]);
        gl.uniform4f(pp.u.uK, look.relief, look.light, look.sheen, look.rim);
        gl.uniform1f(pp.u.uDepth, look.depth);
        for (i = 0; i < items.length; i++) {
          it = items[i]; if (!it.visible) continue;
          viewportFor(it); setMVP(mvp, it._f, it._aspect, near, far, it);
          var cX = Math.cos(it.rx), sX = Math.sin(it.rx), cY = Math.cos(it.ry), sY = Math.sin(it.ry);
          // light and camera in the pack's own space: R^T * v
          gl.uniformMatrix4fv(pp.u.uMVP, false, mvp);
          gl.uniform3f(pp.u.uLight, cY * L0[0] + sX * sY * L0[1] - cX * sY * L0[2], cX * L0[1] + sX * L0[2], sY * L0[0] - sX * cY * L0[1] + cX * cY * L0[2]);
          var ez = (CAM_DIST - it.lift) / it.scale;
          gl.uniform3f(pp.u.uEye, -cX * sY * ez, sX * ez, cX * cY * ez);
          var facing = cX * cY;                                     // +1 front towards camera, -1 back
          if (facing > -0.75) {
            gl.bindTexture(gl.TEXTURE_2D, texture(it.front, { key: it.front + it.key }).tex);
            gl.drawElements(gl.TRIANGLES, R.front.count + R.gusset.count, gl.UNSIGNED_SHORT, R.front.start * 2);
            calls++; tris += (R.front.count + R.gusset.count) / 3;
          }
          if (facing < 0.75) {
            gl.bindTexture(gl.TEXTURE_2D, texture(it.back, { key: it.back + it.key }).tex);
            gl.drawElements(gl.TRIANGLES, R.gusset.count + R.back.count, gl.UNSIGNED_SHORT, R.gusset.start * 2);
            calls++; tris += (R.gusset.count + R.back.count) / 3;
          }
        }
      }
      evict();

      // bookkeeping
      stats.visible = vis; stats.drawCalls = calls; stats.triangles = tris;
      stats.textures = texCache.size; stats.textureMB = Math.round(texBytes / 104857.6) / 10;
      stats.cpuMs += (performance.now() - t0 - stats.cpuMs) * 0.1;
      if (interval > 0 && interval < 250) {
        stats.fps += (1000 / interval - stats.fps) * (stats.fps ? 0.08 : 1);
        // Struggling device: try a lower resolution once it is clearly not keeping up. If that buys nothing,
        // the frame rate is being capped elsewhere (battery saver, a 30 Hz screen): put the pixels back and stop trying.
        if (adapt.on) {
          slowFrames = interval > 24 ? slowFrames + 1 : Math.max(0, slowFrames - 2);
          if (adapt.trial) {
            adapt.trial.n++; adapt.trial.sum += interval;
            if (adapt.trial.n >= 45) {
              if (adapt.trial.sum / 45 > adapt.trial.before * 0.85) { dprCap = adapt.trial.prev; adapt.on = false; }
              adapt.trial = null; slowFrames = 0; moving = true;
            }
          } else if (slowFrames > 40 && dpr > 1) {
            adapt.trial = { prev: dprCap, before: 1000 / stats.fps, n: 0, sum: 0 };
            dprCap = Math.max(1, dpr - 0.5); slowFrames = 0; moving = true;
          }
        }
      }
      dirty = false;
      if (moving) invalidate();
    }

    // ---- events
    function onScroll() { invalidate(); }
    function onResize() { measure(); }
    function onLost(e) { e.preventDefault(); lost = true; if (rafId) cancelAnimationFrame(rafId); rafId = 0; }
    function onRestored() { lost = false; initGL(); invalidate(); }
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onResize, { passive: true });
    canvas.addEventListener('webglcontextlost', onLost, false);
    canvas.addEventListener('webglcontextrestored', onRestored, false);
    var ro = root.ResizeObserver ? new ResizeObserver(function () { measure(); }) : null;
    if (ro) ro.observe(document.documentElement);

    function destroy() {
      removeEventListener('scroll', onScroll); removeEventListener('resize', onResize);
      if (ro) ro.disconnect(); if (rafId) cancelAnimationFrame(rafId);
      var ext = gl.getExtension('WEBGL_lose_context'); if (ext) ext.loseContext();
      canvas.remove();
    }

    // opts.mesh: URL of the .glb (default), or of a .json wrapper { "glb": "<base64>" } for hosts that will not serve .glb
    var meshUrl = opts.mesh || assets + 'pouch.glb';
    return fetch(meshUrl).then(function (r) {
      if (!r.ok) throw new Error(meshUrl + ' ' + r.status);
      if (!/\.json$/.test(meshUrl)) return r.arrayBuffer();
      return r.json().then(function (j) { var bin = atob(j.glb), u8 = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i); return u8.buffer; });
    }).then(function (buf) {
      meshData = parseGLB(buf); stage.mesh = meshData;
      initGL(); invalidate();
      return stage;
    });
  }

  root.Pouch3D = { createStage: createStage, PACK_ASPECT: 1 / PACK_H };
})(window);
