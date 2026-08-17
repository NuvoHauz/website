import type { BlockedRange } from "../booking/blocked-ranges";
import { calculateStayPricing } from "./engine";
import { buildPricingSnapshotInsert } from "./pricing-snapshot";
import { isPricingActiveAndConsistent } from "./settings-validation";
import type { PricingConfig, StayPricingQuote } from "./types";

/** Client-supplied pricing fields are ignored by the server. */
export interface IgnoredClientPricingFields {
  pricingCurrency?: string;
  pricingNightlySubtotalCents?: number;
  pricingCleaningFeeCents?: number;
  pricingEstimatedTotalCents?: number;
  pricingExtraGuestTotalCents?: number;
  estimatedTotal?: number;
  nightlySubtotal?: number;
  cleaningFee?: number;
  extraGuestTotal?: number;
}

export type BookingPricingResolution =
  | { ok: true; pricingActive: false; snapshot: null }
  | { ok: true; pricingActive: true; snapshot: ReturnType<typeof buildPricingSnapshotInsert> }
  | {
      ok: false;
      error: "pricing_unavailable" | "minimumStayNotMet" | "invalidStayRange" | "tooManyGuests";
    };

export function resolveIdempotentBookingReference(
  existingReference: string | null | undefined,
): { action: "return_existing"; reference: string } | { action: "create" } {
  if (existingReference) {
    return { action: "return_existing", reference: existingReference };
  }
  return { action: "create" };
}

export function resolveServerBookingPricing(
  config: PricingConfig,
  checkIn: string,
  checkOut: string,
  blockedRanges: BlockedRange[],
  guestCounts: { adults: number; children: number },
  clientPricing?: IgnoredClientPricingFields,
): BookingPricingResolution {
  void clientPricing;

  if (!config.settings.active) {
    const inactiveResult = calculateStayPricing(
      checkIn,
      checkOut,
      config,
      blockedRanges,
      guestCounts,
    );
    if (!inactiveResult.ok) {
      if (inactiveResult.error.code === "minimumStayNotMet") {
        return { ok: false, error: "minimumStayNotMet" };
      }
      if (inactiveResult.error.code === "blockedDates") {
        return { ok: false, error: "invalidStayRange" };
      }
      if (inactiveResult.error.code === "tooManyGuests") {
        return { ok: false, error: "tooManyGuests" };
      }
    }
    return { ok: true, pricingActive: false, snapshot: null };
  }

  if (!isPricingActiveAndConsistent(config.settings)) {
    return { ok: false, error: "pricing_unavailable" };
  }

  const pricingResult = calculateStayPricing(
    checkIn,
    checkOut,
    config,
    blockedRanges,
    guestCounts,
  );

  if (!pricingResult.ok) {
    if (pricingResult.error.code === "minimumStayNotMet") {
      return { ok: false, error: "minimumStayNotMet" };
    }
    if (pricingResult.error.code === "blockedDates") {
      return { ok: false, error: "invalidStayRange" };
    }
    if (pricingResult.error.code === "tooManyGuests") {
      return { ok: false, error: "tooManyGuests" };
    }
    return { ok: false, error: "pricing_unavailable" };
  }

  if (pricingResult.quote.nightlyBreakdown.length === 0) {
    return { ok: false, error: "pricing_unavailable" };
  }

  return {
    ok: true,
    pricingActive: true,
    snapshot: buildPricingSnapshotInsert(pricingResult.quote),
  };
}

export function quoteDiffersFromClientAttempt(
  quote: StayPricingQuote,
  clientPricing: IgnoredClientPricingFields,
): boolean {
  return (
    (clientPricing.pricingNightlySubtotalCents != null &&
      clientPricing.pricingNightlySubtotalCents !== quote.nightlySubtotalCents) ||
    (clientPricing.pricingCleaningFeeCents != null &&
      clientPricing.pricingCleaningFeeCents !== quote.cleaningFeeCents) ||
    (clientPricing.pricingEstimatedTotalCents != null &&
      clientPricing.pricingEstimatedTotalCents !== quote.estimatedTotalCents) ||
    (clientPricing.pricingExtraGuestTotalCents != null &&
      clientPricing.pricingExtraGuestTotalCents !== quote.extraGuestTotalCents) ||
    (clientPricing.estimatedTotal != null &&
      clientPricing.estimatedTotal !== quote.estimatedTotalCents) ||
    (clientPricing.nightlySubtotal != null &&
      clientPricing.nightlySubtotal !== quote.nightlySubtotalCents) ||
    (clientPricing.cleaningFee != null &&
      clientPricing.cleaningFee !== quote.cleaningFeeCents) ||
    (clientPricing.extraGuestTotal != null &&
      clientPricing.extraGuestTotal !== quote.extraGuestTotalCents)
  );
}
