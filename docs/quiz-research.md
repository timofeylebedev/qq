# Quizzes and recommenders: what QQ's quiz takes from them

Session 4 of choosing coffee (26 Nov 2026). Four agents, each on one group, from public pages and papers:
- Russian coffee shops (`docs/quiz-research/russian.md`);
- coffee roasters and subscriptions abroad (`abroad.md`);
- other taste and fit products: wine, whisky, tea, chocolate, perfume, skincare, fashion, music (`other-fields.md`);
- research evidence (`evidence.md`).

Every claim is sourced in those files, with UNVERIFIED marked where a quiz could not be seen. Session 0's findings are in
the claude.ai project doc `claude/choosing-coffee-research.md`. What was built: `docs/quiz.md`.

## What the market does
- **Russia** (nine live quizzes, read from their code and endpoints):
  - **Filter-list quizzes.** Tasty («Выбрать кофе за минуту», 3 steps: milk, 11 devices, a style) and Сварщица (sliders)
    turn the answers into catalogue filters: 0 to 71 coffees. Сварщица's 14 of 36 test combinations end in «кофе нет».
  - **Ranking quizzes.** Newer ones always show about three: Coffee Project, Millor, Caffevita, Aruna, Gravitas.
    - Reasons: only Coffee Project («Лучше всего подходит», «Хорошо с молоком», the grind preselected), Millor (a reason
      line, answer chips «Нажмите, чтобы изменить») and Aruna (three tiers: «базовый, интересный, экспериментальный»).
  - **What no one does:**
    - nobody shows one coffee with confidence or offers a tasting set;
    - nobody saves to an account or asks after delivery;
    - several silently ignore an answer (Сварщица drops the method when milk is chosen).
  - **B2B:** only Gravitas branches («Для офиса / Для кофейни»).
  - **Usage numbers:** none published. Tasty's entry is a banner in the catalogue shown only to people without orders.
  - **The name «Выбрать кофе за минуту» is Tasty's** (its H1). Marketing's spreadsheet took it from there; a question
    for Tim (`quiz-name`).
- **Abroad, one backbone everywhere:** brewing method first (it filters hard: grind, roast), then roast, then 3–5 flavour
  families (never single notes), then milk.
  - Trade (500+ coffees) is the most developed: 8 steps, «I'm not sure» on most, wording that follows earlier answers.
    The result is one «We Recommend» coffee plus a few, each explained from the person's own answers («Because you brew
    French press and love smooth…»), and editable in place.
  - Coffee Circle (Germany) is closest to QQ's size: 3 skippable questions → one of 9 curated pages (3 brewing ways ×
    3 taste profiles), each with one recommended coffee and a paragraph why.
  - Driftaway replaces the quiz with a tasting kit.
- **Other fields:**
  - The best results give the taste region first, then one headline pick and a few alternatives (Diageo's whisky
    finder; Golden Apple's perfume finder shows 2–6).
  - Novices answer everyday proxies (liking of familiar foods, either/or pairs, what they drink now). Technical words
    (acidity, tannin) appear only in results.
  - Bright Cellars ran its matching on about 30 wines, QQ's scale: a region plus 1–3 picks is the honest form there.
- **Numbers** are scarce and mostly vendor claims:
  - Nespresso: 42% completion, 18% conversion on recommended coffees;
  - RevenueHunt: 69% of starters finish, 5% of coffee/tea finishers buy;
  - Henry's: 9% of takers buy.
  - Nobody publishes how many change answers.

## What the evidence says
- **Questions:**
  - Ask about things people know (what they drink, milk, method). Unanswerable questions drove 11–21% of new users away
    (Rashid et al. 2002, 351 users).
  - A choice between concrete options with a «don't care» cut effort and raised trust (Loepp et al. 2014).
  - Offering «don't know» everywhere attracts low-effort answers (Krosnick 2002): keep it on the taste question only.
  - Plain progress bars don't reduce drop-off (meta-analysis of 32 experiments).
- **Result form:**
  - Uncertain choosers do worse with many options (Chernev, Böckenholt and Goodman 2015, N = 7 202).
  - A diverse short list satisfies as much as a long one and is easier (Willemsen et al. 2016).
  - «Best match plus alternatives that show their trade-off» beat a ranked list on trust and intent to return (Pu and
    Chen 2006).
- **Explanations:**
  - Short reasons tied to the person's own answers work best. Novices accept a result more when they can see which
    answer drove it (Kramer 2007).
  - A brief note on how the pick was made protects trust when it disappoints (Kizilcec 2016).
  - «People like you» inflates expectations (Bilgic and Mooney 2005, session 0).
- **Labels:**
  - People accept vague profiles as accurate (Forer).
  - A label shifts self-image and purchase intent (Summers et al. 2016).
  - Labels and expectations change taste itself (Lee, Frederick and Ariely 2006; Plassmann et al. 2008).
  - So: describe the taste, don't name the person.
- **Stated vs tasted:**
  - A stated roast preference matched a blind favourite only about 55% of the time (vendor figure).
  - Novices say «chocolatey», experts «fruity».
  - Milk masks coffee flavours.
  - In Russia instant is 62% of home coffee purchases and 75% of coffee out of home is drunk with milk (industry
    panels).
- **Feedback:**
  - Optimising overall liking beat optimising «just right» (Li et al. 2015, N = 388): ask liking first, then the direction
    only to know which way to move.
  - Profiles sharpen as ratings accumulate (Firstleaf at 6/12/24; Vivino needs 5).

## So the quiz
- **Beats the Russian quizzes on the output:** never empty and never 70 (always three, one first), every answer used and
  shown, reasons on every card, saved and used afterwards.
- **Asks four answerable things:** method (first, as everyone does; it sets the roast and grind), milk, what you drink
  now, and one taste question in food words with «не знаю». No sliders, no technical words in the questions, no budget,
  no email gate.
- **Gives one coffee and two moves away from it** (Trade's and Coffee Circle's form, Pu and Chen's finding). The moves
  are named directions in the coffee's own terms, which nobody else does. «Не знаю» gives three different coffees, a
  tasting by post (Driftaway's idea, at the size QQ can sell).
- **Explains every card from the person's answers:** the notes that match, milk, what they drink now. One honest
  downside at most, and the one-sentence summary names the answers that drove it (Kramer; Trade's «Because you…»).
- **Shows the visitor as a region on the same map as the coffees.** No one found does this. The map is there as the
  explanation that the result is a start, not as the result.
- **Edits in place:** each answer on the result is a button that opens its question and comes straight back (Trade).
- **Saves to the profile and feeds the next steps.** The catalogue, the coffee page's roast and grind, the closeness in
  «Впечатления», and next the feedback after delivery: liking first, then the direction (session 6).
- **Uses no persona label,** only the region in words («мягкий и плотный»).

## Open
- **Completion and answer changes:** no public numbers. Log them from day one (`docs/quiz.md`).
- **Food words:** whether newcomers read «шоколад и орехи / ягоды и цитрусы» as intended, and what they mean by
  «кислинка». The test with five newcomers asks it (`docs/quiz-test.md`).
- **50 g packs:** whether QQ sells them retail decides the «Не знаю» set (question `quiz-small-packs`).
