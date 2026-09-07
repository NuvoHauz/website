import type { Locale } from "../types";
import type { CabinPageTranslations } from "./types";
import de from "./locales/de";
import en from "./locales/en";
import es from "./locales/es";
import fr from "./locales/fr";

const translations: Record<Locale, CabinPageTranslations> = {
  en,
  es,
  fr,
  de,
};

export function getCabinPageTranslations(locale: Locale): CabinPageTranslations {
  return translations[locale] ?? translations.en;
}

export type { CabinPageTranslations };
