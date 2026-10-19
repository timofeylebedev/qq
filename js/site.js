/* QQ Coffee — page logic.
   Loads the product list, draws the hero pack and one pack per product through the shared Pouch3D stage.
   If WebGL is unavailable the flat label images in the markup stay visible. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var PACK = 'assets/pack/';
  var LOOK = { depth: 1.0, relief: 2.0, light: 0.75, sheen: 0.35, shadow: 0.38 };   // see docs/3d-pack-notes.md

  $('year').textContent = new Date().getFullYear();

  var productsReady = fetch('data/products.json').then(function (r) { return r.json(); }).then(renderShop);

  Promise.all([Pouch3D.createStage({ assets: PACK, mesh: PACK + 'pouch-glb.json' }), productsReady])
    .then(function (res) { start(res[0], res[1]); })
    .catch(function (err) { console.warn('3D packs unavailable, showing flat labels:', err); });

  function renderShop(products) {
    var grid = $('grid');
    grid.textContent = '';
    return products.map(function (p) {
      var card = document.createElement('article');
      card.className = 'card';
      card.innerHTML =
        '<div class="slot" role="button" tabindex="0" aria-label="' + p.name + ' pack. Press to flip."><img class="flat" alt="" loading="lazy"></div>' +
        '<div class="meta"><span class="name"></span><span class="sub"></span>' +
        '<div class="row"><span class="weight"></span><span class="price"></span></div></div>';
      card.querySelector('.flat').src = p.art.front512;
      card.querySelector('.name').textContent = p.name;
      card.querySelector('.sub').textContent = p.origin + ' · ' + p.notes;
      card.querySelector('.weight').textContent = p.weight || '';
      card.querySelector('.price').textContent = p.price == null ? 'Price soon' : p.price;
      grid.appendChild(card);
      return { product: p, card: card, slot: card.firstChild };
    });
  }

  function start(stage, cards) {
    document.documentElement.classList.add('gl');
    Object.assign(stage.look, LOOK);

    // ---------- hero: drag to turn, double-tap to flip, eases in from a quarter turn
    var first = cards[0] && cards[0].product;
    var heroEl = $('hero');
    var hero = stage.add(heroEl, { front: first.art.front1024, back: first.art.back1024, fit: 0.78 });
    var H = { vy: 0, target: 0, dragging: false, lastX: 0, lastY: 0, lastT: 0, tapT: 0, moved: 0 };
    hero.ry = reduced ? 0 : -0.9;

    heroEl.addEventListener('pointerdown', function (e) {
      H.dragging = true; H.target = null; H.vy = 0; H.moved = 0; H.lastX = e.clientX; H.lastY = e.clientY; H.lastT = e.timeStamp;
      heroEl.setPointerCapture(e.pointerId);
    });
    heroEl.addEventListener('pointermove', function (e) {
      if (!H.dragging) return;
      var dx = e.clientX - H.lastX, dy = e.clientY - H.lastY, dt = Math.max(e.timeStamp - H.lastT, 1) / 1000;
      hero.ry += dx * 0.011; hero.rx = Math.max(-0.5, Math.min(0.5, hero.rx + dy * 0.004));
      H.vy = 0.6 * H.vy + 0.4 * (dx * 0.011 / dt); H.moved += Math.abs(dx) + Math.abs(dy);
      H.lastX = e.clientX; H.lastY = e.clientY; H.lastT = e.timeStamp;
      stage.invalidate();
    });
    function release(e) {
      if (!H.dragging) return;
      H.dragging = false;
      if (H.moved < 6) { if (e.timeStamp - H.tapT < 350) flipHero(); H.tapT = e.timeStamp; H.vy = 0; }
      if (e.timeStamp - H.lastT > 80) H.vy = 0;
      stage.invalidate();
    }
    heroEl.addEventListener('pointerup', release);
    heroEl.addEventListener('pointercancel', release);
    function flipHero() { H.target = (Math.round(hero.ry / Math.PI) + 1) * Math.PI; H.vy = 0; stage.invalidate(); }

    // ---------- shop: one pack per product, click or Enter/Space flips it, pointer tilts it
    var packs = cards.map(function (c) {
      var item = stage.add(c.slot, { front: c.product.art.front512, back: c.product.art.back512, key: c.product.id });
      var p = { item: item, flipped: false, hover: false, hx: 0, hy: 0 };
      function flip() { p.flipped = !p.flipped; stage.invalidate(); }
      c.slot.addEventListener('click', flip);
      c.slot.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } });
      c.slot.addEventListener('pointermove', function (e) {
        if (e.pointerType === 'touch') return;
        p.hover = true; p.hx = ((e.pageX - item.x) / item.w) * 2 - 1; p.hy = ((e.pageY - item.y) / item.h) * 2 - 1; stage.invalidate();
      });
      c.slot.addEventListener('pointerleave', function () { p.hover = false; stage.invalidate(); });
      return p;
    });
    stage.measure();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { stage.measure(); });

    // ---------- animation: runs only while something is still moving
    stage.onTick = function (dt) {
      var moving = false, k = 1 - Math.exp(-dt * 9);

      if (H.target !== null) {
        var d = H.target - hero.ry; hero.ry += d * (1 - Math.exp(-dt * 6));
        if (Math.abs(d) < 0.002) { hero.ry = H.target; H.target = null; } else moving = true;
      } else if (!H.dragging) {
        H.vy *= Math.exp(-dt * 2.6);
        if (Math.abs(H.vy) > 0.004) { hero.ry += H.vy * dt; moving = true; } else H.vy = 0;
      }
      if (!H.dragging && Math.abs(hero.rx) > 0.001) { hero.rx *= Math.exp(-dt * 4); moving = true; }

      for (var i = 0; i < packs.length; i++) {
        var p = packs[i], it = p.item;
        var trx = 0, tryy = p.flipped ? Math.PI : 0, tl = 0, ts = 1;
        if (p.hover && !reduced) { tryy += p.hx * 0.5; trx += p.hy * 0.3; tl = 0.35; ts = 1.03; }
        var e = Math.abs(trx - it.rx) + Math.abs(tryy - it.ry) + Math.abs(tl - it.lift);
        if (it.visible && e > 0.002) {
          it.rx += (trx - it.rx) * k; it.ry += (tryy - it.ry) * k; it.lift += (tl - it.lift) * k; it.scale += (ts - it.scale) * k; moving = true;
        } else { it.rx = trx; it.ry = tryy; it.lift = tl; it.scale = ts; }
      }
      return moving;
    };
    stage.invalidate();
  }
})();
