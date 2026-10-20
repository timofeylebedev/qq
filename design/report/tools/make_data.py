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
NEW_KEYS = {'--hero-photo', '--hero-fade', '--hero-max'}          # roles the previous build did not have
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
    {'label': 'Footer', 'now': segs('footerCols', lambda v: f"{v} col")},
]

R2_IDS = {'countdown-as-caption', 'nav-steps', 'nav-links-pages', 'nav-ground', 'hover-tint', 'one-line-colour', 'hero-height', 'nav-height', 'mobile-menu'}
decision_items = [{'id': d['id'], 'kind': d['kind'], 'what': d['what'], 'why': d['why'], 'decided': d['decided'], 'isNew': d['id'] in R2_IDS} for d in dec]
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
PR2 = 'https://github.com/timofeylebedev/qq/pulls'
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
        ['On click moving away a bit (on hold stays moved away)', 'Pointer down on a pack: 0.45 further from the viewer and 94% of its size (from the hover state +0.35 / 103% to −0.10 / 96.8%), the shadow closer; it stays while held and comes back on release; a quick click holds it for at least 0.2s so it reads. On touch it waits 90ms (a touch may be the start of a scroll).', 'done'],
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

data = {
  'meta': {'key': 'qq-system-report', 'title_tag': 'QQ Site System',
    'name': 'QQ Coffee <span>· the site system</span>',
    'eyebrow': f"Round 2 · branch round-2 · <a href='{PR2}'>pull request</a> · <a href='{SITE}'>test site</a> · <a href='{FIGMA}'>Figma</a>",
    'title': 'One fluid size system for home, catalog and 25 coffee pages; round 2: a navbar on grounds, the hero in rows',
    'lede': f"The whole system of the QQ Coffee site: {len(sroles) + len(troles)} size roles drawn as lines from a 320 to a 1440 screen, three shared layout steps and the column at its most, one colour table with one line colour, one motion vocabulary, the 3D packs. Round 2 rebuilt the navbar (four steps, the colours of the section under it, a tab bar on phones) and the hero (screen less 24, three shared rows, a countdown as wide as its caption), made every line one colour, and the packs trail and press. Measured at every 10px of width and 25px of height; «before» is round 1's build.",
    'footer': f"Measured in headless Chromium on the built sites, {sweep['measured'][:10]}. Before = round 1 (branch component-canvas, commit 6673a8f); now = branch round-2. Round 1's «before» was the Figma frames."},
  'sections': [
    {'id': 'changes', 'nav': 'Round 2', 'title': 'Round 2: what changed', 'sub': 'Your comments in your order and under your headings, what was done with each (measured before → now), and the two builds side by side.', 'blocks': [
      {'type': 'stats', 'items': [{'n': 27, 'unit': 'comments', 'text': '23 done, 3 done differently or to check, 1 read with the next (navbar 4)'},
                                  {'n': 4, 'unit': 'steps', 'text': 'of the navbar: every section, four short ones, the burger, the tab bar'},
                                  {'n': 0, 'unit': 'px', 'text': 'between each countdown part and its link, and between the digits and the caption'},
                                  {'n': 10, 'unit': 'rules', 'text': 'checked on every build: «one line colour» is new' + (' · audit clean' if audit_clean else '')}]},
      {'type': 'shots', 'label': 'What it looks like', 'note': 'Round 1 in grey, round 2 in blue, at the size each caption names. Click a picture to open it large; arrows and Escape work.', 'items': shots_r2},
      {'type': 'changes', 'groups': [{'section': g['section'], 'items': [{'ask': a, 'done': d, 'tag': t} for a, d, t in g['items']]} for g in changes_r2]},
      {'type': 'list', 'title': 'What this changes that you may not expect', 'items': breaks_r2},
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
    {'id': 'navbar', 'nav': 'Navbar', 'title': 'The navbar and the tab bar', 'sub': 'New this round: four steps, the colours of the section under it, one max width with the column, a tab bar on phones.', 'blocks': [
      {'type': 'cards', 'cols': 3, 'items': [
        {'title': 'Steps', 'html': 'Every section in three groups from <b>64em</b> (1024, the screen of L); «Каталог, Бизнесу, Журнал, Контакты» from <b>48em</b> (768, the screen of M); the burger below; under <b>40em</b> (640) the tab bar. In em, so bigger browser text takes the narrower step sooner. <code>media.css</code>: --links-full, --links, --phone.'},
        {'title': 'Width', 'html': 'The bar\'s margin is 16px (the small gutter); its content <code>min(100% − 2 × (16 − 8), --col-max + 2 × 8)</code>: the logo\'s and icons\' boxes carry 8px of air, so the glyphs stand 16px from the edges, and on the column\'s edges once it is at its most (1616 and up).'},
        {'title': 'Grounds', 'html': 'Sections say <code>data-ground</code> (paper, cloud, black, ink); it sets <code>--g-bg</code>, <code>--g-fg</code>, <code>--line</code> and <code>--tint</code>. The bar takes a ground once its whole height is over that section, crossing over in 0.6s; at the top of the page (and above it) the first section\'s. The tab bar does the same at the foot of the screen.'},
        {'title': 'Hover', 'html': 'A tint behind the one item: <code>--tint</code>, white 20% on dark grounds, ink 6% on light ones. 0.2s in, 0.45s out. Nothing else on the bar changes.'},
        {'title': 'Links', 'html': 'An item links only to a page that exists (data/site.json nav: a second value is the path). Today: «Кофе» and «Каталог». The rest are <code>&lt;a&gt;</code> without href: shown, not clickable, not in the tab order.'},
        {'title': 'Tab bar', 'html': '56px + the safe area, four equal cells with icon and label (<code>--type-small</code>); the bag\'s count only. Everything fixed to the foot stands on it through <code>--tabbar-h</code> (the buy bar, the toast, the menu\'s height, the hero).'},
      ]},
      nav2_tbl]},
    {'id': 'hero', 'nav': 'Hero', 'title': 'The hero', 'sub': 'The first screen of the home page: the photo, the eased fade, the title, the countdown to the next roast, three links.', 'blocks': [
      {'type': 'cards', 'cols': 3, 'items': [
        {'title': 'Height', 'html': '<code>min(100svh − 24 − tab bar, --hero-max)</code>, and never less than the navbar + <code>--hero-photo</code> (48 → 120) + <code>--hero-fade</code> (64 → 160) + the cells. <code>--hero-max</code> 960 → 1200 stops a portrait tablet or a 2560 screen (decision hero-height).'},
        {'title': 'Rows', 'html': 'Below M the title, the countdown and the links stack. From M the countdown and the links share three equal rows (subgrid), title above; from L the title takes the first cell beside them. Row padding <code>--hero-cell-y</code> 12 → 20; texts trimmed to cap height and baseline.'},
        {'title': 'Countdown', 'html': 'Everything as wide as the caption (13.9em of <code>--type-control</code>): the digits are control × 13.9 / 3 in tabular Technology (build/fonts.py), a date control × 13.9 / (0.65 × its letters) in mono. More than 24h to wait shows the date. Moscow time, the placeholder weekday schedule.'},
        {'title': 'Frame', 'html': 'At the container step <code>max</code> (the column at 1520px) the cells get a hairline on each side and the title 48px of padding.'},
        {'title': 'Fade', 'html': '<code>--fade-black</code>: 16 stops along cubic-bezier(0.42, 0, 0.58, 1), from colors.json fades; over <code>--hero-fade</code>.'},
        {'title': 'Entrance', 'html': 'The cells rise one section gap and fade in, 0.9s on --ease-out after 0.2s (<code>--t-rise</code>).'},
      ]},
      hero2_tbl]},
    {'id': 'stage', 'nav': 'Product stage', 'title': 'The product stage and the buy bar', 'sub': 'A coffee\'s page: the pack pinned while the fact tiles scroll past, the buy bar at the foot.', 'blocks': [
      {'type': 'cards', 'cols': 3, 'items': [
        {'title': 'Pin', 'html': 'Height <b>100svh − navbar − buy bar</b> (at least 22rem), pinned for as long as the five tiles take to pass; the tiles are 40% of the screen\'s height apart (28% from L), so scroll time is measured in screens (decision product-pin).'},
        {'title': 'Pack', 'html': '<code>--stage</code> 320 → 720, capped by the pin. It turns once around with <code>qqStage.progress</code>; tiles are frosted (cloud 70% + blur 40px) so the pack shows through them.'},
        {'title': 'Buy bar', 'html': 'Two rows of cells below L (options; quantity, price, «В корзину»), one row from L as in Figma. <b>New this round:</b> on a screen under 32em tall it waits after the stage instead of following the screen, which pins at the whole screen under the navbar (decision short-screens).'},
      ]},
      stage_tbl]},
    {'id': 'catalog', 'nav': 'Catalog', 'title': 'The catalog', 'sub': 'Tabs, filters kept in the address, the grid.', 'blocks': [
      {'type': 'cards', 'cols': 3, 'items': [
        {'title': 'Filters', 'html': 'Seven cells (sort, price of 200 g, type, line, country, processing, preparation) that wrap by width: 7 rows at 320, 4 at 375, 2 from 730, one row from 1260. A panel that would stick out on the right opens leftwards. The choice lives in the address, so a filtered catalog can be shared.'},
        {'title': 'Grid', 'html': 'One column below M, two at M, and from L six tracks: the first four cards take half a row, the rest a third — the rhythm of the Figma catalog, kept only in the default order.'},
        {'title': 'Tabs', 'html': '«Все» and «Кофе» show the coffee; каскара, дрипы, сеты and мерч say they are coming (not in the shop yet).'},
      ]},
      cat_tbl]},
    {'id': 'picture', 'nav': 'Every size', 'title': 'The whole responsive picture', 'sub': 'Every role and block size as the browser resolves it, every 10px of width (a screen 1100 tall) and every 25px of height (1440 wide). Dashed grey: round 1. Moved this round: --hero-cell-y (20 → 40 became 12 → 20), the hero\'s height, rows, photo strip and digits (Hero tab), the navbar\'s step and content width (Navbar tab), the pinned stage under 640 (the tab bar); new: --hero-photo, --hero-fade, --hero-max (no line before).', 'blocks': [
      {'type': 'picture',
       'groups': {'type': {'label': 'Type', 'keys': [css_of(k) for k in troles]},
                  'space': {'label': 'Spacing', 'keys': [v['css'] for k, v in sroles.items() if k not in ('story/min-h', 'footer/logo', 'product/stage')]},
                  'blocks': {'label': 'Blocks', 'keys': ['heroH', 'featuredH', 'storyH', 'colW', 'catalogFirstW', '--footer-logo']},
                  'stage': {'label': 'Product stage', 'keys': ['pinH', 'packW', 'packH', 'buybarH', 'tileW']},
                  'hero': {'label': 'Hero', 'keys': ['heroH', 'heroCellsH', 'heroRow', 'heroPhoto', 'digitsW', 'captionW', 'countdownPx', '--hero-cell-y', '--hero-photo', '--hero-fade', '--hero-max']},
                  'navbar': {'label': 'Navbar', 'keys': ['navStep', 'navContentW', 'navLogoX', 'colW']}},
       'order': ['type', 'space', 'blocks', 'stage', 'hero', 'navbar'],
       'labels': {**{css_of(k): k.split('/')[1] for k in troles}, **{v['css']: k for k, v in sroles.items()},
                  'heroH': 'hero height', 'featuredH': 'Новинки slide', 'storyH': 'image block', 'colW': 'content column', 'catalogFirstW': 'first catalog card',
                  'pinH': 'pinned stage', 'packW': 'pack box width', 'packH': 'pack box height', 'buybarH': 'buy bar', 'tileW': 'fact tile', 'countdownPx': 'countdown font size',
                  'heroCellsH': 'hero cells', 'heroRow': 'hero row (a link)', 'heroPhoto': 'photo above the cells', 'digitsW': 'digits (drawn width)', 'captionW': 'caption (drawn width)',
                  'navStep': 'navbar step (1 tab bar, 2 burger, 3 short, 4 every section)', 'navContentW': 'navbar content width', 'navLogoX': 'logo glyph from the screen edge'},
       'sweep': {'before': before, 'after': after},
       'axes': {'width': {'label': 'By width', 'x': 'w', 'note': 'Screen width (px), 1100 tall', 'tip': '{x} wide', 'ticks': [320, 768, 1024, 1440, 1920], 'solid': []},
                'height': {'label': 'By height', 'x': 'h', 'note': 'Screen height (px), 1440 wide', 'tip': '{x} tall', 'ticks': [400, 600, 800, 1000]}}},
    ]},
    {'id': 'map', 'nav': 'Map', 'title': 'Responsive map', 'sub': 'What each block does at each width, from the sweep. Accent lines: the shared column steps (S, M, L land at these screen widths because the column is the screen less two gutters). Dashed: the navbar\'s page step.', 'blocks': [
      {'type': 'map', 'range': [320, 1920], 'ticks': [320, 390, 768, 1024, 1280, 1440, 1920], 'rows': maprows,
       'steps': [{'w': 750, 'label': 'M 43rem'}, {'w': 1000, 'label': 'L 58rem'}, {'w': 1620, 'label': 'max 1520px'}], 'page': [{'w': 640, 'label': 'tab bar 40em'}, {'w': 768, 'label': 'short 48em'}, {'w': 1024, 'label': 'every section 64em'}]},
      {'type': 'list', 'items': ['Round 2 moved the navbar\'s steps (before: the burger under 64em) and added two: 48em and 40em. The page steps now sit at the screens of the column steps (768 ≈ M, 1024 ≈ L), so with a 16px text the navbar changes together with the blocks. The new container step max (the column at 1520px, from about 1616) frames the hero. No block step moved.','S (22rem column) lands at about 380: it changes small things inside cards (the filter cells, the buy-bar captions), so it shows no row here.',
                                 'Every block changes at the same two widths, about 750 and 1000; only the navbar has its own step (64em, so bigger browser text gets the burger sooner).',
                                 'The catalog filter cells wrap by their own width (they flow), so their rows change at 370, 550, 730 and 1260 with no step.']},
    ]},
    {'id': 'motion', 'nav': 'Motion', 'title': 'Motion', 'sub': 'src/styles/base/motion.css: three curves and four times (--t-rise is new). With «reduce motion» every time is 0 and the packs stand still, without lag or press.', 'blocks': [
      {'type': 'curves', 'items': [
        {'name': 'out', 'use': 'arriving and settling: hovers, panels, the toast coming in', 'code': '--ease-out: cubic-bezier(0.16, 1, 0.3, 1)', 'bez': [0.16, 1, 0.3, 1]},
        {'name': 'move', 'use': 'travelling: the hero photo\'s drift', 'code': '--ease-move: cubic-bezier(0.65, 0, 0.35, 1)', 'bez': [0.65, 0, 0.35, 1]},
        {'name': 'leave', 'use': 'going away: the toast leaving', 'code': '--ease-leave: cubic-bezier(0.7, 0, 0.84, 0)', 'bez': [0.7, 0, 0.84, 0]},
        {'name': 'pack follow', 'use': 'the packs follow their targets (scroll lean, pointer turn) at 9 per second', 'code': 'TUNE.follow = 9', 'fn': 'power2.out'},
        {'name': 'pack lag (new)', 'use': 'how a pack catches up with its slot after a scroll: 1 − e^(−9t), soft-capped at 12% of its height (≤ 40px)', 'code': 'TUNE.lag = 9, lagMax = 0.12, lagMaxPx = 40', 'linear': [[0, 0], [0.06, 0.42], [0.12, 0.66], [0.18, 0.8], [0.24, 0.885], [0.3, 0.933], [0.36, 0.961], [0.42, 0.977], [0.5, 0.989], [0.6, 0.995], [1, 1]]},
      ]},
      {'type': 'durations', 'max': 2, 'rows': [
        {'group': 'hover', 'name': 'hover in (--t-in)', 's': 0.2}, {'group': 'hover', 'name': 'hover out (--t-out)', 's': 0.45},
        {'group': 'move', 'name': 'photo zoom on card hover (--t-move)', 's': 0.6}, {'group': 'move', 'name': 'toast in (--t-move)', 's': 0.6},
        {'group': 'move', 'name': 'toast out (--t-out)', 's': 0.45}, {'group': 'move', 'name': 'bag icon pop (--t-move)', 's': 0.6},
        {'group': 'pack', 'name': 'still fades as WebGL draws', 's': 0.3}, {'group': 'pack', 'name': 'packs follow scroll and pointer (~95%)', 's': 0.33, 'kind': 'scroll'},
        {'group': 'pack', 'name': 'product pack turn (one turn over 5 tiles)', 's': 3, 'kind': 'scroll', 'label': 'as long as the scroll through the stage'},
        {'group': 'new', 'name': 'navbar / tab bar cross to a new ground (--t-move)', 's': 0.6},
        {'group': 'new', 'name': 'hero cells rise in, after 0.2s (--t-rise)', 's': 1.1, 'label': '0.2s wait + 0.9s'},
        {'group': 'new', 'name': 'pack catches up after a scroll (to 95%)', 's': 0.33, 'kind': 'scroll'},
        {'group': 'new', 'name': 'pack press in / out (16 per second, to 95%)', 's': 0.19}, {'group': 'new', 'name': 'press held at least', 's': 0.2},
        {'group': 'loop', 'name': 'hero photo drift (alternate)', 's': 40, 'kind': 'loop', 'label': '40s each way'}]},
      {'type': 'cards', 'cols': 2, 'items': [
        {'title': 'In fast, out slow', 'html': 'Hovers come in at 0.2s and leave at 0.45s, so a pointer passing over a list leaves a soft trail (as Flow Medium).'},
        {'title': 'One loop', 'html': 'The hero photo drifts 8% over 40s and back; it is the only thing that moves by itself, and it stops with «reduce motion».'},
        {'title': 'Weight (new)', 'html': 'The packs trail the page a little and catch up as it stops, so they feel set on the shelf rather than printed on it; pressed, they give way.'},
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
        {'title': 'Motion', 'html': 'Three curves, three times, one loop; the packs follow scroll and pointer.'},
      ]},
      {'type': 'table', 'title': 'Rules', 'columns': [{'label': 'Rule'}, {'label': 'Status', 'pill': True}], 'rows': [
        ['Colours only from tokens', 'checked'], ['Sizes only from the scale; screen units only where a decision says', 'checked'], ['Layout steps only at S, M, L, max (and 64em, 48em, 40em, 32em tall)', 'checked'],
        ['No rounded corners except pills and dots', 'checked'], ['Motion only from motion.css', 'checked'], ['Faces only through tokens', 'checked'], ['Every token defined and used', 'checked'],
        ['Type levels ≥ ×1.125 apart at both ends', 'checked'], ['Every decision complete', 'checked'],
        ['One line colour: borders only var(--line) (new)', 'checked'], ['The navbar\'s sections never touch the logo or the tools (new, audit)', 'checked'], ['The countdown as wide as its caption (new, audit)', 'checked'],
        ['Every section says its ground (data-ground) (new)', 'written'], ['Links only to pages that exist (new)', 'written'], ['Fixed bars stand on the tab bar (--tabbar-h) (new)', 'written'], ['A hover changes only its own item (new)', 'written'],
        ['Every row that scrolls sideways is position: relative', 'written'], ['3D canvas at z-index 5; what shows above packs ≥ 6', 'written'],
        ['Links inside the site through href(ctx, to)', 'written'], ['One heading level per section; names in mono, text in Apercu', 'implicit'],
        ['Cells inside a block share hairlines (margin −1px), never double lines', 'implicit']]},
    ]},
    {'id': 'checks', 'nav': 'Checks', 'title': 'Checks', 'sub': 'What was checked, how, and what is kept on purpose.', 'blocks': [
      {'type': 'stats', 'items': [{'n': 48, 'unit': 'runs', 'text': audit_last or 'the audit'}, {'n': len(rules_items) or 10, 'unit': 'rules', 'text': 'all hold (build/rules.mjs); «one line colour» new'},
                                  {'n': 0, 'unit': 'px', 'text': 'sideways scroll at every 10px from 320 to 1920'}, {'n': len(dec), 'unit': 'decisions', 'text': f"{nd['decision']} decisions, {nd['exception']} exceptions, {nd['placeholder']} placeholders"}]},
      {'type': 'rules', 'title': 'The rules (run on every build and in CI)', 'items': rules_items},
      {'type': 'decisions', 'title': 'The decisions register (design/decisions.json)', 'items': decision_items},
      {'type': 'list', 'title': 'The independent review', 'sub': 'A separate agent that had not seen the round checked the built site against your comments, the rules and the three pages in a browser. Its findings and what was done about each:', 'items': review or ['(pending)']},
      {'type': 'pre', 'summary': 'The audit\'s output (npm run audit)', 'text': audit},
    ]},
    {'id': 'next', 'nav': 'Next', 'title': 'Next', 'sub': 'What is open, what I need from you, and what to check on real devices.', 'blocks': [
      {'type': 'list', 'title': 'Questions from this round', 'items': [
        '<b>Navbar 4, «[additional padding]»:</b> I read it with 5 (the air inside the logo\'s and icons\' boxes). Did you mean something else?',
        '<b>Hover on light grounds:</b> white is invisible on white, so the tint there is ink at 6%. Keep, or another tint?',
        '<b>Links without pages:</b> the hero\'s «Бизнесу», «Контакты» and the footer\'s links still go to anchors or «#». Should the same rule (no page, no link) apply there?',
        '<b>Short phones:</b> the hero is taller than the screen at 320 × 568 and sideways (three title lines and the wide countdown). Is that fine, or should short screens get a tighter hero?',
        '<b>The reload</b> keeps its place in Chromium (it did before as well): in which browser did you see it jump?']},
      {'type': 'list', 'title': 'Still needed from you (from round 1)', 'items': [
        '<b>The animated footer logo</b> (the file or a link).', '<b>Real prices</b> into data/prices.json.', '<b>Each coffee\'s label</b> at 512 and 1024 px, front and back.',
        '<b>QQ\'s own photos</b> (the current ones are Figma\'s moodboard).', '<b>The roast schedule</b> and the hero video.', '<b>The texts behind the plus</b> of the info blocks.',
        '<b>PT Mono Bold</b> with a web licence.', '<b>Countries of the blends</b>: the sticker column or the lots?', '<b>Publish the component canvas</b> on the test site?']},
      {'type': 'list', 'title': 'Not designed yet', 'items': ['The menu behind the burger (a plain list now).', 'Pages for the navbar\'s items: каскара, дрипы, сеты, бизнесу (кофейням, офисам), журнал, контакты, search, favourites, bag, profile.', 'Checkout, account; merch; the journal.']},
      {'type': 'list', 'title': 'Open in the system', 'items': ['Spacing lengths inside components are not linted yet (icon sizes, small paddings).', 'From round 1: on a coffee\'s page at 1440 × 900 the big pack is cut at the top of its box while it settles; card descriptions cannot be drag-selected in Chromium.']},
      {'type': 'list', 'title': 'Check on real devices', 'items': ['Safari (Mac and iPhone): the bounce above the page stays black on the home page; text-box trim in the hero; the scroll place after a reload.', 'iPhone: the tab bar with the home indicator (safe area), the buy bar standing on it, the URL bar moving.', 'A trackpad and a mouse wheel: is the packs\' lag «a bit», or too much / too little? (TUNE.lag and lagMax in the console.)', 'Pressing a pack on a card: the press shows, then the coffee\'s page opens.']},
    ]},
    {'id': 'earlier', 'nav': 'Round 1', 'title': ROUND1['title'], 'sub': 'As it was published: your round 1 requests, what was built, and the site next to Figma.', 'blocks': ROUND1['blocks']},
  ]}
json.dump(data, open(os.path.join(HERE, 'data.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('data.json:', len(data['sections']), 'sections')
