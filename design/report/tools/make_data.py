#!/usr/bin/env python3
"""Writes design/report/data.json: the words of the report (below) with the measured numbers of
design/report/sweep.json (tools/sweep.mjs), areas.json (tools/areas.mjs), review.json (the independent review)
and audit.txt (npm run audit), and the system files (design/scale.json, colors.json, decisions.json).

  python3 -I design/report/tools/make_data.py      then   python3 -I design/report/build_report.py data.json out.html

Round 1 has no earlier build to compare with: «before» is the Figma file (its frames at 320, 390, 768, 990, 1280,
1440 and 1920 hold sizes as steps), so the picture shows the site's lines against the Figma steps."""
import json, os, re

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROOT = os.path.dirname(os.path.dirname(HERE))
J = lambda *p: json.load(open(os.path.join(*p), encoding='utf-8'))
scale, colors, dec = J(ROOT, 'design/scale.json'), J(ROOT, 'design/colors.json'), J(ROOT, 'design/decisions.json')['decisions']
sweep, areas = J(HERE, 'sweep.json'), J(HERE, 'areas.json')
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
before = {'width': [dict({'w': r['w']}, **{k: fig_at(k, r['w']) for k in FIG}) for r in after['width']],
          'height': [dict({'h': r['h']}, **{k: fig_at(k, 1440) for k in FIG}) for r in after['height']]}

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
        ['Use analyzing-design-systems, full-system-report, responsive-web-design, be-more-ambitious', 'Figma frames measured into the size roles; this page is the full system report; the audit runs 4 pages × 11 sizes with axe and a 24px-text pass; an independent agent reviewed the work (Checks).', 'done'],
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
    {'label': 'Navbar', 'now': segs('nav', lambda v: 'links' if v else 'burger')},
    {'label': 'Hero', 'now': segs('heroCols', lambda v: {1: 'stacked', 2: 'title + count | links', 3: 'three cells'}[v])},
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

decision_items = [{'id': d['id'], 'kind': d['kind'], 'what': d['what'], 'why': d['why'], 'decided': d['decided'], 'isNew': True} for d in dec]
nd = {k: sum(1 for d in dec if d['kind'] == k) for k in ('decision', 'exception', 'placeholder')}
audit_clean = 'clean' in audit.splitlines()[-1] if audit.strip() and audit != '(not run)' else False
audit_last = audit.strip().splitlines()[-1] if audit.strip() else ''

rules_items = []
for line in rules_out.splitlines():
    m = re.match(r'^([✓✗]) (.+?) — (.+)$', line.strip())
    if m: rules_items.append({'title': m.group(2), 'how': m.group(3), 'ok': m.group(1) == '✓'})

data = {
  'meta': {'key': 'qq-system-report', 'title_tag': 'QQ Site System',
    'name': 'QQ Coffee <span>· the site system</span>',
    'eyebrow': f"Round 1 · branch site-system · <a href='{PR}'>pull request</a> · <a href='{FIGMA}'>Figma</a>",
    'title': 'One fluid size system for home, catalog and 25 coffee pages',
    'lede': 'The whole system of the new QQ Coffee site: 31 size roles drawn as lines from a 320 to a 1440 screen, three shared layout steps, one colour table, one motion vocabulary, the 3D packs. Everything was measured in a browser at every 10px of width and 25px of height; «before» is the Figma file, whose frames hold sizes as steps.',
    'footer': f"Measured in headless Chromium on the built site, {sweep['measured'][:10]}. Before = the Figma frames (320, 390, 768, 990, 1280, 1440, 1920); now = the site on branch site-system."},
  'sections': [
    {'id': 'changes', 'nav': 'Round 1', 'title': 'Round 1: what was built', 'sub': 'Your requests in the order you gave them, what was done with each, and the site next to Figma.', 'blocks': [
      {'type': 'stats', 'items': [{'n': 27, 'unit': 'pages', 'text': 'home, catalog and a page for each of the 25 coffees «на сайте»'},
                                  {'n': 31, 'unit': 'roles', 'text': 'every size: a value at 320 and at 1440, a straight line between'},
                                  {'n': 3, 'unit': 'steps', 'text': 'shared column steps S, M, L where every block changes layout'},
                                  {'n': 44, 'unit': 'checks', 'text': '4 pages × 11 screen sizes in the audit' + (', clean' if audit_clean else '')}]},
      {'type': 'shots', 'label': 'Figma and the site', 'note': 'Figma on the left in grey, the site on the right. Click a picture to open it large; arrows and Escape work.', 'items': shots_round},
      {'type': 'changes', 'groups': [{'section': g['section'], 'items': [{'ask': a, 'done': d, 'tag': t} for a, d, t in g['items']]} for g in changes]},
      {'type': 'list', 'title': 'Where the site departs from Figma, or does something you may not expect', 'items': breaks},
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
    {'id': 'hero', 'nav': 'Hero', 'title': 'The hero', 'sub': 'The first screen of the home page: a drifting photo, the title, the countdown to the next roast, three links.', 'blocks': [
      {'type': 'cards', 'cols': 3, 'items': [
        {'title': 'Height', 'html': 'min(<b>100svh − 48</b>, max(<b>40vw + 14rem</b>, <b>100svh − 7.5rem</b>)): the screen less the navbar at most; on a tall screen it leaves 120px of the next block in view; never so short the photo vanishes (decision hero-height).'},
        {'title': 'Cells', 'html': 'One column below M (stacked), two at M (title and countdown | links), three from L as in Figma. Cells are divided by hairlines; the links fill their cell.'},
        {'title': 'Countdown', 'html': 'Technology Bold, <code>--type-countdown</code> 40 → 96, or 31% of its cell when the cell is narrower (decision countdown-fits-cell): 61 px at 768, 88 at 1280, 96 from 1440. Moscow time, weekdays at 10:00 (placeholder schedule).'},
      ]},
      hero_tbl]},
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
    {'id': 'picture', 'nav': 'Every size', 'title': 'The whole responsive picture', 'sub': 'Every role and block size as the browser resolves it, every 10px of width (a screen 1100 tall) and every 25px of height (1440 wide). Dashed grey: the Figma steps, where a frame holds that size.', 'blocks': [
      {'type': 'picture',
       'groups': {'type': {'label': 'Type', 'keys': [css_of(k) for k in troles]},
                  'space': {'label': 'Spacing', 'keys': [v['css'] for k, v in sroles.items() if k not in ('story/min-h', 'footer/logo', 'product/stage')]},
                  'blocks': {'label': 'Blocks', 'keys': ['heroH', 'featuredH', 'storyH', 'colW', 'catalogFirstW', '--footer-logo']},
                  'stage': {'label': 'Product stage', 'keys': ['pinH', 'packW', 'packH', 'buybarH', 'tileW']},
                  'figma': {'label': 'Against Figma', 'keys': list(dict.fromkeys(k for k in FIG if k != '--type-countdown'))}},
       'order': ['type', 'space', 'blocks', 'stage', 'figma'],
       'labels': {**{css_of(k): k.split('/')[1] for k in troles}, **{v['css']: k for k, v in sroles.items()},
                  'heroH': 'hero height', 'featuredH': 'Новинки slide', 'storyH': 'image block', 'colW': 'content column', 'catalogFirstW': 'first catalog card',
                  'pinH': 'pinned stage', 'packW': 'pack box width', 'packH': 'pack box height', 'buybarH': 'buy bar', 'tileW': 'fact tile', 'countdownPx': 'countdown (drawn)'},
       'sweep': {'before': before, 'after': after},
       'axes': {'width': {'label': 'By width', 'x': 'w', 'note': 'Screen width (px), 1100 tall', 'tip': '{x} wide', 'ticks': [320, 768, 1024, 1440, 1920], 'solid': []},
                'height': {'label': 'By height', 'x': 'h', 'note': 'Screen height (px), 1440 wide', 'tip': '{x} tall', 'ticks': [400, 600, 800, 1000]}}},
    ]},
    {'id': 'map', 'nav': 'Map', 'title': 'Responsive map', 'sub': 'What each block does at each width, from the sweep. Accent lines: the shared column steps (S, M, L land at these screen widths because the column is the screen less two gutters). Dashed: the navbar\'s page step.', 'blocks': [
      {'type': 'map', 'range': [320, 1920], 'ticks': [320, 390, 768, 1024, 1280, 1440, 1920], 'rows': maprows,
       'steps': [{'w': 750, 'label': 'M 43rem'}, {'w': 1000, 'label': 'L 58rem'}], 'page': [{'w': 1030, 'label': 'navbar 64em'}]},
      {'type': 'list', 'items': ['S (22rem column) lands at about 380: it changes small things inside cards (the filter cells, the buy-bar captions), so it shows no row here.',
                                 'Every block changes at the same two widths, about 750 and 1000; only the navbar has its own step (64em, so bigger browser text gets the burger sooner).',
                                 'The catalog filter cells wrap by their own width (they flow), so their rows change at 370, 550, 730 and 1260 with no step.']},
    ]},
    {'id': 'motion', 'nav': 'Motion', 'title': 'Motion', 'sub': 'src/styles/base/motion.css: three curves and three times. With «reduce motion» every time is 0 and the packs stand still.', 'blocks': [
      {'type': 'curves', 'items': [
        {'name': 'out', 'use': 'arriving and settling: hovers, panels, the toast coming in', 'code': '--ease-out: cubic-bezier(0.16, 1, 0.3, 1)', 'bez': [0.16, 1, 0.3, 1]},
        {'name': 'move', 'use': 'travelling: the hero photo\'s drift', 'code': '--ease-move: cubic-bezier(0.65, 0, 0.35, 1)', 'bez': [0.65, 0, 0.35, 1]},
        {'name': 'leave', 'use': 'going away: the toast leaving', 'code': '--ease-leave: cubic-bezier(0.7, 0, 0.84, 0)', 'bez': [0.7, 0, 0.84, 0]},
        {'name': 'pack follow', 'use': 'the packs follow their targets (scroll lean, pointer turn) at 9 per second', 'code': 'TUNE.follow = 9', 'fn': 'power2.out'},
      ]},
      {'type': 'durations', 'max': 2, 'rows': [
        {'group': 'hover', 'name': 'hover in (--t-in)', 's': 0.2}, {'group': 'hover', 'name': 'hover out (--t-out)', 's': 0.45},
        {'group': 'move', 'name': 'photo zoom on card hover (--t-move)', 's': 0.6}, {'group': 'move', 'name': 'toast in (--t-move)', 's': 0.6},
        {'group': 'move', 'name': 'toast out (--t-out)', 's': 0.45}, {'group': 'move', 'name': 'bag icon pop (--t-move)', 's': 0.6},
        {'group': 'pack', 'name': 'still fades as WebGL draws', 's': 0.3}, {'group': 'pack', 'name': 'packs follow scroll and pointer (~95%)', 's': 0.33, 'kind': 'scroll'},
        {'group': 'pack', 'name': 'product pack turn (one turn over 5 tiles)', 's': 3, 'kind': 'scroll', 'label': 'as long as the scroll through the stage'},
        {'group': 'loop', 'name': 'hero photo drift (alternate)', 's': 40, 'kind': 'loop', 'label': '40s each way'}]},
      {'type': 'cards', 'cols': 2, 'items': [
        {'title': 'In fast, out slow', 'html': 'Hovers come in at 0.2s and leave at 0.45s, so a pointer passing over a list leaves a soft trail (as Flow Medium).'},
        {'title': 'One loop', 'html': 'The hero photo drifts 8% over 40s and back; it is the only thing that moves by itself, and it stops with «reduce motion».'},
      ]},
    ]},
    {'id': 'grammar', 'nav': 'Grammar', 'title': 'The grammar', 'sub': 'How the site is drawn, in plain words, and which of these rules a script checks.', 'blocks': [
      {'type': 'cards', 'cols': 3, 'items': [
        {'title': 'Colour', 'html': 'Ink #2d2f33 on paper, cloud #f6f6f6 for surfaces (cards, tiles, the buy bar), graphite and black for dark blocks, lavender for eyebrows and info icons. Secondary text is ink at 70%; 60% only for large text.'},
        {'title': 'Type', 'html': 'Mono bold capitals tracked 0.05em for names and headings; Apercu for everything read; Technology digits for the countdown. Labels (eyebrows, controls, prices) differ by case and colour, not size.'},
        {'title': 'Size', 'html': 'Every size a line from 320 to 1440 on one ladder; the screen\'s height counts; nothing grows past 1440, the column stops at 1520.'},
        {'title': 'Shape', 'html': 'Sharp rectangles divided by hairlines; only pills and dots are round.'},
        {'title': 'Layout', 'html': 'Everything sits in the content column; full-bleed blocks put their content in a column too, so they change at the same steps S, M, L.'},
        {'title': 'Motion', 'html': 'Three curves, three times, one loop; the packs follow scroll and pointer.'},
      ]},
      {'type': 'table', 'title': 'Rules', 'columns': [{'label': 'Rule'}, {'label': 'Status', 'pill': True}], 'rows': [
        ['Colours only from tokens', 'checked'], ['Sizes only from the scale; screen units only where a decision says', 'checked'], ['Layout steps only at S, M, L (and 64em, 25em, 32em tall)', 'checked'],
        ['No rounded corners except pills and dots', 'checked'], ['Motion only from motion.css', 'checked'], ['Faces only through tokens', 'checked'], ['Every token defined and used', 'checked'],
        ['Type levels ≥ ×1.125 apart at both ends', 'checked'], ['Every decision complete', 'checked'],
        ['Every row that scrolls sideways is position: relative', 'written'], ['3D canvas at z-index 5; what shows above packs ≥ 6', 'written'],
        ['Links inside the site through href(ctx, to)', 'written'], ['One heading level per section; names in mono, text in Apercu', 'implicit'],
        ['Cells inside a block share hairlines (margin −1px), never double lines', 'implicit']]},
    ]},
    {'id': 'checks', 'nav': 'Checks', 'title': 'Checks', 'sub': 'What was checked, how, and what is kept on purpose.', 'blocks': [
      {'type': 'stats', 'items': [{'n': 44, 'unit': 'runs', 'text': audit_last or 'the audit'}, {'n': len(rules_items) or 9, 'unit': 'rules', 'text': 'all hold (build/rules.mjs)'},
                                  {'n': 0, 'unit': 'px', 'text': 'sideways scroll at every 10px from 320 to 1920'}, {'n': len(dec), 'unit': 'decisions', 'text': f"{nd['decision']} decisions, {nd['exception']} exceptions, {nd['placeholder']} placeholders"}]},
      {'type': 'rules', 'title': 'The rules (run on every build and in CI)', 'items': rules_items},
      {'type': 'decisions', 'title': 'The decisions register (design/decisions.json)', 'items': decision_items},
      {'type': 'list', 'title': 'The independent review', 'sub': 'A separate agent that had not seen the work checked the built site against the request, the rules and the pages in a browser. Its findings and what was done about each:', 'items': review or ['(pending)']},
      {'type': 'pre', 'summary': 'The audit\'s output (npm run audit)', 'text': audit},
    ]},
    {'id': 'next', 'nav': 'Next', 'title': 'Next', 'sub': 'What is open, what I need from you, and what to check on real devices.', 'blocks': [
      {'type': 'list', 'title': 'Needed from you', 'items': [
        '<b>The animated footer logo</b> (the file or a link): the footer shows the static logo now.',
        '<b>Real prices</b> into data/prices.json, or a price column in the table.',
        '<b>Each coffee\'s label</b> at 512 and 1024 px, front and back: every pack shows Sumatra now.',
        '<b>QQ\'s own photos</b>: the current ones are Figma\'s moodboard, several with other roasters\' packs.',
        '<b>The roast schedule</b> (days, hour) for the countdown, and the hero video file.',
        '<b>The texts behind the plus</b> of the three info blocks.',
        '<b>PT Mono Bold</b>: with a web licence it replaces JetBrains Mono in one line.']},
      {'type': 'list', 'title': 'Not designed yet', 'items': ['The mobile menu (a plain list now).', 'Bag, checkout, search, favourites page, account.', 'Cascara, drips, sets, merch; the journal; the business pages.']},
      {'type': 'list', 'title': 'Check on real devices', 'items': ['iOS Safari: the pinned stage and the buy bar with the URL bar moving; backdrop blur on the tiles.', 'Android Chrome: the 3D canvas\'s frame rate on a mid-range phone.', 'A phone sideways: the buy bar after the stage (new) — is that the behaviour you want?', 'Windows with classic scrollbars at 1000–1030 wide: the L step and the navbar step sit close together.']},
    ]},
    {'id': 'earlier', 'nav': 'Earlier', 'title': 'Earlier rounds', 'sub': 'None yet: this is the first round. Later rounds put their changes first and keep this round\'s here.', 'blocks': []},
  ]}
json.dump(data, open(os.path.join(HERE, 'data.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('data.json:', len(data['sections']), 'sections')
