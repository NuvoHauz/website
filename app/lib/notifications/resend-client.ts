import "server-only";

import { Resend } from "resend";
import {
  getBookingNotificationMailConfig,
  type BookingNotificationMailConfig,
  buildResendIdempotencyKey,
} from "./mail-config";

export {
  getBookingNotificationMailConfig,
  type BookingNotificationMailConfig,
  buildResendIdempotencyKey,
};

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
