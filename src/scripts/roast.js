// The roast schedule (data/site.json "roast": weekdays and an hour, Moscow time): the hero's countdown to the next
// roast and the catalog's line about it. The time is always Moscow's, wherever the visitor is.
const DAYS = ["ВС", "ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ"];
const DAYS_LONG = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const MONTHS = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
const pad = (n) => String(n).padStart(2, "0");

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
    const count = el.querySelector("[data-roast-count]"), hours = el.querySelector("[data-roast-hours]"), ship = el.querySelector("[data-ship-date]");
    const tick = () => {
      const { now, at } = nextRoast(cfg);
      const left = Math.max(0, Math.floor((at - now) / 1000));
      if (day) day.textContent = DAYS[now.getUTCDay()];
      if (clock) clock.textContent = `${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}`;
      if (count) { count.textContent = `${pad(Math.floor(left / 3600))}:${pad(Math.floor(left / 60) % 60)}:${pad(left % 60)}`; count.dataset.live = ""; }
      if (hours) {
        const h = Math.ceil(left / 3600);
        hours.textContent = h <= 1 ? "До ближайшей обжарки меньше часа" : `До ближайшей обжарки менее ${h} ${h % 10 === 1 && h % 100 !== 11 ? "часа" : "часов"}`;
      }
      if (ship) ship.textContent = `Передадим в доставку в ${DAYS_LONG[at.getUTCDay()]}, ${at.getUTCDate()} ${MONTHS[at.getUTCMonth()]}`;
    };
    tick();
    // the countdown ticks every second; the catalog line once a minute
    setInterval(tick, count ? 1000 : 60000);
  }
}
