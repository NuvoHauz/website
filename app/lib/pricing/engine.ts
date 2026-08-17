import {
  addDaysToIsoDate,
  compareIsoDates,
  getStayNights,
  getWeekdayIndex,
} from "../booking/costa-rica-dates";
import type { BlockedRange } from "../booking/blocked-ranges";
import { isBlockedNight } from "../booking/blocked-ranges";
import type {
  HolidayPricingPeriod,
  MinimumStayRule,
  NightlyBreakdownLine,
  NightlyOverride,
  PricingConfig,
  PricingSource,
  PropertyPricingSettings,
  StayPricingError,
  StayPricingQuote,
} from "./types";
import { DEFAULT_MINIMUM_STAY_RULES } from "./types";
import {
  isPricingActiveAndConsistent,
} from "./settings-validation";
import {
  calculateExtraGuestTotals,
  getTotalChargeableGuests,
} from "./guest-pricing";

function getBaseRateCentsForWeekday(
  weekday: number,
  settings: PropertyPricingSettings,
): number | null {
  if (weekday === 0) return settings.sundayRateCents;
  if (weekday >= 1 && weekday <= 3) return settings.monTueWedRateCents;
  if (weekday === 4) return settings.thursdayRateCents;
  if (weekday === 5 || weekday === 6) return settings.friSatRateCents;
  return null;
}

function getBasePricingSource(weekday: number): PricingSource {
  if (weekday === 0) return "sunday";
  if (weekday >= 1 && weekday <= 3) return "weekday";
  if (weekday === 4) return "thursday";
  return "weekend";
}

function isDateInHolidayPeriod(date: string, period: HolidayPricingPeriod): boolean {
  return (
    period.active &&
    compareIsoDates(date, period.startDate) >= 0 &&
    compareIsoDates(date, period.endDate) <= 0
  );
}

function getActiveHolidayPeriodsForDate(
  date: string,
  periods: HolidayPricingPeriod[],
): HolidayPricingPeriod[] {
  return periods
    .filter((period) => isDateInHolidayPeriod(date, period))
    .sort((a, b) => b.priority - a.priority);
}

function getActiveOverrideForDate(
  date: string,
  overrides: NightlyOverride[],
): NightlyOverride | null {
  return (
    overrides.find(
      (override) => override.active && override.overrideDate === date,
    ) ?? null
  );
}

function applyHolidayAdjustment(
  baseRateCents: number,
  period: HolidayPricingPeriod,
): number {
  if (period.adjustmentType === "fixed_rate") {
    return period.adjustmentValue;
  }
  // adjustmentValue is a whole-number percent increase (20 = +20%).
  return Math.round((baseRateCents * (100 + period.adjustmentValue)) / 100);
}

export function getMinimumStayRulesMap(
  rules: MinimumStayRule[],
): Map<number, number> {
  const source = rules.length > 0 ? rules : DEFAULT_MINIMUM_STAY_RULES;
  return new Map(source.map((rule) => [rule.checkInDayOfWeek, rule.minimumNights]));
}

export function getMinimumNightsForCheckIn(
  checkIn: string,
  config: Pick<PricingConfig, "minimumStayRules" | "holidayPeriods" | "nightlyOverrides">,
): number {
  const override = getActiveOverrideForDate(checkIn, config.nightlyOverrides);
  if (override?.minimumNights != null) {
    return override.minimumNights;
  }

  const holidays = getActiveHolidayPeriodsForDate(checkIn, config.holidayPeriods);
  if (holidays.length > 0) {
    return holidays[0].minimumNights;
  }

  const rulesMap = getMinimumStayRulesMap(config.minimumStayRules);
  const weekday = getWeekdayIndex(checkIn);
  return rulesMap.get(weekday) ?? 1;
}

export function getEarliestCheckoutDate(
  checkIn: string,
  config: Pick<PricingConfig, "minimumStayRules" | "holidayPeriods" | "nightlyOverrides">,
): string {
  const minimumNights = getMinimumNightsForCheckIn(checkIn, config);
  return addDaysToIsoDate(checkIn, minimumNights);
}

export function getMinimumStayMessageKey(checkIn: string): string | null {
  const weekday = getWeekdayIndex(checkIn);
  if (weekday === 4) return "minimumStayThursday";
  if (weekday === 5) return "minimumStayFriday";
  if (weekday === 6) return "minimumStaySaturday";
  return null;
}

export function resolveNightlyRate(
  date: string,
  config: PricingConfig,
): { rateCents: number | null; source: PricingSource | null; holidayName?: string } {
  if (!config.settings.active) {
    return { rateCents: null, source: null };
  }

  if (!isPricingActiveAndConsistent(config.settings)) {
    return { rateCents: null, source: null };
  }

  const override = getActiveOverrideForDate(date, config.nightlyOverrides);
  if (override) {
    return {
      rateCents: override.nightlyRateCents,
      source: "override",
    };
  }

  const weekday = getWeekdayIndex(date);
  const baseRate = getBaseRateCentsForWeekday(weekday, config.settings);
  const baseSource = getBasePricingSource(weekday);

  if (baseRate == null) {
    return { rateCents: null, source: null };
  }

  const holidays = getActiveHolidayPeriodsForDate(date, config.holidayPeriods);
  if (holidays.length > 0) {
    const holiday = holidays[0];
    return {
      rateCents: applyHolidayAdjustment(baseRate, holiday),
      source: "holiday",
      holidayName: holiday.name,
    };
  }

  return { rateCents: baseRate, source: baseSource };
}

export function isPricingConfigured(settings: PropertyPricingSettings): boolean {
  return isPricingActiveAndConsistent(settings);
}

export function getBaseRateCentsForWeekdayPublic(
  weekday: number,
  settings: PropertyPricingSettings,
): number | null {
  return getBaseRateCentsForWeekday(weekday, settings);
}

export function isStayDurationValid(
  checkIn: string,
  checkOut: string,
  config: Pick<PricingConfig, "minimumStayRules" | "holidayPeriods" | "nightlyOverrides">,
): boolean {
  if (!checkIn || !checkOut) return false;
  if (compareIsoDates(checkOut, checkIn) <= 0) return false;

  const nights = getStayNights(checkIn, checkOut);
  const minimumNights = getMinimumNightsForCheckIn(checkIn, config);
  return nights.length >= minimumNights;
}

export function isStayRangeAvailable(
  checkIn: string,
  checkOut: string,
  blockedRanges: BlockedRange[],
): boolean {
  const nights = getStayNights(checkIn, checkOut);
  return nights.every((night) => !isBlockedNight(night, blockedRanges));
}

export function calculateStayPricing(
  checkIn: string,
  checkOut: string,
  config: PricingConfig,
  blockedRanges: BlockedRange[] = [],
  guestCounts?: { adults: number; children: number },
): { ok: true; quote: StayPricingQuote } | { ok: false; error: StayPricingError } {
  if (!checkIn || !checkOut || compareIsoDates(checkOut, checkIn) <= 0) {
    return { ok: false, error: { code: "invalidDateRange" } };
  }

  const minimumNightsRequired = getMinimumNightsForCheckIn(checkIn, config);
  const nights = getStayNights(checkIn, checkOut);

  if (nights.length < minimumNightsRequired) {
    return {
      ok: false,
      error: { code: "minimumStayNotMet", minimumNightsRequired },
    };
  }

  if (!isStayRangeAvailable(checkIn, checkOut, blockedRanges)) {
    return { ok: false, error: { code: "blockedDates" } };
  }

  const pricingConfigured = isPricingActiveAndConsistent(config.settings);
  const nightlyBreakdown: NightlyBreakdownLine[] = [];

  if (config.settings.active && !pricingConfigured) {
    return { ok: false, error: { code: "pricingInconsistent" } };
  }

  if (pricingConfigured) {
    for (const night of nights) {
      const resolved = resolveNightlyRate(night, config);
      if (resolved.rateCents == null) {
        return { ok: false, error: { code: "pricingInconsistent" } };
      }
      nightlyBreakdown.push({
        date: night,
        rateCents: resolved.rateCents,
        source: resolved.source ?? "weekday",
        holidayName: resolved.holidayName,
      });
    }
  }

  const nightlySubtotalCents = nightlyBreakdown.reduce(
    (sum, line) => sum + line.rateCents,
    0,
  );
  const cleaningFeeCents = pricingConfigured ? config.settings.cleaningFeeCents : 0;

  const totalChargeableGuests =
    guestCounts == null ? config.settings.includedGuestCount : getTotalChargeableGuests(
      guestCounts.adults,
      guestCounts.children,
    );

  let extraGuestCount = 0;
  let extraGuestTotalCents = 0;

  if (pricingConfigured && guestCounts != null) {
    const extraGuestResult = calculateExtraGuestTotals(
      totalChargeableGuests,
      nights.length,
      config.settings,
    );
    if (!extraGuestResult.ok) {
      return { ok: false, error: { code: "tooManyGuests" } };
    }
    extraGuestCount = extraGuestResult.extraGuestCount;
    extraGuestTotalCents = extraGuestResult.extraGuestTotalCents;
  }

  return {
    ok: true,
    quote: {
      currency: config.settings.currency,
      nightsCount: nights.length,
      nightlySubtotalCents,
      includedGuestCount: config.settings.includedGuestCount,
      totalChargeableGuests,
      extraGuestCount,
      extraGuestFeeCents: config.settings.extraGuestFeeCents,
      extraGuestTotalCents,
      maximumGuestCount: config.settings.maximumGuestCount,
      cleaningFeeCents,
      estimatedTotalCents:
        nightlySubtotalCents + extraGuestTotalCents + cleaningFeeCents,
      nightlyBreakdown,
      minimumNightsRequired,
    },
  };
}

export function findEqualPriorityHolidayOverlaps(
  periods: HolidayPricingPeriod[],
): Array<{ a: HolidayPricingPeriod; b: HolidayPricingPeriod }> {
  const active = periods.filter((period) => period.active);
  const overlaps: Array<{ a: HolidayPricingPeriod; b: HolidayPricingPeriod }> = [];

  for (let i = 0; i < active.length; i += 1) {
    for (let j = i + 1; j < active.length; j += 1) {
      const a = active[i];
      const b = active[j];
      if (a.priority !== b.priority) continue;
      if (
        compareIsoDates(a.startDate, b.endDate) <= 0 &&
        compareIsoDates(b.startDate, a.endDate) <= 0
      ) {
        overlaps.push({ a, b });
      }
    }
  }

  return overlaps;
}

export function formatCentsAsUsd(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function parseDollarsToCents(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const normalized = trimmed.replace(/[^0-9.]/g, "");
  if (!normalized || Number.isNaN(Number(normalized))) return null;
  return Math.round(Number(normalized) * 100);
}
