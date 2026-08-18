import type { Locale } from "../../../../i18n/types";
import type { GuestNotificationEvent } from "../types";

export interface GuestEmailTranslations {
  propertyName: string;
  brandName: string;
  statusButton: string;
  contactSandy: string;
  arrivalMessage: string;
  pricing: {
    reservationReference: string;
    property: string;
    checkIn: string;
    checkOut: string;
    nights: string;
    adults: string;
    children: string;
    guests: string;
    nightlySubtotal: string;
    additionalGuests: string;
    cleaningFee: string;
    estimatedTotal: string;
    reservationTotal: string;
    currency: string;
    perNight: string;
    currentStatus: string;
    holdExpires: string;
  };
  statusLabels: Record<string, string>;
  events: Record<
    GuestNotificationEvent,
    {
      subject: string;
      heading: string;
      intro: string[];
      footer?: string[];
      paymentPendingNote?: string;
      paymentInstructionsFallback?: string;
      notFinalUntilPayment?: string;
      contactForNewRequest?: string;
    }
  >;
}

export type GuestEmailLocale = Locale;
