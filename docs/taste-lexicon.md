# QQ taste model: descriptor families grounded in the WCR Sensory Lexicon and the SCA/WCR Flavor Wheel

Research notes, 2026-11-23. Every factual claim carries a source link. Lines marked **[judgement]** are my design proposals, not findings. The machine-readable version is `lexicon.json` in this folder. The descriptor table below is generated from it, so the two match.

---

## 1. Structure of the SCA/WCR Coffee Taster's Flavor Wheel (2016) and how it was built

### 1.1 Source vocabulary: the WCR Sensory Lexicon
- The lexicon (v2.0, 2017) was developed in Edgar Chambers IV's lab at the Kansas State University Sensory Analysis Center. Ten KSU sensory scientists trained for more than 50 hours and evaluated 105 coffee samples from 13 countries over more than 100 hours. A second trained panel at Texas A&M (Rhonda Miller's lab) validated it. Each attribute has a definition, physical references, and intensities on a 0–15 scale. (https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36)
- The peer-reviewed description is Chambers et al. 2016, *J. Sensory Studies*, "Development of a 'living' lexicon for descriptive sensory analysis of brewed coffee" (https://zendy.io/title/10.1111/joss.12237). Seninde & Chambers (2020) note that the lexicon "should be considered 'living'" (https://www.mdpi.com/2306-5710/6/3/44).
- The lexicon's own section headings differ from the wheel's tier 1: Taste basics, Fruity, Sour/Acid, Alcohol/Fermented, Green/Vegetative, Stale/Papery, Earthy, Chemical, Roasted, Cereal, Spices, Nutty, Cocoa, Sweet, Floral, Amplitude, Mouthfeel (https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36). The wheel regroups these sections (Section 1.3).

### 1.2 How the wheel was built (Spencer, Sage, Velez & Guinard 2016, *J. Food Sci.* 81(12), doi 10.1111/1750-3841.13555)
- **Task:** single free sorting without tasting. 72 panelists (29 trained UC Davis descriptive panelists and 43 coffee-industry experts recruited by the SCAA) sorted 99 lexicon flavour attributes into groups and subgroups. Astringent, texture/mouthfeel and amplitude terms were removed first. (https://pmc.ncbi.nlm.nih.gov/articles/PMC5215420)
- **Group agreement:** the two panels were pooled after MFA. RV coefficients were 0.832 (industry vs. MFA consensus) and 0.850 (UC Davis vs. consensus), but only **0.414** between industry and UC Davis directly. (https://pmc.ncbi.nlm.nih.gov/articles/PMC5215420)
- **Clustering:** agglomerative hierarchical clustering with unweighted pair-group average linkage (XLSTAT), "truncation was set to specify 9 main categories". The dendrogram was then used "to create a 2nd and 3rd tier of subcategories". Other linkages tried in R were rejected partly because one of them "still split the Fruity group into 2". (https://pmc.ncbi.nlm.nih.gov/articles/PMC5215420)
- **Positioning:** a 2-D non-metric MDS (Kruskal stress) placed the 9 classes around the wheel. The key sentence: "the 9 main classes are placed around the flavor wheel based on similarity (the classes that are more similar are closer to each other on the wheel)". (https://pmc.ncbi.nlm.nih.gov/articles/PMC5215420)
- **Post-hoc edits:** "a few of the terms were moved or added". Table 4 footnotes mark terms that were combined, created or changed after sorting. (https://pmc.ncbi.nlm.nih.gov/articles/PMC5215420)
- **Reading the layout, per the SCA:** general terms sit at the centre and get more specific outward. "If two attribute cells are connected", the tasters saw them as closely related. A gap means "slightly less closely related", and the further a gap extends toward the centre, the weaker the relation. (https://sca.coffee/sca-news/how-to-use-the-flavor-wheel-in-eight-steps)
- **Example from a project contributor:** "Similar flavors are in the same category and are close to one another". Citrus Fruit sits between Sour and Other Fruit, across from Papery/Musty and Burnt. (https://www.beanpoet.com/coffee-flavor-wheel/)

**Can the layout be read as a similarity order?** Partly. The circular order of the 9 tier-1 classes is an MDS-based similarity arrangement by design (https://pmc.ncbi.nlm.nih.gov/articles/PMC5215420). Three limits apply:
1. It is a 1-D ring drawn from a 2-D MDS map, so two classes that are both far from a third can still be neighbours.
2. The cluster tree above 9 classes is not published in text. Fig. 3 (dendrogram) and Fig. 4 (MDS plot) exist only as images, and the text does not say which classes merge first or what the MDS dimensions mean. I could not retrieve the actual tree or coordinates. (https://pmc.ncbi.nlm.nih.gov/articles/PMC5215420, https://escholarship.org/content/qt11x4j422/qt11x4j422.pdf?t=rug3nw)
3. The sorting was conceptual. Panelists sorted words "based on their experience and expectations of these flavor descriptors", without tasting. (https://pmc.ncbi.nlm.nih.gov/articles/PMC5215420)

### 1.3 Tiers (Spencer et al. Table 4; clockwise order per a Q-grader study guide that matches Table 4's order)
Clockwise on the inner ring: **Floral → Fruity → Sour/Fermented → Green/Vegetative → Other → Roasted → Spices → Nutty/Cocoa → Sweet → (back to Floral)** (https://pmc.ncbi.nlm.nih.gov/articles/PMC5215420, https://open-exam-prep.com/study-guides/sca-q-grader/flavor-wheel-sensory-lexicon/flavor-wheel-architecture). The same guide says Nutty/Cocoa sits directly beside Sweet, and Sweet leads into Floral and Fruity (https://open-exam-prep.com/study-guides/sca-q-grader/flavor-wheel-sensory-lexicon/flavor-wheel-architecture).

| Tier 1 | Tier 2 | Tier 3 |
|---|---|---|
| Floral | Black Tea; Floral | Chamomile, Rose, Jasmine |
| Fruity | Berry | Blackberry, Raspberry, Blueberry, Strawberry |
| | Dried Fruit | Raisin, Prune |
| | Other Fruit | Coconut, Cherry, Pomegranate, Pineapple, Grape, Apple, Peach, Pear |
| | Citrus Fruit | Grapefruit, Orange, Lemon, Lime |
| Sour/Fermented | Sour | Sour aromatics, Acetic, Butyric, Isovaleric, Citric, Malic acid |
| | Alcohol/Fermented | Winey, Whiskey, Fermented, Overripe |
| Green/Vegetative | Olive oil; Raw; Green/Vegetative; Beany | Under-ripe, Peapod, Fresh, Dark green, Vegetative, Hay-like, Herb-like |
| Other | Papery/Musty | Stale, Cardboard, Papery, Woody, Moldy/Damp, Musty/Dusty, Musty/Earthy, Animalic, Meaty brothy, Phenolic |
| | Chemical | Bitter, Salty, Medicinal, Petroleum, Skunky, Rubber |
| Roasted | Pipe tobacco; Tobacco; Burnt; Cereal | Burnt: Acrid, Ashy, Smoky, Brown roast. Cereal: Grain, Malt |
| Spices | Pungent; Pepper; Brown spice | Anise, Nutmeg, Cinnamon, Clove |
| Nutty/Cocoa | Nutty; Cocoa | Peanuts, Hazelnut, Almond; Chocolate, Dark chocolate |
| Sweet | Brown sugar; Vanilla; Vanillin; Overall sweet; Sweet aromatics | Molasses, Maple syrup, Caramelized, Honey |

Source: https://pmc.ncbi.nlm.nih.gov/articles/PMC5215420. The tier-2 order inside Fruity (Berry, Dried Fruit, Other Fruit, Citrus) follows the Table 4 and guide listing (https://open-exam-prep.com/study-guides/sca-q-grader/flavor-wheel-sensory-lexicon/flavor-wheel-architecture). It agrees with Citrus being next to Sour (https://www.beanpoet.com/coffee-flavor-wheel/).

**Precursor grouping (1995 Lingle/SCAA wheel), useful as a coarser check:** aromas were split into *Enzymatic* (floral, fruity, herbal), *Sugar browning* (nutty, caramelly, chocolatey) and *Dry distillation* (resinous, spicy, smoky/carbony), plus aromatic taints (https://open-exam-prep.com/study-guides/sca-q-grader/flavor-wheel-sensory-lexicon/flavor-wheel-architecture, https://coffeehero.com.au/blogs/news/coffee-flavor-wheel). The 1995 wheel coloured enzymatic terms lighter and dry-distillation terms darker (https://portalsisa.sucafina.com/news/i-ve-got-99-flavors).

---

## 2. The 66 QQ descriptors mapped to the lexicon and the wheel

`mapping`: **exact** means a lexicon attribute with the same meaning. **close** means a near attribute or a recognised umbrella. **approximate** means no attribute, but a defensible nearest one. **none** means a compound or culture-specific food with no lexicon term (see the notes). `(+x)` is a secondary family for compound notes. In each row's source column, [1] is always the WCR lexicon (https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) and [2] is the culture-specific source, where there is one.

| RU | Closest WCR attribute | Wheel path (T1 / T2 / T3) | QQ family | mapping | Note | Sources |
|---|---|---|---|---|---|---|
| Апельсин | Orange | Fruity / Citrus Fruit / Orange | citrus | exact |  | [1](https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) |
| Апельсиновые чипсы | Orange | Fruity / Citrus Fruit / Orange | citrus (+dried_fruit) | close | Dried orange slices: no dried-citrus attribute in the lexicon; drier, sweeter than fresh orange. | [1](https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) |
| Барбариски | Berry + Sweet Aromatics (+ Citric Acid) | Fruity / Berry | berry (+caramel) | none | No lexicon term. The candy (Rot Front 'Барбарис') is sugar + syrup with barberry and vanilla flavouring, barberry extract and citric acid; sold as sweet-sour. Read as sweet-tart red-berry candy. | [1](https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) [2](https://vkusvill.ru/goods/karamel-rotfront-barbaris-ledentsovaya-250-g-57518/) |
| Бергамот | Citrus Fruit (no bergamot term) | Fruity / Citrus Fruit | citrus (+floral_tea) | approximate | No bergamot attribute; nearest is Citrus Fruit, which WCR defines as 'somewhat floral' and 'peely'. Bergamot reads as Earl-Grey-tea citrus. | [1](https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) |
| Виноград | Grape | Fruity / Other Fruit / Grape | fruit | exact |  | [1](https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) |
| Виноградная косточка | Grape (+ astringency) | Fruity / Other Fruit / Grape | fruit (+boozy) | approximate | Grape seed implies dryness/astringency; the lexicon keeps astringency in mouthfeel (Mouth Drying), not flavour. Partial overlap with Winey. | [1](https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) |
| Вяленые ягоды | Raisin / Dried Fruit | Fruity / Dried Fruit / Raisin | dried_fruit (+berry) | close | Dried berries; lexicon Dried Fruit is raisin/prune only. | [1](https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) |
| Грейпфрут | Grapefruit | Fruity / Citrus Fruit / Grapefruit | citrus | exact |  | [1](https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) |
| Грильяж | Caramelized + Nutty (Almond/Hazelnut) | Sweet / Brown Sugar / Caramelized | caramel (+chocolate_nut) | none | No lexicon term. Грильяж = roasted nuts (almond, walnut or hazelnut) bound in caramelized sugar syrup or honey, sometimes chocolate-coated: caramel first, nut second. | [1](https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) [2](https://znanierussia.ru/articles/%D0%93%D1%80%D0%B8%D0%BB%D1%8C%D1%8F%D0%B6) |
| Груша | Pear | Fruity / Other Fruit / Pear | fruit | exact |  | [1](https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) |
| Грушевый сидр | Fermented + Pear | Sour/Fermented / Alcohol/Fermented / Fermented | boozy (+fruit) | close | Fermented fruit drink; WCR Fermented = 'pungent, sweet, slightly sour, sometimes yeasty, alcohol-like'. | [1](https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) |
| Дыня | Other Fruit (no melon term) | Fruity / Other Fruit | fruit | approximate | No melon attribute; Other Fruit = 'sweet, light, fruity, somewhat floral'. | [1](https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) |
| Ежевика | Blackberry | Fruity / Berry / Blackberry | berry | exact |  | [1](https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) |
| Желтые фрукты | Peach / Other Fruit | Fruity / Other Fruit / Peach | fruit | approximate | Umbrella (peach, apricot, mango, yellow plum); Peach is the nearest single attribute. | [1](https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) |
| Зеленое яблоко | Apple + Malic Acid | Fruity / Other Fruit / Apple | fruit | close | Tart apple; WCR Malic Acid = 'sour, sharp, somewhat fruity'. | [1](https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) |
| Земляника | Strawberry | Fruity / Berry / Strawberry | berry | close | Wild strawberry; the lexicon has only Strawberry ('frequently winey'). | [1](https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) |
| Земляничное варенье | Strawberry / Berry | Fruity / Berry / Strawberry | berry (+caramel) | close | Cooked jam; WCR Berry reference is itself a preserve (Triple Berry Preserves). | [1](https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) |
| Какао | Cocoa | Nutty/Cocoa / Cocoa | chocolate_nut | exact | On the wheel 'Cocoa' is the tier-2 group holding Chocolate and Dark Chocolate; the lexicon also has a Cocoa attribute. | [1](https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) |
| Карамель | Caramelized | Sweet / Brown Sugar / Caramelized | caramel | exact |  | [1](https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) |
| Клубничный чай | Strawberry + Black Tea | Fruity / Berry / Strawberry | berry (+floral_tea) | close | Compound: light berry over tea. | [1](https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) |
| Косточковые фрукты | Peach / Cherry | Fruity / Other Fruit | fruit | close | No 'stone fruit' group in the lexicon; Peach and Cherry are under Other Fruit (Peach reference: fresh peach pit). | [1](https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) |
| Красные ягоды | Berry (Raspberry, Strawberry) | Fruity / Berry | berry | close |  | [1](https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) |
| Крем-брюле | Caramelized + Vanilla | Sweet / Brown Sugar / Caramelized | caramel | close | No custard/dairy attribute; burnt-sugar top + vanilla. | [1](https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) |
| Курага | Dried Fruit (no apricot term) | Fruity / Dried Fruit | dried_fruit | approximate | Lexicon Dried Fruit is 'dark fruit' (raisin, prune); apricot is lighter and tarter, so Курага sits between Dried Fruit and Peach. WCR Almond mentions apricot notes. | [1](https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) |
| Лакрица | Anise (no licorice term) | Spices / Brown Spice / Anise | spice | approximate | WCR Anise = 'pungent, sweet, brown, caramelized ... medicinal'. | [1](https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) |
| Малина | Raspberry | Fruity / Berry / Raspberry | berry | exact |  | [1](https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) |
| Мандарин | Orange (no mandarin term) | Fruity / Citrus Fruit / Orange | citrus | close |  | [1](https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) |
| Маракуйя | Other Fruit (nearest Pineapple) | Fruity / Other Fruit | fruit | approximate | No passion-fruit attribute; Pineapple = 'sweet, slightly sharp, fruity'. Tropical notes are often reported in fermented/anaerobic lots. | [1](https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) |
| Мед | Honey | Sweet / Brown Sugar / Honey | caramel | exact |  | [1](https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) |
| Молочный шоколад | Chocolate | Nutty/Cocoa / Cocoa / Chocolate | chocolate_nut (+caramel) | close | No milk-chocolate attribute; WCR Chocolate reference is semi-sweet morsels. | [1](https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) |
| Орехи | Nutty | Nutty/Cocoa / Nutty | chocolate_nut | exact |  | [1](https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) |
| Песочное печенье | Sweet Aromatics / Overall Sweet | Sweet / Sweet Aromatics | caramel | close | WCR's flavour reference for Sweet Aromatics and Overall Sweet is Nabisco Lorna Doone cookies, which are shortbread. | [1](https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) [2](https://en.wikipedia.org/wiki/Lorna_Doone_(cookie)) |
| Пралине | Hazelnut + Caramelized | Nutty/Cocoa / Nutty / Hazelnut | chocolate_nut (+caramel) | none | No lexicon term; nut + cooked sugar. | [1](https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) |
| Сладкие специи | Brown Spice | Spices / Brown Spice | spice | exact | WCR Brown Spice = 'sweet, brown aromatic associated with ... cinnamon, clove, nutmeg, and allspice'. | [1](https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) |
| Смородина | Berry (nearest Blackberry/Blueberry) | Fruity / Berry | berry | approximate | No currant attribute. | [1](https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) |
| Сухофрукты | Dried Fruit | Fruity / Dried Fruit | dried_fruit | exact |  | [1](https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) |
| Сушеные ягоды | Raisin / Dried Fruit | Fruity / Dried Fruit / Raisin | dried_fruit (+berry) | close |  | [1](https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) |
| Сушеный апельсин | Orange + Dried Fruit | Fruity / Citrus Fruit / Orange | citrus (+dried_fruit) | close | As for Апельсиновые чипсы. | [1](https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) |
| Сушеный банан | Dried Fruit (no banana term) | Fruity / Dried Fruit | dried_fruit (+boozy) | approximate | No banana attribute; WCR's reference for Overripe/Near Fermented is overripe banana, so banana leans toward the fermented side. | [1](https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) |
| Табачный лист | Tobacco | Roasted / Tobacco | spice | close | WCR Tobacco = 'brown, slightly sweet, slightly pungent aromatic associated with cured tobacco'. | [1](https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) |
| Темные ягоды | Berry (Blackberry, Blueberry) | Fruity / Berry | berry | close | WCR Blackberry and Blueberry are both described as 'dark'. | [1](https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) |
| Темный шоколад | Dark Chocolate | Nutty/Cocoa / Cocoa / Dark Chocolate | chocolate_nut | exact |  | [1](https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) |
| Тмин | Spices (no caraway/cumin term; nearest Anise/Pungent) | Spices | spice | approximate | No attribute for caraway or cumin. | [1](https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) |
| Тост | Grain / Brown, Roast | Roasted / Cereal / Grain | caramel | close | WCR Brown, Roast is 'generally associated with ... toasted, nutty, roasted, and sweet'; Grain = 'light brown, dusty, musty, sweet'. | [1](https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) |
| Тропики | Other Fruit (Pineapple, Coconut) | Fruity / Other Fruit | fruit | close | Umbrella for tropical fruit. | [1](https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) |
| Урбеч | Nutty (Peanuts/Almond; 'oily') | Nutty/Cocoa / Nutty | chocolate_nut | none | No lexicon term. Урбеч = traditional Dagestani paste of seeds, nuts or kernels (flax, sesame, sunflower, hemp, almond, hazelnut...), raw or roasted, stone-ground with oil not separated. Read as roasted nut/seed butter; WCR Nutty includes 'oily'. | [1](https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) [2](https://vkusvill.ru/media/journal/urbech-chto-eto-takoe-chem-polezen-i-s-chem-ego-edyat.html) |
| Фруктовый ликер | Alcohol / Winey + Fruity | Sour/Fermented / Alcohol/Fermented / Winey | boozy (+fruit) | close | WCR Alcohol = 'pungent ... associated with distilled spirits'; Winey = 'sharp, pungent, somewhat fruity, alcohol-like'. | [1](https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) |
| Фрукты | Fruity | Fruity | fruit | exact | Umbrella. WCR Fruity = 'sweet, floral, aromatic blend of a variety of ripe fruits'. | [1](https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) |
| Фундук | Hazelnut | Nutty/Cocoa / Nutty / Hazelnut | chocolate_nut | exact |  | [1](https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) |
| Хмель | Herb-like (no hop term) | Green/Vegetative / Green/Vegetative / Herb-like | spice | none | No hop attribute. Nearest is Herb-like ('sweet, slightly pungent, slightly bitter'). It also points to beer and fermentation (WCR Fermented reference is Guinness stout; 'hops' appeared among descriptors of an anaerobically fermented natural). | [1](https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) [2](https://mdpi.com/2304-8158/11/24/3945) |
| Цветочный мед | Honey + Floral | Sweet / Brown Sugar / Honey | caramel (+floral_tea) | close |  | [1](https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) |
| Цветы | Floral | Floral / Floral | floral_tea | exact |  | [1](https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) |
| Цедра | Citrus Fruit (peel) | Fruity / Citrus Fruit | citrus | close | WCR Citrus Fruit is 'peely'; its references are lemon/lime peel and grapefruit peel. | [1](https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) |
| Цедра апельсина | Orange (peel) | Fruity / Citrus Fruit / Orange | citrus | close | WCR Orange 'may include bitter, peely, and astringent notes'. | [1](https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) |
| Цедра цитрусов | Citrus Fruit (peel) | Fruity / Citrus Fruit | citrus | close |  | [1](https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) |
| Цитрус | Citrus Fruit | Fruity / Citrus Fruit | citrus | exact |  | [1](https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) |
| Цитрусы | Citrus Fruit | Fruity / Citrus Fruit | citrus | exact | Plural of Цитрус; merge. | [1](https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) |
| Чай | Black Tea | Floral / Black Tea | floral_tea | close |  | [1](https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) |
| Чай с бергамотом | Black Tea + Citrus | Floral / Black Tea | floral_tea (+citrus) | close | Earl Grey. | [1](https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) |
| Черный чай | Black Tea | Floral / Black Tea | floral_tea | exact | WCR Black Tea = 'somewhat brown, musty, dried plant and dried bark aromatic'. | [1](https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) |
| Шиповник | Berry / Other Fruit (nearest Cherry, Pomegranate) | Fruity / Berry | berry (+floral_tea) | none | No rosehip attribute. As a tart, dark red fruit it is nearest WCR Cherry ('sour, fruity') or Pomegranate ('sour, sweet ... dark'); in Russia it is mostly drunk as an infusion, so it also reads tea-like. | [1](https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) |
| Шоколад | Chocolate | Nutty/Cocoa / Cocoa / Chocolate | chocolate_nut | exact |  | [1](https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) |
| Яблоко | Apple | Fruity / Other Fruit / Apple | fruit | exact |  | [1](https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) |
| Яблочная пастила | Apple (cooked) + Sweet | Fruity / Other Fruit / Apple | fruit (+caramel) | none | No lexicon term. Пастила = dried fruit/berry purée with honey or sugar (egg white in the zephyr-like kind), sweet-sour. WCR Apple flavour reference is applesauce (cooked apple). | [1](https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) [2](https://znanierussia.ru/articles/%D0%9F%D0%B0%D1%81%D1%82%D0%B8%D0%BB%D0%B0) |
| Ягодные леденцы | Berry + Sweet Aromatics | Fruity / Berry | berry (+caramel) | none | Hard candy; no candy attribute. | [1](https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) |
| Ягоды | Berry | Fruity / Berry | berry | exact |  | [1](https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) |

**The four culture-specific terms:**
- **Урбеч:** a traditional Dagestani paste of ground seeds, nuts or kernels (flax, sesame, pumpkin, sunflower, hemp, peanut, almond, hazelnut, cashew, walnut), raw, dried or roasted, traditionally ground on stone millstones without removing the oil (https://vkusvill.ru/media/journal/urbech-chto-eto-takoe-chem-polezen-i-s-chem-ego-edyat.html). The closest attribute is **Nutty** (WCR definition includes "oily", https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36). Family `chocolate_nut`.
- **Барбариски:** Rot Front "Барбарис" hard caramel contains sugar, syrup, barberry and vanilla flavourings, barberry extract and citric acid, and is sold as "кисло-сладкие" (https://vkusvill.ru/goods/karamel-rotfront-barbaris-ledentsovaya-250-g-57518/). It maps to **Berry + Sweet aromatics + Citric acid**. Family `berry` (+`caramel`).
- **Грильяж:** roasted nuts (usually almond, walnut or hazelnut) set in caramelized sugar syrup or honey, sometimes chocolate-coated (https://znanierussia.ru/articles/%D0%93%D1%80%D0%B8%D0%BB%D1%8C%D1%8F%D0%B6). It maps to **Caramelized + Nutty**. Family `caramel` (+`chocolate_nut`).
- **(Яблочная) пастила:** a confection of dried fruit or berry purée with honey or sugar, with egg white in the zephyr-like kind; taste "кисло-сладкий" (https://znanierussia.ru/articles/%D0%9F%D0%B0%D1%81%D1%82%D0%B8%D0%BB%D0%B0). It maps to **Apple** (the WCR Apple flavour reference is applesauce, i.e. cooked apple, https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36) + Sweet. Family `fruit` (+`caramel`).

**Duplicates and aliases to merge before modelling [judgement]:** Цитрус = Цитрусы; Сушеные ягоды ≈ Вяленые ягоды; Цедра ≈ Цедра цитрусов; Апельсиновые чипсы ≈ Сушеный апельсин.

---

## 3. Proposed QQ flavour families [judgement, grounded as noted]

### 3.1 Families
Nine families. The order in the table is the circular order (Section 3.2).

| # | id | RU | Wheel categories covered | Everyday reference (RU shopper) | WCR lexicon references | # primary descriptors |
|---|---|---|---|---|---|---|
| 1 | `caramel` | Карамель, мёд и выпечка | Sweet > Brown Sugar (Caramelized, Honey, Molasses, Maple Syrup); Sweet > Vanilla/Vanillin; Sweet > Overall Sweet / Sweet Aromatics; Roasted > Cereal (Grain, Malt) | ириска / жжёный сахар, мёд, песочное печенье, поджаренный хлеб | Caramelized: Le Nez du Café no.25 'caramel', caramelized white cane sugar; Brown Sugar: C&H Golden Brown; Honey: Busy Bee Pure Clover Honey; Sweet Aromatics/Overall Sweet: Nabisco Lorna Doone (shortbread) cookies; Grain: Rice Chex + Wheaties + Quick Oats | 7 |
| 2 | `floral_tea` | Цветы и чай | Floral > Floral (Chamomile, Rose, Jasmine); Floral > Black Tea | чёрный чай без сахара, ромашковый чай, «Эрл Грей» | Floral: Welch's 100% White Grape juice, carnation essence oil, Le Nez du Café n.12 'coffee blossom'; Black Tea: Lipton Black Tea; Chamomile: Celestial Seasonings Chamomile Tea; Rose: rose water; Jasmine: jasmine extract | 4 |
| 3 | `berry` | Ягоды | Fruity > Berry (Blackberry, Raspberry, Blueberry, Strawberry) | малиновое или земляничное варенье, ежевика, смородина | Berry: Private Selection Triple Berry Preserves, Welch's Unfiltered Blackberry juice; Strawberry: Dole whole strawberries; Raspberry: Jell-O Raspberry powder; Blackberry: Smucker's Blackberry Jam; Blueberry: canned blueberries in light syrup | 12 |
| 4 | `dried_fruit` | Сухофрукты | Fruity > Dried Fruit (Raisin, Prune) | изюм, чернослив, курага | Dried Fruit: Sunsweet prune juice; Sun-Maid raisins + prunes; Raisin: Sun-Maid Raisins; Prune: Sun-Maid Prunes | 5 |
| 5 | `fruit` | Фрукты (сад, косточковые, тропики) | Fruity > Other Fruit (Apple, Pear, Peach, Cherry, Grape, Pomegranate, Pineapple, Coconut); Fruity (umbrella) | яблоко, груша, персик/абрикос, виноград, ананас | Other Fruit / Fruity: Le Nez du Café n.17 'apple'; Apple: Gerber applesauce; Pear: Jumax pear nectar; Peach: fresh peach pit, Jell-O Peach; Grape: Welch's Concord grape juice; Cherry: R.W. Knudsen Just Tart Cherry; Pineapple: Dole pineapple juice | 12 |
| 6 | `citrus` | Цитрусовые | Fruity > Citrus Fruit (Grapefruit, Orange, Lemon, Lime) | апельсин, мандарин, грейпфрут, цедра лимона | Citrus Fruit: peels of lemon and lime; grapefruit peel; Five Alive Citrus concentrate; Orange: Tropicana no-pulp OJ; Grapefruit: white grapefruit juice; Lemon: fresh lemon juice; Lime: lime peel, ReaLime | 11 |
| 7 | `boozy` | Винные и ферментированные | Sour/Fermented > Alcohol/Fermented (Winey, Whiskey, Fermented, Overripe) | сидр, красное вино, фруктовая наливка/ликёр, перезрелый банан | Winey: Yellow Tail Cabernet Sauvignon; Whiskey: Jack Daniel's Old No.7; Fermented: Guinness Extra Stout, fermented grass; Alcohol: Absolut Vodka; Overripe/Near Fermented: overripe banana | 2 |
| 8 | `spice` | Пряности, травы и табак | Spices > Brown Spice (Anise, Nutmeg, Cinnamon, Clove); Spices > Pepper, Pungent; Roasted > Tobacco / Pipe Tobacco; Green/Vegetative > Herb-like | корица и гвоздика (пряник), лакрица, табачный лист, ржаной хлеб с тмином | Brown Spice: cinnamon sticks; nutmeg + clove; ground cinnamon/allspice/nutmeg/clove mix; Anise: Tone's anise extract; Tobacco: Le Nez du Café no.33 'pipe tobacco', Camel cigarettes, cigar tobacco; Herb-like: bay leaf + thyme + basil | 5 |
| 9 | `chocolate_nut` | Шоколад и орехи | Nutty/Cocoa > Cocoa; Nutty/Cocoa > Nutty | плитка тёмного шоколада, какао-порошок, жареный фундук | Chocolate: Nestle Toll House Semi-Sweet Chocolate Morsels; Cocoa: Hershey's Cocoa Powder Natural Unsweetened in water; Dark Chocolate: Lindt Excellence 90%; Nutty: Le Nez du Café no.29 'roasted hazelnuts', sliced almonds + walnuts; Hazelnut: Le Nez du Café no.29 | 8 |

WCR references are quoted from the lexicon (https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36). The Lorna Doone cookie used as WCR's Sweet aromatics/Overall sweet reference is a shortbread cookie (https://en.wikipedia.org/wiki/Lorna_Doone_(cookie)), so **Песочное печенье is the lexicon's own reference food**.

**Decisions and the evidence behind them:**
- **Nuts go with cocoa, and caramel goes with Sweet.** The wheel's tier 1 puts Nutty and Cocoa in one class, and Brown sugar/Caramelized/Honey in a separate Sweet class (https://pmc.ncbi.nlm.nih.gov/articles/PMC5215420). All three were one "sugar browning" group in 1995 (https://open-exam-prep.com/study-guides/sca-q-grader/flavor-wheel-sensory-lexicon/flavor-wheel-architecture), so caramel stays very close to chocolate/nut in the similarity matrix (0.75). Alternative if QQ wants "chocolate" alone as the headline family: split `chocolate` / `nut_caramel`. That alternative contradicts the 2016 tier 1 but matches 1995 sugar-browning and Russian label habits.
- **Dried fruit is its own family.** It is a separate tier-2 group under Fruity (https://pmc.ncbi.nlm.nih.gov/articles/PMC5215420). WCR defines it as "dark fruit that is sweet and slightly brown", Raisin as "concentrated, sweet ... brown" and Prune as including "overripe" (https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36). That places it between fresh fruit, sweet/brown and fermented, which differs from bright fresh fruit. QQ uses it often (5 primary and 2 secondary descriptors).
- **Stone, tropical and orchard fruit share one family,** because the lexicon has no stone-fruit or tropical group. Peach, Cherry, Pineapple, Coconut, Apple, Pear and Grape all sit in Other Fruit (https://pmc.ncbi.nlm.nih.gov/articles/PMC5215420). Tropical descriptors carry a `ferment` tag in the JSON instead of a separate family.
- **Floral and tea share a family,** following tier-1 Floral, which includes Black Tea (https://pmc.ncbi.nlm.nih.gov/articles/PMC5215420).
- **The boozy family has only 2 primary descriptors in the current table** (Фруктовый ликер, Грушевый сидр). It is kept because it is the main signal for "unusual/processing-driven" coffees (Section 4), and secondary tags (Виноградная косточка, Сушеный банан) feed into it.
- **Spice/herbal/tobacco is a deliberate catch-all** across three wheel classes (Spices, Roasted › Tobacco, Green/Vegetative › Herb-like). The wheel puts Roasted next to Spices (https://pmc.ncbi.nlm.nih.gov/articles/PMC5215420, https://open-exam-prep.com/study-guides/sca-q-grader/flavor-wheel-sensory-lexicon/flavor-wheel-architecture).

### 3.2 Circular order and similarity matrix
`family_order` (circular): **caramel → floral_tea → berry → dried_fruit → fruit → citrus → boozy → spice → chocolate_nut → (caramel)**.

This order follows the wheel's clockwise tier-1 order (Sweet → Floral → Fruity → Sour/Fermented → [Green, Other, Roasted] → Spices → Nutty/Cocoa), with Fruity unfolded in its tier-2 order (https://pmc.ncbi.nlm.nih.gov/articles/PMC5215420, https://open-exam-prep.com/study-guides/sca-q-grader/flavor-wheel-sensory-lexicon/flavor-wheel-architecture, https://www.beanpoet.com/coffee-flavor-wheel/).

How the similarity matrix was built: a base value from distance on the 9-step ring (0 → 1.0, 1 → 0.7, 2 → 0.45, 3 → 0.25, 4 → 0.1), then hand adjustments. Each adjustment and its reason is listed in `lexicon.json → family_similarity_method.adjustments`. The main ones:
- All fruit families keep at least 0.4 to each other (same tier 1).
- Dried fruit is raised toward caramel and boozy (WCR "brown" and "overripe").
- Berry and boozy are raised (WCR Strawberry is "frequently winey"; Winey is "somewhat fruity").
- Chocolate_nut and caramel = 0.75.
- Chocolate and citrus = 0.10 (opposite sides of the wheel).

| | caramel | floral_tea | berry | dried_fruit | fruit | citrus | boozy | spice | chocolate_nut |
|---|---|---|---|---|---|---|---|---|---|
| **caramel** | 1.00 | 0.60 | 0.45 | 0.40 | 0.25 | 0.10 | 0.25 | 0.50 | 0.75 |
| **floral_tea** | 0.60 | 1.00 | 0.70 | 0.45 | 0.40 | 0.35 | 0.10 | 0.25 | 0.30 |
| **berry** | 0.45 | 0.70 | 1.00 | 0.70 | 0.60 | 0.55 | 0.45 | 0.10 | 0.25 |
| **dried_fruit** | 0.40 | 0.45 | 0.70 | 1.00 | 0.70 | 0.40 | 0.45 | 0.25 | 0.30 |
| **fruit** | 0.25 | 0.40 | 0.60 | 0.70 | 1.00 | 0.70 | 0.45 | 0.15 | 0.10 |
| **citrus** | 0.10 | 0.35 | 0.55 | 0.40 | 0.70 | 1.00 | 0.45 | 0.15 | 0.10 |
| **boozy** | 0.25 | 0.10 | 0.45 | 0.45 | 0.45 | 0.45 | 1.00 | 0.35 | 0.30 |
| **spice** | 0.50 | 0.25 | 0.10 | 0.25 | 0.15 | 0.15 | 0.35 | 1.00 | 0.55 |
| **chocolate_nut** | 0.75 | 0.30 | 0.25 | 0.30 | 0.10 | 0.10 | 0.30 | 0.55 | 1.00 |


### 3.3 Optional axes (in JSON `family_axes`) [judgement]
These are per-family scores (0–1) for `acidity`, `fermentation` and `roast_classic`, so QQ can show "bright ↔ classic" and "clean ↔ unusual" sliders. They are not measured values and are informed by Section 4.

---

## 4. Families vs. perceived acidity, "classic" taste and fermentation

**Fruit families ↔ sourness/brightness**
- WCR's definitions build sourness into the fruit attributes themselves. Citrus Fruit is "citric, sour, astringent, slightly sweet, peely"; Berry is "sweet, sour, floral"; Cherry is "sour, fruity"; Pomegranate is "sour, sweet"; Malic acid is "sour, sharp, somewhat fruity" (https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36).
- On the wheel, Citrus Fruit sits next to Sour (https://www.beanpoet.com/coffee-flavor-wheel/).
- In a trained-panel study of drip brew, "Sour, Citrus, Berry, and Fruity all increase considerably in directions of lower PE" (extraction), and "Berry might also be a flavour that is associated with sourness". Bitter, Ashy and Brown Roast increase with higher extraction. (https://www.nature.com/articles/s41598-020-73341-4)
- Across roast levels, "the lighter roasts were more floral, fruity, and sour" and "the darker roasts were more burnt, bitter, and roasted". Citrus and berry had very large roast F-values (https://escholarship.org/content/qt4ws465qm/qt4ws465qm.pdf?t=ri74ne).
- Seninde & Chambers report cooler plots giving "acidity and fruity flavor characteristics", and Ethiopian coffee linked to monoterpenes ("citrus-like aroma") (https://www.mdpi.com/2306-5710/6/3/44).
- **Conclusion:** citrus > berry > other fruit and floral go with high perceived acidity.

**Chocolate, nut and caramel ↔ low acidity / "classic"**
- Roasting cuts chlorogenic acids "to about 50% at the medium roast level". Medium roasts had higher cocoa intensities. Furans explain "Sweet aromatics, Caramel, and Burnt", and pyrazines, pyrroles and pyridines give "nutty, roasted, and toasted notes" (https://www.mdpi.com/2306-5710/6/3/44).
- These are the 1995 "sugar browning" notes (https://open-exam-prep.com/study-guides/sca-q-grader/flavor-wheel-sensory-lexicon/flavor-wheel-architecture).
- In a survey of self-induced-anaerobic Brazilian lots, the most frequent primary descriptors were "chocolate, molasses, caramel, brown sugar, and fruity", so this cluster is the baseline vocabulary even in experimental lots (https://mdpi.com/2304-8158/11/24/3945).

**Boozy, winey, tropical, hops ↔ fermentation / "unusual"**
- WCR places Winey, Whiskey, Fermented and Overripe in Alcohol/Fermented. Fermented = "pungent, sweet, slightly sour, sometimes yeasty, alcohol-like" (reference: Guinness stout). Overripe reference: overripe banana. (https://worldcoffeeresearch.org/download/5806d8c7-cd7c-4882-a81a-2850bd6fbd36)
- Industry (Coffee Review): yeast-driven fermentation can add "wine-like, or brandy-like" notes. Anaerobic lots are cited with "tropical fruit, dark chocolate" and cinnamon/spice. Such coffees are "sweet, yet often sour too". (https://www.coffeereview.com/anaerobic-fermentation-and-other-palate-bending-processing-experiments/)
- Industry (Blue Bottle): naturals show "vivid fruited and sometimes wine-like notes" with "greater body and less acidity". Washed coffees have "higher acidity". Honeys have body and low acidity "without the telltale vivid fruits". (https://blog.bluebottlecoffee.com/posts/coffee-processing-basics)
- Peer-reviewed: Seninde & Chambers summarise pulp naturals as heavy-bodied with "lasting sweet fruity flavor", and washed as "sweet with a pointed acidity, medium body, and clean finish". Yeast starter cultures gave caramel notes, and *Pichia fermentans* gave vanilla and floral notes. (https://www.mdpi.com/2306-5710/6/3/44)
- An anaerobic (SIAF) natural lot at 1400 m uniquely showed "raspberry, cocoa, rum, lychee, pear, roses, and hops" (https://mdpi.com/2304-8158/11/24/3945). In volcanic-fermentation trials, "Tropical fruits appeared only" in the container treatments (https://pmc.ncbi.nlm.nih.gov/articles/PMC12027445).
- Consumer side: a "fermentation" label raised expected and perceived acidity and lowered liking and purchase intent (https://www.mdpi.com/2304-8158/15/8/1287).
- **Caveat:** fermentation does not mean high acidity in a simple way. Naturals are described as lower in acidity than washed (https://blog.bluebottlecoffee.com/posts/coffee-processing-basics, https://www.mdpi.com/2306-5710/6/3/44), yet fermented lots can be "sour too" (https://www.coffeereview.com/anaerobic-fermentation-and-other-palate-bending-processing-experiments/). Keep `acidity` and `fermentation` as **separate axes**.

---

## 5. How reliable is descriptor overlap as a similarity signal?
- Di Donfrancesco, Gutierrez Guzman & Chambers (2014, *J. Sens. Stud.* 29:301): cuppers' notes "indicate lack of agreements on the terms used to describe samples". Only four terms were used by more than two assessors for any one coffee, and the authors found "an extremely high inconsistency level among cuppers' notes". They attribute this to a lack of shared definitions. The trained descriptive panel reached agreement on all terms. (https://core.ac.uk/download/33353954.pdf)
- Seninde & Chambers (2020): "the cuppers were highly variable in terms of flavor evaluation". Descriptive panels gave more detailed profiles than cupping. (https://www.mdpi.com/2306-5710/6/3/44)
- Croijmans & Majid (2016, PLoS ONE): wine experts were more consistent than novices, "but coffee experts were not more consistent for coffee descriptions". (https://eprints.whiterose.ac.uk/136330)
- Even when the experts sorted the words into the wheel, industry and UC Davis panels agreed only moderately with each other (RV 0.414) (https://pmc.ncbi.nlm.nih.gov/articles/PMC5215420).

**Implication [judgement]:** exact-word overlap between two QQ cards is a weak, noisy signal. One roaster's single team is more consistent than many cuppers, but the literature gives no evidence on within-roaster consistency. Matching at family level with the similarity matrix (so "Малина" vs "Красные ягоды" counts as near), plus the acidity/fermentation axes and process/roast metadata, should be more robust than word overlap. Weight family overlap above exact-term overlap.

---

## 6. Uncertain or unresolved
- **Cluster tree:** the actual dendrogram and MDS coordinates (Figs. 3–4) could not be read as text. Neighbour relations here come from the wheel's printed order and the SCA/contributor descriptions, not from the tree's merge heights.
- **Wheel order source:** the clockwise tier-1 and tier-2 order is taken from Spencer Table 4's listing order plus a third-party study guide (https://open-exam-prep.com/study-guides/sca-q-grader/flavor-wheel-sensory-lexicon/flavor-wheel-architecture). The paper itself does not state that Table 4's order is the wheel order. Check against the physical poster.
- **Gap claims:** the guide says there is a wide gap between Floral and Fruity and between Green/Vegetative and Other (https://open-exam-prep.com/study-guides/sca-q-grader/flavor-wheel-sensory-lexicon/flavor-wheel-architecture). This is unverified against the poster. If true, floral_tea–berry (0.70) may be too high.
- **Similarity values** are hand-set from ring distance plus definition overlaps. They are not estimated from data. If QQ has tasting data or card co-occurrence counts, refit them.
- **Mapping strength:** 22 descriptors are exact, 26 close, 10 approximate and 8 have no lexicon term.
  - None (8): Барбариски, Грильяж, Пралине, Урбеч, Хмель, Шиповник, Яблочная пастила, Ягодные леденцы.
  - Approximate (10): Бергамот, Виноградная косточка, Дыня, Желтые фрукты, Курага, Лакрица, Маракуйя, Смородина, Сушеный банан, Тмин. Шиповник (berry vs tea) and Тост (caramel vs roasted) are the least certain placements.
- **Industry sources:** Blue Bottle, Coffee Review, beanpoet and the study guide are industry or secondary sources. Peer-reviewed support for "natural = winey/fermented" here is limited to the Seninde & Chambers review and the single SIAF study.
- **Language:** the WCR lexicon is English. Russian everyday references in the families table are my proposals.
