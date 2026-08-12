import "server-only";

import type {
  ManualBlockReason,
  OwnerName,
  ReservationAction,
} from "./reservation-types";
import { getPreviewReservations } from "./preview-data";

function isoRangesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
): boolean {
  return startA < endB && startB < endA;
}

function isAllowedPreviewAction(
  status: string,
  action: ReservationAction,
): boolean {
  switch (action) {
    case "approve_hold":
      return ["submitted", "pending", "under_review", "approved"].includes(status);
    case "confirm":
      return status === "approved_hold";
    case "decline":
      return ["submitted", "pending", "under_review", "approved", "approved_hold"].includes(
        status,
      );
    case "cancel":
      return ["confirmed", "approved_hold"].includes(status);
    default:
      return false;
  }
}

export function previewUpdateBookingRequestStatus(
  bookingRequestId: string,
  action: ReservationAction,
  owner: OwnerName,
): "preview" | "conflict" | "invalid" | "not_found" {
  void owner;

  const preview = getPreviewReservations("Louie");
  const booking = preview.bookingRequests.find((row) => row.id === bookingRequestId);
  if (!booking) {
    return "not_found";
  }

  if (!isAllowedPreviewAction(booking.status, action)) {
    return "invalid";
  }

  if (action === "approve_hold") {
    const hasConflict = preview.availabilityBlocks.some(
      (block) =>
        block.bookingRequestId !== booking.id &&
        isoRangesOverlap(
          block.startDate,
          block.endDate,
          booking.checkIn,
          booking.checkOut,
        ),
    );
    if (hasConflict) {
      return "conflict";
    }
  }

  return "preview";
}

export function previewCreateManualBlock(input: {
  startDate: string;
  endDate: string;
  reason: ManualBlockReason;
  note: string | null;
  owner: OwnerName;
}): "preview" | "conflict" {
  void input.reason;
  void input.note;
  void input.owner;

  const preview = getPreviewReservations("Louie");
  const hasConflict = preview.availabilityBlocks.some((block) =>
    isoRangesOverlap(
      block.startDate,
      block.endDate,
      input.startDate,
      input.endDate,
    ),
  );

  return hasConflict ? "conflict" : "preview";
}

export function previewDeactivateManualBlock(
  blockId: string,
  owner: OwnerName,
): "preview" | "invalid" | "not_found" {
  void owner;

  const preview = getPreviewReservations("Louie");
  const block = preview.availabilityBlocks.find((row) => row.id === blockId);
  if (!block) {
    return "not_found";
  }

  if (block.bookingRequestId) {
    return "invalid";
  }

  return "preview";
}
