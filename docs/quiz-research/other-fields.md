# Preference quizzes and recommenders in other taste and fit products

Research for the QQ Coffee first-buyer quiz (3–6 steps, result shown as a place on a taste map, coffees with plain-language reasons, saved to the account, refined by feedback after delivery).

Date of research: 25 Nov 2026.

## How the evidence was gathered

Each claim carries one of three evidence levels:

- **SEEN (live code):** I read the quiz's question and answer text myself, in the page's HTML or embedded JSON fetched on 25 Nov 2026. This applies to two quizzes: Winc's Palate Profile and Diageo's What's Your Whisky.
- **REPORTED:** the claim comes from the company's own help, blog or newsroom pages, or from press and reviews. It is attributed in the text.
- **UNVERIFIED:** I could not see it myself and found no reliable second source.

The Wayback Machine was blocked in this environment, so no archived snapshots were used. Several quiz flows render only in the browser and could not be read: Firstleaf, Scentbird (403), Master of Malt (bot check), Hotel Chocolat, Function of Beauty and Stitch Fix.

Quotations are kept to short phrases.

---

## 1. Product-by-product findings

### 1.1 Winc Palate Profile (wine, US). Bright Cellars has been part of it since Oct 2024. SEEN (live code)

- **URL:** https://www.winc.com/pages/palate-profile. brightcellars.com now redirects to winc.com/pages/bright-cellars-activation, and the FAQ there says Bright Cellars customers "officially joined the Winc Family in October 2024".
- **Steps:** 6, shown in a numbered stepper. Some steps are labelled ("Sweet or Dry?", "Regions", "Food Pairings", "Finish"). The Next button stays disabled until the step has an answer.
- **Questions and options, verbatim:**
  1. "Do you prefer red or white wine?" The helper line reads "Before we get serious we need to know the basics." Options: A Mix of Reds & Whites / All Reds / All Whites / Mostly Reds / Mostly Whites.
  2. "What flavors do you like?" The helper line reads "Think about your favorite cocktails and drinks…". This is a multi-select grid of picture cards with heart icons: Strawberry, Raspberry, Lime Zest, Blackberry, Melon, Pineapple, Mushroom, Green Apple, Black pepper, Honey, White Peach, Baking spice.
  3. "Skittles or M&Ms?" The helper line says the answer "tells us if you prefer sweet or tart flavors". Options: All Skittles / All M&Ms / "Both. In my mouth. At the same time."
  4. "You win the lottery, where are you traveling to first?" (multi-select): United States, Austria, France, Portugal, Chile, Argentina.
  5. "What are you ordering next from Uber Eats?" (multi-select): Cheese, Pizza, Fish, BBQ, Sushi, Thai, Salad, Burgers, Pasta with red sauce, Veggies, Chocolate Cake, Poultry.
  6. An email field, then "See your wines". The closing copy reads "We've read your answers and your aura."
- **Proxies used:** flavours drawn from drinks, candy (sweet vs tart), travel (region) and food pairing.
- **"I don't know":** there is no such option. "Both" on the candy question is the only neutral answer.
- **Going back:** answers are saved to a cookie (`ppq_response`, kept 7 days) and filled back in when the page is reopened. The stepper lets the user move between steps.
- **Result:** "Our wine picks, just for you!" is a box of 6 wines, each shown with "Pairs well with" and "Tasting Notes". The page says "feel free to swap them out" and "Four days before your next order ships, we'll recommend new wine selections based on your taste preferences and past ratings."
- **Explanation:** each wine shows tasting notes and pairings. The page gives no reason tying a wine to the user's answers.
- **What the code shows (important):** the client sends the full answer set and the email to a backend endpoint (`/a/fgc/ppq`). However, the redirect to the results page carries only the red/white split (for example `?reds=4&whites=2`). Whether the backend uses the flavour, candy, region and food answers cannot be seen from outside. In the visible flow, only question 1 demonstrably changes the result. The other answers may mainly serve engagement and marketing data.
- **Feedback loop:** "Rate & repeat": "After you drink, log into your account, rate your wines, and see which matches you get next time."
- **Earlier version (REPORTED):** reviewers in 2019 described six questions, each with a short note on why it is asked, including "How do you take your coffee?" and "Do you like citrus?", and the whole quiz took under a minute (Prehook; A Practical Wedding).
- **Numbers and failures (REPORTED):**
  - Winc reported a $48 CAC, $173 LTV and 3.5M+ ratings (Prehook).
  - Winc filed for Chapter 11 on 30 Nov 2022. DTC revenue had fallen 22% year on year as buyers went back to stores (Modern Retail).

### 1.2 Bright Cellars (wine, US; now merged into Winc). REPORTED

- **URL (old):** brightcellars.com/quiz, which now redirects. Help page: bright-cellars.gorgias.help.
- **Steps:** 7 questions that take "a few minutes".
- **Questions:** chocolate ("What is the one type of chocolate you could eat for the rest of your life?"), tea ("How do you like your tea?"), juice, hobbies, drinking context (with friends, at the beach), "play it safe" vs "experimental", and wine colour (VinePair, Boing Boing, Harvard RCTOM).
- **Model:** the answers are compared on "18 attributes".
- **Result:** a monthly box of 4 wines. Each match carries a personalised rating, and each bottle comes with an education card. Whether this was a "% match" with a written reason is UNVERIFIED.
- **Feedback:** rating "inform[s] their algorithm". If a member dislikes a wine, Concierge "can update your settings" and add a bonus wine.
- **Numbers (VinePair, c. 2016):** about **30 wines on hand**, 17,000 users, 10,000 reviews in the first year, and **50–60% of customers rate wines**. A catalogue of about 30 is close to QQ's 25. The same article quotes testers' mixed reviews and a sommelier who argues "an algorithm can't work".

### 1.3 Firstleaf (wine, US). Quiz flow UNVERIFIED; feedback and profile REPORTED

- **URL:** https://www.firstleaf.com/how-it-works. The quiz lives at /a/ui/quiz/1 but renders client-side, so I could not read it.
- **Steps (wineclubreviews.net):** at least 10, some of them multi-select.
  - The user rates named supermarket wines (Robert Mondavi Cabernet, The Prisoner, Ménage à Trois…) and styles ("Oaky Chardonnay", "Argentinian Malbec").
  - Food questions follow (mushrooms, green olives).
  - "How adventurous are you when you look for wine?" offers Cautious / A little / Adventurous.
  - "Where are you on your wine journey?"
- **Interaction (Prehook):** sliders with graphics that change as they move, plus short teaching notes (for example, that Pinot Grigio and Pinot Gris are the same grape).
- **"I don't know":** none named, but questions can be skipped.
- **Result:** shown after the user gives an email. It is 6 bottles that can be swapped, with no stated reason for each pick. The adventurousness setting can be changed later in the profile.
- **Feedback:** thumbs up or thumbs down on each bottle. The company says the quiz "is only a starting point" (Firstleaf wine-school article).
- **WinePrint profile (Firstleaf help centre):**
  - There are separate red and white profiles.
  - Each shows preferred levels of body, sweetness, acidity, tannin and fruit intensity, plus up to 6 tasting notes, top 3 grapes and top 3 regions.
  - Each includes a short **"taste phrase"** the member can say to a sommelier.
  - Detail unlocks in tiers, at **6, 12 and 24 ratings**. Regions start at country level and move to sub-regions as the member rates more.
  - WinePrint "doesn't change your club selections directly, but your ratings do."
- **Numbers (company claims):** "96%" of members enjoy their selection after rating 3 bottles, and 98% of boxes are unique.

### 1.4 Vivino (wine app). REPORTED

- **URLs:** vivino.com/wine-news/introducing-match-for-you and /your-unique-taste-visualized.
- **There is no quiz.** The profile is built only from ratings.
- **Match for You:**
  - The algorithm starts "once you have rated at least five wines".
  - Every wine then shows a 0–100% match, defined as "how confident we are that this will be an excellent wine for you".
  - Matches fall into named bands: **Great Match 70–100%**, Average 40–70%, Low 0–40%.
- **Taste profile:**
  - It is organised as What You've Tried / What You Like / What You Dislike, across 355 styles.
  - The user can edit likes and dislikes directly ("+Style").
  - Level badges mark progress: Explorer 1–5 ratings, Enthusiast 6–25, Expert 26–99, Ambassador 100+.

### 1.5 Naked Wines (wine, UK/US/AU). REPORTED

- **URL:** https://nakedwines.co.uk/ratings
- **No intake quiz was found.** Rating is the main feedback signal.
- **Rating scale:** three options, **"Loved it" / "Liked it" / "Not for you"**. These replaced an older "would buy again" button.
- Ratings drive "similar bottles" and avoidance of similar wines. Each rating shows next to the bottle as the user browses, and notes can be kept private or shared with the winemaker.

### 1.6 Wine Folly "Find your wine preference in a minute" (wine education). REPORTED, from the article text

- **URL:** https://plus.winefolly.com/tips/find-your-wine-preference-in-one-minute
- **Steps:** 4 forced choices between everyday foods:
  1. latte vs black coffee
  2. apple juice vs grapefruit juice
  3. vanilla ice cream vs lemon sorbet
  4. olive tapenade vs blackberry compote
- Each choice maps to a style family (New World / Old World, sweet / dry white, oaked / high-acid, savoury / fruit-forward), and each family lists 3–6 grapes to try.
- **The result is explicitly a starting point.** The article suggests retaking the quiz as tastes change.
- **Related article ("Common Palate"):** it argues most beginners answer the "crowd pleaser" way: both sweet and dry, fruit-forward and creamy. Taste "will evolve".

### 1.7 Majestic Wine "Wine Fitting" (wine retail, UK). REPORTED

- **Sources:** Decanter (2019); The Drinks Business (2019).
- **Online version:** a short test produces a wine profile with a **"top pick" style and 4 suggested wines per style**.
- **In store:** a customer blind-tastes 8 wines and gets a profile of likes and dislikes.
- Shelves are colour-coded by style, for example pink for light, fruity reds.
- **Market context cited:** only 12% of UK consumers say they understand a wine list, and 25% say they know nothing about wine.
- **Whether the service is still running: UNVERIFIED.**

### 1.8 Diageo "What's Your Whisky" (single malts, malts.com). SEEN (live code)

- **URL:** https://malts.com/en/whats-your-whisky. The quiz runs in a modal, and its question text is in the page's embedded data.
- **Steps:** an intro ("Hello, we're here to help you discover your whisky palate."), then **11 food questions**, each with a short video, answered on a **5-point hedonic scale**. "Back" and "Skip" controls exist.
- **Questions and anchor options, verbatim (option 1 → option 5):**
  1. "Do you like fresh rosemary?" No I'll pass → I love rosemary
  2. "How do you feel about chillies?" Get them away from me → Feed me fire!!!
  3. "Do you like cinnamon apple pie?" Not at all! → It's amazing!
  4. "Do you like dried apricots?" Eww no → Ooo my favourites
  5. "What are your thoughts on orange juice?" The worst sort of juice! → Who doesn't love OJ?!
  6. "Do you like fresh ginger?" No, I'll pass. → I love every type of ginger. **The midpoint is "Not sure!"**
  7. "How often do you eat bananas?" Never! → Eating one right now
  8. "Fancy a scoop of vanilla ice cream?" Boring! → I'll take the tub!
  9. "Do you like piña coladas?" I'd rather get caught in the rain → Yes, bring me a pitcher!
  10. "How often do you eat raisin bran cereals?" Never! → Every morning
  11. "Do you like treacle?" Nope, far too sweet! → Oooo yes, love it!. **The midpoint is "What's that?"**
- **"I don't know":** the neutral midpoint doubles as "I don't know this food" on unfamiliar items, and Skip is available.
- **Result** (UI strings in the data):
  - "Your flavour profile is {{flavour}}", one of four families: sweet, fruity, spicy, smoky.
  - A segmented flavour chart: "Click on each segment for more detail on each flavour."
  - One headline pick: "Based on your unique flavour profile, we recommend {{productName}}".
  - More whiskies under "Tailored to your taste", each marked "{{percentage}} matched to your profile".
  - Recipes and experiences under "Hand-picked just for you", and a "Retake the quiz" option.
- **The four family descriptions use everyday language.** Sweet reads: "Someone who always says yes to looking at the dessert menu…". Spicy reads: "Coming in hot…".
- **Saving:** "Save your personal flavour profile to your Malts Club account". Saved results then give access to "all expert recommendations based on your flavour profile".
- **Numbers (REPORTED):**
  - The tool launched Nov 2019 using Vivanda's FlavorPrint AI, in 9 countries and 6 languages (BeverageDaily).
  - The agency case study says the model maps "33 dimensions" and "over 500 flavour datapoints" (Behance).
  - BeverageDaily (2019) said it returned **one** recommended malt. The live version shows one headline pick plus a % list.

### 1.9 Master of Malt flavour groups (spirits retail, UK). Groups REPORTED; quiz UNVERIFIED

- **URL:** https://www.masterofmalt.com/whisky-profiles. Five flavour groups: Smoky & Peaty, Fruity (Fresh Fruit) & Vanilla, Rich Fruit & Nut, Fragrant & Floral, Cereal & Oak. The site says the groups were drawn from staff brainstorming and Dave Broom's "flavour camps".
- The page says "take our fun quiz", but the site served a bot check and I could not open it.

### 1.10 Flaviar (spirits club). REPORTED

- **Flavor Spiral:** the 9 most prominent flavours per bottle, drawn as an image, built from community and expert opinions.
- It is a way of describing a bottle, not a personal profile. No intake quiz was verified.

### 1.11 Beerwulf (beer retail, EU). REPORTED

- **URL:** https://beerwulf.com/en-gb/taste-segments
- **No quiz was found.** Beer is grouped into 10 named taste segments (Accessible & Refreshing, Crisp & Refreshing, Floral & Fruity, Hoppy & Bitter, Caramel & Honey, Spicy & Herbal, Strong & Savory, Dark & Rich, Barrel-aged, Experimental).
- Each segment has a short description and example styles. This is a "region" vocabulary used for browsing, not a personal profile.

### 1.12 Hotel Chocolat "Love Match" (chocolate, UK). Labels SEEN on the landing page; questions REPORTED

- **URLs:** https://www.hotelchocolat.com/uk/i/love-match; the quiz is at /uk/i/love-match-quiz, which renders client-side.
- **Six persona-style profiles:**
  - Names: Patisserie Dreamer, Exuberantly Fruity, Serious Dark Fix, Notably Nutty, Milk Devotee, A Twist of Tipsy.
  - Each has a second-person blurb ("Are you the type who checks the dessert menu first?") and a "Shop now" link.
  - Shop categories are built around the same profiles (for example "Serious Dark Fix Boxed Selections").
- **Example questions (company blog):** "deep and bold vs. mellow and creamy", "chocolate-centric vs. filled and flavoured", and whether the user likes alcohol in chocolate.
- **Love Match Live (company blog):** an in-store 30-minute guided tasting that "reveal[s]" the profile. It ran in 98 stores in Feb 2024, with over 4,000 attendees and over 25,000 samples.

### 1.13 Cocoa Runners (craft chocolate subscription, UK). REPORTED

- **No quiz was found.** Every bar is tagged with type, texture, strength and 9 flavour-note families: Green, Fruity, Floral, Creamy, Citrus, Chocolatey, Spicy, Roasted, Earthy. The page says these were narrowed down from over 400 notes.
- Recommendations use the bar profiles plus "what you've enjoyed in the past".

### 1.14 Teabox (tea, India). REPORTED, plus SEEN live page

- **2015 (sponsored SFist post):** "a short quiz" built a palate profile that was combined with "scientific data points". The questions are UNVERIFIED.
- **Live homepage today:** the quiz is gone. In its place, a card reads "NOT SURE WHERE TO START? Tell us what you drink and we'll suggest a tea you'll love. Real people, 24/7." Its "Help me find my tea" button opens a chat widget, as the page code shows.
- **This is a case of a quiz being dropped for a human conversation** whose opening proxy is "what you drink now". Why it was dropped is UNVERIFIED.
- **Adagio and T2:** neither homepage links to a quiz or finder (checked 25 Nov 2026).

### 1.15 Scentbird (perfume subscription, US). REPORTED

- **2022 version (MySubscriptionAddiction):** 5 binary or near-binary questions:
  1. masculine / feminine
  2. warm / fresh
  3. "What mood are you looking to get into?" sophisticated / playful
  4. "What energy are you seeking?" bold / soft
  5. "How do you want your scent to make you feel?" outgoing / sensual / playful / sexy / relaxed
- The result was **12 recommendations** with notes, followed by account creation.
- **Current version (Scentbird blog):** gender plus 3 questions on vibe, season and style. Answers map to 4 families (Citrus, Floral, Woody, Spicy). The result is a ranked list the user can filter, the quiz can be retaken, and rating perfumes and wishlist activity "refine future suggestions".

### 1.16 Golden Apple / Золотое Яблоко «Найди тот самый аромат» (perfume, Russia; launched Nov 2026). REPORTED

- **Sources:** Snob, Retail.ru, New Retail (5 Nov 2026).
- **Questions:** 6, about who the perfume is for, the mood ("уверенно и элегантно", "романтично и притягательно"), the occasion, the place it brings to mind, the strength of the trail (described with music images, from «мелодии в наушниках» to «концерта с первого ряда») and the budget.
- **Principle:** «настроение вместо нот», mood instead of notes.
- **Model:** every perfume is scored on **18 emotions**. AI derives the scores from brand descriptions and then all customer reviews. New perfumes with few reviews borrow scores from their notes.
- **Result:** **2–6 perfumes**, each with a % match. Anything under 25% is hidden. A description of the «характер подборки» (the character of the selection) comes with them. Next steps are to open the product, add it to favourites, or add it to the cart.
- **Catalogue:** over 10,000 fragrances.
- **Saving to account and completion numbers:** UNVERIFIED.

### 1.17 Sephora (perfume and skin). REPORTED

- **Fragrance:** in 2016, Sephora used Pinrose's quiz. Each step was a binary "what would you rather?" choice of setting, shape or colour. The result was a "scent personality type" plus day and night picks (Retail Dive). The Pinrose quiz is no longer live; when it ended is UNVERIFIED.
- **Skincare IQ:** not found. Sephora's current tool is the selfie-based **Smart Skin Scan**: it scores 7 concerns and returns a 4-step routine. This replaces questions with a measurement.

### 1.18 Prose (custom haircare and skincare). REPORTED

- **Consultation (The Filtery review):** four sections: Hair & Scalp, Treatments, Lifestyle, Preferences & Goals. Hair-texture answers are guided by example pictures. A **zip code** brings in local climate (humidity). The result shows the reasoning behind each score.
- **Review & Refine (Prose blog):**
  - It opens in the account "after you've submitted an order and enjoyed a few uses".
  - Each product is rated **1–5** ("5 indicates that the product was a perfect fit"), plus targeted questions on volume, frizz, oiliness and sensitivity, and fragrance can be changed.
  - Prose then adjusts ingredient strengths or swaps ingredients.
  - The last screen shows **"areas improved and areas maintained"**.
  - The share of customers who use it is not published.

### 1.19 Function of Beauty (custom haircare). REPORTED

- The quiz asks about hair type and history and lets the user pick **up to 5 "hair goals"**, then fragrance, scent strength, colour and bottle. Exact wording is UNVERIFIED because the quiz page returned 404 to a script.
- How later feedback changes the formula is not documented on the help pages I found.

### 1.20 Stitch Fix (fashion fit). REPORTED

- **Style quiz:** reported at 80+ questions in 2019 (Quartz), covering body and measurements, budget per item type, and style (Reviewed).
- **StyleFile (Sep 2024):** the user rates outfits and items, and an AI scores the likes and dislikes against Style Types to produce a **"multi-layered" style personality**. Example labels are Rustic Rebel, Modern Muse and Adventure Sport. Glossy reports "hundreds" of combinations and an early **5% conversion uplift** in Freestyle, a company claim. In Stitch Fix's 2024 survey, 48% of clients called defining their own style a top shopping challenge.
- **Style Shuffle:** "Is this your style?" with thumbs up or down, in batches of about 10, with a daily cap.
  - Over 75% of 3M clients had played by 2019, and there had been 10 billion interactions by 2022, about 4.5M a day.
  - Dislikes are weighted "equally important" as likes.
  - Some items are "candy" (likely likes, for engagement) and some are "medicine" (shown to learn).
  - The ratings sit in a learned "Style Space" map. Each client's map shows liked regions in blue and disliked regions in red.
- **Fit feedback at checkout:** for each item, the client chooses keep, return or exchange and gives feedback on "size, style, fit/cut, quality, and price", plus free text. The stylist blog asks clients to say *why* (colour, fabric, fit, price).

### 1.21 Music onboarding, for contrast. REPORTED

- **Spotify:**
  - At sign-up the user is asked to "choose five or more artists you like" (2018).
  - In Oct 2025 Spotify added "Exclude from your taste profile" for single tracks, because one-off listens skew the profile. It cites that 81% of listeners value personalisation most.
  - Since Sep 2026 a **Taste Profile (Beta)** shows Spotify's "brief interpretation of your taste". Users steer it with free-text notes ("Tell us more"), which act as "gentle guidance" and take effect within hours.
- **Apple Music (2015 iMore):** genre and artist bubbles. One tap means like, two taps mean love (the bubble grows), and a long press removes. "More Artists" refreshes the list, and preferences can be reset or changed later. Whether the bubbles still exist in current iOS is UNVERIFIED.
- **Deezer (arXiv 2106.03819):** new users add artists during onboarding. A model then assigns each new user to **one of 1,000 user segments** and serves that segment's top tracks ("semi-personalised"). In a one-month A/B test in 2020 this significantly beat the previous system on display-to-stream and display-to-favourite rates.

### 1.22 Cross-industry quiz benchmarks. REPORTED (vendor data)

- **RevenueHunt (June 2026; 45M+ responses from 20,000+ Shopify stores):**
  - **69%** of people who start a quiz finish it.
  - **5.5%** of completed quizzes lead to an order.
  - **Coffee & tea:** 5.0% conversion, with no lift in average order value.
  - Beauty: 6.1%. Haircare: 6.7%.
  - These are vendor-published, unaudited figures from self-selected quiz takers. The report gives no data on how question count or an email gate affects completion.

---

## 2. Summary table

| Product | Steps | Main proxy | "Don't know" | Result form | Explanation | Saved / feedback |
|---|---|---|---|---|---|---|
| Winc (live) | 6 incl. email | flavours, candy, travel, food | none ("Both" only) | box of 6, swappable | tasting notes, pairings | cookie 7 days; rate after drinking |
| Bright Cellars | 7 | chocolate, tea, juice, adventure | ? | 4 wines, rating per wine | education card | rating; Concierge changes settings |
| Firstleaf | ≥10 | known wines, foods, adventure | skip | 6 bottles | none per pick | thumbs; WinePrint unlocks at 6/12/24 |
| Vivino | none | own ratings | n/a | % on every wine, 3 bands | band names | ≥5 ratings; editable likes |
| Naked Wines | none | own ratings | n/a | recommendations | – | Loved / Liked / Not for you |
| Wine Folly | 4 binary | coffee, juice, dessert, spread | none | style family + grapes | one line per choice | retake |
| Majestic | short / 8-wine tasting | tasting | ? | top style + 4 wines | profile | ? |
| Diageo WYW (live) | 11, 5-point | everyday foods | midpoint "Not sure!", "What's that?", Skip, Back | 1 family + 1 headline pick + % list | everyday-language family text, chart | saved to Malts Club account; retake |
| Hotel Chocolat | few | chocolate styles | ? | 1 of 6 named profiles | 2nd-person blurb | ? |
| Teabox (live) | chat | "what you drink" | human | 1 suggestion | human | – |
| Scentbird | 4–5 binary | mood, energy | none | 12 / ranked list | notes | rate, wishlist |
| Golden Apple | 6 | mood, occasion, trail, budget | ? | 2–6 with %, ≥25% | «характер подборки» | favourites |
| Prose | long | hair, climate, goals | ? | custom formula | score reasons | Review & Refine 1–5 |
| Stitch Fix | 80+ / StyleFile | outfit pictures | ? | box + style personality | label | per-item size, fit, style, quality, price |
| Spotify / Deezer | 1 screen | artists | skip | feed / segment | Taste Profile text | exclude, free-text notes |

---

## 3. Synthesis

### 3.1 Which proxies novices can actually answer

1. **Liking of everyday foods on a 5-point scale** is the most fully built version I found (Diageo's 11 foods). Every item is familiar, the answers are playful, and each food maps to one family: chillies and ginger to spice, treacle and vanilla ice cream to sweet, orange juice and bananas to fruit. For coffee, the analogues would be dark chocolate, grapefruit or lemon, berries, caramel or toffee, nuts, black tea and red wine. Two cautions:
   - Food liking is a weak predictor of liking a drink, and no company publishes accuracy for it. Firstleaf's 96% and Tastry's 80–93% are company claims about the whole system after ratings.
   - When an item is unfamiliar, the question measures familiarity rather than taste. Diageo covers this with a midpoint of "What's that?" or "Not sure!".
2. **Forced binaries between familiar things** are fast and easy: latte vs black coffee, apple vs grapefruit juice, Skittles vs M&Ms. Wine Folly reaches a style in 4 of them. Their weakness is that most beginners pick the "crowd pleaser" answer (Wine Folly's "Common Palate"). They sort people coarsely, which is enough to place someone in a region.
3. **"What do you drink now"** is the most natural opener for a human seller. Teabox has turned it into a chat. Firstleaf's version asks the user to rate named products, which only works for people who already know those products and fails for true novices. For coffee, "how do you drink it now" (with milk or black, capsule, sugar) is an answerable step, and it also tells you brew method and milk use.
4. **Mood and occasion** (Scentbird, Golden Apple) work for perfume, where the product is about how the wearer wants to feel. For coffee they fit as secondary inputs: a morning cup with milk vs a slow weekend filter.
5. **Technical attributes** such as acidity, tannin or body appear nowhere in novice-facing questions. They appear in results and profiles (Firstleaf WinePrint, Vivino) after ratings exist, each with a glossary.
6. **Pictures and swiping** (Stitch Fix, Apple Music) suit visual or recognisable items. Coffee has no visual taste equivalent, except perhaps pictures of foods and desserts.

### 3.2 One pick vs several vs a region

- **The strongest current pattern is a profile first, then one headline pick, then a ranked short list with match percentages.** Diageo does exactly this: "Your flavour profile is …", "we recommend X", then others marked "% matched". Golden Apple shows 2–6 and hides anything under 25%. Majestic gives a top style plus 4 wines.
- **Subscription boxes give 4–6 picks and say "swap them"** (Winc, Firstleaf). This frames the result as a starting point, and swapping is itself a soft feedback signal.
- **Long lists (Scentbird's 12)** shift the choosing back to the user and make a match feel weak.
- **Regions and segments work well with small catalogues.** Deezer's segment approach, Beerwulf's 10 segments, Master of Malt's 5 groups, Diageo's 4 families and Hotel Chocolat's 6 profiles all place a person in a region and then show that region's best items. Bright Cellars ran its algorithm on about **30 wines**, a catalogue the size of QQ's 25. At that size a precise per-person match is not credible. A region plus 1 to 3 picks, with the neighbouring region named, is the honest form.
- **Vivino-style bands** (Great / Average / Low) are easier to read than raw percentages. Percentages without a stated meaning invite false precision. Vivino defines its percentage as confidence.

### 3.3 How good ones explain results

- **Describe the person's taste in their own everyday terms before naming the product.** Diageo writes "always says yes to looking at the dessert menu" and Hotel Chocolat asks "checks the dessert menu first?". Both echo the inputs the person gave.
- **Give a portable sentence.** Firstleaf's "taste phrase" is meant for ordering in a restaurant. This is the strongest explanation device found, because the person can use it outside the shop.
- **Name the character of the set, not only each item**: Golden Apple's «характер подборки».
- **After feedback, show what changed**: Prose's "areas improved and areas maintained".
- **Weak explanations:** Winc and Firstleaf show only tasting notes, with no link back to the answers. Reviewers note the absence (wineclubreviews: no reasoning given).

### 3.4 Persona labels: evidence for and against

- **For:**
  - Labels are memorable and give natural shop categories. Hotel Chocolat sells "Serious Dark Fix Boxed Selections".
  - Stitch Fix reports a 5% conversion uplift after StyleFile (early, company-reported).
  - 48% of Stitch Fix clients say they struggle to define their style, so a label meets a real need.
  - Hotel Chocolat's labels name what the person wants ("Serious Dark Fix", "Milk Devotee"), not who they are, and so double as taste descriptions.
- **Against:**
  - No company publishes evidence that labels improve satisfaction or retention.
  - Stitch Fix moved away from single labels to "multi-layered" combinations ("hundreds"), which suggests one label loses too much information.
  - The most data-rich products (Firstleaf WinePrint, Vivino) use scales and lists, not labels.
  - Personality-type labels in the Pinrose / Sephora style ("scent personality type") are no longer live; the reason is UNVERIFIED.
- **Reading:** a label works when it names a *taste region* in plain words and sits on top of a scale or map that can move. It works badly as a fixed identity. For QQ, label the region on the map ("bright and fruity", "chocolate and nuts"), not the person.

### 3.5 Mechanisms worth borrowing

1. **A neutral midpoint that doubles as "don't know"**, plus Skip and Back (Diageo). It keeps unfamiliar items from forcing a guess.
2. **The answer is saved and pre-filled on return** (Winc's cookie). **The result is saved to the account with a "see my profile" link** (Diageo's Malts Club).
3. **The profile gains detail as ratings accumulate** (Firstleaf at 6/12/24 ratings; Vivino needs ≥5 ratings before showing matches). The map can start as a region and sharpen into a point as feedback arrives, and the UI can say so.
4. **A three-level rating that a novice can give** ("Loved it / Liked it / Not for you", Naked Wines). Then add targeted follow-ups on the axis that matters (Prose; Stitch Fix's size, fit and style). For coffee, the analogue of "too sweet / just right" is a short set like "too sour – just right – too bitter" and "too light – just right – too heavy", asked once the person has had a few cups (Prose waits for "a few uses").
5. **Count dislikes as fully as likes, and include a few deliberate "learning" picks** (Stitch Fix's "candy" vs "medicine"). In a first box of 3 coffees, one could sit at the edge of the person's region to learn their boundary, and be labelled as such.
6. **Show what changed after feedback** (Prose's improved and maintained areas).
7. **Let the person correct the profile directly**: Vivino's editable likes, Spotify's exclude and its free-text "Tell us more", Firstleaf's editable adventurousness. Excluding a coffee bought as a gift from the taste profile is directly relevant.
8. **Guided tasting as a stronger form of the quiz** (Majestic's 8 blind wines; Hotel Chocolat's 30-minute Love Match Live). A QQ sample set could serve as a physical "fitting".
9. **Gate on email only at the end**, and only if the result is worth it. Winc and Firstleaf put the result behind an email; malts.com offers saving after the result. No source gave data on completion with and without the gate.

### 3.6 What failed or was dropped

- **Winc:** bankrupt in 2022. Bright Cellars was then folded into Winc in 2024. The live Winc quiz visibly uses only the red/white answer to build the results URL.
- **Teabox:** the palate-profile quiz was replaced by human chat.
- **Sephora:** the Pinrose personality quiz and "Skincare IQ" were not found, and selfie-based Smart Skin Scan now does that job.
- **Apple Music:** the bubbles appear only in 2015 sources.
- **Majestic:** current status of Wine Fitting is unknown.
- **Caveat:** none of these shows that the quiz caused the failure. They do show that quizzes are often kept as a marketing step, with the real personalisation coming from ratings after the first delivery.

---

## Sources

Wine
- https://www.winc.com/pages/palate-profile (live HTML read 25 Nov 2026)
- https://www.winc.com/pages/recommendations?reds=3&whites=3 (live HTML)
- https://www.winc.com/pages/bright-cellars-activation (redirect target of brightcellars.com, live HTML)
- https://www.winc.com/how
- https://apracticalwedding.com/winc-wine-subscription
- https://prehook.com/how-quizzes-help-dtc-wine-brands-create-the-perfect-drink/
- https://www.modernretail.co/operations/winc-files-for-bankruptcy-following-declining-sales/
- https://www.decanter.com/wine-news/online-wine-subscription-club-winc-files-for-bankruptcy-493802/
- https://bright-cellars.gorgias.help/en-US/how-does-your-wine-quiz-work-524263
- https://bright-cellars.gorgias.help/en-US/wine-attributes-524239
- https://boingboing.net/2021/04/15/bright-cellars-personalized-wine-club-turned-this-beer-drinker-into-a-wine-person.html
- https://d3.harvard.edu/platform-rctom/submission/bright-cellars-the-pandora-of-wine/
- https://vinepair.com/articles/algorithm-apps-wine-clubs/
- https://link.sfchronicle.com/view/5b1a9747e3a98c2fa2724ecberg3t.azt/46120ea2
- https://www.firstleaf.com/how-it-works (live HTML)
- https://wineclubreviews.net/wine_clubs/reviews/Firstleaf/Firstleaf_Wine_Subscription/personalization_review
- https://help.firstleaf.com/hc/en-us/articles/14121707520791-WinePrint
- https://www.firstleaf.com/wine-school/article/firstleafs-wine-taste-profile-wineprint
- https://www.vivino.com/wine-news/introducing-match-for-you
- https://www.vivino.com/wine-news/your-unique-taste-visualized
- https://www.vivino.com/en/wine-news/breaking-down-wine-characteristics-a-beginner-friendly-guide
- https://nakedwines.co.uk/ratings
- https://plus.winefolly.com/tips/find-your-wine-preference-in-one-minute
- https://winefolly.com/lifestyle/common-palate/
- https://www.decanter.com/wine-news/majestic-wine-fitting-service-targets-streaming-generation-423879/
- https://www.thedrinksbusiness.com/2019/03/majestic-rolls-out-new-merchandising-by-taste-trial/
- https://apps.apple.com/us/app/wine4-me/id839861753?l=ru (checked as a possible Russian example; it is a US app)

Spirits and beer
- https://malts.com/en/whats-your-whisky (live HTML and embedded quiz data read 25 Nov 2026)
- https://www.thedrinksbusiness.com/2019/11/this-quiz-asks-for-your-flavour-preferences-and-then-tells-you-what-whisky-to-buy/
- https://www.beveragedaily.com/Article/2019/11/28/Diageo-turns-to-AI-to-help-people-discover-whisky
- https://www.behance.net/gallery/105242347/Diageo-Whats-Your-Whisky
- https://www.masterofmalt.com/whisky-profiles
- https://www.masterofmalt.com/whisky-flavours-explore-the-whisky-map/
- https://flaviar.com/blogs/flaviar-times/flavour-spiral
- https://beerwulf.com/en-gb/taste-segments

Chocolate and tea
- https://www.hotelchocolat.com/uk/i/love-match (live HTML)
- https://www.hotelchocolat.com/uk/i/love-match-quiz (live HTML; quiz renders client-side)
- https://hotelchocolat.com/uk/blog/easter/love-match-quiz-for-easter-chocolate.html
- https://www.hotelchocolat.com/uk/blog/easter/hotel-chocolat-events-and-love-match.html
- https://cocoarunners.com/how-to/our-icons-explained/
- https://cocoarunners.com/faqs-old/
- https://sfist.com/2015/09/08/what_really_is_your_cup_of_tea
- https://www.teabox.com/ (live HTML)
- https://www.adagio.com/ (live HTML; no quiz link found)
- https://www.t2tea.com/en/au/ (live HTML; no quiz link found)
- https://www.artoftea.com/pages/tea-quiz (quiz embedded via Digioh; not readable)
- https://www.harney.com/blogs/news/find-your-ideal-tea

Perfume
- https://www.mysubscriptionaddiction.com/2022/04/scentbird-fragrance-quiz.html
- https://www.scentbird.com/blog/?p=20988
- https://www.scentbird.com/blog/?p=36563
- https://snob.ru/news/zolotoe-iabloko-zapustilo-ii-servis-podbora-parfiuma-po-emotsiiam/
- https://www.retail.ru/news/set-zolotoe-yabloko-zapustila-ii-servis-podbora-parfyuma-po-emotsiyam-5-noyabrya-2026-284056/
- https://new-retail.ru/novosti/retail/zolotoe_yabloko_nauchilo_ii_podbirat_parfyum_po_oshchushcheniyam_pokupateley/
- https://www.retaildive.com/ex/mobilecommercedaily/sephora-wafts-up-fragrance-sales-by-introducing-personalized-scent-mobile-quiz
- https://www.sephora.com/beauty/skin-analysis-tool
- https://www.fashionbeans.com/article/perfume-finder/

Skin and hair
- https://prose.com/blog/review-and-refine
- https://prose.com/blog/?p=8645
- https://thefiltery.com/prose-review/
- https://function-of-beauty.gorgias.help/en-US/what-are-hair-goals-and-how-do-they-work-1056702
- https://www.thedailybeast.com/function-of-beauty-delivers-truly-custom-hair-care

Fashion
- https://qz.com/quartzy/1603872/how-stitch-fixs-style-shuffle-learns-your-style
- https://newsroom.stitchfix.com/blog/10-billion-interactions-and-counting-on-style-shuffle-the-data-powering-your-personalized-shopping-experience/
- https://newsroom.stitchfix.com/?p=3292
- https://www.glossy.co/fashion/stitch-fix-introduces-ai-driven-customer-profiles-amid-revenue-decline
- https://www.stitchfix.com/women/stylefile
- https://support.stitchfix.com/support/solutions/articles/153000250414-how-to-leave-feedback-on-your-fix-items
- https://www.stitchfix.com/women/blog/?p=7969
- https://reviewed.com/style/features/i-tried-a-stitch-fix-was-it-worth-it

Music
- https://newsroom.spotify.com/tag/taste-onboarding/ (2018 post "5 Things Free Users Need to Be Taking Advantage of on Spotify")
- https://newsroom.spotify.com/2025-10-01/exclude-tracks-taste-profile/
- https://newsroom.spotify.com/2026-09-23/taste-profile-shape-home-feed/
- https://www.imore.com/how-tell-apple-music-what-you
- https://arxiv.org/pdf/2106.03819

Benchmarks
- https://revenuehunt.com/state-of-product-recommendation-quizzes/
