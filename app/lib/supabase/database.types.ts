/** Matches existing public.availability_blocks (read-only from the website). */
export interface AvailabilityBlockRow {
  id: string;
  property_slug: string;
  start_date: string;
  end_date: string;
  block_type: string;
  status: string;
  internal_note: string | null;
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
}

export interface BookingRequestRow extends BookingRequestInsert {
  id: string;
  request_reference: string;
  status: string;
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
