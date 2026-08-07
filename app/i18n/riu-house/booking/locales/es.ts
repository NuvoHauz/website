import type { RiuHouseBookingTranslations } from "../types";

const es: RiuHouseBookingTranslations = {
  sectionTitle: "Consultar disponibilidad y solicitar fechas",
  prototypeNotice:
    "La disponibilidad mostrada aquí utiliza datos de ejemplo del prototipo y aún no está conectada al calendario de reservas en vivo.",
  stepIndicator: "Paso {current} de {total}",
  step1Title: "Su estancia",
  step2Title: "Cuéntenos sobre su estancia",
  checkInLabel: "Fecha de llegada",
  checkOutLabel: "Fecha de salida",
  adultsLabel: "Adultos (13 años o más)",
  childrenLabel: "Niños (menores de 13 años)",
  childAgesLabel: "Edades de los niños",
  childAgesPlaceholder: "Por ejemplo: 4, 8",
  occupancyHelper:
    "Riu House aloja hasta ocho huéspedes en total. Las personas de 13 años o más deben incluirse como adultos. Sandy revisa personalmente cada solicitud.",
  requestDatesButton: "Solicitar estas fechas",
  backButton: "Atrás",
  fullNameLabel: "Nombre completo",
  emailLabel: "Correo electrónico",
  phoneLabel: "Teléfono o número de WhatsApp",
  countryLabel: "País de residencia",
  tripReasonLabel: "Motivo del viaje",
  outsideVisitorsLabel:
    "¿Alguien que no esté incluido en su reservación visitará la propiedad durante su estancia?",
  optionalMessageLabel: "¿Hay algo más que desee que sepamos?",
  optionalMessagePlaceholder: "Mensaje opcional",
  houseRulesCheckbox: "Acepto las reglas de la casa y de la piscina",
  requestNotConfirmedCheckbox:
    "Entiendo que esto es una solicitud de reserva, no una confirmación",
  requestNotice:
    "Esta es una solicitud de reserva, no una reservación instantánea. Sandy revisará personalmente su solicitud y se comunicará por correo electrónico o WhatsApp. Sus fechas se confirman solo después de la aprobación y el pago.",
  sendRequestButton: "Enviar solicitud de reserva",
  submitting: "Enviando…",
  calendarLegendAvailable: "Disponible",
  calendarLegendUnavailable: "No disponible",
  calendarLegendSelected: "Seleccionado",
  calendarLegendPast: "Pasado",
  calendarPrevMonth: "Mes anterior",
  calendarNextMonth: "Mes siguiente",
  calendarSelectCheckIn: "Seleccione su fecha de llegada",
  calendarSelectCheckOut: "Seleccione su fecha de salida",
  calendarWeekdays: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
  tripReasons: {
    vacation: "Vacaciones",
    familyVisit: "Visita familiar",
    specialOccasion: "Ocasion especial",
    businessRemote: "Negocios o trabajo remoto",
    other: "Otro",
  },
  outsideVisitorsOptions: {
    no: "No",
    yes: "Sí",
    notSure: "Aún no estoy seguro/a",
  },
  errors: {
    checkInRequired: "Seleccione una fecha de llegada.",
    checkOutRequired: "Seleccione una fecha de salida.",
    checkOutAfterCheckIn: "La salida debe ser posterior a la llegada.",
    invalidStayRange:
      "Esas fechas incluyen noches no disponibles. Elija otras fechas.",
    noAdults: "Se requiere al menos un adulto (13 años o más).",
    tooManyGuests:
      "Riu House aloja hasta ocho huéspedes en total, incluidos adultos y niños.",
    childAgesRequired: "Ingrese las edades de todos los niños.",
    childAgesCountMismatch:
      "Ingrese una edad por niño, separadas por comas.",
    childAgesEmptyValue:
      "Elimine comas extra o ingrese una edad para cada niño.",
    childAgesNonNumeric: "Use solo números enteros (por ejemplo: 4, 8).",
    childAgesDecimal: "Use solo números enteros — no se aceptan decimales.",
    childAgesOutOfRange: "Las edades de los niños deben estar entre 0 y 12.",
    childAgesMustBeAdult:
      "Un huésped de 13 años o más debe contarse como adulto. Actualice el número de adultos e ingrese solo edades de 0 a 12 para los niños.",
    fullNameRequired: "Ingrese su nombre completo.",
    emailRequired: "Ingrese su correo electrónico.",
    emailInvalid: "Ingrese un correo electrónico válido.",
    phoneRequired: "Ingrese un teléfono o número de WhatsApp.",
    countryRequired: "Ingrese su país de residencia.",
    tripReasonRequired: "Seleccione un motivo del viaje.",
    outsideVisitorsRequired: "Responda la pregunta sobre visitantes externos.",
    houseRulesRequired: "Confirme que acepta las reglas de la casa y la piscina.",
    requestAckRequired:
      "Confirme que entiende que esto es una solicitud, no una reserva confirmada.",
  },
  confirmation: {
    heading: "Su solicitud ha sido recibida.",
    referenceLabel: "Referencia",
    body1:
      "Su estancia aún no está confirmada. Sandy o el equipo de NuvoHauz revisará su solicitud.",
    body2:
      "Nos comunicaremos con usted por correo electrónico o WhatsApp con los siguientes pasos.",
    body3:
      "Sus fechas permanecen sin confirmar hasta recibir confirmación escrita de NuvoHauz.",
    startOverButton: "Enviar otra solicitud",
    backToPropertyButton: "Volver a los detalles de Riu House",
  },
};

export default es;
