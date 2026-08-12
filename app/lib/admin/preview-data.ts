import "server-only";

import { addDaysToIsoDate, getTodayInCostaRica } from "../booking/costa-rica-dates";
import { RIU_HOUSE_PROPERTY_SLUG } from "../booking/blocked-ranges";
import type { AdminReservationsResponse, OwnerName } from "./reservation-types";
import {
  buildSummary,
  mapAvailabilityBlock,
  mapBookingRequest,
} from "./reservation-labels";

const PREVIEW_NOW = getTodayInCostaRica();

export function getPreviewReservations(owner: OwnerName): AdminReservationsResponse {
  const bookingRows = [
    {
      id: "00000000-0000-4000-8000-000000000101",
      request_reference: "NH-PREVIEW001",
      status: "pending",
      check_in: addDaysToIsoDate(PREVIEW_NOW, 14),
      check_out: addDaysToIsoDate(PREVIEW_NOW, 18),
      adults: 2,
      children: 1,
      child_ages: [8],
      full_name: "Preview Guest One",
      email: "preview.one@example.com",
      phone_whatsapp: "+15555550101",
      country_of_residence: "United States",
      trip_reason: "vacation",
      outside_visitors: "no",
      guest_message: "Local preview request only.",
      created_at: new Date().toISOString(),
      hold_expires_at: null,
      reviewed_at: null,
      reviewed_by: null,
    },
    {
      id: "00000000-0000-4000-8000-000000000102",
      request_reference: "NH-PREVIEW002",
      status: "approved_hold",
      check_in: addDaysToIsoDate(PREVIEW_NOW, 25),
      check_out: addDaysToIsoDate(PREVIEW_NOW, 29),
      adults: 4,
      children: 0,
      child_ages: [],
      full_name: "Preview Guest Two",
      email: "preview.two@example.com",
      phone_whatsapp: "+15555550102",
      country_of_residence: "Canada",
      trip_reason: "family_visit",
      outside_visitors: "not_sure",
      guest_message: null,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      hold_expires_at: new Date(Date.now() + 36 * 3600000).toISOString(),
      reviewed_at: new Date(Date.now() - 3600000).toISOString(),
      reviewed_by: "Sandy",
    },
    {
      id: "00000000-0000-4000-8000-000000000103",
      request_reference: "NH-PREVIEW003",
      status: "confirmed",
      check_in: addDaysToIsoDate(PREVIEW_NOW, 40),
      check_out: addDaysToIsoDate(PREVIEW_NOW, 45),
      adults: 2,
      children: 2,
      child_ages: [6, 10],
      full_name: "Preview Guest Three",
      email: "preview.three@example.com",
      phone_whatsapp: "+15555550103",
      country_of_residence: "Costa Rica",
      trip_reason: "special_occasion",
      outside_visitors: "yes",
      guest_message: "Anniversary trip.",
      created_at: new Date(Date.now() - 172800000).toISOString(),
      hold_expires_at: null,
      reviewed_at: new Date(Date.now() - 86400000).toISOString(),
      reviewed_by: "Louie",
    },
  ];

  const blockRows = [
    {
      id: "00000000-0000-4000-8000-000000000201",
      start_date: addDaysToIsoDate(PREVIEW_NOW, 25),
      end_date: addDaysToIsoDate(PREVIEW_NOW, 29),
      block_type: "approval_hold",
      status: "active",
      internal_note: "Preview hold",
      booking_request_id: "00000000-0000-4000-8000-000000000102",
      block_expires_at: new Date(Date.now() + 36 * 3600000).toISOString(),
      created_by: "Sandy",
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: "00000000-0000-4000-8000-000000000202",
      start_date: addDaysToIsoDate(PREVIEW_NOW, 40),
      end_date: addDaysToIsoDate(PREVIEW_NOW, 45),
      block_type: "confirmed_reservation",
      status: "active",
      internal_note: null,
      booking_request_id: "00000000-0000-4000-8000-000000000103",
      block_expires_at: null,
      created_by: "Louie",
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: "00000000-0000-4000-8000-000000000203",
      start_date: addDaysToIsoDate(PREVIEW_NOW, 8),
      end_date: addDaysToIsoDate(PREVIEW_NOW, 11),
      block_type: "owner_stay",
      status: "active",
      internal_note: "Family visit",
      booking_request_id: null,
      block_expires_at: null,
      created_by: "Louie",
      created_at: new Date(Date.now() - 7200000).toISOString(),
    },
  ];

  const bookingRequests = bookingRows.map((row) =>
    mapBookingRequest({
      ...row,
      property_slug: RIU_HOUSE_PROPERTY_SLUG,
      idempotency_key: "00000000-0000-4000-8000-000000000999",
      agreed_to_rules: true,
      acknowledged_request_only: true,
      updated_at: row.created_at,
      notification_status: "sent",
      notification_sent_at: row.created_at,
      notification_claimed_at: row.created_at,
      notification_attempts: 1,
      notification_last_error_code: null,
      notification_provider_id: "preview",
    }),
  );

  const guestNameByRequestId = new Map(
    bookingRequests.map((row) => [row.id, row.fullName]),
  );

  const availabilityBlocks = blockRows.map((row) =>
    mapAvailabilityBlock(
      {
        ...row,
        property_slug: RIU_HOUSE_PROPERTY_SLUG,
        updated_at: row.created_at,
      },
      guestNameByRequestId,
    ),
  );

  return {
    owner,
    propertySlug: RIU_HOUSE_PROPERTY_SLUG,
    propertyName: "Riu House",
    summary: buildSummary(bookingRequests, availabilityBlocks, PREVIEW_NOW),
    bookingRequests,
    availabilityBlocks,
  };
}
