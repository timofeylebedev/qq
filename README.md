# QQ Coffee website

Website for QQ, a roaster of freshly roasted coffee. Plain HTML, CSS and JavaScript, no build step. Product packs are drawn as live 3D pouches with a small WebGL renderer (`js/pouch3d.js`, no libraries).

## Run it locally

The page loads its product list and 3D assets with `fetch`, so open it through a local server rather than by double-clicking the file:

```sh
python3 -m http.server 8000
# or
npx serve .
```

Then open http://localhost:8000.

## Layout

```
index.html              home page: hero pack, coffee list, roasting, about, contact
css/site.css            styles (light and dark)
js/site.js              loads products, sets up the hero and shop packs
js/pouch3d.js           3D pouch renderer, one WebGL canvas shared by every pack
data/products.json      the coffee list — add a product here
assets/pack/            shared mesh and effect maps (same for every product)
assets/products/        label art per product, 512 px (list) and 1024 px (close-up)
lab/3d-pack.html        the 3D pack test bench: look sliders and a 24–200 pack stress test
docs/3d-pack-notes.md   how the 3D pack is built and what's still open
```

## Adding a coffee

1. Export the label art as WebP at 512 and 1024 px wide, front and back: `assets/products/<id>-front-512.webp` and so on.
2. Add an entry to `data/products.json` with the same `id`.

The mesh and effect maps are shared, so a new product costs only its label images (about 80 KB per side in the list).

## Status

- Hero and coffee list work; Roasting, About and Contact hold placeholder text.
- Prices, tasting notes and a checkout are not set up yet.
- 3D pack: first pass, not yet measured on real phones. See `docs/3d-pack-notes.md`.
