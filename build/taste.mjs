// The taste model of QQ's coffees: one position per coffee, a distance that means "tastes alike", and the best single
// step in each direction (brighter / softer, denser / lighter, more unusual / more classic), each with its reason.
// The related coffees, the catalogue, the quiz, people's picks and the feedback after delivery all read this.
//
//   node build/taste.mjs   → src/data/taste.json      the model (positions, neighbours, directions, anchors)
//                            docs/taste-output.md     the same, readable, for review (commit it)
//                            docs/notion-fixes.md     what to fix in the Notion table (commit it)
//
// Input: data/products.csv (the Notion export; the coffees of the site are build/data.mjs's), data/flavours.json (the
// flavour families). The arithmetic is src/scripts/taste.js. How it works and why: docs/taste-model.md.
// The data is cleaned here, never by hand in the CSV: every cleaning is logged and becomes a line of notion-fixes.md.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { parseCsv, build as buildProducts } from "./data.mjs";
import { WEIGHTS, AXES, familyMatrix, flavourSim, distance } from "../src/scripts/taste.js";

const root = resolve(import.meta.dirname, "..");
const read = (f) => readFileSync(resolve(root, f), "utf8");
const FLAV = JSON.parse(read("data/flavours.json"));
const FAM = new Map(FLAV.families.map((f) => [f.id, f]));
const S = familyMatrix(FLAV.families, FLAV.similarity);
// what QQ has run out of (data/site.json shop.unavailable): the page's block never offers it (the model itself ignores stock)
const OUT = new Set(JSON.parse(read("data/site.json")).shop.unavailable);

// ── the rules, in one place ──────────────────────────────────────────────────────────────────────────────────────
export const RULES = {
  step: 0.45,          // a direction needs at least this much more (or less) on its axis: QQ's smallest step is half a point
  overshoot: 0.4,      // each point beyond one full step counts this much against a candidate ("one step", not "the most")
  far: 1.6,            // a step whose other axes and flavour differ by more than this is shown, but said to be far
  neighbours: 5,       // how many nearest coffees each coffee carries
  milkBonus: 0.25,     // "denser" is the step towards milk: a candidate QQ tags «Молочные напитки» is preferred by this much
  lift: 0.2,           // the most a coffee's descriptors may move it inside one step of acidity
  unusualLift: { experimental: 0.3, wetHull: 0.2, excelsa: 0.2, robusta: -0.1, families: 0.1 },
  // the coffee page's block «Что взять еще» (session 2): one coffee per move, each coffee once
  milkBrighter: 0.5,   // «под молоко»: each point of acidity above this coffee's counts this much against a milk coffee
  swap: 0.3,           // a coffee that two moves both pick stays with the first; the second takes its own next candidate
                       // when that one scores at most this much worse, else the two moves share one card
  unusualFrom: 2,      // from ferment 2 on (QQ's scale) the block offers «классичнее» instead of «необычнее»
  softerBody: 1,       // «мягче» on the page: at most this many points denser…
  softerWild: 0.5,     // …and at most this much more unusual
  roastGap: 0.35       // on the page: a coffee sold in none of this one's roasts counts this much against it
};
export const DIRECTIONS = [
  { id: "brighter", axis: "bright", sign: 1, ru: "Ярче", edge: "Ярче этого у QQ сейчас нет: это одна из самых ярких чашек." },
  { id: "softer", axis: "bright", sign: -1, ru: "Мягче", edge: "Мягче этого у QQ сейчас нет: кислотность здесь одна из самых низких." },
  { id: "denser", axis: "body", sign: 1, ru: "Плотнее", edge: "Плотнее этого у QQ сейчас нет: это одна из самых плотных чашек." },
  { id: "lighter", axis: "body", sign: -1, ru: "Легче", edge: "Легче этого у QQ сейчас нет: это одна из самых лёгких чашек." },
  { id: "unusual", axis: "unusual", sign: 1, ru: "Необычнее", edge: "Необычнее этого у QQ сейчас нет: это один из самых экспериментальных лотов." },
  { id: "classic", axis: "unusual", sign: -1, ru: "Классичнее", edge: "Классичнее этого у QQ нет: фермент по шкале QQ 0." }
];
const AXIS = {
  bright: { scale: "acidity", label: "кислотность", more: "ярче", less: "мягче" },
  body: { scale: "density", label: "плотность", more: "плотнее", less: "легче" },
  unusual: { scale: "ferment", label: "фермент", more: "необычнее", less: "классичнее" },
  sweet: { scale: "sweetness", label: "сладость", more: "слаще", less: "менее сладкий" }
};

// ── cleaning ─────────────────────────────────────────────────────────────────────────────────────────────────────
const fixes = [];   // { kind, coffee, field, value, fix } → docs/notion-fixes.md
const fix = (kind, coffee, field, value, text) => fixes.push({ kind, coffee, field, value, fix: text });
const strip = (s) => (s || "").replace(/\s*\[[^\]]*\]/g, "").replace(/\s+/g, " ").trim();

// processing, whatever the spelling (Натуральная / Натуральный, Мытая / Мытый) → codes
const PROC = [
  ["semi-anaerobic", /полуанаэроб/i], ["anaerobic", /(^|[^у])анаэроб/i], ["culturing", /культуринг|ко-?фермент|culturing/i],
  ["natural", /натурал/i], ["washed", /мыт/i], ["honey", /хани|honey|pulped/i], ["wet-hull", /вэт-халл|wet-?hull|гилинг/i],
  ["decaf", /декаф/i], ["ice", /\bice\b/i]
];
export const procCodes = (s) => PROC.filter(([, re]) => re.test(strip(s))).map(([c]) => c);
const EXPERIMENTAL = new Set(["semi-anaerobic", "anaerobic", "culturing"]);
const PROC_RU = { natural: "натуральная", washed: "мытая", honey: "хани", "semi-anaerobic": "полуанаэробная", anaerobic: "анаэробная", culturing: "культуринг", "wet-hull": "вэт-халл", decaf: "декаф", ice: "ice" };

// the green coffee of a coffee, as a key: the same lots in the same shares are the same coffee under another label.
// Lot names are compared loosely (case, ё/е, hyphens, dots, spaces), since Notion is typed by hand.
export const normName = (s) => strip(s).toLowerCase().replace(/ё/g, "е").replace(/[-–—.,()«»"'/]+/g, " ").replace(/\s+/g, " ").trim();
const lotsOf = (s) => strip(s).split(";").map((x) => x.trim()).filter(Boolean)
  .map((x) => { const i = x.lastIndexOf("—"); const lot = i < 0 ? x : x.slice(0, i), share = i < 0 ? "" : x.slice(i + 1); return { lot: normName(lot), share: parseInt(share, 10) || 100, decaf: /декаф|decaf/i.test(share) }; });
const greenKey = (s) => lotsOf(s).map((x) => `${x.lot}:${x.share}`).sort().join("+");
// two green keys that differ only by a typo or two in a lot's name (same shares) are the same green coffee
function lev(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
export function sameGreen(x, y) {
  const A = lotsOf(x).sort((p, q) => p.lot.localeCompare(q.lot)), B = lotsOf(y).sort((p, q) => p.lot.localeCompare(q.lot));
  return A.length > 0 && A.length === B.length && A.every((a, i) => a.share === B[i].share && lev(a.lot, B[i].lot) <= 2);
}
// a relabel's name is usually its coffee's name plus the partner's («Колумбия Антиокия St. Riders»)
const namePrefix = (a, b) => { const x = normName(a), y = normName(b); return x !== y && (x.startsWith(y + " ") || y.startsWith(x + " ")); };

function audit(rows, products) {
  const site = rows.filter((r) => r["На сайте"] === "Да");
  // the same coffee twice on the site
  const byName = new Map();
  for (const r of site) { const n = strip(r["Название"]); byName.set(n, [...(byName.get(n) || []), r]); }
  for (const [n, rs] of byName) if (rs.length > 1) {
    const kept = products.find((p) => p.name === n);
    fix("duplicate", n, "На сайте", rs.map((r) => r["ID"]).join(", "),
      `Одна и та же позиция «На сайте» дважды (${rs.map((r) => `${r["ID"]}: Применение «${r["Применение"]}»`).join("; ")}). Сайт берёт ${kept.id}. Снять «На сайте» с лишней строки или удалить её.`);
  }
  // the same name twice among the other rows (not on the site), and names with a double space
  const allNames = new Map();
  for (const r of rows.filter((x) => x["На сайте"] !== "Да")) { const k = normName(r["Название"]); allNames.set(k, [...(allNames.get(k) || []), r]); }
  for (const rs of allNames.values()) if (rs.length > 1) fix("duplicate", strip(rs[0]["Название"]), "Название", rs.map((r) => r["ID"]).join(", "), `Две строки с одним названием (не на сайте). Если это одно и то же — удалить лишнюю.`);
  for (const r of rows) if (/\S {2,}\S/.test(r["Название"])) fix("spelling", r["Название"].replace(/ {2,}/g, " "), "Название", r["Название"].replace(/ /g, "·"), "Двойной пробел в названии.");
  // values with an older wording in [brackets], and values split apart by them
  for (const r of site) for (const f of ["Название", "Дескрипторы", "Краткое описание", "Обжарка", "Обработка", "Теги"]) {
    const v = r[f] || "";
    if (!/[[\]]/.test(v)) continue;
    if (f === "Дескрипторы") {
      const parts = v.split(",").map((x) => x.trim());
      const broken = parts.filter((x) => (x.match(/\[/g) || []).length !== (x.match(/\]/g) || []).length);
      if (broken.length) { fix("broken", strip(r["Название"]), f, v, `Значение мультиселекта разорвано скобкой: ${broken.map((b) => `«${b}»`).join(" и ")} — это одно значение. Сайт читает «${strip(v)}». Удалить эти опции в Notion и поставить нужные целиком (вероятно «Шоколад» и, если он нужен, «Лесные ягоды»).`); continue; }
    }
    fix("bracket", strip(r["Название"]), f, v, strip(v) ? `В значении осталась старая формулировка в скобках. Сайт читает «${strip(v)}». Оставить одно значение.` : "Значение целиком в скобках, поэтому сайт его не показывает. Оставить без скобок или удалить.");
  }
  // processing spelt two ways
  const spelt = rows.filter((r) => /Натуральный|Мытый/.test(r["Обработка"] || ""));
  if (spelt.length) fix("spelling", `${spelt.length} строк`, "Обработка", [...new Set(spelt.map((r) => r["Обработка"]))].join(", "),
    `Обработка записана в мужском роде (${spelt.map((r) => strip(r["Название"])).join(", ")}). Привести к одному виду: «Натуральная», «Мытая». Сборка читает оба написания.`);
  // price groups that are not prices
  const prices = JSON.parse(read("data/prices.json")).groups;
  const citric = site.filter((r) => r["Ценовая группа"] === "Citric");
  if (citric.length) fix("field", `${citric.length} кофе`, "Ценовая группа", "Citric",
    `«Citric» читается как вкус («цитрусовый»), а не как цена, хотя в группе кофе с кислотностью от 2 до 4 (${[...new Set(citric.map((r) => strip(r["Название"])))].join(", ")}). Если это ценовой уровень между Classic и Special — дать ему имя, которое читается как цена. Сайт держит для неё отдельную цену (data/prices.json).`);
  for (const r of site) if (r["Линейка"] && r["Ценовая группа"] && r["Линейка"] !== r["Ценовая группа"] && r["Линейка"] === "Special")
    fix("field", strip(r["Название"]), "Линейка / Ценовая группа", `${r["Линейка"]} / ${r["Ценовая группа"]}`, `Единственный кофе линейки Special не в ценовой группе Special. Проверить, так ли задумано.`);
  for (const r of site) if (r["Ценовая группа"] && !prices[r["Ценовая группа"]]) fix("field", strip(r["Название"]), "Ценовая группа", r["Ценовая группа"], "Нет такой ценовой группы в прайсе.");
  // «—» as a value
  for (const r of site) if ((r["Применение"] || "").trim() === "—") fix("empty", strip(r["Название"]), "Применение", "—", "Пустое значение записано как «—»: оставить поле пустым или заполнить.");
  // the sticker's countries vs the green coffee's lots
  for (const r of site.filter((x) => x["Тип"] === "Смесь")) {
    const lots = strip(r["Состав зеленого кофе"]), sticker = strip(r["Состав на стикере"]) + " " + strip(r["Состав смеси"]);
    for (const [lot, country] of [["Уганда Робуста", "Вьетнам"]]) if (lots.includes(lot) && sticker.includes(country) && !sticker.includes("Уганда"))
      fix("conflict", strip(r["Название"]), "Состав зеленого кофе / Состав на стикере", `${lot} / ${country}`, `В составе зелёного кофе «${lot}», на стикере и в описании — ${country}. Сайт показывает страну по стикеру (${country}). Проверить, чья робуста сейчас в смеси, и исправить одно из полей.`);
  }
  // pulped natural written as natural
  for (const r of site) if (/pulped natural/i.test(r["О сорте"]) && !/хани|pulped/i.test(r["Обработка"]))
    fix("conflict", strip(r["Название"]), "Обработка", r["Обработка"], "В «О сорте» обработка pulped natural (это ближе к хани), в поле — «Натуральная». Привести к одному.");
  // what the text says vs the scales
  const SAYS = [
    ["density", (v) => v <= 3, /плотн(ое|ым|ую|ая) (тело|текстур)|тело плотное/i, "текст говорит о плотном теле"],
    ["density", (v) => v >= 4, /мягк(им|ое) тел/i, "текст говорит о мягком теле"],
    ["acidity", (v) => v <= 3, /(ярк(ой|ую|ая)|богат(ой|ую)|высок(ая|ую)|насыщенн(ую|ой)) кислотност/i, "текст говорит о яркой / высокой кислотности"],
    ["acidity", (v) => v >= 3, /без (резк|лишн|ярк)\S* кислотн|без яркой кислотности|излишней кислотности/i, "текст говорит, что кислотности нет"]
  ];
  // a sentence about the region or the variety in general («Красный Бурбон, известный своей яркой кислотностью») is not
  // about this lot: such matches are skipped
  const GENERAL = /регион|разновидност|сорт(ов|а|ом)?\b|сорт,|известн|придают кофе из/i;
  for (const p of products) for (const [k, bad, re, what] of SAYS) {
    if (!bad(p.taste[k])) continue;
    const text = p.about.join(" ");
    const g = new RegExp(re.source, "gi");
    for (const m of text.matchAll(g)) {
      if (/без\s*$/i.test(text.slice(Math.max(0, m.index - 5), m.index))) continue;   // «без яркой кислотности» says the opposite
      const from = Math.max(text.lastIndexOf(".", m.index), 0), to = text.indexOf(".", m.index);
      if (GENERAL.test(text.slice(from, to < 0 ? undefined : to))) continue;
      fix("text", p.name, k === "density" ? "Плотность" : "Кислотность", String(p.taste[k]),
        `${what} («…${m[0]}…»), а по шкале ${String(p.taste[k]).replace(".", ",")}. Проверить шкалу или текст: модель верит шкале.`);
      break;
    }
  }
  // the text describes a sealed (anaerobic) fermentation, the field a plain process; a culturing lot without its base
  for (const p of products) {
    const r = rows.find((x) => x["ID"] === p.id), codes = procCodes(r["Обработка"]), text = p.about.join(" ");
    const m = text.match(/герметичн\S* (емкост|резервуар|среде)|анаэробн\S* (ферментац|сред)/i);
    if (m && !codes.some((c) => EXPERIMENTAL.has(c))) fix("conflict", p.name, "Обработка", strip(r["Обработка"]),
      `В «О сорте» — закрытая ферментация («…${m[0]}…»), в поле — просто «${strip(r["Обработка"])}». Если лот анаэробный, указать это: модель считает такие лоты необычнее (+0,3).`);
    if (codes.includes("culturing") && !codes.some((c) => ["washed", "natural", "honey"].includes(c))) fix("conflict", p.name, "Обработка", strip(r["Обработка"]),
      `«Культуринг» без основы. В тексте — депульпация и сушка в пергаменте, то есть мытая основа. Указать основу («Мытая / Культуринг»): модель пока считает её наполовину мытой, наполовину натуральной.`);
  }
  // near-duplicate descriptors (one word in two spellings)
  const all = new Set(rows.flatMap((r) => strip(r["Дескрипторы"]).split(",").map((x) => x.trim()).filter(Boolean)));
  for (const [a, b] of [["Цитрус", "Цитрусы"], ["Цедра", "Цедра цитрусов"], ["Сушеные ягоды", "Вяленые ягоды"]]) if (all.has(a) && all.has(b))
    fix("vocabulary", "дескрипторы", "Дескрипторы", `${a} / ${b}`, `Два значения для одного вкуса: «${a}» и «${b}». Свести к одному, чтобы список вкусов не рос.`);
  // relabels: the same green coffee under another name; Notion has no field saying so
  const greenOf = new Map(products.map((p) => [p, rows.find((r) => r["ID"] === p.id)["Состав зеленого кофе"]]));
  const relabels = [];
  for (const r of rows.filter((x) => x["На сайте"] !== "Да")) {
    const p = products.find((q) => sameGreen(greenOf.get(q), r["Состав зеленого кофе"]));
    if (!p) continue;
    const same = ["Кислотность", "Плотность", "Сладость", "Фермент"].every((k) => (r[k] || "") === String(p.taste[{ Кислотность: "acidity", Плотность: "density", Сладость: "sweetness", Фермент: "ferment" }[k]] ?? ""))
      && strip(r["Дескрипторы"]) === p.descriptors.join(", ");
    relabels.push({ name: strip(r["Название"]), id: r["ID"], sameAs: p.slug, sameAsName: p.name, sameProfile: same, partner: r["Партнерский"] === "Да" });
  }
  if (relabels.length) fix("structure", `${relabels.length} строк`, "—", "", `Строки-переименования (тот же зелёный кофе под другим названием: ${relabels.map((x) => x.name).join(", ")}) ничем не связаны со своим кофе, кроме состава. Добавить связь «Тот же кофе, что…» (relation), чтобы рекомендации никогда не предлагали переименование как другой кофе. Сборка пока находит их по составу зелёного кофе.`);
  for (const x of relabels.filter((y) => !y.sameProfile)) {
    const r = rows.find((y) => y["ID"] === x.id), empty = !r["Кислотность"] && !strip(r["Дескрипторы"]);
    fix("relabel", x.name, "Шкалы / Дескрипторы", `тот же зелёный кофе, что ${x.sameAsName}`, empty
      ? `Тот же зелёный кофе, что у «${x.sameAsName}», но шкалы и дескрипторы пустые. Заполнить (скопировать с исходного кофе, если это переименование).`
      : `Тот же зелёный кофе, что у «${x.sameAsName}», но другие шкалы или дескрипторы. Если это другая обжарка — отметить её; если переименование — выровнять с исходным кофе.`);
  }
  return relabels;
}

// ── positions ────────────────────────────────────────────────────────────────────────────────────────────────────
const unmapped = new Set();
function flavourOf(descriptors) {
  const prof = {};
  for (const d of descriptors) {
    const m = FLAV.descriptors[d];
    if (!m) { unmapped.add(d); continue; }
    const parts = typeof m === "string" ? { [m]: 1 } : m;
    for (const [f, w] of Object.entries(parts)) { if (!FAM.has(f)) throw new Error(`flavours.json: «${d}» → unknown family ${f}`); prof[f] = (prof[f] || 0) + w; }
  }
  const sum = Object.values(prof).reduce((s, x) => s + x, 0);
  for (const f in prof) prof[f] = +(prof[f] / sum).toFixed(3);
  return prof;
}
// the processing of a single lot as shares; experimental processes keep their base (anaerobic natural is natural)
function processOf(codes) {
  if (codes.includes("wet-hull")) return { wethull: 1 };
  if (codes.includes("honey")) return { washed: 0.5, natural: 0.5 };
  if (codes.includes("natural")) return { natural: 1 };
  if (codes.includes("washed")) return { washed: 1 };
  if (codes.includes("culturing")) return { washed: 0.5, natural: 0.5 };
  return null;
}
// decaf: the processing says so, the name says so, or at least half the green coffee is a decaf lot (a «лоукаф» blend
// with 80% decaf is not for someone who wants caffeine either)
function isDecaf(p, codes) {
  const share = p.composition.reduce((s, c) => s + (c.decaf ? c.share || 0 : 0), 0);
  return codes.includes("decaf") || /декаф|decaf|лоукаф|lowcaf/i.test(p.name) || share >= 50;
}
const lean = (prof, key) => Object.entries(prof).reduce((s, [f, w]) => s + w * FAM.get(f)[key], 0);   // −1 … 1

function position(p, row, lotProcess) {
  for (const k of ["acidity", "density", "sweetness", "ferment"]) if (p.taste[k] == null) throw new Error(`taste: ${p.name} has no ${k}`);
  const flavour = flavourOf(p.descriptors);
  const codes = procCodes(row["Обработка"]);
  const text = `${p.short} ${p.about.join(" ")}`;
  const robusta = p.composition.some((c) => /робуст/i.test(c.lot));
  const excelsa = /эксцельс|excelsa/i.test(text);
  const L = RULES.unusualLift;
  const lifts = {
    bright: +(RULES.lift * lean(flavour, "bright")).toFixed(3),
    unusual: +((codes.some((c) => EXPERIMENTAL.has(c)) ? L.experimental : 0) + (codes.includes("wet-hull") ? L.wetHull : 0)
      + (excelsa ? L.excelsa : 0) + (robusta ? L.robusta : 0) + L.families * lean(flavour, "unusual")).toFixed(3)
  };
  return {
    bright: +(p.taste.acidity + lifts.bright).toFixed(3),
    body: p.taste.density,
    unusual: +(p.taste.ferment + lifts.unusual).toFixed(3),
    sweet: p.taste.sweetness,
    flavour, lifts, codes, process: processing(p, codes, lotProcess), robusta, excelsa, decaf: isDecaf(p, codes)
  };
}

// a blend's processing: its lots', found among all rows of the table (a lot sold alone, on the site or not)
function processing(p, codes, lotProcess) {
  if (p.type !== "Смесь") return processOf(codes);
  const out = {}; let known = 0;
  for (const c of p.composition) {
    const q = lotProcess.get(c.lot.toLowerCase()); if (!q) continue;
    for (const [k, w] of Object.entries(q)) out[k] = (out[k] || 0) + w * c.share;
    known += c.share;
  }
  if (!known) return null;
  for (const k in out) out[k] = +(out[k] / known).toFixed(3);
  return out;
}

// ── words ────────────────────────────────────────────────────────────────────────────────────────────────────────
const n = (x) => String(+(+x).toFixed(1)).replace(".", ",");
const join = (xs) => xs.length < 2 ? xs.join("") : xs.slice(0, -1).join(", ") + " и " + xs.at(-1);
const top = (prof, min = 0.2) => Object.entries(prof).filter(([, w]) => w >= min).sort((a, b) => b[1] - a[1]).map(([f]) => f);
function flavourWords(a, b) {
  const A = top(a.flavour), B = top(b.flavour);
  return { shared: A.filter((f) => B.includes(f)), sim: +flavourSim(a.flavour, b.flavour, S).toFixed(3) };
}
// the other coffee's flavour in its own words (its descriptors), and the families both share
function flavourText(a, b) {
  const { shared, sim } = flavourWords(a, b);
  const words = b.descriptors.map((d) => d.toLowerCase()).join(", ");
  const ru = (fs) => join(fs.map((f) => FAM.get(f).ru));
  if (shared.length) return `Общее во вкусе — ${ru(shared)}; у него ${words}.`;
  return sim >= 0.6 ? `Вкус близкого рода: ${words}.` : `Во вкусе другое: ${words}.`;
}
// "плотность 2 против 3", in coded points (what the card shows)
const vs = (k, a, b) => `${AXIS[k].label} ${n(b.coded[AXIS[k].scale])} против ${n(a.coded[AXIS[k].scale])}`;
function otherChanges(a, b, skip) {
  const out = [];
  for (const k of ["bright", "body", "unusual", "sweet"]) {
    if (k === skip) continue;
    const d = b.coded[AXIS[k].scale] - a.coded[AXIS[k].scale];
    // sweetness is coded 3–5 almost everywhere: it is named only when it differs by two points
    if (k === "sweet" ? Math.abs(d) >= 2 : Math.abs(d) >= 0.5) out.push({ k, d, text: `${d > 0 ? AXIS[k].more : AXIS[k].less} (${vs(k, a, b)})` });
  }
  return out.sort((x, y) => Math.abs(y.d) * WEIGHTS[y.k] - Math.abs(x.d) * WEIGHTS[x.k]);
}

// a lot both coffees contain (a blend and its single origin): «В обоих — Бразилия Санта Мария: здесь 60%, там 50%.»
function sharedLot(a, b) {
  const lots = (c) => new Map(c.composition.map((x) => [normName(x.lot), x]));
  const A = lots(a), B = lots(b);
  const both = [...B.keys()].filter((l) => A.has(l));
  if (!both.length) return "";
  const l = both.sort((p, q) => (B.get(q).share || 0) - (B.get(p).share || 0))[0];
  const x = A.get(l).share || 100, y = B.get(l).share || 100, part = (v) => (v >= 100 ? "в чистом виде" : `${v}%`);
  return `В обоих — ${B.get(l).lot}: здесь ${part(x)}, там ${part(y)}.`;
}

// ── the model ────────────────────────────────────────────────────────────────────────────────────────────────────
export function model() {
  const rows = parseCsv(read("data/products.csv"));
  const { products } = buildProducts();
  const relabels = audit(rows, products);
  const rowOf = (p) => rows.find((r) => r["ID"] === p.id);
  // how each lot is processed, from every row that sells it alone (robusta has none: it is left out of a blend's share)
  const lotProcess = new Map();
  for (const r of rows) {
    const comp = strip(r["Состав зеленого кофе"]).split(";").map((x) => x.trim()).filter(Boolean);
    const q = processOf(procCodes(r["Обработка"]));
    if (comp.length === 1 && q && !lotProcess.has(comp[0].split("—")[0].trim().toLowerCase())) lotProcess.set(comp[0].split("—")[0].trim().toLowerCase(), q);
  }

  const coffees = products.map((p) => {
    const row = rowOf(p);
    return { id: p.id, slug: p.slug, name: p.name, short: p.short, line: p.line, type: p.type,
      green: row["Состав зеленого кофе"], group: greenKey(row["Состав зеленого кофе"]), countries: p.countries, roasts: [...new Set(p.roasts.map((r) => r.use))], use: p.use,
      descriptors: p.descriptors, composition: p.composition, coded: { ...p.taste }, ...position(p, row, lotProcess) };
  });
  // one group per green coffee: the same lots (allowing a typo), or a name that is another's plus a partner's
  for (const a of coffees) for (const b of coffees) if (a.group !== b.group && (sameGreen(a.green, b.green) || namePrefix(a.name, b.name))) {
    const old = b.group; for (const c of coffees) if (c.group === old) c.group = a.group;
  }
  const by = new Map(coffees.map((c) => [c.slug, c]));
  const D = (a, b, opt) => distance(a, b, S, opt);
  // a relabel is never an alternative to its own coffee; a decaf is never offered for a coffee with caffeine (it is a
  // need, not a taste: surfaces show it in its own «без кофеина» slot), while a decaf's alternatives say they have caffeine
  const alternative = (a, b) => a.slug !== b.slug && a.group !== b.group && (a.decaf || !b.decaf);

  for (const c of coffees) {
    const others = coffees.filter((o) => alternative(c, o));
    // nearest coffees: the whole distance
    c.neighbours = others.map((o) => ({ o, d: D(c, o) })).sort((x, y) => x.d - y.d).slice(0, RULES.neighbours)
      .map(({ o, d }) => ({ slug: o.slug, d: +d.toFixed(3), far: d > RULES.far, ...neighbourWhy(c, o) }));
    // directions: a real step on the axis, then the closest on everything else
    c.directions = {};
    for (const dir of DIRECTIONS) {
      const cands = others.map((o) => {
        const step = dir.sign * (o[dir.axis] - c[dir.axis]);
        if (step < RULES.step) return null;
        const rest = D(c, o, { skip: dir.axis });
        const milk = dir.id === "denser" && o.use.includes("Молочные напитки");
        return { o, step, rest, score: rest + RULES.overshoot * Math.max(0, step - 1) - (milk ? RULES.milkBonus : 0), milk };
      }).filter(Boolean).sort((x, y) => x.score - y.score);
      if (!cands.length) { c.directions[dir.id] = { edge: true, text: dir.edge }; continue; }
      const best = { ...cands[0], smaller: cands.some((x) => x.step <= 1.05) };
      c.directions[dir.id] = { slug: best.o.slug, step: +best.step.toFixed(2), rest: +best.rest.toFixed(3), far: best.rest > RULES.far,
        candidates: cands.length, ...directionWhy(c, best.o, dir, best) };
      c.directions[dir.id].ranked = cands.slice(0, 4).map((x) => ({ slug: x.o.slug, score: +x.score.toFixed(3), far: x.rest > RULES.far }));
    }
    c.directions.milk = milkStep(c, others);
  }

  // «Под молоко»: milk weakens a coffee's aroma and flavour, so this is its own move, not «мягче» (session 0). The
  // candidates are the coffees QQ itself tags «Молочные напитки»; the best is the closest in everything but acidity
  // and body (milk covers both), with a cost for each point brighter than this one. A coffee QQ already tags for milk
  // gets no other coffee here: the move says this one is for milk.
  function milkStep(c, others) {
    if (c.use.includes("Молочные напитки")) return { self: true, text: "QQ советует этот кофе для молочных напитков." };
    const cands = milkCands(c, others);
    if (!cands.length) return { edge: true, text: "Кофе, который QQ советует для молока, у QQ сейчас нет." };
    const b = cands[0].o;
    const bits = ["QQ советует его для молочных напитков."];
    const ch = otherChanges(c, b, null).filter((x) => x.k !== "sweet");
    if (ch.length) bits.push(`${ch.map((x) => x.text[0].toUpperCase() + x.text.slice(1)).join(", ")}.`);
    bits.push(flavourText(c, b));
    const lot = sharedLot(c, b); if (lot) bits.push(lot);
    return { slug: b.slug, rest: +cands[0].rest.toFixed(3), far: cands[0].rest > RULES.far, milk: true, candidates: cands.length,
      ranked: cands.slice(0, 4).map((x) => ({ slug: x.o.slug, score: +x.score.toFixed(3), far: x.rest > RULES.far })),
      why: { milk: true, others: ch.map(({ k, d }) => ({ axis: k, d })) }, text: bits.join(" ") };
  }
  function milkCands(c, others) {
    const w = { ...WEIGHTS, bright: 0, body: 0 };
    return others.filter((o) => o.use.includes("Молочные напитки")).map((o) => {
      const rest = distance(c, o, S, { w });
      return { o, rest, score: rest + RULES.milkBrighter * Math.max(0, o.coded.acidity - c.coded.acidity) };
    }).sort((x, y) => x.score - y.score);
  }

  // ── the block on a coffee's page: what to take next ────────────────────────────────────────────────────────────
  // Four moves, in this order (Tim, 24 Nov): похожий, мягче, ярче, необычнее (классичнее for a coffee that is already
  // unusual). «Под молоко» stays a direction of the model (directions.milk, for the quiz) but is not on the page.
  // The model's distance and steps, with the rules a shopper reads them by (the outside check of session 2 against
  // the roasters' texts):
  //   · «мягче» is less acidity without becoming much denser or wilder (body at most +1, ferment at most +0.5): a heavy
  //     robusta blend is not «мягче» for someone drinking a light Ethiopian; when only such coffees are lower, it is an
  //     edge that names them;
  //   · «классичнее» lands on a classic coffee (ferment 0, no anaerobic or culturing process), not one notch down the
  //     ferment scale onto another experiment;
  //   · a coffee sold in none of this one's roasts (espresso / filter) counts RULES.roastGap against it, so someone
  //     with an espresso machine is not sent to a filter-only lot when one in espresso roast is close;
  //   · each coffee once: «похожий» is the nearest coffee; a move that picks a coffee already shown takes its own next
  //     candidate if that scores at most RULES.swap worse, else the two share the card («Похожий · мягче»).
  // A move with no step is said in words (an edge); a far step says so. Sold out, the page leads with the nearest.
  const sharesRoast = (a, b) => a.roasts.some((r) => b.roasts.includes(r));
  const classicOf = (o) => o.coded.ferment === 0 && !o.codes.some((x) => EXPERIMENTAL.has(x));
  function moveCands(c, id) {
    const others = coffees.filter((o) => alternative(c, o) && !OUT.has(o.slug));
    const roast = (o) => (sharesRoast(c, o) ? 0 : RULES.roastGap);
    if (id === "milk") return milkCands(c, others).map((x) => ({ ...x, score: x.score + roast(x.o), far: x.rest > RULES.far }));
    if (id === "similar") return others.map((o) => { const d = D(c, o); return { o, rest: d, score: d + roast(o), far: d > RULES.far }; }).sort((x, y) => x.score - y.score);
    const dir = DIRECTIONS.find((d) => d.id === id);
    return others.map((o) => {
      const step = dir.sign * (o[dir.axis] - c[dir.axis]);
      if (id === "classic" ? !classicOf(o) || step < RULES.step : step < RULES.step) return null;
      if (id === "softer" && (o.coded.density - c.coded.density > RULES.softerBody || o.unusual - c.unusual > RULES.softerWild)) return { o, wild: true };
      const rest = D(c, o, { skip: dir.axis });
      return { o, step, rest, far: rest > RULES.far, score: rest + RULES.overshoot * Math.max(0, step - 1) + roast(o) };
    }).filter(Boolean).sort((x, y) => (x.wild ? 1 : 0) - (y.wild ? 1 : 0) || x.score - y.score);
  }
  function nextBlock(c) {
    const unusualSide = c.coded.ferment >= RULES.unusualFrom ? "classic" : "unusual";
    const used = new Map();   // slug → move index
    const moves = [];
    // похожий first: the nearest coffee, unless it would be far
    const near = moveCands(c, "similar"), sim = near.find((x) => !x.far);
    if (sim) { used.set(sim.o.slug, 0); moves.push({ id: "similar", label: "Похожий", slug: sim.o.slug, d: +sim.rest.toFixed(3), line: moveLine(c, sim.o, "similar"), text: neighbourWhy(c, sim.o).text }); }
    else moves.push({ id: "similar", label: "Похожий", edge: true, line: "Похожих у QQ сейчас нет: самый близкий кофе заметно другой." });
    // a move with nothing that way gives its place to another (Tim: show something different, not «мягче у QQ нет»):
    // легче, плотнее, the other end of the unusual axis, then a second similar coffee; the first with a near pick
    const fallback = ["lighter", "denser", unusualSide === "unusual" ? "classic" : "unusual", "similar2"];
    const taken = new Set([unusualSide]);
    for (let id0 of ["softer", "brighter", unusualSide]) {
      let id = id0, all = moveCands(c, id), cands = all.filter((x) => !x.wild), instead = null;
      if (!cands.length) {
        instead = { id: id0, line: edgeLine(c, id0, all.filter((x) => x.wild)) };
        for (const f of fallback) {
          if (taken.has(f)) continue;
          // a replacement never repeats a step a card already shown takes (Найваша: «похожий» is already denser)
          const fd = DIRECTIONS.find((d) => d.id === f);
          if (fd && moves.some((m) => m.slug && fd.sign * (by.get(m.slug)[fd.axis] - c[fd.axis]) >= RULES.step)) continue;
          const fc = f === "similar2" ? near.slice(1) : moveCands(c, f);
          const ok = fc.filter((x) => !x.wild && !x.far && !used.has(x.o.slug));
          if (ok.length) { id = f; cands = ok; break; }
        }
        if (id === id0) { moves.push({ id, label: DIRECTIONS.find((d) => d.id === id).ru, edge: true, line: instead.line }); continue; }
        taken.add(id);
      }
      const label = id === "similar2" ? "Тоже похожий" : DIRECTIONS.find((d) => d.id === id).ru;
      let pick = cands[0];
      if (used.has(pick.o.slug)) {
        const alt = cands.find((r) => !used.has(r.o.slug));
        if (alt && !alt.far && alt.score <= pick.score + RULES.swap) pick = { ...alt, swapped: true };
        else {
          // the two moves share the card; its line also says the second move's own number («кислотность 4,5 вместо 4»)
          const m = moves[used.get(pick.o.slug)], key = moveLine(c, pick.o, id).split(" · ")[0];
          if (!m.line.toLowerCase().includes(key.toLowerCase())) { const [first, ...rest] = m.line.split(" · "); m.line = [first, key.toLowerCase(), ...rest].join(" · "); }
          m.also = [...(m.also || []), { id, label }]; moves.push({ id, label, sharedWith: m.id }); continue;
        }
      }
      used.set(pick.o.slug, moves.length);
      const lid = id === "similar2" ? "similar" : id;
      moves.push({ id, label, slug: pick.o.slug, far: pick.far, swapped: !!pick.swapped, line: moveLine(c, pick.o, lid, pick.far), text: id === "similar2" ? neighbourWhy(c, pick.o).text : stepText(c, pick.o, id, pick), ...(instead ? { instead } : {}) });
    }
    // sold out: the nearest of all leads (far or not); a move that picked the same coffee joins its card. A decaf's
    // lead has caffeine: the page says there is no other decaf.
    const first = near.reduce((a, x) => (x.rest < a.rest ? x : a), near[0]);   // the nearest in stock, roast or not
    const nearest = { slug: first.o.slug, d: +first.rest.toFixed(3), far: first.far, line: moveLine(c, first.o, "similar", first.far), text: neighbourWhy(c, first.o).text };
    const otherDecaf = coffees.some((o) => o.decaf && o.group !== c.group && !OUT.has(o.slug));
    const joins = (m) => m.slug === nearest.slug || m.sharedWith === "similar" || (m.sharedWith && moves.find((x) => x.id === m.sharedWith)?.slug === nearest.slug);
    const soldOut = { lead: nearest, note: c.decaf && !otherDecaf && !first.o.decaf ? "Другого кофе без кофеина у QQ сейчас нет: ближе всего по вкусу — с кофеином." : null,
      moves: moves.filter((m) => m.id !== "similar").map((m) => (joins(m) ? { id: m.id, label: m.label, joinsLead: true } : m)) };
    const decaf = c.decaf ? null : coffees.filter((o) => o.decaf && o.group !== c.group && !OUT.has(o.slug)).map((o) => ({ o, d: D(c, o) })).sort((x, y) => x.d - y.d)[0];
    return { moves, nearest, soldOut, decaf: decaf ? { slug: decaf.o.slug, line: `Без кофеина: ${decaf.o.descriptors.map((d) => d.toLowerCase()).join(", ")}.` } : null };
  }
  // the long reason of a move (the model's own words: directionWhy / the milk step)
  function stepText(c, o, id, pick) {
    if (id === "milk") return o.slug === c.directions.milk.slug ? c.directions.milk.text : `QQ советует его для молочных напитков. ${flavourText(c, o)}`;
    const dir = DIRECTIONS.find((d) => d.id === id);
    return directionWhy(c, o, dir, { rest: pick.rest, smaller: false, milk: false }).text;
  }
  // one line from the data: the move's own number first, the biggest other difference, a lot both coffees share, then
  // the other coffee's taste in its own descriptors («тоже …» only for a word both coffees' descriptors use)
  const stem = (w) => w.toLowerCase().replace(/ё/g, "е").slice(0, 5);
  // words of the descriptors that name a taste (not «сушеный», «темные»…; «косточка» of a grape is not stone fruit)
  const ok = (w) => w.length >= 3 && !/^(сушен|сладк|темны|желты|черны|зелен|молоч|красн|ягодн|косто|с$|и$)/i.test(w);
  const words = (c) => new Set(c.descriptors.flatMap((d) => d.split(/\s+/)).filter(ok).map(stem));
  function tasteBit(a, b) {
    const has = (c, d) => d.split(/\s+/).some((w) => ok(w) && words(c).has(stem(w)));
    // a word both use, in the shorter of the two wordings («шоколад» for «Молочный шоколад» and «Шоколад»)
    const pair = (d) => b.descriptors.find((e) => e.split(/\s+/).some((w) => ok(w) && new Set(d.split(/\s+/).filter(ok).map(stem)).has(stem(w))));
    const mine = a.descriptors.filter((d) => has(b, d)).map((d) => { const e = pair(d); return e && e.length < d.length ? e : d; });
    const theirs = b.descriptors.filter((d) => !has(a, d));
    const low = (xs) => xs.map((d) => d.toLowerCase());
    if (mine.length) return `тоже ${low(mine).slice(0, 2).join(", ")}${theirs.length ? `; у него ещё ${low(theirs).slice(0, 2).join(", ")}` : ""}`;
    return low(b.descriptors).slice(0, 3).join(", ");
  }
  function lotBit(a, b) {
    const lots = (c) => new Map(c.composition.map((x) => [normName(x.lot), x]));
    const A = lots(a), B = lots(b);
    const both = [...B.keys()].filter((l) => A.has(l));
    if (!both.length) return "";
    const l = both.sort((p, q) => (B.get(q).share || 0) - (B.get(p).share || 0))[0];
    const x = A.get(l).share || 100, y = B.get(l).share || 100;
    if (x < 100 && y < 100) return `в обоих ${B.get(l).lot}`;
    if (x < 100) return `он есть в этой смеси (${x}%)`;
    return `в нём ${y}% этого кофе`;
  }
  function moveLine(a, b, id, far = false) {
    const vs2 = (k) => `${AXIS[k].label} ${n(b.coded[AXIS[k].scale])} вместо ${n(a.coded[AXIS[k].scale])}`;
    const bits = [];
    if (id === "similar") {
      const same = ["bright", "body"].filter((k) => a.coded[AXIS[k].scale] === b.coded[AXIS[k].scale]);
      if (same.length === 2) bits.push("та же кислотность и плотность");
      else if (same.length === 1) bits.push(`та же ${AXIS[same[0]].label}`);
      const diff = otherChanges(a, b, null).filter((x) => x.k !== "sweet")[0];
      if (diff) bits.push(vs2(diff.k));
    } else if (id === "milk") {
      bits.push("QQ советует для молока");
      if (Math.abs(b.coded.density - a.coded.density) >= 0.5) bits.push(vs2("body"));
    } else {
      const dir = DIRECTIONS.find((d) => d.id === id);
      const d = b.coded[AXIS[dir.axis].scale] - a.coded[AXIS[dir.axis].scale];
      if (Math.abs(d) >= 0.5) bits.push(vs2(dir.axis));
      else {   // the same ferment score: the process or the species is what differs
        const more = dir.sign > 0 ? b : a;
        const p = more.codes.filter((x) => EXPERIMENTAL.has(x) || x === "wet-hull").map((x) => PROC_RU[x]);
        bits.push(dir.sign > 0 ? (p.length ? `обработка ${join(p)}` : more.excelsa ? "другой вид кофе, эксцельса" : "вкус менее привычный")
          : (p.length ? `без обработки «${join(p)}»` : more.excelsa ? "арабика, не эксцельса" : "вкус привычнее"));
      }
      const other = otherChanges(a, b, dir.axis).filter((x) => x.k !== "sweet")[0];
      if (other) bits.push(vs2(other.k));
    }
    const lot = lotBit(a, b); if (lot) bits.push(lot);
    bits.push(tasteBit(a, b));
    if (!sharesRoast(a, b)) bits.push(`обжарка только ${b.roasts.map((r) => (r === "Фильтр" ? "под фильтр" : "под эспрессо")).join(" и ")}`);
    if (a.decaf && !b.decaf) bits.push("с кофеином");
    if (far) bits.push(id === "milk" ? "из кофе для молока он ближе всех по вкусу" : "в остальном заметно другой");
    const s = bits.join(" · ");
    return s[0].toUpperCase() + s.slice(1);
  }
  // why the coffees with lower acidity are not «мягче»: much denser, more fermented, or both
  function softerWhy(c, os) {
    const dense = os.some((o) => o.coded.density - c.coded.density > RULES.softerBody), wild = os.some((o) => o.unusual - c.unusual > RULES.softerWild);
    return dense && wild ? "заметно более плотных или ферментированных кофе" : dense ? "заметно более плотных кофе" : "заметно более ферментированных кофе";
  }
  function edgeLine(c, id, wild = []) {
    const v = (k) => n(c.coded[k]);
    const names = (xs) => join(xs.map((o) => o.name));
    return {
      softer: wild.length ? `Мягче у QQ нет: кислотность ниже только у ${softerWhy(c, wild.map((x) => x.o))} (${names(wild.slice(0, 2).map((x) => x.o))}).` : `Мягче у QQ нет: кислотность ${v("acidity")} — самая низкая в ассортименте.`,
      brighter: `Ярче у QQ нет: кислотность ${v("acidity")} — самая высокая в ассортименте.`,
      unusual: "Необычнее у QQ нет: это один из самых экспериментальных лотов.",
      classic: "Классичнее у QQ нет.",
      milk: "Кофе, который QQ советует для молока, у QQ сейчас нет."
    }[id];
  }

  function neighbourWhy(a, b) {
    const same = ["bright", "body"].filter((k) => a.coded[AXIS[k].scale] === b.coded[AXIS[k].scale]);
    const fw = flavourWords(a, b);
    const diffs = otherChanges(a, b, null);
    const bits = [];
    if (same.length === 2) bits.push(`Та же кислотность (${n(a.coded.acidity)}) и плотность (${n(a.coded.density)}).`);
    else if (same.length === 1) bits.push(`Та же ${AXIS[same[0]].label} (${n(a.coded[AXIS[same[0]].scale])}).`);
    bits.push(flavourText(a, b));
    if (diffs.length) bits.push(`Отличие: ${diffs.slice(0, 2).map((x) => x.text).join(", ")}.`);
    if (a.decaf !== b.decaf) bits.push(b.decaf ? "Без кофеина." : "С кофеином.");
    const lot = sharedLot(a, b); if (lot) bits.push(lot);
    return { why: { same, flavour: fw, diffs: diffs.map(({ k, d }) => ({ axis: k, d })) }, text: bits.join(" ") };
  }
  function directionWhy(a, b, dir, best) {
    const k = dir.axis, d = b.coded[AXIS[k].scale] - a.coded[AXIS[k].scale];
    const bits = [];
    if (Math.abs(d) >= 0.5) bits.push(`${dir.ru}: ${vs(k, a, b)}.`);
    else if (k === "unusual") {   // the same ferment score: the difference is the process or the species
      const more = dir.sign > 0 ? b : a;   // the more unusual of the two
      const p = more.codes.filter((x) => EXPERIMENTAL.has(x) || x === "wet-hull").map((x) => PROC_RU[x]);
      const what = p.length ? `обработка ${join(p)}` : more.excelsa ? "другой вид кофе (эксцельса)" : "во вкусе меньше привычного";
      bits.push(`${dir.ru}: ${dir.sign > 0 ? what : `у этого ${what}, у того — нет`}, фермент ${a.coded.ferment === b.coded.ferment ? `тот же (${n(a.coded.ferment)})` : vs(k, a, b)}.`);
    } else bits.push(`${dir.ru}.`);
    if (Math.abs(d) > 1 && best.smaller) bits.push(`Шаг большой: те, что ближе по шкале, сильнее отличаются в остальном.`);
    const others = otherChanges(a, b, k);
    if (others.length) bits.push(`Но ${others.slice(0, 2).map((x) => x.text).join(", ")}.`);
    else bits.push("В остальном близко.");
    bits.push(flavourText(a, b));
    if (dir.id === "denser" && best.milk) bits.push("QQ советует его для молочных напитков.");
    const lot = sharedLot(a, b); if (lot) bits.push(lot);
    if (best.rest > RULES.far) bits.push("Ближе в этом направлении ничего нет, но в остальном это заметно другой кофе.");
    if (a.decaf && !b.decaf) bits.push("С кофеином: другого декафа у QQ нет.");
    return { why: { axis: k, coded: d, others: others.map(({ k: x, d: y }) => ({ axis: x, d: y })), milk: best.milk }, text: bits.join(" ") };
  }

  for (const c of coffees) c.next = nextBlock(c);

  // ── the map: the distance laid out in two dimensions (classical MDS), turned to match brightness × body ─────────
  const M = mds(coffees.map((a) => coffees.map((b) => D(a, b))));
  const target = coffees.map((c) => [c.bright - 3, c.body - 3]);
  const placed = procrustes(M, target);
  coffees.forEach((c, i) => { c.map = { x: +placed[i][0].toFixed(3), y: +placed[i][1].toFixed(3) }; });
  const fitMap = stress(coffees, placed, D);

  // ── anchors: what people already know, placed on the same map ──────────────────────────────────────────────────
  const center = (cs) => Object.fromEntries(AXES.map((k) => [k, +(cs.reduce((s, c) => s + c[k], 0) / cs.length).toFixed(2)]));
  const spread = (cs, m) => Object.fromEntries(AXES.map((k) => [k, +Math.max(0.75, Math.sqrt(cs.reduce((s, c) => s + (c[k] - m[k]) ** 2, 0) / cs.length)).toFixed(2)]));
  const region = (cs) => { const m = center(cs); return { center: m, spread: spread(cs, m), coffees: cs.map((c) => c.slug) }; };
  const singles = coffees.filter((c) => c.type === "Моносорт");
  const anchors = {
    origins: [...new Set(singles.flatMap((c) => c.countries))].sort().map((country) => ({ name: country, ...region(singles.filter((c) => c.countries.includes(country))) })),
    drinks: [
      { name: "капучино, латте", from: "«Применение»: Молочные напитки", ...region(coffees.filter((c) => c.use.includes("Молочные напитки"))) },
      { name: "эспрессо", from: "«Применение»: Основной эспрессо", ...region(coffees.filter((c) => c.use.includes("Основной эспрессо"))) },
      { name: "фильтр, воронка", from: "«Применение»: Фильтр, Ручное заваривание", ...region(coffees.filter((c) => c.use.some((u) => /Фильтр|Ручное/.test(u)))) },
      { name: "пачка из супермаркета", from: "assumption: dark roast, often with robusta; check with QQ", assumption: true,
        center: { bright: 1, body: 4.5, unusual: -0.1 }, spread: { bright: 0.75, body: 0.75, unusual: 0.75 }, flavour: { cocoa: 0.5, nutty: 0.4, spice: 0.1 },
        coffees: coffees.filter((c) => c.robusta).map((c) => c.slug) }
    ],
    relabels
  };

  checks(coffees, D);
  const out = {
    generated: "from data/products.csv and data/flavours.json by build/taste.mjs — do not edit",
    version: 1,
    axes: [
      { id: "bright", ru: "мягче — ярче", from: "Кислотность ± до 0,2 по дескрипторам", range: [1, 5] },
      { id: "body", ru: "легче — плотнее", from: "Плотность", range: [1, 5] },
      { id: "unusual", ru: "классичнее — необычнее", from: "Фермент + 0,3 за экспериментальную обработку, + 0,2 за вэт-халл или другой вид кофе, − 0,1 за робусту, ± 0,1 по семьям", range: [-0.5, 4.5] }
    ],
    hidden: ["sweet (Сладость, weight " + WEIGHTS.sweet + ")", "flavour (families of data/flavours.json, weight " + WEIGHTS.flavour + ")", "process (washed / natural / wet-hull shares from «Обработка», a blend from its lots, weight " + WEIGHTS.process + ")"],
    weights: WEIGHTS, rules: RULES, directions: DIRECTIONS.map(({ id, axis, sign, ru }) => ({ id, axis, sign, ru })),
    families: FLAV.families.map(({ id, ru, gen, reference, wheel, angle, dot }) => ({ id, ru, gen, reference, wheel, angle, dot })),
    familySimilarity: S,
    map: { method: "classical MDS of the distance, turned and mirrored to match (bright, body)", stress: +fitMap.toFixed(3) },
    coffees: coffees.map(({ id, slug, name, short, line, type, group, countries, roasts, use, descriptors, coded, bright, body, unusual, sweet, flavour, lifts, codes, process, robusta, excelsa, decaf, map, neighbours, directions, next }) =>
      ({ id, slug, name, short, line, type, group, countries, roasts, use, descriptors, coded, position: { bright, body, unusual, sweet }, flavour, process, processing: codes, lifts, robusta, excelsa, decaf, map, neighbours, directions, next })),
    anchors,
    unmapped: [...unmapped],
    fixes
  };
  return out;
}

// ── checks: the build fails when the model breaks its own rules ─────────────────────────────────────────────────
function checks(coffees, D) {
  const by = new Map(coffees.map((c) => [c.slug, c]));
  const fail = (m) => { throw new Error("taste model: " + m); };
  // independent of how the model sets its flags: anything that mentions decaf in its name, processing or green coffee
  // with at least half decaf lots must be flagged; anything that looks like the same coffee must share a group
  for (const a of coffees) {
    const raw = JSON.stringify([a.name, a.codes, a.green]);
    const share = lotsOf(a.green).reduce((s, x) => s + (x.decaf ? x.share : 0), 0);
    if ((/декаф|decaf/i.test(a.name + a.codes.join(" ")) || share >= 50) && !a.decaf) fail(`${a.name} looks decaf (${raw}) but is not flagged`);
    for (const b of coffees) if (a !== b && a.group !== b.group && (namePrefix(a.name, b.name) || sameGreen(a.green, b.green))) fail(`${a.name} and ${b.name} look like the same coffee but are in different groups`);
  }
  for (const a of coffees) {
    for (const k of ["bright", "body", "unusual", "sweet"]) if (!Number.isFinite(a[k])) fail(`${a.name} has no ${k}`);
    if (Math.abs(a.lifts.bright) > RULES.lift + 1e-9) fail(`${a.name}: descriptors move acidity by more than ${RULES.lift}`);
    for (const b of coffees) if (Math.abs(D(a, b) - D(b, a)) > 1e-9) fail("distance is not symmetric");
    for (const x of a.neighbours) { const b = by.get(x.slug); if (!b || b.group === a.group) fail(`${a.name}: ${x.slug} is the same coffee`); if (b.decaf && !a.decaf) fail(`${a.name}: decaf ${b.name} offered`); }
    for (const dir of DIRECTIONS) {
      const x = a.directions[dir.id]; if (x.edge) continue;
      const b = by.get(x.slug);
      if (b.group === a.group) fail(`${a.name} → ${dir.id}: the same coffee`);
      if (b.decaf && !a.decaf) fail(`${a.name} → ${dir.id}: decaf ${b.name} offered`);
      if (dir.sign * (b[dir.axis] - a[dir.axis]) < RULES.step) fail(`${a.name} → ${dir.id}: ${b.name} is not a step`);
    }
    // the block on the page: each coffee once, never itself, a relabel or a decaf for a coffee with caffeine; every move
    // that shows a coffee shows a real step (milk: a coffee QQ tags for milk)
    const shown = [...a.next.moves.filter((m) => m.slug).map((m) => m.slug), a.next.nearest.slug];
    if (new Set(a.next.moves.filter((m) => m.slug).map((m) => m.slug)).size !== a.next.moves.filter((m) => m.slug).length) fail(`${a.name}: the block shows a coffee twice`);
    for (const s of shown) { const b = by.get(s); if (OUT.has(s)) fail(`${a.name}: the block offers ${b.name}, which is sold out`); if (b.group === a.group) fail(`${a.name}: the block shows the same coffee`); if (b.decaf && !a.decaf) fail(`${a.name}: the block offers decaf ${b.name}`); }
    for (const m of a.next.moves) if (m.slug) {
      const b = by.get(m.slug), dir = DIRECTIONS.find((d) => d.id === m.id);
      if (dir && dir.sign * (b[dir.axis] - a[dir.axis]) < RULES.step) fail(`${a.name} → block ${m.id}: ${b.name} is not a step`);
      if (m.id === "milk" && !b.use.includes("Молочные напитки")) fail(`${a.name} → block milk: ${b.name} is not tagged for milk`);
    }
  }
}

// classical multidimensional scaling to two dimensions (power iteration on the double-centred squared distances)
function mds(D) {
  const N = D.length, J = (i, j) => (i === j ? 1 : 0) - 1 / N;
  const D2 = D.map((r) => r.map((x) => x * x));
  const rowM = D2.map((r) => r.reduce((s, x) => s + x, 0) / N), all = rowM.reduce((s, x) => s + x, 0) / N;
  let B = D2.map((r, i) => r.map((x, j) => -0.5 * (x - rowM[i] - rowM[j] + all)));
  void J;
  const vecs = [];
  for (let k = 0; k < 2; k++) {
    let v = Array.from({ length: N }, (_, i) => Math.sin(i + 1 + k));
    let lambda = 0;
    for (let it = 0; it < 500; it++) {
      const w = B.map((r) => r.reduce((s, x, j) => s + x * v[j], 0));
      lambda = Math.sqrt(w.reduce((s, x) => s + x * x, 0));
      v = w.map((x) => x / lambda);
    }
    vecs.push(v.map((x) => x * Math.sqrt(lambda)));
    B = B.map((r, i) => r.map((x, j) => x - lambda * v[i] * v[j]));
  }
  return vecs[0].map((_, i) => [vecs[0][i], vecs[1][i]]);
}
// turn (and mirror if that fits better) the layout to match a target, keeping its distances
function procrustes(P, T) {
  const best = [1, -1].map((m) => {
    const Q = P.map(([x, y]) => [x, m * y]);
    let a = 0, b = 0; Q.forEach(([x, y], i) => { const [u, v] = T[i]; a += x * u + y * v; b += x * v - y * u; });
    const t = Math.atan2(b, a), c = Math.cos(t), s = Math.sin(t);
    const R = Q.map(([x, y]) => [c * x - s * y, s * x + c * y]);
    return { R, fit: R.reduce((acc, [x, y], i) => acc + x * T[i][0] + y * T[i][1], 0) };
  }).sort((p, q) => q.fit - p.fit)[0];
  return best.R;
}
// how much the flat map bends the model's distances (Kruskal's stress-1: 0 is exact, under 0.1 good, 0.2 poor)
function stress(cs, P, D) {
  let num = 0, den = 0;
  for (let i = 0; i < cs.length; i++) for (let j = i + 1; j < cs.length; j++) {
    const d = D(cs[i], cs[j]), e = Math.hypot(P[i][0] - P[j][0], P[i][1] - P[j][1]);
    num += (d - e) ** 2; den += d * d;
  }
  return Math.sqrt(num / den);
}

// ── readable outputs ─────────────────────────────────────────────────────────────────────────────────────────────
function report(m) {
  const by = new Map(m.coffees.map((c) => [c.slug, c]));
  const name = (s) => by.get(s).name;
  const L = [];
  L.push("# The taste model: output", "", "Written by `build/taste.mjs` from `data/products.csv` and `data/flavours.json` (`npm run taste`). Do not edit: change the data or the rules and rebuild. How it works: `docs/taste-model.md`.", "");
  L.push(`${m.coffees.length} coffees. Map stress ${m.map.stress} (how much the flat map bends the distances; under 0.1 is good).`, "");
  const edges = DIRECTIONS.map((d) => `${d.ru.toLowerCase()} ${m.coffees.filter((c) => c.directions[d.id].edge).length}`);
  L.push(`Edges (no step in that direction): ${edges.join(", ")}.`, "");
  L.push("## Positions", "", "| Coffee | Acidity → bright | Body | Ferment → unusual | Sweet | Flavour |", "|---|---|---|---|---|---|");
  for (const c of [...m.coffees].sort((a, b) => a.position.bright - b.position.bright))
    L.push(`| ${c.name} | ${n(c.coded.acidity)} → ${c.position.bright} | ${n(c.coded.density)} | ${n(c.coded.ferment)} → ${c.position.unusual} | ${n(c.coded.sweetness)} | ${Object.entries(c.flavour).sort((a, b) => b[1] - a[1]).map(([f, w]) => `${f} ${Math.round(w * 100)}%`).join(", ")} |`);
  L.push("", "## Each coffee", "");
  for (const c of m.coffees) {
    L.push(`### ${c.name}`, "", `${c.descriptors.join(", ")}. Кислотность ${n(c.coded.acidity)}, плотность ${n(c.coded.density)}, фермент ${n(c.coded.ferment)}, сладость ${n(c.coded.sweetness)}.`, "");
    L.push("Nearest: " + c.neighbours.map((x, i) => `${i + 1}. ${name(x.slug)} (${x.d.toFixed(2)})`).join(" · "), "");
    for (const d of DIRECTIONS) { const x = c.directions[d.id]; L.push(`- **${d.ru}**: ${x.edge ? "— " + x.text : `${name(x.slug)}${x.far ? " (far)" : ""}. ${x.text}`}`); }
    L.push("");
  }
  L.push("## Anchors", "", "| Anchor | Centre (bright, body, unusual) | Coffees |", "|---|---|---|");
  for (const a of [...m.anchors.origins, ...m.anchors.drinks]) L.push(`| ${a.name}${a.assumption ? " *(assumption)*" : ""} | ${a.center.bright}, ${a.center.body}, ${a.center.unusual} | ${a.coffees.map(name).join(", ")} |`);
  L.push("", "Relabels (never shown as an alternative to their coffee): " + m.anchors.relabels.map((r) => `${r.name} → ${r.sameAsName}${r.sameProfile ? "" : " (profile differs)"}`).join("; ") + ".", "");
  if (m.unmapped.length) L.push(`Descriptors with no family (add them to data/flavours.json): ${m.unmapped.join(", ")}.`, "");
  return L.join("\n");
}
// what each coffee's page offers next (the block «Что взять еще»), one line per move: the list the outside check reads
function nextReport(m) {
  const by = new Map(m.coffees.map((c) => [c.slug, c]));
  const L = ["# What each coffee's page offers next", "",
    "Written by `build/taste.mjs` (`npm run taste`): the block on every coffee's page, from the taste model. Do not edit. How the moves are chosen: `docs/taste-model.md`, «The block on a coffee's page».", "",
    OUT.size ? `Sold out now (data/site.json shop.unavailable), never offered: ${[...OUT].map((x) => m.coffees.find((c) => c.slug === x)?.name || x).join(", ")}.` : "Nothing is sold out now (data/site.json shop.unavailable).", ""];
  const count = (f) => m.coffees.filter((c) => c.next.moves.some(f)).length;
  L.push(`Moves left off the page (nothing that way and no replacement near): ${["similar", "softer", "brighter", "unusual", "classic"].map((id) => `${id} ${m.coffees.filter((c) => c.next.moves.some((x) => x.id === id && x.edge)).length}`).join(", ")}; two moves share a card on ${count((x) => x.sharedWith)}; far picks ${m.coffees.reduce((s, c) => s + c.next.moves.filter((x) => x.far).length, 0)}.`, "");
  for (const c of m.coffees) {
    L.push(`### ${c.name}`, "", `Кислотность ${n(c.coded.acidity)}, плотность ${n(c.coded.density)}, фермент ${n(c.coded.ferment)}. ${c.descriptors.join(", ")}. ${c.use.filter((u) => u !== "Вторая кофемолка").join(", ") || "—"}. «${c.short}»`, "");
    for (const x of c.next.moves) {
      const head = x.sharedWith ? `**${x.label}** — the same card as «${c.next.moves.find((y) => y.id === x.sharedWith).label}»` : x.slug ? `**${x.label}${(x.also || []).map((y) => " · " + y.label.toLowerCase()).join("")}** → ${by.get(x.slug).name}${x.far ? " *(far)*" : ""}${x.swapped ? " *(second pick)*" : ""}` : `**${x.label}** — ${x.self ? "this coffee" : "edge"}`;
      L.push(`- ${head}${x.line ? `: ${x.line}` : ""}${x.instead ? ` *(in place of «${DIRECTIONS.find((d) => d.id === x.instead.id).ru}»: ${x.instead.line})*` : ""}`);
    }
    L.push(`- *Sold out* → leads with ${by.get(c.next.nearest.slug).name}${c.next.nearest.far ? " *(far)*" : ""}: ${c.next.nearest.line}${c.next.soldOut.moves.filter((x) => x.joinsLead).map((x) => ` (also «${x.label}»)`).join("")}`);
    if (c.next.soldOut.note) L.push(`- *Sold out, note*: ${c.next.soldOut.note}`);
    if (c.next.decaf) L.push(`- *Without caffeine* → ${by.get(c.next.decaf.slug).name}: ${c.next.decaf.line}`);
    L.push("");
  }
  return L.join("\n");
}
function notionFixes(m) {
  const order = ["duplicate", "broken", "bracket", "conflict", "text", "relabel", "structure", "spelling", "field", "empty", "vocabulary"];
  const title = { duplicate: "Дубли", broken: "Разорванные значения", bracket: "Старые формулировки в [скобках]", conflict: "Поля противоречат друг другу", text: "Текст «О сорте» расходится со шкалой", relabel: "Переименования с другим профилем", structure: "Связь переименований с кофе", spelling: "Написание", field: "Поля не по назначению", empty: "Пустые значения", vocabulary: "Словарь дескрипторов" };
  const L = ["# Что поправить в Notion", "", "Таблица «Сорта_QQ_Coffee_сайт_объединенный». Список пишет `build/taste.mjs` при каждой сборке из `data/products.csv`: исправленное в Notion и выгруженное заново пропадёт отсюда само. Сборка обходит эти проблемы, чтобы модель и сайт работали, но не все: где сайт показывает неверное, это сказано в пункте.", ""];
  for (const k of order) {
    const xs = m.fixes.filter((f) => f.kind === k); if (!xs.length) continue;
    L.push(`## ${title[k]}`, "");
    for (const f of xs) L.push(`- **${f.coffee}** · ${f.field}${f.value ? ` · \`${f.value}\`` : ""}  \n  ${f.fix}`);
    L.push("");
  }
  // questions the blind check raised (docs/taste-check/findings.json); each stays while the coffee's data is unchanged
  const qs = (JSON.parse(read("docs/taste-check/findings.json")).questions || []).filter((q) => {
    const c = m.coffees.find((x) => x.slug === q.slug);
    return c && c.coded.acidity === q.while.acidity && c.coded.density === q.while.density && c.descriptors.join(", ") === q.while.descriptors;
  });
  if (qs.length) { L.push("## Вопросы обжарщику после слепой проверки", ""); for (const q of qs) L.push(`- **${m.coffees.find((x) => x.slug === q.slug).name}**  \n  ${q.ask}`); L.push(""); }
  if (m.unmapped.length) L.push("## Новые дескрипторы", "", `Нет в словаре вкусов (data/flavours.json): ${m.unmapped.join(", ")}. Это правка в репозитории, не в Notion.`, "");
  L.push("## Не в Notion, а на сайте", "", "- «Вторая кофемолка» в «Применение» — слово QQ для кофеен, домашним покупателям оно ничего не говорит. Сайт его не показывает (с сессии 2: плитка «Как готовить» на странице кофе его пропускает). В Notion менять не нужно.", "- Строка «Обжарка Буст Брендс» (состав «проверка цены — 100%») — служебная; на сайт не попадает, модель её не видит.", "");
  return L.join("\n");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const m = model();
  const OUT = resolve(root, "src/data/taste.json");
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(m, null, 1) + "\n");
  writeFileSync(resolve(root, "docs/taste-output.md"), report(m) + "\n");
  writeFileSync(resolve(root, "docs/notion-fixes.md"), notionFixes(m) + "\n");
  writeFileSync(resolve(root, "docs/next-output.md"), nextReport(m) + "\n");
  console.log(`src/data/taste.json: ${m.coffees.length} coffees, map stress ${m.map.stress}, ${m.fixes.length} Notion fixes` + (m.unmapped.length ? `, NO FAMILY: ${m.unmapped.join(", ")}` : ""));
}
