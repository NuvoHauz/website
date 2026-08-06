import type { Locale } from "../types";
import type { RiuHouseTranslations } from "./types";
import de from "./locales/de";
import en from "./locales/en";
import es from "./locales/es";
import fr from "./locales/fr";

const translations: Record<Locale, RiuHouseTranslations> = { en, es, fr, de };

export function getRiuHouseTranslations(locale: Locale): RiuHouseTranslations {
  return translations[locale];
}

export type { RiuHouseTranslations };
