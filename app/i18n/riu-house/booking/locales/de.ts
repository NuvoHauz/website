import type { RiuHouseBookingTranslations } from "../types";

const de: RiuHouseBookingTranslations = {
  sectionTitle: "Verfügbarkeit prüfen und Daten anfragen",
  prototypeNotice:
    "Die hier angezeigte Verfügbarkeit entspricht dem live Reservierungskalender. Jede Anfrage wird von Sandy persönlich geprüft, bevor Daten bestätigt werden.",
  stepIndicator: "Schritt {current} von {total}",
  step1Title: "Ihr Aufenthalt",
  step2Title: "Erzählen Sie uns von Ihrem Aufenthalt",
  checkInLabel: "Anreisedatum",
  checkOutLabel: "Abreisedatum",
  adultsLabel: "Erwachsene (13 Jahre und älter)",
  childrenLabel: "Kinder (unter 13 Jahren)",
  childAgesLabel: "Alter der Kinder",
  childAgesPlaceholder: "Zum Beispiel: 4, 8",
  occupancyHelper:
    "Riu House bietet Platz für bis zu acht Gäste insgesamt. Gäste ab 13 Jahren zählen als Erwachsene. Jede Anfrage wird persönlich von Sandy geprüft.",
  requestDatesButton: "Diese Daten anfragen",
  backButton: "Zurück",
  fullNameLabel: "Vollständiger Name",
  emailLabel: "E-Mail-Adresse",
  phoneLabel: "Telefon- oder WhatsApp-Nummer",
  countryLabel: "Wohnsitzland",
  tripReasonLabel: "Grund der Reise",
  outsideVisitorsLabel:
    "Wird jemand, der nicht in Ihrer Reservierung enthalten ist, die Unterkunft während Ihres Aufenthalts besuchen?",
  optionalMessageLabel: "Gibt es noch etwas, das wir wissen sollten?",
  optionalMessagePlaceholder: "Optionale Nachricht",
  houseRulesCheckbox: "Ich stimme den Haus- und Poolregeln zu",
  requestNotConfirmedCheckbox:
    "Ich verstehe, dass dies eine Buchungsanfrage und keine bestätigte Reservierung ist",
  requestNotice:
    "Dies ist eine Buchungsanfrage, keine Sofortbuchung. Sandy prüft Ihre Anfrage persönlich und kontaktiert Sie per E-Mail oder WhatsApp. Ihre Daten sind erst nach Genehmigung und Zahlung bestätigt.",
  sendRequestButton: "Buchungsanfrage senden",
  submitting: "Wird gesendet…",
  calendarLoading: "Verfügbarkeit wird geladen…",
  availabilityLoadError:
    "Die Verfügbarkeit konnte gerade nicht geladen werden. Bitte versuchen Sie es in Kürze erneut.",
  availabilityRetryButton: "Erneut versuchen",
  calendarLegendAvailable: "Verfügbar",
  calendarLegendUnavailable: "Nicht verfügbar",
  calendarLegendSelected: "Ausgewählt",
  calendarLegendPast: "Vergangen",
  calendarPrevMonth: "Vorheriger Monat",
  calendarNextMonth: "Nächster Monat",
  calendarSelectCheckIn: "Wählen Sie Ihr Anreisedatum",
  calendarSelectCheckOut: "Wählen Sie Ihr Abreisedatum",
  calendarWeekdays: ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"],
  tripReasons: {
    vacation: "Urlaub",
    familyVisit: "Familienbesuch",
    specialOccasion: "Besonderer Anlass",
    businessRemote: "Geschäfts- oder Remote-Reise",
    other: "Sonstiges",
  },
  outsideVisitorsOptions: {
    no: "Nein",
    yes: "Ja",
    notSure: "Noch unsicher",
  },
  errors: {
    checkInRequired: "Bitte wählen Sie ein Anreisedatum.",
    checkOutRequired: "Bitte wählen Sie ein Abreisedatum.",
    checkOutAfterCheckIn: "Das Abreisedatum muss nach dem Anreisedatum liegen.",
    invalidStayRange:
      "Diese Daten enthalten nicht verfügbare Nächte. Bitte wählen Sie andere Daten.",
    noAdults: "Mindestens ein Erwachsener (13 Jahre oder älter) ist erforderlich.",
    tooManyGuests:
      "Riu House bietet Platz für bis zu acht Gäste insgesamt, einschließlich Erwachsener und Kinder.",
    childAgesRequired: "Bitte geben Sie das Alter aller Kinder an.",
    childAgesCountMismatch:
      "Geben Sie ein Alter pro Kind ein, durch Kommas getrennt.",
    childAgesEmptyValue:
      "Entfernen Sie überzählige Kommas oder geben Sie für jedes Kind ein Alter an.",
    childAgesNonNumeric: "Verwenden Sie nur ganze Zahlen (z. B.: 4, 8).",
    childAgesDecimal: "Verwenden Sie nur ganze Zahlen — Dezimalzahlen sind nicht erlaubt.",
    childAgesOutOfRange: "Das Alter der Kinder muss zwischen 0 und 12 liegen.",
    childAgesMustBeAdult:
      "Ein Gast ab 13 Jahren muss als Erwachsener gezählt werden. Bitte aktualisieren Sie die Erwachsenenzahl und geben Sie nur Alter 0–12 für Kinder ein.",
    fullNameRequired: "Bitte geben Sie Ihren vollständigen Namen ein.",
    emailRequired: "Bitte geben Sie Ihre E-Mail-Adresse ein.",
    emailInvalid: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
    phoneRequired: "Bitte geben Sie eine Telefon- oder WhatsApp-Nummer ein.",
    countryRequired: "Bitte geben Sie Ihr Wohnsitzland ein.",
    tripReasonRequired: "Bitte wählen Sie einen Reisegrund.",
    outsideVisitorsRequired: "Bitte beantworten Sie die Frage zu externen Besuchern.",
    houseRulesRequired: "Bitte bestätigen Sie die Haus- und Poolregeln.",
    requestAckRequired:
      "Bitte bestätigen Sie, dass Sie verstehen, dass dies eine Anfrage und keine bestätigte Reservierung ist.",
    submitFailed:
      "Ihre Anfrage konnte gerade nicht gesendet werden. Bitte versuchen Sie es in Kürze erneut.",
    availabilityConflict:
      "Diese Daten sind nicht mehr verfügbar. Bitte wählen Sie andere Daten und versuchen Sie es erneut.",
  },
  confirmation: {
    heading: "Ihre Anfrage wurde empfangen.",
    referenceLabel: "Referenz",
    body1:
      "Ihr Aufenthalt ist noch nicht bestätigt. Sandy oder das NuvoHauz-Team prüft Ihre Anfrage.",
    body2:
      "Wir kontaktieren Sie per E-Mail oder WhatsApp mit den nächsten Schritten.",
    body3:
      "Ihre Daten bleiben unbestätigt, bis Sie eine schriftliche Bestätigung von NuvoHauz erhalten.",
    startOverButton: "Weitere Anfrage senden",
    backToPropertyButton: "Zurück zu den Riu House-Details",
  },
};

export default de;
