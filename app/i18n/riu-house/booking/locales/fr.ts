import type { RiuHouseBookingTranslations } from "../types";

const fr: RiuHouseBookingTranslations = {
  sectionTitle: "Vérifier les disponibilités et demander des dates",
  prototypeNotice:
    "Les disponibilités affichées ici reflètent le calendrier de réservation en direct. Chaque demande est examinée personnellement par Sandy avant confirmation des dates.",
  stepIndicator: "Étape {current} sur {total}",
  step1Title: "Votre séjour",
  step2Title: "Parlez-nous de votre séjour",
  checkInLabel: "Date d'arrivée",
  checkOutLabel: "Date de départ",
  adultsLabel: "Adultes (13 ans et plus)",
  childrenLabel: "Enfants (moins de 13 ans)",
  childAgesLabel: "Âges des enfants",
  childAgesPlaceholder: "Par exemple : 4, 8",
  occupancyHelper:
    "Riu House accueille jusqu'à huit voyageurs au total. Les personnes de 13 ans et plus doivent être comptées comme adultes. Chaque demande est examinée personnellement par Sandy.",
  requestDatesButton: "Demander ces dates",
  backButton: "Retour",
  fullNameLabel: "Nom complet",
  emailLabel: "Adresse e-mail",
  phoneLabel: "Téléphone ou numéro WhatsApp",
  countryLabel: "Pays de résidence",
  tripReasonLabel: "Motif du séjour",
  outsideVisitorsLabel:
    "Est-ce que des personnes non incluses dans votre réservation visiteront la propriété pendant votre séjour ?",
  optionalMessageLabel: "Souhaitez-vous nous communiquer autre chose ?",
  optionalMessagePlaceholder: "Message facultatif",
  houseRulesCheckbox: "J'accepte le règlement intérieur et les règles de la piscine",
  requestNotConfirmedCheckbox:
    "Je comprends qu'il s'agit d'une demande de réservation, et non d'une confirmation",
  requestNotice:
    "Il s'agit d'une demande de réservation, et non d'une réservation instantanée. Sandy examinera personnellement votre demande et vous contactera par e-mail ou WhatsApp. Vos dates ne sont confirmées qu'après approbation et paiement.",
  sendRequestButton: "Envoyer la demande de réservation",
  submitting: "Envoi en cours…",
  calendarLoading: "Chargement des disponibilités…",
  availabilityLoadError:
    "Impossible de charger les disponibilités pour le moment. Veuillez réessayer dans un instant.",
  availabilityRetryButton: "Réessayer",
  calendarLegendAvailable: "Disponible",
  calendarLegendUnavailable: "Indisponible",
  calendarLegendSelected: "Sélectionné",
  calendarLegendPast: "Passé",
  calendarPrevMonth: "Mois précédent",
  calendarNextMonth: "Mois suivant",
  calendarSelectCheckIn: "Sélectionnez votre date d'arrivée",
  calendarSelectCheckOut: "Sélectionnez votre date de départ",
  calendarLegendHoliday: "Tarif spécial",
  minimumStayThursday: "Séjour minimum de deux nuits pour une arrivée le jeudi.",
  minimumStayFriday: "Séjour minimum de deux nuits pour une arrivée le vendredi.",
  minimumStaySaturday: "Séjour minimum de deux nuits pour une arrivée le samedi.",
  minimumStayGeneric: "Séjour minimum de {nights} nuits pour cette date d'arrivée.",
  priceSummary: {
    title: "Total estimé du séjour",
    nightlyLine: "Tarif par nuit",
    nightsCount: "{count} nuits",
    nightlySubtotal: "Sous-total des nuits",
    additionalGuests:
      "Voyageurs supplémentaires ({count} × {rate}/nuit × {nights} nuits)",
    cleaningFee: "Frais de ménage",
    estimatedTotal: "Total estimé",
    checkoutNotCharged: "Votre date de départ n'est pas facturée comme nuit occupée.",
    includedGuestsNote:
      "Le tarif de base par nuit inclut jusqu'à {count} voyageurs.",
    extraGuestsApprovalNote:
      "Les voyageurs 7 et 8 nécessitent une approbation préalable et restent soumis à confirmation par l'hôte.",
  },
  calendarWeekdays: ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"],
  tripReasons: {
    vacation: "Vacances",
    familyVisit: "Visite familiale",
    specialOccasion: "Occasion spéciale",
    businessRemote: "Affaires ou télétravail",
    other: "Autre",
  },
  outsideVisitorsOptions: {
    no: "Non",
    yes: "Oui",
    notSure: "Pas encore certain(e)",
  },
  errors: {
    checkInRequired: "Veuillez sélectionner une date d'arrivée.",
    checkOutRequired: "Veuillez sélectionner une date de départ.",
    checkOutAfterCheckIn: "La date de départ doit être postérieure à la date d'arrivée.",
    invalidStayRange:
      "Ces dates incluent des nuits indisponibles. Veuillez choisir d'autres dates.",
    noAdults: "Au moins un adulte (13 ans et plus) est requis.",
    tooManyGuests:
      "Riu House accueille jusqu'à huit voyageurs au total, adultes et enfants compris.",
    childAgesRequired: "Veuillez indiquer l'âge de chaque enfant.",
    childAgesCountMismatch:
      "Indiquez un âge par enfant, séparés par des virgules.",
    childAgesEmptyValue:
      "Supprimez les virgules en trop ou indiquez un âge pour chaque enfant.",
    childAgesNonNumeric: "Utilisez uniquement des nombres entiers (par ex. : 4, 8).",
    childAgesDecimal: "Utilisez uniquement des nombres entiers — les décimales ne sont pas acceptées.",
    childAgesOutOfRange: "Les âges des enfants doivent être entre 0 et 12.",
    childAgesMustBeAdult:
      "Un voyageur de 13 ans ou plus doit être compté comme adulte. Veuillez mettre à jour le nombre d'adultes et n'indiquer que des âges de 0 à 12 pour les enfants.",
    fullNameRequired: "Veuillez indiquer votre nom complet.",
    emailRequired: "Veuillez indiquer votre adresse e-mail.",
    emailInvalid: "Veuillez indiquer une adresse e-mail valide.",
    phoneRequired: "Veuillez indiquer un numéro de téléphone ou WhatsApp.",
    countryRequired: "Veuillez indiquer votre pays de résidence.",
    tripReasonRequired: "Veuillez sélectionner un motif de séjour.",
    outsideVisitorsRequired: "Veuillez répondre à la question sur les visiteurs extérieurs.",
    houseRulesRequired:
      "Veuillez confirmer votre accord avec le règlement intérieur et les règles de la piscine.",
    requestAckRequired:
      "Veuillez confirmer que vous comprenez qu'il s'agit d'une demande et non d'une réservation confirmée.",
    submitFailed:
      "Impossible d'envoyer votre demande pour le moment. Veuillez réessayer dans un instant.",
    availabilityConflict:
      "Ces dates ne sont plus disponibles. Veuillez choisir d'autres dates et réessayer.",
    minimumStayNotMet:
      "Votre séjour ne respecte pas le nombre minimum de nuits pour la date d'arrivée sélectionnée.",
  },
  confirmation: {
    heading: "Votre demande a bien été reçue.",
    referenceLabel: "Référence",
    body1:
      "Votre séjour n'est pas encore confirmé. Sandy ou l'équipe NuvoHauz examinera votre demande.",
    body2:
      "Nous vous contacterons par e-mail ou WhatsApp pour la suite.",
    body3:
      "Vos dates restent non confirmées jusqu'à réception d'une confirmation écrite de NuvoHauz.",
    startOverButton: "Soumettre une autre demande",
    backToPropertyButton: "Retour aux détails de Riu House",
  },
};

export default fr;
