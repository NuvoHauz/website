import "server-only";

import type { BookingRequestRow } from "../supabase/database.types";
import { parseIsoDate } from "../booking/costa-rica-dates";
import {
  formatOutsideVisitorsLabel,
  formatTripReasonLabel,
  RIU_HOUSE_PROPERTY_DISPLAY_NAME,
} from "./booking-notification-labels";
import {
  buildResendIdempotencyKey,
  getBookingNotificationMailConfig,
  getResendClient,
} from "./resend-client";

export type BookingNotificationErrorCode =
  | "mail_not_configured"
  | "resend_client_unavailable"
  | "resend_send_failed"
  | "resend_rejected";

export type BookingNotificationSendResult =
  | { ok: true; providerId: string }
  | { ok: false; errorCode: BookingNotificationErrorCode; httpStatus?: number };

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatShortDisplayDate(iso: string): string {
  const { y, m, d } = parseIsoDate(iso);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(y, m - 1, d));
}

function formatSubmissionTimestamp(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Costa_Rica",
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(iso));
}

function formatChildAges(childAges: number[] | null | undefined): string | null {
  if (!childAges || childAges.length === 0) {
    return null;
  }
  return childAges.join(", ");
}

export function buildBookingNotificationSubject(row: BookingRequestRow): string {
  const checkIn = formatShortDisplayDate(row.check_in);
  const checkOut = formatShortDisplayDate(row.check_out);
  return `New Riu House inquiry: ${row.request_reference} | ${checkIn} to ${checkOut}`;
}

type NotificationContent = {
  subject: string;
  html: string;
  text: string;
  replyTo: string;
};

function buildNotificationContent(row: BookingRequestRow): NotificationContent {
  const childAgesText = formatChildAges(row.child_ages);
  const guestMessage = row.guest_message?.trim() || "—";
  const submissionTime = formatSubmissionTimestamp(row.created_at);

  const fields: Array<{ label: string; value: string }> = [
    { label: "Request reference", value: row.request_reference },
    { label: "Property", value: RIU_HOUSE_PROPERTY_DISPLAY_NAME },
    { label: "Guest name", value: row.full_name },
    { label: "Guest email", value: row.email },
    { label: "Phone / WhatsApp", value: row.phone_whatsapp },
    { label: "Check-in", value: formatShortDisplayDate(row.check_in) },
    { label: "Check-out", value: formatShortDisplayDate(row.check_out) },
    { label: "Adults", value: String(row.adults) },
    { label: "Children", value: String(row.children) },
  ];

  if (childAgesText) {
    fields.push({ label: "Child ages", value: childAgesText });
  }

  fields.push(
    { label: "Country of residence", value: row.country_of_residence },
    { label: "Trip reason", value: formatTripReasonLabel(row.trip_reason) },
    {
      label: "Outside visitors",
      value: formatOutsideVisitorsLabel(row.outside_visitors),
    },
    { label: "Guest message", value: guestMessage },
    { label: "Submitted at", value: submissionTime },
  );

  const text = [
    "New Riu House booking inquiry",
    "",
    ...fields.map(({ label, value }) => `${label}: ${value}`),
  ].join("\n");

  const htmlRows = fields
    .map(
      ({ label, value }) =>
        `<tr><th align="left" valign="top" style="padding:6px 12px 6px 0;color:#555;font-weight:600;">${escapeHtml(label)}</th><td valign="top" style="padding:6px 0;color:#111;">${escapeHtml(value)}</td></tr>`,
    )
    .join("");

  const html = `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111;"><h1 style="font-size:20px;margin:0 0 16px;">New Riu House booking inquiry</h1><table style="border-collapse:collapse;">${htmlRows}</table></body></html>`;

  return {
    subject: buildBookingNotificationSubject(row),
    html,
    text,
    replyTo: row.email,
  };
}

export async function sendBookingNotificationEmail(
  row: BookingRequestRow,
): Promise<BookingNotificationSendResult> {
  const mailConfig = getBookingNotificationMailConfig();
  if (!mailConfig) {
    return { ok: false, errorCode: "mail_not_configured" };
  }

  const resend = getResendClient();
  if (!resend) {
    return { ok: false, errorCode: "resend_client_unavailable" };
  }

  const content = buildNotificationContent(row);
  const idempotencyKey = buildResendIdempotencyKey(row.idempotency_key);

  const { data, error } = await resend.emails.send(
    {
      from: mailConfig.from,
      to: [mailConfig.to],
      subject: content.subject,
      html: content.html,
      text: content.text,
      replyTo: content.replyTo,
    },
    {
      idempotencyKey,
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
