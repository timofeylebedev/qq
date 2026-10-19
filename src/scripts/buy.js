// Buying, until there is a shop behind the site: the weight a visitor picks updates the price; «В корзину» puts the
// coffee into a bag kept in this browser (localStorage) and shows how many items it holds; the heart does the same
// for favourites. There is no bag page and no checkout yet (design/decisions.json "no-shop-yet").
const KEY = "qq-bag", FAV = "qq-fav";
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode: only this page */ } };
const rub = (n) => (n ? Number(n).toLocaleString("ru-RU").replace(/ /g, " ") + " ₽" : "—");

function badge() {
  const bag = load(KEY, []), fav = load(FAV, []);
  const n = bag.reduce((s, x) => s + (x.qty || 1), 0);
  for (const el of document.querySelectorAll("[data-bag-count]")) { el.textContent = n; el.hidden = !n; }
  for (const el of document.querySelectorAll("[data-fav-count]")) { el.textContent = fav.length; el.hidden = !fav.length; }
  for (const b of document.querySelectorAll("[data-fav]")) b.setAttribute("aria-pressed", String(fav.includes(b.dataset.fav)));
}

let toastTimer;
function toast(text) {
  const t = document.querySelector("[data-toast]");
  if (!t) return;
  t.textContent = text; t.dataset.on = "";
  clearTimeout(toastTimer); toastTimer = setTimeout(() => delete t.dataset.on, 2400);
}

// the price of a form: the chosen weight (a radio on cards, a select on the product page) × the quantity
function price(form) {
  const radio = form.querySelector('input[type="radio"]:checked');
  const option = form.querySelector('select[name="weight"]')?.selectedOptions[0];
  const each = Number((radio || option)?.dataset.price || 0);
  const qty = Number(form.querySelector("[data-qty]")?.textContent || 1);
  return { each, qty, total: each * qty, weight: radio?.value || option?.value };
}
function update(form) {
  const p = price(form);
  for (const out of form.querySelectorAll("[data-price-out]")) out.textContent = rub(p.total);
  const add = form.querySelector(".buy__add");
  if (add) add.setAttribute("aria-label", add.getAttribute("aria-label").replace(/: (.+?), [^,]+, [^,]+$/, `: $1, ${p.weight}, ${rub(p.total)}`));
  const minus = form.querySelector('[data-step="-1"]');
  if (minus) minus.disabled = p.qty <= 1;
}

export function initBuy() {
  badge();
  for (const form of document.querySelectorAll("[data-buy]")) {
    update(form);
    form.addEventListener("change", () => update(form));
    form.addEventListener("click", (e) => {
      const step = e.target.closest("[data-step]");
      if (!step) return;
      const q = form.querySelector("[data-qty]");
      q.textContent = Math.min(99, Math.max(1, Number(q.textContent) + Number(step.dataset.step)));
      update(form);
    });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const p = price(form), data = new FormData(form);
      const bag = load(KEY, []);
      bag.push({ slug: form.dataset.slug, weight: p.weight, grind: data.get("grind"), roast: data.get("roast"), qty: p.qty, price: p.each });
      save(KEY, bag); badge();
      const name = form.closest("[data-card]")?.querySelector(".card__link")?.textContent || document.querySelector("h1")?.textContent || "";
      toast(`${name.trim()} — в корзине`);
      const add = form.querySelector(".buy__add");
      if (add) { delete add.dataset.added; void add.offsetWidth; add.dataset.added = ""; }
    });
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-fav]");
    if (!b) return;
    const fav = new Set(load(FAV, []));
    fav.has(b.dataset.fav) ? fav.delete(b.dataset.fav) : fav.add(b.dataset.fav);
    save(FAV, [...fav]); badge();
  });
  for (const f of document.querySelectorAll("[data-newsletter]")) f.addEventListener("submit", (e) => { e.preventDefault(); toast("Спасибо! Подписка заработает вместе с магазином"); f.reset(); });
  addEventListener("storage", badge);
}
