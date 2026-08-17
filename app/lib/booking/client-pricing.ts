import { getStayNights } from "./costa-rica-dates";
import type { CalendarDayAvailability } from "./use-availability-blocks";
import { calculateExtraGuestTotals } from "../pricing/guest-pricing";
import type { StayPricingQuote } from "../pricing/types";

export function calculateQuoteFromCalendarDays(
  checkIn: string,
  checkOut: string,
  calendarDays: CalendarDayAvailability[],
  cleaningFeeCents: number,
  currency: string,
  guestPricing: {
    includedGuestCount: number;
    extraGuestFeeCents: number;
    maximumGuestCount: number;
  },
  totalChargeableGuests: number,
): StayPricingQuote | null {
  const nights = getStayNights(checkIn, checkOut);
  const nightlyBreakdown = [];

  for (const night of nights) {
    const day = calendarDays.find((entry) => entry.date === night);
    if (!day || day.nightlyRateCents == null) {
      return null;
    }
    nightlyBreakdown.push({
      date: night,
      rateCents: day.nightlyRateCents,
      source: day.pricingSource ?? "weekday",
      holidayName: day.holidayName ?? undefined,
    });
  }

  const nightlySubtotalCents = nightlyBreakdown.reduce(
    (sum, line) => sum + line.rateCents,
    0,
  );

  const extraGuestResult = calculateExtraGuestTotals(
    totalChargeableGuests,
    nights.length,
    guestPricing,
  );
  if (!extraGuestResult.ok) {
    return null;
  }

  const { extraGuestCount, extraGuestTotalCents } = extraGuestResult;

  return {
    currency,
    nightsCount: nights.length,
    nightlySubtotalCents,
    includedGuestCount: guestPricing.includedGuestCount,
    totalChargeableGuests,
    extraGuestCount,
    extraGuestFeeCents: guestPricing.extraGuestFeeCents,
    extraGuestTotalCents,
    maximumGuestCount: guestPricing.maximumGuestCount,
    cleaningFeeCents,
    estimatedTotalCents:
      nightlySubtotalCents + extraGuestTotalCents + cleaningFeeCents,
    nightlyBreakdown,
    minimumNightsRequired: calendarDays.find((day) => day.date === checkIn)
      ?.minimumNightsOnCheckIn ?? 1,
  };
}
