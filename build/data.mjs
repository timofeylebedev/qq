// The coffees of the site, from the price table (data/products.csv, the export of the QQ Coffee table).
//
//   node build/data.mjs   → src/data/products.json (npm run data; runs before every dev and build)
//
// Only rows with «На сайте» = «Да» are taken. Where a cell holds a second value in [brackets] (an older or
// alternative wording kept in the table), the value before the brackets is used. A coffee listed twice under the same
// name is taken once (the row filled in more completely wins).
//
// Prices are not in the table: data/prices.json holds placeholder prices by price group and weight
// ("placeholder": true), shown on the site until real prices arrive. Every product carries that flag, so the pages can
// say so and the report counts them.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";

const root = resolve(import.meta.dirname, "..");
const CSV = resolve(root, "data/products.csv"), PRICES = resolve(root, "data/prices.json");
const OUT = resolve(root, "src/data/products.json");

// ── CSV (quoted cells may hold commas, quotes and line breaks) ────────────────────────────────────────────────────
export function parseCsv(text) {
  const rows = []; let row = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [head, ...body] = rows.filter((r) => r.some((c) => c.trim()));
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h.trim(), (r[i] ?? "").trim()])));
}

// ── cleaning ──────────────────────────────────────────────────────────────────────────────────────────────────────
const main = (s) => (s || "").replace(/\s*\[[^\]]*\]/g, "").replace(/\s+/g, " ").trim();   // «A [B]» → «A»
const list = (s) => main(s).split(",").map((x) => x.trim()).filter((x) => x && x !== "—");
const num = (s) => (s === "" || s == null || isNaN(+s) ? null : +s);
const paragraphs = (s) => (s || "").split(/\n+/).map((p) => p.trim()).filter(Boolean);

const TR = { а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya" };
export const slug = (s) => main(s).toLowerCase().replace(/\(.*?\)/g, "").split("").map((c) => TR[c] ?? c).join("")
  .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// «Эспрессо • Средняя» → { use: "Эспрессо", level: "Средняя" }
const roasts = (s) => list(s).map((r) => { const [use, level] = r.split("•").map((x) => x.trim()); return { use, level }; });
// «Бразилия Санта Мария — 60%; Колумбия Антиокия — 20%» → [{ lot, share }]
const composition = (s) => main(s).split(";").map((x) => x.trim()).filter(Boolean).map((x) => {
  const [lot, share] = x.split("—").map((y) => y.trim());
  return { lot, share: share ? parseInt(share, 10) : null, decaf: /декаф/i.test(share || "") };
});
// the countries of a coffee: its own column for single origins; for blends, the blend's sticker text, else the lots
const COUNTRIES = ["Бразилия", "Колумбия", "Вьетнам", "Эфиопия", "Руанда", "Уганда", "Кения", "Перу", "Индонезия", "Гватемала"];
function countries(r) {
  const text = [r["Страна"], r["Состав смеси"], r["Состав на стикере"]].find((x) => main(x)) || r["Состав зеленого кофе"];
  return COUNTRIES.filter((c) => main(text).includes(c));
}
// processing as filter values: «Натуральная / Полуанаэробная «Твист»» → ["Натуральная", "Полуанаэробная"]
const PROCESS = ["Мытая", "Натуральная", "Анаэробная", "Полуанаэробная", "Вэт-халл", "Культуринг", "Декаф", "Хани"];
const processes = (s) => PROCESS.filter((p) => new RegExp(p === "Анаэробная" ? "(^|[^у])Анаэробная" : p, "i").test(main(s)));

const PRICE = JSON.parse(readFileSync(PRICES, "utf8"));
const weightGrams = (w) => (/кг/.test(w) ? parseFloat(w) * 1000 : parseFloat(w));

function product(r) {
  const name = main(r["Название"]);
  const group = r["Ценовая группа"] || "Classic";
  const weights = list(r["Фасовки"]).sort((a, b) => weightGrams(a) - weightGrams(b));
  return {
    id: r["ID"], slug: slug(name), name,
    short: main(r["Краткое описание"]),
    about: paragraphs(r["О сорте"]),
    line: r["Линейка"] || null,                        // Classic / Special
    type: r["Тип"] || null,                            // Моносорт / Смесь
    roasts: roasts(r["Обжарка"]),                      // [{ use, level }]
    descriptors: list(r["Дескрипторы"]),
    processing: main(r["Обработка"]) || null, processes: processes(r["Обработка"]),
    q: num(r["Оценка Q"]),
    taste: { density: num(r["Плотность"]), acidity: num(r["Кислотность"]), sweetness: num(r["Сладость"]), ferment: num(r["Фермент"]) },
    grind: list(r["Помол"]),                           // В зернах, Турка, Фильтр, Эспрессо
    use: list(r["Применение"]),                        // Молочные напитки, Основной эспрессо …
    composition: composition(r["Состав зеленого кофе"]),
    countries: countries(r),
    tags: list(r["Теги"]), tagNote: main(r["Комментарий к тегу"]) || null,
    created: r["Создан"] ? new Date(r["Создан"] + " UTC").toISOString().slice(0, 10) : null,
    priceGroup: group,
    weights: weights.map((w) => ({ label: w, grams: weightGrams(w), price: PRICE.groups[group]?.[w] ?? null })),
    pricePlaceholder: PRICE.placeholder === true,
    // label art of the 3D pack: every coffee shows the one label that exists for now (design/decisions.json, "pack-label")
    art: { front: "sumatra-front", back: "sumatra-back" }
  };
}

const filled = (p) => JSON.stringify(p).length;
export function build() {
  const rows = parseCsv(readFileSync(CSV, "utf8")).filter((r) => r["На сайте"] === "Да");
  const byName = new Map();
  for (const r of rows) {
    const p = product(r);
    const prev = byName.get(p.name);
    if (!prev || filled(p) > filled(prev)) byName.set(p.name, p);
  }
  const products = [...byName.values()];
  // the same slug twice would make two pages at one address
  const seen = new Set();
  for (const p of products) { if (seen.has(p.slug)) throw new Error("two coffees with the address " + p.slug); seen.add(p.slug); }
  return { generated: "from data/products.csv by build/data.mjs — do not edit", pricePlaceholder: PRICE.placeholder === true, products };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const data = build();
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(data, null, 1) + "\n");
  console.log(`src/data/products.json: ${data.products.length} coffees` + (data.pricePlaceholder ? " (placeholder prices)" : ""));
}
