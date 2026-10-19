# The system report

One living page about the whole size system of the site, rebuilt every round: what the round changed (with the site
next to Figma or the previous build), the system, the areas the round touched, every size at every width and height,
the responsive map, motion, the grammar, the checks and what is next.

**The page:** https://claude.ai/artifact/WRGuvxpjr9wBBLWjyH8S6a (private until shared; also in the project doc
`claude/website-system.md`). Every round updates the same page; it always covers the whole system, not only the round.

## Rebuild it

```sh
npm run build && npm run preview &                 # the site at http://localhost:4173
node design/report/tools/sweep.mjs                 # every role and block, every 10px of width and 25px of height → sweep.json
node design/report/tools/areas.mjs                 # the round's areas at 25 real screens → areas.json
node design/report/tools/pairs.mjs                 # Figma (figma/*.png) or the old build next to the site → shots/*.jpg
npm run -s rules > design/report/rules.txt; npm run -s audit > design/report/audit.txt
python3 -I design/report/tools/make_data.py        # the words + the measurements → data.json
python3 -I design/report/build_report.py design/report/data.json /tmp/report.html   # one self-contained page
```

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
