"use client";

import { LOCALE_LABELS, LOCALES, type Locale } from "../i18n";
import { useLanguage } from "../context/LanguageContext";

type LanguageSelectorProps = {
  variant?: "desktop" | "mobile" | "mobile-header";
  onSelect?: () => void;
};

export default function LanguageSelector({
  variant = "desktop",
  onSelect,
}: LanguageSelectorProps) {
  const { locale, setLocale, t } = useLanguage();

  const baseClass =
    variant === "desktop"
      ? "hidden items-center gap-1 rounded-full border border-white/20 bg-white/10 p-1 backdrop-blur-sm lg:flex"
      : variant === "mobile-header"
        ? "flex shrink-0 items-center gap-px rounded-full border border-white/20 bg-white/10 p-px backdrop-blur-sm lg:hidden"
        : "flex items-center justify-center gap-2";

  return (
    <div
      className={baseClass}
      role="group"
      aria-label={t.language.selectorLabel}
    >
      {LOCALES.map((code) => {
        const active = locale === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => {
              setLocale(code as Locale);
              onSelect?.();
            }}
            aria-label={`${t.language.selectorLabel}: ${LOCALE_LABELS[code]}`}
            aria-pressed={active}
            className={
              variant === "desktop"
                ? `min-h-[44px] min-w-[44px] rounded-full px-3 py-2 text-xs font-medium tracking-wide transition-all duration-300 ${
                    active
                      ? "bg-white text-[#111111]"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`
                : variant === "mobile-header"
                  ? `min-h-[40px] min-w-[32px] rounded-full px-1 py-1 text-[10px] font-medium tracking-wide transition-all duration-300 max-[359px]:min-h-[36px] max-[359px]:min-w-[28px] max-[359px]:px-0.5 max-[359px]:text-[9px] sm:min-h-[44px] sm:min-w-[36px] sm:px-1.5 sm:text-[11px] ${
                      active
                        ? "bg-white text-[#111111]"
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                    }`
                  : `min-h-[44px] min-w-[44px] rounded-full px-4 py-2.5 text-sm font-medium tracking-wide transition-all duration-300 ${
                      active
                        ? "bg-white text-[#111111]"
                        : "border border-white/20 text-white/90 hover:bg-white/10"
                    }`
            }
          >
            {LOCALE_LABELS[code]}
          </button>
        );
      })}
    </div>
  );
}
