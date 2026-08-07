"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { useLanguage } from "../../context/LanguageContext";
import { getRiuHouseBookingTranslations } from "../../i18n/riu-house/booking";

const BookingRequestWizard = dynamic(() => import("./booking/BookingRequestWizard"), {
  ssr: false,
  loading: () => (
    <div
      className="h-64 animate-pulse rounded-xl bg-[#111111]/5"
      aria-busy="true"
      aria-live="polite"
    />
  ),
});

export default function RiuHouseBookingSection() {
  const { locale } = useLanguage();
  const bt = useMemo(() => getRiuHouseBookingTranslations(locale), [locale]);

  return (
    <section
      id="booking"
      aria-labelledby="riu-house-booking-heading"
      className="bg-white px-4 py-14 sm:px-6 sm:py-20 lg:px-10"
    >
      <div className="mx-auto max-w-4xl">
        <h2
          id="riu-house-booking-heading"
          className="font-serif text-2xl font-light tracking-tight text-[#111111] sm:text-3xl md:text-4xl"
        >
          {bt.sectionTitle}
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#111111]/65">
          {bt.prototypeNotice}
        </p>
        <div className="mt-8">
          <BookingRequestWizard bt={bt} locale={locale} />
        </div>
      </div>
    </section>
  );
}
