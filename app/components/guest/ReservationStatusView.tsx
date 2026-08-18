import Image from "next/image";
import { formatGuestDateTime, formatGuestDisplayDate, formatMoney } from "../../lib/notifications/guest/email-pricing";
import { buildWhatsAppUrl } from "../../lib/whatsapp";
import { getGuestStatusTranslations } from "../../i18n/guest-status";
import type { GuestReservationView } from "../../lib/guest-status/types";

type ReservationStatusViewProps = {
  reservation: GuestReservationView;
};

function statusBadgeClass(status: string): string {
  switch (status) {
    case "confirmed":
      return "bg-[#1B3D32]/10 text-[#1B3D32]";
    case "approved_hold":
      return "bg-[#C69C6D]/15 text-[#8B6A3E]";
    case "declined":
    case "rejected":
    case "cancelled":
    case "expired":
      return "bg-[#111111]/8 text-[#111111]/70";
    default:
      return "bg-[#C69C6D]/15 text-[#8B6A3E]";
  }
}

export default function ReservationStatusView({
  reservation,
}: ReservationStatusViewProps) {
  const t = getGuestStatusTranslations(reservation.locale);
  const currency = reservation.currency ?? "USD";
  const confirmed = reservation.status === "confirmed";
  const statusLabel = t.statusLabels[reservation.status] ?? reservation.status;
  const statusExplanation =
    t.statusExplanation[reservation.status] ?? t.statusExplanation.pending;
  const nextStep =
    t.nextSteps[reservation.status] ?? t.nextSteps.pending;
  const whatsappHref = buildWhatsAppUrl(
    "Hi Sandy! I have a question about my Riu House reservation.",
  );

  return (
    <div className="min-h-screen bg-[#F8F6F2] px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-2xl">
        <p className="text-xs uppercase tracking-[0.35em] text-[#C69C6D]">
          {t.brandName}
        </p>
        <h1 className="mt-2 font-serif text-3xl font-light text-[#111111] sm:text-4xl">
          {t.pageTitle}
        </h1>
        <p className="mt-2 text-sm text-[#111111]/65">{t.propertyName}</p>

        <div className="mt-8 overflow-hidden rounded-2xl border border-[#111111]/10 bg-white">
          <div className="relative aspect-[16/9] w-full">
            <Image
              src="/images/properties/riu-house/hero/pool.jpg"
              alt={t.propertyName}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 672px"
              priority
            />
          </div>

          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] ${statusBadgeClass(reservation.status)}`}
              >
                {statusLabel}
              </span>
              <p className="text-sm text-[#111111]/65">
                {t.referenceLabel}:{" "}
                <span className="font-medium text-[#111111]">
                  {reservation.requestReference}
                </span>
              </p>
            </div>

            <div className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
              <Detail label={t.checkInLabel} value={formatGuestDisplayDate(reservation.checkIn, reservation.locale)} />
              <Detail label={t.checkOutLabel} value={formatGuestDisplayDate(reservation.checkOut, reservation.locale)} />
              <Detail label={t.nightsLabel} value={String(reservation.nights)} />
              <Detail
                label={t.guestsLabel}
                value={`${reservation.adults} ${t.adultsLabel}, ${reservation.children} ${t.childrenLabel}`}
              />
            </div>

            {reservation.holdExpiresAt && reservation.status === "approved_hold" ? (
              <p className="mt-4 rounded-xl bg-[#FFF9F2] px-4 py-3 text-sm text-[#8B6A3E]">
                {t.holdExpiresLabel}:{" "}
                {formatGuestDateTime(reservation.holdExpiresAt, reservation.locale)}
              </p>
            ) : null}

            <section className="mt-8 border-t border-[#111111]/10 pt-6">
              <h2 className="font-serif text-xl font-light text-[#111111]">
                {t.pricingTitle}
              </h2>
              <ul className="mt-4 space-y-2 text-sm text-[#111111]/75">
                {reservation.nightlyBreakdown.map((line) => (
                  <li key={line.date} className="flex justify-between gap-4">
                    <span>{formatGuestDisplayDate(line.date, reservation.locale)}</span>
                    <span>
                      {formatMoney(line.rateCents, currency)} {t.perNight}
                    </span>
                  </li>
                ))}
              </ul>
              <dl className="mt-4 space-y-2 border-t border-[#111111]/10 pt-4 text-sm">
                <PriceRow
                  label={t.nightlySubtotal}
                  value={formatMoney(reservation.nightlySubtotalCents, currency)}
                />
                {reservation.extraGuestTotalCents && reservation.extraGuestTotalCents > 0 ? (
                  <PriceRow
                    label={t.additionalGuests}
                    value={formatMoney(reservation.extraGuestTotalCents, currency)}
                  />
                ) : null}
                <PriceRow
                  label={t.cleaningFee}
                  value={formatMoney(reservation.cleaningFeeCents, currency)}
                />
                <PriceRow
                  label={confirmed ? t.reservationTotal : t.estimatedTotal}
                  value={formatMoney(reservation.estimatedTotalCents, currency)}
                  strong
                />
              </dl>
            </section>

            <section className="mt-8 rounded-2xl bg-[#FCFAF7] p-5">
              <h2 className="font-serif text-lg font-light text-[#111111]">
                {t.nextStepsTitle}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[#111111]/70">
                {statusExplanation}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-[#111111]/70">
                {nextStep}
              </p>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-full bg-[#C69C6D] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#b58a5c]"
              >
                {t.contactSandy}
              </a>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.18em] text-[#111111]/45">{label}</p>
      <p className="mt-1 font-medium text-[#111111]">{value}</p>
    </div>
  );
}

function PriceRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className={`flex justify-between gap-4 ${strong ? "font-semibold text-[#1B3D32]" : "text-[#111111]/75"}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
