export const COSTA_RICA_TIMEZONE = "America/Costa_Rica";

/** ISO date string YYYY-MM-DD in Costa Rica local calendar. */
export function toCostaRicaDateString(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: COSTA_RICA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((p) => p.type === "year")?.value ?? "1970";
  const month = parts.find((p) => p.type === "month")?.value ?? "01";
  const day = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

export function getTodayInCostaRica(): string {
  return toCostaRicaDateString(new Date());
}

export function parseIsoDate(iso: string): { y: number; m: number; d: number } {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m, d };
}

export function toIsoDate(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function compareIsoDates(a: string, b: string): number {
  return a.localeCompare(b);
}

/** Calendar-only day arithmetic using local date components (not UTC). */
export function addDaysToIsoDate(iso: string, days: number): string {
  const { y, m, d } = parseIsoDate(iso);
  const date = new Date(y, m - 1, d + days);
  return toIsoDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

/** Each entry is a calendar night (YYYY-MM-DD) occupied by a stay: [checkIn, checkOut). */
export function getStayNights(checkIn: string, checkOut: string): string[] {
  const nights: string[] = [];
  let cursor = checkIn;
  while (compareIsoDates(cursor, checkOut) < 0) {
    nights.push(cursor);
    cursor = addDaysToIsoDate(cursor, 1);
  }
  return nights;
}

export function getMonthStart(iso: string): string {
  const { y, m } = parseIsoDate(iso);
  return toIsoDate(y, m, 1);
}

export function addMonthsToMonthStart(monthStart: string, months: number): string {
  const { y, m } = parseIsoDate(monthStart);
  const date = new Date(y, m - 1 + months, 1);
  return toIsoDate(date.getFullYear(), date.getMonth() + 1, 1);
}

export function getDaysInMonth(monthStart: string): number {
  const { y, m } = parseIsoDate(monthStart);
  return new Date(y, m, 0).getDate();
}

export function getWeekdayIndex(iso: string): number {
  const { y, m, d } = parseIsoDate(iso);
  return new Date(y, m - 1, d).getDay();
}

export function formatMonthYear(monthStart: string, locale: string): string {
  const { y, m } = parseIsoDate(monthStart);
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(new Date(y, m - 1, 1));
}

export function formatDisplayDate(iso: string, locale: string): string {
  const { y, m, d } = parseIsoDate(iso);
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(y, m - 1, d));
}
