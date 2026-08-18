import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getTodayInCostaRica } from "../booking/costa-rica-dates";
import {
  ACTIVE_BLOCK_STATUS,
  RIU_HOUSE_PROPERTY_SLUG,
} from "../booking/blocked-ranges";
import { getSupabaseAdmin } from "../supabase/server";
import {
  buildSummary,
  mapAvailabilityBlock,
  mapBookingRequest,
} from "./reservation-labels";
import { getPreviewReservations } from "./preview-data";
import {
  previewCreateManualBlock,
  previewDeactivateManualBlock,
  previewUpdateBookingRequestStatus,
} from "./preview-mutations";
import { isPreviewModeEnabled } from "./session";
import { logRpcFailure, mapRpcError } from "./rpc-errors";
import {
  guestEventForReservationAction,
} from "../notifications/guest/status-events";
import {
  maybeSendGuestNotification,
} from "../notifications/guest/guest-notification-service";
import { processExpiredOwnerHolds } from "./expire-owner-holds";
import type { BookingNotificationDeliveryRow } from "../supabase/database.types";
import type {
  AdminReservationsResponse,
  ManualBlockReason,
  OwnerName,
  ReservationAction,
} from "./reservation-types";

const PROPERTY_NAME = "Riu House";

export type UpdateBookingRequestResult =
  | "ok"
  | "preview"
  | "conflict"
  | "invalid"
  | "not_found"
  | "block_type_constraint"
  | "block_status_constraint"
  | "booking_status_constraint"
  | { error: "server"; code?: string };

async function expireOwnerHolds(supabase: SupabaseClient): Promise<void> {
  await processExpiredOwnerHolds(supabase);
}

function assertSupabaseQueryOk(
  error: { code?: string; message?: string } | null,
  context: string,
): void {
  if (!error) return;

  if (error.code === "PGRST303") {
    throw new Error("supabase_clock_skew");
  }

  console.error(context, error.code, error.message);
  throw new Error("reservations_unavailable");
}

export async function fetchAdminReservations(
  owner: OwnerName,
): Promise<AdminReservationsResponse> {
  if (isPreviewModeEnabled()) {
    return getPreviewReservations(owner);
  }

  const supabase = getSupabaseAdmin();
  await expireOwnerHolds(supabase);

  const [requestsResult, blocksResult, deliveriesResult] = await Promise.all([
    supabase
      .from("booking_requests")
      .select("*")
      .eq("property_slug", RIU_HOUSE_PROPERTY_SLUG)
      .order("created_at", { ascending: false }),
    supabase
      .from("availability_blocks")
      .select("*")
      .eq("property_slug", RIU_HOUSE_PROPERTY_SLUG)
      .eq("status", ACTIVE_BLOCK_STATUS)
      .order("start_date", { ascending: true }),
    supabase
      .from("booking_notification_deliveries")
      .select("*")
      .eq("recipient_type", "guest"),
  ]);

  if (requestsResult.error) {
    assertSupabaseQueryOk(
      requestsResult.error,
      "booking_requests admin query failed",
    );
  }

  if (blocksResult.error) {
    assertSupabaseQueryOk(
      blocksResult.error,
      "availability_blocks admin query failed",
    );
  }

  const guestDeliveries: BookingNotificationDeliveryRow[] = [];
  if (deliveriesResult.error) {
    const missingTable =
      deliveriesResult.error.code === "PGRST205" ||
      String(deliveriesResult.error.message ?? "").includes(
        "booking_notification_deliveries",
      );
    if (!missingTable) {
      assertSupabaseQueryOk(
        deliveriesResult.error,
        "booking_notification_deliveries admin query failed",
      );
    }
  } else {
    guestDeliveries.push(...(deliveriesResult.data ?? []));
  }

  const guestDeliveriesByBookingId = new Map<string, BookingNotificationDeliveryRow[]>();
  for (const delivery of guestDeliveries) {
    const list = guestDeliveriesByBookingId.get(delivery.booking_request_id) ?? [];
    list.push(delivery);
    guestDeliveriesByBookingId.set(delivery.booking_request_id, list);
  }

  const nowIso = new Date().toISOString();
  const activeBlocks = (blocksResult.data ?? []).filter(
    (row) => !row.block_expires_at || row.block_expires_at > nowIso,
  );

  const bookingRequests = (requestsResult.data ?? []).map((row) =>
    mapBookingRequest(row, guestDeliveriesByBookingId.get(row.id) ?? []),
  );
  const guestNameByRequestId = new Map(
    bookingRequests.map((row) => [row.id, row.fullName]),
  );
  const availabilityBlocks = activeBlocks.map((row) =>
    mapAvailabilityBlock(row, guestNameByRequestId),
  );

  return {
    owner,
    propertySlug: RIU_HOUSE_PROPERTY_SLUG,
    propertyName: PROPERTY_NAME,
    summary: buildSummary(
      bookingRequests,
      availabilityBlocks,
      getTodayInCostaRica(),
    ),
    bookingRequests,
    availabilityBlocks,
  };
}

export async function updateBookingRequestStatus(
  bookingRequestId: string,
  action: ReservationAction,
  owner: OwnerName,
): Promise<UpdateBookingRequestResult> {
  if (isPreviewModeEnabled()) {
    return previewUpdateBookingRequestStatus(bookingRequestId, action, owner);
  }

  const supabase = getSupabaseAdmin();
  await expireOwnerHolds(supabase);

  const { error } = await supabase.rpc("admin_update_booking_request", {
    p_booking_request_id: bookingRequestId,
    p_action: action,
    p_owner: owner,
  });

  if (error) {
    logRpcFailure("admin_update_booking_request", action, error);
    const mapped = mapRpcError(error);
    if (mapped === "server") {
      return { error: "server", code: error.code };
    }
    return mapped;
  }

  try {
    await maybeSendGuestNotification(
      supabase,
      bookingRequestId,
      guestEventForReservationAction(action),
    );
  } catch {
    console.error("guest status notification failed", bookingRequestId, action);
  }

  return "ok";
}

export async function createManualBlock(input: {
  startDate: string;
  endDate: string;
  reason: ManualBlockReason;
  note: string | null;
  owner: OwnerName;
}): Promise<"ok" | "conflict" | "invalid" | "preview"> {
  if (isPreviewModeEnabled()) {
    return previewCreateManualBlock(input);
  }

  const supabase = getSupabaseAdmin();
  await expireOwnerHolds(supabase);

  const { error } = await supabase.rpc("admin_create_manual_block", {
    p_property_slug: RIU_HOUSE_PROPERTY_SLUG,
    p_start_date: input.startDate,
    p_end_date: input.endDate,
    p_block_type: input.reason,
    p_internal_note: input.note ?? "",
    p_owner: input.owner,
  });

  if (error) {
    logRpcFailure("admin_create_manual_block", input.reason, error);
    const mapped = mapRpcError(error);
    if (mapped === "server" || mapped === "block_type_constraint" || mapped === "block_status_constraint" || mapped === "booking_status_constraint") {
      throw new Error("rpc_failed");
    }
    if (mapped === "not_found") {
      return "invalid";
    }
    return mapped;
  }

  return "ok";
}

export async function deactivateManualBlock(
  blockId: string,
  owner: OwnerName,
): Promise<"ok" | "invalid" | "not_found" | "preview"> {
  if (isPreviewModeEnabled()) {
    return previewDeactivateManualBlock(blockId, owner);
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.rpc("admin_deactivate_manual_block", {
    p_block_id: blockId,
    p_owner: owner,
  });

  if (error) {
    logRpcFailure("admin_deactivate_manual_block", blockId, error);
    const mapped = mapRpcError(error);
    if (mapped === "server" || mapped === "block_type_constraint" || mapped === "block_status_constraint" || mapped === "booking_status_constraint") {
      throw new Error("rpc_failed");
    }
    if (mapped === "conflict") {
      return "invalid";
    }
    return mapped;
  }

  return "ok";
}
