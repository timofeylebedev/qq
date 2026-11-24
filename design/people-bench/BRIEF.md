# Brief for a form of the people bench (session 5 of choosing coffee)

You draw ONE form of the "people" part of a coffee's page on the QQ Coffee site (a Russian specialty roaster, 25
coffees, no shop backend yet). All text on the form is **Russian**. The form is compared side by side with other forms
on a bench for Tim (the owner), who picks one to build on the site.

## What the page needs (marketing's row 19 + Tim)
1. **Reviews**, with **a link to them from the top of the page** (under the coffee's name).
2. **A way to write your own review.**
3. **Recommendations from QQ's ambassadors**, with the author and their status, **kept visibly apart from customers' reviews.**
- **No star rating, no score, no average, no percent match.** Tim decided.
- Goal: the best version of other people helping you choose. Without stars, a review is useful when the reader can tell
  whether this person's taste and cup are like theirs.

## What a review is here (data: QQ_DATA.pages[slug].reviews; see kit.js for every field)
- **The cup:** how it was brewed (method), with milk or not, and **what the reviewer usually drinks** (a QQ coffee or a
  style, plus `likes` words like «яркое, лёгкое»). This is the reviewer's reference point.
- **Direction against expectation, per axis** (not "liked it"): `answers.bright` less/ok/more = «ярковато / в самый раз /
  хотелось ярче»; `answers.body` = «тяжеловато / в самый раз / хотелось плотнее» (words in `people.answers`).
- **Notes heard:** which of the coffee's descriptors they recognised (`heard`).
- Optional text (some reviews have none: taps only), date, «Купил(а) у QQ» when `verified`, after how many cups (`cups`).
- **Issues** are not taste: «помол не подошёл» (`grind`) and «не как в описании» (`described`) are kept apart from the
  counts, with QQ's reply.
- **Summary = counts in direction terms, never an average:** «9 отзывов: 5 — в самый раз, 4 — ярковато». Split by how
  people brew (`groups`: espresso / pot (турка и гейзер) / filter / milk), because the brew changes acidity as much as
  the bean. Notes heard as counts («Молочный шоколад — 4 из 9»).

## Named people (QQ_DATA.people.named; the coffee's picks: pages[slug].picks)
- Ambassadors are **named tastes**, not authority: name, status, where, how they drink, a short `about`, what they
  usually like (`likes`, `pos` on the taste map), all their picks (`picks`), and one coffee they **don't** take with why
  (`not`: a taste reads by its no as well as its yes). A pick on this page has `why` (≤ ~200 chars) and `recipe`.
- **«Выбор Ксюши» is the one REAL pick** (Санта Мария; kind "team", status «QQ Coffee»; no position, no recipe). Ксюша is
  probably not an ambassador: show her as QQ's team, not as an ambassador. Everything else is a placeholder.
- When the visitor's taste is known (ctx.visitor.region), you may say in words how close a person's taste is
  (`kit.near`: близко / отчасти / далеко, `kit.shared`: what they share). Never a percent.
- Ambassadors must stay visibly apart from customers (own place, own look, a label). Paid relations will need a
  «Реклама» label by Russian law: leave room for a one-line disclosure of how the person relates to QQ.

## Research (summary; use it)
- Wang, Ramachandran & Sheng 2021: a fit verdict alone helps only when reviewers agree; with few or mixed reviews what
  helps is the verdict **plus the reviewer's own reference** (their size → for us: method, milk, usual coffee).
- Gershoff et al. 2003/2007: people follow a recommender whose **loves** match theirs; shared dislikes matter less.
  Gilbert et al. 2009: one similar person's report predicts enjoyment better than a description.
- Zappos/Baymard: an aggregate bar for fit + the answer on each review that corroborates it. Bazaarvoice: a slider where
  no answer is better than another. StoryGraph: structured answers summed per book; users asked to filter by format.
- Vivino: taste bars from the crowd + flavour mentions with counts. Naked Wines: three-way answer, the maker replies.
- Bookshop shelf talkers: ≤50 words, signed, written as you'd say it, «I recommend if you…»; the best state their own
  biases («things I'm against»); a page per person; picks with no reason are worthless; date them.
- Bandcamp «supported by»: buyers' own one-line comments with their collection as identity. Last.fm/Spotify Blend:
  closeness in words with the reason (shared artists); a percent breaks trust when it jumps.
- Small numbers: 0 reviews → no empty widget, an invitation («Пили? Расскажите, как заваривали»); 1 → one person's
  story, no summary; 2–9 → counts in words with method beside each answer; 10+ → a bar is fine. Never percents at small n.
- Review form: method first (required), the direction answer (required), then milk, notes heard, «что понравилось /
  что бы поменяли» text, «обычно пью…» once (saved to the profile), name/city optional. Ask after a few cups.
  Not about taste: «помол не подошёл» and «не как в описании» as separate answers.

## The site's look (base.css has the tokens; follow the grammar)
- Grounds paper (white), cloud (#f6f6f6), black, ink (#2d2f33). PT Mono Bold capitals for names and headings, Apercu for
  text. Secondary text `--c-ink-70`. **No rounded corners** except pills and dots. Cells divided by hairlines
  (`1px solid var(--line)`). One accent: lavender (`--c-lavender` on dark, `--c-lavender-ink` on light; the site already
  uses lavender capitals for the move labels of «Что взять еще»). A hover tints only its own item (`--tint`) and never
  moves anything. Taste descriptors are pills with a coloured dot.
- The stage is the content column: `container: col / inline-size`; the site's steps are `@container col (width >= 22rem)`
  (S), `43rem` (M), `58rem` (L). Check your form at 360, 768 and 1280.
- **Mark placeholder content** with `kit.placeholder()` (a dashed lavender pill «Пример: настоящих отзывов ещё нет») once
  per block, and mark invented ambassadors as examples. The real «Выбор Ксюши» is not marked.

## Your files
- `design/people-bench/forms/<id>.js` and `<id>.css`. Prefix every class with `f-<id>-`. No global styles beyond your
  prefix. Plain browser JS (an IIFE), no libraries, no network.
- Register: `QQBench.register({ id, name, idea, notes, top(root, ctx), render(root, ctx), write(root, ctx) })`
  - `name`: the form's Russian name; `idea`: 1–2 sentences, Russian, what makes it different; `notes`: what it costs.
  - `top`: the link under the coffee's name (e.g. «9 отзывов · Выбор Ксюши» → #people). Keep it to one line.
  - `render`: the block. Interactive parts (filters, tabs, a dot to tap) must work in the bench.
  - `write`: the way to write a review, drawn open (as it looks after tapping «Написать отзыв»), working (taps select;
    a submit shows what would be sent, no network). Show the reviewer's profile part («обычно пью…») as saved/prefilled
    when ctx.visitor is known.
  - `ctx = { coffee, page, visitor, width, kit, uid }`; `uid` is unique per stage: use it for ids and radio names.
- Build: `cd /home/claude/qq && node build/taste.mjs && node build/people.mjs && node design/people-bench/build.mjs`,
  then open `design/people-bench/out/index.html` in Chromium (Playwright at
  `/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`, e.g. `file://` URL with `#c=braziliya-santa-mariya&v=none&w=all`)
  and look at screenshots at 360/768/1280 for: Санта Мария (9 + Ксюша), q-optimistic (8, issue), kolumbiya-vush-vush (0
  reviews, an ambassador), kolumbiya-chayna-alta (nobody), keniya-kisii (1), and with visitor "milk" and "filter".
  No sideways scroll inside the stage; no text cut off; nothing overlapping.
- Do not touch other files (other forms are being written at the same time). Do not commit.
- Report back (≤300 words): what the form is, what it costs, what you'd change, screenshots' paths.
