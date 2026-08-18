import type { Locale } from "../types";
import de from "./locales/de";
import en from "./locales/en";
import es from "./locales/es";
import fr from "./locales/fr";
import type { GuestStatusTranslations } from "./types";

const translations: Record<Locale, GuestStatusTranslations> = {
  en,
  es,
  fr,
  de,
};

export function getGuestStatusTranslations(locale: Locale): GuestStatusTranslations {
  return translations[locale];
}

export function assertGuestStatusLocalesComplete(): void {
  for (const locale of Object.keys(translations) as Locale[]) {
    const t = translations[locale];
    for (const key of [
      "submitted",
      "approved_hold",
      "confirmed",
      "declined",
      "cancelled",
      "expired",
    ]) {
      if (!t.statusLabels[key] || !t.statusExplanation[key] || !t.nextSteps[key]) {
        throw new Error(`Missing guest status key ${key} for ${locale}`);
      }
    }
  }
}
