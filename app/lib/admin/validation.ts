import { compareIsoDates, getTodayInCostaRica } from "../booking/costa-rica-dates";
import type { ManualBlockReason, ReservationAction } from "./reservation-types";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const RESERVATION_ACTIONS = new Set<ReservationAction>([
  "approve_hold",
  "confirm",
  "decline",
  "cancel",
]);

const MANUAL_BLOCK_REASONS = new Set<ManualBlockReason>([
  "owner_stay",
  "maintenance",
  "other",
]);

export function isValidUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

export function validateReservationAction(value: string): value is ReservationAction {
  return RESERVATION_ACTIONS.has(value as ReservationAction);
}

export function validateManualBlockReason(value: string): value is ManualBlockReason {
  return MANUAL_BLOCK_REASONS.has(value as ManualBlockReason);
}

export function validateManualBlockInput(input: {
  startDate: string;
  endDate: string;
  note?: string | null;
}): string | null {
  if (!ISO_DATE_PATTERN.test(input.startDate) || !ISO_DATE_PATTERN.test(input.endDate)) {
    return "invalid_dates";
  }

  const today = getTodayInCostaRica();
  if (compareIsoDates(input.startDate, today) < 0) {
    return "past_start_date";
  }

  if (compareIsoDates(input.endDate, input.startDate) <= 0) {
    return "invalid_date_range";
  }

  if (input.note && input.note.length > 500) {
    return "note_too_long";
  }

  return null;
}
