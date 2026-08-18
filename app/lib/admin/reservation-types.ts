import type { AvailabilityBlockRow, BookingRequestRow } from "../supabase/database.types";

export const OWNER_NAMES = ["Louie", "Sandy"] as const;
export type OwnerName = (typeof OWNER_NAMES)[number];

export type BookingRequestStatus =
  | "submitted"
  | "pending"
  | "under_review"
  | "approved"
  | "approved_hold"
  | "confirmed"
  | "declined"
  | "rejected"
  | "cancelled"
  | "expired";

export type ManualBlockReason = "owner_stay" | "maintenance" | "other";

export type ReservationAction =
  | "approve_hold"
  | "confirm"
  | "decline"
  | "cancel";

export interface AdminSessionPayload {
  owner: OwnerName;
  exp: number;
}

export interface AdminReservationsResponse {
  owner: OwnerName;
  propertySlug: string;
  propertyName: string;
  summary: {
    pendingRequests: number;
    approvalHolds: number;
    confirmedReservations: number;
    upcomingStays: number;
  };
  bookingRequests: AdminBookingRequest[];
  availabilityBlocks: AdminAvailabilityBlock[];
}

export interface AdminBookingRequest {
  id: string;
  requestReference: string;
  status: string;
  statusLabel: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  adults: number;
  children: number;
  childAges: number[];
  fullName: string;
  email: string;
  phoneWhatsapp: string;
  countryOfResidence: string;
  tripReason: string;
  outsideVisitors: string;
  guestMessage: string | null;
  submittedAt: string;
  holdExpiresAt: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  guestEmailStatus: string | null;
  guestEmailLastEvent: string | null;
  guestEmailLastError: string | null;
  guestEmailSentAt: string | null;
}

export interface AdminAvailabilityBlock {
  id: string;
  startDate: string;
  endDate: string;
  blockType: string;
  blockLabel: string;
  status: string;
  internalNote: string | null;
  bookingRequestId: string | null;
  guestLabel: string | null;
  blockExpiresAt: string | null;
  createdBy: string | null;
  createdAt: string;
}

export type BookingRequestRowWithMeta = BookingRequestRow & {
  hold_expires_at?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
};

export type AvailabilityBlockRowWithMeta = AvailabilityBlockRow & {
  booking_request_id?: string | null;
  block_expires_at?: string | null;
  created_by?: string | null;
};
