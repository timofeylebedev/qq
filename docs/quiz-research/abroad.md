# Coffee quizzes and recommenders abroad: roasters and subscriptions outside Russia

Research for the QQ Coffee first-order quiz. Compiled 25 Nov 2026.

**How this was checked.** Where I could, I read each quiz's own configuration rather than reviews:
- Trade: the live JS bundle.
- Pact: Vue chunks.
- Counter Culture and Partners: Quiz Kit JSON.
- Origin: Okendo JSON.
- Coffee Circle: the Typeform definition.
- Starbucks: the Jebbit page.
- Bottomless: the React bundle.

"Seen in code" means I read the question and answer strings in the shipped code. It does not mean I watched the flow in a browser, so the order a real visitor sees can differ, especially where A/B variants exist. **UNVERIFIED** marks things I could not see myself and took from a review or a vendor, or could not confirm at all. The Wayback Machine could not be reached from this environment.

---

## 1. Trade Coffee (US marketplace, 500+ coffees, ~55 roasters) — the most developed quiz found

- **URL / entry.** `drinktrade.com/coffee-quiz` now returns 404. The quiz lives at `drinktrade.com/pages/find-my-match`, linked from the homepage. The page title is "Coffee Subscription Quiz".
  - URL parameters can prefill answers (`context=espresso|decaf|cold-brew|dark-roast…`, `brew=`, `roast=`, `machine=`).
  - A homepage flavour dropdown can also prefill answers. The quiz then says "We started from what you picked on the homepage. Change it if you like."
- **Variants.** The bundle holds several A/B variants:
  - an "intent-branched" flow, where question copy changes with the answer to "What does coffee mean in your daily life?";
  - a separate espresso branch;
  - a "persona" reveal and a "Discovery Trial" reveal.

  Which variant a given visitor sees could not be verified.
- **Steps (seen in code).**
  - Regular path: `brew → caffeine → addins → grind → roast → taste_approach → expertise → pricing_tier`.
  - Espresso path: `addins → espresso_machine → skill → grind → caffeine → roast → taste_approach → expertise → pricing_tier`.
  - Both continue with plan steps (bags/cups per day, bag size, frequency, prepay), then a loading screen, the reveal and checkout.
  - Some variants open with "What does coffee mean in your daily life?" and "What are you looking to brew?"
- **Questions and options (verbatim from code).**
  - *What does coffee mean in your daily life?* — Fuel to get going / A comforting daily ritual / A passion I love exploring.
    - This sets one of three "voices" (convenience / ritual / discovery) for later questions. Example for the roast question:
      - convenience: "Do you have a roast preference? Light, medium, or dark?"
      - ritual: "What roast level feels like home?"
      - discovery: "Any roast preferences, or are you open to anything?"
  - *What are you looking to brew?* — Brewed coffee / Espresso.
  - *How do you make your coffee?* (multi-select, "Choose all that apply") — Coffee Maker / Espresso or Moka Pot / French Press / Pour Over / AeroPress / Cold Brew (Moka Pot is separate in the espresso branch).
  - *Which machine do you have?* (espresso) — a list of about 45 named machines, from Breville Bambino to La Marzocco and "Bialetti (or other) Moka Pot".
  - *How would you describe your experience level?* (espresso) — New to making espresso. / Learning the craft, but not quite a pro. / Advanced and dialed in.
  - *Do you typically drink regular or decaf?* — Regular / Decaf.
  - *How do you take your coffee?* — Black, always / Cream, milk, or alternative milk / Cream/milk and sugar / Just sugar / Depends on the coffee. The espresso wording is "Straight espresso", "With steamed milk"…
  - *Do you prefer ground or whole beans?* — Whole Bean / Ground, then "Which brew type should we grind for?"
  - *Roast* — five picture cards:
    - Light "Delicate with sugary sweetness"
    - Light-Medium "Bright, complex, and juicy"
    - Medium "Balanced with caramelized sweetness"
    - Medium-Dark "Classic flavors with a hint of roast"
    - Dark "Roasty, smoky, old-school"
    - plus an **"I'm not sure"** link.
    - A "Learn more about roast levels" modal says Trade assigns its own roast level because "one roaster's dark might look the same as another's medium".
  - *How do you like your coffee to taste?* — two forms exist.
    - Three cards:
      - Classic "Smooth and sweet, like chocolate & nuts"
      - Balanced "Part sweet, part bright, with hints of fruit"
      - Complex "Fruity, floral, and full of juicy flavor"
    - Or a multi-select of eight flavour categories with pictures: Roasty, Chocolate, Nuts, Caramelized, Floral, Fresh fruit, Citrus, Dried fruit.
    - Both have **"I'm not sure"** (which sets "balanced") and **"Skip & see my match"**.
    - A tips modal: "No Wrong Answers"; "coffee just tastes like coffee" is "totally fine!".
    - A third form, a 12-note tap-to-love / tap-again-to-avoid "flavor map", also exists in code ("Time to build your flavor map. What sounds intriguing? What would you rather skip?").
  - *Expertise/variety* ("Trade connects you to 500+ coffees… how much you like to mix things up") — I stick to what I like / I try new things sometimes / I'm always chasing something new.
    - A "Why we ask" modal translates each answer into a promise, e.g. "We'll anchor on what you love, but will introduce new styles…".
  - *Acidity* (variant) — Love it — bright and lively! / Some is nice for balance / Prefer low or smooth / **Not sure — help me explore**.
  - *Adventure* (variant) — "I like what I like — keep it in my comfort zone" / "I'm open, but don't go too wild" / "The weirder the better — surprise me".
  - *Values* (variant) — Supporting small roasters / Sustainable sourcing / Unique and rare coffees / Great value for quality.
  - *Pricing tier* — Essential (150+ coffees) vs Signature (500+). This step is auto-skipped for espresso-only, decaf, and light-roast + complex answers.
- **Skip / I don't know.** Yes, on several steps: "I'm not sure", "Skip — no preference", "No preference", "I'm open to anything", "Not sure — help me explore".
- **Back / change answers.** Yes, done better than anyone else seen.
  - There is a Back button on every step.
  - On the result there is "Edit your answers", which opens a "Your answers" drawer: "Tap any answer to change it. You'll come right back here; later answers stay unless they no longer apply."
- **Result form.** Depends on the variant.
  - *Discovery Trial reveal:* "Your coffee matches… delivering to you one at a time". It shows **three coffees**: "First coffee to be delivered" / "Your first bag" plus two under "Next in your trial".
    - Note: "These are the first three bags in your queue; make any swaps you like."
    - Each coffee has "Swap" → "Swap for another match", and "Not quite right? Change your answers".
  - *Persona reveal:* "your coffee persona" with a name and tagline. The seven archetypes in code are:
    - The Ritualist "Your perfect cup, every morning"
    - The Strategist "Dialed in and intentional"
    - The Scout "First in line for what's next"
    - The Student "Building your palate, one cup at a time"
    - The Upgrader "Ready for something better"
    - The Enthusiast "Open to everything"
    - The Purist "You know what you love"

    It is followed by **one** "We Recommend" coffee (roaster, name, price, like count, roast scale, flavour notes), "Start with this coffee" and "View other recommendations", which opens a modal "Other coffees you'll love."
  - Each coffee also shows a small **profile on 1–5 bars**: three meters, each with a label and "N of 5". The homepage shows Roast level / Acidity / Body.
- **Reasons and wording.** There are three styles in code.
  1. **Template sentence**, with the user's own words highlighted in yellow: "Because you brew [French press] and [love smooth, comforting flavors]. This coffee delivers [chocolate and caramel] notes that feel like home and make it easy to [pair with milk]."
  2. **Proof list** pairing each answer with a reason: "You picked a medium roast" → …; "You like chocolate and caramel" → …; "You drink it with milk, from a French press" → ….
  3. **Chips** with ticks: "Medium roast", "Chocolate", "French press", "With milk", plus a server-written `matchReasoning` line.
- **Empty / error results.** Handled with these messages:
  - "No coffees available for this collection. Try a different bag size or grind."
  - "Could not load your matches." with "Contact our support team"
  - "Couldn't update your matches. Try again."
- **After the quiz.**
  - Answers become a subscription queue that can be edited in the account ("You can swap future queued bags in your account").
  - First bag free; "Love your first bag or we'll replace it".
  - Homepage promise: "Matches get better and better… as we learn more about your preferences".
  - Help centre: you rate coffees on Past Deliveries; ratings help "our algorithm and Customer Experience agents"; staff can hand-pick from your feedback.
  - Reviews: an email asks you to rate shortly after the first bag arrives, and a lower rating changed the next pick.
  - **UNVERIFIED:** the rating scale, its words, and any follow-up "why" questions. No public page or bundle I could read shows them; the account app was not reachable.
- **Numbers.** None about the quiz itself. B2B exit: "Corporate gifts" in the menu.
- **For a first-time buyer.**
  - Strong:
    - every question has a way out;
    - "why we ask" modals;
    - flavours with pictures and everyday phrases ("A rich brownie in a cup");
    - one hero coffee plus a visible next two;
    - reasons in the user's own words;
    - swap and edit without starting over.
  - Weak:
    - long (8 taste steps plus about 5 plan steps);
    - pricing and plan selling is mixed into the taste flow;
    - persona names are flattering but carry no information.

## 2. Pact Coffee (UK)

- **URL / entry.** `pactcoffee.com/quiz/flavour/get-started`, from the homepage and a "Find your coffee" menu tile. Answers are cached in `sessionStorage` ("quiz-cache"), so you can resume. Steps have `onBack`.
- **Steps (seen in Vue chunks).** Five questions, then results. The pods path ends earlier.
  1. *Do you drink regular or decaf coffee?* — regular / decaf, with a "What is the difference…" info box.
  2. *How would you like your coffee?* — Wholebean ("perfect for grinding at home") / Ground / Pods ("100% aluminium… Nespresso® compatible").
  3. *How do you brew your coffee?* (ground) — Espresso (Fine) / Cafetière (Coarse) / V60 (Medium) / Clever Dripper / Moka Pot (Medium-fine) / AeroPress. Each comes with a one-line grind explanation. For wholebean the choice is Espresso / Filter.
  4. *Which flavours do you prefer in your coffee?* — four options plus **"I don't know"**. Each has an "hints" info modal ending "There's nothing artificial here – all of these flavours are naturally occurring":
     - Full-bodied and rich: "milk and dark chocolate"
     - Smooth and balanced: "chocolate and fruit, like raisins and dates"
     - Vibrant and complex: "blackcurrant to cantaloupe melon"
     - Light and refreshing: bright fruit plus "blossom and exotic petals"
  5. *Which roast do you prefer?* — Dark / Medium Dark / Medium / Light, plus **"I don't know"**. Each explains acidity, body and milk, e.g. Light "Ideally drunk black with no milk or sugar".
- **Result.**
  - Product cards: name, roast profile, tasting note, "View Coffee", "Add to basket".
  - Or a selection box "curated by our coffee experts to introduce you to everything mesmerising about speciality".
  - Plan cards with sourcing scores as reasons:
    - "Reliable & Consistent" (one chocolatey blend, "82+ points")
    - "Variety & Choice" ("at least 84 points… across ten countries")
    - "Adventurous Palettes"
    - decaf
  - There is no persona and no per-coffee "why".
- **Later.** Subscription. **UNVERIFIED:** whether ratings exist and move picks. A `coffeeRatings` chunk exists, but its code holds no rating copy.
- **For a first-time buyer.** The "I don't know" on both taste questions is good, and so are the plain-English grind notes. Flavour names like "Vibrant and complex" are abstract, which is why they need the modals.

## 3. Counter Culture Coffee (US) — Quiz Kit app

- **URL.** `counterculturecoffee.com/pages/counter-culture-quiz` ("Coffee Quiz" in the nav). There is also a separate gift-finder quiz on the homepage.
- **Configuration (Quiz Kit JSON).** "Coffee Quiz V3":
  - title "Discover Your Perfect Coffee", button "Let's Go";
  - one question per step, progress shown as circles;
  - **`allowSkip: false` on every question**; all single-select;
  - **up to 3 recommended products**;
  - `collectEmail: true`, and results are emailed (`sendResultEmail: true`).
- **Questions (verbatim).**
  1. Which Coffee Do You Prefer? — Caffeinated / Decaffeinated / I Drink Both
  2. Which Is Your Go-To Roast Level — Light / Medium / Dark
  3. How Do You Most Often Brew Your Coffee? — Pour-Over / Espresso / Auto Drip / French Press / Cold Brew / Percolator / AeroPress
  4. Which Flavor Combination Do You Enjoy Most? — Stone Fruit + Milk Chocolate / Caramel + Nutty / Citrus + Floral / Berry + Pastry / Dark Chocolate + Walnut
  5. Any Geographical Preferences? — Africa / Central America / No Preference / South America / Asia & The Pacific
- **Observation.** In the public JSON only four answers carry product points: two flavour answers and Africa / South America. Caffeine, roast and brew carry none, so the matching may be thinner than the five questions suggest. Rules may sit server-side (`rulesLogic: multiple`), so this is **partly UNVERIFIED**.
- **For a first-time buyer.** The flavour pairs are concrete and easy. The origin question asks a beginner something they can't know (though "No Preference" is offered), and there is no way to skip.

## 4. Partners Coffee (US) — Quiz Kit app, mascot voice

- **URL.** `partnerscoffee.com/pages/quiz-landing-page` → quiz at `/pages/coffee-quiz-2` ("COFFEE QUIZ — GET MATCHED" in the nav).
- **Configuration.** The title is "WHAT'S YOUR BREW?". The quiz has a talking guide: "Howdy, my name is Steep…". Email collection is on; skipping is off.
- **Screens (verbatim).**
  1. "Let's start with your favorite flavor, partner!" (radio) — Chocolate / Nuts / Fruit / Dessert / Floral. Subtitle: tasting notes "aren't everything".
  2. "Now, let's talk about body." (slider: Light – Medium – Heavy). Prompt: "consider the best cup of coffee you've ever had. Was it heavy in the mouth? Or… lighter".
  3. "I gotta know, what's your preferred brew method?" — Chemex / Drip / Cold Brew / Pour Over / Espresso / French Press. The copy says "Choose as many as you want", but the config has `multiSelection: false`, a visible inconsistency.
  4. An info interstitial: "Wanna hear something fun? … We roast daily!"
  5. "Finally, what's your experience level?" (slider) — Beginner / Intermediate / Master Brewer.
- **Result.** Product recommendations. The count is not limited in the config; the layout is **UNVERIFIED**.
- **For a first-time buyer.** Anchoring body to "the best cup you've ever had" is a good way to ask a novice about texture. The mascot is friendly but chatty.

## 5. Origin Coffee (UK) — Okendo Quizzes

- **URL.** `origincoffee.co.uk/pages/coffee-quiz` ("Subscription Quiz" in the nav, under Subscriptions).
- **Questions (Okendo JSON), with branching.**
  1. Who is the coffee for? — For me / A gift.
  2. Gift path only: How long should we send the coffee for? — 3 / 6 / 12 months.
  3. "For me" path only: What is your coffee level? — Novice / Enthusiast / Expert.
  4. How do you brew your coffee? — V60 / Cafetiere / Kalita / Stove Top / Aeropress / Chemex / Espresso / Capsule / Cold Brew.
  5. What type of coffee do you enjoy? — Bold / Balanced / Complex / Decaf.

  So each visitor sees four questions. Email ("What's your email address?") is **optional** (`requireCustomerEmail: false`), with a subscribe checkbox.
- **Result.**
  - A product grid (3 columns on desktop, 1 on mobile) with review stars and subscription selling plans.
  - "Add to Cart" and "Add all to cart".
  - No explanation text is configured.
- **B2B.** "Office Subscriptions" in the nav.
- **For a first-time buyer.** Short. Splitting off the gift path early is smart. "Bold / Balanced / Complex" is vague without pictures or notes, and decaf is mixed into the taste question.

## 6. Coffee Circle (Germany) — Typeform "Kaffeefinder"

- **URL.** The nav and footer "Kaffeefinder" link goes to `form.typeform.com/to/Do0DUzHK`.
  - Welcome screen: "Welcher Kaffee passt zu dir?"
  - Button: "Kaffeefinder starten"
- **Questions (verbatim, all `required: false`, so skippable).**
  1. Wie bereitest du deinen Kaffee meistens zu? — Filterkaffeemaschine / Vollautomat / Espressomaschine / Espressokocher / French Press / Handfilter / Chemex / AeroPress.
  2. Welche Geschmacksrichtungen magst du am liebsten? (multi-select) — Klassisch / Schokoladig / Nussig / Fruchtig / Würzig.
  3. Wie trinkst du deinen Kaffee am liebsten? — Schwarz / Mit Milch / Mit Milch und Zucker.

  Typeform's navigation and proportional progress bar are on, so you can go back.
- **Logic.** Counter variables add points per answer. The result **redirects to one of 9 collection pages**: {Filter, Espresso, Vollautomat} × {Classic, Entdecker, Genießer}, e.g. `/de/c/kaffeefinder-filter-entdecker`.
- **Result page (seen).**
  - Title "Kaffeefinder – Filterkaffee Entdecker" and a short tagline, "Feine Vielfalt".
  - One-sentence profile: "Fruchtig, spannend und würzig…".
  - **"Unsere Empfehlung:" one hero coffee** (Yirgacheffe) with a paragraph about why.
  - Then a list of matching coffees (about 7), each with origin, roast level and three descriptors.
  - "Kaffeefinder neu starten".
- **For a first-time buyer.** Three questions, all skippable. The result shows a profile label, one pick and alternatives, and the 3×3 grid is easy for the roaster to curate by hand. There are no reasons per coffee and nothing is saved to an account. **This is the closest model to a small catalogue like QQ's (25 coffees).**

## 7. Starbucks at Home (US, Nestlé) — Jebbit "Coffee Finder"

- **URL.** `athome.starbucks.com/coffee-finder`, an iframe to `starbucks.jebbit.com/uudchqmw`.
- **Format.** "Answer five questions and discover the Starbucks coffee that's made to be yours." Each question is **a sentence to complete** (seen in code):
  - "When I'm making it myself I usually use a ___" — Drip Brewer / Coffee Press / Espresso Machine / K-Cup® Pod Brewer / Pour Over / Cup of water for instant coffee / Cup of cold water with ice for cold brew.
  - "I like my coffee to be ___" — On the lighter side: smooth & flavorful / Somewhere in the middle: well-rounded & balanced / On the darker end: rich & bold / Flavored coffee / Decaf coffee / Less caffeine.
  - "And I almost always have my coffee ___" — Black because it's perfect already / With a splash of milk or creamer / With a dash of non-dairy milk or creamer.
  - "And it tastes even better with hints of ___ or ___" ("Select two to proceed") — Earthy herbs / Chocolate / Fruit / Sweetness / Nuttiness / Spice / Smokiness.
  - "For me a perfect day often includes ___" — options are images; **UNVERIFIED**.
- **Result.**
  - "MEET YOUR NEW FAVORITE…" / "THE COFFEE FOR YOU".
  - "Based on your answers, we know you like…" (a recap of answers as the reason).
  - "Shop Now", "Try Recipe", "Retake Quiz".
  - A Starbucks Rewards sign-up form (first name, surname, email).
- **For a first-time buyer.** The fill-in-the-sentence format is friendly and the recap-as-reason costs nothing to build. The lifestyle question adds charm, not information.

## 8. Bottomless (US) — quiz builds a "rotation", smart scale reorders

- **URL.** `bottomless.com` → "Personalize my rotation" (`/filter_checkout`).
- **Steps (seen in code).** Each has a small header "Creating your coffee profile" and an encouraging line ("Nice. You're off to a good start.").
  1. Roast Level, "What kind of cup sounds best to you?" — Light "Acidic & Bright" / Medium "Balanced & Sweet" / Dark "Smoky & Bold" / Espresso "Rich & Syrupy".
  2. Grind Preference — Whole Beans / Grind It For Me.
  3. Brew Method — Drip/Pourover / French Press / Espresso / Cold Brew.
  4. Bag Size, "How much coffee does your household go through in a day?" — 1–4 cups, mapped to 12 oz or 32 oz bags ("Just an estimate; we'll get to know your habits.").
  5. Pricing Tier — Regular / Premium cup of joe ("keep your matches in range").
  6. Current stock — I'm almost out / 1 week / 2 weeks / 3+ weeks.
- **Result.** A rotation of coffees from 50+ roasters. There is an "Edit" link back to the quiz.
- **Later.**
  - The FAQ says coffee is picked "based on your location, preferences and ratings".
  - Product feedback in code is binary: "Liked the coffee" / "Disliked the coffee".
  - The Wi-Fi scale triggers reorders, with an SMS/email 8–12 hours before so you can change the product.
  - "Eagerness" settings: "never running out", "just right shipments", "prioritizing freshness".
- **For a first-time buyer.** Quick, with plain two-word descriptors per roast. Asking how much coffee you have left is a clever timing question. The taste input is thin (roast only).

## 9. Driftaway Coffee (US) — tasting kit instead of a quiz

- **URL / entry.** `store.driftaway.coffee/products/all-roasts-coffee-subscription` and the Coffee Explorer Box page.
- **Mechanism.**
  - Driftaway's own words: "Start with an Explorer box… Way more fun than a taste quiz!", then "Do a Coffee Tasting" (on Zoom or self-guided), "Set your Preferences", "Discover New Coffees".
  - At checkout you pick "Explorer Box" (35% off) or "Skip Explorer Kit" ("best if you've tried our coffees before").
- **The kit.**
  - Five coffees across roast levels: the profiles Fruity, Balanced, Classic, Bold, Extra Bold.
  - The small and medium boxes are **blind**: "no origin identifying information", plus a "tasting form & wheel" and story postcards "hidden in an envelope".
- **After tasting.**
  - "Pick your favorite profiles from the explorer box. Each shipment alternates between your selected light and medium/dark profiles."
  - Their guide: mark each coffee with a heart or broken heart, which Driftaway uses to "adjust future shipments".
  - A fuller tasting record has a 100-point score, tasting notes, body and acidity, kept as a history.
  - Business Insider: a weekly preview email lets you change the coming box.
  - **UNVERIFIED:** exactly how a broken heart changes the next pick, beyond the profile rotation.
- **B2B.** Office subscription, corporate virtual tastings, wholesale.
- **For a first-time buyer.** The strongest answer to "I don't know what I like": taste first, decide after, blind so labels don't bias you. It costs a box and a week of delay, and asks for effort.

## 10. Bean Box (US) — no quiz, a menu of "tasting experiences"

- **URL.** `beanbox.com/coffee-subscription/configure` (`/start` redirects here).
- **Steps.** 1 Tasting Experience → 2 Quantity → 3 Review.
- **Step 1.** "What's your ideal coffee tasting experience? We offer 1,000+ coffee plans: let's pick the right one for you." Eight cards, each with a one-liner and a count of coffees "curated":
  - Curator's Choice (706)
  - Single Origin (278)
  - Light & Bright (253)
  - Medium & Cozy (316)
  - Dark & Toasty (137)
  - Espresso (123)
  - Decaf (96)
  - Cold Brew (138)

  Plus a preparation toggle: whole bean / freshly ground.
- **Step 2.** Quantity personas: "The Solo Sipper", "The Duo", "Large Solo", "Office Duo" (B2B), with cost per cup.
- **Later.** "See your next coffee before it ships — and swap it for something else, free"; "Don't love your first coffee? We'll make it right." **UNVERIFIED:** rating mechanics.
- **For a first-time buyer.** The eight cards are clear and honest, but the buyer must already know a style.

## 11. Atlas Coffee Club (US) — plan builder, origin-of-the-month

- **URL.** `atlascoffeeclub.com/collections/coffee-subscription-service` ("Build Your Plan", "Tailored To The Way You Brew").
- **Inputs.**
  - Brew method: Drip Machine / Single Serve Pods / French Press / Espresso / Decaf / More Options.
  - Roast type, from the variant data: All Roasts, Light Only, Light to Medium, Medium Only, Medium to Dark, Dark Only, Extra Dark, and a premium "Bright & Expressive".
  - Bags per shipment (1 bag of 6 oz up to 6 bags), whole bean or ground, delivery frequency.
- **Result.** A plan, not a coffee. Each box has a country postcard and tasting notes.
- **Later.** No rating loop described by NBC Select (Oct 2024) or MySubscriptionAddiction. "30-Day Money Back Guarantee".
- **B2B.** Corporate gift "GET MY CUSTOM QUOTE" form.
- **For a first-time buyer.** Simple, but "taste" is reduced to roast, and nothing is explained.

## 12. Angels' Cup (US) — "Find Your Coffee" = four-step finder plus a letter

- **URL.** `angelscup.com/#quiz`.
- **Steps.**
  1. Roast: Light/Medium ("we'll surprise you… One week… bright acidity… the next… rich notes") or Dark ("never coffees that would present any trace of acidity").
  2. Grind: Whole Bean / Coarse / Fine, each with a use.
  3. Frequency: weekly to every 4 weeks ("Dark roasts will repeat if you select this option").
  4. Payment.
- **Promise.** Each box comes with "a personal letter explaining what you're tasting and why we chose it".
- **History.** The app (2014, FreshCup) let users log roast, flavour-wheel descriptors, mouthfeel and "overall enjoyment"; it "learns the user's palate" and recommends coffees.
- **For a first-time buyer.** Honest warnings, like the repeat notice and "no acidity" for dark. The written "why" travels in the box rather than on screen.

## 13. Blue Bottle (US) — Coffee Match quiz, partly visible

- **URL.** `bluebottlecoffee.com/us/eng/subscriptions`. Curl is blocked; WebFetch read the page.
- **Seen.** A three-step quiz: "Tell us what flavors you like" → "Tell us how you like to brew" → "Select your perfect plan". The FAQ names two popular plans, the Single Origin Assortment and the Comforting Assortment. Customers are emailed before each shipment and can change or skip it.
- **History.** Homegrounds (Feb 2024) said Blue Bottle "doesn't start with a quiz", so the quiz is recent. Blue Bottle's blog describes "Coffee Match" as "an algorithm formulated by a team of coffee pros, engineers, and sensory scientists".
- **UNVERIFIED.** Answer options, the result layout, any rating loop.

## 14. Nespresso — quiz with published numbers

- **URLs.** `nespresso.com/lu/en/coffee-selector` ("Find the Nespresso coffee that suits you best…", "Start the experience"; questions not visible to the fetcher). There is also a B2B `nespresso.com/pro/uk/en/professional-coffee-pod-quiz`.
- **Monetate case study.**
  - A "2-minute" quiz with **3 questions**: black or with milk; anything extra (flavours, caffeine, vitamins); capsule type for your machine.
  - Pop-ups explain intensity ("the taste of the coffee, not caffeine") and tasting notes.
  - Each set of answers gives a different set of capsules.
- **Retail TouchPoints (Jul 2024).**
  - They removed a cup-size question because it "stumped quite a lot of customers".
  - Flavoured and decaf drinkers get a shorter 3-question path.
  - New products automatically flow into results from the product feed.
  - Nespresso was exploring how to "remember those recommendations" on product pages.
- **Numbers (Monetate).** **42% completion**, **18% CVR on recommended coffees** (higher than the rest of the site; no baseline given), 50K+ users.

## 15. MistoBox (US) — human curator plus stars

- **Help centre.** Each received coffee has a **5-star** control in "Your Collection". It opens a pop-up with stars, notes, and a toggle to share the review with your curator.
- **Coffeexplore review (low reliability; its dates are inconsistent).**
  - The quiz covers roast, flavour (e.g. "chocolatey, fruity, classic") and brew method.
  - Then you are assigned a "personal human coffee curator".
  - Free-text notes like "Loved the fruitiness, but could be a bit brighter" guide the next pick.
  - A "Brew Queue" is used first; if it is empty, the curator picks.
- **UNVERIFIED.** The exact quiz options.

## 16. Square Mile (UK) and Fellow Drops (US) — deliberate non-quizzes

- **Square Mile (`shop.squaremilecoffee.com/pages/new-subscription`).** A seven-step builder:
  - Ongoing or Fixed Term;
  - Filter or Espresso;
  - selection: Red Brick / The Filter Blend, "Our Pick" (a "coffee journey… from fruity and bright to classic"), "Our Pick Washed", Decaf;
  - size 350 g / 1 kg;
  - frequency, with cups-per-day guidance ("a weekly 350g bag is perfect for 3-4 cups a day");
  - months (fixed term).

  The roaster's curation replaces the quiz.
- **Fellow Drops (`fellowproducts.com/pages/fellow-drops`).** "Every Tuesday we'll text you about our favorite coffee in the world right now." You reply with how many bags you want. A named tasting panel of Q Graders curates. There is no profile at all, only trust in the panel.

## Extra data point: Henry's House of Coffee (Interact case study, May 2026)

- A "matchmaker" quiz whose results are Shopify collection pages with a label such as "Medium and Balanced".
- An optional email opt-in with a $5 coupon comes before results.
- **9% of quiz takers became customers**; 23% lead conversion, against 5% for a pop-up.

---

## Synthesis

### Patterns

1. **Same backbone everywhere.** Brew method, then roast, then a flavour family (three or four families named "classic / balanced / complex" or similar), then milk or sugar, then whole or ground.
   - Brew method comes first in almost every quiz, because it filters hard: grind, espresso-suitable coffee.
   - Taste questions use 3–5 families, never single notes. Exceptions are Trade's 8-category multi-select and Counter Culture's note pairs.
2. **Skips and "I don't know".**
   - Many quizzes do have them: Trade on most steps; Pact on flavour and roast; Coffee Circle by making every question optional; Counter Culture's "No Preference" on origin only.
   - Others force an answer: Counter Culture (`allowSkip:false`), Partners, Origin.
   - Nobody published the share of users who skip or change answers.
3. **Results: three shapes.**
   - (a) A product grid or collection (Origin, Counter Culture up to 3, Henry's, Coffee Circle's list, Pact).
   - (b) A plan or rotation (Bottomless, Atlas, Bean Box, Square Mile, Pact's plan cards).
   - (c) **One hero coffee plus a few alternatives**: Trade "We Recommend" plus "View other recommendations"; Trade trial with first bag plus "Next in your trial" ×2; Coffee Circle "Unsere Empfehlung" plus list; Starbucks "Meet your new favorite".
   - Persona labels appear at Trade (7 archetypes) and Coffee Circle (Classic / Entdecker / Genießer per brew family). Only Coffee Circle's label carries taste meaning; Trade's names describe *attitude*.
4. **Explanations are rare.** Only Trade explains each coffee from the user's own answers, and it has three tested formats (sentence, proof list, chips). Starbucks recaps "Based on your answers, we know you like…". Coffee Circle writes a paragraph about the hero coffee. Angels' Cup puts the "why" in a letter in the box. Most show nothing.
5. **The quiz-to-next-step link is the real product at subscription companies.**
   - Trade: queue, swap, rating, replacement guarantee.
   - Driftaway: kit, tasting, profiles, alternating shipments.
   - Bottomless: like/dislike plus scale-timed reorders.
   - MistoBox: stars plus notes to a human curator.
   - Plain roasters (Counter Culture, Origin, Partners) end at "Add to cart" and send an email.
6. **Email gates.** Counter Culture and Partners collect email in the flow, and Starbucks has a Rewards form. Origin's email is optional. Henry's offers an optional $5 coupon before results. None of the strong flows (Trade, Coffee Circle, Pact) gates results behind email.
7. **Published numbers are scarce.**
   - Nespresso: 42% completion, 18% CVR on recommended coffees.
   - Henry's: 9% of takers buy, 23% leave an email.
   - Nespresso also dropped a question (cup size) that confused people.
   - Nothing on answer-change rates.
8. **B2B exits are everywhere:** Bean Box "Office Duo", Driftaway office subscription and corporate tastings, Origin office subscriptions, Atlas custom quote, Trade corporate gifts, Nespresso Pro quiz. They usually live in the nav or as a quantity option, not inside the taste quiz.

### One pick vs several vs a place on a taste map

- **One pick plus 2–3 visible alternatives works best for a first order.**
  - Trade's trial reveal tells the beginner what to buy now, so there is no choice paralysis. It also shows that the service will vary the next bags, and each card has a one-tap "Swap for another match".
  - Coffee Circle does the same at small-catalogue scale: one recommendation, then the rest of the matching group.
- **A pure grid** (Origin, Counter Culture) hands the decision back to someone who just admitted they don't know.
- **A taste map** exists only as small 1–5 bars on Trade's coffee cards (roast / acidity / body), plus a 12-note "flavor map" input variant. No company shows the *user* as a point on a map next to the catalogue.
  - With 25 coffees, QQ could do this: place the user's answer on the same two axes the coffees use. Each pick then explains itself spatially ("you are here; this one is next to you; this one is a step towards fruit").
  - This is untested territory, so it would be a differentiator, not a copied pattern.
- **Personas.** Trade's flattering names ("The Scout") are shareable but say nothing about taste. Coffee Circle's "Filterkaffee Entdecker — Feine Vielfalt" is both a label and a taste promise. If QQ uses a label, it should name the taste direction, not the character.

### How the best ones explain a result

- Reuse the user's own words and highlight them ("Because you brew **French press** and **love smooth, comforting flavors**…").
- Tie each claim to an answer ("You picked a medium roast" → what that means for this coffee). Trade calls this "proof".
- Add a sensory image, not jargon ("A rich brownie in a cup", "Ripe peach on a summer day").
- Say what the choice costs, as Angels' Cup and Pact do: Pact's Light roast is "Ideally drunk black with no milk or sugar"; Angels' Cup warns "Dark roasts will repeat if you select this option". Honest warnings build trust.

### How the best ones connect the quiz to what happens next

- **Make the result editable in place.** Trade's answers drawer returns you to the result. Every quiz has "Retake" or "neu starten", but Trade's in-place edit is the better pattern.
- **Turn the result into a queue**, not just a cart: first bag, then next up, with swap before shipping (Trade, Bean Box, MistoBox's Brew Queue, Bottomless's pre-reorder SMS).
- **Close the loop with a cheap rating.** Bottomless uses like/dislike. Driftaway uses heart/broken heart, plus an optional 100-point score with body and acidity. MistoBox uses stars plus a note to a human. Trade emails a request to rate after the first bag. None of the visible loops asks a structured "why".
  - "Too bitter / too sour / too weak / wanted fruitier" would map directly onto the quiz axes. This gap is open for QQ.
- **Lower the risk of being wrong:** Trade's "Love your first bag or we'll replace it", Bean Box's "We'll make it right", Atlas's 30-day guarantee.
- **For people who can't answer at all:** Driftaway's blind tasting kit ("Way more fun than a taste quiz!") is the alternative entry. A small QQ sample set as an "I don't know, let me taste" exit from the quiz would copy the best idea in this group.

---

## Sources

**Trade Coffee**
- https://www.drinktrade.com/coffee-quiz (404)
- https://www.drinktrade.com/pages/find-my-match
- https://www.drinktrade.com/cdn/shop/t/2716/assets/bundle.page.quiz.js?v=183897387278084270131795637599
- https://www.drinktrade.com/
- https://www.drinktrade.com/blogs/education/coffee-quiz-answers-explained
- https://trade-coffee.gorgias.help/en-US/how-do-i-rate-m-324468
- https://trade-coffee.gorgias.help/en-US/what-if-i-dont-324487
- https://www.aol.com/news/trade-coffee-quiz-matched-bag-161000085.html
- https://coffeexplore.com/trade-coffee-subscription-review/
- https://www.inverse.com/input/reviews/trade-coffee-subscription-review
- https://inkl.com/news/trade-is-the-data-driven-coffee-subscription-that-knows-your-tastes-better-than-you-do

**Pact Coffee**
- https://www.pactcoffee.com/
- https://www.pactcoffee.com/quiz/flavour/get-started
- https://www.pactcoffee.com/dist/StoreFunnel/index.js
- https://www.pactcoffee.com/dist/ (step chunks: Step1–Step6, coffeeRatings, mySubscription)

**Counter Culture Coffee**
- https://counterculturecoffee.com/
- https://counterculturecoffee.com/pages/counter-culture-quiz
- https://api.quizkitapp.com/api/v1/quizzes/Q3-BEeG6o
- https://d38jc50suw8dg3.cloudfront.net/current/static/bundle.min.js

**Partners Coffee**
- https://www.partnerscoffee.com/pages/quiz-landing-page
- https://www.partnerscoffee.com/pages/coffee-quiz-2
- https://api.quizkitapp.com/api/v1/quizzes/cv5-mBzq-

**Origin Coffee**
- https://www.origincoffee.co.uk/pages/coffee-quiz
- https://surveys.okendo.io/js/init-quizzes.js
- https://surveys.okendo.io/js/okendo-connect.quizzes-0.0.1.2429.js
- https://api.okendo.io/v1/stores/1c396b8c-d98a-419c-a06c-dc1edcfd4526/channel_quizzes/489f4c59-bf1d-4572-891b-e9722f066a58

**Coffee Circle**
- https://www.coffeecircle.com/de
- https://form.typeform.com/to/Do0DUzHK
- https://www.coffeecircle.com/de/c/kaffeefinder-filter-entdecker

**Starbucks at Home**
- https://athome.starbucks.com/coffee-finder
- https://starbucks.jebbit.com/uudchqmw?L=Full+Page&deferred=true

**Bottomless**
- https://www.bottomless.com/
- https://www.bottomless.com/static/js/main.35f9ac5d.js

**Driftaway Coffee**
- https://driftaway.coffee/subscribe
- https://store.driftaway.coffee/collections/subscriptions
- https://store.driftaway.coffee/products/all-roasts-coffee-subscription
- https://store.driftaway.coffee/products/coffee-explorer-box
- https://driftaway.coffee/complete-guide-tasting-kit/?amp
- https://driftaway.coffee/profiles-tasting-kit-in-depth/
- https://support.driftaway.coffee/article/ox2r8tjpsb-what-coffees-do-you-drink
- https://businessinsider.in/international/news/this-coffee-subscription-box-helped-me-figure-out-what-kinds-of-coffee-i-actually-enjoy-drinking/articleshow/75588497.cms

**Bean Box**
- https://www.beanbox.com/
- https://www.beanbox.com/coffee-subscription/configure

**Atlas Coffee Club**
- https://atlascoffeeclub.com/
- https://atlascoffeeclub.com/collections/coffee-subscription-service
- https://atlascoffeeclub.com/cdn/shop/t/243/assets/main-DqD2IG_W.min.js
- https://www.nbcnews.com/select/shopping/atlas-coffee-club-subscription-review-rcna176376
- https://mysubscriptionaddiction.com/atlas-coffee-club-review

**Angels' Cup**
- https://angelscup.com/
- https://freshcup.com/a-tasters-flavor-app

**Blue Bottle**
- https://www.bluebottlecoffee.com/us/eng/subscriptions
- https://bluebottlecoffee.com/us/eng/subscriptions
- https://blog.bluebottlecoffee.com/posts/coffee-match
- https://www.homegrounds.co/blue-bottle-coffee-club-review/

**Nespresso**
- https://www.nespresso.com/lu/en/coffee-selector
- https://www.nespresso.com/pro/uk/en/professional-coffee-pod-quiz
- https://monetate.com/?p=11969
- https://monetate.com/wp-content/uploads/2023/05/Monetate-Nespresso-Case-Study-Product-Finder.pdf
- https://www.retailtouchpoints.com/topics/personalization/nespresso-awakens-new-coffee-discovery-pathways-with-online-quiz

**MistoBox**
- https://mistobox.com/
- https://mistobox.zendesk.com/hc/en-us/articles/360000125334
- https://coffeexplore.com/mistobox-review/

**Square Mile**
- https://shop.squaremilecoffee.com/pages/new-subscription

**Fellow Drops**
- https://fellowproducts.com/pages/fellow-drops

**Other**
- https://www.tryinteract.com/blog/henrys-house-of-coffee-converts-9-of-quiz-takers-into-customers/
- https://revenuehunt.com/solutions/coffee/ (aggregate platform stats only; nothing coffee-specific)
- https://faq.roastmarket.de/hc/en-us/articles/360021378913-How-does-the-Coffee-Finder-work (roastmarket.de Coffeefinder: "a simple filtering process")
- https://expatchoice.asia/eat-drink/have-you-subscribed-responsibly-sourced-perk-coffee-singapore (Perk Coffee: no quiz described; perkcoffee.co returned 403)

**Not reached / not covered:** Onyx, Methodical, Raw Coffee, Lavazza. Onyx and Methodical homepages show no quiz link; Lavazza and Raw were not researched in depth.
