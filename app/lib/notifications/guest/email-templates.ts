import type { BookingRequestRow } from "../../supabase/database.types";
import { escapeHtml } from "../email-text";
import { getGuestEmailTranslations } from "./email-i18n";
import {
  buildGuestPricingSummary,
  buildGuestPricingTextLines,
  formatGuestDateTime,
  formatGuestDisplayDate,
  getGuestFirstName,
} from "./email-pricing";
import { getApprovedPaymentInstructionsContent } from "./payment-instructions";
import type { GuestNotificationEvent } from "./types";

const RIU_HOUSE_EMAIL_IMAGE_PATH = "/images/properties/riu-house/hero/pool.jpg";
const BRAND_GOLD = "#C69C6D";
const BRAND_GREEN = "#1B3D32";

export interface GuestEmailContent {
  subject: string;
  html: string;
  text: string;
  to: string;
}

function interpolate(template: string, reference: string): string {
  return template.replaceAll("{reference}", reference);
}

function buildSummaryHtml(
  row: BookingRequestRow,
  locale: string,
  confirmed: boolean,
): string {
  const t = getGuestEmailTranslations(locale);
  const summary = buildGuestPricingSummary(row, t.pricing, locale, confirmed);
  const statusLabel = t.statusLabels[row.status] ?? row.status;

  const nightlyRows = summary.nightlyLines
    .map(
      (line) =>
        `<tr><td style="padding:4px 0;color:#444;">${escapeHtml(line.date)}</td><td align="right" style="padding:4px 0;color:#111;">${escapeHtml(line.rateLabel)}</td></tr>`,
    )
    .join("");

  const extraGuestRow = summary.extraGuestTotal
    ? `<tr><td style="padding:6px 0;color:#444;">${escapeHtml(t.pricing.additionalGuests)}</td><td align="right" style="padding:6px 0;color:#111;">${escapeHtml(summary.extraGuestTotal)}</td></tr>`
    : "";

  const holdRow =
    row.hold_expires_at && row.status === "approved_hold"
      ? `<p style="margin:12px 0 0;color:#444;"><strong>${escapeHtml(t.pricing.holdExpires)}:</strong> ${escapeHtml(formatGuestDateTime(row.hold_expires_at, locale))}</p>`
      : "";

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;border-top:1px solid #eee;border-bottom:1px solid #eee;">
      <tr><td style="padding:16px 0 8px;font-size:13px;text-transform:uppercase;letter-spacing:0.12em;color:${BRAND_GOLD};">Reservation summary</td></tr>
      <tr><td style="padding:0 0 8px;">
        <p style="margin:0 0 8px;color:#111;"><strong>${escapeHtml(t.pricing.reservationReference)}:</strong> ${escapeHtml(row.request_reference)}</p>
        <p style="margin:0 0 8px;color:#111;"><strong>${escapeHtml(t.pricing.property)}:</strong> ${escapeHtml(t.propertyName)}</p>
        <p style="margin:0 0 8px;color:#111;"><strong>${escapeHtml(t.pricing.checkIn)}:</strong> ${escapeHtml(formatGuestDisplayDate(row.check_in, locale))}</p>
        <p style="margin:0 0 8px;color:#111;"><strong>${escapeHtml(t.pricing.checkOut)}:</strong> ${escapeHtml(formatGuestDisplayDate(row.check_out, locale))}</p>
        <p style="margin:0 0 8px;color:#111;"><strong>${escapeHtml(t.pricing.nights)}:</strong> ${summary.nights}</p>
        <p style="margin:0 0 8px;color:#111;"><strong>${escapeHtml(t.pricing.guests)}:</strong> ${row.adults} ${escapeHtml(t.pricing.adults).toLowerCase()}, ${row.children} ${escapeHtml(t.pricing.children).toLowerCase()}</p>
        <p style="margin:0 0 8px;color:#111;"><strong>${escapeHtml(t.pricing.currentStatus)}:</strong> ${escapeHtml(statusLabel)}</p>
        ${holdRow}
      </td></tr>
      <tr><td style="padding:8px 0 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${nightlyRows}</table>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;border-top:1px solid #eee;">
          <tr><td style="padding:6px 0;color:#444;">${escapeHtml(t.pricing.nightlySubtotal)}</td><td align="right" style="padding:6px 0;color:#111;">${escapeHtml(summary.nightlySubtotal)}</td></tr>
          ${extraGuestRow}
          <tr><td style="padding:6px 0;color:#444;">${escapeHtml(t.pricing.cleaningFee)}</td><td align="right" style="padding:6px 0;color:#111;">${escapeHtml(summary.cleaningFee)}</td></tr>
          <tr><td style="padding:10px 0 0;font-weight:700;color:#111;">${escapeHtml(summary.totalLabel)}</td><td align="right" style="padding:10px 0 0;font-weight:700;color:${BRAND_GREEN};">${escapeHtml(summary.totalValue)}</td></tr>
        </table>
      </td></tr>
    </table>`;
}

function buildEmailShell(input: {
  heading: string;
  bodyHtml: string;
  statusUrl: string | null;
  locale: string;
  showHeroImage: boolean;
  siteUrl: string;
}): string {
  const t = getGuestEmailTranslations(input.locale);
  const heroBlock = input.showHeroImage
    ? `<img src="${escapeHtml(`${input.siteUrl}${RIU_HOUSE_EMAIL_IMAGE_PATH}`)}" alt="${escapeHtml(t.propertyName)}" width="560" style="display:block;width:100%;max-width:560px;height:auto;border-radius:12px;margin:0 0 20px;" />`
    : "";

  const ctaBlock = input.statusUrl
    ? `<p style="margin:28px 0 0;text-align:center;">
        <a href="${escapeHtml(input.statusUrl)}" style="display:inline-block;background:${BRAND_GOLD};color:#ffffff;text-decoration:none;font-weight:600;padding:14px 28px;border-radius:999px;">${escapeHtml(t.statusButton)}</a>
      </p>`
    : "";

  return `<!DOCTYPE html>
<html lang="${escapeHtml(input.locale)}">
<body style="margin:0;padding:0;background:#f8f6f2;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f6f2;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;padding:28px 24px;font-family:Georgia,'Times New Roman',serif;color:#111111;">
        <tr><td>
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.35em;text-transform:uppercase;color:${BRAND_GOLD};">${escapeHtml(t.brandName)}</p>
          ${heroBlock}
          <h1 style="margin:0 0 16px;font-size:28px;font-weight:400;line-height:1.25;color:#111111;">${escapeHtml(input.heading)}</h1>
          ${input.bodyHtml}
          ${ctaBlock}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function buildGuestNotificationEmail(
  row: BookingRequestRow,
  event: GuestNotificationEvent,
  statusUrl: string | null,
  siteUrl: string,
): GuestEmailContent {
  const locale = row.guest_locale ?? "en";
  const t = getGuestEmailTranslations(locale);
  const eventCopy = t.events[event];
  const confirmed = event === "confirmed";
  const firstName = getGuestFirstName(row.full_name);

  const introParagraphs = eventCopy.intro
    .map((paragraph) => `<p style="margin:0 0 12px;color:#444;line-height:1.6;">${escapeHtml(paragraph)}</p>`)
    .join("");

  let extraHtml = "";
  let extraText: string[] = [];

  if (event === "approved") {
    const paymentInstructions = getApprovedPaymentInstructionsContent();
    if (paymentInstructions) {
      extraHtml = paymentInstructions.html;
      extraText = ["Payment instructions:", paymentInstructions.text];
    } else if (eventCopy.paymentInstructionsFallback) {
      extraHtml = `<p style="margin:12px 0 0;color:#444;line-height:1.6;">${escapeHtml(eventCopy.paymentInstructionsFallback)}</p>`;
      extraText = [eventCopy.paymentInstructionsFallback];
    }
    if (eventCopy.notFinalUntilPayment) {
      extraHtml += `<p style="margin:12px 0 0;color:#444;line-height:1.6;"><strong>${escapeHtml(eventCopy.notFinalUntilPayment)}</strong></p>`;
      extraText.push(eventCopy.notFinalUntilPayment);
    }
    if (row.hold_expires_at) {
      const holdLine = `${t.pricing.holdExpires}: ${formatGuestDateTime(row.hold_expires_at, locale)}`;
      extraHtml += `<p style="margin:12px 0 0;color:#444;line-height:1.6;">${escapeHtml(holdLine)}</p>`;
      extraText.push(holdLine);
    }
  }

  if (event === "confirmed") {
    extraHtml = `<p style="margin:12px 0 0;color:#444;line-height:1.6;">${escapeHtml(`${firstName}, ${t.arrivalMessage}`)}</p>`;
    extraText = [`${firstName}, ${t.arrivalMessage}`];
  }

  if (event === "expired" && eventCopy.contactForNewRequest) {
    extraHtml = `<p style="margin:12px 0 0;color:#444;line-height:1.6;">${escapeHtml(eventCopy.contactForNewRequest)}</p>`;
    extraText = [eventCopy.contactForNewRequest];
  }

  const bodyHtml = `${introParagraphs}${extraHtml}${buildSummaryHtml(row, locale, confirmed)}`;
  const html = buildEmailShell({
    heading: event === "confirmed" ? `${firstName}, ${eventCopy.heading}` : eventCopy.heading,
    bodyHtml,
    statusUrl,
    locale,
    showHeroImage: event === "confirmed",
    siteUrl,
  });

  const textLines = [
    eventCopy.heading,
    "",
    ...eventCopy.intro,
    ...extraText,
    "",
    ...buildGuestPricingTextLines(row, t.pricing, locale, confirmed),
  ];

  if (statusUrl) {
    textLines.push("", t.statusButton, statusUrl);
  }

  return {
    subject: interpolate(eventCopy.subject, row.request_reference),
    html,
    text: textLines.join("\n"),
    to: row.email,
  };
}
