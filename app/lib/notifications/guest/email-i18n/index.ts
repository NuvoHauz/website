import type { Locale } from "../../../../i18n/types";
import de from "./de";
import en from "./en";
import es from "./es";
import fr from "./fr";
import type { GuestEmailTranslations } from "./types";

const translations: Record<Locale, GuestEmailTranslations> = {
  en,
  es,
  fr,
  de,
};

export function resolveGuestEmailLocale(value: string | null | undefined): Locale {
  if (value === "es" || value === "fr" || value === "de" || value === "en") {
    return value;
  }
  return "en";
}

export function getGuestEmailTranslations(
  locale: string | null | undefined,
): GuestEmailTranslations {
  return translations[resolveGuestEmailLocale(locale)];
}

export function assertGuestEmailLocalesComplete(): void {
  for (const locale of Object.keys(translations) as Locale[]) {
    const t = translations[locale];
    for (const key of Object.keys(t.events)) {
      if (!t.events[key as keyof typeof t.events]) {
        throw new Error(`Missing guest email event ${key} for ${locale}`);
      }
    }
  }
}
