# The system report

A page about the whole size system of the site, one per round: what the round changed (with the site next to Figma
or the previous build), the system, the areas the round touched, every size at every width and height, the responsive
map, motion, the grammar, the checks and what is next. Every page covers the whole system, not only its round, and
keeps the earlier rounds' «what changed» at its end. Earlier pages stay where they are (Tim, round 3: «keep it
separate»), so each round publishes a new page.

**The pages** (private until shared; also in the project doc `claude/website-system.md`):
- Round 7: https://claude.ai/artifact/MTVz65GbbaaF1KcUpmqybW
- Round 6: https://claude.ai/artifact/5yepw2xp4auoP4ZTnEUSY2
- Round 5: https://claude.ai/artifact/JrYDfrH1kwuWrLGYw5At3j (round 4 built the pages and had no report)
- Round 3: https://claude.ai/artifact/CESDhXQ6ErVqFQiNT7kuXM
- Rounds 1–2: https://claude.ai/artifact/WRGuvxpjr9wBBLWjyH8S6a (round 2's page; round 1's is in its history)

## Rebuild it

```sh
npm run build && npm run preview &                 # the site at http://localhost:4173
node design/report/tools/sweep.mjs                 # every role and block, every 10px of width and 25px of height → sweep.json
node design/report/tools/sweep.mjs --dist=<previous build's dist> --out=design/report/sweep-before.json   # «before»
node design/report/tools/areas-round2.mjs <old url> <new url>   # round 2's areas (navbar, hero) on both builds
node design/report/tools/areas.mjs                 # the round's areas at 25 real screens → areas.json
node design/report/tools/pairs.mjs                 # round 1: Figma (figma/*.png) next to the site → shots/*.jpg
node design/report/tools/pairs-round2.mjs <old url> <new url>  # round 2: the previous build next to this one → shots/r2-*.jpg
node design/report/tools/areas-round3.mjs <old url> <new url>   # round 3's areas (footer, new arrivals, the row, the modal) → areas-round3.json
node design/report/tools/pairs-round3.mjs <old url> <new url>   # round 3: round 2's build next to this one → shots/r3-*.jpg
node design/report/tools/vt-frames-round3.mjs <new url>          # round 3: the card → page move in four frames (no before)
node design/report/tools/areas-round5.mjs <old url> <new url>   # round 5's measures (title, lines, note, nav, taste, business, info blocks, newsletter) → areas-round5.json
node design/report/tools/pairs-round5.mjs <old url> <new url>   # round 5: round 4's build (main) next to this one → shots/r5-*.jpg
node design/report/tools/areas-round6.mjs <old url> <new url>   # round 6's measures (hero layout, title, link padding, digits, note, frame, nav cells) → areas-round6.json
node design/report/tools/pairs-round6.mjs <old url> <new url>   # round 6: round 5's build (main) next to this one → shots/r6-*.jpg
npm run -s rules > design/report/rules.txt; npm run -s audit > design/report/audit.txt
python3 -I design/report/tools/make_data.py        # the words + the measurements → data.json
python3 -I design/report/build_report.py design/report/data.json /tmp/report.html   # one self-contained page
```

The previous build: `git worktree add /tmp/old <last commit of the previous round>`, link node_modules, `npm run build`
there, and serve both dists on two ports. Earlier rounds' «what changed» sections are frozen in `rounds/round-N.json` (round-1, round-2, round-3, round-5, round-6); `rounds/review-round-N.json` keeps each round's review.

`review.json` holds the independent review's findings with what was done about each (written by hand each round).
The built HTML is not committed (it repeats the pictures as base64).

## A new round

Keep every section and bring each up to date. Put the new round's «what changed» first; move this round's (the
`changes` section) to «Earlier rounds» at the end, with its pictures. In the pairs, «before» becomes the previous
build (serve it on a second port) instead of Figma.

## Files

| | |
| --- | --- |
| `engine.js`, `report-template.html`, `build_report.py` | the report engine (skill `full-system-report`) |
| `data.json` | the page's content (written by `tools/make_data.py`) |
| `shots/` | picture pairs; `figma/` the Figma renders they compare against |
| `tools/` | the measuring scripts of the rounds |
