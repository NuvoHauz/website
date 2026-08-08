export type TripReason =
  | "vacation"
  | "familyVisit"
  | "specialOccasion"
  | "businessRemote"
  | "other";

export type OutsideVisitors = "no" | "yes" | "notSure";

export interface RiuHouseBookingTranslations {
  sectionTitle: string;
  prototypeNotice: string;
  stepIndicator: string;
  step1Title: string;
  step2Title: string;
  checkInLabel: string;
  checkOutLabel: string;
  adultsLabel: string;
  childrenLabel: string;
  childAgesLabel: string;
  childAgesPlaceholder: string;
  occupancyHelper: string;
  requestDatesButton: string;
  backButton: string;
  fullNameLabel: string;
  emailLabel: string;
  phoneLabel: string;
  countryLabel: string;
  tripReasonLabel: string;
  outsideVisitorsLabel: string;
  optionalMessageLabel: string;
  optionalMessagePlaceholder: string;
  houseRulesCheckbox: string;
  requestNotConfirmedCheckbox: string;
  requestNotice: string;
  sendRequestButton: string;
  submitting: string;
  calendarLoading: string;
  availabilityLoadError: string;
  availabilityRetryButton: string;
  calendarLegendAvailable: string;
  calendarLegendUnavailable: string;
  calendarLegendSelected: string;
  calendarLegendPast: string;
  calendarPrevMonth: string;
  calendarNextMonth: string;
  calendarSelectCheckIn: string;
  calendarSelectCheckOut: string;
  calendarWeekdays: [string, string, string, string, string, string, string];
  tripReasons: {
    vacation: string;
    familyVisit: string;
    specialOccasion: string;
    businessRemote: string;
    other: string;
  };
  outsideVisitorsOptions: {
    no: string;
    yes: string;
    notSure: string;
  };
  errors: {
    checkInRequired: string;
    checkOutRequired: string;
    checkOutAfterCheckIn: string;
    invalidStayRange: string;
    noAdults: string;
    tooManyGuests: string;
    childAgesRequired: string;
    childAgesCountMismatch: string;
    childAgesEmptyValue: string;
    childAgesNonNumeric: string;
    childAgesDecimal: string;
    childAgesOutOfRange: string;
    childAgesMustBeAdult: string;
    fullNameRequired: string;
    emailRequired: string;
    emailInvalid: string;
    phoneRequired: string;
    countryRequired: string;
    tripReasonRequired: string;
    outsideVisitorsRequired: string;
    houseRulesRequired: string;
    requestAckRequired: string;
    submitFailed: string;
    availabilityConflict: string;
  };
  confirmation: {
    heading: string;
    referenceLabel: string;
    body1: string;
    body2: string;
    body3: string;
    startOverButton: string;
    backToPropertyButton: string;
  };
}
