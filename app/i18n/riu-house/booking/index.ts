import type { Locale } from "../../types";
import type { RiuHouseBookingTranslations } from "./types";
import de from "./locales/de";
import en from "./locales/en";
import es from "./locales/es";
import fr from "./locales/fr";

const translations: Record<Locale, RiuHouseBookingTranslations> = {
  en,
  es,
  fr,
  de,
};

export function getRiuHouseBookingTranslations(
  locale: Locale,
): RiuHouseBookingTranslations {
  return translations[locale];
}

export type { RiuHouseBookingTranslations };
