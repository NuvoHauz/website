import type { Locale } from "../../i18n/types";

export type GuestBookingStatus =
  | "submitted"
  | "pending"
  | "under_review"
  | "approved"
  | "approved_hold"
  | "confirmed"
  | "declined"
  | "rejected"
  | "cancelled"
  | "expired";

export type GuestStatusLocale = Locale;

export interface GuestPricingNightLine {
  date: string;
  rateCents: number;
}

export interface GuestReservationView {
  requestReference: string;
  status: GuestBookingStatus;
  checkIn: string;
  checkOut: string;
  nights: number;
  adults: number;
  children: number;
  guestFirstName: string;
  currency: string | null;
  nightlyBreakdown: GuestPricingNightLine[];
  nightlySubtotalCents: number | null;
  extraGuestTotalCents: number | null;
  cleaningFeeCents: number | null;
  estimatedTotalCents: number | null;
  holdExpiresAt: string | null;
  locale: GuestStatusLocale;
}
