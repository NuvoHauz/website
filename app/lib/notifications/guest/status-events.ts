import type { ReservationAction } from "../../admin/reservation-types";
import type { GuestNotificationEvent } from "./types";

export function guestEventForReservationAction(
  action: ReservationAction,
): GuestNotificationEvent {
  switch (action) {
    case "approve_hold":
      return "approved";
    case "confirm":
      return "confirmed";
    case "decline":
      return "declined";
    case "cancel":
      return "cancelled";
  }
}

export function guestEmailPreviewForAction(action: ReservationAction): string {
  switch (action) {
    case "approve_hold":
      return "Guest email: Your Riu House request was approved • Payment required";
    case "confirm":
      return "Guest email: Reservation confirmed! Your Riu House stay is booked";
    case "decline":
      return "Guest email: Your Riu House request could not be accepted";
    case "cancel":
      return "Guest email: Your Riu House reservation was cancelled";
  }
}
