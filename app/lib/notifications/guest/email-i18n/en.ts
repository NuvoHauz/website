import type { GuestEmailTranslations } from "./types";

const en: GuestEmailTranslations = {
  brandName: "NuvoHauz",
  propertyName: "Riu House",
  statusButton: "View request status",
  contactSandy: "Contact Sandy",
  arrivalMessage:
    "We look forward to welcoming you. Sandy will share check-in details closer to your arrival date.",
  pricing: {
    reservationReference: "Reservation reference",
    property: "Property",
    checkIn: "Check-in",
    checkOut: "Checkout",
    nights: "Nights",
    adults: "Adults",
    children: "Children",
    guests: "Guests",
    nightlySubtotal: "Nightly subtotal",
    additionalGuests: "Additional guest charges",
    cleaningFee: "Cleaning fee",
    estimatedTotal: "Estimated total",
    reservationTotal: "Reservation total",
    currency: "Currency",
    perNight: "per night",
    currentStatus: "Current status",
    holdExpires: "Hold expires",
  },
  statusLabels: {
    submitted: "Pending review",
    pending: "Pending review",
    under_review: "Under review",
    approved: "Approved",
    approved_hold: "Approved — payment required",
    confirmed: "Confirmed",
    declined: "Declined",
    rejected: "Declined",
    cancelled: "Cancelled",
    expired: "Expired",
  },
  events: {
    request_received: {
      subject: "We received your Riu House booking request • {reference}",
      heading: "Your Riu House booking request is in!",
      intro: [
        "Thank you for your interest in Riu House.",
        "This is a booking request, not a confirmed reservation.",
        "Sandy will personally review your request.",
        "You will receive another email when the status changes.",
      ],
    },
    approved: {
      subject: "Your Riu House request was approved • Payment required",
      heading: "Your request was approved",
      intro: [
        "Great news — Sandy approved your Riu House booking request.",
        "Your dates are temporarily held while payment is arranged.",
        "This reservation is not final until payment is verified.",
      ],
      notFinalUntilPayment:
        "Your reservation is not final until NuvoHauz verifies payment.",
      paymentInstructionsFallback:
        "Sandy will contact you shortly with payment instructions.",
    },
    confirmed: {
      subject: "Reservation confirmed! Your Riu House stay is booked",
      heading: "Your stay is confirmed",
      intro: [
        "Your Riu House reservation is confirmed.",
        "We are looking forward to hosting you.",
      ],
    },
    declined: {
      subject: "Update on your Riu House booking request • {reference}",
      heading: "Your request could not be accepted",
      intro: [
        "Thank you for your interest in Riu House.",
        "Unfortunately, we are unable to accept this booking request for your selected dates.",
        "If you would like to explore other dates, Sandy will be happy to help.",
      ],
    },
    expired: {
      subject: "Your Riu House payment hold has expired • {reference}",
      heading: "Your payment hold expired",
      intro: [
        "The approval hold for your Riu House request has expired because payment was not received in time.",
        "Your selected dates are no longer held.",
      ],
      contactForNewRequest:
        "If you would like to submit a new request, please contact Sandy.",
    },
    cancelled: {
      subject: "Your Riu House reservation was cancelled • {reference}",
      heading: "Your reservation was cancelled",
      intro: [
        "Your Riu House reservation has been cancelled.",
        "If you have questions or would like to book again, Sandy is here to help.",
      ],
    },
  },
};

export default en;
