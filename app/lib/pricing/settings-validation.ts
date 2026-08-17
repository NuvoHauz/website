import type { PropertyPricingSettings } from "./types";
import { PROPERTY_MAX_CAPACITY } from "./types";

export const SUPPORTED_PRICING_CURRENCIES = ["USD"] as const;
export const MAX_HOLIDAY_PERCENT_INCREASE = 500;

export type PricingPublishValidationCode =
  | "missing_mon_tue_wed_rate"
  | "missing_thursday_rate"
  | "missing_fri_sat_rate"
  | "missing_sunday_rate"
  | "invalid_cleaning_fee"
  | "invalid_currency"
  | "invalid_included_guest_count"
  | "invalid_extra_guest_fee"
  | "invalid_maximum_guest_count"
  | "invalid_guest_count_range";

export interface PricingSettingsInput {
  monTueWedRateCents: number | null;
  thursdayRateCents: number | null;
  friSatRateCents: number | null;
  sundayRateCents: number | null;
  cleaningFeeCents: number;
  includedGuestCount: number;
  extraGuestFeeCents: number;
  maximumGuestCount: number;
  currency: string;
  active: boolean;
}

export function isSupportedPricingCurrency(currency: string): boolean {
  return SUPPORTED_PRICING_CURRENCIES.includes(
    currency.trim().toUpperCase() as (typeof SUPPORTED_PRICING_CURRENCIES)[number],
  );
}

export function isPositiveRateCents(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

export function isValidIncludedGuestCount(value: number): boolean {
  return Number.isInteger(value) && value >= 1;
}

export function isValidExtraGuestFeeCents(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

export function isValidMaximumGuestCount(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= PROPERTY_MAX_CAPACITY;
}

export function isValidGuestCountRange(
  includedGuestCount: number,
  maximumGuestCount: number,
): boolean {
  return maximumGuestCount >= includedGuestCount;
}

export function isPricingPublishReady(settings: PricingSettingsInput): boolean {
  const validation = validatePricingSettingsForPublish(settings);
  return validation.ok;
}

export function validatePricingSettingsForPublish(
  settings: PricingSettingsInput,
): { ok: true } | { ok: false; code: PricingPublishValidationCode } {
  if (!isSupportedPricingCurrency(settings.currency)) {
    return { ok: false, code: "invalid_currency" };
  }

  if (
    typeof settings.cleaningFeeCents !== "number" ||
    !Number.isInteger(settings.cleaningFeeCents) ||
    settings.cleaningFeeCents < 0
  ) {
    return { ok: false, code: "invalid_cleaning_fee" };
  }

  if (!isValidIncludedGuestCount(settings.includedGuestCount)) {
    return { ok: false, code: "invalid_included_guest_count" };
  }

  if (!isValidExtraGuestFeeCents(settings.extraGuestFeeCents)) {
    return { ok: false, code: "invalid_extra_guest_fee" };
  }

  if (!isValidMaximumGuestCount(settings.maximumGuestCount)) {
    return { ok: false, code: "invalid_maximum_guest_count" };
  }

  if (!isValidGuestCountRange(settings.includedGuestCount, settings.maximumGuestCount)) {
    return { ok: false, code: "invalid_guest_count_range" };
  }

  if (!settings.active) {
    return { ok: true };
  }

  if (!isPositiveRateCents(settings.monTueWedRateCents)) {
    return { ok: false, code: "missing_mon_tue_wed_rate" };
  }
  if (!isPositiveRateCents(settings.thursdayRateCents)) {
    return { ok: false, code: "missing_thursday_rate" };
  }
  if (!isPositiveRateCents(settings.friSatRateCents)) {
    return { ok: false, code: "missing_fri_sat_rate" };
  }
  if (!isPositiveRateCents(settings.sundayRateCents)) {
    return { ok: false, code: "missing_sunday_rate" };
  }

  return { ok: true };
}

export function isPricingActiveAndConsistent(settings: PropertyPricingSettings): boolean {
  if (!settings.active) return false;

  return validatePricingSettingsForPublish({
    monTueWedRateCents: settings.monTueWedRateCents,
    thursdayRateCents: settings.thursdayRateCents,
    friSatRateCents: settings.friSatRateCents,
    sundayRateCents: settings.sundayRateCents,
    cleaningFeeCents: settings.cleaningFeeCents,
    includedGuestCount: settings.includedGuestCount,
    extraGuestFeeCents: settings.extraGuestFeeCents,
    maximumGuestCount: settings.maximumGuestCount,
    currency: settings.currency,
    active: true,
  }).ok;
}

export function validateHolidayAdjustmentValue(
  adjustmentType: "fixed_rate" | "percentage",
  adjustmentValue: number,
): boolean {
  if (!Number.isInteger(adjustmentValue)) return false;
  if (adjustmentType === "fixed_rate") {
    return adjustmentValue > 0;
  }
  return adjustmentValue >= 0 && adjustmentValue <= MAX_HOLIDAY_PERCENT_INCREASE;
}
