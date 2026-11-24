# The survey's brewing methods → the catalogue's chips

Outside check of session 3: every brewing method that respondents of the B2C survey named must lead to a method chip
that exists (`data/choose.json` `methods`). Source: «QQ COFFEE (Ответы)», all 106 rows (98 form answers + 8 phone
interviews), columns «Как вы обычно готовите кофе дома?» and «Какой способ приготовления кофе вы предпочитаете больше
всего? Почему?», coded by keyword (case-insensitive; one respondent can name several methods). Coded 24 Nov 2026.
Counts are respondents, not mentions. Read every number as "QQ's buyers": all 106 are current or former customers.

| What respondents wrote | Respondents | Chip it leads to | Roast · grind QQ sells for it |
|---|---|---|---|
| воронка, V60, пуровер, кемекс, клевер, сифон, иммерсионная воронка, origami, «альтернатива» | 50 | **Воронка или дрип-пакет** | фильтр · для фильтра |
| дрип-пакеты (most fill them themselves: «молю и сразу засыпаю в дрип-пакеты») | 27 | **Воронка или дрип-пакет** | фильтр · для фильтра |
| «кофемашина», type not said | 20 | **Автоматическая кофемашина** and **Рожковая кофемашина** (both chips; both take the espresso roast, so the catalogue's answer is the same 19 coffees) | эспрессо · в зёрнах / для эспрессо |
| турка, джезва, электрическая турка | 16 | **Турка** | любая (эспрессо, если есть обе) · для турки |
| капельная кофеварка, мокамастер, Melitta, фильтр-кофеварка | 14 | **Капельная кофеварка** | фильтр · для фильтра |
| гейзерная кофеварка, гейзер, гейзерка, мока, кофейник на плите | 13 | **Гейзерная кофеварка** | эспрессо · в зёрнах (no moka grind: a question for QQ) |
| рожковая кофемашина / кофеварка, рожок, эспрессо-машина, 9barista | 11 | **Рожковая кофемашина** | эспрессо · для эспрессо |
| аэропресс | 10 | **Аэропресс** | фильтр · для фильтра |
| френч-пресс (7); в кружке, в термосе настаиванием (1); вьетнамская воронка (2) | 9 | **Френч-пресс** | любая (фильтр, если есть обе) · в зёрнах (no coarse grind: a question for QQ) |
| автоматическая кофемашина, «автомат машина», «кнопка на кофемашине» | 3 | **Автоматическая кофемашина** | эспрессо · в зёрнах |
| «кофеварка», type not said | 3 | **Капельная кофеварка**, **Гейзерная кофеварка** or **Рожковая кофемашина** (all three are chips) | — |
| «фильтр» alone | 1 | **Воронка или дрип-пакет** / **Капельная кофеварка** | фильтр · для фильтра |
| капсулы, Nespresso, капсульная кофемашина | 4 | **no chip: QQ sells no capsules.** All four also name another method (V60; фильтр/джезва/кемекс/гейзер; дрип/мока/френч-пресс; «в кружке/термос»), so each still reaches a chip. | — |
| готовые концентраты | 2 | **no chip: QQ sells none.** Both also brew in a воронка. | — |
| колд брю | 0 at home (1 in a café) | — | — |

**Result:** 105 of 106 respondents reach at least one chip; the 106th answered «я». Respondents reaching each chip
(the ambiguous answers counted for every chip they could mean): воронка или дрип-пакет 64, рожковая 34, автоматическая
23, капельная 18, гейзерная 16, турка 16, аэропресс 10, френч-пресс 9.

**What this changed:** the pour-over chip was «Воронка или кемекс»; drip bags are the second most-named way to brew
(27), and a drip bag filled at home takes the same roast and grind, so the chip says so.

**Not a chip, on purpose:** capsules and concentrates (QQ sells neither); ready drip bags are the catalogue's «Дрипы»
tab («скоро»); cold brew was named only for a café.

**Questions for QQ this raises** (also in `data/choose.json` `asks`): a grind for the moka pot (13 respondents) and a
coarse grind for the French press (9); which roast to advise for a turka and a French press when a coffee is sold in
both.
