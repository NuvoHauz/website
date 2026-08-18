import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { maybeSendGuestNotification } from "../notifications/guest/guest-notification-service";
import { logRpcFailure } from "./rpc-errors";

/**
 * Just-in-time hold expiration.
 *
 * Called before availability reads, booking validation, admin dashboard loads,
 * and guest status views. The database RPC is idempotent; concurrent callers
 * race safely. Guest expired emails are deduplicated by the delivery claim RPC.
 */
export async function processExpiredOwnerHolds(
  supabase: SupabaseClient,
): Promise<number> {
  const nowIso = new Date().toISOString();

  const { data: expiringRows, error: lookupError } = await supabase
    .from("booking_requests")
    .select("id")
    .eq("status", "approved_hold")
    .not("hold_expires_at", "is", null)
    .lte("hold_expires_at", nowIso);

  if (lookupError) {
    logRpcFailure("expire_owner_holds_lookup", "jit", lookupError);
  }

  const candidateIds = (expiringRows ?? []).map((row) => row.id);

  const { data: expiredCount, error } = await supabase.rpc("expire_owner_holds");
  if (error) {
    logRpcFailure("expire_owner_holds", "jit", error);
    if (error.code === "PGRST303") {
      console.error(
        "expire_owner_holds skipped: Supabase rejected the service JWT (PGRST303 JWT issued at future). Sync the system clock and restart the dev server.",
      );
    }
    return 0;
  }

  for (const bookingRequestId of candidateIds) {
    const { data: row } = await supabase
      .from("booking_requests")
      .select("status")
      .eq("id", bookingRequestId)
      .maybeSingle();

    if (row?.status !== "expired") {
      continue;
    }

    try {
      await maybeSendGuestNotification(supabase, bookingRequestId, "expired");
    } catch {
      console.error("guest expired notification failed", bookingRequestId);
    }
  }

  return typeof expiredCount === "number" ? expiredCount : 0;
}
