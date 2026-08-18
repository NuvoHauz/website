export const GUEST_NOTIFICATION_EVENTS = [
  "request_received",
  "approved",
  "confirmed",
  "declined",
  "expired",
  "cancelled",
] as const;

export type GuestNotificationEvent = (typeof GUEST_NOTIFICATION_EVENTS)[number];

export type GuestNotificationDeliveryStatus =
  | "pending"
  | "sending"
  | "sent"
  | "failed"
  | "delivered";

export type GuestNotificationErrorCode =
  | "mail_not_configured"
  | "resend_client_unavailable"
  | "resend_send_failed"
  | "resend_rejected"
  | "status_url_unavailable";

export type GuestNotificationPublicStatus = "sent" | "failed" | "unavailable";

export function resolveGuestNotificationPublicStatus(input: {
  alreadySent: boolean;
  sendResult?: GuestNotificationSendResult;
  skippedReason?: "row_missing" | "claim_lost" | "claim_error";
}): GuestNotificationPublicStatus {
  if (input.alreadySent || input.sendResult?.ok) {
    return "sent";
  }
  if (!input.sendResult) {
    return "unavailable";
  }
  return "failed";
}

export type GuestNotificationSendResult =
  | { ok: true; providerId: string }
  | { ok: false; errorCode: GuestNotificationErrorCode; httpStatus?: number };

export interface GuestNotificationDeliveryRow {
  id: string;
  booking_request_id: string;
  event_type: GuestNotificationEvent;
  recipient_type: "guest" | "owner";
  recipient_masked: string;
  status: GuestNotificationDeliveryStatus;
  attempt_count: number;
  resend_email_id: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  last_error_code: string | null;
  claimed_at: string | null;
  created_at: string;
  updated_at: string;
}
