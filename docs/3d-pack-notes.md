# 3D coffee pack for the web — working notes

Status (6 Oct 2026): first pass of the model and renderer done. Animations and interactions are still to be designed.

## Where it lives in this repo
- Renderer: `js/pouch3d.js`. Shared mesh and effect maps: `assets/pack/`. Label art: `assets/products/`.
- Test bench with look sliders and a 24–200 pack stress test: `lab/3d-pack.html` (also published as the artifact "QQ Coffee 3D Pack").
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
