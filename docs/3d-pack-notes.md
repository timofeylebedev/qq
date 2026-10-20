# 3D coffee pack for the web — working notes

Status (20 Oct 2026): model and renderer on the site; the lean, hover, scroll lag and press are designed (round 2), the look values still wait for the designer.

## Where it lives in this repo
- Renderer: `src/scripts/pouch3d.js` (the site), `public/lab/pouch3d.js` (the test bench). Shared mesh and effect maps: `public/pack/`. Label art: `public/pack/labels/`.
- Test bench with look sliders and a 24–200 pack stress test: `public/lab/3d-pack.html` (on the test site at `/lab/3d-pack.html`; also published as the artifact "QQ Coffee 3D Pack").
- The Blender model (`qq-pouch-textured.glb`) and the build scripts are in the `qq-pouch-3d.zip` bundle and are not in this repo yet.

## Source files from the designer
- `2d_front.png`, `2d_back.png` (1845×2697): flat label art.
- `effect-light.png`, `effect-dark.png` (1176×1717): studio photos of a white and a black blank pouch, used in Photoshop as overlay layers.
- `front.png`, `back.png`: the Photoshop mockups. `drop_shadow.png`: reference for the shadow.
- Measured Photoshop recipe: art × light layer (multiply, about 50%), then dark layer (screen, about 115%). Art sits about 1% larger than the pouch (bleed).

## How the model is built
- Mesh: stand-up zip pouch, width 1 × height 1.46 units (about 100 × 146 mm), 2,880 triangles, 69 KB .glb. Front panel, back panel, bottom gusset. Flat-projected UVs, back mirrored.
- Wrinkles: a slope map recovered from `effect-light.png` (linear shape-from-shading), stored in `relief.jpg` red/green; blue holds the light layer. `gloss.jpg` holds the dark layer. Both are shared by every product.
- Shader: reproduces the Photoshop recipe exactly when the pack faces the camera; when it turns, the wrinkle normals shift shading by the difference between the current light and the light in the photo. So the rest pose equals the approved mockup.
- Per product only the label art changes: `<name>-front/back-512.webp` (catalog, about 80 KB) and `-1024.webp` (close-up, about 450 KB).

## Performance design (target: 50–100 packs per page on weak devices)
- One WebGL context and one canvas for the page; packs are drawn into ordinary DOM slots.
- Canvas is viewport-sized plus 12% overscan and moves with the page between frames.
- Draws only on change; zero frames at rest. Only packs near the viewport are drawn.
- Label textures load when a pack first appears and are evicted over a budget (96 MB, 48 MB on low-memory devices).
- Resolution steps down if the device cannot keep up; MSAA only when the canvas is under 4.5 MP.
- No libraries; renderer is about 10 KB gzipped.

## Not done / open
- Not yet measured on real phones (only in headless Chromium with software rendering).
- Tear notches are not modelled. Back panel reuses the front's wrinkles, mirrored.
- Label textures are plain WebP; GPU-compressed textures (KTX2) would cut memory 4–8× if needed.
- Default look values: depth 1.0, relief 2.0, light 0.75, sheen 0.35, shadow 0.38 — awaiting the designer's preferred values.

## On the site (Oct 19, 2026)

- The renderer lives in `src/scripts/pouch3d.js` as an ES module (the original IIFE stays in `public/lab/pouch3d.js` for
  the test bench at `public/lab/3d-pack.html`). Two additions: `live` slots are measured every frame (the pinned pack
  of a product page), and `clip` limits a pack to an element's box (packs in rows that scroll sideways).
- Shared assets: `public/pack/` (mesh, `relief.jpg`, `gloss.jpg`); labels: `public/pack/labels/`.
- `src/scripts/packs.js` animates the packs (shelf lean with the scroll, pointer tilt, the product page's turn);
  `build/pack-still.mjs` renders the still shown before WebGL draws.
- Look values in use: depth 1.0, relief 2.0, light 0.75, sheen 0.35, shadow 0.38 (the defaults; still waiting for the
  designer's preference).

## Round 2 (Oct 20, 2026)

- `pouch3d.js`: an item's `ox`, `oy` draw the pack that far off its slot (px); a pressed pack's shadow stays close
  (the shadow's distance is floored at 0.6 for a negative lift).
- `packs.js`: every pack trails its slot a little when the page or its row scrolls (`TUNE.lag` 9/s, at most
  `lagMax` 12% of its height and `lagMaxPx` 40px, soft-capped so a jump to an anchor stays small), and a pointer
  pressed on a pack moves it away (`pressLift` −0.45, `pressScale` 0.94, held at least `pressHold` 0.2s; a touch
  waits 90ms in case it is a scroll). Neither with «reduce motion».

## Round 3 (Oct 20, 2026)

- No tilt with the page's scroll any more (Tim): the shelf lean (tilt by place on the screen) and the lean with the
  scroll's speed are gone. Cards still face a little towards the middle of the screen (`TUNE.turn`) and the pointer.
- `packs.js` splits a pack's lag in two: the page's scroll (it only trails, as before) and its slot's own move on the
  page (its row slides, its card rises). Carried, it trails and tilts so its leading edge recedes: sideways in a row
  (`carryTurn` 0.55 at the full trail), up and down as a card rises (`carryTilt` 0.45). A rising card's slot is
  measured every frame while it moves (the event `qq:carry` from `slider.js`).
- `pouch3d.js`: an item's `alpha` (0–1) fades its pack and shadow (blended, premultiplied); a card that rises into
  place fades in with its pack.
- The view transition to a coffee's page captures the stills (`html[data-vt]` hides the canvas); arriving that way the
  big pack starts facing front instead of turning in from a quarter turn.

## Round 5 (Oct 20, 2026)

- No lag any more (Tim): a pack stays exactly in its slot while the page scrolls or its row slides, and a sliding
  row no longer turns its packs (`carryTurn` is gone). Only a card rising into place still carries its pack: it
  trails the slot's move up the page and tilts (`carryTilt` 0.45, `TUNE.lag` 9/s).
- A press anywhere on a card (not its buttons) moves its pack away and holds it there while the pointer is down.
