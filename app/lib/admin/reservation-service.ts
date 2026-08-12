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
  const { error } = await supabase.rpc("expire_owner_holds");
  if (error) {
    logRpcFailure("expire_owner_holds", "startup", error);
    if (error.code === "PGRST303") {
      console.error(
        "expire_owner_holds skipped: Supabase rejected the service JWT (PGRST303 JWT issued at future). Sync the system clock and restart the dev server.",
      );
    }
    // Non-fatal housekeeping: the dashboard can still load if later queries succeed.
  }
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

  const [requestsResult, blocksResult] = await Promise.all([
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

  const nowIso = new Date().toISOString();
  const activeBlocks = (blocksResult.data ?? []).filter(
    (row) => !row.block_expires_at || row.block_expires_at > nowIso,
  );

  const bookingRequests = (requestsResult.data ?? []).map(mapBookingRequest);
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
