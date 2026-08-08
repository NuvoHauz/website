import {
  addDaysToIsoDate,
  compareIsoDates,
  getStayNights,
  getTodayInCostaRica,
} from "./costa-rica-dates";
import {
  AVAILABILITY_HORIZON_DAYS,
  type BlockedRange,
  isBlockedNight,
} from "./blocked-ranges";

export function getHorizonEnd(): string {
  return addDaysToIsoDate(getTodayInCostaRica(), AVAILABILITY_HORIZON_DAYS);
}

export function isPastDate(iso: string): boolean {
  return compareIsoDates(iso, getTodayInCostaRica()) < 0;
}

export function isBeyondHorizon(iso: string): boolean {
  return compareIsoDates(iso, getHorizonEnd()) > 0;
}

export function isDateSelectable(iso: string): boolean {
  return !isPastDate(iso) && !isBeyondHorizon(iso);
}

export function canCheckInOn(date: string, ranges: BlockedRange[]): boolean {
  return isDateSelectable(date) && !isBlockedNight(date, ranges);
}

export function isStayRangeValid(
  checkIn: string,
  checkOut: string,
  ranges: BlockedRange[],
): boolean {
  if (!checkIn || !checkOut) return false;
  if (compareIsoDates(checkOut, checkIn) <= 0) return false;
  if (!canCheckInOn(checkIn, ranges)) return false;
  if (!isDateSelectable(checkOut)) return false;

  const nights = getStayNights(checkIn, checkOut);
  return nights.every((night) => !isBlockedNight(night, ranges));
}

export type { BlockedRange };
