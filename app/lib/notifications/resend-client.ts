import "server-only";

import { Resend } from "resend";

let resendClient: Resend | null = null;

export function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }

  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }

  return resendClient;
}

export type BookingNotificationMailConfig = {
  from: string;
  to: string;
};

export function getBookingNotificationMailConfig(): BookingNotificationMailConfig | null {
  const from = process.env.BOOKING_EMAIL_FROM;
  const to = process.env.BOOKING_NOTIFICATION_TO;
  if (!from || !to) {
    return null;
  }

  return { from, to };
}

export function buildResendIdempotencyKey(bookingIdempotencyKey: string): string {
  return `riu-house-inquiry/${bookingIdempotencyKey}`;
}
