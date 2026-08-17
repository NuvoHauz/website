import type { PropertyPricingSettings } from "./types";

export function getTotalChargeableGuests(adults: number, children: number): number {
  return adults + children;
}

export function calculateExtraGuestTotals(
  totalChargeableGuests: number,
  occupiedNights: number,
  settings: Pick<
    PropertyPricingSettings,
    "includedGuestCount" | "extraGuestFeeCents" | "maximumGuestCount"
  >,
): { ok: true; extraGuestCount: number; extraGuestTotalCents: number } | { ok: false; code: "tooManyGuests" } {
  if (totalChargeableGuests > settings.maximumGuestCount) {
    return { ok: false, code: "tooManyGuests" };
  }

  const extraGuestCount = Math.max(0, totalChargeableGuests - settings.includedGuestCount);
  const extraGuestTotalCents =
    extraGuestCount * settings.extraGuestFeeCents * occupiedNights;

  return { ok: true, extraGuestCount, extraGuestTotalCents };
}
