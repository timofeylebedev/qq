# Independent review: the feedback after delivery (session 6), branch `claude/feedback`

Reviewed: `git diff HEAD~1` against CLAUDE.md. Ran `npm run build`, `npm run check` (passes), `npm run rules` (only the
known `tokens-wired` failure with 3 tokens, as on main) and Node scripts on `src/scripts/feedback.js` and
`feedbackview.js`: 4,000 random multi-answer histories with and without a quiz base, no exceptions, no NaN, no
duplicates, no tried coffee offered as new. I also ran Playwright against `dist/` (vite preview), with and without JS,
at 320 and 390 px, and with localStorage throwing. No files were edited. The scratch scripts are in /home/claude/work/.

## Findings, most important first

### 1. important: every «Не про вкус» group has an empty extra radio, `value="$about"`, and choosing it breaks the save
`src/templates/account.mjs:369` (`Object.entries(F.rules.issues)`), caused by `build/feedback.mjs:32` (`issues: R.issues` is
not passed through `strip()`, unlike `ask`, `weights` and the rest).
- **Effect:** every form shows an empty pill before «Помол не подошёл» (screenshot at 390 px). It is a radio with no
  name to read out.
- **Failure:** tap the empty pill, then «Готово». The page shows «Вы сказали: «».». `keep()` then throws in `mineOf`
  ("Cannot read properties of undefined (reading 'toLowerCase')", `feedbackview.js:95`), so nothing is saved.
  `purchaseOf` also writes an empty line.
- **Fix:** `issues: strip(R.issues)` in the build. Iterating `Object.entries(F.rules.issues)` is also safe if it filters
  out keys that start with `$`. Add a build check that every issue has a `label` and a `reply`.

### 2. important: for a fermented coffee, «Не про вкус» cannot be sent
`src/scripts/feedbackpage.js:109-113`. `taste()` clears `required` only on `bright` and `body`. The «Необычность» row is
also `required` (`axes.unusual.need: true`).
- **Failure:** a fresh form for a coffee with `position.unusual ≥ 0.9` (Peru Monte Verde, order 430411, with the taps
  cleared): open «Не про вкус», choose «Не как в описании», press «Готово». The browser stops on «Необычность»: «Please
  select one of these options». Nothing is saved.
- **Fix:** select `input[name="bright"], input[name="body"], input[name="unusual"]`. Simpler: every row's `[required]`
  radio.

### 3. important: an answer cannot be changed from taste to «Не про вкус», and the issue's reply is never shown
`src/scripts/feedbackpage.js:125-135`, `feedbackview.js:29`.
- **Cause:**
  - the radios cannot be cleared;
  - after «Изменить ответ» the earlier taps are still checked;
  - the issue radio cannot be unchecked either;
  - so a submit with an issue always stores the old taste answer again (the `issue && (a.bright || a.body)` branch);
  - `byKey` prefers the taste answer.
- **Failure (measured):** answer Колумбия Антиокия «слишком ярко», then «Изменить ответ», then «Не как в описании»,
  then «Готово». The reply still says «Вы сказали: «слишком ярко». Ваш вкус сдвинулся: мягче…». The taste answer still
  moves the visitor. «Передали обжарщику…» never appears. `local` now holds the taste answer twice and the issue once.
  The reverse also fails: once an issue is tapped, it cannot be withdrawn without a reload.
- **Fix:** give each row and the issue group a way to clear (a «Сбросить» link, or radios that toggle off on a second
  tap). When the submit has an issue and no taste taps *changed* in this edit, drop the earlier taste answer of that bag.
  At the least, show both replies (the issue's line under the taste reply).

### 4. important: after a reload, «Изменить ответ» shows the page's taps, not this browser's answer
`src/scripts/feedbackpage.js:116-121`, `account.mjs:358,365`. The static form is checked from the placeholder's answer,
or left empty. `drawForms()` never writes this browser's answer back into the inputs.
- **Failure (measured):** answer «слишком ярко / в самый раз», reload, then «Изменить ответ». Nothing is checked; only
  the method and milk are set. For a coffee the placeholder answered (e.g. Q-Optimistic), the form shows Марк's taps,
  not the visitor's own edit.
- **Fix:** when editing starts, set every input from `S.byKey.get(key)` (the taste answer and the issue answer), so the
  form always shows what the reply says.

### 5. important: «Вы брали его в августе» uses the date of the answer, not of the purchase
`src/scripts/feedbackview.js:91-95`. `when` is `a.at`.
- **Failure:** the built pages already say it.
  - `dist/coffee/ruanda-gitsumbi/` reads «Вы брали его в августе и сказали «хочу плотнее».», but order 430954 is of
    24 July (delivered 28 July).
  - `coffee/q-finch/` says the same of «помол не подошёл» for that order.
  - Every answer given in the browser today about an August order reads «в ноябре».
- **Fix:** pass the orders (or a `dateOf(order)`) to `mineOf`, and use the order's `date` (or `delivered`). The template
  (`product.mjs:61`) and `feedbackpage.js:33` both have `acc.orders`.

### 6. important: with a method the coffee is not roasted for, «в самый раз» promises cards that aren't there
`src/scripts/feedback.js:175-188` (`mode: "again"`), and the build's coverage at `build/feedback.mjs:113`.
- **Cause:** the form offers all eight methods, but the build checks only `methodsOf(L)`, the methods QQ roasts L for.
  When the method excludes L, `pool` excludes L too: no «Снова» card is added, yet the lead still says «Возьмите его
  снова».
- **Failure:** Q-Optimistic brewed in a pour-over, aeropress or drip, «в самый раз» on both rows (half weight). The lead
  reads «Q-Optimistic: вы сказали «в самый раз». Возьмите его снова. Похожего… — вот что ещё по вашему вкусу:» and
  there are **zero** cards. The browser also hits Q-Punch with aeropress. Over the 594 answers with a method the coffee
  isn't roasted for:
  - 9 offer nothing in «again» mode;
  - 36 say «Возьмите его снова» with no such card;
  - 183 end in an empty «edge».
- **Fix:**
  - run the build's loop over every method (`Object.keys(F.methods)`), not `methodsOf(L)`, so it fails on these;
  - in «again» mode, when `!pool.includes(L)`, say how to get it again (its own roast) or drop «Возьмите его снова»;
  - fall back to `finishFit` without `okNear` before returning nothing.

### 7. important: a letter's link reopens the form on every reload, over the saved answer
`src/scripts/feedbackpage.js:144-151`. `?fb=` sets `data-editing` without checking whether that bag is already
answered, and the query stays in the address after «Готово».
- **Failure:** open `…/orders/432112/?fb=efiopiya-bekele&bright=less#fb-…`, answer, then reload (or come back from the
  history). The form opens again in place of the reply. Only the letter's «Слишком ярко» is tapped, so the visitor reads
  it as «not saved».
- **Fix:** after a successful submit, `history.replaceState(null, "", location.pathname + location.hash)`. Apply the
  prefill only when `!S.byKey.has(key)` (or when the letter's value differs).

### 8. nit: no `qq:layout` after «Следующий кофе» is redrawn
`src/scripts/feedbackpage.js:84-103`. `drawNext()` hides, shows and re-appends product cards that carry 3D packs: 22
packs on the profile, 19 of them hidden. CLAUDE.md says a change of layout dispatches `qq:layout`, and
cart/favs/filters/quizpage all do.
- **Failure:** with answers in `qq-feedback` or a quiz, the three cards differ from the static ones. If `packs.js`
  measured first (both are async imports), the new cards' packs start from stale slots.
- **Fix:** `dispatchEvent(new Event("qq:layout"))` at the end of `draw()`, as quizpage.js:166 does.

### 9. nit: the «Не про вкус» options are a radio group without a group name
`src/templates/account.mjs:369`. The issue radios sit in a bare `<div class="ropts">`, while the need group has a
`fieldset`/`legend`. A screen reader hears «Помол не подошёл, radio, 1 of 3» (3 because of finding 1) with no question.
- **Fix:** `<fieldset><legend class="sr">${W.otherSummary}</legend>…</fieldset>`.

### 10. nit: without JS, the form silently loses the answer
`account.mjs:352` (`action="#"`, GET). «Готово» reloads the page as `?method=…&bright=…#`, and nothing is kept.
«Изменить ответ» does nothing.
- **Fix:** render `[data-fb-ask]` and the edit button `hidden` until the script starts (or behind `html.js`), or say
  that answers need JavaScript. This matches the rest of the account, which is a placeholder, so it is low priority.

### 11. nit: the browser's redraw loses the typesetter's holds
`feedbackpage.js:38-43, 82, 87, 93-94`. With JS the text reads «Q-Berry» (no word joiner) where the static page has
«Q-⁠Berry». The reply's paragraphs are also joined without whitespace.
- **Effect:** the words are the same; line breaks can differ from the static page. The same limit applies wherever a
  script writes text (quizpage), so note it rather than fix it here.
- `replyHtml` is also written twice (`account.mjs:394` and `feedbackpage.js:38`). Move it into `feedbackview.js`, so
  the two cannot drift.

### 12. nit: an edit moves the answer to the end of the replay
`src/scripts/feedback.js:57-58`. The dedupe keeps the newest answer of a bag, then sorts by `at`. An edited July answer
is therefore replayed last: the region moves differently than if it had been replaced in place, and «Следующий кофе»
now leads with the July coffee. docs/feedback.md says «replaces the earlier one (an edit)», which reads as «in its
place».
- **Fix:** either keep the first answer's `at` for ordering (store `edited` apart), or say in the docs that an edit
  counts as the newest answer.

### 13. nit: the range limits are hard-coded and narrower than QQ's range
`src/scripts/feedback.js:19`. `LIMITS = { bright: [1, 4.6], body: [2, 5], unusual: [0, 3.3] }`, but the coffees run
bright 0.905–4.64 and unusual −0.11–3.51.
- **Failure:** «в самый раз» about the most fermented coffee (3.51) cannot bring the centre onto it. The comment says
  «inside QQ's range».
- **Fix:** derive the limits from `F.coffees` positions in the build (min/max of the coffees in stock), or move them to
  `data/feedback.json` with the other rules.

### 14. nit: a stale or partial saved region is not checked
`tastesaved.js:16-21,43`. `loadTaste`/`loadFeedback` check only `center`.
- **Failure:** a `qq-taste` without `spread` makes `baseRegion` return `spread: {}`, and every later spread is NaN
  (measured). `loadFeedback` accepts `answers: [null]`, which throws in `stateOf` (`key(null)`) and stops the whole
  account script.
- **Also:** `qq-feedback.region` is written only on submit. If the quiz is retaken later, coffee pages keep the old
  region.
- **Fix:** validate `spread` too, and filter answers to objects with `order`/`slug`. Recompute the region on the coffee
  page from the answers plus the quiz, or save it again in `initFeedback()`.

### 15. nit: `scrollIntoView` in new code
`feedbackpage.js:150`. CLAUDE.md says new code does not scroll the window and uses `scroller.js`. The hash already
brings the form into view, and scroll.js restores a reload's place.
- **Fix:** drop it, or use `to()` from scroller.js.

### 16. nit: the docs and data disagree with the code
- `data/feedback.json` `methodFromGrind.$about` says beans fall back to «the visitor's last method (an earlier answer,
  then the quiz) … else nothing is chosen». `methodFor` never reads the quiz and falls back to `methodFromRoast`.
  docs/feedback.md has it right.
- docs/feedback.md, «How the site shows it listened», quotes «Учли: ваш вкус сдвинулся мягче.». The word is
  `moved` = «Ваш вкус сдвинулся: {where}.», which gives «Ваш вкус сдвинулся: мягче.».
- docs/feedback.md, «Checks», says «~5,000 in all». docs/feedback-output.md says 4,284. It also writes «nothing … at
  all (the lead alone, at QQ's corner) 640», but those 640 (15 % of answers, no card at all) are not only QQ's corner.
  Worth saying plainly to Tim.
- `build/feedback.mjs:67-69` still knows a role `closest` («Ближе всего — он сам») that `nextOf` no longer makes.
- `account-data.mjs feedback()` computes `next`, `name`, `area`, `trail`, `lastMilk` that nothing reads (the templates
  use `stateOf`). Its own `lastMethod` takes the last answer by array order, while `stateOf` sorts by `at`. Two state
  computations can drift: keep one.

### 17. nit: a «Помол не подошёл» answer still sets the method, and its grind, for the next cards
`feedbackview.js:24-26`, `feedback.js setFor`.
- **Cause:** `opts.method` is the newest answer with a method, including an issue answer.
- **Failure:** the placeholder's last answer is q-finch, «Помол не подошёл», brewed in a turka. The profile's three
  cards therefore link `?grind=Турка`, and «Снова» offers q-finch again in the same Турка grind he said didn't fit. The
  order 432112 form also starts a filter-roast bean on «Турка» with milk.
- **Fix:** take the method and milk from the newest *taste* answer. After a grind issue with no `need`, don't offer that
  coffee's failed grind again (or ask `need` as required).

## What is fine
- **Arithmetic:**
  - `update()`'s new guard (never against the answer) holds;
  - the half weight scales both the move and the narrowing exactly (`(full/region)^w`), and the build checks it;
  - the clamp only stops movement past a limit and never pushes;
  - the replay keys (`order/slug/kind`) keep a taste answer and an issue about one bag apart, and both the replay and
    `stateOf` keep the newest of a kind;
  - «не про вкус» never moves anything (`isTaste`);
  - the quiz region is used as the base when there is one;
  - an empty history gives mode `none` with three cards and «набросок по первому заказу»;
  - 4,000 random histories gave no crash, NaN, duplicate, or tried coffee offered as new.
- **Static page vs browser:** with no saved answers, the profile, the orders list, purchases, every order page and the
  coffee pages say the same words, name the same three picks and give the same links. The only differences are the
  typesetter's joiners and whitespace (finding 11). Links are relative and agree: `href(ctx, …)` and `data-root` give
  `../../../coffee/…/` on an order page.
- **Escaping:** everything put into `innerHTML` goes through `esc()`. Only slugs and order ids from the build's own
  data go unescaped into `href`.
- **CSP:** no inline script; the only `style=` is `--n: 3`, as elsewhere.
- **Focus:** «Готово» moves focus to the reply (`tabindex="-1"`, via `focusFrom`); «Изменить ответ» moves it to the
  method select via `focusFrom`.
- **localStorage that throws:** the page still answers and redraws, with no errors (it just keeps nothing).
- **Layout and targets:** 44 px seg cells, no sideways scroll at 320 px, html-validate clean.
- **Rules:** no new rounded corners or hover moves; colours are tokens. `src/data/feedback.json` is ignored and
  `docs/feedback-output.md` is reproducible (the build leaves no diff).
