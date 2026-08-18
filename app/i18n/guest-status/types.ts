import type { Locale } from "../types";

export interface GuestStatusTranslations {
  pageTitle: string;
  brandName: string;
  propertyName: string;
  referenceLabel: string;
  statusLabel: string;
  checkInLabel: string;
  checkOutLabel: string;
  nightsLabel: string;
  guestsLabel: string;
  adultsLabel: string;
  childrenLabel: string;
  pricingTitle: string;
  nightlySubtotal: string;
  additionalGuests: string;
  cleaningFee: string;
  estimatedTotal: string;
  reservationTotal: string;
  perNight: string;
  holdExpiresLabel: string;
  nextStepsTitle: string;
  contactSandy: string;
  notFoundTitle: string;
  notFoundBody: string;
  statusExplanation: Record<string, string>;
  nextSteps: Record<string, string>;
  statusLabels: Record<string, string>;
}

export type { Locale };
