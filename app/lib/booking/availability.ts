import {
  compareIsoDates,
  getStayNights,
  getTodayInCostaRica,
} from "./costa-rica-dates";
import {
  getPrototypeBlockedRanges,
  getPrototypeHorizonEnd,
  isBlockedNight,
  type PrototypeBlockedRange,
} from "../../data/riu-house-booking.mock";

export function isPastDate(iso: string): boolean {
  return compareIsoDates(iso, getTodayInCostaRica()) < 0;
}

export function isBeyondHorizon(iso: string): boolean {
  return compareIsoDates(iso, getPrototypeHorizonEnd()) > 0;
}

export function isDateSelectable(iso: string): boolean {
  return !isPastDate(iso) && !isBeyondHorizon(iso);
}

/** A calendar night cannot be the first night of a stay if it is blocked. */
export function canCheckInOn(
  date: string,
  ranges: PrototypeBlockedRange[] = getPrototypeBlockedRanges(),
): boolean {
  return isDateSelectable(date) && !isBlockedNight(date, ranges);
}

export function isStayRangeValid(
  checkIn: string,
  checkOut: string,
  ranges: PrototypeBlockedRange[] = getPrototypeBlockedRanges(),
): boolean {
  if (!checkIn || !checkOut) return false;
  if (compareIsoDates(checkOut, checkIn) <= 0) return false;
  if (!canCheckInOn(checkIn, ranges)) return false;
  if (!isDateSelectable(checkOut)) return false;

  const nights = getStayNights(checkIn, checkOut);
  return nights.every((night) => !isBlockedNight(night, ranges));
}
