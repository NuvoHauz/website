import type { RiuHouseBookingTranslations } from "../types";

const en: RiuHouseBookingTranslations = {
  sectionTitle: "Check Availability & Request Dates",
  prototypeNotice:
    "Availability shown here uses sample prototype data and is not yet connected to the live reservation calendar.",
  stepIndicator: "Step {current} of {total}",
  step1Title: "Your stay",
  step2Title: "Tell us about your stay",
  checkInLabel: "Check-in date",
  checkOutLabel: "Check-out date",
  adultsLabel: "Adults (age 13 or older)",
  childrenLabel: "Children (under age 13)",
  childAgesLabel: "Ages of children",
  childAgesPlaceholder: "For example: 4, 8",
  occupancyHelper:
    "Riu House accommodates up to eight guests in total. Guests age 13 or older should be included as adults. Every request is reviewed personally by Sandy.",
  requestDatesButton: "Request These Dates",
  backButton: "Back",
  fullNameLabel: "Full name",
  emailLabel: "Email address",
  phoneLabel: "Phone or WhatsApp number",
  countryLabel: "Country of residence",
  tripReasonLabel: "Reason for the trip",
  outsideVisitorsLabel:
    "Will anyone who is not included in your reservation be visiting the property during your stay?",
  optionalMessageLabel: "Is there anything else you would like us to know?",
  optionalMessagePlaceholder: "Optional message",
  houseRulesCheckbox: "I agree to the house and pool rules",
  requestNotConfirmedCheckbox:
    "I understand this is a booking request, not a confirmed reservation",
  requestNotice:
    "This is a booking request, not an instant reservation. Sandy will personally review your request and contact you by email or WhatsApp. Your dates are confirmed only after approval and payment.",
  sendRequestButton: "Send Booking Request",
  submitting: "Sending…",
  calendarLegendAvailable: "Available",
  calendarLegendUnavailable: "Unavailable",
  calendarLegendSelected: "Selected",
  calendarLegendPast: "Past",
  calendarPrevMonth: "Previous month",
  calendarNextMonth: "Next month",
  calendarSelectCheckIn: "Select your check-in date",
  calendarSelectCheckOut: "Select your check-out date",
  calendarWeekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  tripReasons: {
    vacation: "Vacation",
    familyVisit: "Family visit",
    specialOccasion: "Special occasion",
    businessRemote: "Business or remote work",
    other: "Other",
  },
  outsideVisitorsOptions: {
    no: "No",
    yes: "Yes",
    notSure: "Not sure yet",
  },
  errors: {
    checkInRequired: "Please select a check-in date.",
    checkOutRequired: "Please select a check-out date.",
    checkOutAfterCheckIn: "Check-out must be after check-in.",
    invalidStayRange:
      "Those dates include unavailable nights. Please choose different dates.",
    noAdults: "At least one adult (age 13 or older) is required.",
    tooManyGuests:
      "Riu House accommodates up to eight guests in total, including adults and children.",
    childAgesRequired: "Please enter the ages of all children.",
    childAgesCountMismatch:
      "Enter one age for each child, separated by commas.",
    childAgesEmptyValue:
      "Remove extra commas or enter an age for each child.",
    childAgesNonNumeric: "Use whole numbers only (for example: 4, 8).",
    childAgesDecimal: "Use whole numbers only — decimals are not accepted.",
    childAgesOutOfRange: "Child ages must be between 0 and 12.",
    childAgesMustBeAdult:
      "A guest age 13 or older must be counted as an adult. Please update the adult count and enter only ages 0–12 for children.",
    fullNameRequired: "Please enter your full name.",
    emailRequired: "Please enter your email address.",
    emailInvalid: "Please enter a valid email address.",
    phoneRequired: "Please enter a phone or WhatsApp number.",
    countryRequired: "Please enter your country of residence.",
    tripReasonRequired: "Please select a reason for your trip.",
    outsideVisitorsRequired: "Please answer the outside-visitor question.",
    houseRulesRequired: "Please confirm agreement to the house and pool rules.",
    requestAckRequired:
      "Please confirm that you understand this is a request, not a confirmed reservation.",
  },
  confirmation: {
    heading: "Your request has been received.",
    referenceLabel: "Reference",
    body1:
      "Your stay is not yet confirmed. Sandy or the NuvoHauz team will review your request.",
    body2:
      "We will contact you by email or WhatsApp with next steps.",
    body3:
      "Your dates remain unconfirmed until you receive written confirmation from NuvoHauz.",
    startOverButton: "Submit another request",
    backToPropertyButton: "Back to Riu House details",
  },
};

export default en;
