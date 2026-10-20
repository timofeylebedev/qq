# The fonts of the site, made from the originals in assets-src/fonts (npm run fonts; needs `pip install fonttools brotli`).
#
#   Apercu Pro 400 / 500 / 700  the text face (from the designer): Latin, Cyrillic, punctuation, ₽, arrows
#   Technology 700              the digits of the roast countdown: only 0–9 and the colon (about 2 KB), made
#                               tabular here (every digit as wide as the widest, drawn in its middle), so the
#                               countdown does not shift as it ticks and is always as wide as its caption
#   JetBrains Mono 700          the headings, from Google Fonts (OFL), in its Latin and Cyrillic files as Google
#                               serves them; it stands in for PT Mono Bold, which Google Fonts has only in Regular
#                               (design/decisions.json, "font-headings")
#
# Every face is written as woff2 into src/assets/fonts; src/styles/base/fonts.css names them.
from pathlib import Path
import shutil
from fontTools import subset
from fontTools.ttLib import TTFont

root = Path(__file__).resolve().parent.parent
src, out = root / "assets-src/fonts", root / "src/assets/fonts"
out.mkdir(parents=True, exist_ok=True)

TEXT = ",".join([
    "U+0020-007E", "U+00A0-00FF", "U+0131", "U+0152-0153", "U+02C6", "U+02DA", "U+02DC",
    "U+0400-045F", "U+0490-0491", "U+04B0-04B1",                  # Cyrillic
    "U+2010-2015", "U+2018-201E", "U+2022", "U+2026", "U+2032-2033", "U+2039-203A",
    "U+20BD", "U+2116", "U+2190-2193", "U+2212", "U+2248", "U+2260", "U+2264-2265",
])
DIGITS = "U+0030-003A"


def tabular(font, chars="0123456789"):
    cmap, glyf, hmtx = font.getBestCmap(), font["glyf"], font["hmtx"]
    names = [cmap[ord(c)] for c in chars]
    width = max(hmtx[n][0] for n in names)
    for n in names:
        adv, lsb = hmtx[n]
        dx = round((width - adv) / 2)
        g = glyf[n]
        if dx and g.numberOfContours > 0:
            g.coordinates.translate((dx, 0)); g.recalcBounds(glyf)
        hmtx[n] = (width, lsb + dx)


def make(name, unicodes, features="kern,liga,lnum,tnum,case,ss01", tab=False):
    opts = subset.Options()
    opts.flavor = "woff2"
    opts.layout_features = features.split(",")
    opts.name_IDs = ["*"]
    opts.notdef_outline = True
    opts.hinting = False
    font = TTFont(src / f"{name}.ttf")
    if tab:
        tabular(font)
    s = subset.Subsetter(opts)
    s.populate(unicodes=subset.parse_unicodes(unicodes))
    s.subset(font)
    path = out / f"{name}.woff2"
    font.flavor = "woff2"
    font.save(path)
    print(f"{path.name:32} {path.stat().st_size / 1024:6.1f} KB")


for w in (400, 500, 700):
    make(f"apercu-{w}", TEXT)
make("technology-700", DIGITS, "kern", tab=True)
for part in ("latin", "cyrillic"):
    f = f"jetbrains-mono-{part}-700-normal.woff2"
    shutil.copy(src / f, out / f)
    print(f"{f:32} {(out / f).stat().st_size / 1024:6.1f} KB")
