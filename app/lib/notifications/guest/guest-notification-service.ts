import "server-only";

import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import type { BookingRequestRow } from "../../supabase/database.types";
import {
  buildGuestStatusUrl,
  signGuestStatusToken,
} from "../../guest-status/token";
import { getBookingNotificationMailConfig, getResendClient } from "../resend-client";
import { buildGuestNotificationEmail } from "./email-templates";
import { maskGuestEmail } from "./mask-email";
import type {
  GuestNotificationDeliveryRow,
  GuestNotificationEvent,
  GuestNotificationPublicStatus,
  GuestNotificationSendResult,
} from "./types";
import { resolveGuestNotificationPublicStatus } from "./types";

const STALE_SENDING_MS = 10 * 60 * 1000;

function logSanitizedError(
  context: string,
  bookingRequestId: string,
  error: PostgrestError,
): void {
  console.error(
    context,
    bookingRequestId,
    error.code ?? "unknown",
    error.message ?? "unknown",
  );
}

function buildGuestResendIdempotencyKey(
  bookingRequestId: string,
  event: GuestNotificationEvent,
): string {
  return `riu-house-guest/${bookingRequestId}/${event}`;
}

function getSiteUrl(): string | null {
  return process.env.NUVOHAUZ_SITE_URL?.trim().replace(/\/+$/, "") || null;
}

export async function sendGuestNotificationEmail(
  row: BookingRequestRow,
  event: GuestNotificationEvent,
): Promise<GuestNotificationSendResult> {
  const mailConfig = getBookingNotificationMailConfig();
  if (!mailConfig) {
    return { ok: false, errorCode: "mail_not_configured" };
  }

  const resend = getResendClient();
  if (!resend) {
    return { ok: false, errorCode: "resend_client_unavailable" };
  }

  const siteUrl = getSiteUrl();
  if (!siteUrl) {
    return { ok: false, errorCode: "status_url_unavailable" };
  }

  const token = signGuestStatusToken(row.id, row.check_out);
  const statusUrl = token ? buildGuestStatusUrl(token) : null;
  const content = buildGuestNotificationEmail(row, event, statusUrl, siteUrl);

  const { data, error } = await resend.emails.send(
    {
      from: mailConfig.from,
      to: [content.to],
      subject: content.subject,
      html: content.html,
      text: content.text,
    },
    {
      idempotencyKey: buildGuestResendIdempotencyKey(row.id, event),
    },
  );

  if (error) {
    return {
      ok: false,
      errorCode: "resend_send_failed",
      httpStatus: typeof error.statusCode === "number" ? error.statusCode : undefined,
    };
  }

  if (!data?.id) {
    return { ok: false, errorCode: "resend_rejected" };
  }

  return { ok: true, providerId: data.id };
}

function isStaleSendingClaim(row: GuestNotificationDeliveryRow): boolean {
  if (row.status !== "sending" || !row.claimed_at) return false;
  const claimedAt = Date.parse(row.claimed_at);
  if (Number.isNaN(claimedAt)) return false;
  return Date.now() - claimedAt >= STALE_SENDING_MS;
}

async function finalizeGuestDelivery(
  supabase: SupabaseClient,
  deliveryId: string,
  claimToken: string,
  update: {
    status: "sent" | "failed";
    resend_email_id?: string | null;
    sent_at?: string;
    last_error_code?: string | null;
  },
  requestReference: string,
  httpStatus?: number,
): Promise<void> {
  const { data, error } = await supabase
    .from("booking_notification_deliveries")
    .update({
      ...update,
      updated_at: new Date().toISOString(),
    })
    .eq("id", deliveryId)
    .eq("status", "sending")
    .eq("claimed_at", claimToken)
    .select("id");

  if (error) {
    logSanitizedError("guest notification finalization skipped", deliveryId, error);
    return;
  }

  if (!data?.length) {
    console.error("guest notification finalization skipped", requestReference);
    return;
  }

  if (update.status === "failed") {
    console.error(
      "guest notification send failed",
      requestReference,
      httpStatus ?? update.last_error_code ?? "unknown",
    );
  }
}

export async function maybeSendGuestNotification(
  supabase: SupabaseClient,
  bookingRequestId: string,
  event: GuestNotificationEvent,
): Promise<GuestNotificationPublicStatus> {
  const { data: row, error: fetchError } = await supabase
    .from("booking_requests")
    .select("*")
    .eq("id", bookingRequestId)
    .maybeSingle();

  if (fetchError || !row) {
    if (fetchError) {
      logSanitizedError("guest notification row lookup failed", bookingRequestId, fetchError);
    }
    return "unavailable";
  }

  const bookingRow = row as BookingRequestRow;
  const maskedRecipient = maskGuestEmail(bookingRow.email);

  const { data: existingDelivery } = await supabase
    .from("booking_notification_deliveries")
    .select("*")
    .eq("booking_request_id", bookingRequestId)
    .eq("event_type", event)
    .eq("recipient_type", "guest")
    .maybeSingle();

  const existing = existingDelivery as GuestNotificationDeliveryRow | null;
  if (existing?.status === "sent" || existing?.status === "delivered") {
    return "sent";
  }

  if (existing?.status === "sending" && !isStaleSendingClaim(existing)) {
    return "sent";
  }

  const { data: claimedRows, error: claimError } = await supabase.rpc(
    "claim_guest_notification_delivery",
    {
      p_booking_request_id: bookingRequestId,
      p_event_type: event,
      p_recipient_type: "guest",
      p_recipient_masked: maskedRecipient,
    },
  );

  if (claimError) {
    logSanitizedError(
      "guest notification claim failed",
      bookingRow.request_reference,
      claimError,
    );
    return "unavailable";
  }

  const claimed = (claimedRows as GuestNotificationDeliveryRow[] | null)?.[0];
  if (!claimed?.claimed_at) {
    return "unavailable";
  }

  const claimToken = claimed.claimed_at;
  const sendResult = await sendGuestNotificationEmail(bookingRow, event);

  if (sendResult.ok) {
    await finalizeGuestDelivery(
      supabase,
      claimed.id,
      claimToken,
      {
        status: "sent",
        resend_email_id: sendResult.providerId,
        sent_at: new Date().toISOString(),
        last_error_code: null,
      },
      bookingRow.request_reference,
    );
    return "sent";
  }

  await finalizeGuestDelivery(
    supabase,
    claimed.id,
    claimToken,
    {
      status: "failed",
      last_error_code: sendResult.errorCode,
    },
    bookingRow.request_reference,
    sendResult.httpStatus,
  );
  return resolveGuestNotificationPublicStatus({
    alreadySent: false,
    sendResult,
  });
}

export async function retryGuestNotification(
  supabase: SupabaseClient,
  bookingRequestId: string,
  event: GuestNotificationEvent,
): Promise<"ok" | "not_found" | "not_retryable"> {
  const { data: delivery } = await supabase
    .from("booking_notification_deliveries")
    .select("*")
    .eq("booking_request_id", bookingRequestId)
    .eq("event_type", event)
    .eq("recipient_type", "guest")
    .maybeSingle();

  const row = delivery as GuestNotificationDeliveryRow | null;
  if (!row) return "not_found";
  if (row.status !== "failed") return "not_retryable";

  const { error } = await supabase
    .from("booking_notification_deliveries")
    .update({
      status: "pending",
      last_error_code: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", row.id)
    .eq("status", "failed");

  if (error) {
    logSanitizedError("guest notification retry reset failed", bookingRequestId, error);
    return "not_retryable";
  }

  await maybeSendGuestNotification(supabase, bookingRequestId, event);
  return "ok";
}

export function buildGuestStatusLinkForBooking(
  bookingId: string,
  checkOut: string,
): string | null {
  const token = signGuestStatusToken(bookingId, checkOut);
  if (!token) return null;
  return buildGuestStatusUrl(token);
}
