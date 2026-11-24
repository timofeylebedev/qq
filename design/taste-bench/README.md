# The taste bench (session 1 of choosing coffee)

An artifact for looking at the taste model (`docs/taste-model.md`). It is a map of QQ's 25 coffees, either on the
model's axes (acidity × body, the coffees of one cell stacked) or laid out by the model's distance (classical MDS,
stress shown). Pick a coffee to see its 5 nearest and its six steps, each with the model's reason, its family
profile and processing, its relabels, and, for the 7 coffees of the blind check, the judges' picks next to the
model's. Anchors (origins, drinks) can be drawn as regions. The distance weights are sliders: neighbours and steps
are recomputed with the build's own arithmetic (`src/scripts/taste.js`, inlined). Reasons stay the model's own only
at the model's weights.

Rebuild and republish: `npm run taste:bench`, then publish `out/index.html` and `out/fonts/*` to the same artifact:
https://claude.ai/artifact/L7KSns26ZN8CMKpW47jmxu
