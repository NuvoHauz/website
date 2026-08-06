import type { Locale, Translations } from "./types";
import en from "./locales/en";
import es from "./locales/es";
import fr from "./locales/fr";
import de from "./locales/de";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "EN",
  es: "ES",
  fr: "FR",
  de: "DE",
};

const translations: Record<Locale, Translations> = { en, es, fr, de };

export function isLocale(value: string): value is Locale {
  return value in translations;
}

export function getTranslations(locale: Locale): Translations {
  return translations[locale];
}

export { LOCALES } from "./types";
export type { Locale, Translations, PropertyKey } from "./types";
