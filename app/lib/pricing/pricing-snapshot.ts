export function buildPricingSnapshotInsert(quote: {
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
  nightlyBreakdown: Array<{
    date: string;
    rateCents: number;
    source: string;
    holidayName?: string;
  }>;
}) {
  return {
    pricing_currency: quote.currency,
    pricing_nights_count: quote.nightsCount,
    pricing_nightly_subtotal_cents: quote.nightlySubtotalCents,
    pricing_cleaning_fee_cents: quote.cleaningFeeCents,
    pricing_estimated_total_cents: quote.estimatedTotalCents,
    pricing_nightly_breakdown: quote.nightlyBreakdown,
    pricing_calculated_at: new Date().toISOString(),
    pricing_included_guest_count: quote.includedGuestCount,
    pricing_extra_guest_count: quote.extraGuestCount,
    pricing_extra_guest_fee_cents: quote.extraGuestFeeCents,
    pricing_extra_guest_total_cents: quote.extraGuestTotalCents,
    pricing_maximum_guest_count: quote.maximumGuestCount,
    pricing_total_chargeable_guests: quote.totalChargeableGuests,
  };
}
