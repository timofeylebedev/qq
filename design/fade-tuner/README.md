# The fade tuner (round 5)

An artifact for Tim to tune the four fades of the site (`design/colors.json` fades: hero, caption, card, panel) on
the real home page: the built page in a frame, a curve (cubic-bezier) per fade with presets, its reach, its stops and
its lead-in above the text (`--hero-fade`, `--lead-caption`, `--lead-card`, `--lead-panel`).

Rebuild and republish: `npm run build && node design/fade-tuner/build.mjs`, then publish `out/index.html` with the
files of `out/files.json` (142 files, about 5 MB) and the `db` capability, to the same artifact URL.

«Save for Claude» writes the values to the artifact's database, document `tuning/fades`. Claude reads it back (the
ArtifactData tool) and puts the values into `design/colors.json` (curve, stops, reach), `base.css` (the lead-ins) and
`design/scale.json` (`hero/fade`).
