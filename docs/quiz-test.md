# Testing the quiz with five newcomers: a script for Tim

Session 4 of choosing coffee. The survey only covers people who already bought QQ, so this test is the quiz's first
contact with the people it is for. Five people find most of the problems that make a flow fail. Here, five people
also tell us whether the result makes someone want to order, and whether it beats the plain «start here» set of
three that sits under the quiz.

## Who
- Five people who have **never ordered from QQ** and don't buy specialty coffee regularly. They drink coffee at home or
  would like to start: supermarket coffee, capsules, instant, or cappuccino in cafés.
- Mix them: at least two who drink with milk, at least one who brews in a machine and one who uses a turka or
  a French press, and at least one who says «не знаю, что люблю».
- Not friends of QQ, not baristas, not anyone who has seen the site.

## Set-up (5 minutes before)
- Their own phone if possible (most visitors come on phones); otherwise a phone you hand them. Open
  https://timofeylebedev.github.io/qq/pr-preview/pr-26/ (or the test site once merged) in a **private tab**, so nothing
  saved from an earlier person shows.
- Record the screen and their voice, if they agree. Otherwise note the time of each step.
- Have a printed copy of the table at the end of this page.

## What to say at the start (Russian, read it as is)
> «Мы проверяем сайт, а не вас: ошибиться невозможно. Пожалуйста, думайте вслух — говорите, что видите, что
> ожидаете и что смущает. Я буду молчать и почти не помогать: это нарочно. Если захотите бросить — это тоже ответ.»

## Tasks
Swap the order of A and B between people: 1, 3 and 5 do A first; 2 and 4 do B first.

**A. The quiz from the home page (about 3 minutes)**
> «Представьте: вы впервые заказываете кофе домой у этой обжарки. Найдите кофе, который вы бы купили.»

Don't mention the quiz. Note:
1. Do they find the quiz («Выбрать кофе за минуту», the section after the hero) by themselves, or go to the
   catalogue first? How long until the first tap?
2. Each question: do they hesitate? Which answer do they pick, and do they say why? Watch especially «Какой кофе вы
   пьёте сейчас?» and «Что вам ближе на вкус?».
3. The result: what do they read first? Do they read the reasons under the cards? Do they look at the map?
4. Which coffee would they buy, and why? Do they take the first one, a move («Мягче», «Ярче»…), or none?

**B. The «start here» set (about 2 minutes)**
Open https://timofeylebedev.github.io/qq/pr-preview/pr-26/start/#three-title
> «Представьте, что вопросов нет, а есть эти три кофе. Какой бы вы взяли — или ни один?»

Note the same as A.4.

**C. Change an answer (1 minute)**
Back on the quiz's result:
> «Допустим, вы пьёте без молока. Поменяйте это.»

Do they find «Нажмите на ответ, чтобы изменить»? Does the result change in a way they understand?

## Questions after the tasks (Russian, ask in this order; don't explain anything first)
1. «Своими словами: почему сайт предложил вам именно этот кофе?» (Does the reason match what the page said?)
2. «Было ли что-то непонятно в вопросах? Какой вопрос было труднее всего ответить?»
3. «"Кислинка" — что для вас это слово? Это хорошо или плохо?» (What newcomers mean by кислинка, яркий, плотный is
   still an open question for the taste model.)
4. «Что для вас значит пятно на карте?» (Point at the map.) «Пригодилось бы оно?»
5. «Из двух способов — вопросы или три готовых кофе — какой удобнее? Почему?»
6. «Купили бы вы сейчас? Если нет, чего не хватает?»
7. «Если бы через неделю после доставки сайт спросил, как вам кофе, ответили бы? Что бы хотели сказать?» (For
   session 6: the feedback after delivery.)

## What to record per person

| # | Who (drinks now · milk · how brews) | Found the quiz alone? | Time to result | Hard question | Answers given | Result's first coffee | Would buy | Quiz or set? | Could say why it was offered? | Quote |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | | | | | | | | | | |
| 2 | | | | | | | | | | |
| 3 | | | | | | | | | | |
| 4 | | | | | | | | | | |
| 5 | | | | | | | | | | |

## How to read it
- **The quiz works** if at least four of five reach a result without help in about a minute and can say in their own
  words why the first coffee was offered (question 1). If two or more say the reasons are about the coffee but not
  about them, the reasons need rewriting.
- **A question fails** if two or more hesitate on it or answer «не знаю» when they could have answered. Note the words
  they use instead: they are the words for the next version.
- **The set wins** if most prefer B and would buy from it. Then the quiz moves below the set, not the other way round.
- **The map** stays only if people say what it means without help; otherwise it moves behind a link.
- Bring the table back to the session that changes the quiz (or into the PR as a comment): every finding goes into
  `data/quiz.json` or `docs/quiz.md`, and `docs/quiz-output.md` is rebuilt.

## The roaster's part (30 minutes, separate)
The plan also asks a QQ roaster or head barista to check the matches. Open the bench
(https://claude.ai/artifact/AZFRK774BDY4sEPQq1EspK) and go through the twelve most common answer sets in
`docs/quiz-output.md` (the «Обычно с молоком» and «Без молока» rows for the espresso machine and the pour-over). For each,
ask: «Вы бы предложили этот кофе новичку с такими ответами? Если нет — какой?» Write their answer next to the row.
