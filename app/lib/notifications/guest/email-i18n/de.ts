import type { GuestEmailTranslations } from "./types";

const de: GuestEmailTranslations = {
  brandName: "NuvoHauz",
  propertyName: "Riu House",
  statusButton: "Anfragestatus ansehen",
  contactSandy: "Sandy kontaktieren",
  arrivalMessage:
    "Wir freuen uns auf Ihren Besuch. Sandy teilt die Check-in-Details näher zu Ihrem Anreisedatum mit.",
  pricing: {
    reservationReference: "Reservierungsreferenz",
    property: "Unterkunft",
    checkIn: "Check-in",
    checkOut: "Check-out",
    nights: "Nächte",
    adults: "Erwachsene",
    children: "Kinder",
    guests: "Gäste",
    nightlySubtotal: "Zwischensumme Nächte",
    additionalGuests: "Zusatzgebühren für Gäste",
    cleaningFee: "Reinigungsgebühr",
    estimatedTotal: "Geschätzte Gesamtsumme",
    reservationTotal: "Reservierungssumme",
    currency: "Währung",
    perNight: "pro Nacht",
    currentStatus: "Aktueller Status",
    holdExpires: "Hold läuft ab",
  },
  statusLabels: {
    submitted: "Ausstehende Prüfung",
    pending: "Ausstehende Prüfung",
    under_review: "In Prüfung",
    approved: "Genehmigt",
    approved_hold: "Genehmigt — Zahlung erforderlich",
    confirmed: "Bestätigt",
    declined: "Abgelehnt",
    rejected: "Abgelehnt",
    cancelled: "Storniert",
    expired: "Abgelaufen",
  },
  events: {
    request_received: {
      subject: "Wir haben Ihre Riu House Buchungsanfrage erhalten • {reference}",
      heading: "Ihre Riu House Buchungsanfrage ist eingegangen!",
      intro: [
        "Vielen Dank für Ihr Interesse an Riu House.",
        "Dies ist eine Buchungsanfrage, keine bestätigte Reservierung.",
        "Sandy prüft Ihre Anfrage persönlich.",
        "Sie erhalten eine weitere E-Mail, wenn sich der Status ändert.",
      ],
    },
    approved: {
      subject: "Ihre Riu House Anfrage wurde genehmigt • Zahlung erforderlich",
      heading: "Ihre Anfrage wurde genehmigt",
      intro: [
        "Gute Nachrichten — Sandy hat Ihre Riu House Buchungsanfrage genehmigt.",
        "Ihre Daten sind vorübergehend reserviert, während die Zahlung organisiert wird.",
        "Diese Reservierung ist erst endgültig, wenn die Zahlung bestätigt wurde.",
      ],
      notFinalUntilPayment:
        "Ihre Reservierung ist erst endgültig, wenn NuvoHauz die Zahlung bestätigt hat.",
      paymentInstructionsFallback:
        "Sandy kontaktiert Sie in Kürze mit Zahlungsanweisungen.",
    },
    confirmed: {
      subject: "Reservierung bestätigt! Ihr Riu House Aufenthalt ist gebucht",
      heading: "Ihr Aufenthalt ist bestätigt",
      intro: [
        "Ihre Riu House Reservierung ist bestätigt.",
        "Wir freuen uns, Sie begrüßen zu dürfen.",
      ],
    },
    declined: {
      subject: "Update zu Ihrer Riu House Buchungsanfrage • {reference}",
      heading: "Ihre Anfrage konnte nicht angenommen werden",
      intro: [
        "Vielen Dank für Ihr Interesse an Riu House.",
        "Leider können wir diese Buchungsanfrage für die gewählten Daten nicht annehmen.",
        "Wenn Sie andere Daten prüfen möchten, hilft Sandy Ihnen gerne weiter.",
      ],
    },
    expired: {
      subject: "Ihr Riu House Zahlungs-Hold ist abgelaufen • {reference}",
      heading: "Ihr Zahlungs-Hold ist abgelaufen",
      intro: [
        "Der Genehmigungs-Hold für Ihre Riu House Anfrage ist abgelaufen, weil die Zahlung nicht rechtzeitig eingegangen ist.",
        "Ihre gewählten Daten sind nicht mehr reserviert.",
      ],
      contactForNewRequest:
        "Wenn Sie eine neue Anfrage stellen möchten, kontaktieren Sie Sandy.",
    },
    cancelled: {
      subject: "Ihre Riu House Reservierung wurde storniert • {reference}",
      heading: "Ihre Reservierung wurde storniert",
      intro: [
        "Ihre Riu House Reservierung wurde storniert.",
        "Bei Fragen oder für eine neue Buchung hilft Sandy Ihnen gerne weiter.",
      ],
    },
  },
};

export default de;
