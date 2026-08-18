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

export function getOwnerNotificationDeliveryTargets(guestEmail: string): {
  to: string | null;
  replyTo: string;
} {
  const mailConfig = getBookingNotificationMailConfig();
  return {
    to: mailConfig?.to ?? null,
    replyTo: guestEmail,
  };
}
