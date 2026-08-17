import {
  addDaysToIsoDate,
  compareIsoDates,
  getTodayInCostaRica,
} from "../booking/costa-rica-dates";
import { AVAILABILITY_HORIZON_DAYS, type BlockedRange, isBlockedNight } from "../booking/blocked-ranges";
import {
  getMinimumNightsForCheckIn,
  isPricingConfigured,
  resolveNightlyRate,
} from "./engine";
import type { CalendarDayPricing, PricingConfig } from "./types";

export function buildCalendarDayPricing(
  config: PricingConfig,
  blockedRanges: BlockedRange[],
  horizonStart: string = getTodayInCostaRica(),
  horizonDays: number = AVAILABILITY_HORIZON_DAYS,
): CalendarDayPricing[] {
  const horizonEnd = addDaysToIsoDate(horizonStart, horizonDays);
  const days: CalendarDayPricing[] = [];
  let cursor = horizonStart;

  while (compareIsoDates(cursor, horizonEnd) <= 0) {
    let availability: CalendarDayPricing["availability"] = "available";
    if (compareIsoDates(cursor, horizonStart) < 0) {
      availability = "past";
    } else if (compareIsoDates(cursor, horizonEnd) > 0) {
      availability = "beyond_horizon";
    } else if (isBlockedNight(cursor, blockedRanges)) {
      availability = "blocked";
    }

    const resolved = isPricingConfigured(config.settings)
      ? resolveNightlyRate(cursor, config)
      : { rateCents: null, source: null, holidayName: undefined };

    days.push({
      date: cursor,
      availability,
      nightlyRateCents: resolved.rateCents,
      currency: config.settings.currency,
      minimumNightsOnCheckIn: getMinimumNightsForCheckIn(cursor, config),
      pricingSource: resolved.source,
      holidayName: resolved.holidayName ?? null,
    });

    cursor = addDaysToIsoDate(cursor, 1);
  }

  return days;
}
