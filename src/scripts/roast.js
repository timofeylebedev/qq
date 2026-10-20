// The roast schedule (data/site.json "roast": weekdays and an hour, Moscow time): the hero's countdown to the next
// roast and the catalog's line about it. The time is always Moscow's, wherever the visitor is.
const DAYS = ["ВС", "ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ"];
const DAYS_LONG = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const DAYS_SAY = ["в воскресенье", "в понедельник", "во вторник", "в среду", "в четверг", "в пятницу", "в субботу"];
const MONTHS_SHORT = ["Янв", "Фев", "Мар", "Апр", "Мая", "Июн", "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"];
const MONTHS = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
const pad = (n) => String(n).padStart(2, "0");
// 1 час, 2 часа, 5 часов
const plural = (n, [one, few, many]) => n % 10 === 1 && n % 100 !== 11 ? one : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? few : many;

// "now" as Moscow's wall clock, in a Date whose UTC fields hold the local Moscow time
const local = (tz) => new Date(Date.now() + tz * 3600e3);

// the next roast after now, in the same shifted clock
export function nextRoast({ days, hour, tz }) {
  const now = local(tz);
  for (let d = 0; d < 8; d++) {
    const t = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + d, hour));
    if (days.includes(t.getUTCDay()) && t > now) return { now, at: t };
  }
  return { now, at: now };
}

export function initRoast() {
  for (const el of document.querySelectorAll("[data-roast]")) {
    const cfg = JSON.parse(el.dataset.roast);
    const day = el.querySelector("[data-roast-day]"), clock = el.querySelector("[data-roast-clock]");
    const date = el.querySelector("[data-roast-date]"), say = el.querySelector("[data-roast-say]");
    const count = el.querySelector("[data-roast-count]"), hours = el.querySelector("[data-roast-hours]"), ship = el.querySelector("[data-ship-date]");
    const inn = el.querySelector("[data-roast-in]");
    const tick = () => {
      const { now, at } = nextRoast(cfg);
      const left = Math.max(0, Math.floor((at - now) / 1000));
      if (day) day.textContent = DAYS[now.getUTCDay()];
      if (clock) clock.textContent = `${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}`;
      // more than a day to wait (a weekend): the day of the roast instead of the digits, «Пт, 9 Окт»
      const far = left > 24 * 3600;
      if (count) { count.textContent = `${pad(Math.floor(left / 3600))}:${pad(Math.floor(left / 60) % 60)}:${pad(left % 60)}`; count.dataset.live = ""; count.hidden = far && !!date; }
      if (date) {
        date.hidden = !far;
        if (far) { date.textContent = `${DAYS_LONG[at.getUTCDay()]}, ${at.getUTCDate()} ${MONTHS_SHORT[at.getUTCMonth()]}`; date.style.setProperty("--n", date.textContent.length); }
        if (say) say.textContent = far ? `Следующая обжарка ${DAYS_SAY[at.getUTCDay()]}, ${at.getUTCDate()} ${MONTHS[at.getUTCMonth()]}` : "Следующая обжарка через ";
      }
      if (hours) {
        const h = Math.ceil(left / 3600);
        hours.textContent = h <= 1 ? "До ближайшей обжарки меньше часа" : `До ближайшей обжарки менее ${h} ${h % 10 === 1 && h % 100 !== 11 ? "часа" : "часов"}`;
      }
      // the info block's modal: «Ближайшая обжарка через 4 часа» (or «через 35 минут», or the day when it is far)
      if (inn) {
        const h = Math.floor(left / 3600), m = Math.max(1, Math.ceil(left / 60));
        inn.textContent = left > 24 * 3600 ? `Ближайшая обжарка ${DAYS_SAY[at.getUTCDay()]}, ${at.getUTCDate()} ${MONTHS[at.getUTCMonth()]}.`
          : h >= 1 ? `Ближайшая обжарка через ${h} ${plural(h, ["час", "часа", "часов"])}.` : `Ближайшая обжарка через ${m} ${plural(m, ["минуту", "минуты", "минут"])}.`;
      }
      if (ship) ship.textContent = `Передадим в доставку в ${DAYS_LONG[at.getUTCDay()]}, ${at.getUTCDate()} ${MONTHS[at.getUTCMonth()]}`;
    };
    tick();
    // the countdown ticks every second; the catalog line once a minute
    setInterval(tick, count ? 1000 : 60000);
  }
}
