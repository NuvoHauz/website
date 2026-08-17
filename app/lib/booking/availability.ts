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
import { isStayDurationValid } from "../pricing/engine";

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

export interface MinimumStayContext {
  minimumStayRules: import("../pricing/types").MinimumStayRule[];
  holidayPeriods: import("../pricing/types").HolidayPricingPeriod[];
  nightlyOverrides: import("../pricing/types").NightlyOverride[];
}

export function getMinimumStayForCheckInFromDays(
  checkIn: string,
  calendarDays: Array<{ date: string; minimumNightsOnCheckIn: number }>,
): number {
  const day = calendarDays.find((entry) => entry.date === checkIn);
  return day?.minimumNightsOnCheckIn ?? 1;
}

export function getEarliestCheckoutFromDays(
  checkIn: string,
  calendarDays: Array<{ date: string; minimumNightsOnCheckIn: number }>,
): string {
  const minimumNights = getMinimumStayForCheckInFromDays(checkIn, calendarDays);
  return addDaysToIsoDate(checkIn, minimumNights);
}

export function isCheckoutAllowed(
  checkIn: string,
  checkOut: string,
  ranges: BlockedRange[],
  calendarDays: Array<{ date: string; minimumNightsOnCheckIn: number }>,
): boolean {
  if (!checkIn || !checkOut) return false;
  if (compareIsoDates(checkOut, checkIn) <= 0) return false;
  if (!canCheckInOn(checkIn, ranges)) return false;
  if (!isDateSelectable(checkOut)) return false;

  const minimumNights = getMinimumStayForCheckInFromDays(checkIn, calendarDays);
  const nights = getStayNights(checkIn, checkOut);
  if (nights.length < minimumNights) return false;

  return nights.every((night) => !isBlockedNight(night, ranges));
}

export function isStayRangeValid(
  checkIn: string,
  checkOut: string,
  ranges: BlockedRange[],
  minimumStayContext?: MinimumStayContext,
): boolean {
  if (!checkIn || !checkOut) return false;
  if (compareIsoDates(checkOut, checkIn) <= 0) return false;
  if (!canCheckInOn(checkIn, ranges)) return false;
  if (!isDateSelectable(checkOut)) return false;

  if (minimumStayContext) {
    if (!isStayDurationValid(checkIn, checkOut, minimumStayContext)) return false;
  }

  const nights = getStayNights(checkIn, checkOut);
  return nights.every((night) => !isBlockedNight(night, ranges));
}

export function isStayRangeValidWithCalendarDays(
  checkIn: string,
  checkOut: string,
  ranges: BlockedRange[],
  calendarDays: Array<{ date: string; minimumNightsOnCheckIn: number }>,
): boolean {
  return isCheckoutAllowed(checkIn, checkOut, ranges, calendarDays);
}

export type { BlockedRange };
