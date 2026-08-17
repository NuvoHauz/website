import "server-only";

import { RIU_HOUSE_PROPERTY_SLUG } from "../booking/blocked-ranges";
import { getSupabaseAdmin } from "../supabase/server";
import type {
  HolidayPricingPeriod,
  MinimumStayRule,
  NightlyOverride,
  PricingConfig,
  PropertyPricingSettings,
} from "./types";
import { DEFAULT_CLEANING_FEE_CENTS, DEFAULT_MINIMUM_STAY_RULES } from "./types";
import {
  DEFAULT_EXTRA_GUEST_FEE_CENTS,
  DEFAULT_INCLUDED_GUEST_COUNT,
  DEFAULT_MAXIMUM_GUEST_COUNT,
} from "./types";

function mapSettingsRow(row: Record<string, unknown>): PropertyPricingSettings {
  return {
    propertySlug: String(row.property_slug),
    currency: String(row.currency ?? "USD"),
    monTueWedRateCents:
      row.mon_tue_wed_rate_cents == null ? null : Number(row.mon_tue_wed_rate_cents),
    thursdayRateCents:
      row.thursday_rate_cents == null ? null : Number(row.thursday_rate_cents),
    friSatRateCents:
      row.fri_sat_rate_cents == null ? null : Number(row.fri_sat_rate_cents),
    sundayRateCents:
      row.sunday_rate_cents == null ? null : Number(row.sunday_rate_cents),
    cleaningFeeCents: Number(row.cleaning_fee_cents ?? DEFAULT_CLEANING_FEE_CENTS),
    includedGuestCount: Number(row.included_guest_count ?? DEFAULT_INCLUDED_GUEST_COUNT),
    extraGuestFeeCents: Number(row.extra_guest_fee_cents ?? DEFAULT_EXTRA_GUEST_FEE_CENTS),
    maximumGuestCount: Number(row.maximum_guest_count ?? DEFAULT_MAXIMUM_GUEST_COUNT),
    active: Boolean(row.active),
  };
}

function mapMinimumStayRow(row: Record<string, unknown>): MinimumStayRule {
  return {
    checkInDayOfWeek: Number(row.check_in_day_of_week),
    minimumNights: Number(row.minimum_nights),
  };
}

function mapHolidayRow(row: Record<string, unknown>): HolidayPricingPeriod {
  return {
    id: String(row.id),
    name: String(row.name),
    startDate: String(row.start_date),
    endDate: String(row.end_date),
    adjustmentType: row.adjustment_type as HolidayPricingPeriod["adjustmentType"],
    adjustmentValue: Number(row.adjustment_value),
    minimumNights: Number(row.minimum_nights),
    priority: Number(row.priority),
    active: Boolean(row.active),
  };
}

function mapOverrideRow(row: Record<string, unknown>): NightlyOverride {
  return {
    id: String(row.id),
    overrideDate: String(row.override_date),
    nightlyRateCents: Number(row.nightly_rate_cents),
    minimumNights:
      row.minimum_nights == null ? null : Number(row.minimum_nights),
    internalReason:
      row.internal_reason == null ? null : String(row.internal_reason),
    active: Boolean(row.active),
  };
}

function defaultPricingConfig(): PricingConfig {
  return {
    settings: {
      propertySlug: RIU_HOUSE_PROPERTY_SLUG,
      currency: "USD",
      monTueWedRateCents: null,
      thursdayRateCents: null,
      friSatRateCents: null,
      sundayRateCents: null,
      cleaningFeeCents: DEFAULT_CLEANING_FEE_CENTS,
      includedGuestCount: DEFAULT_INCLUDED_GUEST_COUNT,
      extraGuestFeeCents: DEFAULT_EXTRA_GUEST_FEE_CENTS,
      maximumGuestCount: DEFAULT_MAXIMUM_GUEST_COUNT,
      active: false,
    },
    minimumStayRules: DEFAULT_MINIMUM_STAY_RULES,
    holidayPeriods: [],
    nightlyOverrides: [],
  };
}

export async function loadPricingConfig(
  propertySlug: string = RIU_HOUSE_PROPERTY_SLUG,
): Promise<PricingConfig> {
  const supabase = getSupabaseAdmin();

  const [settingsResult, minimumStayResult, holidayResult, overrideResult] =
    await Promise.all([
      supabase
        .from("property_pricing_settings")
        .select("*")
        .eq("property_slug", propertySlug)
        .maybeSingle(),
      supabase
        .from("property_minimum_stay_rules")
        .select("check_in_day_of_week, minimum_nights")
        .eq("property_slug", propertySlug)
        .order("check_in_day_of_week", { ascending: true }),
      supabase
        .from("property_holiday_pricing_periods")
        .select("*")
        .eq("property_slug", propertySlug)
        .order("start_date", { ascending: true }),
      supabase
        .from("property_nightly_overrides")
        .select("*")
        .eq("property_slug", propertySlug)
        .order("override_date", { ascending: true }),
    ]);

  if (
    settingsResult.error?.code === "42P01" ||
    minimumStayResult.error?.code === "42P01"
  ) {
    return defaultPricingConfig();
  }

  const defaults = defaultPricingConfig();

  return {
    settings: settingsResult.data
      ? mapSettingsRow(settingsResult.data)
      : defaults.settings,
    minimumStayRules:
      minimumStayResult.data && minimumStayResult.data.length > 0
        ? minimumStayResult.data.map(mapMinimumStayRow)
        : defaults.minimumStayRules,
    holidayPeriods: (holidayResult.data ?? []).map(mapHolidayRow),
    nightlyOverrides: (overrideResult.data ?? []).map(mapOverrideRow),
  };
}

