import { getStayNights, parseIsoDate } from "../../booking/costa-rica-dates";
import type { BookingRequestRow } from "../../supabase/database.types";
import type { GuestEmailTranslations } from "./email-i18n/types";

export function formatMoney(cents: number | null | undefined, currency: string): string {
  if (cents === null || cents === undefined) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function formatGuestDisplayDate(
  iso: string,
  locale: string,
): string {
  const { y, m, d } = parseIsoDate(iso);
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(y, m - 1, d));
}

export function formatGuestDateTime(
  iso: string,
  locale: string,
): string {
  return new Intl.DateTimeFormat(locale, {
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

export function getGuestFirstName(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return "Guest";
  return trimmed.split(/\s+/)[0] ?? "Guest";
}

export interface GuestPricingSummary {
  currency: string;
  nights: number;
  nightlyLines: Array<{ date: string; rateLabel: string }>;
  nightlySubtotal: string;
  extraGuestTotal: string | null;
  cleaningFee: string;
  totalLabel: string;
  totalValue: string;
}

export function buildGuestPricingSummary(
  row: BookingRequestRow,
  labels: GuestEmailTranslations["pricing"],
  locale: string,
  confirmed: boolean,
): GuestPricingSummary {
  const currency = row.pricing_currency ?? "USD";
  const nights = row.pricing_nights_count ?? getStayNights(row.check_in, row.check_out).length;
  const breakdown = row.pricing_nightly_breakdown ?? [];

  const nightlyLines = breakdown.map((line) => ({
    date: formatGuestDisplayDate(line.date, locale),
    rateLabel: formatMoney(line.rateCents, currency),
  }));

  return {
    currency,
    nights,
    nightlyLines,
    nightlySubtotal: formatMoney(row.pricing_nightly_subtotal_cents, currency),
    extraGuestTotal:
      row.pricing_extra_guest_total_cents && row.pricing_extra_guest_total_cents > 0
        ? formatMoney(row.pricing_extra_guest_total_cents, currency)
        : null,
    cleaningFee: formatMoney(row.pricing_cleaning_fee_cents, currency),
    totalLabel: confirmed ? labels.reservationTotal : labels.estimatedTotal,
    totalValue: formatMoney(row.pricing_estimated_total_cents, currency),
  };
}

export function buildGuestPricingTextLines(
  row: BookingRequestRow,
  labels: GuestEmailTranslations["pricing"],
  locale: string,
  confirmed: boolean,
): string[] {
  const summary = buildGuestPricingSummary(row, labels, locale, confirmed);
  const lines = [
    `${labels.reservationReference}: ${row.request_reference}`,
    `${labels.property}: Riu House`,
    `${labels.checkIn}: ${formatGuestDisplayDate(row.check_in, locale)}`,
    `${labels.checkOut}: ${formatGuestDisplayDate(row.check_out, locale)}`,
    `${labels.nights}: ${summary.nights}`,
    `${labels.adults}: ${row.adults}`,
    `${labels.children}: ${row.children}`,
  ];

  for (const line of summary.nightlyLines) {
    lines.push(`${line.date}: ${line.rateLabel} ${labels.perNight}`);
  }

  lines.push(`${labels.nightlySubtotal}: ${summary.nightlySubtotal}`);
  if (summary.extraGuestTotal) {
    lines.push(`${labels.additionalGuests}: ${summary.extraGuestTotal}`);
  }
  lines.push(`${labels.cleaningFee}: ${summary.cleaningFee}`);
  lines.push(`${summary.totalLabel}: ${summary.totalValue}`);
  lines.push(`${labels.currency}: ${summary.currency}`);

  return lines;
}
