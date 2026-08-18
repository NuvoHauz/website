import "server-only";

import { getStayNights } from "../booking/costa-rica-dates";
import type { BookingRequestRow } from "../supabase/database.types";
import { resolveGuestEmailLocale } from "../notifications/guest/email-i18n";
import type { GuestReservationView } from "./types";

export function mapBookingRowToGuestView(row: BookingRequestRow): GuestReservationView {
  const locale = resolveGuestEmailLocale(row.guest_locale);
  const firstName = row.full_name.trim().split(/\s+/)[0] || "Guest";

  return {
    requestReference: row.request_reference,
    status: row.status as GuestReservationView["status"],
    checkIn: row.check_in,
    checkOut: row.check_out,
    nights: row.pricing_nights_count ?? getStayNights(row.check_in, row.check_out).length,
    adults: row.adults,
    children: row.children,
    guestFirstName: firstName,
    currency: row.pricing_currency,
    nightlyBreakdown: (row.pricing_nightly_breakdown ?? []).map((line) => ({
      date: line.date,
      rateCents: line.rateCents,
    })),
    nightlySubtotalCents: row.pricing_nightly_subtotal_cents,
    extraGuestTotalCents: row.pricing_extra_guest_total_cents,
    cleaningFeeCents: row.pricing_cleaning_fee_cents,
    estimatedTotalCents: row.pricing_estimated_total_cents,
    holdExpiresAt: row.hold_expires_at,
    locale,
  };
}

export async function loadGuestReservationById(
  supabase: { from: (table: string) => unknown },
  bookingId: string,
): Promise<GuestReservationView | null> {
  const client = supabase as {
    from: (table: string) => {
      select: (columns: string) => {
        eq: (column: string, value: string) => {
          maybeSingle: () => Promise<{
            data: BookingRequestRow | null;
            error: { code?: string; message?: string } | null;
          }>;
        };
      };
    };
  };

  const { data, error } = await client
    .from("booking_requests")
    .select("*")
    .eq("id", bookingId)
    .maybeSingle();

  if (error || !data) return null;
  return mapBookingRowToGuestView(data);
}
