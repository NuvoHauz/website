import type { GuestEmailTranslations } from "./types";

const es: GuestEmailTranslations = {
  brandName: "NuvoHauz",
  propertyName: "Riu House",
  statusButton: "Ver estado de la solicitud",
  contactSandy: "Contactar a Sandy",
  arrivalMessage:
    "Esperamos darle la bienvenida. Sandy compartirá los detalles de check-in más cerca de su fecha de llegada.",
  pricing: {
    reservationReference: "Referencia de reserva",
    property: "Propiedad",
    checkIn: "Check-in",
    checkOut: "Checkout",
    nights: "Noches",
    adults: "Adultos",
    children: "Niños",
    guests: "Huéspedes",
    nightlySubtotal: "Subtotal por noches",
    additionalGuests: "Cargos por huéspedes adicionales",
    cleaningFee: "Tarifa de limpieza",
    estimatedTotal: "Total estimado",
    reservationTotal: "Total de la reserva",
    currency: "Moneda",
    perNight: "por noche",
    currentStatus: "Estado actual",
    holdExpires: "El hold vence",
  },
  statusLabels: {
    submitted: "Pendiente de revisión",
    pending: "Pendiente de revisión",
    under_review: "En revisión",
    approved: "Aprobada",
    approved_hold: "Aprobada — pago requerido",
    confirmed: "Confirmada",
    declined: "Rechazada",
    rejected: "Rechazada",
    cancelled: "Cancelada",
    expired: "Vencida",
  },
  events: {
    request_received: {
      subject: "Recibimos su solicitud de reserva en Riu House • {reference}",
      heading: "¡Su solicitud de reserva en Riu House fue recibida!",
      intro: [
        "Gracias por su interés en Riu House.",
        "Esta es una solicitud de reserva, no una reservación confirmada.",
        "Sandy revisará personalmente su solicitud.",
        "Recibirá otro correo cuando cambie el estado.",
      ],
    },
    approved: {
      subject: "Su solicitud en Riu House fue aprobada • Pago requerido",
      heading: "Su solicitud fue aprobada",
      intro: [
        "Buenas noticias — Sandy aprobó su solicitud de reserva en Riu House.",
        "Sus fechas quedan temporalmente retenidas mientras se coordina el pago.",
        "Esta reservación no es final hasta que se verifique el pago.",
      ],
      notFinalUntilPayment:
        "Su reservación no es final hasta que NuvoHauz verifique el pago.",
      paymentInstructionsFallback:
        "Sandy se comunicará con usted pronto con instrucciones de pago.",
    },
    confirmed: {
      subject: "¡Reservación confirmada! Su estadía en Riu House está reservada",
      heading: "Su estadía está confirmada",
      intro: [
        "Su reservación en Riu House está confirmada.",
        "Esperamos recibirle.",
      ],
    },
    declined: {
      subject: "Actualización sobre su solicitud en Riu House • {reference}",
      heading: "No pudimos aceptar su solicitud",
      intro: [
        "Gracias por su interés en Riu House.",
        "Lamentablemente, no podemos aceptar esta solicitud para las fechas seleccionadas.",
        "Si desea explorar otras fechas, Sandy estará encantada de ayudarle.",
      ],
    },
    expired: {
      subject: "Su hold de pago en Riu House ha vencido • {reference}",
      heading: "Su hold de pago venció",
      intro: [
        "El hold de aprobación para su solicitud en Riu House venció porque no se recibió el pago a tiempo.",
        "Sus fechas seleccionadas ya no están retenidas.",
      ],
      contactForNewRequest:
        "Si desea enviar una nueva solicitud, contacte a Sandy.",
    },
    cancelled: {
      subject: "Su reservación en Riu House fue cancelada • {reference}",
      heading: "Su reservación fue cancelada",
      intro: [
        "Su reservación en Riu House ha sido cancelada.",
        "Si tiene preguntas o desea reservar de nuevo, Sandy puede ayudarle.",
      ],
    },
  },
};

export default es;
