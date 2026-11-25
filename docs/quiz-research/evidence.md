# Evidence for the QQ Coffee product-finder quiz

Scope: studies, usability research and industry data relevant to a 3–6 step quiz for first-time buyers. It asks about milk, brewing method, what you drink now and one optional coarse taste question with «не знаю». It places the person on a taste map as a wide region, gives a result with plain reasons, saves it to the account and refines it from post-delivery feedback.

Already known to the team and not repeated here: Knijnenburg et al. 2011, Bilgic & Mooney 2005, Mogilner et al. 2008, Simonson 2008, Hoeffler & Ariely 1999, Kagie et al.

Labels used below:
- **[R]** peer-reviewed research.
- **[UX]** a usability firm's qualitative research (NN/g, Baymard).
- **[V]** a vendor or company claim, with no published method. Treat these as anecdote.
- **[NV]** I could not re-read the primary source in this session (paywall or bot block). The figure is from the paper as I know it or from a secondary source, as stated. Check it before quoting it externally.

---

## 1. Guided selling, product finders and quizzes in e-commerce

**Baymard.** I found no public Baymard guideline on product finders, quizzes or guided selling.
- Baymard has a "12 'Quiz' Design Examples" page (Bespoke Post, KiwiCo, BarkBox, Birchbox and others), but the annotations are paywalled.
- Its 2024 Product Finding study (219 moderated think-aloud sessions, 12 sites, 160+ guidelines) covers search, navigation and filtering, not quizzes. [UX]
- The closest public finding is about jargon in filters. 62% of benchmarked sites use unclear or jargon-heavy filter labels with no in-place help (Sousa, Baymard, 27 Feb 2024). Users then apply and remove filters to learn what they mean, or leave the site to look the term up. Baymard's advice is to avoid industry terms or explain them in place: tooltips on desktop, tappable icons on mobile. [UX]
- If QQ has Baymard Premium, the quiz examples and any related guideline are worth checking directly.

**NN/g on wizards** (Budiu, "Wizards: Definition and Design Recommendations", 2017). [UX, qualitative, no numbers]
- Wizards suit novices and infrequent tasks.
- Show all steps and highlight the current one.
- Give explicit Back and Next buttons, labelled with the action they perform.
- Mark completed steps.
- Use branching to hide steps that don't apply.
- A wizard is the wrong pattern if users need to compare across steps.
- The article gives no recommended step count and does not cover mobile.

**NN/g on asking for preferences up front.** [UX]
- Schade, "7 Tips for Successful Customization", 2016:
  - The default experience must work without any answers, because users often skip customization.
  - Ask up front only when it is "a brief interruption" with a clear payoff.
  - Explain why you ask, offer Skip, and let users "manage options over time".
- Kendrick, "Mobile-App Onboarding", 2020: content-shaping questions belong in onboarding, but keep them brief, optional and justified.

**How many questions before drop-off.** There is no controlled study of product quizzes. The nearest evidence:
- **Rashid et al. 2002, MovieLens sign-up** [R]. 351 new users were randomised to elicitation strategies.
  - Mean pages needed to finish: 1.9 (popularity), 2.3 (item-item), 4.0 (log pop×entropy), 7.0 (old baseline).
  - Dropout: about 11% for the two easiest strategies, about 14% and about 21% for the harder ones.
  - Effort, not question count as such, drove abandonment.
- **Galesic & Bosnjak 2009, Public Opinion Quarterly, opt-in web survey in Croatia** [R]. Announced length cut starts: about 75% started a "10-minute" survey, 65% a "20-minute" one and 62% a "30-minute" one (figures as reported by Hanson et al. 2025). The paper also reports lower-quality answers to later questions. [NV for N]
- **Vendor figures** [V]:
  - Octane AI recommends 5–10 questions and 2–4 result products.
  - It reports 60–70% typical completion and flags any question that loses more than 8%.
  - Interact reports 65% start-to-finish across its platform.
  - Outgrow reports 52% median completion for e-commerce interactive content. It also says question 3 is the biggest drop-off point and that progress bars give "up to 26%" more completions, with no source for either.
  - None of these publish a method, sample or comparison. Read them as marketing.

**Progress indication.** Villar, Callegaro & Yang 2013 meta-analysed 32 randomised experiments in web surveys. [R]
- A constant-speed progress bar did not significantly reduce breakoff.
- Fast-then-slow bars reduced breakoff. Slow-then-fast bars increased it.
- So a bar is not free help. With 3–6 steps a simple "2 of 4" is enough, and it must never jump backwards or reveal hidden extra steps late.

**Skip and «не знаю».**
- Krosnick et al. 2002 (Public Opinion Quarterly) ran 9 experiments in 3 household surveys. [R]
  - Offering "no opinion" did not improve data quality.
  - It mostly attracted satisficers: less educated respondents, respondents answering later in the survey and low-effort respondents.
  - It "may preclude measurement of some meaningful opinions".
- Mavletova & Couper 2015 meta-analysed mobile web breakoff (14 studies, 39 samples). [R]
  - The option to skip questions had no effect on breakoff.
  - Mobile optimisation, shorter length and lower design complexity reduced it. Complexity included grids, sliders and drop-downs.
- The counterweight is Rashid et al. 2002: unanswerable questions are what make people quit. A «не знаю» on a question novices genuinely can't answer, such as acidity, is right. On answerable questions it invites low-effort answers.

**Showing a running result count.** I found no research on this for quizzes. Treat it as untested.

**So for QQ:** keep it to 3–5 short, answerable steps on one screen each, with a step counter, Back that keeps the earlier answers, and no jargon without an in-place explanation. Put «не знаю» only on the one taste question, and don't treat the vendor completion rates as a target.

---

## 2. Preference elicitation in recommender cold start

**Informative vs answerable** (Rashid et al. 2002, IUI). [R]
- Offline: 7,335 users and 2.7M ratings. Online: 351 new users.
- Pure entropy (the "most informative" items) performed worst, because users couldn't rate items they hadn't tried.
- Popularity and popularity×entropy balanced effort and accuracy best.
- The lesson is that a question is worth only as much as the share of people who can answer it truthfully.

**Active-learning surveys** (Elahi, Ricci & Rubens 2016, Computer Science Review 20:29–50). [R, review]
- Strategies are classed as non-personalised vs personalised and as single vs combined heuristics.
- Non-personalised strategies (the same questions for everyone, such as popularity) are simple and work with zero data, but are less accurate.
- Personalised and adaptive strategies are more accurate but need data and training.
- For a shop with 25 products and a small user base, the non-personalised, fixed-question end is the realistic one.

**Choice-based elicitation.**
- **Loepp, Hussein & Ziegler 2014, CHI** [R]. N = 35, within-subjects.
  - Users made 5 binary choices between two sets of example items, each set high or low on one latent factor, with a "don't care" option at every step.
  - Compared with rating 10 popular items and with manual search, it gave higher perceived control and lower effort.
  - Compared with the rating baseline it gave higher trust.
  - It was the best option when users had no search goal. Manual search was better when they had one.
  - p-values were reported, but no effect sizes.
- **Graus & Willemsen 2015, RecSys short paper** [R]. Choosing from diverse sets that are narrowed iteratively took less effort and gave "more satisfying recommendations" than rating-based elicitation. I could not verify the sample. [NV]
- **Graus & Willemsen 2016, IntRS** [R]. Follow-up with 89 choosers and 71 surveyed. Choice-based elicitation pulls users towards popular items, which in turn makes the recommendations more popular.

**Attributes vs items; novices vs experts.**
- **Kramer 2007, Journal of Marketing Research 44:224–233** [R]. Novices, but not experts, were more likely to accept a personalised recommendation when the measurement task was transparent, meaning they could see which preference they were stating.
- **Häubl & Trifts 2000, Marketing Science 19:4–21** [R]. An attribute-based recommendation agent cut search effort and improved decision quality. Users there were asked for attribute weights, which suits people who know the attributes. [NV for N]
- **Critiquing** (Chen & Pu 2012, User Modeling and User-Adapted Interaction 22:125–150, survey) [R, NV for details]. Critiques such as "like this, but less bitter" let users refine from a concrete example. System-suggested critiques ease the load on users who can't phrase what they want.
- **Wilson & Schooler 1991, Journal of Personality and Social Psychology 60:181–192** [R]. Study 1 had 49 students rate strawberry jams. Asking them to analyse reasons for their liking lowered agreement with expert rankings. Introspection about taste can make stated preferences worse.

**So for QQ:** "what do you drink now" and "milk / brewing method" are the right questions, because everyone can answer them about things they know. The taste question should be a choice between two concrete options ("chocolate-nutty like X" vs "bright-fruity like Y") with «не знаю», not a rating of an attribute they have no word for. Make it visible which answer moved the result, since that helps novices accept it (Kramer).

---

## 3. Result form: one, a few or a list

**Meta-analyses.**
- **Scheibehenne, Greifeneder & Todd 2010, Journal of Consumer Research 37:409–425** [R]. 50 experiments, 63 conditions, N = 5,036.
  - Mean effect d = 0.02, "virtually zero", with high heterogeneity (I² = 68%).
  - Prior expertise or preferences favoured larger sets.
- **Chernev, Böckenholt & Goodman 2015, Journal of Consumer Psychology 25:333–358** [R]. 99 observations, N = 7,202.
  - Overload is reliable once four moderators are accounted for: choice-set complexity, task difficulty, preference uncertainty and an effort-minimising goal.
  - First-time coffee buyers score high on preference uncertainty and on the effort-minimising goal, which is the group most at risk.

**Recommender studies.**
- **Bollen, Knijnenburg, Willemsen & Graus 2010, RecSys** [R]. Compared top-5, top-20, and top-5 plus 15 lower-ranked items.
  - The high-quality top-20 looked more attractive but was harder to choose from, so satisfaction ended up about the same as with top-5.
  - Users searched longer in large attractive sets.
  - I could not verify the sample size here. [NV]
- **Willemsen, Graus & Knijnenburg 2016, User Modeling and User-Adapted Interaction 26:347–389** [R].
  - Study 1b (N = 78) varied diversity (low/high) and list length (5/10/20). Choice difficulty rose with length, and the high-diversity 5-item list was the easiest.
  - The diverse 5-item list was as satisfying as the 10- and 20-item lists.
  - Study 2 (N = 159) varied diversity (top-N/medium/high) and length (5/20). Medium diversification lowered difficulty without lowering predicted quality.
  - For 5-item lists, satisfaction rose with diversity, and a high-diversity 5-item list matched a 20-item list.

**"One best plus alternatives in different directions."** This has direct support.
- **Pu & Chen 2006, IUI** [R]. Survey of 53 plus a user study of 72.
  - The interface shows the best match on top, then about 4 categories of trade-off alternatives with titles such as "cheaper and faster, but heavier".
  - Compared with a ranked list with "why" notes, it beat the list on perceived competence (3.31 vs 2.75) and intention to return (3.27 vs 2.67). Both p < .001.
  - It also had lower perceived effort, with the same completion time.
- **Chen & Pu 2008, RecSys** [R]. N = 120, China vs Switzerland. The same organised interface was rated higher on recommendation quality than the list. Decision accuracy was the same.

**So for QQ:** show one main coffee plus 2 alternatives, each one step away in a named direction ("если хочется ярче", «если хочется мягче/под молоко»), not a ranked top-5 of near-identical coffees. Two or three items with clear differences beat a longer list for this audience.

---

## 4. Explanations

**Aims and effectiveness.**
- Tintarev & Masthoff set out seven aims of explanations: transparency, scrutability, trust, effectiveness, persuasiveness, efficiency and satisfaction.
- **Tintarev & Masthoff 2012, User Modeling and User-Adapted Interaction 22:399–439** [R]. Four experiments (N = 46, 33, 47, 48; movies and cameras), measuring effectiveness as the gap between the rating before and after trying the item.
  - Personalised feature explanations raised satisfaction but were less effective than non-personalised ones. In the cameras study this was significant.
  - Explanations cut "can't judge" opt-outs from 35.6% to 15.9%.
  - Liking an explanation is not the same as being helped by it.

**Explanation types.**
- **Gedikli, Jannach & Ge 2014, International Journal of Human-Computer Studies 72:367–382** [R]. 10 explanation types compared.
  - Content-based explanations (personalised tag clouds of item features) did best on perceived transparency and satisfaction.
  - They cost more cognitive effort.
  - I did not verify N. [NV]
- **Herlocker, Konstan & Riedl 2000, CSCW** [R, NV]. As I recall the paper: 21 explanation interfaces, about 78 MovieLens users. Simple histograms of similar users' ratings persuaded most, and some complex displays did worse than no explanation. The study measured persuasion, not accuracy.

**Explanation quality and trust.**
- **Kunkel et al. 2019, CHI** [R]. N = 93 (per Kunkel's dissertation), two rounds of recommend–watch–rate.
  - Human explanations were rated better than the system's similarity-based ones.
  - The system's more accurate recommendations were perceived as no better, because their explanations were weaker.
  - Explanation quality fed trust.
- **Kizilcec 2016, CHI** [R]. N = 103, peer grades.
  - When the outcome was worse than expected, a short procedural explanation of how the result was computed kept trust level (3.72 vs 3.70).
  - Minimal information lost trust (3.02 vs 4.18), and so did full detail (2.77 vs 3.89).
  - When expectations were met, transparency didn't matter.
  - A medium amount of "how we got this" protects against disappointment.

**Mentioning a downside.**
- **Eisend 2006, International Journal of Research in Marketing 23:187–198** [R, meta-analysis, NV for effect sizes]. Two-sided messages raise perceived credibility. The amount of negative information has a curvilinear relation with brand attitude: some helps, too much hurts.
- Pizzutti et al. 2016 note that Eisend found no moderation by the importance of the negative attribute.
- **Pechmann 1992, Journal of Marketing Research** [R, NV]. The downside works best when it is the natural flip side of a stated strength. For coffee that would be something like "a bright, juicy acidity, so less 'classic bitterness'".

**Starting point vs verdict, and certainty.** I found no experiment testing "starting point" framing for recommendations. The nearest evidence:
- Kizilcec: a brief procedural note protects trust when the result disappoints.
- Tintarev & Masthoff: overselling raises satisfaction now, not accuracy.
- Section 5: an authoritative label can itself shift the taste experience. That is an inference, not tested.

**So for QQ:** give 2–3 plain, content-based reasons tied to the person's own answers ("вы пьёте с молоком → плотное тело и шоколад"). Name one honest trade-off that follows from the strength, and add one line on how the pick was made and how it will be adjusted after feedback. Avoid "people like you" claims and long technical detail.

---

## 5. Persona and type labels

**Barnum effect.**
- Forer 1949 [R]: 39 students rated the same horoscope-derived profile 4.3 out of 5 for accuracy.
- Dickson & Kelly 1985, Psychological Reports 57:367–382 (review) [R]. Acceptance rises when statements are favourable and are said to be "for you" specifically. The status of the assessor matters little.
- Implication: people will happily accept a type label, so their acceptance says nothing about whether it is accurate.

**Labels change self-perception and choice.**
- **Summers, Smith & Reczek 2016, Journal of Consumer Research 43:156–178** [R]. In one study, 188 students were shown an ad they believed was based on their browsing ("Refreshingly Sophisticated…").
  - They rated themselves as having more sophisticated tastes and were more likely to buy.
  - Believing the ad was based on demographics did nothing.
  - The label only worked when it was plausible: outdoor ads had no effect on people not into the outdoors.
- Tybout & Yalch 1980, Journal of Consumer Research [R, NV]: telling people they were "above-average" citizens raised later voting. This is the classic labelling effect.

**Labels and expectations change taste.**
- **Lee, Frederick & Ariely 2006, Psychological Science 17:1054–1058** [R]. Nearly 400 pub patrons.
  - Beer with balsamic vinegar was preferred when tasted blind, and also when the vinegar was revealed after tasting.
  - It was preferred less only when the vinegar was revealed before tasting.
  - Prior information shapes the experience itself.
- **Plassmann et al. 2008, PNAS 105:1050–1054** [R]. N = 20 in fMRI.
  - The same wine was rated more pleasant with a higher stated price (r = .59), with matching activity in the medial orbitofrontal cortex.
  - Price had no effect on primary taste areas or on intensity ratings.
  - There were no differences eight weeks later without labels.
- **Sörqvist et al. 2013, PLoS ONE 8:e80719** [R]. N = 44 tasted two identical coffees, one labelled "eco-friendly". 74% of participants high in sustainability concern preferred the labelled cup. Low-concern participants showed no preference.
- **Wansink, Payne & North 2007** ("Fine as North Dakota wine", Physiology & Behavior) found a label effect on wine and meal ratings. Caution: many of Wansink's papers were retracted in 2018 and his lab's data practices were discredited. Don't rely on this one.

**So for QQ:** a persona label will be accepted and may nudge both self-image and taste ratings towards the label. That is a reason to keep it modest: describe the region ("мягкие, шоколадные") rather than a flattering identity ("Bold Explorer"), so later feedback measures the coffee, not the label. If you use a name, make it descriptive and easy to revise.

---

## 6. Taste: stated vs tasted, novices, milk, Russian data

**Stated vs blind preference.**
- **Great American Coffee Taste Test, 2023** (James Hoffmann with Cometeer) [V; observational, self-selected fans].
  - About 5,000 kits were sent and about 4,040 surveys completed. Participants tasted four coffees: light, medium, dark and a fermented natural.
  - Cometeer's press release says only 55% of stated roast preferences "match" what people preferred in the tasting. The method behind this figure is not given.
  - In a hobbyist analysis of the public dataset, the lowest self-rated expertise group (1–2) favoured "chocolatey" 24% vs "fruity" 7%. The 9–10 group favoured chocolatey 5% vs fruity 36%. Lattes were the top drink in low-expertise groups.
  - The sample is heavily skewed: mostly male, mostly Hoffmann's audience.
- **Cotter et al. 2021, Journal of Food Science** (doi 10.1111/1750-3841.15561) [R].
  - 118 Californian black-coffee drinkers tasted 27 brews of one medium roast that varied in strength and extraction.
  - Two preference clusters emerged. One liked more intense coffee with acidity and roasted notes. The other liked subtler cups and disliked high acidity and bitterness.
  - Preferences were "spread over a wide range" of strengths.
  - The material I could access did not test whether self-reports predicted cluster membership.
- **Goldstein et al. 2008, Journal of Wine Economics** [R]. 6,175 blind tastings by 506 people. Non-experts rated pricier wines slightly lower, about 4 points per 10× price on a 100-point scale. Experts rated them somewhat higher (marginal significance).
- **Frøst & Noble 2002, American Journal of Enology and Viticulture 53:275–284** [R]. N = 57. Wine knowledge and sensory skill barely predicted liking. Individual differences dwarfed both.
- The wine-industry "talk dry, drink sweet" idea and the Hanni/Utermohlen "vinotypes" (about 1,500 online questionnaires) are PR and questionnaire work, not blind tests. [V]

**What novices can name.** The coffee flavour wheel (Spencer et al. 2016, Journal of Food Science; 72 experts and trained panellists sorting 99 terms, no tasting) is an expert lexicon, not consumer language. The consumer evidence above suggests novices reliably handle:
- "chocolatey/nutty", "strong", "bitter", "with milk"
- "sour" (usually as a negative)

"Fruity", "floral" and "juicy" belong to experts.

**Milk.**
- Cleve et al. 2025, Journal of Agricultural and Food Chemistry (doi 10.1021/acs.jafc.4c12852) [R]. Medium and dark roasts were tasted plain or with 30% cow or oat milk.
  - Milk added dairy, caramel and vanilla notes and reduced perception of coffee flavours.
  - It did not systematically change the release of coffee aroma compounds, so the effect is perceptual masking.
- That casein reduces coffee bitterness is a commonly cited background claim, for example in Li, Hayes & Ziegler 2015.
- I found no direct sensory study on milk and perceived acidity. The claim that milk mutes or clashes with bright acidity is plausible craft knowledge, not tested evidence here.

**Russian data** [industry panels and surveys, not peer-reviewed].
- **ICMR household panel** (about 20,000 households, Retail.ru, 19 Nov 2026):
  - Instant is 62% of home coffee purchases. Ground and beans are 22% and rising.
  - Of coffee drunk outside the home, 75% is with dairy milk, 22% black and 3% with plant milk.
  - Cappuccino is 54% of out-of-home orders and latte 30%.
- **ЮMoney survey** (N > 1,500, Sept 2025):
  - Home methods: instant 47%, coffee machine 32%, turka 11%, moka pot 5%, drip bags 4%, AeroPress 1%.
  - 29% add milk or cream, 23% drink it black, 30% add sugar, 8% use plant milk.
- **X5** (its own sales data, 2024): in takeaway coffee, latte, americano and cappuccino each take 29%.
- **O'Key** (sales, 2025): demand for French presses fell 54% and for turkas 30%. Coffee machine sales doubled.

**So for QQ:** don't trust a stated "I like dark/light roast" or a named flavour from a novice. Anchor on behaviour (milk, method, current coffee), which Russian data says is mostly milk drinks and instant or machine coffee. Offer the taste question only in novice words (шоколадный vs яркий, кислинка да/нет) and expect to correct it after the first bag.

---

## 7. Saving the profile and feedback loops

**Saving and editing.**
- NN/g (Schade 2016) [UX]: preferences change, so users need easy ways to "manage options over time".
- **NN/g, Harley 2018** [UX]. "Individualized Recommendations: Users' Expectations & Assumptions", 8 participants.
  - New users don't expect accuracy, and they spot personalisation through labels like "for you".
  - Users rarely use hide or dismiss controls because the effort seems too high.
  - They did give feedback where a bad pick had a real cost, citing Stitch Fix returns.
  - A coffee bag that was a miss is exactly that kind of cost.

**Industry feedback models.**
- **Stitch Fix** (Algorithms Tour) [V, descriptive]. A style profile at signup that can be edited later, then per-item keep/return and feedback on each shipment.
  - Fit is treated as multidimensional.
  - Mixed-effects models track how preferences drift.
- **Netflix** (5 April 2017) [V]. Replaced 5 stars with thumbs because members misread stars as a public average.
  - Tests in 2016 with "hundreds of thousands" of members gave 200% more ratings.
  - Netflix published no accuracy results.
- **YouTube** (2009 blog) [V]: star ratings were almost all 5s, with some 1s and hardly any 2–4. This is the known J-shaped distribution.

**Just-about-right (JAR) scales** ("too much / just right / not enough") [R, sensory science].
- **Standard reference:** ASTM MNL63, *Just-About-Right (JAR) Scales* (Rothman & Parker eds., 2009).
- **Penalty analysis pitfalls** (Parcon 2013, JSM proceedings; Schraidt 2009 in MNL63):
  - Each attribute is tested separately, so false positives multiply.
  - The model leaves out other attributes, so penalties are overestimated.
  - It gives no ranking of which skew matters most.
  - Liking data are non-normal.
  - Practitioners usually ignore skews held by fewer than about 20% of respondents.
- **Two judgements in one answer:** a JAR answer mixes "how intense" with "how acceptable" (Li, Hayes & Ziegler 2014, Food Quality and Preference 37:71–78). JAR and ideal-point scales gave similar insights there.
- **JAR as a target misleads:** Li, Hayes & Ziegler 2015 (Food Quality and Preference 42:27–36; N = 388, coffee-milk drinks) found that optimising overall liking produced a better product than minimising deviations from "just right". The JAR-optimised drinks had more coffee and less milk than people actually liked best.
- **Middle bias:** answers drift towards "just right", and the perceived ideal shifts towards the middle of whatever range was offered (Johnson & Vickers 1987, Journal of Sensory Studies) [NV].
- **Question context:** asking attribute questions can shift liking ratings (Popper et al. 2004, Food Quality and Preference 15:853–858). Replication results are mixed.

**So for QQ:** save the profile as an editable region, labelled «подобрано для вас» and easy to change. After delivery, ask first a binary or 3-point overall question («понравилось / так себе / не моё»). Then, only if the answer wasn't positive, ask one or two directional JAR questions (горчит/кислит, «слишком / в самый раз / мало»). Move the region on overall liking, use the JAR answers only for direction, and don't act on a single small skew.

---

## Gaps (no good evidence found)
- No controlled study of the number of quiz questions vs completion in e-commerce. Only vendor figures exist.
- No public Baymard guideline on product finders or quizzes.
- No study of showing a running result count.
- No experiment on "starting point" vs "verdict" framing of a recommendation.
- No sensory study of milk and perceived acidity in coffee.
- No peer-reviewed Russian consumer sensory data. Only purchase panels and surveys.

---

## References

**Recommenders and elicitation**
- Bollen, D., Knijnenburg, B. P., Willemsen, M. C., & Graus, M. (2010). Understanding choice overload in recommender systems. *RecSys '10*, 63–70. doi:10.1145/1864708.1864724
- Chen, L., & Pu, P. (2008). A cross-cultural user evaluation of product recommender interfaces. *RecSys '08*.
- Chen, L., & Pu, P. (2012). Critiquing-based recommenders: Survey and emerging trends. *User Modeling and User-Adapted Interaction*, 22, 125–150. doi:10.1007/s11257-011-9108-6
- Elahi, M., Ricci, F., & Rubens, N. (2016). A survey of active learning in collaborative filtering recommender systems. *Computer Science Review*, 20, 29–50.
- Graus, M. P., & Willemsen, M. C. (2015). Improving the user experience during cold start through choice-based preference elicitation. *RecSys '15*, 273–276. doi:10.1145/2792838.2799681
- Graus, M. P., & Willemsen, M. C. (2016). Can trailers help to alleviate popularity bias in choice-based preference elicitation? *IntRS workshop, CEUR-WS 1679*.
- Häubl, G., & Trifts, V. (2000). Consumer decision making in online shopping environments: The effects of interactive decision aids. *Marketing Science*, 19(1), 4–21.
- Kramer, T. (2007). The effect of measurement task transparency on preference construction and evaluations of personalized recommendations. *Journal of Marketing Research*, 44(2), 224–233.
- Loepp, B., Hussein, T., & Ziegler, J. (2014). Choice-based preference elicitation for collaborative filtering recommender systems. *CHI '14*.
- Pu, P., & Chen, L. (2006). Trust building with explanation interfaces. *IUI '06*.
- Rashid, A. M., Albert, I., Cosley, D., Lam, S. K., McNee, S. M., Konstan, J. A., & Riedl, J. (2002). Getting to know you: Learning new user preferences in recommender systems. *IUI '02*.
- Willemsen, M. C., Graus, M. P., & Knijnenburg, B. P. (2016). Understanding the role of latent feature diversification on choice difficulty and satisfaction. *User Modeling and User-Adapted Interaction*, 26, 347–389. doi:10.1007/s11257-016-9178-6

**Choice overload**
- Chernev, A., Böckenholt, U., & Goodman, J. (2015). Choice overload: A conceptual review and meta-analysis. *Journal of Consumer Psychology*, 25(2), 333–358.
- Scheibehenne, B., Greifeneder, R., & Todd, P. M. (2010). Can there ever be too many options? A meta-analytic review of choice overload. *Journal of Consumer Research*, 37(3), 409–425.

**Explanations and messages**
- Eisend, M. (2006). Two-sided advertising: A meta-analysis. *International Journal of Research in Marketing*, 23(2), 187–198.
- Gedikli, F., Jannach, D., & Ge, M. (2014). How should I explain? A comparison of different explanation types for recommender systems. *International Journal of Human-Computer Studies*, 72(4), 367–382. doi:10.1016/j.ijhcs.2013.12.007
- Herlocker, J. L., Konstan, J. A., & Riedl, J. (2000). Explaining collaborative filtering recommendations. *CSCW '00*.
- Kizilcec, R. F. (2016). How much information? Effects of transparency on trust in an algorithmic interface. *CHI '16*, 2390–2395.
- Kunkel, J., Donkers, T., Michael, L., Barbu, C.-M., & Ziegler, J. (2019). Let me explain: Impact of personal and impersonal explanations on trust in recommender systems. *CHI '19*. doi:10.1145/3290605.3300717
- Pechmann, C. (1992). Predicting when two-sided ads will be more effective than one-sided ads: The role of correlational and correlative inferences. *Journal of Marketing Research*, 29(4), 441–453.
- Pizzutti, C., Basso, K., & Gonçalves, M. (2016). The effect of the discounted attribute importance in two-sided messages. *European Journal of Marketing*, 50(9/10).
- Tintarev, N., & Masthoff, J. (2012). Evaluating the effectiveness of explanations for recommender systems. *User Modeling and User-Adapted Interaction*, 22, 399–439.

**Labels, expectations and the Barnum effect**
- Dickson, D. H., & Kelly, I. W. (1985). The "Barnum effect" in personality assessment: A review of the literature. *Psychological Reports*, 57, 367–382.
- Forer, B. R. (1949). The fallacy of personal validation. *Journal of Abnormal and Social Psychology*, 44, 118–123.
- Lee, L., Frederick, S., & Ariely, D. (2006). Try it, you'll like it. *Psychological Science*, 17(12), 1054–1058.
- Plassmann, H., O'Doherty, J., Shiv, B., & Rangel, A. (2008). Marketing actions can modulate neural representations of experienced pleasantness. *PNAS*, 105(3), 1050–1054.
- Sörqvist, P., et al. (2013). Who needs cream and sugar when there is eco-labeling? *PLoS ONE*, 8(12), e80719.
- Summers, C. A., Smith, R. W., & Reczek, R. W. (2016). An audience of one: Behaviorally targeted ads as implied social labels. *Journal of Consumer Research*, 43(1), 156–178.
- Tybout, A. M., & Yalch, R. F. (1980). The effect of experience: A matter of salience? *Journal of Consumer Research*, 6(4), 406–413.
- Wansink, B., Payne, C., & North, J. (2007). Fine as North Dakota wine. *Physiology & Behavior*, 90(5), 712–716. (Author's work is widely discredited; see the 2018 retractions.)

**Taste and sensory science**
- Cleve, N., et al. (2025). Effects of roasting level and milk addition on in vivo aroma release and perception of coffee. *Journal of Agricultural and Food Chemistry*. doi:10.1021/acs.jafc.4c12852
- Cotter, A. R., Batali, M. E., Ristenpart, W. D., & Guinard, J.-X. (2021). Consumer preferences for black coffee are spread over a wide range of brew strengths and extraction yields. *Journal of Food Science*. doi:10.1111/1750-3841.15561
- Frøst, M. B., & Noble, A. C. (2002). Preliminary study of the effect of knowledge and sensory expertise on liking for red wines. *American Journal of Enology and Viticulture*, 53(4), 275–284.
- Goldstein, R., et al. (2008). Do more expensive wines taste better? Evidence from a large sample of blind tastings. *Journal of Wine Economics*, 3(1), 1–9.
- Johnson, J., & Vickers, Z. (1987). Avoiding the centering bias or range effect when determining an optimum level of sweetness in lemonade. *Journal of Sensory Studies*, 2, 283–292.
- Li, B., Hayes, J. E., & Ziegler, G. R. (2014). Just-about-right and ideal scaling provide similar insights into the influence of sensory attributes on liking. *Food Quality and Preference*, 37, 71–78.
- Li, B., Hayes, J. E., & Ziegler, G. R. (2015). Maximizing overall liking results in a superior product to minimizing deviations from ideal ratings. *Food Quality and Preference*, 42, 27–36.
- Parcon, J. (2013). Penalty analysis handout. *JSM Proceedings, Survey Research Methods Section*.
- Popper, R., et al. (2004). The effect of attribute questions on overall liking ratings. *Food Quality and Preference*, 15, 853–858.
- Ristenpart, W. D., Cotter, A. R., & Guinard, J.-X. (2022). Impact of beverage temperature on consumer preferences for black coffee. *Scientific Reports*, 12, 20621.
- Rothman, L., & Parker, M. J. (Eds.) (2009). *Just-About-Right (JAR) Scales: Design, Usage, Benefits, and Risks* (ASTM MNL63).
- Spencer, M., Sage, E., Velez, M., & Guinard, J.-X. (2016). Using single free sorting and multivariate exploratory methods to design a new Coffee Taster's Flavor Wheel. *Journal of Food Science*, 81(12).
- Wilson, T. D., & Schooler, J. W. (1991). Thinking too much: Introspection can reduce the quality of preferences and decisions. *Journal of Personality and Social Psychology*, 60(2), 181–192.

**Survey methods**
- Galesic, M., & Bosnjak, M. (2009). Effects of questionnaire length on participation and indicators of response quality in a web survey. *Public Opinion Quarterly*, 73(2), 349–360.
- Hanson, T., Aizpurua, E., Fitzgerald, R., & Vukovic, M. (2025). Surely shorter is better? *Survey Research Methods*.
- Krosnick, J. A., et al. (2002). The impact of "no opinion" response options on data quality. *Public Opinion Quarterly*, 66(3), 371–403.
- Mavletova, A., & Couper, M. P. (2015). A meta-analysis of breakoff rates in mobile web surveys. In *Mobile Research Methods* (Ubiquity Press). doi:10.5334/bar.f
- Villar, A., Callegaro, M., & Yang, Y. (2013). Where am I? A meta-analysis of experiments on the effects of progress indicators for web surveys. *Social Science Computer Review*, 31(6), 744–762.

**UX research**
- Baymard Institute (2024). Product Finding research launch (219 sessions); Sousa, S. (2024). Explain industry-specific filters (62% don't); "12 'Quiz' Design Examples" (paywalled).
- Budiu, R. (2017). Wizards: Definition and design recommendations. NN/g.
- Harley, A. (2018). Individualized recommendations: Users' expectations & assumptions. NN/g.
- Kendrick, A. (2020). Mobile-app onboarding: An analysis of components and techniques. NN/g.
- Schade, A. (2016). 7 tips for successful customization. NN/g.

**Vendor and company claims (no published method)**
- Cometeer / J. Hoffmann (2023). Great American Coffee Taste Test press release (PR Newswire) and public dataset; secondary analyses by C. J. Robinson and J. Ciz (GitHub pages).
- Interact (2026). Quiz Conversion Rate Report.
- Netflix (2017). Goodbye stars, hello thumbs (about.netflix.com); TechCrunch, 16 Mar 2017.
- Octane AI. How to audit and optimize your product quiz (blog).
- Outgrow (2026). User engagement benchmarks.
- Stitch Fix. Algorithms Tour (algorithms-tour.stitchfix.com).
- YouTube (2009). Five stars dominate ratings (YouTube blog).

**Russian market data**
- ICMR household panel via Retail.ru, 19 Nov 2026.
- O'Key via TASS / Mail.ru, 18 Sep 2025.
- X5 Club via Retail.ru, 7 May 2025.
- ЮMoney / Check Index via Retail.ru, 1 Oct 2025.
