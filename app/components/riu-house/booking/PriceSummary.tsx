"use client";

import type { StayPricingQuote } from "../../../lib/pricing/types";
import { formatCentsAsUsd } from "../../../lib/pricing/engine";
import { formatDisplayDate } from "../../../lib/booking/costa-rica-dates";

type PriceSummaryProps = {
  quote: StayPricingQuote;
  locale: string;
  labels: {
    title: string;
    nightlyLine: string;
    nightsCount: string;
    nightlySubtotal: string;
    additionalGuests: string;
    cleaningFee: string;
    estimatedTotal: string;
    checkoutNotCharged: string;
    includedGuestsNote: string;
    extraGuestsApprovalNote: string;
  };
};

export default function PriceSummary({ quote, locale, labels }: PriceSummaryProps) {
  return (
    <div className="rounded-xl border border-[#111111]/10 bg-[#F8F6F2] px-4 py-4">
      <h4 className="font-serif text-lg font-light text-[#111111]">{labels.title}</h4>
      <ul className="mt-4 space-y-2 text-sm text-[#111111]/75">
        {quote.nightlyBreakdown.map((line) => (
          <li key={line.date} className="flex items-center justify-between gap-3">
            <span>{formatDisplayDate(line.date, locale)}</span>
            <span>{formatCentsAsUsd(line.rateCents)}</span>
          </li>
        ))}
      </ul>
      <dl className="mt-4 space-y-2 border-t border-[#111111]/10 pt-4 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt>{labels.nightsCount.replace("{count}", String(quote.nightsCount))}</dt>
          <dd>{formatCentsAsUsd(quote.nightlySubtotalCents)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3 text-[#111111]/75">
          <dt>{labels.nightlySubtotal}</dt>
          <dd>{formatCentsAsUsd(quote.nightlySubtotalCents)}</dd>
        </div>
        {quote.extraGuestCount > 0 ? (
          <div className="flex items-center justify-between gap-3 text-[#111111]/75">
            <dt>
              {labels.additionalGuests
                .replace("{count}", String(quote.extraGuestCount))
                .replace("{rate}", formatCentsAsUsd(quote.extraGuestFeeCents))
                .replace("{nights}", String(quote.nightsCount))}
            </dt>
            <dd>{formatCentsAsUsd(quote.extraGuestTotalCents)}</dd>
          </div>
        ) : null}
        <div className="flex items-center justify-between gap-3 text-[#111111]/75">
          <dt>{labels.cleaningFee}</dt>
          <dd>{formatCentsAsUsd(quote.cleaningFeeCents)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3 font-medium text-[#111111]">
          <dt>{labels.estimatedTotal}</dt>
          <dd>{formatCentsAsUsd(quote.estimatedTotalCents)}</dd>
        </div>
      </dl>
      <p className="mt-3 text-xs leading-relaxed text-[#111111]/60">
        {labels.includedGuestsNote.replace(
          "{count}",
          String(quote.includedGuestCount),
        )}
      </p>
      {quote.totalChargeableGuests > quote.includedGuestCount ? (
        <p className="mt-2 text-xs leading-relaxed text-[#111111]/60">
          {labels.extraGuestsApprovalNote}
        </p>
      ) : null}
      <p className="mt-2 text-xs leading-relaxed text-[#111111]/60">
        {labels.checkoutNotCharged}
      </p>
    </div>
  );
}

export { formatCentsAsUsd };
