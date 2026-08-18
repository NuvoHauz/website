import { getGuestStatusTranslations } from "../../../i18n/guest-status";

export default function ReservationStatusNotFound() {
  const t = getGuestStatusTranslations("en");

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F6F2] px-4 py-12">
      <div className="max-w-md rounded-2xl border border-[#111111]/10 bg-white p-8 text-center">
        <p className="text-xs uppercase tracking-[0.35em] text-[#C69C6D]">
          {t.brandName}
        </p>
        <h1 className="mt-3 font-serif text-2xl font-light text-[#111111]">
          {t.notFoundTitle}
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-[#111111]/70">
          {t.notFoundBody}
        </p>
      </div>
    </div>
  );
}
