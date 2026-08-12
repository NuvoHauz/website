import {
  compareIsoDates,
  getStayNights,
} from "../booking/costa-rica-dates";
import type {
  AdminAvailabilityBlock,
  AdminBookingRequest,
  AdminReservationsResponse,
  AvailabilityBlockRowWithMeta,
  BookingRequestRowWithMeta,
  BookingRequestStatus,
} from "./reservation-types";

const PENDING_STATUSES = new Set<BookingRequestStatus>([
  "submitted",
  "pending",
  "under_review",
  "approved",
]);

export function normalizeStatusLabel(status: string): string {
  switch (status) {
    case "submitted":
    case "pending":
      return "Pending review";
    case "under_review":
      return "Under review";
    case "approved":
      return "Approved";
    case "approved_hold":
      return "Approval hold";
    case "confirmed":
      return "Confirmed";
    case "declined":
    case "rejected":
      return "Declined";
    case "cancelled":
      return "Cancelled";
    case "expired":
      return "Expired";
    default:
      return status.replaceAll("_", " ");
  }
}

export function getBlockLabel(blockType: string): string {
  switch (blockType) {
    case "approval_hold":
      return "Approval hold";
    case "confirmed_reservation":
      return "Confirmed reservation";
    case "owner_stay":
      return "Owner or family stay";
    case "maintenance":
      return "Maintenance";
    case "other":
      return "Other block";
    default:
      return blockType.replaceAll("_", " ");
  }
}

export function mapBookingRequest(row: BookingRequestRowWithMeta): AdminBookingRequest {
  const nights = getStayNights(row.check_in, row.check_out).length;
  return {
    id: row.id,
    requestReference: row.request_reference,
    status: row.status,
    statusLabel: normalizeStatusLabel(row.status),
    checkIn: row.check_in,
    checkOut: row.check_out,
    nights,
    adults: row.adults,
    children: row.children,
    childAges: row.child_ages ?? [],
    fullName: row.full_name,
    email: row.email,
    phoneWhatsapp: row.phone_whatsapp,
    countryOfResidence: row.country_of_residence,
    tripReason: row.trip_reason,
    outsideVisitors: row.outside_visitors,
    guestMessage: row.guest_message,
    submittedAt: row.created_at,
    holdExpiresAt: row.hold_expires_at ?? null,
    reviewedAt: row.reviewed_at ?? null,
    reviewedBy: row.reviewed_by ?? null,
  };
}

export function mapAvailabilityBlock(
  row: AvailabilityBlockRowWithMeta,
  guestNameByRequestId: Map<string, string>,
): AdminAvailabilityBlock {
  const guestLabel = row.booking_request_id
    ? guestNameByRequestId.get(row.booking_request_id) ?? "Guest reservation"
    : null;

  return {
    id: row.id,
    startDate: row.start_date,
    endDate: row.end_date,
    blockType: row.block_type,
    blockLabel: getBlockLabel(row.block_type),
    status: row.status,
    internalNote: row.internal_note,
    bookingRequestId: row.booking_request_id ?? null,
    guestLabel,
    blockExpiresAt: row.block_expires_at ?? null,
    createdBy: row.created_by ?? null,
    createdAt: row.created_at,
  };
}

export function buildSummary(
  bookingRequests: AdminBookingRequest[],
  blocks: AdminAvailabilityBlock[],
  today: string,
): AdminReservationsResponse["summary"] {
  const pendingRequests = bookingRequests.filter((row) =>
    PENDING_STATUSES.has(row.status as BookingRequestStatus),
  ).length;

  const approvalHolds = bookingRequests.filter(
    (row) => row.status === "approved_hold",
  ).length;

  const confirmedReservations = bookingRequests.filter(
    (row) => row.status === "confirmed",
  ).length;

  const upcomingStays = blocks.filter(
    (block) =>
      block.status === "active" &&
      compareIsoDates(block.endDate, today) > 0 &&
      (block.blockType === "confirmed_reservation" ||
        block.blockType === "approval_hold" ||
        block.blockType === "owner_stay"),
  ).length;

  return {
    pendingRequests,
    approvalHolds,
    confirmedReservations,
    upcomingStays,
  };
}

export function isPendingStatus(status: string): boolean {
  return PENDING_STATUSES.has(status as BookingRequestStatus);
}
