# The feedback after delivery: what a backend needs (decisions for Tim)

Session 6 of choosing coffee built the loop in the account with a **placeholder visitor** (data/account.json:
`feedback`, `today`), answers kept in this browser (localStorage `qq-feedback`), and nothing sent. This note lists what
a shop's backend must do to make it real, and the decisions only QQ can make. It names no vendor. It goes with
`docs/people-backend.md` (the stories on a coffee's page) and `docs/quiz.md` («what a backend must keep»): one account,
one store of answers.

## 1. What to store

- **The answer**, one per bag per kind (a taste answer and a «не про вкус» about the same bag are two; a later one of
  the same kind replaces the earlier, keeping the history). Fields:
  - account, order, coffee (slug, and the green lot, so a relabel counts for its coffee), the roast and grind bought;
  - date, channel (account · letter · pack card), days since delivery;
  - method (one of `data/choose.json`'s eight), milk;
  - `bright`, `body`, `unusual`: `less` | `ok` | `more`, or empty;
  - `issue`: `grind` (with `need`: `beans` | `ground` | `bags`) or `described`, with optional text.
  - **Never a score.** Store the taps, not a number made of them: the weights are the model's and will change.
- **The visitor's region is derived, not stored as truth.** Recompute it with `replay()` (src/scripts/feedback.js)
  from the start (quiz or first order) through every answer, whenever an answer arrives or the model changes. Cache it
  per account if needed (`{ center, spread }` on three axes).
- **What was offered next, and what was bought from it:** the three cards with their labels (move, «Снова», «Похожий»,
  «По вашему вкусу»), the order that followed, and which card it came from. This is the only way to learn whether the
  loop works. Log it from day one: QQ's traffic is too low for A/B tests for months.
- **The grind need:** the latest `need` per account sets the grind on the next cards and in the bag
  (`setFor()`); show it in the account's settings later, so it can be changed there.

## 2. When to ask, and how

- **The account:** the order page asks from day 4 (filter) / 7 (espresso) after delivery. The front already does this
  from the order's `delivered` date (`askState()`); the backend gives the real date.
- **The letter** (the backend sends it):
  - day 7 after delivery for filter, day 10 for espresso (an order of both: the later);
  - one reminder 7 days later, only if nothing was answered;
  - none for orders older than 30 days, and none to someone who turned the letters off.
  - **Subject:** «Как вам {coffee}?»
  - **Body:** one line, then for each coffee **its name and the three buttons of «Кислинка»** («Слишком ярко · В самый
    раз · Хочу ярче»). Each button is a link:
    `https://qqcoffee.ru/account/orders/<id>/?fb=<slug>&bright=<less|ok|more>#fb-<id>-<slug>`.
    The page opens the order with that answer already tapped; the visitor adds «Плотность» and «Готово». (A field test
    of ~8,700 emails: the first question inside the email got 32% to start against 26% for a link.)
  - The link must sign the visitor in, or keep the answer until they do: a one-time token in the address, not a password.
  - A footer line: «Ответ меняет только ваши следующие подборки. Отписаться от таких писем».
- **The pack:** a small printed card in the box (not on the bag):
  - «Как вам кофе? Через неделю спросим в письме — или ответьте сейчас:» and a QR to `qqcoffee.ru/account/orders/`.
  - No per-order printing is needed.
  - A test, not a channel: count the visits from it (a `?from=card` mark) and keep it only if people use it.
- **Which channel:** QQ decides whether to send the letter at all («Получение писем» in the settings has «Новые сорта»,
  «Скидки», «Новые статьи»; this would be a fourth, «Как вам кофе?», on by default for new buyers?). *Recommended:* on by
  default, one letter and one reminder per order, never more.

## 3. Decisions for Tim / QQ

Each has my recommendation first.

1. **The letter:** send it (day 7 / 10, one reminder)? *Recommended:* yes; it is where most answers will come from.
2. **The pack card:** print it? *Recommended:* yes as a test for two months, generic, with a QR to the orders.
3. **Who sees what:** the answers are the visitor's own, used for their own suggestions. Are they also shown, counted,
   on a coffee's page («Впечатления»)? *Recommended:* only when the visitor also writes words and agrees to publish
   («Рассказать на странице кофе»), as session 5 decided: taps alone are never printed.
4. **«Не как в описании»:** to the roaster. **≥ 8 agreeing** on one coffee put it on the Notion fixes list (the taste
   model's rule). «Помол не подошёл»: to support, who may replace the bag.
5. **One form for both:** the coffee page's «Поделиться впечатлениями» (session 5) still asks «против того, что вы
   обычно пьёте» with «ярковато / хотелось ярче». *Recommended:* once accounts exist, a buyer's «Поделиться» opens this
   order form, and the words become one set (`data/feedback.json` axes). A visitor who didn't buy writes only words.
6. **Incentives:** *Recommended:* none for the taps. If beans are given, the same for any answer, and said so.
7. **Personal data:** the answers are taste preferences tied to an account; they are personal data under 152-ФЗ. Say in
   the privacy policy that they are kept to pick coffee for the visitor; delete them with the account.
8. **Questions the simulation raised** (design/questions.json):
   - `feedback-bitter`: a fourth row about bitterness?
   - `feedback-edge`: is «Плотнее, чем Q-Optimistic, у нас нет…» acceptable in the account, where a silence would read as
     not listening (on the coffee page Tim chose no «у QQ нет» sentences)?
   - QQ's drip bags, and whether the quiz should ask «мелете сами?».

## 4. What changes in the code when it exists

- `data/account.json`'s `feedback`, `today` and orders go; `account-data.mjs` reads the signed-in visitor's orders and
  answers.
- `scripts/feedbackpage.js`: «Готово» posts the answer, then redraws from the server's state; `qq-feedback` stays as a
  cache for the coffee pages (or the backend writes the visitor's region into the page).
- The quiz's region (qq-taste) moves to the account (docs/quiz.md).
- Logging: answers, channel, the cards offered after each answer and which was bought.
