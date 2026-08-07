/**
 * PROTOTYPE ONLY — sample blocked date ranges for Riu House availability demo.
 * Replace with Supabase + iCal data in a future phase.
 *
 * Each range uses half-open night semantics: blocked overnight stays are
 * start (inclusive) through end (exclusive). Checkout on `start` and
 * check-in on `end` are allowed (same-day turnover).
 */
import {
  addDaysToIsoDate,
  compareIsoDates,
  getTodayInCostaRica,
} from "../lib/booking/costa-rica-dates";

export interface PrototypeBlockedRange {
  /** First blocked calendar night (inclusive), YYYY-MM-DD in Costa Rica. */
  start: string;
  /** First available calendar night after the block (exclusive). */
  end: string;
  /** Developer note — not shown to guests. */
  note: string;
}

export const PROTOTYPE_AVAILABILITY_HORIZON_DAYS = 90;

/** Build sample blocks relative to today so they always fall inside the 90-day window. */
export function getPrototypeBlockedRanges(): PrototypeBlockedRange[] {
  const today = getTodayInCostaRica();

  return [
    {
      start: addDaysToIsoDate(today, 10),
      end: addDaysToIsoDate(today, 14),
      note: "Sample block A — 4 nights",
    },
    {
      start: addDaysToIsoDate(today, 28),
      end: addDaysToIsoDate(today, 31),
      note: "Sample block B — 3 nights",
    },
    {
      start: addDaysToIsoDate(today, 45),
      end: addDaysToIsoDate(today, 48),
      note: "Sample block C — 3 nights",
    },
    {
      start: addDaysToIsoDate(today, 62),
      end: addDaysToIsoDate(today, 65),
      note: "Sample block D — 3 nights",
    },
    {
      start: addDaysToIsoDate(today, 80),
      end: addDaysToIsoDate(today, 83),
      note: "Sample block E — 3 nights",
    },
  ];
}

export function isBlockedNight(
  night: string,
  ranges: PrototypeBlockedRange[] = getPrototypeBlockedRanges(),
): boolean {
  return ranges.some(
    (range) =>
      compareIsoDates(night, range.start) >= 0 &&
      compareIsoDates(night, range.end) < 0,
  );
}

export function getPrototypeHorizonEnd(): string {
  return addDaysToIsoDate(getTodayInCostaRica(), PROTOTYPE_AVAILABILITY_HORIZON_DAYS);
}

export function isWithinHorizon(iso: string): boolean {
  const today = getTodayInCostaRica();
  const end = getPrototypeHorizonEnd();
  return compareIsoDates(iso, today) >= 0 && compareIsoDates(iso, end) <= 0;
}
