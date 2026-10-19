// The catalog's tabs, filters and sorting, in the browser over the data-* of the cards (src/templates/catalog.mjs):
//   type, line, country, process, prep   any of the ticked values (none ticked: all)
//   min, max                              the price of 200 g
//   sort                                  popular (the order of the page), new, expensive, cheap
// The choice is kept in the address (?country=Кения&sort=new): every change the visitor makes is a step of the
// browser's history, so a filtered catalog can be shared and Back undoes the last change. Only coffee exists for now:
// the other tabs say so.
export function initFilters() {
  const form = document.querySelector("[data-filters]"), grid = document.querySelector("[data-grid]");
  const cards = [...grid.children];
  const found = document.querySelector("[data-found]"), empty = document.querySelector("[data-empty]");
  const soon = document.querySelector("[data-soon]"), soonWhat = document.querySelector("[data-soon-what]");
  const resets = document.querySelectorAll("[data-reset]");
  const SOON = { kaskara: "появится каскара", dripy: "появятся дрипы", sety: "появятся сеты", merch: "появится мерч" };
  const order = new Map(cards.map((c, i) => [c, i]));

  // the address ↔ the form
  const read = () => {
    const q = new URLSearchParams(location.search);
    for (const el of form.elements) {
      if (!el.name) continue;
      if (el.type === "checkbox") el.checked = q.getAll(el.name).includes(el.value);
      else if (el.type === "radio") el.checked = (q.get(el.name) || "popular") === el.value;
      else el.value = q.get(el.name) || "";
    }
  };
  const write = (push) => {
    const q = new URLSearchParams();
    for (const [k, v] of new FormData(form)) if (v !== "" && !(k === "sort" && v === "popular")) q.append(k, v);
    const s = q.toString(), url = location.pathname + (s ? "?" + s : "") + location.hash;
    if (url !== location.pathname + location.search + location.hash) history[push ? "pushState" : "replaceState"](null, "", url);
  };

  const apply = (push) => {
    const f = new FormData(form);
    const all = (k) => f.getAll(k);
    const min = Number(f.get("min")) || 0, max = f.get("max") === "" || f.get("max") == null ? Infinity : Number(f.get("max"));
    const has = (card, key, list) => !list.length || list.some((v) => (card.dataset[key] || "").split("|").includes(v));
    let n = 0;
    for (const c of cards) {
      const price = Number(c.dataset.price);
      const ok = has(c, "type", all("type")) && has(c, "line", all("line")) && has(c, "countries", all("country")) &&
        has(c, "processes", all("process")) && has(c, "prep", all("prep")) && price >= min && price <= max;
      c.toggleAttribute("data-out", !ok);
      if (ok) n++;
    }
    const sort = f.get("sort") || "popular";
    const by = {
      popular: (a, b) => order.get(a) - order.get(b),
      new: (a, b) => b.dataset.created.localeCompare(a.dataset.created),
      expensive: (a, b) => b.dataset.price - a.dataset.price || order.get(a) - order.get(b),
      cheap: (a, b) => a.dataset.price - b.dataset.price || order.get(a) - order.get(b)
    }[sort];
    const sorted = [...cards].sort(by);
    sorted.forEach((c) => grid.append(c));
    // from L the first cards take half a row and the rest a third: as many halves (an even number, four or more in the
    // order «Популярные», as the page is built) as it takes for the thirds to fill their last row
    let big = sort === "popular" ? 4 : 0;
    while (big <= n && (n - big) % 3) big += 2;
    if (big > n) big = 0;
    for (const c of sorted) {
      if (c.hasAttribute("data-out")) continue;
      c.classList.toggle("card--half", big > 0); c.classList.toggle("card--third", big <= 0); big--;
    }
    found.textContent = n;
    empty.hidden = n > 0;
    const active = [...form.elements].some((el) => (el.type === "checkbox" && el.checked) || (el.type === "number" && el.value) || (el.type === "radio" && el.checked && el.value !== "popular"));
    resets.forEach((b) => { if (b.type === "reset") b.hidden = !active; });
    // what each cell says when closed: the choice, or everything
    for (const d of form.querySelectorAll("[data-filter]")) {
      const v = d.querySelector("[data-filter-value]");
      const picked = [...d.querySelectorAll("input:checked")].map((i) => i.nextElementSibling.textContent);
      const nums = [...d.querySelectorAll('input[type="number"]')].map((i) => i.value);
      let text = v.dataset.all, on = false;
      if (d.dataset.filter === "price" && (nums[0] || nums[1])) { text = `${nums[0] || "…"} — ${nums[1] || "…"}`; on = true; }
      else if (picked.length && d.dataset.filter === "sort") text = picked[0];
      else if (picked.length) { text = picked.join(", "); on = true; }
      v.textContent = text; d.toggleAttribute("data-active", on || (d.dataset.filter === "sort" && sort !== "popular"));
    }
    write(push === true);
    dispatchEvent(new Event("qq:layout"));
  };

  // the tabs: «Все» and «Кофе» show the coffee; the others are not in the shop yet
  const tab = () => {
    const id = location.hash.slice(1) || "all";
    const what = SOON[id];
    for (const t of document.querySelectorAll(".tab")) t.toggleAttribute("aria-current", false);
    document.querySelector(`.tab[data-tab="${what || id === "kofe" ? id : "all"}"]`)?.setAttribute("aria-current", "page");
    grid.hidden = !!what; form.hidden = !!what; soon.hidden = !what;
    if (what) soonWhat.textContent = what;
    dispatchEvent(new Event("qq:layout"));
  };

  // one cell open at a time; a click elsewhere or Escape closes it
  const cells = [...form.querySelectorAll("details")];
  // an open panel stays inside the column: one that would stick out on the right opens leftwards
  cells.forEach((d) => d.addEventListener("toggle", () => {
    if (!d.open) return;
    cells.forEach((o) => o !== d && (o.open = false));
    const panel = d.querySelector(".filter__options"), edge = form.getBoundingClientRect().right;
    panel.style.left = panel.style.right = "";
    if (panel.getBoundingClientRect().right > edge + 1) { panel.style.left = "auto"; panel.style.right = "-1px"; }
  }));
  document.addEventListener("click", (e) => { if (!e.target.closest("[data-filters] details")) cells.forEach((d) => (d.open = false)); });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const open = cells.find((d) => d.open);
    if (open) { open.open = false; open.querySelector("summary").focus(); }
  });

  // a cell closes when the keyboard focus leaves it (an open panel must not cover what is focused next)
  cells.forEach((d) => d.addEventListener("focusout", (e) => { if (d.open && !d.contains(e.relatedTarget) && e.relatedTarget) d.open = false; }));

  form.addEventListener("change", () => apply(true));
  let typing = 0;   // typing a price is one step of history, not one per digit
  form.addEventListener("input", (e) => { if (e.target.type === "number") { apply(!typing); clearTimeout(typing); typing = setTimeout(() => (typing = 0), 800); } });
  form.addEventListener("submit", (e) => e.preventDefault());
  form.addEventListener("reset", () => setTimeout(() => apply(true)));
  resets.forEach((b) => b.type !== "reset" && b.addEventListener("click", () => { form.reset(); setTimeout(() => apply(true)); }));
  addEventListener("hashchange", tab);
  addEventListener("popstate", () => { read(); apply(); });
  read(); apply(); tab();
}
