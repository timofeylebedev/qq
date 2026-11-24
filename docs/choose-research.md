# How shops let people choose: what still works for 25 coffees

Session 3 of choosing coffee (24 Nov 2026). Four surveys, each by a separate agent from public pages (most read as
server HTML or the shops' own product JSON, not in a browser): Russian roasters, small roasters abroad, other taste
products (wine, tea, beer, chocolate, perfume, cheese, whisky), and UX research on filtering. The decision built from it
is in `docs/choose.md`; the session's plan is the claude.ai project doc `claude/choosing-coffee-plan.md`.

## What the shops do

**Russian roasters** (Tasty 178 items, Сварщица ≈70, Torrefacto 44, West 4 58, Laboratoria 19, Лоботрясы 22, Черный ≈10,
Camera Obscura 13, Человек и пароход ≈5):
- The first fork is the roast by use: «для эспрессо / для фильтра / под молоко» (Tasty, Сварщица, Torrefacto, West 4,
  Лоботрясы, Camera Obscura, Черный). Tasty's tiles name the devices («для автоматической и рожковой кофемашины,
  эспрессо, турки и гейзерной кофеварки»), and puts the turka under both.
- Torrefacto opens with «Как вы готовите кофе?» (8 methods), but its own counts show the method barely narrows
  anything (Турка 20 of 20, Мока 20, Автомат 20). Its value is the roast and grind it sets, not the narrowing.
- Grind is an option on the product, named by the method: «для гейзерной кофеварки», «мока/гейзер», «под френч-пресс»,
  «не молоть» (Сварщица, West 4, Лоботрясы, Camera Obscura, Человек и пароход). Every shop that names grinds by method
  has one for the moka pot. QQ has none (and no coarse grind).
- Cards carry 2–3 taste bars: «Кислотность» everywhere, plus «Плотность»/«Тело» and «Сладость» or «Горечь». Tasty's are
  two progress bars; Torrefacto alone writes the number («4 из 10»).
- Empty results are handled badly: Сварщица «НИЧЕГО НЕ НАЙДЕНО» with a joke; Лоботрясы a blank grid; Onyx (abroad)
  «No Matches. Maybe try adjusting your filters».
- Big-catalogue habits at small sizes: Laboratoria (19 coffees) has a 39-note filter; West 4 13 sort options and a
  score filter.

**Small roasters abroad** (Onyx 35, Counter Culture ≈15, Square Mile 13, La Cabra 9, Tim Wendelboe ≈9, Sey 7, Heart 10,
George Howell 25 in stock, Verve 30, Origin 27, Workshop ≈20, Methodical ≈48, Driftaway 30):
- The smallest show everything on one page in named groups instead of facets: La Cabra (sections), Square Mile (Show
  all / Espresso / Filter / Decaf), Methodical (Classic / Contemporary / Avant-Garde).
- One short spectrum as the first choice: Origin (Bold / Balanced / Bright, each a sentence), Pact (chocolate → fruity-
  floral), Trade (classic → unconventional), Onyx (Traditional / Modern).
- The method decides roast and grind together: Workshop offers only grinds that fit the roast (moka and espresso
  grind on espresso roasts); George Howell sells a «Mocha Pot» grind; Verve a «Coarse (French Press)».
- Taste drawn on the card is rare: George Howell's palette bars (roast colour + "how much coffee taste" + note colours).
- No roaster has a 2-D taste map.

**Other taste products:** Diageo's whisky flavour map (light–rich × delicate–smoky) was a printed trade tool; Master of
Malt, the one shop that uses it online, turned it into five linked flavour groups. The only "select a region" found is
a mouse-drag student prototype. Patterns worth borrowing: 5–8 named taste groups with a mood line and an example
(Beerwulf, MECCA, Dandelion), overlapping lists that group rather than hide (Bellocq), the same 2–4 spectra on every
card (Vivino, Beerwulf), occasion as a second way in (Mariage Frères, Tea Forté), novice/expert entries (Bellocq).
Avoid: a flat list of ~60 taste words (Winestyle), prose-only taste, empty group blocks (Dan Murphy's "Showing 0").

## What the research says (UX)
- Filtering a handful of products is "largely pointless" (Baymard, over-categorization: categories of ~10–30 should be
  filters, not pages). Faceted search pays off for large sets (NN/g).
- Thematic filters (style, usage) get heavy use, often above 50% where they exist (Baymard, 19 sites tested). Promoted
  chips above the list: few, each with its count, and repeated in the full panel; on a phone 2–3 fit a line (Baymard).
- Counts on options are rated Essential (Baymard 467). Never a blank result; offer the nearest products (Baymard,
  no-results; NN/g, empty states).
- Local data updates instantly, so chips apply at once; an Apply button only for multi-select panels (NN/g).
- An applied-filter row with × and «Сбросить всё» (Baymard: 28% of sites lack one).
- Sorting keeps everything visible and suits people who are unsure or fear excluding good products (Baymard).
- Cards: position on a common scale is read most accurately (Cleveland & McGill 1986); show 1–3 attributes; a graphic
  needs 3:1 contrast or a text equivalent (WCAG 1.4.11).
- A map as a way in: in Kagie et al. (71 students, MP3 players) a map-based shop gave equal satisfaction, took a little
  longer, felt "more fun" and gave "a better overview"; some missed hard filters. Chart literacy is weak (Börner et al.,
  273 museum visitors). So: a map is an overview and a second way in, labelled in words, never the only one.
- Dimming non-matches instead of hiding them: no controlled study found. Lifting matches to the top and keeping the
  rest below a line, in words, is the safer form of the same idea.

## So, for 25 coffees
- **Keep:** the fork by method (as a first-level choice that sets roast and grind, not as a narrowing), a few scenario
  chips with counts, one taste filter (acidity) and taste groups, scales on cards (2–3 axes), sorting, an applied row
  with ×, a reset.
- **Change:** nothing is hidden; a choice lifts its matches, then the nearest misses with what they miss, then the
  rest. Never «Ничего не нашлось».
- **Drop or demote:** country, processing, type and line one tap away; no variety, farm, score or bag-size filters; no
  «Горечь»; no long note lists.
- **New, where no shop is:** the taste map as an overview that lights what a chip finds and lets a region be picked.

Sources (the agents' reports, with every URL, are in the session's workspace): Baymard (baymard.com/blog/ecommerce-over-
categorization, /promoting-product-filters, /how-to-design-applied-filters, /no-results-page, /category-specific-sorting,
/product-listing-information; guideline 467), NN/g (filters-vs-facets, applying-filters, mobile-faceted-search,
empty-state-interface-design), Smashing Magazine 2015 (Baymard's state of e-commerce filtering), Kagie et al. (repub.eur.nl
/pub/14115), Cleveland & McGill 1986, WCAG 2.2 1.4.11; the shops' catalogues as named above.
