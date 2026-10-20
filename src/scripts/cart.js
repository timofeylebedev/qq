// The bag page: the coffees of the bag (localStorage "qq-bag", filled by «В корзину» on cards and coffee pages),
// each with its quantity, weight, grind and roast. A line whose box is unticked waits under «Отложенные» and is not
// ordered; a coffee no longer on sale (data/site.json shop.unavailable) waits under «Нет в наличии». The panel adds
// up what is ticked: the goods, delivery (free from shop.free), the beans if spent, what the order will earn.
//
// The lines are written when the page starts, before the 3D packs are set up, so every line's pack is drawn; later
// changes move or remove the same elements and tell the packs to measure again (qq:layout).
import { KEY, load, save, rub, badge, toast } from "./buy.js";

const plural = (n, one, few, many) => { const a = n % 10, b = n % 100; return a === 1 && b !== 11 ? one : a >= 2 && a <= 4 && (b < 10 || b >= 20) ? few : many; };

export function initCart() {
  const list = document.querySelector("[data-cart-list]");
  if (!list) return;
  const catalog = new Map(JSON.parse(document.querySelector("[data-catalog]").textContent).map((p) => [p.slug, p]));
  const tpl = document.querySelector("[data-cart-item]"), goneTpl = document.querySelector("[data-cart-gone]");
  const later = document.querySelector("[data-cart-later-list]"), laterPart = document.querySelector("[data-cart-later]");
  const gone = document.querySelector("[data-cart-gone-list]"), gonePart = document.querySelector("[data-cart-gone-part]");
  const empty = document.querySelector("[data-cart-empty]"), bar = document.querySelector(".bagbar");
  const panel = document.querySelector("[data-cart-summary]"), all = document.querySelector("[data-cart-all]");
  const count = document.querySelector("[data-cart-count]");

  // the bag as lines: the same coffee with the same choices is one line; missing choices take the coffee's first
  const lines = [];
  for (const x of load(KEY, [])) {
    const p = catalog.get(x.slug);
    if (!p) continue;                                             // a coffee that left the catalog: nothing to show
    const line = {
      slug: x.slug, qty: Math.max(1, Number(x.qty) || 1), later: !!x.later,
      weight: p.weights.some(([w]) => w === x.weight) ? x.weight : p.weights[0][0],
      grind: p.grind.includes(x.grind) ? x.grind : p.grind[0],
      roast: p.roasts.some(([u]) => u === x.roast) ? x.roast : p.roasts[0]?.[0]
    };
    const same = lines.find((l) => ["slug", "weight", "grind", "roast", "later"].every((k) => l[k] === line[k]));
    if (same) same.qty = Math.min(99, same.qty + line.qty); else lines.push(line);
  }
  const price = (l) => catalog.get(l.slug).weights.find(([w]) => w === l.weight)?.[1] || 0;
  const store = () => { save(KEY, lines.map((l) => ({ ...l, price: price(l) }))); badge(); };

  const options = (select, list, value) => {
    select.innerHTML = "";
    for (const [v, t] of list) select.add(new Option(t, v, false, v === value));
  };

  function build(l) {
    const p = catalog.get(l.slug);
    const node = (p.out ? goneTpl : tpl).content.firstElementChild.cloneNode(true);
    const media = document.querySelector(`[data-media="${l.slug}"]`)?.content.firstElementChild.cloneNode(true);
    if (media) node.querySelector("[data-media-slot]").prepend(media);
    const name = node.querySelector("[data-name]");
    name.textContent = p.name; name.href = p.href;
    node.querySelector("[data-remove]").setAttribute("aria-label", `Убрать из корзины: ${p.name}`);
    if (p.out) {
      node.querySelector("[data-similar]").href = new URL("catalog/", new URL(document.documentElement.dataset.root || "./", location.href)).href;
      return node;
    }
    const fav = node.querySelector("[data-fav]");
    fav.dataset.fav = l.slug; fav.setAttribute("aria-label", `В избранное: ${p.name}`);
    node.querySelector("[data-pick-label]").textContent = `В заказ: ${p.name}`;
    options(node.querySelector('[data-opt="weight"]'), p.weights.map(([w, pr]) => [w, w]), l.weight);
    options(node.querySelector('[data-opt="grind"]'), p.grind.map((g) => [g, g]), l.grind);
    const roast = node.querySelector('[data-opt="roast"]');
    if (p.roasts.length) options(roast, p.roasts.map(([u, t]) => [u, `${t} обжарка`.replace("Омни обжарка", "Омни")]), l.roast);
    else roast.closest(".opt").remove();
    return node;
  }

  function fill(node, l) {
    if (catalog.get(l.slug).out) return;
    node.querySelector("[data-qty]").textContent = l.qty;
    node.querySelector('[data-step="-1"]').setAttribute("aria-disabled", String(l.qty <= 1));
    node.querySelector("[data-sum]").textContent = rub(price(l) * l.qty);
    node.querySelector("[data-pick]").checked = !l.later;
  }
  const place = (node, l) => (catalog.get(l.slug).out ? gone : l.later ? later : list).append(node);

  const nodes = new Map();
  for (const l of lines) { const n = build(l); nodes.set(l, n); fill(n, l); place(n, l); }

  // the panel and the parts that show only when they hold something
  const free = Number(panel.querySelector("[data-free]").dataset.free), rate = Number(panel.dataset.earnRate) || 0;
  const ship = panel.querySelector("[data-ship]"), shipPrice = Number(ship.dataset.price);
  const beans = panel.querySelector("[data-use-beans]"), balance = Number(beans.dataset.balance) || 0;
  function sum() {
    const chosen = lines.filter((l) => !l.later && !catalog.get(l.slug).out);
    const n = chosen.reduce((s, l) => s + l.qty, 0), goods = chosen.reduce((s, l) => s + price(l) * l.qty, 0);
    const delivery = !n || goods >= free ? 0 : shipPrice;
    const spent = beans.checked ? Math.min(balance, goods) : 0;
    const goodsRow = panel.querySelector("[data-goods]");
    goodsRow.previousElementSibling.textContent = `${n} ${plural(n, "товар", "товара", "товаров")}`;
    goodsRow.textContent = rub(goods);
    ship.textContent = n && goods >= free ? "Бесплатно" : rub(delivery);
    const beansRow = panel.querySelector("[data-beans-row]");
    beansRow.hidden = !spent; beansRow.textContent = `−${rub(spent)}`;
    panel.querySelector("[data-total]").textContent = rub(goods + delivery - spent);
    panel.querySelector("[data-earn]").textContent = Math.round(goods * rate);
    panel.querySelector("[data-free-fill]").style.width = `${Math.min(100, (goods / free) * 100)}%`;
    panel.querySelector("[data-free-text]").textContent = !n ? `Бесплатно от ${rub(free)}` : goods >= free ? "Доставим бесплатно" : `До бесплатной ${rub(free - goods)}`;
    const total = lines.reduce((s, l) => s + l.qty, 0);
    count.textContent = total || "";
    laterPart.hidden = !lines.some((l) => l.later && !catalog.get(l.slug).out);
    gonePart.hidden = !lines.some((l) => catalog.get(l.slug).out);
    const live = lines.filter((l) => !catalog.get(l.slug).out);
    all.checked = live.length > 0 && live.every((l) => !l.later);
    all.indeterminate = live.some((l) => l.later) && live.some((l) => !l.later);
    empty.hidden = lines.length > 0; bar.hidden = !lines.length; panel.hidden = !lines.length; list.hidden = !live.some((l) => !l.later);
    for (const a of panel.querySelectorAll("[data-checkout]")) a.toggleAttribute("aria-disabled", !n);
  }
  const changed = () => { store(); sum(); dispatchEvent(new Event("qq:layout")); };
  sum(); badge();

  const lineOf = (el) => { const n = el.closest("[data-bag-item]"); for (const [l, x] of nodes) if (x === n) return [l, n]; return []; };
  document.addEventListener("click", (e) => {
    const step = e.target.closest(".bitem [data-step]"), rm = e.target.closest("[data-remove]");
    if (step && step.getAttribute("aria-disabled") !== "true") {
      const [l, n] = lineOf(step); l.qty = Math.min(99, Math.max(1, l.qty + Number(step.dataset.step))); fill(n, l); changed();
    } else if (rm) {
      const [l, n] = lineOf(rm); lines.splice(lines.indexOf(l), 1); nodes.delete(l); n.remove(); changed();
      toast(`${catalog.get(l.slug).name} — убран из корзины`);
    }
  });
  document.addEventListener("change", (e) => {
    const t = e.target;
    if (t.matches("[data-pick]")) { const [l, n] = lineOf(t); l.later = !t.checked; place(n, l); changed(); }
    else if (t.matches("[data-opt]")) {
      const [l, n] = lineOf(t); l[t.dataset.opt] = t.value;
      // now the same as another line (the same coffee, choices and place): one line with both quantities
      const twin = lines.find((x) => x !== l && ["slug", "weight", "grind", "roast", "later"].every((k) => x[k] === l[k]));
      if (twin) { twin.qty = Math.min(99, twin.qty + l.qty); fill(nodes.get(twin), twin); lines.splice(lines.indexOf(l), 1); nodes.delete(l); n.remove(); }
      else fill(n, l);
      changed();
    }
    else if (t === all) { for (const [l, n] of nodes) if (!catalog.get(l.slug).out) { l.later = !all.checked; fill(n, l); place(n, l); } changed(); }
    else if (t === beans) sum();
  });
  document.querySelector("[data-cart-clear]").addEventListener("click", () => {
    lines.length = 0; for (const n of nodes.values()) n.remove(); nodes.clear(); changed(); toast("Корзина пуста");
  });
  panel.addEventListener("click", (e) => {
    const a = e.target.closest("[data-checkout]");
    if (a && a.hasAttribute("aria-disabled")) { e.preventDefault(); toast("Отметьте кофе, который заказать"); }
  });
}
