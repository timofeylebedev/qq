# People on a coffee's page: what a backend needs (decisions for Tim)

Session 5 of choosing coffee built the front of reviews and named picks with **placeholder people**
(`data/people.json` → `build/people.mjs` → `src/data/people.json`). There is no shop behind the site yet, so nobody can
write a real review. This note lists what a backend must do and the decisions only QQ can make. It names no vendor:
any shop platform, a review service or a small database of QQ's own can do this, and the choice depends on the shop,
which is not chosen yet.

## 1. What the front expects (the data model)

The page already reads these shapes; a backend has to produce them (`build/people.mjs` documents the fields).

- **Reviewer's profile** (asked once, saved, shown on each of their reviews): first name + initial of the surname, city
  (optional), **how they usually brew** (one of 9 methods), milk or not, and **what they usually drink** (a QQ coffee or
  one of four styles). The page places the reviewer on the taste map from that. The usual coffee is never the coffee
  being reviewed (the form leaves it out of the list): the answers are «against what you usually drink». The profile's
  method only prefills the review's; the method of the review is what counts.
- **Review** (one per person per coffee; a later bag updates it, and its author can edit or delete it): date, how
  this coffee was brewed, milk, the two **direction answers** against expectation (кислотность: ярковато / в самый раз /
  хотелось ярче; плотность: тяжеловато / в самый раз / хотелось плотнее; both required), the notes heard (from the
  coffee's own descriptors), after how many cups (1–2 / 3–5 / 6+), optional text («Пара слов о кофе»), whether it is a
  verified purchase, and QQ's reply if there is one.
- **Not about taste** (kept out of the counts): «помол не подошёл», «не как в описании», each with text and QQ's reply.
- **Named person**: name, kind (QQ's team or ambassador), status, where, how they drink, a line about their taste, what
  they usually like and **one coffee they don't take** (with why), a disclosure of how they relate to QQ (`tie`: the
  build fails for a real ambassador without one), a date. A team pick today is only what Notion says: the tag
  «Выбор <имя>» and its text.
- **Pick**: person, coffee, why (≤ 200 characters, in their words), their recipe, date.
- **QQ's reply**: under an issue or a review, signed (the page shows both; the placeholders have one of each).

The same review answers are the feedback after delivery of session 6: one form, written from the order (account →
«Заказы») a few cups after delivery. Every answer is stored on the taste model's axes.

## 2. Decisions for Tim / QQ

Each has my recommendation first.

1. **Who may write.**
   - *Recommended:* only buyers. The review is opened from the order (the account and an email a week after delivery),
     so every review is a verified purchase and the brew method can be prefilled from the grind ordered.
   - *Alternative:* anyone, with unverified reviews marked and **left out of the counts**. Café and gift drinkers would
     count then, but the counts lose their meaning at QQ's volumes.
2. **Moderation.**
   - *Recommended:* QQ reads every review before it appears (expect a handful a week; publish within 2 working days).
   - **Publish everything about the coffee, critical ones included.** Remove only personal data of others, insults,
     advertising, off-topic text, and reviews not from a buyer. Readers stop trusting a page with no critical reviews
     (Baymard). The platform-economy law (289-ФЗ; its date and reach to check with a
     lawyer) forbids marketplaces to delete critical reviews; the same rule makes sense on QQ's own site anyway.
   - The rule goes on a public page («Как мы публикуем отзывы»), linked from the block.
   - Who moderates: a named person at QQ, and who stands in for them.
3. **Replies from QQ.**
   - *Recommended:* reply to every «не про вкус» issue (grind, not as described) and to reviews with a question. Sign
     the reply «— QQ» or with a name. Don't reply to every review with a template.
   - «Помол не подошёл» goes to support (replace the bag?). «Не как в описании» goes to the roaster. The taste model's
     rule applies: ≥ 8 agreeing «не как в описании» put the coffee on the Notion fixes list.
4. **How ambassadors are added.**
   - *Recommended:* QQ **appoints** them; the title is never earned by a number of reviews (Vivino's «Ambassador» is a
     count level; ours is a person).
   - Who: people whose taste is readable and differs from one another. A barista of a partner café, a home brewer, a
     pastry chef, a champion, rather than five people with the same palate. Each should cover a different region of
     the taste map, so a visitor can find one close to them.
   - What each gives, with written consent: name and photo (optional), status, how they drink, 3–5 picks with why and
     a recipe, one coffee they don't take, and the **disclosure** of how they relate to QQ («получает кофе бесплатно»,
     «работает в кофейне-партнёре», «не связан с QQ»).
   - Picks are theirs: QQ edits only facts. Each is dated. Review the list twice a year. When someone leaves, their
     picks leave the page.
   - Ambassadors may also write ordinary reviews of other coffees; those count like anyone's.
5. **Advertising law (check with a lawyer).**
   - Picks in a separate block on QQ's own product page are most likely not advertising (FAS: reviews and assortment
     information on a seller's own page are not, unless they single out one product as a promotion).
   - A banner «Выбор амбассадора» on the home page might be advertising.
   - Ambassadors' own posts about QQ in social networks are internet advertising when paid or bartered: «Реклама», the
     advertiser and an erid through an ОРД. The contract should say who marks them.
6. **Personal data.**
   - Publishing a name and a taste profile needs consent to make the data public (152-ФЗ, ст. 10.1): a checkbox in the
     form, with the text of the consent.
   - Show the first name and the initial of the surname, never the full name or the e-mail. The city is optional.
   - Delete a review or a profile on request.
7. **Incentives.**
   - *Recommended:* none. Rewards inflate reviews even when disclosed.
   - If QQ wants to thank reviewers (beans of the account), give the same reward whatever the answers and say so above
     the reviews («за каждый отзыв — N зёрнышек, каким бы он ни был»).
8. **QQ's team picks** («Выбор Ксюши» today).
   - Keep them in Notion (tag «Выбор <имя>» + «Комментарий к тегу») or move them to the same store as ambassadors.
     *Recommended:* the same store, so a team pick gets a status, a date and a recipe like any other.
   - Who Ксюша is, for the label: today the page says «Команда QQ».
9. **How the static site gets the reviews.**
   - *Recommended:* at build time. The backend calls the site's rebuild when a review is published (and once a night).
     The page then needs no script to show reviews, stays fast, works without JavaScript and keeps the strict CSP.
     Only sending a review needs the backend's address on the page.
   - *Alternative:* the page fetches reviews in the browser. Fresher, but slower, adds an address to the CSP, and search
     engines may not see them.
10. **One more answer?**
    - Research on wine, perfume and coffee sites recommends a third, verbal answer: «возьму ещё / рад(а), что
      попробовал(а) / не моё». It catches a coffee that is «в самый раз» on both axes but still not liked.
    - I left it out, because counted it becomes a rating again, and Tim decided against ratings. Say if you want it as
      an optional answer shown only inside each review, never counted at the top.

## 3. What changes in the code when it exists

- `build/people.mjs` reads the store instead of `data/people.json`; everything after reading (counts by direction,
  split by brew, notes heard, picks) stays.
- `placeholder: false` on the data removes the «Пример» marks on the page; `data/people.json` is deleted.
- The form's «Отправить» posts to the backend (today it checks the required answers, then says in a toast that reviews
  are not sent yet).
- Spam: one review per person per coffee, a limit on attempts, sending only from a signed-in account or a link from
  the order e-mail.
- Logging from day one: which brew filter readers choose, opened reviews, clicks on picks (QQ's traffic is too low for
  A/B tests for months).
