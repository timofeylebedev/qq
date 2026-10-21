# The intro tuner (round 7)

An artifact for Tim to tune the hero's entrance (`design/intro.json`, played by `scripts/hero.js`) on the real home
page: the built page in a frame; for each of the four groups (the block at the photo's foot, the title's lines, the
countdown's rows, the links) when it starts, how long a part takes, how far it rises from, how much later the next part
starts, and its curve (two handles, or its four numbers, or a preset); a timeline of the whole entrance; Play, slowed
down if wanted, at six screen sizes. The page itself plays it through `window.qqIntro.play(settings)`.

Rebuild and republish: `npm run build && node design/intro-tuner/build.mjs`, then publish `out/index.html` with the
files of `out/files.json` and the `db` capability, to the same artifact URL.

«Save for Claude» writes the values to the artifact's database, document `tuning/intro`. Claude reads it back (the
ArtifactData tool) and puts them into `design/intro.json`.
