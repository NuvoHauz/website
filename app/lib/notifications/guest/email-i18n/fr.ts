import type { GuestEmailTranslations } from "./types";

const fr: GuestEmailTranslations = {
  brandName: "NuvoHauz",
  propertyName: "Riu House",
  statusButton: "Voir le statut de la demande",
  contactSandy: "Contacter Sandy",
  arrivalMessage:
    "Nous avons hâte de vous accueillir. Sandy partagera les détails d'arrivée plus près de votre date de séjour.",
  pricing: {
    reservationReference: "Référence de réservation",
    property: "Propriété",
    checkIn: "Arrivée",
    checkOut: "Départ",
    nights: "Nuits",
    adults: "Adultes",
    children: "Enfants",
    guests: "Voyageurs",
    nightlySubtotal: "Sous-total des nuits",
    additionalGuests: "Frais voyageurs supplémentaires",
    cleaningFee: "Frais de ménage",
    estimatedTotal: "Total estimé",
    reservationTotal: "Total de la réservation",
    currency: "Devise",
    perNight: "par nuit",
    currentStatus: "Statut actuel",
    holdExpires: "Expiration du hold",
  },
  statusLabels: {
    submitted: "En attente d'examen",
    pending: "En attente d'examen",
    under_review: "En cours d'examen",
    approved: "Approuvée",
    approved_hold: "Approuvée — paiement requis",
    confirmed: "Confirmée",
    declined: "Refusée",
    rejected: "Refusée",
    cancelled: "Annulée",
    expired: "Expirée",
  },
  events: {
    request_received: {
      subject: "Nous avons reçu votre demande Riu House • {reference}",
      heading: "Votre demande de réservation Riu House est bien reçue !",
      intro: [
        "Merci pour votre intérêt pour Riu House.",
        "Il s'agit d'une demande de réservation, et non d'une réservation confirmée.",
        "Sandy examinera personnellement votre demande.",
        "Vous recevrez un autre e-mail lorsque le statut changera.",
      ],
    },
    approved: {
      subject: "Votre demande Riu House a été approuvée • Paiement requis",
      heading: "Votre demande a été approuvée",
      intro: [
        "Bonne nouvelle — Sandy a approuvé votre demande Riu House.",
        "Vos dates sont temporairement retenues pendant l'organisation du paiement.",
        "Cette réservation n'est pas définitive tant que le paiement n'est pas vérifié.",
      ],
      notFinalUntilPayment:
        "Votre réservation n'est pas définitive tant que NuvoHauz n'a pas vérifié le paiement.",
      paymentInstructionsFallback:
        "Sandy vous contactera prochainement avec les instructions de paiement.",
    },
    confirmed: {
      subject: "Réservation confirmée ! Votre séjour à Riu House est réservé",
      heading: "Votre séjour est confirmé",
      intro: [
        "Votre réservation Riu House est confirmée.",
        "Nous avons hâte de vous accueillir.",
      ],
    },
    declined: {
      subject: "Mise à jour de votre demande Riu House • {reference}",
      heading: "Votre demande n'a pas pu être acceptée",
      intro: [
        "Merci pour votre intérêt pour Riu House.",
        "Malheureusement, nous ne pouvons pas accepter cette demande pour les dates sélectionnées.",
        "Si vous souhaitez explorer d'autres dates, Sandy se fera un plaisir de vous aider.",
      ],
    },
    expired: {
      subject: "Votre hold de paiement Riu House a expiré • {reference}",
      heading: "Votre hold de paiement a expiré",
      intro: [
        "Le hold d'approbation pour votre demande Riu House a expiré car le paiement n'a pas été reçu à temps.",
        "Vos dates sélectionnées ne sont plus retenues.",
      ],
      contactForNewRequest:
        "Si vous souhaitez soumettre une nouvelle demande, contactez Sandy.",
    },
    cancelled: {
      subject: "Votre réservation Riu House a été annulée • {reference}",
      heading: "Votre réservation a été annulée",
      intro: [
        "Votre réservation Riu House a été annulée.",
        "Si vous avez des questions ou souhaitez réserver à nouveau, Sandy peut vous aider.",
      ],
    },
  },
};

export default fr;
