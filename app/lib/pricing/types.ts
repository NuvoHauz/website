export type PricingSource =
  | "weekday"
  | "thursday"
  | "weekend"
  | "sunday"
  | "holiday"
  | "override";

export type HolidayAdjustmentType = "fixed_rate" | "percentage";

export interface PropertyPricingSettings {
  propertySlug: string;
  currency: string;
  monTueWedRateCents: number | null;
  thursdayRateCents: number | null;
  friSatRateCents: number | null;
  sundayRateCents: number | null;
  cleaningFeeCents: number;
  includedGuestCount: number;
  extraGuestFeeCents: number;
  maximumGuestCount: number;
  active: boolean;
}

export interface MinimumStayRule {
  checkInDayOfWeek: number;
  minimumNights: number;
}

export interface HolidayPricingPeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  adjustmentType: HolidayAdjustmentType;
  adjustmentValue: number;
  minimumNights: number;
  priority: number;
  active: boolean;
}

export interface NightlyOverride {
  id: string;
  overrideDate: string;
  nightlyRateCents: number;
  minimumNights: number | null;
  internalReason: string | null;
  active: boolean;
}

export interface PricingConfig {
  settings: PropertyPricingSettings;
  minimumStayRules: MinimumStayRule[];
  holidayPeriods: HolidayPricingPeriod[];
  nightlyOverrides: NightlyOverride[];
}

export interface NightlyBreakdownLine {
  date: string;
  rateCents: number;
  source: PricingSource;
  holidayName?: string;
}

export interface StayPricingQuote {
  currency: string;
  nightsCount: number;
  nightlySubtotalCents: number;
  includedGuestCount: number;
  totalChargeableGuests: number;
  extraGuestCount: number;
  extraGuestFeeCents: number;
  extraGuestTotalCents: number;
  maximumGuestCount: number;
  cleaningFeeCents: number;
  estimatedTotalCents: number;
  nightlyBreakdown: NightlyBreakdownLine[];
  minimumNightsRequired: number;
}

export interface CalendarDayPricing {
  date: string;
  availability: "available" | "blocked" | "past" | "beyond_horizon";
  nightlyRateCents: number | null;
  currency: string;
  minimumNightsOnCheckIn: number;
  pricingSource: PricingSource | null;
  holidayName: string | null;
}

export type StayPricingErrorCode =
  | "invalidDateRange"
  | "minimumStayNotMet"
  | "blockedDates"
  | "pricingNotConfigured"
  | "pricingInconsistent"
  | "tooManyGuests"
  | "beyondHorizon"
  | "pastDate";

export interface StayPricingError {
  code: StayPricingErrorCode;
  minimumNightsRequired?: number;
}

export const DEFAULT_MINIMUM_STAY_RULES: MinimumStayRule[] = [
  { checkInDayOfWeek: 0, minimumNights: 1 },
  { checkInDayOfWeek: 1, minimumNights: 1 },
  { checkInDayOfWeek: 2, minimumNights: 1 },
  { checkInDayOfWeek: 3, minimumNights: 1 },
  { checkInDayOfWeek: 4, minimumNights: 2 },
  { checkInDayOfWeek: 5, minimumNights: 2 },
  { checkInDayOfWeek: 6, minimumNights: 2 },
];

export const DEFAULT_CLEANING_FEE_CENTS = 8000;
export const DEFAULT_INCLUDED_GUEST_COUNT = 6;
export const DEFAULT_EXTRA_GUEST_FEE_CENTS = 2500;
export const DEFAULT_MAXIMUM_GUEST_COUNT = 8;
export const PROPERTY_MAX_CAPACITY = 8;
