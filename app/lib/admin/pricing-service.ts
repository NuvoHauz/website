import "server-only";

import { RIU_HOUSE_PROPERTY_SLUG } from "../booking/blocked-ranges";
import { findEqualPriorityHolidayOverlaps } from "../pricing/engine";
import { loadPricingConfig } from "../pricing/pricing-service";
import {
  validateHolidayAdjustmentValue,
  validatePricingSettingsForPublish,
} from "../pricing/settings-validation";
import type {
  HolidayPricingPeriod,
  NightlyOverride,
  PropertyPricingSettings,
} from "../pricing/types";
import { getSupabaseAdmin } from "../supabase/server";

export interface AdminPricingResponse {
  settings: PropertyPricingSettings;
  minimumStayRules: Array<{ checkInDayOfWeek: number; minimumNights: number }>;
  holidayPeriods: HolidayPricingPeriod[];
  nightlyOverrides: NightlyOverride[];
}

export async function fetchAdminPricing(): Promise<AdminPricingResponse> {
  const config = await loadPricingConfig();
  return {
    settings: config.settings,
    minimumStayRules: config.minimumStayRules,
    holidayPeriods: config.holidayPeriods,
    nightlyOverrides: config.nightlyOverrides,
  };
}

export async function updatePricingSettings(input: {
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
}): Promise<"ok" | "incomplete_rates" | "invalid_currency" | "error"> {
  const publishValidation = validatePricingSettingsForPublish({
    monTueWedRateCents: input.monTueWedRateCents,
    thursdayRateCents: input.thursdayRateCents,
    friSatRateCents: input.friSatRateCents,
    sundayRateCents: input.sundayRateCents,
    cleaningFeeCents: input.cleaningFeeCents,
    includedGuestCount: input.includedGuestCount,
    extraGuestFeeCents: input.extraGuestFeeCents,
    maximumGuestCount: input.maximumGuestCount,
    currency: input.currency,
    active: input.active,
  });

  if (!publishValidation.ok) {
    if (publishValidation.code === "invalid_currency") {
      return "invalid_currency";
    }
    return "incomplete_rates";
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("property_pricing_settings")
    .update({
      mon_tue_wed_rate_cents: input.monTueWedRateCents,
      thursday_rate_cents: input.thursdayRateCents,
      fri_sat_rate_cents: input.friSatRateCents,
      sunday_rate_cents: input.sundayRateCents,
      cleaning_fee_cents: input.cleaningFeeCents,
      included_guest_count: input.includedGuestCount,
      extra_guest_fee_cents: input.extraGuestFeeCents,
      maximum_guest_count: input.maximumGuestCount,
      currency: input.currency.trim().toUpperCase(),
      active: input.active,
      updated_at: new Date().toISOString(),
    })
    .eq("property_slug", RIU_HOUSE_PROPERTY_SLUG);

  return error ? "error" : "ok";
}

export async function createHolidayPeriod(input: {
  name: string;
  startDate: string;
  endDate: string;
  adjustmentType: "fixed_rate" | "percentage";
  adjustmentValue: number;
  minimumNights: number;
  priority: number;
  active: boolean;
}): Promise<"ok" | "overlap" | "invalid_adjustment" | "error"> {
  const config = await loadPricingConfig();
  const candidate: HolidayPricingPeriod = {
    id: "new",
    name: input.name,
    startDate: input.startDate,
    endDate: input.endDate,
    adjustmentType: input.adjustmentType,
    adjustmentValue: input.adjustmentValue,
    minimumNights: input.minimumNights,
    priority: input.priority,
    active: input.active,
  };

  const overlaps = findEqualPriorityHolidayOverlaps([
    ...config.holidayPeriods,
    candidate,
  ]);
  if (overlaps.length > 0) return "overlap";
  if (!validateHolidayAdjustmentValue(input.adjustmentType, input.adjustmentValue)) {
    return "invalid_adjustment";
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("property_holiday_pricing_periods").insert({
    property_slug: RIU_HOUSE_PROPERTY_SLUG,
    name: input.name,
    start_date: input.startDate,
    end_date: input.endDate,
    adjustment_type: input.adjustmentType,
    adjustment_value: input.adjustmentValue,
    minimum_nights: input.minimumNights,
    priority: input.priority,
    active: input.active,
  });

  return error ? "error" : "ok";
}

export async function updateHolidayPeriod(
  id: string,
  input: Partial<{
    name: string;
    startDate: string;
    endDate: string;
    adjustmentType: "fixed_rate" | "percentage";
    adjustmentValue: number;
    minimumNights: number;
    priority: number;
    active: boolean;
  }>,
): Promise<"ok" | "overlap" | "not_found" | "invalid_adjustment" | "error"> {
  const config = await loadPricingConfig();
  const existing = config.holidayPeriods.find((period) => period.id === id);
  if (!existing) return "not_found";

  const updated: HolidayPricingPeriod = {
    ...existing,
    ...input,
    startDate: input.startDate ?? existing.startDate,
    endDate: input.endDate ?? existing.endDate,
  };

  const others = config.holidayPeriods.filter((period) => period.id !== id);
  const overlaps = findEqualPriorityHolidayOverlaps([...others, updated]);
  if (overlaps.length > 0) return "overlap";

  const mergedType = input.adjustmentType ?? existing.adjustmentType;
  const mergedValue = input.adjustmentValue ?? existing.adjustmentValue;
  if (!validateHolidayAdjustmentValue(mergedType, mergedValue)) {
    return "invalid_adjustment";
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("property_holiday_pricing_periods")
    .update({
      ...(input.name != null ? { name: input.name } : {}),
      ...(input.startDate != null ? { start_date: input.startDate } : {}),
      ...(input.endDate != null ? { end_date: input.endDate } : {}),
      ...(input.adjustmentType != null ? { adjustment_type: input.adjustmentType } : {}),
      ...(input.adjustmentValue != null ? { adjustment_value: input.adjustmentValue } : {}),
      ...(input.minimumNights != null ? { minimum_nights: input.minimumNights } : {}),
      ...(input.priority != null ? { priority: input.priority } : {}),
      ...(input.active != null ? { active: input.active } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("property_slug", RIU_HOUSE_PROPERTY_SLUG);

  return error ? "error" : "ok";
}

export async function deleteHolidayPeriod(id: string): Promise<"ok" | "error"> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("property_holiday_pricing_periods")
    .delete()
    .eq("id", id)
    .eq("property_slug", RIU_HOUSE_PROPERTY_SLUG);
  return error ? "error" : "ok";
}

export async function createNightlyOverride(input: {
  overrideDate: string;
  nightlyRateCents: number;
  minimumNights: number | null;
  internalReason: string | null;
  active: boolean;
}): Promise<"ok" | "error"> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("property_nightly_overrides").insert({
    property_slug: RIU_HOUSE_PROPERTY_SLUG,
    override_date: input.overrideDate,
    nightly_rate_cents: input.nightlyRateCents,
    minimum_nights: input.minimumNights,
    internal_reason: input.internalReason,
    active: input.active,
  });
  return error ? "error" : "ok";
}

export async function updateNightlyOverride(
  id: string,
  input: Partial<{
    overrideDate: string;
    nightlyRateCents: number;
    minimumNights: number | null;
    internalReason: string | null;
    active: boolean;
  }>,
): Promise<"ok" | "not_found" | "error"> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("property_nightly_overrides")
    .update({
      ...(input.overrideDate != null ? { override_date: input.overrideDate } : {}),
      ...(input.nightlyRateCents != null
        ? { nightly_rate_cents: input.nightlyRateCents }
        : {}),
      ...(input.minimumNights !== undefined ? { minimum_nights: input.minimumNights } : {}),
      ...(input.internalReason !== undefined
        ? { internal_reason: input.internalReason }
        : {}),
      ...(input.active != null ? { active: input.active } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("property_slug", RIU_HOUSE_PROPERTY_SLUG)
    .select("id")
    .maybeSingle();

  if (error) return "error";
  if (!data) return "not_found";
  return "ok";
}

export async function deleteNightlyOverride(id: string): Promise<"ok" | "error"> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("property_nightly_overrides")
    .delete()
    .eq("id", id)
    .eq("property_slug", RIU_HOUSE_PROPERTY_SLUG);
  return error ? "error" : "ok";
}
