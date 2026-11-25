# Coffee-selection quizzes: Russian roasters and shops

Research for QQ Coffee's quiz «Выбрать кофе за минуту». Checked 25 November 2026.

**How this was checked.** Most quizzes are JavaScript widgets. For each one I read the code (Nuxt, Next.js, Vue or plain JS bundles), or I called the quiz's own endpoint with test answers and recorded what came back. The endpoints were:
- Tasty Coffee catalogue API
- Notik Bitrix action
- Welder Catherine form POST
- Coffee Project GET form
- Millor `/api/quiz/match`
- Eastbrew's Marquiz JSON

Anything marked **VERIFIED** I saw in live code or live responses. Anything marked **UNVERIFIED** I could not see myself. I could not use the Wayback Machine: the proxy reset the connection and WebFetch does not allow it. Ozon and Yandex Market returned captchas.

**Name clash, read this first.** Tasty Coffee already uses the exact name **«Выбрать кофе за минуту»**: it is the H1, the catalogue button and the chat button. Coffee Project titles its page «Подобрать кофе за минуту: тест». If QQ keeps this name, it will look copied from the market leader.

---

## Overview

| # | Shop (city) | URL | Steps | Result | "Don't know" | Back | Empty result |
|---|---|---|---|---|---|---|---|
| 1 | Tasty Coffee (Izhevsk) | shop.tastycoffee.ru/coffee-quiz | 3 | Filtered catalogue, **0–71 items** | no | yes | yes («Ничего не нашлось») |
| 2 | The Welder Catherine / «Сварщица» (Moscow) | theweldercatherine.ru/neworder/ | 3 | Catalogue grid, 4 per page, up to ~45 items | no | yes | **14 of 36 test combinations** («С такими параметрами кофе нет.») |
| 3 | Coffee Project (Yekaterinburg) | coffeeproject.ru/quiz | 5 | **3 coffees, each with reasons** | yes | yes | not seen |
| 4 | Millor Coffee (Kaliningrad) | millor-shop.ru/quiz | 5 | **3 coffees, each with a reason line** | yes | yes, plus editable answer chips | possible (has its own text) |
| 5 | Caffevita | caffevita.ru/#coffee-match | 4 | Always the top 3 by score | no | yes | only if the catalogue fails to load |
| 6 | Aruna Coffee (Barnaul) | widget on every page | 6 | 3 coffees: «Базовый / Интересный / Экспериментальный» | partly | yes | relaxes its filters instead |
| 7 | Gravitas | gravitas-coffee.shop/page/kak-vybrat-kofe | 4–5 | Up to 3, plus grind and pack-size advice, **B2B branch** | partly | yes | yes |
| 8 | Notik Coffee (Moscow) | notikcoffee.ru/quiz/ | 4 | 1–3 coffees (1 on most paths) | no | **no** | dead ends |
| 9 | Eastbrew Coffee | Marquiz popup on eastbrew.com | 5 | Content cards picked by rules, plus a promo code | yes | Marquiz default (UNVERIFIED) | UNVERIFIED |

Adjacent tools, not quizzes:
- EVADIA (1coffee.ru): AI chat consultant "Mia".
- Solo Coffee: B2B lead form.
- Лоботрясы and Ingresso: catalogue filters labelled «Подобрать кофе».
- Mikale: a quiz described in an agency case study but not found on the live site.

---

## 1. Tasty Coffee: «Выбрать кофе за минуту» (VERIFIED from code and API)

**URL:** https://shop.tastycoffee.ru/coffee-quiz

**Page text:**
- H1 «Выбрать кофе за минуту»
- Lead «Поможем выбрать подходящие сорта под ваши предпочтения и способ приготовления»
- Progress «1/3»

**Where it is entered:**
- the quiz page itself;
- a gradient tag button «Выбрать кофе за минуту» in the coffee catalogue's quick-filter row;
- a banner inside the catalogue grid with the text «Как выбрать кофе?» and «Ответьте на 3 вопроса, и мы подберем для вас кофе менее чем за минуту». It has the first question's buttons inline and is shown only to guests and to customers with no orders;
- a button in the online chat widget (it opens a modal);
- the mobile app.

**Questions, verbatim:**
1. «Какой кофе вы обычно пьете?»: «Черный» / «С молоком или сливками» / «Оба варианта»
2. «Как вы готовите кофе?» (11 options with icons): «Френч пресс», «Дрип-пакеты», «Турка», «В чашке», «Автоматическая кофемашина», «Капельная кофеварка», «Капсульная кофемашина», «Пуровер/воронка», «Рожковая кофеварка», «Гейзерная кофеварка», «Аэропресс».
   - The code folds these 11 options into 5 groups: alternative, drip, turka, espresso, capsule.
3. «Какой вкус предпочитаете?»: «Классический, сбалансированный и плотный» / «Яркий, фруктовый и сочный» / «Необычный и яркий (ферментированный)».
   - The third option is hidden after «С молоком».

**Answering:**
- Clicking an option moves straight to the next step.
- There is a «Назад» button.
- There is no «не знаю» and no skip.
- Answers are kept in a cookie for 24 h. There is no account save.

**Result:**
- The quiz redirects to the catalogue with a filter applied (`/coffee?methods=…&filters=…`).
- Above the grid it shows «Мы нашли то, что вам может понравиться», a share button («Посмотри эту подборку кофе») and, for guests only, «Дарим скидку на первый заказ 15% по промокоду: П15».
- There is no reason given for any coffee.

**List size.** I ran every one of the 38 combinations against the live API (combination → number of coffees):
- Black, or «Оба варианта» (the code maps both identically):
  - turka: classic 7, juicy **71**, special 12
  - espresso: 6 / 36 / 3
  - alternative brewers: classic **1**, juicy 39, special 9
  - drip bags: 12 / 9 / 8
  - capsules: 2 / 4 / **0**
- With milk:
  - turka and espresso: classic 6, juicy 21
  - alternative brewers: 1 / 19
  - drip bags: 9 / 31
  - capsules: 2 / 4
- Lists contain duplicates: the same coffee appears as several SKUs.
- Turka maps to both the espresso and filter catalogues, so turka + juicy returns 71 coffees.

**Empty result** (capsules + «Необычный»): the catalogue's generic «Ничего не нашлось». It says «Попробуйте сбросить фильтры или воспользуйтесь функцией быстрого выбора», which sends the user back to the quiz.

**Later use:**
- The 15% first-order coupon is the hook.
- The catalogue has a «Покупали ранее: Уже покупал(а) / Ещё не пробовал(а)» filter.
- The subscription is not linked to the quiz. It only offers «Получать каждый раз одни и те же сорта» or «новые сорта».
- B2B: none in the quiz. The catalogue sidebar links «Кофе в офис».

**Usage numbers:** none published.

**For a first-time buyer:**
- Strong:
  - very fast;
  - device-first questions with icons;
  - several entry points, and the banner targets people with no orders.
- Weak:
  - the result is a filtered list of up to 71 coffees, or 1, or 0;
  - no reasons are given;
  - "Black" and "both" give identical results;
  - three answers end with a single coffee;
  - one combination ends in an empty page.

## 2. The Welder Catherine («Сварщица»): «Давай выберем кофе вместе?» (VERIFIED by live POSTs)

svarshica.ru is now a SpaceWeb «Сайт недоступен» page; the roaster's real site is theweldercatherine.ru.

**URL:** https://theweldercatherine.ru/neworder/

**Where it is entered:** a block at the bottom of the menu page «Делаю заказ в первый раз». It is not on the home page or in the catalogue.

**Questions, verbatim. Every step has a default already selected, so three clicks on «Далее» give a result:**
1. «Как ты завариваешь кофе дома?»: «В турке» (preselected) / «В кофемашине» / «Фильтр»
2. «Кофе с молоком или черный?»: «С молоком» (preselected) / «Без»
3. «Какой предпочитаешь вкус?»
   - Instruction: «Выберите 1 или 2 значения из 3, с помощью ползунка настройте насыщенность».
   - Three checkboxes: «Кислый», «Сладкий» (pre-checked), «Горький».
   - Each has a **two-handle range slider**:
     - sour and sweet run 40–100, with defaults 60–100 and 70–100;
     - bitter runs 0–40, with a default of 35–50, which goes past its own maximum.
4. Final screen: «Выбирай кофе из предложенных и делай заказ!» with «Показать кофе» / «Вернутся к выбору» (sic).

**Answering:** «Назад» on every step; no «не знаю».

**Result:**
- Ordinary catalogue cards, 4 per page with «показать еще».
- Up to 12 pages; I counted about 45 items for turka + black + sweet.
- No reasons are given.

**Empty result:** the single line **«С такими параметрами кофе нет.»** In my 36 combinations at the default slider ranges, **14 were empty**:
- every «с молоком» + «Горький» combination;
- every «Кислый» + «Горький» combination;
- filter + black + bitter.

**The brewing answer is ignored when «С молоком» is chosen.** All milk answers return the same «под молочко» coffees for turka, machine and filter alike.

**Later use and B2B:**
- Not connected to an account, subscription or emails.
- A 20% discount on the first 3 orders is offered at registration, separately from the picker.
- The site has «Для бизнеса» and «Опт» sections, but they are not linked from the picker.

**For a first-time buyer:**
- Strong: it sits on the right page, «Делаю заказ в первый раз».
- Weak:
  - the sliders ask a newcomer for numeric «насыщенность» of sourness;
  - it returns dead ends with no way forward;
  - the defaults mean the user may never actually choose anything.

## 3. Coffee Project: «Подберём кофе за минуту» (VERIFIED by live GET results)

**URL:** https://www.coffeeproject.ru/quiz. The page title is «Подобрать кофе за минуту: тест».

**Where it is entered:**
- a home-page section «Не знаете, с чего начать?» with «Пять коротких вопросов о том, как вы варите кофе и какой вкус любите, и мы подберём сорт под вас.»;
- «Подобрать кофе» in the header, the footer and the catalogue.

**Questions, verbatim. Each has a short explanation under the options:**
1. «Как вы обычно готовите кофе?»: «Эспрессо», «Пуровер», «Кемекс», «Аэропресс», «Капельная кофеварка», «Френч-пресс», «Турка», «Гейзерная кофеварка», «По-разному».
   - Hint: «Одни сорта лучше раскрываются в эспрессо, другие — в воронке или турке.»
2. «Что добавляете в кофе?»: «Ничего, пью чёрный» / «Молоко или сливки» / «Сахар или сироп».
   - Hint: «С молоком лучше всего звучат шоколадные и ореховые сорта, а яркие кислотные — без добавок.»
3. «Какой вкус вам ближе?»: «Классический: шоколад, орехи, карамель» / «Сбалансированный, с лёгкой фруктовой ноткой» / «Яркий и необычный: ягоды, цитрусы, цветы» / «Положусь на вас».
   - Hint: «Все наши сорта — чистый кофе без ароматизаторов…»
4. «Какая обжарка нравится?»: «Светлая» / «Средняя» / «Тёмная» / «Не знаю».
   - Hint: «Светлая — ярче и кислотнее, тёмная — плотнее и горче, средняя — посередине.»
5. «В зёрнах или молотый?»: «В зёрнах, есть кофемолка» / «Молотый».
   - Hint: «…если кофемолки нет, смелем бесплатно под ваш способ.»
6. Final button: «Показать мой кофе».

**Answering:** «Назад» on every step. The quiz is a plain GET form, so the result URL can be shared and bookmarked.

**Result:**
- Header: «Ваш кофе / Вот что мы советуем попробовать / Подобрали по вашим ответам из кофе, который сейчас в наличии.»
- Always 3 cards. The first has the badge «Лучше всего подходит».
- Each card carries reason lines such as «Подходит для способа «Турка»», «Вкус: ягодный, фруктовый, с кислинкой» and «Хорошо с молоком».
- The cards have pack size, grind and «В корзину» inline.
- If «Молотый» was chosen: «Помол уже выбран: для турки, смелем бесплатно.»
- Buttons: «Пройти заново», «Весь кофе».

**Weak points I saw:**
- Asking for «Тёмная» roast together with «Яркий» taste silently returns light, bright coffees, with no explanation.
- «Эспрессо» + milk recommends a robusta blend («Бленд Гагарин (с робустой)»).

**Later use, B2B, numbers:**
- No account save, no follow-up.
- The site footer has «Для бизнеса»; the quiz does not.
- No usage numbers published.

**Verdict:** the best explained result in the Russian market.

## 4. Millor Coffee: «Подберём кофе под ваш вкус» (VERIFIED from code and API)

**URL:** https://millor-shop.ru/quiz

**Where it is entered:** a home-page block «Не знаете какой кофе выбрать? Ответьте на 5 вопросов — подберём 3 сорта под ваш вкус и способ заваривания.» with the button «Начать подбор».

**Page text:** H1 «Подберём кофе под ваш вкус»; progress «Вопрос 1 из 5 · Выберите один вариант».

**Questions, verbatim. Each has a subtitle, and each option has a hint:**
1. «Как вы обычно пьёте кофе?»
   - Subtitle: «Это самый важный вопрос — молоко требует совсем других зёрен, чем чёрный кофе».
   - Options: «С молоком» / «Чёрный» / «По-разному».
2. «Какой вкусовой профиль ближе?»: «Шоколадно-ореховый» / «Классический сбалансированный» / «Яркий фруктово-ягодный» / «Удивите» (hint: «Подберём интересное под остальные ответы»).
3. «Как относитесь к кислинке?»: «Не люблю» / «В меру» / «Обожаю яркую».
   - Subtitle: «Кислинка — это свежие ягодно-цитрусовые ноты. Не путать с горечью.»
4. «Как обычно готовите кофе дома?»: «Эспрессо-машина» / «Турка» / «Фильтр / Воронка / Аэропресс» / «Френч-пресс или мока» / «По-разному».
5. «Какой у вас опыт с кофе?»
   - Subtitle: «Поможем не промахнуться — кому-то нужна надёжная классика, кому-то редкость».
   - Options: «Только знакомлюсь» (hint: «Покажем безопасные универсальные варианты») / «Пью каждый день» / «Ищу что-то особенное».

**Answering:**
- «Назад» on every step; «На главную» on the first.
- On the results page there is an answers panel, «Ваши ответы — Нажмите, чтобы изменить». Each chip jumps back to its question, and a «К результатам» button returns.

**Result:**
- Header: «Ваша подборка кофе / Подборка с учётом ваших ответов…»
- 3 product cards, each with a reason line, for example «раскроется в латте и капучино · надёжная классика» or «яркий фруктовый вкус · сложный многогранный профиль».
- The API also returns a match percentage (49–94% in my tests). The quiz component does not render it (UNVERIFIED whether the product card does).
- Empty-result text: «Пока не удалось подобрать сорта. Посмотрите весь каталог.»
- Error text: «Не удалось получить подборку…»
- Buttons: «Смотреть весь каталог», «Пройти заново».

**Weak points I saw:**
- Product names are in English («Vietnam», «Peru GR1»).
- «Только знакомлюсь» + milk returns «Vietnam» first.

**Later use and B2B:**
- No account save or follow-up.
- A newsletter box «Свежие сорта раз в месяц» is separate.
- «Оптовые поставки» is in the nav, not in the quiz.

**Verdict:** the best answer editing on the market, plus an "experience" question.

## 5. Caffevita: «Какой кофе вам понравится?» (VERIFIED from code)

**URL:** https://caffevita.ru/#coffee-match (home-page section).

**Where it is entered:** a hero card «Не знаете, что выбрать? Подобрать кофе · 4 вопроса · 30 секунд». It is not on the catalogue page.

**Page text:**
- Header: «30 секунд до своей чашки».
- Lead: «Четыре простых вопроса — и мы покажем живые сорта Caffevita, которые ближе всего к вашему способу приготовления и вкусу.»
- Side note: «Подбор работает по характеристикам текущего каталога, а не по заранее заданному списку.»

**Questions, verbatim. Each has a hint, and each option has a detail line:**
1. «Как вы чаще готовите кофе?»: «Кофемашина или рожок» (Эспрессо, капучино, латте) / «Фильтр или воронка» (V60, капельная, френч-пресс).
   - Hint: «Это определит подходящий профиль обжарки.»
2. «Добавляете молоко?»: «Да, часто» / «Обычно без молока».
3. «Как относитесь к кислинке?»: «Лучше без кислинки» / «Умеренная» / «Люблю яркую».
   - Hint: «Здесь нет правильного ответа — только ваш вкус.»
4. «Какие ноты хочется найти?»: «Шоколад и орехи» / «Фрукты и ягоды» / «Цветы и чай» / «Пряности и глубина».

**Answering:** «← Назад»; no «не знаю». Turka, moka and French press have no proper place in question 1.

**Result:**
- Header: «Подбор готов / Вот три сорта для вашей чашки».
- A summary of the answers as chips (not clickable) and «Пройти ещё раз».
- The top 3 in-stock coffees by score. The score is product rating + brewing method + milk + acidity + keyword hits in the description.
- The ranking means the result is never empty. If the catalogue fails to load: «Каталог временно недоступен…»
- No reasons per card.
- The same home page sells 4×100 g sets («Четыре вкуса в одной коробке»), but **the quiz never suggests them**.

**Later use, B2B, numbers:** none.

## 6. Aruna Coffee: «Подбор кофе за 30 секунд» (VERIFIED from code)

**URL:** https://aruna-coffee.ru/. The floating side tab «Подбор кофе по предпочтениям» (on mobile «Подборщик кофе») is on every page; I checked the home and a product page. It opens a full-screen panel labelled «Тестовая версия».

**Intro:** «Ответьте на 6 коротких вопросов — мы предложим три варианта: безопасный базовый, более интересный и один экспериментальный.»

**Questions, verbatim. Each has a subtitle:**
1. «Какой формат кофе вам нужен?»: «В зернах» (Есть своя кофемолка) / «Молотый».
2. «Как вы готовите кофе?»: «Эспрессо» / «Фильтр» / «Френч-пресс» / «Гейзер / мока» / «Турка» / «Аэропресс».
3. «Пьёте с молоком?»: «С молоком» / «Без молока» / «По-разному».
4. «Какой вкус вам ближе?»: «Спокойный» / «Сбалансированный» / «Яркий».
   - Subtitle: «Спокойный — шоколад, орехи, карамель. Яркий — фрукты, цветы, цитрус».
5. «Как относитесь к кислотности?»: «Не люблю» / «Средняя» / «Люблю».
   - Subtitle: «Кислотность — это «сочность» и свежесть вкуса».
6. «Какой бюджет?» (за упаковку 250 грамм): «До 700 ₽» / «700–900 ₽» / «Не важно» (Важнее вкус).

**Answering:** «Назад / Далее»; «Пройти заново».

**Result:**
- Title «Ваш результат», then a lead sentence built from the answers, e.g. «Вам подойдёт плотный кофе с шоколадными и ореховыми оттенками и невысокой кислотностью. Хорошо раскроется с молоком. … Для первой покупки рекомендуем базовый вариант, более выразительным будет «интересный», а для эксперимента — третий сорт.»
- 3 cards tagged «Базовый / Интересный / Экспериментальный», each with «В чашке: …» notes and a price.
- If fewer than 3 coffees pass the filters, it drops the budget filter, then the format filter, then uses the whole catalogue. So it is never empty, but it may break the user's own constraints.
- The data includes a decaf and a syrup with no question about either. I did not test whether they can come up.

**Later use, B2B, numbers:** none.

**Verdict:** the best single idea here is the three-tier result.

## 7. Gravitas: «Какой кофе вам подойдёт?» (VERIFIED from code)

**URL:** https://www.gravitas-coffee.shop/page/kak-vybrat-kofe («Как выбрать кофе» in the top menu).

**Intro:** «Несколько коротких вопросов — и мы предложим сорта под ваш способ приготовления и вкус, подскажем помол и объём.»

**Questions, verbatim. The questions branch on question 1:**
1. «Для чего подбираете кофе?»: «Для дома» / «Для офиса» (кофемашина или кофеварка на команду) / «Для кофейни или ресторана».
2. Brewing method; the wording depends on question 1:
   - home: «В чём вы готовите кофе?»: «Кофемашина», «Турка или гейзер», «Пуровер или аэропресс», «Капельная кофеварка» (или френч-пресс);
   - office: «В чём готовите кофе?», 2 options;
   - restaurant: «Что готовите?»: «Эспрессо», «Фильтр-кофе», «V60».
3. «Пьёте с молоком или чёрный?»: «С молоком» / «Чёрный» / «По-разному».
4. «Какой кофе вам ближе?»: «Базовый на каждый день» / «Микролоты» / «Что-то уникальное».
5. «Сколько кофе выпиваете в месяц?»: «До 500 г» … «Больше 3 кг». Restaurants instead get «Сколько кофе нужно в месяц?» (1–5 кг / 5–30 кг / От 30 кг).

**Answering:**
- «← Назад»; the chosen answers show as crumbs.
- Changing an earlier answer clears the later ones.

**Result:**
- «Вам подойдёт»: up to 3 coffees from hand-curated name lists, filtered to in-stock.
- Two tip cards: «Сколько брать» (pack-size advice from the monthly amount) and «Помол».
- A wholesale banner for restaurants, and for offices that drink a lot: «Для офиса выгоднее опт … Оптовый прайс →».
- Empty result: «Подходящие сорта сейчас закончились — посмотрите всю категорию.»
- Buttons: «Смотреть все сорта», «Рецепты», «Пройти заново».

**Later use, numbers:** none.

**Verdict:** the only quiz with a real B2B and office exit, and the only one that turns the amount people drink into pack-size advice.

## 8. Notik Coffee: «Поможем выбрать кофе, который подойдет именно вам» (VERIFIED from code and endpoint)

**URL:** https://notikcoffee.ru/quiz/ («Квиз» in the menu).

**Intro:** «Ответьте на 4 простых вопросов и мы предложим лучший вариант напитка, основы и посыпки специально для вас». This is copy left over from a syrup and topping quiz.

**Questions, verbatim:**
1. «Как вы обычно пьете кофе? (с молоком/без)»: «Эспрессо/американо» / «С молоком/сливками» / «Фильтр кофе»
2. «Мне нравится [опишите вкус, который вы хотите почувствовать в вашей чашке].» **The template placeholder is shown verbatim.** Options: «Фруктово-ягодный» / «Шоколадно-ореховый» / «Цитрусовый/цветочный» / «Пряный» / «Алкогольные ноты»
3. «Какой способ приготовления вы используете чаще всего?»: «Кофемашина (эспрессо)» / «Турка, чашка» / «Альтернативные способы заваривания (пуровер, кемекс, аэропресс)»
4. «Какие вкусовые дескрипторы предпочитаете в кофе (кислотность/сладость/горечь)?»: «Кислотность» / «Сладость» / «Горечь»

**Answering:**
- After each answer the server greys out the next question's options that no product matches. This is a good idea.
- There is no back button and no «не знаю».

**I walked every enabled path (26 paths):**
- 20 paths end in **1 coffee**, 4 in 2 coffees, 1 in 3.
- 2 paths dead-end: question 3 has **no enabled option**, so the user is stuck with no way back.
- 1 path returns an empty server response.

**Result:**
- Page `/quiz/?product=…` with «На основании ваших ответов, мы рекомендуем:» and product cards.
- A feedback form: «Вам понравились варианты продукции, которые мы предложили исходя из ваших ответов?», plus «Поделиться».
- An empty product list silently reloads the quiz.

**Later use, B2B, numbers:**
- The on-page feedback form is the only "did you like it" loop in the market, but it is asked before tasting.
- «Купить оптом» is in the nav, not in the quiz.

## 9. Eastbrew Coffee: «Найдите свою идеальную чашку» (VERIFIED from Marquiz JSON; rendering UNVERIFIED)

**Where it is entered:** home-page tiles «Найди любимый кофе и получи промо-код» open a Marquiz popup (`#popup:marquiz_63f2ab4f027431004825df6c`).

**Start page:**
- «Мы создаём кофе для всех на любой вкус. Всего 5 вопросов, и вы найдёте кофе по своему вкусу и получите подарок от нас в посылке.»
- An "assistant" persona: «Александр, Основатель Eastbrew Coffee».
- Bonus: «3 дрип-пакета в посылке».

**Questions, verbatim. All are image cards, and each has a long educational hint:**
1. «Как вы готовите кофе?»: Френч-пресс / Джезва (турка) / Капельная кофеварка / Гейзерная кофеварка / Эспрессо-машина (Автомат и рожковая) / Воронка (V60, кемекс, иммерсия, etc.) / Аэропресс / Чашка / Дрип-пакет
2. «Какой вкус вы предпочитаете ощущать в чашке кофе?»: Ореховый, цветочный, сиропный / Шоколадный, карамельный, сливочный / Яркий, сочный, ягодный / Тропический, фруктовый, ферментированный / Алкогольный, миндальный, бархатистый / **Я ещё не уверен**
3. «Как вы бы описали идеальную чашку?»: Комплексная / Деликатная / Плотная / Сбалансированная / Искристая / Насыщенная
4. «Как вы пьёте свой кофе?»: Чистый чёрный / С печеньками / С молоком / Без кофеина
5. «Что для вас важно в том, что стоит за чашкой кофе?» (multiple choice, plus «ваш вариант»): Мне важен только вкус… / органический кофе… / Я знаю, кто и как вырастил… / Ферма принадлежит частному собственнику

**Result (from the configuration):**
- 16 hand-written result cards (name, story, «Вкусовой профиль: …», price, «Попробовать»), each shown by answer rules. Several can show at once.
- Multi-result title: «Ваш промо-код на подарок EASTQUIZ300».
- Text: «Подобрали несколько вариантов на основе ваших ответов…», button «Что в букете?».
- Retry is allowed; results are also emailed (subject «Здесь ваш любимый кофе»).
- The contact form is switched off. Its stored text still offers promo code «QUIZ», and its redirect points to **coffeeproject.ru/coffee**, another roaster's catalogue, which looks like a copy-paste error.
- Questions 3 and 5 match no result rule I could see, so they do not affect the result.

---

## Adjacent tools (not quizzes)

- **EVADIA (1coffee.ru).** A home-page AI chat «Спросите Mia · AI консультант» with a preset prompt «Помоги выбрать кофе без кислинки». It sits next to four direction tiles (для эспрессо / для фильтра / для молока «Без кислинки» / с ароматами). I could not see how it behaves (UNVERIFIED).
- **Solo Coffee (solocoffee.ru).** «Подобрать кофе!» is a B2B lead form: business type → volume slider → contacts. It is not a quiz for consumers.
- **Лоботрясы (lobotryasi.ru).** «Подобрать кофе» is the catalogue's filter panel: Вид кофе, Обжарка, Кислотность, Обработка, Страна, Способ приготовления, with «Найдено 0 сортов». **Ingresso** has the same idea («Подобрать кофе» jumps to the catalogue facets, 59 items).
- **Mikale (mikale.ru).** An agency case study describes a home-page quiz (brewing method, type, taste → «подборка кофе под его запрос»). It is not on the live home page now; that slot holds a wholesale banner (UNVERIFIED that it was ever live). The case gives no quiz metrics.
- **Torrefacto.** The site links a Telegram «TorrefactoBaristaBot» (UNVERIFIED what it does). The catalogue is grouped by brewing method and roast. No quiz.

## Shops with no quiz found

These sites show no quiz on the home page or the main catalogue, and the four I could get sitemaps for list none:
- Torrefacto, Laboratoria, Лоботрясы (filter only), Camera Obscura (camcoffee.ru), Кооператив «Чёрный», West 4, Даблби, «Человек и пароход», Madeo.
- Coffeemania: no coffee picker for retail. A news item says GigaChat became an AI assistant for its restaurant menu.
- Coffee Like: shop.coffee-like.com is a franchise login.
- Rockets: Yandex captcha.
- Roastberry, Cofeina, «Зерно», 1st Coffee Box, Kiosk: no site found, or the domain did not resolve.
- Subscriptions: Tasty, Welder Catherine («Подписка №78», preview coffees, 2900 ₽/мес) and «Чёрный» have no taste questionnaire. VkusVill's subscription is for cups of coffee, not beans.
- Ozon and Yandex Market: captchas blocked me, so I could not check whether they have a picker (UNVERIFIED). Their category filters exist, but I did not see a quiz.

## Published usage numbers

None found for any Russian coffee quiz. The only quiz numbers I found were for an unrelated B2B forklift quiz: lead conversion went from 0.6% to 8%, and making the phone field required dropped it to 5%. That is useful only as a warning about forcing contact details.

---

## Synthesis

**What the Russian quizzes have in common**
1. **3–6 questions, with milk and brewing method first.** Every quiz asks them; most then ask a single "style" or "acidity" question in plain words (шоколад/орехи vs ягоды/цитрус). Grind or format is asked only by Coffee Project, Aruna and Gravitas. Budget is asked only by Aruna; experience only by Millor; place of use (home, office, restaurant) only by Gravitas.
2. **Two kinds of result.**
   - The big early quizzes (Tasty, Welder Catherine) just turn answers into catalogue filters. Users get lists of 0 to about 70 coffees.
   - Newer ones (Coffee Project, Millor, Caffevita, Aruna, Gravitas) rank coffees and always show about 3.
   - Nobody shows exactly one coffee with confidence, and nobody offers a tasting set as the answer.
3. **Reasons are rare.** Only Coffee Project (per-card lines), Millor (a short reason per card) and Aruna (a lead sentence plus tier tags) explain the choice. Tasty and Welder show bare catalogue cards.
4. **Nothing happens after the quiz.**
   - No quiz saves to an account, feeds a subscription or asks after delivery whether the coffee was liked.
   - Notik asks «понравились варианты?» right away, before anyone has tasted.
   - Eastbrew emails the result.
   - Discounts are the hook instead: Tasty «П15» 15%, Eastbrew «EASTQUIZ300» and a gift of drip bags.
5. **B2B is almost absent.** Gravitas branches on «Для офиса / Для кофейни» and shows a wholesale offer. Everyone else keeps «Опт» or «Кофе в офис» out of the quiz.

**Weak spots QQ can beat**
- **Empty and huge results.** Tasty: 0, 1, or 71 coffees. Welder Catherine: 14 of 36 combinations give «кофе нет». Notik: dead-end steps with no back button. QQ can promise "always one main pick plus a backup" and show it.
- **Answers that are silently ignored.** Welder Catherine ignores brewing method when milk is chosen. Coffee Project ignores «Тёмная» against «Яркий». Tasty treats "black" and "both" the same. Eastbrew's questions 3 and 5 affect nothing. QQ can say plainly when two answers conflict and which one won.
- **Expert language and controls.** Welder Catherine asks for slider ranges of «насыщенность» of sourness (40–100). Notik asks for «вкусовые дескрипторы». Words like «ферментированный» go unexplained. QQ can ask about drinks and foods people already know.
- **No hedge for newcomers.** No quiz suggests small packs or a sampler, even though Caffevita sells 4×100 g sets on the same page.
- **No learning loop.** Nobody asks "how was it?" after delivery, or uses that answer for the next order or subscription. QQ, with 25 coffees, can close this loop.
- **Copy quality.** Leftover template text (Notik), typos («Вернутся к выбору»), English product names (Millor). It is easy to be cleaner.
- **Naming.** «Выбрать кофе за минуту» is already Tasty's name, so QQ should pick its own.

**Ideas worth borrowing**
- **Aruna's three tiers,** «безопасный базовый, более интересный и один экспериментальный». This is the best answer to "what if I'm wrong", and it fits a 25-coffee range.
- **Millor's editable answer chips** («Нажмите, чтобы изменить» → «К результатам»), plus a short reason line per coffee and the «Только знакомлюсь» experience question.
- **Coffee Project's result card:** «Лучше всего подходит», «Подходит для способа «Турка»», «Хорошо с молоком», grind preselected («смелем бесплатно»), add to cart inline, shareable result URL.
- **Notik's greyed-out options:** hide options that lead to nothing, so dead ends are impossible. Notik built the idea but did not finish it.
- **Gravitas's first question «Для чего подбираете кофе?»** as the B2B and office exit, plus pack-size advice from monthly consumption.
- **Tasty's entry points:** a banner in the catalogue shown only to people without orders, plus a button in the chat widget.
- **Short hints under each question:** Coffee Project («Светлая — ярче и кислотнее…»), Millor («Не путать с горечью»), Caffevita («Здесь нет правильного ответа — только ваш вкус»). They teach without slowing the user down.

---

## Sources

- https://shop.tastycoffee.ru/
- https://shop.tastycoffee.ru/coffee-quiz
- https://shop.tastycoffee.ru/_nuxt/Bb44UbKF.js (quiz store, questions and answer→filter map)
- https://shop.tastycoffee.ru/_nuxt/CzdqBID8.js (QuizWidget)
- https://shop.tastycoffee.ru/_nuxt/Cm_qcaiU.js (quiz page)
- https://shop.tastycoffee.ru/_nuxt/M_xFODd1.js (catalogue, AfterCoffeeQuiz block, empty state)
- https://shop.tastycoffee.ru/api/v2/catalog/coffee?methods=…&filters=… (38 combinations)
- https://shop.tastycoffee.ru/coffee?methods=2a&filters=
- https://shop.tastycoffee.ru/subscription
- https://shop.tastycoffee.ru/how-to-choose-coffee
- https://shop.tastycoffee.ru/tasty-coffee-first-order
- https://shop.tastycoffee.ru/sitemap.xml
- https://tastycoffee.ru/
- http://svarshica.ru/ (hosting placeholder «Сайт недоступен»)
- https://theweldercatherine.ru/
- https://theweldercatherine.ru/catalog/
- https://theweldercatherine.ru/neworder/ (picker; live POSTs to /neworder/index.php)
- https://theweldercatherine.ru/bitrix/cache/js/s1/catherine/page_5e27259e041853d5c88e492361c92413/page_5e27259e041853d5c88e492361c92413_v1.js (slider config)
- https://theweldercatherine.ru/subscribe/
- https://theweldercatherine.ru/sitemap.xml
- https://t-j.ru/welder-catherine/
- https://daily.afisha.ru/eating/14218-gde-pokupat-kofe-dlya-doma-dyuzhina-onlayn-magazinov-luchshih-rossiyskih-obzharschikov/
- https://www.coffeeproject.ru/
- https://www.coffeeproject.ru/quiz (and GET results, e.g. ?brew=cezve&milk=black&taste=bright&roast=light&form=ground)
- https://www.coffeeproject.ru/coffee
- https://millor-shop.ru/
- https://millor-shop.ru/quiz
- https://millor-shop.ru/_next/static/chunks/app/quiz/page-00f090e66a677438.js (questions and result component)
- https://millor-shop.ru/api/quiz/match
- https://caffevita.ru/
- https://caffevita.ru/coffee
- https://caffevita.ru/_next/static/chunks/16rsgtr9d5ted.js (CoffeeMatch component)
- https://aruna-coffee.ru/
- https://aruna-coffee.ru/product/braziliya-santos/
- https://www.gravitas-coffee.shop/
- https://www.gravitas-coffee.shop/page/kak-vybrat-kofe
- https://www.gravitas-coffee.shop/collection/all.json?page=1&page_size=100
- https://notikcoffee.ru/quiz/
- https://notikcoffee.ru/quiz/?product=252;259
- https://notikcoffee.ru/bitrix/cache/js/s1/notik/page_53dda5b134a9992e3e37444eb917c974/page_53dda5b134a9992e3e37444eb917c974_v1.js
- https://notikcoffee.ru/bitrix/services/main/ajax.php?mode=class&c=go2web:quiz&action=filterProduct
- https://eastbrew.com/
- https://api.marquiz.ru/v1/quizzes/63f2ab4f027431004825df6c
- https://1coffee.ru/
- https://solocoffee.ru/
- https://ingresso.coffee/
- https://lobotryasi.ru/
- https://lobotryasi.ru/coffee/
- https://lobotryasi.ru/sitemap.xml
- https://mikale.ru/
- https://workspace.ru/cases/sozdanie-sayta-pod-klyuch-dlya-obzharschika-kofe-mikale/
- https://ruward.ru/cases/4892/
- https://www.torrefacto.ru/
- https://www.torrefacto.ru/catalog/roasted/
- https://laboratoriacoffee.ru/ → https://shop.laboratoriacoffee.ru/
- https://shop.laboratoriacoffee.ru/catalog/kofe/
- https://shop.laboratoriacoffee.ru/sitemap.xml
- https://camcoffee.ru/
- https://camcoffee.ru/filter
- https://camcoffee.ru/espresso
- https://chernyi.coffee/
- https://chernyi.coffee/subscription
- https://chernyi.coffee/coffeeshop
- https://west4.coffee/
- https://west4.coffee/kofe
- https://double-b.ru/
- https://www.chip.coffee/
- https://madeo.ru/
- https://madeo.ru/sitemap.xml
- https://coffeemania.ru/
- https://coffee-like.com/
- https://shop.coffee-like.com/
- https://rockets.coffee/
- https://www.ozon.ru/category/kofe-v-zernah-9373/ (captcha)
- https://market.yandex.ru/catalog--kofe-v-zernakh/ (captcha)
- https://new-retail.ru/novosti/retail/vkusvill_zapustil_podpisku_na_kofe5131/
- https://101kofemashina.ru/freshly-roasted-catalog/ (list of roasters used for discovery)
- https://vc.ru/gdekurs/617260-gde-kupit-vkusnyi-kofe-v-zernah-top-20-internet-magazinov-dlya-kofemanov (list used for discovery)
- https://kudago.com/all/quiz/test-kakoj-kofe-tebe-podhodit/ (media test; not a shop quiz)
- https://kofepovkusu.by/coffee-quiz/ (Belarus; out of scope, not analysed)
- Home pages scanned for discovery only, with no quiz found: augustcoffee.ru, bolshecoffee.ru, coffee-tea-bravos.ru, almondandcoffee.ru, coffeewave.me, freshcoffee.ru, grind-coffee.ru, holyberry.ru, jezvacoffee.ru, kofeman.su, listzerno.ru, majaro.ru, makbush.ru, mycoffey.ru, nevacoffee.ru, red-kof.ru, rostretto.ru, silkydrum.ru, solovl.ru, taberacoffee.ru, travelers-coffee.com, voskhodcoffee.ru, neftcoffee.ru, absinegor.ru, sibaristica.com
