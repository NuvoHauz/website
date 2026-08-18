/** Matches existing public.availability_blocks (read-only from the website). */
export interface AvailabilityBlockRow {
  id: string;
  property_slug: string;
  start_date: string;
  end_date: string;
  block_type: string;
  status: string;
  internal_note: string | null;
  booking_request_id: string | null;
  block_expires_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/** Columns inserted by POST /api/riu-house/booking-requests. */
export interface BookingRequestInsert {
  idempotency_key: string;
  property_slug: string;
  check_in: string;
  check_out: string;
  adults: number;
  children: number;
  child_ages: number[];
  full_name: string;
  email: string;
  phone_whatsapp: string;
  country_of_residence: string;
  trip_reason: string;
  outside_visitors: string;
  guest_message: string | null;
  agreed_to_rules: boolean;
  acknowledged_request_only: boolean;
  pricing_currency?: string | null;
  pricing_nights_count?: number | null;
  pricing_nightly_subtotal_cents?: number | null;
  pricing_cleaning_fee_cents?: number | null;
  pricing_estimated_total_cents?: number | null;
  pricing_nightly_breakdown?: Array<{
    date: string;
    rateCents: number;
    source: string;
    holidayName?: string;
  }> | null;
  pricing_calculated_at?: string | null;
  pricing_included_guest_count?: number | null;
  pricing_extra_guest_count?: number | null;
  pricing_extra_guest_fee_cents?: number | null;
  pricing_extra_guest_total_cents?: number | null;
  pricing_maximum_guest_count?: number | null;
  pricing_total_chargeable_guests?: number | null;
  guest_locale?: "en" | "es" | "fr" | "de" | null;
}

export interface PropertyPricingSettingsRow {
  id: string;
  property_slug: string;
  currency: string;
  mon_tue_wed_rate_cents: number | null;
  thursday_rate_cents: number | null;
  fri_sat_rate_cents: number | null;
  sunday_rate_cents: number | null;
  cleaning_fee_cents: number;
  included_guest_count: number;
  extra_guest_fee_cents: number;
  maximum_guest_count: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PropertyMinimumStayRuleRow {
  id: string;
  property_slug: string;
  check_in_day_of_week: number;
  minimum_nights: number;
  created_at: string;
  updated_at: string;
}

export interface PropertyHolidayPricingPeriodRow {
  id: string;
  property_slug: string;
  name: string;
  start_date: string;
  end_date: string;
  adjustment_type: "fixed_rate" | "percentage";
  adjustment_value: number;
  minimum_nights: number;
  priority: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PropertyNightlyOverrideRow {
  id: string;
  property_slug: string;
  override_date: string;
  nightly_rate_cents: number;
  minimum_nights: number | null;
  internal_reason: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type BookingNotificationStatus =
  | "pending"
  | "sending"
  | "sent"
  | "failed";

export interface BookingRequestRow extends BookingRequestInsert {
  id: string;
  request_reference: string;
  status: string;
  created_at: string;
  updated_at: string;
  hold_expires_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  notification_status: BookingNotificationStatus;
  notification_sent_at: string | null;
  notification_claimed_at: string | null;
  notification_attempts: number;
  notification_last_error_code: string | null;
  notification_provider_id: string | null;
  pricing_currency: string | null;
  pricing_nights_count: number | null;
  pricing_nightly_subtotal_cents: number | null;
  pricing_cleaning_fee_cents: number | null;
  pricing_estimated_total_cents: number | null;
  pricing_nightly_breakdown: Array<{
    date: string;
    rateCents: number;
    source: string;
    holidayName?: string;
  }> | null;
  pricing_calculated_at: string | null;
  pricing_included_guest_count: number | null;
  pricing_extra_guest_count: number | null;
  pricing_extra_guest_fee_cents: number | null;
  pricing_extra_guest_total_cents: number | null;
  pricing_maximum_guest_count: number | null;
  pricing_total_chargeable_guests: number | null;
  guest_locale: "en" | "es" | "fr" | "de" | null;
}

export type GuestNotificationEventType =
  | "request_received"
  | "approved"
  | "confirmed"
  | "declined"
  | "expired"
  | "cancelled";

export type GuestNotificationDeliveryStatus =
  | "pending"
  | "sending"
  | "sent"
  | "failed"
  | "delivered";

export interface BookingNotificationDeliveryRow {
  id: string;
  booking_request_id: string;
  event_type: GuestNotificationEventType;
  recipient_type: "guest" | "owner";
  recipient_masked: string;
  status: GuestNotificationDeliveryStatus;
  attempt_count: number;
  resend_email_id: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  last_error_code: string | null;
  claimed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type BookingTripReason =
  | "vacation"
  | "family_visit"
  | "special_occasion"
  | "business_remote_work"
  | "other";

export type BookingOutsideVisitors = "no" | "yes" | "not_sure";
