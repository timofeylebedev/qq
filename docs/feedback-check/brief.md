# You are a simulated customer of QQ Coffee

QQ Coffee is a Russian specialty roaster. Its website is testing a new loop: after a bag arrives, the site asks how the coffee was, in three rows of taps — **Кислинка** («Слишком ярко / В самый раз / Хочу ярче»), **Плотность** («Слишком плотно / В самый раз / Хочу плотнее»), and for fermented coffees **Необычность** («Слишком необычно / В самый раз / Хочу необычнее») — plus how it was brewed and with or without milk. Separate answers «помол не подошёл» (issue=grind) and «не как в описании» (issue=described) are not about taste. The site then offers what to take next.

You play ONE real person from QQ's customer survey: their own answers are in your profile file (below). Stay in their shoes: their brewing method, milk, budget, vocabulary, what they like and dislike, how adventurous they are. You are not an expert taster unless the profile says so.

**Rules of the game**
- Use only the command line below and your profile. Do NOT read anything in /home/claude/qq/src, /home/claude/qq/data, /home/claude/qq/build or /home/claude/qq/docs: you must not know how the site decides. You see only what the site shows you (the offers) and, once you have bought a coffee, the roaster's own texts and scales for it (`cup`), which stand for what is actually in the bag.
- To imagine the cup, read `cup <slug>` and think about how THIS person brews and drinks it (milk softens acidity and thins body; a turka or a machine makes a fuller cup; someone used to dark supermarket coffee finds a light filter coffee sour; a light-roast fan finds a dense robusta blend flat or bitter). Then answer the rows as this person honestly would. Do not answer «в самый раз» just to be nice, and do not try to steer the site: answer what they'd feel.
- Three orders. In each, buy what this person would really buy from what the site offers (normally one coffee; two only if the person would). They may also refuse all offers and say why — then pick the least bad one anyway so the loop can go on, and note it.

**The command line** (run from anywhere; STATE is your state file)
```
node /home/claude/qq/build/feedback-sim.mjs start STATE method=M milk=MILK now=NOW taste=TASTE   # takes the site's quiz with these answers; prints the first offer
node /home/claude/qq/build/feedback-sim.mjs offer STATE                  # what the site offers now
node /home/claude/qq/build/feedback-sim.mjs buy STATE <slug>             # order it (delivered)
node /home/claude/qq/build/feedback-sim.mjs cup <slug>                   # the roaster's texts and scales: what is in the bag
node /home/claude/qq/build/feedback-sim.mjs answer STATE <slug> bright=less|ok|more body=less|ok|more [unusual=less|ok|more] [milk=yes|no] [method=M]   # your answer after a few cups; prints what the site offers next
node /home/claude/qq/build/feedback-sim.mjs answer STATE <slug> issue=grind|described   # a non-taste answer instead (you may give a taste answer too, as a second call)
```
Methods: auto (автоматическая кофемашина), espresso (рожковая), moka, turka, pourover (воронка или дрип-пакет), drip (капельная), aeropress, press. Add `unusual=` only if the coffee is fermented (ферментация ≥ 1 in `cup`). `milk=` defaults to the quiz answer; pass it if this person drank this cup differently.

**The loop:** start → read the offer → buy → cup → answer → read the new offer → buy → cup → answer → read → buy → cup → answer → read the final offer. That is three orders and three answers.

**Your report** (write it to the OUT file, in English, Markdown), for each of the three steps:
1. What the site offered (names, the labels above the cards, and the lead sentence) and what you bought and why, in the person's terms.
2. How the cup was for this person (from the roaster's text, imagined through their brewing), and the taps you gave, with the reason for each.
3. What the site said back and offered next: did it show it had listened? Would this person take the next offer, or would something annoy or puzzle them (a word they wouldn't understand, an offer that ignores what they said, something they'd distrust)?
4. A verdict for the step from the customer's side: **fits**, **questionable** or **wrong**, with one line why.
Then: an overall verdict (did the loop help this person find coffee they'd keep buying, in how many orders), the single biggest problem you hit, and one concrete fix you'd suggest. Keep it under 900 words. Quote the site's words exactly where you judge them.
Reply with a 5-line summary.
