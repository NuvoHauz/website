import type { OutsideVisitors, TripReason } from "../../i18n/riu-house/booking/types";
import {
  addDaysToIsoDate,
  compareIsoDates,
  getStayNights,
  getTodayInCostaRica,
} from "./costa-rica-dates";
import { AVAILABILITY_HORIZON_DAYS, type BlockedRange, isBlockedNight } from "./blocked-ranges";
import {
  isValidEmail,
  parseChildAges,
  validateGuestCounts,
} from "./validation";

export interface BookingRequestPayload {
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  childAgesInput: string;
  fullName: string;
  email: string;
  phone: string;
  country: string;
  tripReason: TripReason;
  outsideVisitors: OutsideVisitors;
  message?: string;
  agreedHouseRules: boolean;
  agreedRequest: boolean;
  honeypot?: string;
}

export type BookingValidationErrorCode =
  | "checkInRequired"
  | "checkOutRequired"
  | "checkOutAfterCheckIn"
  | "invalidStayRange"
  | "noAdults"
  | "tooManyGuests"
  | "childAgesRequired"
  | "childAgesCountMismatch"
  | "childAgesEmptyValue"
  | "childAgesNonNumeric"
  | "childAgesDecimal"
  | "childAgesOutOfRange"
  | "childAgesMustBeAdult"
  | "fullNameRequired"
  | "emailRequired"
  | "emailInvalid"
  | "phoneRequired"
  | "countryRequired"
  | "tripReasonRequired"
  | "outsideVisitorsRequired"
  | "houseRulesRequired"
  | "requestAckRequired"
  | "invalidTripReason"
  | "invalidOutsideVisitors"
  | "spamDetected";

export interface ValidatedBookingRequest {
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  childAges: number[];
  fullName: string;
  email: string;
  phone: string;
  country: string;
  tripReason: TripReason;
  outsideVisitors: OutsideVisitors;
  message: string | null;
  agreedHouseRules: boolean;
  agreedRequest: boolean;
}

const tripReasons = new Set<TripReason>([
  "vacation",
  "familyVisit",
  "specialOccasion",
  "businessRemote",
  "other",
]);

const outsideVisitorValues = new Set<OutsideVisitors>(["no", "yes", "notSure"]);

export function getAvailabilityHorizonEnd(): string {
  return addDaysToIsoDate(getTodayInCostaRica(), AVAILABILITY_HORIZON_DAYS);
}

export function isPastDate(iso: string): boolean {
  return compareIsoDates(iso, getTodayInCostaRica()) < 0;
}

export function isBeyondHorizon(iso: string): boolean {
  return compareIsoDates(iso, getAvailabilityHorizonEnd()) > 0;
}

export function isDateSelectable(iso: string): boolean {
  return !isPastDate(iso) && !isBeyondHorizon(iso);
}

export function canCheckInOn(date: string, ranges: BlockedRange[]): boolean {
  return isDateSelectable(date) && !isBlockedNight(date, ranges);
}

export function isStayRangeValid(
  checkIn: string,
  checkOut: string,
  ranges: BlockedRange[],
): boolean {
  if (!checkIn || !checkOut) return false;
  if (compareIsoDates(checkOut, checkIn) <= 0) return false;
  if (!canCheckInOn(checkIn, ranges)) return false;
  if (!isDateSelectable(checkOut)) return false;

  const nights = getStayNights(checkIn, checkOut);
  return nights.every((night) => !isBlockedNight(night, ranges));
}

export function validateBookingRequestPayload(
  payload: BookingRequestPayload,
  ranges: BlockedRange[],
): { ok: true; data: ValidatedBookingRequest } | { ok: false; errors: BookingValidationErrorCode[] } {
  const errors: BookingValidationErrorCode[] = [];

  if (payload.honeypot && payload.honeypot.trim() !== "") {
    errors.push("spamDetected");
    return { ok: false, errors };
  }

  if (!payload.checkIn?.trim()) errors.push("checkInRequired");
  if (!payload.checkOut?.trim()) errors.push("checkOutRequired");
  if (
    payload.checkIn &&
    payload.checkOut &&
    compareIsoDates(payload.checkOut, payload.checkIn) <= 0
  ) {
    errors.push("checkOutAfterCheckIn");
  }
  if (
    payload.checkIn &&
    payload.checkOut &&
    !isStayRangeValid(payload.checkIn, payload.checkOut, ranges)
  ) {
    errors.push("invalidStayRange");
  }

  const adults = Number(payload.adults);
  const children = Number(payload.children);
  const guestResult = validateGuestCounts(adults, children);
  if (guestResult === "noAdults") errors.push("noAdults");
  if (guestResult === "tooManyGuests") errors.push("tooManyGuests");

  let childAges: number[] = [];
  if (children > 0) {
    const agesResult = parseChildAges(payload.childAgesInput ?? "", children);
    if (!agesResult.ok) {
      const childAgeKeyMap = {
        required: "childAgesRequired",
        countMismatch: "childAgesCountMismatch",
        invalidFormat: "childAgesNonNumeric",
        emptyValue: "childAgesEmptyValue",
        nonNumeric: "childAgesNonNumeric",
        decimal: "childAgesDecimal",
        outOfRange: "childAgesOutOfRange",
        mustBeAdult: "childAgesMustBeAdult",
      } as const;
      errors.push(childAgeKeyMap[agesResult.errorKey]);
    } else {
      childAges = agesResult.ages;
    }
  }

  if (!payload.fullName?.trim()) errors.push("fullNameRequired");
  if (!payload.email?.trim()) errors.push("emailRequired");
  else if (!isValidEmail(payload.email)) errors.push("emailInvalid");
  if (!payload.phone?.trim()) errors.push("phoneRequired");
  if (!payload.country?.trim()) errors.push("countryRequired");
  if (!payload.tripReason || !tripReasons.has(payload.tripReason)) {
    errors.push("tripReasonRequired");
  }
  if (!payload.outsideVisitors || !outsideVisitorValues.has(payload.outsideVisitors)) {
    errors.push("outsideVisitorsRequired");
  }
  if (!payload.agreedHouseRules) errors.push("houseRulesRequired");
  if (!payload.agreedRequest) errors.push("requestAckRequired");

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      checkIn: payload.checkIn.trim(),
      checkOut: payload.checkOut.trim(),
      adults,
      children,
      childAges,
      fullName: payload.fullName.trim(),
      email: payload.email.trim(),
      phone: payload.phone.trim(),
      country: payload.country.trim(),
      tripReason: payload.tripReason,
      outsideVisitors: payload.outsideVisitors,
      message: payload.message?.trim() ? payload.message.trim() : null,
      agreedHouseRules: payload.agreedHouseRules,
      agreedRequest: payload.agreedRequest,
    },
  };
}

export function mapTripReasonToDatabase(tripReason: TripReason): string {
  switch (tripReason) {
    case "familyVisit":
      return "family_visit";
    case "specialOccasion":
      return "special_occasion";
    case "businessRemote":
      return "business_remote_work";
    default:
      return tripReason;
  }
}

export function mapOutsideVisitorsToDatabase(outsideVisitors: OutsideVisitors): string {
  return outsideVisitors === "notSure" ? "not_sure" : outsideVisitors;
}
