#!/usr/bin/env python3
"""Writes design/report/data.json: the words of the report (below) with the measured numbers of
design/report/sweep.json (tools/sweep.mjs), areas.json (tools/areas.mjs), review.json (the independent review)
and audit.txt (npm run audit), and the system files (design/scale.json, colors.json, decisions.json).

  python3 -I design/report/tools/make_data.py      then   python3 -I design/report/build_report.py data.json out.html

Round 1 had no earlier build: its «before» was the Figma file. From round 2 «before» is the previous build, swept the
same way (tools/sweep.mjs --dist=<its dist> --out=sweep-before.json); the Figma steps stay in the text tables.
Earlier rounds' «what changed» sections are frozen in rounds/*.json and kept at the end."""
import json, os, re

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROOT = os.path.dirname(os.path.dirname(HERE))
J = lambda *p: json.load(open(os.path.join(*p), encoding='utf-8'))
scale, colors, dec = J(ROOT, 'design/scale.json'), J(ROOT, 'design/colors.json'), J(ROOT, 'design/decisions.json')['decisions']
sweep, areas = J(HERE, 'sweep.json'), J(HERE, 'areas.json')
WAS = {}   # round 1 struck the pack's place under the buy bar before its short-screen fix; nothing to strike now
for _a in areas:
    if _a['size'] in WAS: _a['was'] = WAS[_a['size']]
review = J(HERE, 'review.json') if os.path.exists(os.path.join(HERE, 'review.json')) else []
audit = open(os.path.join(HERE, 'audit.txt'), encoding='utf-8').read() if os.path.exists(os.path.join(HERE, 'audit.txt')) else '(not run)'
rules_out = open(os.path.join(HERE, 'rules.txt'), encoding='utf-8').read() if os.path.exists(os.path.join(HERE, 'rules.txt')) else ''
PR = 'https://github.com/timofeylebedev/qq/pulls'
SITE = 'https://timofeylebedev.github.io/qq/'
FIGMA = 'https://www.figma.com/design/xwaKVTaFLFNc2yhMfsB5us/QQ-website'

# ── Figma frames: the sizes it holds at each designed width (read from the frames of «Главная», «Каталог», «Продукт») ──
FRAMES = [320, 390, 768, 990, 1280, 1440, 1920]
FIG = {
    '--type-display': [48, 48, 56, 64, 64, 72, 72], 'countdownPx': [38, 44, 60, 64, 80, 80, 128],
    '--type-countdown': [38, 44, 60, 64, 80, 80, 128],
    '--type-h2': [32, 32, 36, 40, 48, 48, 48], '--type-h3': [24, 24, 32, 36, 40, 40, 40],
    '--type-card-title': [20, 20, 20, 24, 24, 24, 24], '--type-title': [20, 20, 24, 28, 32, 32, 32],
    '--gutter': [16, 24, 32, 40, 48, 48, 48], '--section-y': [80, 80, 96, 104, 120, 120, 120],
    '--type-control': [14, 16, 16, 20, 20, 24, 24], '--type-body': [14, 14, 14, 16, 16, 16, 16]}
def fig_at(key, w):
    i = max(j for j, f in enumerate(FRAMES) if f <= w)
    return FIG[key][i]

# ── the sweep: one row per size, the three pages merged ──
def merged(axis):
    k = 'w' if axis == 'width' else 'h'
    rows = {}
    for page in sweep[axis].values():
        for r in page:
            rows.setdefault(r[k], {}).update(r)
    out = [rows[x] for x in sorted(rows)]
    for r in out:
        if 'buybarH' in r: r['buybarRows'] = 2 if r['buybarH'] > 100 else 1
    return out
after = {'width': merged('width'), 'height': merged('height')}
_old = J(HERE, 'sweep-before.json')
def _merged_old(axis):
    k = 'w' if axis == 'width' else 'h'; rows = {}
    for page in _old[axis].values():
        for r in page: rows.setdefault(r[k], {}).update(r)
    return [rows[x] for x in sorted(rows)]
NEW_KEYS = {'--fact-icon'}                                           # roles the previous build did not have
before = {ax: [{k: v for k, v in r.items() if k not in NEW_KEYS} for r in _merged_old(ax)] for ax in ('width', 'height')}
for ax in before:
    for r in before[ax]:
        if 'buybarH' in r: r['buybarRows'] = 2 if r['buybarH'] > 100 else 1
ROUND1 = J(HERE, 'rounds/round-1.json')
for _set in (after, before):                                     # the navbar's step from 1 (a log scale has no 0)
    for _ax in _set.values():
        for _r in _ax:
            if 'nav' in _r: _r['navStep'] = _r['nav'] + 1

def at(key, w, axis='width'):
    k = 'w' if axis == 'width' else 'h'
    return next(r[key] for r in after[axis] if r[k] == w)

# ── the scale ──
def ladder():
    v, out = 0, []
    for step, top in scale['ladder']['steps']:
        while v + step <= top: v += step; out.append(v)
    return out
L = ladder()
troles, sroles = scale['type']['roles'], scale['space']['roles']
def css_of(role): return '--' + role.replace('/', '-') if role.startswith('type/') else sroles[role]['css']

# relations at both ends
rel = [{'label': f"{a.split('/')[1]} : {b.split('/')[1]}", 'k0': troles[a]['px'][0] / troles[b]['px'][0], 'k1': troles[a]['px'][1] / troles[b]['px'][1]} for a, b in scale['type']['relations']['pairs']]

# ── the words ──
def pill(t, c=''): return f"<span class='pill {c}'>{t}</span>"
shots_round = [
    {'title': 'Hero at 1280', 'src': 'shots/hero-1280.jpg', 'text': 'The Figma hero (left) and the site: title, countdown to the next roast (Technology digits, Moscow time) and three links in cells divided by hairlines. The site adds the navbar over the photo.'},
    {'title': 'Новинки at 1280', 'src': 'shots/featured-1280.jpg', 'text': 'The featured slider: text, taste chart and descriptor pills on cloud grey, the 3D pack instead of the photo (Figma mixes photos and packs; the site uses a photo only where data/site.json gives one).'},
    {'title': 'Рекомендуем at 1280', 'src': 'shots/recs-1280.jpg', 'text': 'Three cards per view from M, 1.1 on a phone so the next card peeks; 3D packs lean as the row scrolls.'},
    {'title': 'Наш подход at 1280', 'src': 'shots/approach-1280.jpg', 'text': 'The image block: eyebrow in lavender, h3 in mono capitals, the filled «Читать» button with its arrow cell, as in Figma.'},
    {'title': 'Для бизнеса at 1280', 'src': 'shots/business-1280.jpg', 'text': 'Two cards with photo, name and text cells; one column below M.'},
    {'title': 'Facts and footer at 1280', 'src': 'shots/facts-footer-1280.jpg', 'text': 'Three info cells with a plus (the text behind it is a placeholder), the footer with the static logo (the animated one is awaited).'},
    {'title': 'Product: first screen at 1440', 'src': 'shots/product-top-1440.jpg', 'text': 'Name and meta pinned, the 3D pack on the stage, the buy bar fixed at the foot (one row from L, as in Figma).'},
    {'title': 'Product: fact tiles at 1440', 'src': 'shots/product-tiles-1440.jpg', 'text': 'Five frosted tiles scattered across the column as in Figma; the pack turns once around while they pass (window.qqStage.progress).'},
    {'title': 'Product: story at 1440', 'src': 'shots/product-story-1440.jpg', 'text': 'The big sentence (statement 24→48), the photo, the table text in columns.'},
    {'title': 'Product: similar coffees at 1440', 'src': 'shots/product-similar-1440.jpg', 'text': 'Four coffees nearest in taste (decision similar-coffees).'},
    {'title': 'Catalog at 1440', 'src': 'shots/catalog-1440.jpg', 'text': 'Info row, tabs, seven filter cells in one row from 1260 wide, the first four cards half a row, then thirds.'},
    {'title': 'Home on a phone (390 × 844)', 'src': 'shots/phones-home-390.jpg', 'text': 'Hero stacked in one column with 120px of the next block peeking; the featured coffee with text above the pack.'},
    {'title': 'Catalog and product on a phone (390 × 844)', 'src': 'shots/phones-shop-390.jpg', 'text': 'Filters in four rows of cells; the product stage with the two-row buy bar; a fact tile crossing the pack.'},
    {'title': 'Home at 844 × 390 (phone sideways)', 'src': 'shots/home-844x390.jpg', 'text': 'Sizes count the screen as a 320 one (its height decides): the hero fits with 14px of the next block showing.'},
    {'title': 'Home at 2560 × 1440', 'src': 'shots/home-2560.jpg', 'text': 'Nothing grows past 1440; the column stops at 1520 and the margins take the rest.'},
]

def T(s): return s
changes = [
    {'section': 'The site', 'items': [
        ['Build the QQ Coffee website from the Figma file, hosted on GitHub', f"Static Vite site in <code>timofeylebedev/qq</code>, branch <code>site-system</code>; every push to <code>main</code> publishes to <a href='{SITE}'>timofeylebedev.github.io/qq</a> (deploy.yml; Pages source must be set to GitHub Actions once).", 'done'],
        ['Start with the main, catalog and product pages; other pages only as context', 'Home, catalog and one page per coffee (25), from one set of components. Not built: bag, checkout, search, favourites, account, other categories, journal, business pages (see Next).', 'done'],
        ['Figma is general inspiration, not exact values or structure', 'Sizes come from the site\'s own scale; structure follows Figma (sections, cells, hairlines, mono capitals). Where Figma differs between frames, the site takes one line through them: e.g. h2 32→48 where Figma has 32 / 36 / 40 / 48 steps.', 'differently'],
    ]},
    {'section': 'The system', 'items': [
        ['A fluid system, not breakpoints (exceptions allowed)', 'Every size is a straight line from its value at 320 to its value at 1440 (31 roles in <code>design/scale.json</code>), constant outside; the screen\'s height counts (a screen 360 tall gets the 320 sizes, 920 tall the 1440 sizes). Layout changes at only three shared column steps S 22rem, M 43rem, L 58rem, plus the navbar at 64em. Four exceptions use screen units on purpose, listed in decisions.json.', 'done'],
        ['A system within pages and between screen sizes', 'One ladder (steps 2/4/8/16), type levels ≥ ×1.125 apart at both ends, colours only from <code>design/colors.json</code> with contrast checks, one motion vocabulary; <code>build/rules.mjs</code> checks 9 rules on every build and in CI.', 'done'],
        ['Flow Medium\'s size system as inspiration', 'Taken from it: roles with two ends, the height-capped viewport (<code>--vp</code>), the ladder, relations, a decisions register, the rules check, the audit at 11 sizes, this report. Not taken: its modular ratio (QQ\'s Figma uses round values).', 'done'],
    ]},
    {'section': 'Data and content', 'items': [
        ['Use the CSV, only rows «На сайте» = «Да»', '25 coffees from <code>data/products.csv</code> (Колумбия Вуш-Вуш appeared twice: the fuller row wins). Taste scores, descriptors, processing, lots, countries, tags and roast use reach the cards, filters and product tiles.', 'done'],
        ['Prices', 'Placeholder prices per price group and weight in <code>data/prices.json</code>, marked as such (decision price-placeholder).', 'check'],
        ['Labels on the packs', 'The Sumatra label on every pack, as you chose (decision pack-label).', 'done'],
        ['Fonts: Apercu (attached), Google fonts, Technology', 'Apercu Pro 400/500/700 self-hosted and subset; headings in JetBrains Mono Bold (Google has PT Mono only in Regular — decision font-headings); countdown digits in Technology Bold (your file, 1.2 KB subset).', 'differently'],
    ]},
    {'section': 'Product page and 3D', 'items': [
        ['The pack moves in 3D on scroll', 'The pack is pinned under the navbar while five fact tiles scroll past and turns once around with them; it settles in from a quarter turn on load; still with «reduce motion».', 'done'],
        ['Packs on grey use the existing 3D model', 'One WebGL canvas per page draws every card\'s pack (your renderer as an ES module); cards lean with the scroll and turn to the pointer. A still of the same pack shows before WebGL draws and without it.', 'done'],
        ['Animated footer logo', 'Waiting for the file or link; the footer shows the static logo meanwhile.', 'open'],
    ]},
    {'section': 'Process', 'items': [
        ['Use analyzing-design-systems, full-system-report, responsive-web-design, be-more-ambitious', 'Figma frames measured into the size roles; this page is the full system report; the audit runs 4 pages × 12 sizes with axe and a 24px-text pass; an independent agent reviewed the work and its 16 findings were fixed or answered (Checks).', 'done'],
        ['Ask questions; report missing things later', 'Asked about repo, logo, labels, prices and fonts. Missing things are in Next.', 'answered'],
    ]},
]
breaks = [
    'Headings are JetBrains Mono, not PT Mono: narrower, with a different «Ж» and «Ш». A licence for PT Mono Bold swaps it in one line.',
    'Sizes in between Figma frames are not Figma\'s: the site draws one line through each role, so e.g. the hero title is 55 at 1024 where Figma would show 56 (768 frame) or 64 (990 frame).',
    'The countdown is 96 at 1440 and above, where Figma\'s 1920 frame has 128: nothing grows past 1440.',
    'Figma\'s featured slide has a photo; the site shows the 3D pack unless data/site.json names a photo for that coffee.',
    'On a phone sideways the hero is taller than the screen (555 px at 568 × 320): the title, the countdown and three links stack in one column below M.',
    'The photos are Figma\'s moodboard, several with other roasters\' packs: to replace before launch.',
]

# ── areas tables ──
def area_rows(cols):
    return [[a['size']] + [c(a) for c in cols] for a in areas]
hero_tbl = {'type': 'table', 'title': 'The hero at 25 screens', 'sub': 'Peek: how much of the next block shows under the hero (negative: the hero is taller than the screen). Figma: the hero title of the nearest frame.',
    'columns': [{'label': 'Screen'}, {'label': 'Hero', 'num': True}, {'label': 'Peek', 'num': True}, {'label': 'Title', 'num': True}, {'label': 'Figma', 'num': True, 'muted': True}, {'label': 'Countdown', 'num': True}, {'label': 'Columns', 'num': True}],
    'rows': area_rows([lambda a: a['heroH'], lambda a: a['peek'] if a['peek'] >= 0 else f"<b>{a['peek']}</b>", lambda a: a['heroTitle'], lambda a: fig_at('--type-display', a['w']), lambda a: a['count'], lambda a: a['heroCols']])}
stage_tbl = {'type': 'table', 'title': 'The product stage at 25 screens', 'sub': 'Pin: the pinned height. Pack: the 3D box. Under bar: how much of the pack box the buy bar covers. Bar: its height and rows ("after": past the stage on a short screen).',
    'columns': [{'label': 'Screen'}, {'label': 'Pin', 'num': True}, {'label': 'Pack', 'num': True}, {'label': 'Under bar', 'num': True}, {'label': 'Bar', 'num': True}, {'label': 'Rows', 'num': True}],
    'rows': area_rows([lambda a: a['pinH'], lambda a: a['pack'], lambda a: a['packUnderBar'] if not a.get('was') else f"<span class='was'>{a['was']}</span> {a['packUnderBar']}", lambda a: a['bar'] if a.get('barPos', 'sticky') == 'sticky' else 'after', lambda a: a['barRows']])}
cat_tbl = {'type': 'table', 'title': 'The catalog at 25 screens', 'sub': 'First row: cards in the first row (the first four take half a row from M). Filters: rows of filter cells. First card: its top on the screen.',
    'columns': [{'label': 'Screen'}, {'label': 'First row', 'num': True}, {'label': 'Card width', 'num': True}, {'label': 'Filter rows', 'num': True}, {'label': 'First card top', 'num': True}],
    'rows': area_rows([lambda a: a['firstRow'], lambda a: a['cardW'], lambda a: a['filterRows'], lambda a: a['firstCardTop'] if a['firstCardTop'] < a['h'] else f"{a['firstCardTop']} (below the fold)"])}

# ── map rows from the sweep ──
def segs(key, fmt, data=None):
    data = data or after['width']
    out, prev, start = [], None, None
    for r in data:
        v = r.get(key)
        if v is None: continue
        v = fmt(v)
        if v != prev:
            if prev is not None: out.append({'from': start, 'to': r['w'], 'label': prev})
            prev, start = v, r['w']
    out.append({'from': start, 'to': 1920, 'label': prev})
    return out
def figsegs(pairs): return [{'from': a, 'to': b, 'label': l} for a, b, l in pairs]
maprows = [
    {'label': 'Navbar', 'now': segs('nav', lambda v: ['tab bar', 'burger', 'short sections', 'every section'][v]), 'before': segs('nav', lambda v: ['tab bar', 'burger', 'short sections', 'every section'][v], before['width'])},
    {'label': 'Hero', 'now': segs('heroCols', lambda v: {1: 'stacked', 2: 'title / count | links (3 rows)', 3: 'three cells, 3 rows'}[v]), 'before': segs('heroCols', lambda v: {1: 'stacked', 2: 'title + count | links', 3: 'three cells'}[v], before['width'])},
    {'label': 'Новинки slide', 'now': segs('featuredCols', lambda v: {1: 'text over pack', 2: 'text | pack'}[v])},
    {'label': 'Рекомендуем', 'now': segs('recsPerView', lambda v: f"{round(v)} per view" if v > 1.5 else '1 + peek')},
    {'label': 'Image blocks', 'now': segs('storyLayout', lambda v: {1: 'text over photo', 2: 'text on photo'}[v])},
    {'label': 'Business cards', 'now': segs('businessCols', lambda v: f"{v} col")},
    {'label': 'Info facts', 'now': segs('factsCols', lambda v: f"{v} col")},
    {'label': 'Catalog grid', 'now': segs('catalogTracks', lambda v: {1: '1 col', 2: '2 col', 6: 'halves, then thirds'}[v])},
    {'label': 'Filter rows', 'now': segs('filterRows', lambda v: f"{v} rows" if v > 1 else 'one row')},
    {'label': 'Product stage', 'now': [{'from': 320, 'to': 750, 'label': 'tiles in a column'}, {'from': 750, 'to': 1000, 'label': 'name over pack'}, {'from': 1000, 'to': 1920, 'label': 'tiles scattered'}]},
    {'label': 'Buy bar', 'now': segs('buybarRows', lambda v: f"{v} rows" if v > 1 else 'one row')},
    {'label': 'Footer', 'now': segs('footerRatio', lambda v: 'links, then flame' if v < 0.6 else ('two squares' if abs(v - 1) < 0.02 else 'two halves, taller')), 'before': segs('footerCols', lambda v: 'links, then flame' if v == 1 else 'two halves', before['width'])},
    {'label': 'Recommended row', 'now': segs('reelBleed', lambda v: 'to the screen\'s edges' if v > 1 else 'the column'), 'before': segs('reelBleed', lambda v: 'to the screen\'s edges' if v > 1 else 'the column', before['width'])},
]

R2_IDS = {'footer-squares', 'reel-bleed', 'featured-photos', 'page-transition', 'facts-modal', 'font-headings', 'facts-text'}   # round 3's (new or changed)
R5_IDS = {'hero-title-fills-cell', 'hover-tint', 'one-line-colour'}   # new or changed in round 5
decision_items = [{'id': d['id'], 'kind': d['kind'], 'what': d['what'], 'why': d['why'], 'decided': d['decided'], 'isNew': d['id'] in R5_IDS} for d in dec]
nd = {k: sum(1 for d in dec if d['kind'] == k) for k in ('decision', 'exception', 'placeholder')}
audit_clean = 'clean' in audit.splitlines()[-1] if audit.strip() and audit != '(not run)' else False
audit_last = audit.strip().splitlines()[-1] if audit.strip() else ''

rules_items = []
for line in rules_out.splitlines():
    m = re.match(r'^([✓✗]) (.+?) — (.+)$', line.strip())
    if m: rules_items.append({'title': m.group(2), 'how': m.group(3), 'ok': m.group(1) == '✓'})


# ══ Round 2 ════════════════════════════════════════════════════════════════════════════════════════════════════════
# «before» is now the previous build (round 1, branch component-canvas), swept the same way into sweep-before.json;
# the round's areas (navbar, hero) at 25 screens on both builds are in areas-round2.json (tools/areas-round2.mjs).
R2 = J(HERE, 'areas-round2.json')
A2 = {r['size']: (o, r) for o, r in zip(R2['old'], R2['new'])}
def a2(size, key): return A2[size][1][key]
def a2was(size, key): return A2[size][0][key]
PR2 = 'https://github.com/timofeylebedev/qq/pull/3'
PR3 = 'https://github.com/timofeylebedev/qq/pull/5'
shots_r2 = [
    {'title': 'Navbar at 1440', 'src': 'shots/r2-navbar-1440.jpg', 'text': 'No lines between the groups (16px of air instead); the profile icon added; the bar\'s own margin is the small 16px; colours of the section under it (black over the hero).'},
    {'title': 'Navbar hover at 1440', 'src': 'shots/r2-navbar-hover-1440.jpg', 'text': 'Before: the other links dimmed to 60%. After: only the item under the pointer changes, a white tint at 20% behind it (ink at 6% on light grounds).'},
    {'title': 'Navbar at 1920', 'src': 'shots/r2-navbar-1920.jpg', 'text': 'The content stops at the column (1520) widened by the 8px of air in the logo\'s and icons\' boxes: the logo glyph and the last icon stand on the column\'s edges (200 and 1720).'},
    {'title': 'Navbar at 900: short sections', 'src': 'shots/r2-navbar-steps-900.jpg', 'text': 'From 48em to 64em: «Каталог, Бизнесу, Журнал, Контакты» (before: the burger from 64em down).'},
    {'title': 'Navbar at 700: the burger', 'src': 'shots/r2-navbar-steps-700.jpg', 'text': 'From 40em to 48em the sections go behind the burger; the tools stay.'},
    {'title': 'Phone 390 × 844: tab bar and hero', 'src': 'shots/r2-phone-390.jpg', 'text': 'Under 40em the bag, favourites and profile leave the bar for the tab bar (Каталог, Корзина, Избранное, Профиль). The hero: screen less 24 less the tab bar (764), the title in three lines, the countdown as wide as its caption.'},
    {'title': 'Navbar over business', 'src': 'shots/r2-navbar-business-1440.jpg', 'text': 'Before: white everywhere but the hero. After: cool grey over the business block — it changes once the bar stands wholly on a section, crossing over in 0.6s.'},
    {'title': 'Navbar over the dark image block', 'src': 'shots/r2-navbar-dark-1440.jpg', 'text': 'Black over «Наш подход», with the white 30% hairline under it.'},
    {'title': 'Hero at 1440 × 900', 'src': 'shots/r2-hero-1440.jpg', 'text': f"Height 876 (the screen less 24; before 800). Three rows shared by the countdown and the links ({a2('1440×900','rowH')}px each, centres within 0px); the eased fade; the title word under word."},
    {'title': 'Hero at 1920 × 1080', 'src': 'shots/r2-hero-1920.jpg', 'text': 'The column at its most (1520): the cells are framed by a hairline on each side and the title stands 48px off the left one.'},
    {'title': 'Hero at 1024 × 768', 'src': 'shots/r2-hero-1024.jpg', 'text': f"744 tall (before 648); digits {a2('1024×768','digits')} = caption {a2('1024×768','caption')} wide (before the caption wrapped to two lines)."},
    {'title': 'Hero on a Friday afternoon', 'src': 'shots/r2-hero-date-1440.jpg', 'text': 'More than a day to the next roast: «ПН, 26 ОКТ» in place of the digits (mono: Technology has no Cyrillic), as wide as the caption.'},
    {'title': 'Hero link hover', 'src': 'shots/r2-hero-hover-1440.jpg', 'text': 'The link\'s cell gets the white tint; its arrow still nudges 6px.'},
    {'title': 'Lines on white', 'src': 'shots/r2-lines-featured-1440.jpg', 'text': 'The pack square\'s divider was ink 10%, the arrows\' #d5d5d6: now every line is ink 20% on light grounds.'},
    {'title': 'Product on a phone', 'src': 'shots/r2-product-390.jpg', 'text': 'The buy bar stands on the tab bar; the pinned stage is 56px shorter for it.'},
    {'title': 'A pack pressed', 'src': 'shots/r2-pack-press-1440.jpg', 'text': 'Held down: the pack goes 0.45 back (from its hover lift of +0.35 to −0.10) and to 94% of its size, its shadow closer; it stays while held and returns on release (a click holds it at least 0.2s).'},
]
changes_r2 = [
    {'section': 'General', 'items': [
        ['On reload the scroll position should stay the same', 'The site keeps the place itself (<code>scripts/scroll.js</code>): saved per address in the tab, put back instantly after a reload or a step back, and again while fonts, pictures and the packs settle, until you scroll. Measured after a reload: home 3000 → 3000, catalog 2500 → 2500, a coffee 2600 → 2600 (1440 × 900), home 2200 → 2200 (390 × 844). Headless Chromium restored these before too, so the failure you saw is browser-specific: please check where you saw it.', 'check'],
    ]},
    {'section': '3D packs', 'items': [
        ['On scroll should lag a bit behind', 'Every pack trails its slot by up to 12% of its height (at most 40px) and catches up at 9 per second: after a quick scroll of 700px on the catalog it trails 38px and is back within 0.5s (38 → 26 → 12 → 5 → 2 px every 60ms). Sideways rows too. Nothing with «reduce motion». <code>TUNE.lag</code>, <code>lagMax</code> in the console.', 'done'],
        ['On click moving away a bit (on hold stays moved away)', 'A click on a card\'s pack now also opens its coffee (before, only the name was a link). Pointer down on a pack: 0.45 further from the viewer and 94% of its size (from the hover state +0.35 / 103% to −0.10 / 96.8%), the shadow closer; it stays while held and comes back on release; a quick click holds it for at least 0.2s so it reads. On touch it waits 90ms (a touch may be the start of a scroll).', 'done'],
    ]},
    {'section': 'Navbar', 'items': [
        ['1. Remove separating lines between the elements', 'The hairlines between the three groups are gone; the groups are 16px apart (the links 8px of padding each side).', 'done'],
        ['2. Hovers for links and icons semi-transparent white, not affecting other elements', 'Only the hovered item changes: a tint behind its 40px cell (logo, links, icons). White at 20% on dark grounds; on white and cloud, where white cannot show, ink at 6% — the same step in the light ground\'s ink (decision hover-tint). Before: the other links dimmed to 60%.', 'differently'],
        ['3. Left and right padding set to small', 'The bar\'s own margin is 16px at every width (the gutter of a 320 screen), the glyphs 16px from the screen\'s edges (before 12 → 44 with the gutter).', 'done'],
        ['4. [additional padding]', 'Read together with 5: the 8px of air inside the logo\'s and the icons\' boxes is counted in the max width. Tell me if you meant something else.', 'check'],
        ['5. Max width, systematic, counting the logo\'s and icons\' padding', 'The content stops at <code>--col-max + 2 × 8px</code> (1536): from a 1616 screen on, the logo glyph and the last icon glyph stand exactly on the column\'s edges (measured: 0px off at 1680, 1920 and 2560; before 36, 156 and 476px outside).', 'done'],
        ['6. Add profile icon', 'A profile icon in the set\'s 1.5px line, after the bag (and in the tab bar). It leads nowhere yet: there is no profile page.', 'done'],
        ['7. Max width for the inner container, systematic with other max widths', 'The same width as 5: <code>.nav__in</code> is the content column (1520) plus the 8px of air on each side. One max width for everything on the page.', 'done'],
        ['8. Colour by the section behind, smoothly, once fully on it', 'Every section says its ground (<code>data-ground</code>: white, cloud, black, cool grey) and the bar takes its colours once its whole 48px stand on that section; while a boundary crosses the bar it keeps its colours. They cross over in 0.6s (<code>--t-move</code>). Measured on the home page: black over the hero, white over the coffees, black over «Наш подход», white over «О компании», cool grey over business, white over the facts. The tab bar follows the section at the screen\'s foot the same way.', 'done'],
        ['9. Smaller sizes: short links, then the burger, then a bottom menu', 'Four steps: every section from 64em (1024), «Каталог, Бизнесу, Журнал, Контакты» from 48em (768), the burger below, and under 40em (640) the favourites, bag and profile leave for a tab bar at the foot with «Каталог, Корзина, Избранное, Профиль». The widths are the screens of the column steps L and M, where each row fits with room to spare (the sections 584px + two outer columns of 172px at 1024; the short ones 288 + 2 × 172 at 768). The audit now fails if the sections touch the logo or the tools.', 'done'],
        ['10. Links to pages, not anchors; no page, no link', 'Only «Кофе» and «Каталог» link (to the catalog). Каскара, Дрипы, Сеты, Кофейням, Офисам, Бизнесу, Журнал, Контакты, search, favourites, bag and profile are labels without a link (<code>&lt;a&gt;</code> without href) until their page exists; each becomes a link by adding its path in data/site.json (decision nav-links-pages). The hero\'s and the footer\'s links are unchanged: should the same rule apply there?', 'check'],
        ['11. Scrolling above the page turns it white', 'Above the top (a touchpad or phone bounce) the bars keep the first section\'s ground (black on the home page), and the page behind the bounce is that colour too: the top half of the page bounces in its first ground, the bottom half in its last (the footer\'s cloud). A real bounce cannot be made in a headless browser: please check on your Mac and phone.', 'check'],
        ['12. A counter only on the bag', 'The favourites count is gone (navbar and tab bar); the bag keeps its lavender count.', 'done'],
    ]},
    {'section': 'Hero', 'items': [
        ['1. Height: full minus 24px; a system of min and max', f"The screen less 24 (less the 56px tab bar on a phone), at most <code>--hero-max</code> (960 → 1200: a portrait tablet, a 2560 screen), and never less than the cells, the fade (<code>--hero-fade</code> 64 → 160) and a strip of photo (<code>--hero-photo</code> 48 → 120) need. Measured: 876 at 1440 × 900 (was 800), 1056 at 1920 × 1080, 744 at 1024 × 768, 764 at 390 × 844; 1067 at 820 × 1180 and 1200 at 2560 × 1440 (the max). Short phones get the content's height: {a2('320×568','heroH')} at 320 × 568.", 'done'],
        ['2. Ease the black gradient', 'An eased fade in 16 stops along an S-curve (cubic-bezier 0.42, 0, 0.58, 1), as tw-easing-gradients, generated into <code>--fade-black</code> from colors.json; 160px tall at 1440 (was 48px, two stops). The featured photo caption and the business cards use the same fade.', 'done'],
        ['3. All texts in the three blocks trimmed', '<code>text-box: trim-both cap alphabetic</code> on the title, the day row, the digits, the caption and the links: each row\'s padding is the space you see (12 → 20px). Chrome and Safari 18.2+; Firefox keeps the line\'s air.', 'check'],
        ['4. Title always three lines', f"Word under word, at every width: 3 lines at all 25 screens measured (before 1 or 2 lines below 1024).", 'done'],
        ['5. The middle block in three containers, aligned with the three links', f"From M the countdown and the links share three equal rows (CSS subgrid): the day and the time beside «Каталог», the digits beside «Бизнесу», the caption beside «Контакты». Centres within 0px at every screen measured (before 3–13px off). Rows are as tall as the digits need: {a2('1440×900','rowH')}px at 1440.", 'done'],
        ['6. Left and right border on the inner container from a max width', 'A new container step <code>max</code> (1520px: the column at its most). From there the cells are framed by a hairline on each side and the title stands 48px off the left one. 1440 has none; 1680, 1920 and 2560 have them.', 'done'],
        ['7. Hover on the links', 'The link\'s whole cell gets the hover tint (white 20%), and the arrow keeps its 6px nudge.', 'done'],
        ['8. Elements as wide as «ДО БЛИЖАЙШЕЙ ОБЖАРКИ»', f"The caption is 13.9em of the control size; the day row is that wide, the digits are sized to it (control × 13.9 / 3), and the countdown font is now tabular (every digit as wide as «0»), so it is exactly as wide every second: {a2('1440×900','digits')} = {a2('1440×900','caption')} at 1440, {a2('390×844','digits')} = {a2('390×844','caption')} at 390. The audit checks it at every size (decision countdown-as-caption).", 'done'],
        ['9. More than 24h to wait: the date and «До ближайшей обжарки»', 'From Friday 10:00 to Sunday 10:00 (with the placeholder weekday schedule) the digits give way to the date of the next roast, «ПН, 26 ОКТ», in the mono of the headings (Technology has no Cyrillic), sized by its letters to the caption\'s width; screen readers hear «Следующая обжарка в понедельник, 26 октября».', 'differently'],
        ['10. On load the bar rises in from opacity 0 and from below', 'The cells rise one section gap (24 → 48px) and fade in over 0.9s on <code>--ease-out</code>, 0.2s after the page opens (<code>--t-rise</code>, new). Not with «reduce motion».', 'done'],
    ]},
    {'section': 'Borders', 'items': [
        ['Always cool gray 20% on light and white 30% on dark', 'One <code>--line</code>, set by each section\'s ground: ink 20% on white and cloud, white 30% on black and cool grey. Changed: the navbar\'s line (ink 10% → 20%), the hero\'s (white 40% → 30%), the featured pack square and the product lots (ink 10%), arrows, fields and the catalog panel (#d5d5d6 or ink). A new rule in <code>build/rules.mjs</code> fails any border that is not <code>var(--line)</code>; only states (the current pager dot, a focused field) may draw in ink, and drawn marks (the weight dot, a chevron) in currentColor.', 'done'],
    ]},
]
breaks_r2 = [
    f"The hero is taller than the screen on small and sideways phones: {a2('320×568','heroH')} at 320 × 568 (it was 555), {a2('844×390','heroH')} at 844 × 390 (was 376) — three title lines and a countdown as wide as its caption take more room. From 390 × 844 up it is the screen less 24.",
    'Most navbar items lead nowhere now (no page behind them): only «Кофе» / «Каталог» are links. On a phone, «Корзина», «Избранное», «Профиль» in the tab bar do nothing yet.',
    'At 1024–1600 the navbar\'s logo no longer lines up with the content column (it stands at 16px; the column at the gutter, up to 48px): that is the «small» padding. From 1616 on they line up.',
    'The navbar on light grounds hovers in ink, not white (white would be invisible on white).',
    'On a phone the page ends 56px lower (the tab bar\'s room under the footer), and the product\'s pinned stage is 56px shorter.',
    'The countdown is a little smaller than before at 1440 (93 instead of 96px): its size now follows the caption.',
]
def was(o, n): return f"<span class='was'>{o}</span> {n}" if o != n else f"{n}"
hero2_tbl = {'type': 'table', 'title': 'The hero at 25 screens', 'sub': 'Before (struck) and now. Peek: what shows of the next block under the hero, above the tab bar (negative: taller than the screen). Lines: the title. Digits / caption: their drawn widths. Align: the largest distance between a link\'s centre and its countdown part\'s (from M).',
    'columns': [{'label': 'Screen'}, {'label': 'Hero', 'num': True}, {'label': 'Peek', 'num': True}, {'label': 'Lines', 'num': True}, {'label': 'Digits', 'num': True}, {'label': 'Caption', 'num': True}, {'label': 'Row', 'num': True}, {'label': 'Align', 'num': True}],
    'rows': [[n['size'], was(o['heroH'], n['heroH']), was(o['peek'], n['peek']), was(o['titleLines'], n['titleLines']), was(o['digits'], n['digits']), was(o['caption'], n['caption']), was(o['rowH'], n['rowH']), '—' if n['align'] is None else was(o['align'], n['align'])] for o, n in zip(R2['old'], R2['new'])]}
nav2_tbl = {'type': 'table', 'title': 'The navbar at 25 screens', 'sub': 'Step: what the bar shows. Icons: the tools in the bar. Logo / icon: how far the logo glyph and the last icon glyph stand inside the content column\'s edges (negative: outside it, in the gutter).',
    'columns': [{'label': 'Screen'}, {'label': 'Step'}, {'label': 'Icons', 'num': True}, {'label': 'Logo', 'num': True}, {'label': 'Last icon', 'num': True}],
    'rows': [[n['size'], was(o['step'], n['step']), was(o['icons'], n['icons']), was(o['logoX'], n['logoX']), was(o['iconX'], n['iconX'])] for o, n in zip(R2['old'], R2['new'])]}

# ══ Round 3 ════════════════════════════════════════════════════════════════════════════════════════════════════════
# «before» is round 2's build (branch round-2, commit 7c5f586), swept into sweep-before.json; the round's areas
# (footer, new arrivals, the recommended row, the info modal) at 25 screens on both builds are in areas-round3.json.
R3 = J(HERE, 'areas-round3.json')
A3 = {n['size']: (o, n) for o, n in zip(R3['old'], R3['new'])}
def a3(size, key, old=False): return A3[size][0 if old else 1][key]
ROUND2 = J(HERE, 'rounds/round-2.json')
shots_r3 = [
    {'title': 'Packs while the page scrolls (1440)', 'src': 'shots/r3-packs-scroll-1440.jpg', 'text': 'A 300px scroll, the picture 200ms in. Before: the packs leaned with their place on the screen and the scroll\'s speed. After: they stay upright (still trailing their slots a little).'},
    {'title': 'Новинки at 1280', 'src': 'shots/r3-featured-1280.jpg', 'text': f"The pager in the middle of the head ({a3('1280×800','pagerDx')}px off its centre; before {a3('1280×800','pagerDx', True)}); two equal squares {a3('1280×800','featText')} + {a3('1280×800','featMedia')}; a photo on the right without a hairline; the taste box in two even halves ({a3('1280×800','facts')})."},
    {'title': 'Новинки at 1024', 'src': 'shots/r3-featured-1024.jpg', 'text': f"The tightest square: both {a3('1024×768','featText')} wide and square, the story cut to the {a3('1024×768','lines')} whole lines that fit (before 8)."},
    {'title': 'Новинки on a phone (390)', 'src': 'shots/r3-featured-390.jpg', 'text': 'Below M the text stands over the photo, the taste chart over the pills; the pager takes its own row under the title and the arrows, centred.'},
    {'title': 'Рекомендуем sliding (1440)', 'src': 'shots/r3-reel-slide-1440.jpg', 'text': 'The arrow pressed, the picture 220ms in. Before the cards were cut at the column; now the row runs to the screen\'s edges and the packs turn, leading edge away, trailing their slots.'},
    {'title': 'Рекомендуем rising in (1440)', 'src': 'shots/r3-reel-rise-1440.jpg', 'text': 'The row reaching the screen, 260ms in: the cards rise one after another (90ms apart) from 48px below and from clear; each pack fades with its card and tilts up as it is carried.'},
    {'title': 'The price hovered', 'src': 'shots/r3-card-hover-price-1440.jpg', 'text': 'Before: the cell filled with ink. After: the bag and the price fade to 60%, the ground stays.'},
    {'title': 'The heart hovered', 'src': 'shots/r3-card-hover-heart-1440.jpg', 'text': 'The heart fades to 60% under the pointer (it shows when the card is hovered, as before).'},
    {'title': 'The info blocks (1440)', 'src': 'shots/r3-facts-1440.jpg', 'text': 'No hairline above the three blocks; each is one button with the ringed plus (32px, as in Figma).'},
    {'title': 'An info block opened (1440)', 'src': 'shots/r3-facts-open-1440.jpg', 'text': f"Before: the plus opened one sentence in the block. After: the block grows into a {a3('1440×900','modalW')}px box over the dimmed page (Figma info-blocks-modal): icon, title, text, the cross, «‹ Доставка | Оплата ›»."},
    {'title': 'An info block opened (390)', 'src': 'shots/r3-facts-open-390.jpg', 'text': 'On a phone the modal is a sheet at the foot of the screen, as wide as it.'},
    {'title': 'Footer at 1440', 'src': 'shots/r3-footer-1440.jpg', 'text': f"Two squares {a3('1440×900','fBrand')} (before {a3('1440×900','fBrand', True)}); the animated flame centred by its mass ({a3('1440×900','fMarkDy')}px off the square\'s middle); the newsletter line on one line."},
    {'title': 'Footer at 1920', 'src': 'shots/r3-footer-1920.jpg', 'text': 'The column at its most: a hairline on each side of the two squares, as the hero\'s cells have.'},
    {'title': 'The legal line (1440)', 'src': 'shots/r3-footer-legal-1440.jpg', 'text': f"Before: the policy {a3('1440×900','legalDy', True)}px lower than the copyright, underlined. After: one baseline ({a3('1440×900','legalDy')}px), no underline, both ink 70%."},
    {'title': 'Footer at 1024', 'src': 'shots/r3-footer-1024.jpg', 'text': f"The narrowest L: two halves of {a3('1024×768','fLinks')}, taller than square ({a3('1024×768','fBrand')}) because the links need the room."},
    {'title': 'Footer on a phone (390)', 'src': 'shots/r3-footer-390.jpg', 'text': 'Below L the links come first and the flame closes the page.'},
    {'title': 'A card\'s fade (1440)', 'src': 'shots/r3-fade-card-1440.jpg', 'text': 'The fade behind the buy row: before two stops (a visible edge where it ends), now 16 stops on the «ease» curve of tw-easing-gradients.'},
    {'title': 'A business card\'s fade (1440)', 'src': 'shots/r3-fade-business-1440.jpg', 'text': 'The same eased fade from the photo into the black of the card\'s text cells.'},
    {'title': 'The hero\'s fade (1440)', 'src': 'shots/r3-fade-hero-1440.jpg', 'text': 'The hero\'s fade now follows «ease» (before an S-curve, 0.42 0 0.58 1): it leaves the photo sooner and settles into black longer.'},
    {'title': 'PT Mono (1440)', 'src': 'shots/r3-type-1440.jpg', 'text': 'Headings and names in PT Mono Bold, as in Figma (before JetBrains Mono Bold).'},
    {'title': 'A card opening its coffee (1280)', 'src': 'shots/r3-card-to-page-1280.jpg', 'text': 'After only (before: a plain page load). Frames at 0, 150, 300 and 600ms: the card\'s name and pack travel to the page\'s title and big pack while the rest cross-fades.'},
]
changes_r3 = [
    {'section': '3D packs', 'items': [
        ['1. No tilt on scroll', 'The shelf lean (a tilt by the pack\'s place on the screen, up to 0.17 rad) and the lean with the scroll\'s speed (up to 0.45 rad) are gone: scrolling the page never tilts a pack. They still trail their slots a little (round 2) and turn towards the pointer.', 'done'],
    ]},
    {'section': 'New section (Новинки)', 'items': [
        ['1. The numbers block centred', f"The head is three columns from M: the title, the pager, the arrows; the pager\'s centre is {a3('1440×900','pagerDx')}px off the head\'s at every screen measured (before {a3('1440×900','pagerDx', True)}px at 1440). Below M it takes its own row, centred.", 'done'],
        ['2. The card in two columns (the left one became larger sometimes)', f"Two tracks of <code>minmax(0, 1fr)</code>, both squares, and the text square can no longer grow: its story is cut to the whole lines that fit (8 at 1440, {a3('1024×768','lines')} at 1024). Measured: two squares at every L screen ({a3('1024×768','featText')} at 1024, {a3('1440×900','featText')} at 1440, all five slides). In Chromium round 2 measured even too, also with 20px browser text, so I could not see the larger left one: was it in Safari, or on the test site (still round 1)? Whatever made it grow is gone now.", 'check'],
        ['3. The right column a photo, without a border', 'Every slide shows a photo: the coffee\'s own, else the next of four moodboard photos (a placeholder, decision featured-photos). The hairline is gone with the pack square.', 'done'],
        ['4. The whole card a link', 'The name\'s link is stretched over the whole slide (text, taste box and photo); the caption lets clicks through. Measured: a click on the story, the pills, the photo and the caption opens the coffee.', 'done'],
        ['5. The table evenly two columns', f"Two equal halves from M: {a3('1440×900','facts')} at 1440 (before {a3('1440×900','facts', True)}), {a3('1280×800','facts')} at 1280. Two exceptions: below M the chart stands above the pills (a half of a phone can\'t hold the scales\' names and the plot: it squeezed the plot); and on L\'s narrowest screens the chart keeps its size, so its half is a little wider (12px at 1000, 3 at 1024, 0 from 1030).", 'differently'],
        ['6. A magazine-like swipe: explore options in an artifact', "Five options in a test bench: <a href='https://claude.ai/artifact/39Cx5ty8t6AsCp7NAJNyqy'>Новинки: листаем журнал</a> (a stiff page turn, a bending glossy page, a slide-over, a pile, an editorial cut), each dragged by hand or played by the arrows, with a duration control and slow motion. Pick one and it goes on the site.", 'check'],
    ]},
    {'section': 'Recommended (Рекомендуем)', 'items': [
        ['1. Packs tilt horizontally on sliding, lagging a bit behind', 'A pack\'s lag is now two parts: the page\'s scroll (it only trails) and its slot\'s own move on the page. When the row slides the pack trails and turns so its leading edge recedes, up to 0.55 rad at the full trail (<code>TUNE.carryTurn</code>), settling at 9 per second.', 'done'],
        ['2. The wrapper should not crop the cards', f"The row runs out to the screen\'s edges ({a3('1440×900','reelW')} wide at 1440 against a column of {a3('1440×900','colW')}), padded back, so its cards still stand and snap on the column ({a3('1440×900','firstAt')}px off it); 48px of room under the cards for them to rise.", 'done'],
        ['3. The new card moves into place from below and from opacity 0; its pack tilts vertically and lags', 'Cards out of view wait 48px below (<code>--section-gap</code>) and clear; coming into view, when the row reaches the screen (one after another, 90ms apart) or sliding in, they rise over 0.9s (<code>--t-rise</code>) and fade in over 0.6s. Their pack is carried: it trails and tilts up (<code>TUNE.carryTilt</code> 0.45) and fades with its card (a new per-pack alpha in the renderer).', 'done'],
        ['4. The price button: icon and text more transparent, the ground as it was', 'Hovered, the bag and the price go to ink 60% (white 60% on a photo card); the ground stays (before it filled with ink).', 'done'],
        ['5. The favourite icon more transparent', 'Hovered, the heart goes to ink 60% (white 60% on a photo card).', 'done'],
        ['6. The whole card, the text under it too, a link', 'The name\'s link is stretched over the whole card; nothing between them is positioned any more (the picture\'s layers share one grid cell). Measured on home, catalog and a coffee\'s page: the picture, the name and the text open the coffee; the heart, the weights and the price button keep their own clicks.', 'done'],
    ]},
    {'section': '3 blocks (обжарка, доставка, оплата)', 'items': [
        ['1. No top border', 'The hairline above the blocks is gone (the business section ends above them).', 'done'],
        ['2. On click they grow into a modal with description and buttons (Figma)', f"Each block is one button. Pressed, a white ground grows from the block\'s box to the modal\'s ({a3('1440×900','modalW')}px at 1440, {a3('1024×768','modalW')} at 1024: <code>--modal-w</code> 360 → 520), the icon and the title travel to their places at the same size, the plus travels to the corner and turns into the cross; the text and «‹ Доставка | Оплата ›» fade in after (0.6s). The row steps to the other blocks; Esc, the cross or a click beside it shrinks it back into its block. On a phone a sheet at the foot. The roasting text is Figma\'s, with the next roast live («Ближайшая обжарка через 3 часа»).", 'done'],
    ]},
    {'section': 'Footer', 'items': [
        ['1. On larger screens two square containers', f"From L two equal halves, each at least a square: square from about 1360 wide ({a3('1440×900','fBrand')} at 1440, {a3('1920×1080','fBrand')} at 1920); narrower the links need more height and both halves grow with them ({a3('1280×800','fBrand')} at 1280, {a3('1024×768','fBrand')} at 1024).", 'differently'],
        ['2. At max width, borders on the left and right', 'From the column\'s 1520px (screens from about 1616) a hairline on each side, the copyright and the links standing off them.', 'done'],
        ['3. The logo optically centred', f"The animated flame (your file, 27 KB gzipped, loaded lazily; its first frame with «reduce motion») is centred by its mass, measured over its whole animation: 50.5% across, 62.9% down its box. That lifts it by 12% of its height, as the Figma footer\'s 40px of a 320px logo. Its mass centre is {a3('1440×900','fMarkDy')}px off the square\'s middle at every L screen.", 'done'],
        ['4. The small texts properly aligned', f"One size, one colour (ink 70%) and one baseline: {a3('1440×900','legalDy')}px apart (before {a3('1440×900','legalDy', True)}px: the link had its own padding and underline).", 'done'],
        ['5. «Политика конфиденциальности» without an underline', 'No underline; hovered it darkens to ink.', 'done'],
        ['6. «Расскажем о появлении скидок и новинок» one line when there is room', f"The line and the field share a row while both fit, and the line keeps whole: one line at {sum(1 for o, n in zip(R3['old'], R3['new']) if n['newsLines'] == 1)} of 25 screens (before {sum(1 for o, n in zip(R3['old'], R3['new']) if o['newsLines'] == 1)}); two only where the screen is narrower than the line.", 'done'],
        ['PT Mono and the logo animation (your files)', 'PT Mono Bold for every heading and name, cut to the text face\'s characters (13 KB; the ParaType Free Font Licence allows web use); the flame in the footer.', 'done'],
    ]},
    {'section': 'Gradients', 'items': [
        ['All gradients eased (tw-easing-gradients): hero, product card, business card…', 'Every gradient is one of the eased fades of colors.json: 16 stops on CSS\'s standard «ease» (0.25, 0.1, 0.25, 1), the default of tw-easing-gradients; a new cloud fade for light cards. Changed: the card\'s buy row (was two stops), the business cards (two stops), the featured caption (two stops), the hero (was an S-curve). A new rule fails any hand-written fade.', 'done'],
    ]},
    {'section': 'Card → product page', 'items': [
        ['A card on a click transforms into the product page seamlessly (the title and the pack travel)', 'A cross-document view transition: the card\'s name becomes the page\'s title and its pack the big pack, travelling and growing over 0.6s while the pages cross-fade (0.45s); the way back does the same. The 3D canvas cannot be captured, so for that moment the packs show their stills, and the big pack arrives facing front. Chrome 126+ and Safari 18.2+; elsewhere the page simply opens.', 'check'],
    ]},
]
breaks_r3 = [
    'Every page change now cross-fades (0.45s), not only a card opening its coffee. With «reduce motion» there is no transition.',
    'While a card rises into place (0.9s) its pack draws above its name and buy row: a moving, fading card is a layer of its own. At rest the layers are as before.',
    f"The footer is square only from about 1360 wide; at 1024–1350 the links need more than the square ({a3('1024×768','fBrand')} at 1024).",
    'Card descriptions under the cards are part of the link now, so their text can\'t be selected (it couldn\'t be drag-selected before either).',
    'The new arrivals cut their story to fewer lines on narrow L screens (4–6 at 1024 instead of 8), so the text square stays square.',
    'Below M the taste chart and the pills stack again (round 2 had them side by side from S, which squeezed the chart on a phone once the halves were made even).',
    'Pages for the info blocks («Доставка», «Оплата») are not designed: the modal is the only place their text lives.',
    'The 3D packs no longer lean when the page scrolls, so the shelf feeling is gone; the trail and the pointer turn remain.',
]
def was3(o, n): return f"<span class='was'>{o}</span> {n}" if o != n else f"{n}"
footer3_tbl = {'type': 'table', 'title': 'The footer at 25 screens', 'sub': 'Brand: the left half (width × height; a square from L where the links fit). Mass: how far the flame\'s mass centre stands from the square\'s middle (from L). Legal: the distance between the baselines of the copyright and the policy. News: the newsletter line\'s lines.',
    'columns': [{'label': 'Screen'}, {'label': 'Halves', 'num': True}, {'label': 'Brand'}, {'label': 'Mass', 'num': True}, {'label': 'Legal', 'num': True}, {'label': 'News', 'num': True}, {'label': 'Sides'}],
    'rows': [[n['size'], was3(o['fCols'], n['fCols']), was3(o['fBrand'], n['fBrand']), '—' if n['fMarkDy'] is None else n['fMarkDy'], was3(o['legalDy'], n['legalDy']), was3(o['newsLines'], n['newsLines']), was3(o['sides'], n['sides'])] for o, n in zip(R3['old'], R3['new'])]}
feat3_tbl = {'type': 'table', 'title': 'New arrivals at 25 screens', 'sub': 'Text / photo: the widths of the two halves (one above the other below L). Heights: text / photo. Taste box: its two cells. Pager: its centre off the head\'s. Lines: the story\'s whole lines.',
    'columns': [{'label': 'Screen'}, {'label': 'Text', 'num': True}, {'label': 'Photo', 'num': True}, {'label': 'Heights'}, {'label': 'Taste box'}, {'label': 'Pager', 'num': True}, {'label': 'Lines', 'num': True}],
    'rows': [[n['size'], was3(o['featText'], n['featText']), was3(o['featMedia'], n['featMedia']), was3(o['featH'], n['featH']), was3(o['facts'], n['facts']), was3(o['pagerDx'], n['pagerDx']), was3(o['lines'], n['lines'])] for o, n in zip(R3['old'], R3['new'])]}
reel3_tbl = {'type': 'table', 'title': 'The recommended row and the info modal at 25 screens', 'sub': 'Row: its width against the column (it runs to the screen\'s edges now). First card: its left edge off the column\'s. Modal: the opened box (width × height; a sheet on a phone).',
    'columns': [{'label': 'Screen'}, {'label': 'Row', 'num': True}, {'label': 'Column', 'num': True}, {'label': 'First card', 'num': True}, {'label': 'Modal'}, {'label': 'Kind'}],
    'rows': [[n['size'], was3(o['reelW'], n['reelW']), n['colW'], was3(o['firstAt'], n['firstAt']), f"{n.get('modalW')} × {n.get('modalH')}", n.get('sheet', '—')] for o, n in zip(R3['old'], R3['new'])]}


# ── round 5: the measures of its areas on round 4's build (main) and on this one (tools/areas-round5.mjs) ──
R5 = J(HERE, 'areas-round5.json')
A5 = {n['size']: (o, n) for o, n in zip(R5['old'], R5['new'])}
def a5(size, key, old=False): return A5[size][0 if old else 1][key]
ROUND3 = J(HERE, 'rounds/round-3.json')
PR5 = 'https://github.com/timofeylebedev/qq/pull/8'
TUNER = 'https://claude.ai/artifact/GvQeoJRk2AKU14XjRQvQPJ'
def was(old, new): return f"<span class='was'>{old}</span> {new}" if old != new else f"{new}"
shots_r5 = [
    {'title': 'The hero\'s fade (1440)', 'src': 'shots/r5-fade-hero-1440.jpg', 'text': 'Before: a 160px fade, then solid black under the cells. After: one eased fade under the whole block, the photo melting through to the foot. Its curve, reach and lead-in are yours to tune in the fade tuner.'},
    {'title': 'A business card\'s fade (1440)', 'src': 'shots/r5-fade-business-1440.jpg', 'text': 'The text band: before a 40px fade over a black band, now one fade over the whole band.'},
    {'title': 'A card\'s buy row (catalog, 1440)', 'src': 'shots/r5-fade-card-1440.jpg', 'text': 'The buy row\'s fade runs over its cells too; its lead-in lets clicks through to the card.'},
    {'title': 'Pager hovered', 'src': 'shots/r5-hover-pager-1440.jpg', 'text': 'Before: only the number darkened. After: its round cell is tinted (ink 6%).'},
    {'title': 'Arrows hovered', 'src': 'shots/r5-hover-arrows-1440.jpg', 'text': 'Before: the cloud ground. After: the same tint as every control.'},
    {'title': 'A card\'s weights hovered', 'src': 'shots/r5-hover-card-1440.jpg', 'text': 'Before: nothing (the price faded to 60% on its own hover). After: each cell tints its ground; the weights are one cell — a click anywhere picks the other weight.'},
    {'title': 'The heart hovered', 'src': 'shots/r5-hover-heart-1440.jpg', 'text': 'Before: the heart faded to 60%. After: its 40px cell is tinted.'},
    {'title': 'Packs while the page scrolls (1440)', 'src': 'shots/r5-packs-scroll-1440.jpg', 'text': 'A 300px scroll, 200ms in. Before: the packs trailed their slots. After: they stand exactly in them.'},
    {'title': 'Navbar (1440)', 'src': 'shots/r5-navbar-1440.jpg', 'text': 'The sections in one row (before three groups 16px apart); your profile icon from Figma.'},
    {'title': 'Navbar hovered', 'src': 'shots/r5-navbar-hover-1440.jpg', 'text': f"The tint is {a5('1440×900','navAir')}px from the text at the sides (before {a5('1440×900','navAir', True)}), as far as above the capitals and under the baseline; the texts stay 16px apart."},
    {'title': 'Hero at 1440', 'src': 'shots/r5-hero-1440.jpg', 'text': f"The title fills its cell: {a5('1440×900','titlePx')}px (before {a5('1440×900','titlePx', True)}), and its three lines set the cells' height ({a5('1440×900','cellsH')}px; rows {a5('1440×900','rowH')} each). The link lines run to the screen's edge."},
    {'title': 'Hero at 1920', 'src': 'shots/r5-hero-1920.jpg', 'text': f"{a5('1920×1080','titlePx')}px (before {a5('1920×1080','titlePx', True)}); framed by a hairline on each side, the lines stop at the frame."},
    {'title': 'Hero at 1024', 'src': 'shots/r5-hero-1024.jpg', 'text': f"{a5('1024×768','titlePx')}px (before {a5('1024×768','titlePx', True)}). Here the countdown's digits are taller than a third of the title, so the rows ({a5('1024×768','rowH')}px) still lead."},
    {'title': 'Hero at 800', 'src': 'shots/r5-hero-800.jpg', 'text': 'Below L the title keeps its type size; the lines above the countdown and the links and between the links now run to both edges.'},
    {'title': 'Hero on a phone (390)', 'src': 'shots/r5-hero-390.jpg', 'text': 'Stacked cells, every line to the screen\'s edges.'},
    {'title': 'A hero link hovered', 'src': 'shots/r5-hero-link-hover-1440.jpg', 'text': 'Before: the arrow slid 6px right. After: only the ground tints.'},
    {'title': 'The roast note (1440)', 'src': 'shots/r5-hero-note-1440.jpg', 'text': f"Opened by the «i»: {a5('1440×900','noteSize')}px at every size (before {a5('390×844','noteSize', True)} on a phone, {a5('1440×900','noteSize', True)} at 1440), trimmed to its capitals and balanced, in place of the digits (no black box); the «i» stays lit."},
    {'title': 'The taste cell (1440)', 'src': 'shots/r5-taste-1440.jpg', 'text': f"Text to the cell's edge, left / top: {a5('1440×900','tastePad')}px (before {a5('1440×900','tastePad', True)})."},
    {'title': 'The taste cell (1024)', 'src': 'shots/r5-taste-1024.jpg', 'text': 'Where the pills make the box taller, the chart stands in its middle.'},
    {'title': 'Рекомендуем sliding (1440)', 'src': 'shots/r5-reel-slide-1440.jpg', 'text': 'The arrow pressed, 220ms in. Before: the cards slid out uncut, their packs turning. After: the leaving card has sunk away as soon as it crossed the column\'s edge, and the next one rises in once half of it is in (here just starting); the packs stay upright.'},
    {'title': 'Рекомендуем after the slide', 'src': 'shots/r5-reel-rest-1440.jpg', 'text': 'Nothing shows beyond the column at rest (before: the next card stood in the right margin).'},
    {'title': 'Business (1440)', 'src': 'shots/r5-business-1440.jpg', 'text': f"From the lead to the cards {a5('1440×900','bizGap')}px, as much as above the heading ({a5('1440×900','bizTop')}; before {a5('1440×900','bizGap', True)}). The whole card is its link; the arrow stays still."},
    {'title': 'The info blocks (1440)', 'src': 'shots/r5-facts-1440.jpg', 'text': f"Icons {a5('1440×900','factIcon')}px (before {a5('1440×900','factIcon', True)}); the plus {a5('1440×900','plusIn')}px from the corner (right / top; before {a5('1440×900','plusIn', True)}), as Figma's."},
    {'title': 'The info blocks on a phone (390)', 'src': 'shots/r5-facts-390.jpg', 'text': 'Stacked, the lines between them run to the screen\'s edges.'},
    {'title': 'The modal growing, 150ms in', 'src': 'shots/r5-modal-150ms-1440.jpg', 'text': 'One card: it starts exactly on the block and grows; the text rides with the title, the step row slides up from the card\'s foot. Before: the ground grew, the text and the row faded in after.'},
    {'title': 'The modal open (1440)', 'src': 'shots/r5-modal-1440.jpg', 'text': f"The step row {a5('1440×900','stepH')}px tall (before {a5('1440×900','stepH', True)}; Figma 66). The box keeps the tallest panel's height, so stepping moves nothing."},
    {'title': 'The modal on a phone (390)', 'src': 'shots/r5-modal-390.jpg', 'text': 'The sheet at the foot of the screen, the same card move.'},
    {'title': 'Footer at 1440', 'src': 'shots/r5-footer-1440.jpg', 'text': f"The newsletter's line and field in two equal halves ({a5('1440×900','newsHalves')}px; before {a5('1440×900','newsHalves', True)})."},
    {'title': 'Footer at 900', 'src': 'shots/r5-footer-900.jpg', 'text': 'The lines under the cells run out to the screen\'s edges on the sides where the column ends.'},
    {'title': 'A footer link hovered', 'src': 'shots/r5-footer-hover-1440.jpg', 'text': 'The underline in ink 40%, 0.4em below the letters (before full ink at 0.2em).'},
]
changes_r5 = [
    {'section': 'General', 'items': [
        ['The gradients should be eased, no solid colours like in the hero; an artifact to tweak them', f"Four fades, one per place (colors.json fades: hero, caption, panel, card), each laid over the whole block it stands under; no solid band anywhere, and a rule now refuses a fade with a band under it. <a href='{TUNER}'>The fade tuner</a>: the built home page in a frame, a curve editor (with the presets of tw-easing-gradients), reach, stops and lead-in per fade, five screen sizes; «Save for Claude» keeps the values for the next commit.", 'done'],
        ['The scroll position should not change on changing the window\'s size', 'The first block that starts under the navbar stays where it stood (scripts/scroll.js). Only a change of width counts, and never during a scroll, so a phone\'s fling is not stopped when its toolbar hides. Measured: the business heading moves only by its section\'s shrinking padding (200 → 149px at 500 wide).', 'done'],
        ['On hover these change the ground of their own container to semi-transparent cool grey or white: navbar links and icons, the 3 hero links, the page numbers, the arrows, the card\'s 2 buttons, the heart', 'Every one of them tints its own cell with <code>--tint</code> (ink 6% on light, white 20% on dark and photo cards). Nothing moves on hover anywhere (icons, photo zooms): a new rule, «Hovers never move».', 'done'],
        ['In the focused state nothing should be changed', 'A pointer lights nothing: the modal now opens with the focus on its box, scripts move focus without a ring after a click (scripts/focus.js), text fields keep their border. For the keyboard the ring stays (Tab, Enter, Esc work as before).', 'differently'],
        ['3D packs: remove the lag on scroll', 'No lag on the page\'s scroll or a row\'s slide, no tilt when sliding. Only a card rising into place still carries its pack up.', 'done'],
        ['3D packs: on click moving away a bit, on hold stays moved away', 'A press anywhere on the card (not its buttons) moves the pack away (lift −0.45, scale 0.94) and holds it while the pointer is down; before it took a press on the pack itself.', 'done']]},
    {'section': 'Navbar', 'items': [
        ['The links should be in 1 group (now there are 3)', 'One row, every text 16px from the next.', 'done'],
        ['Change the profile icon to the actual one from Figma', 'Exported from the Figma navbar (profile, 24px), drawn in the current colour.', 'done'],
        ['The ground of the links on hover larger, padding around the text even; the gap stays, no movement', f"The tint {a5('1440×900','navAir')}px beside the text (was {a5('1440×900','navAir', True)}): 16px text in a 40px cell has 13px over its capitals and 15 under its baseline. It is drawn 6px wider than the link, so the texts stay and the pointer passes from one link to the next in the middle of the gap.", 'done']]},
    {'section': 'Hero', 'items': [
        ['1. The title should shape the height of the whole bottom container; on larger screens its size should be larger than now', f"From L the title fills its cell («обжарки» 4.55em from the cell's edge to its padding), capped at its size at the column's 1520: {was(a5('1024×768','titlePx', True), a5('1024×768','titlePx'))}px at 1024, {was(a5('1440×900','titlePx', True), a5('1440×900','titlePx'))} at 1440, {was(a5('1920×1080','titlePx', True), a5('1920×1080','titlePx'))} from 1920. From 1366 its lines set the cells' height ({a5('1440×900','cellsH')}px at 1440); narrower, the countdown's digits are taller and the rows lead ({a5('1024×768','cellsH')} vs a {a5('1024×768','titleH')}px title at 1024). Decision hero-title-fills-cell.", 'check'],
        ['2. The inner container should have left and right borders from the max width — on larger screens it disappears; the same for the 3 blocks and the footer', 'The frame is there from the column\'s 1520px, at 1920 and 2560, in Chromium, for the hero, the info blocks and the footer. I could not make it disappear: at which width and in which browser did you see it go?', 'open'],
        ['3. On hover a link\'s icon shouldn\'t move', 'It stays; only the ground tints.', 'done'],
        ['4. Lines should always run full width (now on smaller screens they don\'t); the same for the 3 blocks and the footer', f"Below the column's max every hairline between cells runs out to the screen's edges on the sides where the column ends (a line with <code>--out-l</code> / <code>--out-r</code> of the gutter): the hero's link lines end {a5('1440×900','lineEnd')}px from the screen's edge at 1440 (before {a5('1440×900','lineEnd', True)}). From 1520 the block is framed and the lines stop at the frame.", 'done'],
        ['5. On load the 3-column block moves to its place from opacity 0 and from below, with its outer container and top border', 'The whole block rises: the fade, the hairline above it and the cells, one section gap over 0.9s.', 'done'],
        ['6. The text after the «i» optically centred, up to 16px', f"16px at every size (before {a5('390×844','noteSize', True)} on a phone), trimmed to its capitals and baseline and balanced, so it is centred by what you see; it takes the place of the digits and caption.", 'done'],
        ['7. The «i» icon should stay selected after a click', 'It keeps the hover tint while the note is open.', 'done'],
        ['8–10 (your notes)', 'Left alone, as you asked.', 'answered']]},
    {'section': 'New', 'items': [
        ['1. The numbers block should be centred', 'Measured in Chromium: the pager\'s middle is the head\'s and the screen\'s middle within 0px at 390, 700, 1024, 1280, 1440 and 1920 (the number inside each ring within 0.4px). Where did it look off (size, browser)?', 'open'],
        ['2. The 4-qualities cell: more space left and right, so the padding feels even', f"Its sides get the air its rows have above them (12px + (1.75em − the capitals) / 2): text to the edge {a5('1440×900','tastePad')}px left / top at 1440 (before {a5('1440×900','tastePad', True)}); centred where the pills make the box taller.", 'done'],
        ['3. The picture should not move on hover', 'It stays (no zoom anywhere on the site now).', 'done'],
        ['5 (your note)', 'Left alone.', 'answered']]},
    {'section': 'Recommended', 'items': [
        ['1. Packs shouldn\'t tilt on sliding', 'They don\'t (carryTurn removed).', 'done'],
        ['2. Packs outside the container shouldn\'t be visible; they disappear the opposite way of how they appear', 'Cards show only inside the column: one comes in when half of it is in and rises, one leaves as soon as it starts crossing the edge and sinks away (0.45s, the rise reversed); its pack goes with it, upright. At rest nothing stands beyond the column, however far a swipe went. A phone keeps its peek.', 'done'],
        ['3. Some area on the card above the buttons isn\'t clickable', 'The buy row\'s fade (its 56px lead-in) took the clicks; it now lets them through to the card\'s link. Measured: no dead point on the recommended and catalog cards.', 'done'],
        ['4. The whole left button should be clickable as one', 'A click anywhere in the weights cell picks the other weight; it tints as one on hover.', 'done']]},
    {'section': 'Business', 'items': [
        ['1. The gap between the text and the cards equal to the top padding', f"{was(a5('1440×900','bizGap', True), a5('1440×900','bizGap'))}px at 1440 = the {a5('1440×900','bizTop')}px above the heading (<code>--section-y</code> at every size).", 'done'],
        ['2. The whole cards should be links', 'The photo is now a layer under the card\'s content, so the title\'s link reaches over all of it.', 'done'],
        ['3. The arrow shouldn\'t move', 'It stays.', 'done']]},
    {'section': '3 blocks (обжарка, доставка, оплата)', 'items': [
        ['1. The icons on larger screens larger', f"A new size role <code>fact/icon</code> 40 → 56: {a5('1440×900','factIcon')}px at 1440 (before {a5('1440×900','factIcon', True)} everywhere), in the modal too.", 'done'],
        ['2. The plus closer to the corner (Figma)', f"12px from the top and right, as Figma's card-modal (before {a5('1440×900','plusIn', True)} right / top at 1440); the modal's cross stands there too.", 'done'],
        ['3. The transition to the open version is not seamless or smooth (both ways)', 'One card: the modal\'s box starts exactly on the block, cut to its size, and grows into place on --ease-out (0.6s); closing is the same move backwards. Before: the white ground scaled up and the text and row faded in after it.', 'done'],
        ['4. The buttons should slide from the bottom, as if they were in the card, not added after', 'The step row stays at the card\'s foot: it slides up from under the growing edge.', 'done'],
        ['5. The description always aligned with the title', 'It rides with the title the whole way (the same move), fading in.', 'done'],
        ['6. In the open version the buttons are not the proper size and should not move on click', f"{was(a5('1440×900','stepH', True), a5('1440×900','stepH'))}px tall at 1440 (Figma 66: 24 + the text + 24). The box keeps the tallest panel's height and only the text changes, so the row never moves.", 'done'],
        ['8 (your note)', 'Left alone.', 'answered']]},
    {'section': 'Footer', 'items': [
        ['1. The underline on hover a bit more transparent and a few pixels lower', 'Ink 40% (was full ink), 0.4em below the letters (was 0.2em: 3px lower at 16px).', 'done'],
        ['2. «Расскажем о появлении скидок и новинок» and the field as 2 equal columns, when available', f"From M: {a5('1440×900','newsHalves')}px at 1440 (before {a5('1440×900','newsHalves', True)}); below M the line over the field.", 'done']]},
]
breaks_r5 = [
    'Over the photo the cells are no longer solid black: the photo shows faintly behind the title, the countdown and the links, and on the business cards and the business page\'s offers the text sits where the fade is 33–38% (the lightest pixels behind an offer title give 2.4:1). The fade tuner can set a curve that darkens sooner, or a reach under 1.',
    'The hero\'s title is bigger at L (62 → 90px), so at 1440 × 900 the photo above the cells is 20px shorter.',
    'No hover moves anything any more: the photo zooms of the cards, the business cards, the offers and the places, and the sliding arrows of the hero, the business cards, the «Читать» buttons and the row links are gone everywhere, not only where you named them.',
    'Text fields no longer change their border when clicked; the caret is the only sign (the keyboard still gets the ring).',
    'Recommended cards in the margins are gone: at 1920 the right margin no longer shows the next card (a question from round 3).',
]

def w5(o, n, k, unit=''):
    a, b = o.get(k), n.get(k)
    if b is None: return '—'
    return f"<span class='was'>{a}{unit}</span> {b}{unit}" if a is not None and a != b else f"{b}{unit}"
r5_tbl = {'type': 'table', 'title': 'Round 5\'s measures at 25 screens', 'stack': True,
  'sub': 'Round 4 (main) struck, round 5 after it. Title: its size; cells: the height of the title and of the cells (from L the title leads when they match). Line: how far from the screen\'s edge the hero\'s link lines end (0: at the edge; at the frame from 1520). Nav: the hover ground\'s air beside a link\'s text. Taste: text to the cell\'s left / top edge. Gap: business lead → cards (top: above the heading). Plus: from the block\'s right / top edge. Step: the modal\'s step row.',
  'columns': [{'label': 'Screen'}, {'label': 'Title', 'num': True}, {'label': 'Title / cells', 'num': True}, {'label': 'Line', 'num': True}, {'label': 'Note', 'num': True}, {'label': 'Nav', 'num': True},
              {'label': 'Taste'}, {'label': 'Gap / top'}, {'label': 'Icon', 'num': True}, {'label': 'Plus'}, {'label': 'Step', 'num': True}, {'label': 'Newsletter'}],
  'rows': [[n['size'], w5(o, n, 'titlePx'), f"{n['titleH']} / {n['cellsH']}" + (" · title" if n['leads'] == 'title' else ''), w5(o, n, 'lineEnd'), w5(o, n, 'noteSize'), w5(o, n, 'navAir'),
            w5(o, n, 'tastePad'), f"{w5(o, n, 'bizGap')} / {n['bizTop']}", w5(o, n, 'factIcon'), w5(o, n, 'plusIn'), w5(o, n, 'stepH'), w5(o, n, 'newsHalves')] for o, n in zip(R5['old'], R5['new'])]}
data = {
  'meta': {'key': 'qq-system-report-r5', 'title_tag': 'QQ Site System, Round 5',
    'name': 'QQ Coffee <span>· the site system</span>',
    'eyebrow': f"Round 5 · branch round-5 · <a href='{PR5}'>pull request #8</a> · <a href='{SITE}'>test site</a> · <a href='{FIGMA}'>Figma</a> · <a href='{TUNER}'>fade tuner</a>",
    'title': 'One fluid size system for the whole site; round 5: fades over whole blocks, hovers that tint and never move, a hero title that fills its cell, blocks that open as one card',
    'lede': f"The whole system of the QQ Coffee site: {len(sroles) + len(troles)} size roles drawn as lines from a 320 to a 1440 screen, three shared layout steps and the column at its most, one colour table with one line colour, one motion vocabulary, the 3D packs. Round 5 answers your comments on the home page: four eased fades laid over their whole blocks (and a tuner for them), the place kept when the window resizes, hovers that tint the control's own ground and never move, quiet focus for the pointer, packs without lag, one row of navbar links, a hero title that fills its cell, lines that run to the screen's edges, info blocks that open as one card, and the footer's newsletter in two halves. Measured at every 10px of width and 25px of height and at 25 real screens; «before» is round 4's build (main).",
    'footer': f"Measured in headless Chromium on the built sites, {sweep['measured'][:10]}. Before = round 4 (main, commit 604abd7); now = branch round-5. Earlier rounds compared with their own previous builds (round 1 with the Figma frames)."},
  'sections': [
    {'id': 'changes', 'nav': 'Round 5', 'title': 'Round 5: what changed', 'sub': 'Your comments in your order and under your headings, what was done with each (measured before → now), and the two builds side by side.', 'blocks': [
      {'type': 'stats', 'items': [{'n': sum(len(g['items']) for g in changes_r5), 'unit': 'comments', 'text': ', '.join(f"{sum(1 for g in changes_r5 for i in g['items'] if i[2] == t)} {w}" for t, w in (('done', 'done'), ('differently', 'done differently'), ('check', 'for you to check'), ('open', 'not reproduced'), ('answered', 'your notes, left alone')))},
                                  {'n': 4, 'unit': 'fades', 'text': "one per place, each over its whole block, tunable in the fade tuner"},
                                  {'n': f"{a5('1440×900','titlePx', True)} → {a5('1440×900','titlePx')}", 'unit': 'px', 'text': 'the hero title at 1440: it fills its cell'},
                                  {'n': len(rules_items) or 12, 'unit': 'rules', 'text': 'checked on every build: «hovers never move» is new' + (' · audit clean' if audit_clean else '')}]},
      {'type': 'shots', 'label': 'What it looks like', 'note': 'Round 4 (main) in grey, round 5 in blue, at the size each caption names. Click a picture to open it large; arrows and Escape work.', 'items': shots_r5},
      {'type': 'changes', 'groups': [{'section': g['section'], 'items': [{'ask': a, 'done': d, 'tag': t} for a, d, t in g['items']]} for g in changes_r5]},
      {'type': 'list', 'title': 'What this changes that you may not expect', 'items': breaks_r5},
    ]},
    {'id': 'system', 'nav': 'System', 'title': 'The system', 'sub': 'design/scale.json: one range (320 → 1440), one ladder, roles with two ends. build/tokens.mjs writes one clamp() per role and checks the rules.', 'blocks': [
      {'type': 'ladder', 'title': 'The ladder', 'sub': 'Steps of 2 up to 24, of 4 up to 64, of 8 up to 128, of 16 up to 256. Every end of every role sits on it (dots).', 'values': L,
       'bands': [[0, 24, 'step 2'], [24, 64, 'step 4'], [64, 128, 'step 8'], [128, 256, 'step 16']],
       'marks': [{'v': v, 'label': r} for r, x in {**{k: v['px'] for k, v in troles.items()}, **{k: v['px'] for k, v in sroles.items()}}.items() for v in x if v <= 256],
       'labelled': [8, 16, 24, 32, 48, 64, 96, 128, 192, 256]},
      {'type': 'table', 'title': 'Text roles', 'sub': 'Value at 320 and 1440 (constant outside), the face, where it is used, and the Figma steps at 320 / 768 / 1280 / 1440 / 1920 where one exists.', 'stack': True,
       'columns': [{'label': 'Role'}, {'label': '320', 'num': True}, {'label': '1440', 'num': True}, {'label': 'Face'}, {'label': 'Figma', 'muted': True}, {'label': 'Used for', 'muted': True}],
       'rows': [[f"<code>{k}</code>", v['px'][0], v['px'][1], v['family'] + (' · label' if v.get('label') else ''),
                 ' / '.join(str(FIG[css_of(k)][i]) for i in (0, 2, 4, 5, 6)) if css_of(k) in FIG else '—', v['use']] for k, v in troles.items()]},
      {'type': 'grid', 'cols': 2, 'blocks': [
        {'type': 'relations', 'title': 'Levels that must stay apart', 'sub': 'The ratio of each pair at 320 (light) and at 1440 (dark). Two straight lines keep their ratio between its two end values, so the ends prove every size.', 'min': 1.125, 'ends': ['320', '1440'], 'rows': rel, 'max': 1.6},
        {'type': 'heightLine', 'title': 'The height counts', 'sub': '--vp = min(100vw, 2 × 100svh − 25rem): the width a screen counts as. 360 tall → the 320 sizes; 920 tall → the 1440 sizes.', 'from': {'h': 360, 'v': 320, 'label': '360 tall = a 320 screen'}, 'to': {'h': 920, 'v': 1440, 'label': '920 tall = a 1440 screen'},
         'examples': [{'h': 390, 'label': 'phone sideways (844 × 390)'}, {'h': 650, 'label': '1366 × 650 laptop window'}, {'h': 768, 'label': '1024 × 768'}],
         'range': [320, 1100], 'hTicks': [400, 600, 800, 1000], 'vTicks': [320, 768, 1440], 'note': 'The size a screen gets is the smaller of its width and this line.'},
      ]},
      {'type': 'table', 'title': 'Space and size roles', 'stack': True,
       'columns': [{'label': 'Role'}, {'label': 'CSS'}, {'label': '320', 'num': True}, {'label': '1440', 'num': True}, {'label': 'Figma', 'muted': True}, {'label': 'Used for', 'muted': True}],
       'rows': [[f"<code>{k}</code>", f"<code>{v['css']}</code>", v['px'][0], v['px'][1], ' / '.join(str(FIG[v['css']][i]) for i in (0, 2, 4, 5, 6)) if v['css'] in FIG else '—', v.get('use', '')] for k, v in sroles.items()]},
      {'type': 'table', 'title': 'Colours', 'sub': 'design/colors.json; text pairs checked for contrast on every build.', 'stack': True,
       'columns': [{'label': 'Token'}, {'label': 'Value'}, {'label': 'Use', 'muted': True}],
       'rows': [[f"<code>--c-{k}</code>", f"<span style='display:inline-block;width:12px;height:12px;vertical-align:-1px;margin-right:6px;border:1px solid #444;background:{(v['hex'] if isinstance(v, dict) else v)}'></span><code>{(v['hex'] if isinstance(v, dict) else v)}</code>", (v.get('use', '') if isinstance(v, dict) else '')] for k, v in colors['colors'].items()]},
    ]},
    {'id': 'round5areas', 'nav': 'Round 5 areas', 'title': 'The round\'s areas at 25 screens', 'sub': 'Every measure your round 5 comments asked for, on round 4\'s build and on this one, at phones upright and sideways, tablets, short and tall laptops, 1920 and 2560. The sections after it describe each area as it works now.', 'blocks': [r5_tbl]},
    {'id': 'navbar', 'nav': 'Navbar', 'title': 'The navbar and the tab bar', 'sub': 'Round 2 built it (four steps, the colours of the section under it, one max width with the column, a tab bar on phones); round 5 put the sections in one row, took the profile icon from Figma and evened the hover ground. The table is round 2\'s measure, round 1 struck.', 'blocks': [
      {'type': 'cards', 'cols': 3, 'items': [
        {'title': 'Steps', 'html': 'Every section in one row from <b>64em</b> (1024, the screen of L); «Каталог, Бизнесу, Журнал, Контакты» from <b>48em</b> (768, the screen of M); the burger below; under <b>40em</b> (640) the tab bar. In em, so bigger browser text takes the narrower step sooner. <code>media.css</code>: --links-full, --links, --phone.'},
        {'title': 'Width', 'html': 'The bar\'s margin is 16px (the small gutter); its content <code>min(100% − 2 × (16 − 8), --col-max + 2 × 8)</code>: the logo\'s and icons\' boxes carry 8px of air, so the glyphs stand 16px from the edges, and on the column\'s edges once it is at its most (1616 and up).'},
        {'title': 'Grounds', 'html': 'Sections say <code>data-ground</code> (paper, cloud, black, ink); it sets <code>--g-bg</code>, <code>--g-fg</code>, <code>--line</code> and <code>--tint</code>. The bar takes a ground once its whole height is over that section, crossing over in 0.6s; at the top of the page (and above it) the first section\'s. The tab bar does the same at the foot of the screen.'},
        {'title': 'Hover', 'html': 'A tint behind the one item: <code>--tint</code>, white 20% on dark grounds, ink 6% on light ones. 0.2s in, 0.45s out. Nothing else on the bar changes. A link\'s tint stands 14px from its text on every side (round 5): a <code>::before</code> 6px wider than the link, which keeps 8px a side, so the texts stay 16px apart and hover areas meet mid-gap.'},
        {'title': 'Links', 'html': 'An item links only to a page that exists (data/site.json nav: a second value is the path). Today: «Кофе» and «Каталог». The rest are <code>&lt;a&gt;</code> without href: shown, not clickable, not in the tab order.'},
        {'title': 'Tab bar', 'html': '56px + the safe area, four equal cells with icon and label (<code>--type-small</code>); the bag\'s count only. Everything fixed to the foot stands on it through <code>--tabbar-h</code> (the buy bar, the toast, the menu\'s height, the hero).'},
      ]},
      nav2_tbl]},
    {'id': 'hero', 'nav': 'Hero', 'title': 'The hero', 'sub': 'The first screen of the home page. Round 5: the title fills its cell, one fade under the whole block, lines that run out, the whole block rising in. The tables: round 5\'s measure (round 4 struck), then round 2\'s.', 'blocks': [
      {'type': 'cards', 'cols': 3, 'items': [
        {'title': 'Height', 'html': '<code>min(100svh − 24 − tab bar, --hero-max)</code>, and never less than the navbar + <code>--hero-photo</code> (48 → 120) + <code>--hero-fade</code> (64 → 160) + the cells. <code>--hero-max</code> 960 → 1200 stops a portrait tablet or a 2560 screen (decision hero-height).'},
        {'title': 'Rows', 'html': 'Below M the title, the countdown and the links stack. From M the countdown and the links share three equal rows (subgrid), title above; from L the title takes the first cell beside them. Row padding <code>--hero-cell-y</code> 12 → 20; texts trimmed to cap height and baseline.'},
        {'title': 'Countdown', 'html': 'Everything as wide as the caption (13.9em of <code>--type-control</code>): the digits are control × 13.9 / 3 in tabular Technology (build/fonts.py), a date control × 13.9 / (0.65 × its letters) in mono. More than 24h to wait shows the date. Moscow time, the placeholder weekday schedule.'},
        {'title': 'Frame and lines', 'html': 'Below the column\'s max the hairlines between cells run out to the screen\'s edges on the sides where the column ends; at the step <code>max</code> (the column at 1520px) the cells get a hairline on each side, the title 48px of padding, and the lines stop at the frame.'},
        {'title': 'Fade', 'html': '<code>--fade-hero</code> (colors.json fades.hero): 16 stops along a curve («ease» until you tune it), laid under the whole block, cells and all; <code>--hero-fade</code> (64 → 160) of it stands above the hairline (round 5; before: a fade over a black band).'},
        {'title': 'Title and entrance', 'html': 'From L the title is a third of the column less its padding, ÷ 4.55 (its longest word), never under <code>--type-display</code>, never over its size at the 1520 column (decision hero-title-fills-cell). The whole block (fade, hairline, cells) rises one section gap and fades in, 0.9s on --ease-out after 0.2s (<code>--t-rise</code>).'},
      ]},
      hero2_tbl]},
    {'id': 'featured', 'nav': 'Новинки', 'title': 'New arrivals', 'sub': 'One coffee at a time: a text square and a photo square, the pager in the middle of the head. New in round 3.', 'blocks': [
      {'type': 'cards', 'cols': 3, 'items': [
        {'title': 'Halves', 'html': 'From L two tracks of <code>minmax(0, 1fr)</code>, both <code>aspect-ratio: 1</code>; below L the text above the photo. The text square never grows: <code>scripts/slider.js</code> cuts the story to the whole lines that fit between the name and the taste box (<code>--lines</code>, at most 8).'},
        {'title': 'Photo', 'html': 'The coffee\'s own photo, else the next of <code>featured.photos</code> (four moodboard photos, placeholder); its line over the eased black fade. No hairline beside it.'},
        {'title': 'Head', 'html': 'From M three columns <code>1fr auto 1fr</code>: title, pager, arrows; the pager is in the head\'s middle wherever the title and arrows are. Below M the pager has its own row.'},
        {'title': 'Taste box', 'html': 'The chart\'s cell has at its sides the air its rows have above them, 12px + (1.75em − 1cap) / 2 (round 5), and stands in its middle when the pills are taller. The taste chart and the pills in two equal halves from M (<code>minmax(min-content, 1fr) minmax(0, 1fr)</code>: the chart never shrinks, so on 1000–1030 screens its half is up to 12px wider); below M the chart over the pills.'},
        {'title': 'Link', 'html': 'The name\'s link stretched over the slide (<code>::after</code>, z-index 6); the caption above it lets clicks through.'},
        {'title': 'Swipe and hover', 'html': 'Still the ordinary scroll-snap row (a magazine-like turn is being chosen in <a href=\'https://claude.ai/artifact/39Cx5ty8t6AsCp7NAJNyqy\'>the test bench</a>). The photo no longer zooms on hover; the pager\'s numbers and the arrows tint their cell (round 5).'},
      ]},
      feat3_tbl]},
    {'id': 'reel', 'nav': 'Рекомендуем', 'title': 'The recommended row and the card', 'sub': 'The row runs to the screen\'s edges, but since round 5 its cards show only inside the column: they rise in and sink away. A card is one link; its cells and heart tint on hover.', 'blocks': [
      {'type': 'cards', 'cols': 3, 'items': [
        {'title': 'Bleed', 'html': 'The row is widened by the column\'s margins and padded back (<code>--bleed-l</code>, <code>--bleed-r</code>, measured from the column by script), with <code>scroll-padding</code> the same: its cards stand and snap on the column, but slide out to the screen\'s edges. Without the script it is the column.'},
        {'title': 'In the column only', 'html': 'Out of the column a card waits <code>--section-gap</code> below and clear (<code>[data-wait]</code>). Half in, it rises over <code>--t-rise</code> and fades in over <code>--t-move</code>, the first ones 90ms apart; as soon as it starts crossing out it sinks away over <code>--t-out</code> (<code>[data-wait=out]</code>). On a phone the peeking card counts as in. Not with «reduce motion».'},
        {'title': 'Packs', 'html': 'A pack stands exactly in its slot while the page scrolls or the row slides (round 5: no lag, no turn). A card rising into place carries its pack up: it trails and tilts, <code>carryTilt</code> 0.45 at the full trail (12% of its height, ≤ 40px); a card sinking away takes it down upright. A press anywhere on the card moves it away.'},
        {'title': 'One link', 'html': 'The name\'s link is stretched over <code>.card</code>; the picture\'s layers (photo, pack, name, buy row) share one grid cell, so nothing between is positioned. The heart and the buy row sit above it at z-index 7.'},
        {'title': 'Hovers', 'html': 'The weights cell, the price button and the heart tint their ground (<code>--tint</code>: ink 6%, white 20% on a photo card); nothing fades or zooms (round 5). The weights are one cell: a click anywhere picks the other weight.'},
        {'title': 'Fade', 'html': 'The buy row is one fade over its whole height (<code>--fade-card-cloud</code> / <code>-black</code>), its 56px lead-in letting clicks through to the card\'s link.'},
      ]},
      reel3_tbl]},
    {'id': 'facts', 'nav': 'Info modal', 'title': 'The info blocks and their modal', 'sub': 'Three blocks that grow into one modal (Figma info-blocks-modal). Round 5: bigger icons, the plus in the corner, the modal grows as one card.', 'blocks': [
      {'type': 'cards', 'cols': 3, 'items': [
        {'title': 'Blocks', 'html': 'Three buttons divided by hairlines (no line above them): the icon (<code>--fact-icon</code> 40 → 56), the title, the ringed plus (32px) 12px in from the corner. Stacked below M, the lines between them run to the screen\'s edges. Hover: the tint of the ground.'},
        {'title': 'Modal', 'html': 'One <code>&lt;dialog&gt;</code> (focus held inside, Esc closes, focus back on its block): a box of <code>--modal-w</code> (360 → 520) over ink 20%; under 40em a sheet at the foot, as wide as the screen. Icon, title (the block\'s size), the text, the cross; «‹ prev | next ›» step to the other blocks.'},
        {'title': 'Growing', 'html': 'One card (round 5): the box starts on the block, cut to its size (<code>clip-path</code>), and grows into place; the icon and title travel at their size, the text rides with the title fading in, the step row slides up from the card\'s foot, the plus turns 45° into the cross. 0.6s on <code>--ease-out</code>; back the same way. Every box is measured before anything moves.'},
        {'title': 'Stepping', 'html': 'Only the text changes: it slides out 24px and fades (0.23s), the next slides in (0.45s). The three panels share one cell, so the box keeps the tallest one\'s height and the step row (65px at 1440, Figma 66) never moves.'},
        {'title': 'Live text', 'html': '«Ближайшая обжарка через N часов» (or minutes, or the day when it is more than a day away) from the roast schedule, as the hero\'s countdown.'},
        {'title': 'Without motion', 'html': 'With «reduce motion» it simply opens and closes.'},
      ]}]},
    {'id': 'footer', 'nav': 'Footer', 'title': 'The footer', 'sub': 'Two halves from L, the animated flame, the legal line. New in round 3.', 'blocks': [
      {'type': 'cards', 'cols': 3, 'items': [
        {'title': 'Squares', 'html': 'From L two tracks of <code>minmax(0, 1fr)</code>; the left half is <code>aspect-ratio: 1</code> and stretches with the row, so both are square while the links fit (from about 1360 wide), taller where they need more.'},
        {'title': 'Flame', 'html': 'Your SMIL file (one path, 109 shapes over 5s, 27 KB gzipped) as a lazy <code>&lt;img&gt;</code>; with «reduce motion» its first frame. <code>--footer-logo</code> wide (104 → 216).'},
        {'title': 'Optical centre', 'html': 'The flame\'s mass centre, measured over its animation (50.5% across, 62.9% down its box), stands on the square\'s middle: <code>translate(-50.5%, -62.9%)</code>. Its box\'s middle would set it 12% of its height low (the bowl is heavy, the tip thin).'},
        {'title': 'Legal line', 'html': 'Copyright and policy: <code>--type-small</code>, ink 70%, one baseline (<code>align-items: baseline</code>), no underline; hover darkens the policy.'},
        {'title': 'Newsletter', 'html': 'From M the line and the field are two equal halves (round 5); below M the line over the field.'},
        {'title': 'Lines and frame', 'html': 'Below the max the line under each cell runs out to the screen\'s edge on the sides where the column ends (round 5); at the step <code>max</code> (the column at 1520) a hairline on each side, the texts standing off it by <code>--tile-pad</code>. Links underline on hover in ink 40%, 0.4em below the letters.'},
      ]},
      footer3_tbl]},
    {'id': 'stage', 'nav': 'Product stage', 'title': 'The product stage and the buy bar', 'sub': 'A coffee\'s page: the pack pinned while the fact tiles scroll past, the buy bar at the foot.', 'blocks': [
      {'type': 'cards', 'cols': 3, 'items': [
        {'title': 'Pin', 'html': 'Height <b>100svh − navbar − buy bar</b> (at least 22rem), pinned for as long as the five tiles take to pass; the tiles are 40% of the screen\'s height apart (28% from L), so scroll time is measured in screens (decision product-pin).'},
        {'title': 'Pack', 'html': '<code>--stage</code> 320 → 720, capped by the pin. It turns once around with <code>qqStage.progress</code>; tiles are frosted (cloud 70% + blur 40px) so the pack shows through them.'},
        {'title': 'Arriving from a card (round 3)', 'html': 'Opened from a card, the page arrives in a view transition: the card\'s name becomes the title, its pack the big pack. The pack then starts facing front instead of turning in from a quarter turn.'},
        {'title': 'Buy bar', 'html': 'Two rows of cells below L (options; quantity, price, «В корзину»), one row from L as in Figma. On a screen under 32em tall it waits after the stage instead of following the screen, which pins at the whole screen under the navbar (decision short-screens).'},
      ]},
      stage_tbl]},
    {'id': 'catalog', 'nav': 'Catalog', 'title': 'The catalog', 'sub': 'Tabs, filters kept in the address, the grid.', 'blocks': [
      {'type': 'cards', 'cols': 3, 'items': [
        {'title': 'Filters', 'html': 'Seven cells (sort, price of 200 g, type, line, country, processing, preparation) that wrap by width: 7 rows at 320, 4 at 375, 2 from 730, one row from 1260. A panel that would stick out on the right opens leftwards. The choice lives in the address, so a filtered catalog can be shared.'},
        {'title': 'Grid', 'html': 'One column below M, two at M, and from L six tracks: the first four cards take half a row, the rest a third — the rhythm of the Figma catalog, kept only in the default order.'},
        {'title': 'Tabs', 'html': '«Все» and «Кофе» show the coffee; каскара, дрипы, сеты and мерч say they are coming (not in the shop yet).'},
      ]},
      cat_tbl]},
    {'id': 'picture', 'nav': 'Every size', 'title': 'The whole responsive picture', 'sub': 'Every role and block size as the browser resolves it, every 10px of width (a screen 1100 tall) and every 25px of height (1440 wide). Dashed grey: round 4 (main). Moved this round: the hero title from L (Round 5 tab: 62 → 90px, flat from about 1500), and with it the hero\'s cells, rows and the photo above them (Hero tab); the hero\'s lines now end at the screen\'s edge below 1520; the info icon (--fact-icon, new: 40 → 56); the plus from its corner; the business gap (= --section-y); the taste cell\'s side; the newsletter\'s field beside its line from M (Footer); the recommended row\'s width past the column is unchanged. The type roles and the spacing roles did not move.', 'blocks': [
      {'type': 'picture',
       'groups': {'type': {'label': 'Type', 'keys': [css_of(k) for k in troles]},
                  'space': {'label': 'Spacing', 'keys': [v['css'] for k, v in sroles.items() if k not in ('story/min-h', 'footer/logo', 'product/stage')]},
                  'blocks': {'label': 'Blocks', 'keys': ['heroH', 'featuredH', 'storyH', 'colW', 'catalogFirstW', '--footer-logo']},
                  'stage': {'label': 'Product stage', 'keys': ['pinH', 'packW', 'packH', 'buybarH', 'tileW']},
                  'hero': {'label': 'Hero', 'keys': ['heroH', 'heroCellsH', 'heroRow', 'heroPhoto', 'digitsW', 'captionW', 'countdownPx', '--hero-cell-y', '--hero-photo', '--hero-fade', '--hero-max']},
                  'navbar': {'label': 'Navbar', 'keys': ['navStep', 'navContentW', 'navLogoX', 'colW']},
                  'footer': {'label': 'Footer', 'keys': ['footerBrandW', 'footerBrandH', 'footerLinksW', 'footerRatio', 'footerMarkDy', 'legalDy', 'newsLines', '--footer-logo']},
                  'featured': {'label': 'Новинки & row', 'keys': ['featTextW', 'featMediaW', 'featTextH', 'featMediaH', 'featFactsDiff', 'pagerDx', 'reelBleed', '--modal-w']},
                  'round5': {'label': 'Round 5', 'keys': ['heroTitlePx', 'heroCellsH', 'heroLineEnd', '--fact-icon', 'factPlusIn', 'businessGap', 'tasteSide', 'newsHalf']}},
       'order': ['type', 'space', 'blocks', 'stage', 'hero', 'navbar', 'footer', 'featured', 'round5'],
       'labels': {**{css_of(k): k.split('/')[1] for k in troles}, **{v['css']: k for k, v in sroles.items()},
                  'heroH': 'hero height', 'featuredH': 'Новинки slide', 'storyH': 'image block', 'colW': 'content column', 'catalogFirstW': 'first catalog card',
                  'pinH': 'pinned stage', 'packW': 'pack box width', 'packH': 'pack box height', 'buybarH': 'buy bar', 'tileW': 'fact tile', 'countdownPx': 'countdown font size',
                  'heroCellsH': 'hero cells', 'heroRow': 'hero row (a link)', 'heroPhoto': 'photo above the cells', 'digitsW': 'digits (drawn width)', 'captionW': 'caption (drawn width)',
                  'navStep': 'navbar step (1 tab bar, 2 burger, 3 short, 4 every section)', 'navContentW': 'navbar content width', 'navLogoX': 'logo glyph from the screen edge',
                  'footerBrandW': 'footer: left half width', 'footerBrandH': 'footer: left half height', 'footerLinksW': 'footer: right half width', 'footerRatio': 'footer: left half height ÷ width (1 = square)',
                  'footerMarkDy': 'flame mass centre off the middle', 'legalDy': 'legal line: baselines apart', 'newsLines': 'newsletter line: lines',
                  'featTextW': 'Новинки: text width', 'featMediaW': 'Новинки: photo width', 'featTextH': 'Новинки: text height', 'featMediaH': 'Новинки: photo height', 'featFactsDiff': 'taste box: halves differ by', 'pagerDx': 'pager off the head\'s centre', 'reelBleed': 'recommended row past the column',
                  'heroTitlePx': 'hero title size', 'heroLineEnd': 'hero link line: short of the screen edge', 'factPlusIn': 'info plus: from the block\'s right edge', 'businessGap': 'business: lead → cards', 'tasteSide': 'taste cell: text from its side', 'newsHalf': 'newsletter field beside its line (0: under it)'},
       'sweep': {'before': before, 'after': after},
       'axes': {'width': {'label': 'By width', 'x': 'w', 'note': 'Screen width (px), 1100 tall', 'tip': '{x} wide', 'ticks': [320, 768, 1024, 1440, 1920], 'solid': []},
                'height': {'label': 'By height', 'x': 'h', 'note': 'Screen height (px), 1440 wide', 'tip': '{x} tall', 'ticks': [400, 600, 800, 1000]}}},
    ]},
    {'id': 'map', 'nav': 'Map', 'title': 'Responsive map', 'sub': 'What each block does at each width, from the sweep. Accent lines: the shared column steps (S, M, L land at these screen widths because the column is the screen less two gutters). Dashed: the navbar\'s page step.', 'blocks': [
      {'type': 'map', 'range': [320, 1920], 'ticks': [320, 390, 768, 1024, 1280, 1440, 1920], 'rows': maprows,
       'steps': [{'w': 750, 'label': 'M 43rem'}, {'w': 1000, 'label': 'L 58rem'}, {'w': 1620, 'label': 'max 1520px'}], 'page': [{'w': 640, 'label': 'tab bar 40em'}, {'w': 768, 'label': 'short 48em'}, {'w': 1024, 'label': 'every section 64em'}]},
      {'type': 'list', 'items': ['Round 5 moved no step. The newsletter\'s line and field go into two halves at M (the shared step); the hero title follows the column from L (a container unit, flat from about 1500); the hairlines that run out to the screen\'s edges stop at the frame at max. The navbar\'s sections are one row at its widest step.', 'Round 3 moved no step. The footer\'s two halves still start at L; they are squares from about 1360 wide (a content width, not a step: below it the links need more height). The recommended row now runs past the column at every width. The info modal turns into a sheet under 40em (the tab bar\'s page step).', 'Round 2 moved the navbar\'s steps (before: the burger under 64em) and added two: 48em and 40em. The page steps now sit at the screens of the column steps (768 ≈ M, 1024 ≈ L), so with a 16px text the navbar changes together with the blocks. The new container step max (the column at 1520px, from about 1616) frames the hero. No block step moved.','S (22rem column) lands at about 380: it changes small things inside cards (the filter cells, the buy-bar captions), so it shows no row here.',
                                 'Every block changes at the same two widths, about 750 and 1000; only the navbar has its own step (64em, so bigger browser text gets the burger sooner).',
                                 'The catalog filter cells wrap by their own width (they flow), so their rows change at 370, 550, 730 and 1260 with no step.']},
    ]},
    {'id': 'motion', 'nav': 'Motion', 'title': 'Motion', 'sub': 'src/styles/base/motion.css: three curves and four times. Round 5: no pack lag, no hover movement; cards sink away out of the column; the info block grows as one card. With «reduce motion» every time is 0 and the packs stand still, without carry or press.', 'blocks': [
      {'type': 'curves', 'items': [
        {'name': 'out', 'use': 'arriving and settling: hovers, panels, the toast coming in', 'code': '--ease-out: cubic-bezier(0.16, 1, 0.3, 1)', 'bez': [0.16, 1, 0.3, 1]},
        {'name': 'move', 'use': 'travelling: the hero photo\'s drift', 'code': '--ease-move: cubic-bezier(0.65, 0, 0.35, 1)', 'bez': [0.65, 0, 0.35, 1]},
        {'name': 'leave', 'use': 'going away: the toast leaving', 'code': '--ease-leave: cubic-bezier(0.7, 0, 0.84, 0)', 'bez': [0.7, 0, 0.84, 0]},
        {'name': 'pack follow', 'use': 'the packs follow their targets (scroll lean, pointer turn) at 9 per second', 'code': 'TUNE.follow = 9', 'fn': 'power2.out'},
        {'name': 'fade «ease» (new)', 'use': 'every gradient: the opacity of a fade along its length (16 stops), as tw-easing-gradients', 'code': 'colors.json fades: curve [0.25, 0.1, 0.25, 1]', 'bez': [0.25, 0.1, 0.25, 1]},
        {'name': 'card carry', 'use': 'a rising card\'s pack catches up with its slot: 1 − e^(−9t), soft-capped at 12% of its height (≤ 40px); the page\'s scroll and a sliding row no longer lag (round 5)', 'code': 'TUNE.lag = 9, lagMax = 0.12, lagMaxPx = 40', 'linear': [[0, 0], [0.06, 0.42], [0.12, 0.66], [0.18, 0.8], [0.24, 0.885], [0.3, 0.933], [0.36, 0.961], [0.5, 0.989], [1, 1]]},
      ]},
      {'type': 'durations', 'max': 2, 'rows': [
        {'group': 'hover', 'name': 'hover in (--t-in)', 's': 0.2}, {'group': 'hover', 'name': 'hover out (--t-out)', 's': 0.45},
        {'group': 'move', 'name': 'toast in (--t-move)', 's': 0.6},
        {'group': 'move', 'name': 'toast out (--t-out)', 's': 0.45}, {'group': 'move', 'name': 'bag icon pop (--t-move)', 's': 0.6},
        {'group': 'pack', 'name': 'still fades as WebGL draws', 's': 0.3}, {'group': 'pack', 'name': 'packs follow scroll and pointer (~95%)', 's': 0.33, 'kind': 'scroll'},
        {'group': 'pack', 'name': 'product pack turn (one turn over 5 tiles)', 's': 3, 'kind': 'scroll', 'label': 'as long as the scroll through the stage'},
        {'group': 'new', 'name': 'navbar / tab bar cross to a new ground (--t-move)', 's': 0.6},
        {'group': 'new', 'name': 'hero block rises in, after 0.2s (--t-rise)', 's': 1.1, 'label': '0.2s wait + 0.9s'},
        {'group': 'new', 'name': 'pack press in / out (16 per second, to 95%)', 's': 0.19}, {'group': 'new', 'name': 'press held at least', 's': 0.2},
        {'group': 'round 3', 'name': 'card rises into place (--t-rise)', 's': 0.9, 'stagger': 0.09}, {'group': 'round 3', 'name': 'card fades in (--t-move)', 's': 0.6},
        {'group': 'round 5', 'name': 'info block grows as one card (--t-move)', 's': 0.6}, {'group': 'round 5', 'name': 'modal text rides with the title (--t-move)', 's': 0.6},
        {'group': 'round 5', 'name': 'card sinks away out of the column (--t-out, ease-out)', 's': 0.45},
        {'group': 'round 3', 'name': 'modal steps to the next block', 's': 0.68, 'label': '0.23s out + 0.45s in'},
        {'group': 'round 3', 'name': 'card → coffee page: name and pack travel (--t-move)', 's': 0.6}, {'group': 'round 3', 'name': 'pages cross-fade (--t-out)', 's': 0.45},
        {'group': 'round 3', 'name': 'a rising card\'s pack settles (to 95%)', 's': 0.33, 'kind': 'scroll'},
        {'group': 'loop', 'name': 'footer flame (SMIL, 109 shapes)', 's': 5, 'kind': 'loop', 'label': '5s, linear'},
        {'group': 'loop', 'name': 'hero photo drift (alternate)', 's': 40, 'kind': 'loop', 'label': '40s each way'}]},
      {'type': 'cards', 'cols': 2, 'items': [
        {'title': 'In fast, out slow', 'html': 'Hovers come in at 0.2s and leave at 0.45s, so a pointer passing over a list leaves a soft trail (as Flow Medium).'},
        {'title': 'Two loops', 'html': 'The hero photo drifts 8% over 40s and back; the footer flame burns in 5s (round 3). Both stop with «reduce motion» (the flame shows its first frame).'},
        {'title': 'Shared elements (round 3)', 'html': 'Things that belong together travel instead of appearing: a block becomes its modal (its icon, title and plus move; the ground grows), a card becomes its page (name and pack move). Nothing text-bearing is scaled except the name in the page transition, which the browser grows from one size to the other.'},
        {'title': 'Still (round 5)', 'html': 'The page\'s scroll and a sliding row never move or tilt a pack; only a card rising into place carries its pack, which tilts and settles. Hovers never move anything either: they tint.'},
        {'title': 'Weight', 'html': 'Pressed anywhere on its card, a pack gives way (further, smaller) and stays while held.'},
        {'title': 'Colour crossings (new)', 'html': 'The bars change colour only when wholly over a section, on the travel curve and time, so a boundary never flickers through them.'},
      ]},
    ]},
    {'id': 'grammar', 'nav': 'Grammar', 'title': 'The grammar', 'sub': 'How the site is drawn, in plain words, and which of these rules a script checks.', 'blocks': [
      {'type': 'cards', 'cols': 3, 'items': [
        {'title': 'Colour', 'html': 'Ink #2d2f33 on paper, cloud #f6f6f6 for surfaces (cards, tiles, the buy bar), graphite and black for dark blocks, lavender for eyebrows and info icons. Secondary text is ink at 70%; 60% only for large text. Every section names its ground; lines and hover tints follow it: ink 20% / white 30%, ink 6% / white 20%.'},
        {'title': 'Type', 'html': 'Mono bold capitals tracked 0.05em for names and headings; Apercu for everything read; Technology digits for the countdown. Labels (eyebrows, controls, prices) differ by case and colour, not size.'},
        {'title': 'Size', 'html': 'Every size a line from 320 to 1440 on one ladder; the screen\'s height counts; nothing grows past 1440, the column stops at 1520.'},
        {'title': 'Shape', 'html': 'Sharp rectangles divided by hairlines; only pills and dots are round.'},
        {'title': 'Layout', 'html': 'Everything sits in the content column; full-bleed blocks put their content in a column too, so they change at the same steps S, M, L.'},
        {'title': 'Motion', 'html': 'Three curves, four times, two loops; things that belong together travel (a block becomes its modal as one card); hovers tint and never move; packs move only when their card rises.'},
      ]},
      {'type': 'table', 'title': 'Rules', 'columns': [{'label': 'Rule'}, {'label': 'Status', 'pill': True}], 'rows': [
        ['Colours only from tokens', 'checked'], ['Sizes only from the scale; screen units only where a decision says', 'checked'], ['Layout steps only at S, M, L, max (and 64em, 48em, 40em, 32em tall)', 'checked'],
        ['No rounded corners except pills and dots', 'checked'], ['Motion only from motion.css', 'checked'], ['Faces only through tokens', 'checked'], ['Every token defined and used', 'checked'],
        ['Type levels ≥ ×1.125 apart at both ends', 'checked'], ['Every decision complete', 'checked'],
        ['One line colour: borders only var(--line)', 'checked'], ['The navbar\'s sections never touch the logo or the tools (audit)', 'checked'], ['The countdown as wide as its caption (audit)', 'checked'],
        ['Every fade eased and whole: one var(--fade-*) per place, over the whole block, no solid band under it (rounds 3, 5)', 'checked'], ['Hovers never move: no transform in a :hover rule (round 5)', 'checked'],
        ['Lines run out to the screen\'s edges beside the column, or stop at its frame (round 5)', 'written'], ['A pointer\'s focus changes nothing; scripts move focus through focusFrom() (round 5)', 'written'], ['A whole card is its link; nothing positioned between the link and .card (round 3)', 'written'],
        ['Things that belong together travel (block → modal, card → page) (round 3)', 'written'], ['Waiting cards are data-wait; data-out is the filter\'s (round 3)', 'written'],
        ['Every section says its ground (data-ground)', 'written'], ['Links only to pages that exist', 'written'], ['Fixed bars stand on the tab bar (--tabbar-h)', 'written'], ['A hover tints only its own item\'s ground', 'written'],
        ['Every row that scrolls sideways is position: relative', 'written'], ['3D canvas at z-index 5; what shows above packs ≥ 6', 'written'],
        ['Links inside the site through href(ctx, to)', 'written'], ['One heading level per section; names in mono, text in Apercu', 'implicit'],
        ['Cells inside a block share hairlines (margin −1px), never double lines', 'implicit']]},
    ]},
    {'id': 'checks', 'nav': 'Checks', 'title': 'Checks', 'sub': 'What was checked, how, and what is kept on purpose.', 'blocks': [
      {'type': 'stats', 'items': [{'n': 252, 'unit': 'runs', 'text': audit_last or 'the audit'}, {'n': len(rules_items) or 12, 'unit': 'rules', 'text': 'all hold (build/rules.mjs); «hovers never move» new, «every fade eased» now also refuses a band'},
                                  {'n': 0, 'unit': 'px', 'text': 'sideways scroll at every 10px from 320 to 1920'}, {'n': len(dec), 'unit': 'decisions', 'text': f"{nd['decision']} decisions, {nd['exception']} exceptions, {nd['placeholder']} placeholders"}]},
      {'type': 'rules', 'title': 'The rules (run on every build and in CI)', 'items': rules_items},
      {'type': 'decisions', 'title': 'The decisions register (design/decisions.json)', 'items': decision_items},
      {'type': 'list', 'title': 'The independent review', 'sub': 'A separate agent that had not seen the round checked the built site against your comments, the rules and every page the round touched, in a browser at five sizes. Its 25 findings (grouped) and what was done about each:', 'items': review or ['(pending)']},
      {'type': 'pre', 'summary': 'The audit\'s output (npm run audit)', 'text': audit},
    ]},
    {'id': 'next', 'nav': 'Next', 'title': 'Next', 'sub': 'What is open, what I need from you, and what to check on real devices.', 'blocks': [
      {'type': 'list', 'title': 'Questions from this round', 'items': [
        f"<b>The fades:</b> tune them in <a href='{TUNER}'>the fade tuner</a> and press «Save for Claude»; I will put the values into colors.json and base.css.",
        '<b>Hero 2, the frame from 1520:</b> it shows at 1920 and 2560 in Chromium. At which width and in which browser did it disappear?',
        '<b>New 1, the pager:</b> centred within 0px at every width in Chromium. Where did it look off?',
        '<b>Hero 1 below 1366:</b> the countdown\'s digits are taller than a third of the title, so the rows lead there (275px cells around a 241px title at 1024). Fine, or should the digits shrink at L\'s narrow end?',
        '<b>Focus:</b> a pointer lights nothing now; the keyboard keeps its ring (for people who cannot use a mouse). Is that what you meant?',
        '<b>The business text</b> sits on a thinner part of the fade now (the photos show through). Fine, or darker sooner (in the tuner)?']},
      {'type': 'list', 'title': 'Still open from round 3', 'items': [
        '<b>The magazine swipe:</b> which of the five in <a href=\'https://claude.ai/artifact/39Cx5ty8t6AsCp7NAJNyqy\'>the test bench</a> goes on the site?',
        '<b>The footer\'s squares</b> hold from about 1360 wide; below, the links need more height. Fine?',
        '<b>Every page change cross-fades</b>: keep it for all pages, or only card → page?',
        '<b>Photos for the new arrivals:</b> four moodboard photos cycle; a photo per coffee would end the repeat.',
        'Answered by round 5: a resting card in the right margin at 1920 (cards now show only inside the column).']},
      {'type': 'list', 'title': 'Still open from round 2', 'items': [
        '<b>Navbar 4, «[additional padding]»:</b> read with 5 (the air inside the logo\'s and icons\' boxes). Did you mean something else?',
        '<b>Hover on light grounds:</b> ink 6% (white is invisible on white). Keep?',
        '<b>Links without pages</b> in the hero and the footer: the same rule as the navbar?',
        '<b>Short phones:</b> the hero is taller than the screen at 320 × 568 and sideways.',
        '<b>The reload</b> keeps its place in Chromium: in which browser did it jump?']},
      {'type': 'list', 'title': 'Still needed from you', 'items': [
        '<b>Real prices</b> into data/prices.json.', '<b>Each coffee\'s label</b> at 512 and 1024 px, front and back.',
        '<b>QQ\'s own photos</b> (the current ones are Figma\'s moodboard).', '<b>The roast schedule</b> and the hero video.',
        '<b>Countries of the blends</b>: the sticker column or the lots?', '<b>Publish the component canvas</b> on the test site?',
        'Round 4 left questions on the pages (the FAQ answers, the business page\'s blanks, the privacy policy, delivery prices, the roast hour): see the project notes.']},
      {'type': 'list', 'title': 'Not designed yet', 'items': ['The menu behind the burger (a plain list now).', 'Pages for the navbar\'s items and the info blocks: каскара, дрипы, сеты, бизнесу, журнал, контакты, доставка, оплата, search, favourites, bag, profile.', 'Checkout, account; merch; the journal.']},
      {'type': 'list', 'title': 'Open in the system', 'items': ['Spacing lengths inside components are not linted yet (icon sizes, small paddings).', 'At 844 × 390 the «В корзину» toast covers the buy bar\'s price.', 'On a coffee\'s page at 1440 × 900 the big pack is cut at the top of its box while it settles; card descriptions cannot be selected (they are part of the card\'s link now).']},
      {'type': 'list', 'title': 'Check on real devices', 'items': ['Safari: the modal growing as one card (an animated clip-path), the trimmed text (text-box) of the hero and the note, the taste cell\'s cap unit; a card opening its coffee and the way back (the view transition).', 'A phone: a fast fling while the toolbar hides (the place must not jump); turning the phone sideways and back (the place kept).', 'A trackpad and a mouse: the recommended row — cards rising in and sinking away at the column\'s edges.', 'The keyboard: Tab through the navbar, the hero, the cards and the modal (the ring shows only then); a click shows nothing.']},
    ]},
    {'id': 'round3', 'nav': 'Round 3', 'title': ROUND3['title'], 'sub': "As it was published: your round 3 comments, what was done, round 2 next to round 3. The round 3 page itself stays at <a href='https://claude.ai/artifact/CESDhXQ6ErVqFQiNT7kuXM'>QQ Site System, Round 3</a>.", 'blocks': ROUND3['blocks']},
    {'id': 'round2', 'nav': 'Round 2', 'title': ROUND2['title'], 'sub': "As it was published: your round 2 comments, what was done, round 1 next to round 2. The round 2 page itself stays at <a href='https://claude.ai/artifact/WRGuvxpjr9wBBLWjyH8S6a'>QQ Site System</a>.", 'blocks': ROUND2['blocks']},
    {'id': 'earlier', 'nav': 'Round 1', 'title': ROUND1['title'], 'sub': 'As it was published: your round 1 requests, what was built, and the site next to Figma.', 'blocks': ROUND1['blocks']},
  ]}
json.dump(data, open(os.path.join(HERE, 'data.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('data.json:', len(data['sections']), 'sections')
