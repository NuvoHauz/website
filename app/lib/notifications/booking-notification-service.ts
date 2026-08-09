import "server-only";

import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import type { BookingRequestRow } from "../supabase/database.types";
import {
  sendBookingNotificationEmail,
} from "./booking-notification-email";

const STALE_SENDING_MS = 10 * 60 * 1000;

function logSanitizedSupabaseError(
  context: string,
  requestReference: string,
  error: PostgrestError,
): void {
  console.error(
    context,
    requestReference,
    error.code ?? "unknown",
    error.message ?? "unknown",
    error.details ?? "",
    error.hint ?? "",
  );
}

function isStaleSendingClaim(row: BookingRequestRow): boolean {
  if (row.notification_status !== "sending" || !row.notification_claimed_at) {
    return false;
  }

  const claimedAt = Date.parse(row.notification_claimed_at);
  if (Number.isNaN(claimedAt)) {
    return false;
  }

  return Date.now() - claimedAt >= STALE_SENDING_MS;
}

export async function maybeSendBookingNotification(
  supabase: SupabaseClient,
  idempotencyKey: string,
): Promise<void> {
  const { data: row, error: fetchError } = await supabase
    .from("booking_requests")
    .select("*")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (fetchError || !row) {
    if (fetchError) {
      logSanitizedSupabaseError(
        "booking notification row lookup failed",
        idempotencyKey,
        fetchError,
      );
    }
    return;
  }

  const bookingRow = row as BookingRequestRow;

  if (bookingRow.notification_status === "sent") {
    return;
  }

  if (
    bookingRow.notification_status === "sending" &&
    !isStaleSendingClaim(bookingRow)
  ) {
    return;
  }

  const { data: claimedRows, error: claimError } = await supabase.rpc(
    "claim_booking_notification",
    { p_idempotency_key: idempotencyKey },
  );

  if (claimError) {
    logSanitizedSupabaseError(
      "booking notification claim failed",
      bookingRow.request_reference,
      claimError,
    );
    return;
  }

  const claimed = (claimedRows as BookingRequestRow[] | null)?.[0];
  if (!claimed?.notification_claimed_at) {
    return;
  }

  const claimToken = claimed.notification_claimed_at;

  const sendResult = await sendBookingNotificationEmail(claimed);

  if (sendResult.ok) {
    await finalizeNotificationAttempt(supabase, claimed.id, claimToken, {
      notification_status: "sent",
      notification_sent_at: new Date().toISOString(),
      notification_provider_id: sendResult.providerId,
      notification_last_error_code: null,
    }, claimed.request_reference);
    return;
  }

  await finalizeNotificationAttempt(
    supabase,
    claimed.id,
    claimToken,
    {
      notification_status: "failed",
      notification_last_error_code: sendResult.errorCode,
    },
    claimed.request_reference,
    sendResult.httpStatus,
  );
}

async function finalizeNotificationAttempt(
  supabase: SupabaseClient,
  rowId: string,
  claimToken: string,
  update: {
    notification_status: "sent" | "failed";
    notification_sent_at?: string;
    notification_provider_id?: string | null;
    notification_last_error_code?: string | null;
  },
  requestReference: string,
  httpStatus?: number,
): Promise<void> {
  const { data: finalizedRows, error: updateError } = await supabase
    .from("booking_requests")
    .update(update)
    .eq("id", rowId)
    .eq("notification_status", "sending")
    .eq("notification_claimed_at", claimToken)
    .select("id");

  if (updateError) {
    logSanitizedSupabaseError(
      "booking notification finalization skipped",
      requestReference,
      updateError,
    );
    return;
  }

  if (!finalizedRows?.length) {
    console.error("booking notification finalization skipped", requestReference);
    return;
  }

  if (update.notification_status === "failed") {
    if (httpStatus !== undefined) {
      console.error("booking notification send failed", requestReference, httpStatus);
      return;
    }

    console.error(
      "booking notification send failed",
      requestReference,
      update.notification_last_error_code ?? "unknown",
    );
  }
}
