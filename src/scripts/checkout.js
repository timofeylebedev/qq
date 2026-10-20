// The checkout in three steps: sign-in (a phone, or an email), your details (for yourself or as a gift), delivery.
// What a visitor types is kept for this visit only (sessionStorage), so going back keeps it; each step's button
// checks its fields and opens the next step. The last step has nothing behind it yet: it says so
// (design/decisions.json "no-shop-yet"). «#gift» (the bag's «Заказать в подарок») chooses the gift on the way.
import { toast } from "./buy.js";

const KEY = "qq-checkout";
const read = () => { try { return JSON.parse(sessionStorage.getItem(KEY)) || {}; } catch { return {}; } };
const write = (v) => { try { sessionStorage.setItem(KEY, JSON.stringify(v)); } catch { /* private mode */ } };

export function initCheckout() {
  const form = document.querySelector("[data-checkout-step]");
  if (!form) return;
  const step = form.dataset.checkoutStep, data = read(), saved = data[step] || {};
  const next = () => { location.href = form.dataset.next + location.hash; };

  for (const el of form.elements) if (el.name && saved[el.name] != null) {
    if (el.type === "radio" || el.type === "checkbox") el.checked = [].concat(saved[el.name]).includes(el.value);
    else el.value = saved[el.name];
  }

  if (step === "signin") {
    const input = form.querySelector("[data-signin-input]"), label = form.querySelector("[data-signin-label]"), sw = form.querySelector("[data-signin-switch]");
    // what was typed for each way is kept while switching between them
    const typed = { email: saved.email || "", phone: saved.phone || "" };
    const mode = (email) => {
      Object.assign(input, email ? { type: "email", name: "email", placeholder: "Ваш email", autocomplete: "email", inputMode: "email" } : { type: "tel", name: "phone", placeholder: "+7 123 456 78 90", autocomplete: "tel", inputMode: "tel" });
      label.textContent = email ? "Email" : "Телефон";
      sw.textContent = email ? "Вход по телефону" : "Вход по Email";
      input.value = typed[email ? "email" : "phone"];
    };
    let email = !!saved.email && !saved.phone;
    mode(email);
    input.addEventListener("input", () => { typed[email ? "email" : "phone"] = input.value; });
    sw.addEventListener("click", () => { email = !email; mode(email); input.focus(); });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const v = input.value.trim();
      const ok = email ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) : v.replace(/\D/g, "").length >= 10;
      if (!ok) { toast(email ? "Проверьте email" : "Введите номер телефона, 10 цифр после +7"); input.focus(); return; }
      write({ ...data, signin: email ? { email: v } : { phone: v } }); next();
    });
    return;
  }

  if (step === "details") {
    const cells = form.querySelectorAll("[data-gift-label]");
    const setFor = (gift) => {
      for (const c of cells) {
        c.querySelector(".fcell__label").textContent = gift ? c.dataset.giftLabel : c.dataset.selfLabel;
        c.querySelector("input").placeholder = gift ? c.dataset.giftHint : c.dataset.selfHint;
      }
    };
    // «Заказать в подарок» chooses the gift, unless the visitor has already chosen on this step
    if (location.hash === "#gift" && !saved.for) form.querySelector('[data-for][value="gift"]').checked = true;
    // the buyer's phone or email from the sign-in fills its cell: the email always (it is the buyer's in both cases),
    // the phone only for oneself (for a gift it is the recipient's)
    const s = data.signin || {};
    const gift = () => form.querySelector("[data-for]:checked").value === "gift";
    if (!form.elements.email.value && s.email) form.elements.email.value = s.email;
    if (!form.elements.phone.value && s.phone && !gift()) form.elements.phone.value = s.phone;
    setFor(form.querySelector("[data-for]:checked").value === "gift");
    form.addEventListener("change", (e) => {
      if (!e.target.matches("[data-for]")) return;
      setFor(e.target.value === "gift");
      const ph = form.elements.phone;
      if (e.target.value === "gift" && s.phone && ph.value === s.phone) ph.value = "";
      if (e.target.value === "self" && s.phone && !ph.value) ph.value = s.phone;
    });
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const values = {};
    for (const [k, v] of new FormData(form)) values[k] = k in values ? [].concat(values[k], v) : v;
    write({ ...data, [step]: values });
    if (form.dataset.next) next();
    else toast("Оформление заказа заработает вместе с магазином");
  });
}
