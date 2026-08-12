import { NextResponse, type NextRequest } from "next/server";
import {
  ADMIN_NO_STORE_HEADERS,
  isAllowedAdminOrigin,
  requireOwnerSession,
} from "../../../lib/admin/auth";
import { AdminAuthConfigError } from "../../../lib/admin/session";
import {
  createManualBlock,
  deactivateManualBlock,
  fetchAdminReservations,
  updateBookingRequestStatus,
} from "../../../lib/admin/reservation-service";
import type { ManualBlockReason, ReservationAction } from "../../../lib/admin/reservation-types";
import {
  isValidUuid,
  validateManualBlockInput,
  validateManualBlockReason,
  validateReservationAction,
} from "../../../lib/admin/validation";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json(
    { error: "unauthorized" },
    { status: 401, headers: ADMIN_NO_STORE_HEADERS },
  );
}

function configError(error: AdminAuthConfigError) {
  return NextResponse.json(
    { error: "admin_not_configured", message: error.message },
    { status: 503, headers: ADMIN_NO_STORE_HEADERS },
  );
}

export async function GET() {
  try {
    const session = await requireOwnerSession();
    const data = await fetchAdminReservations(session.owner);
    return NextResponse.json(data, { headers: ADMIN_NO_STORE_HEADERS });
  } catch (error) {
    if (error instanceof AdminAuthConfigError) {
      return configError(error);
    }
    if (error instanceof Error && error.message === "unauthenticated") {
      return unauthorized();
    }
    console.error("admin reservations GET failed");
    return NextResponse.json(
      { error: "reservations_unavailable" },
      { status: 503, headers: ADMIN_NO_STORE_HEADERS },
    );
  }
}

export async function PATCH(request: NextRequest) {
  if (!isAllowedAdminOrigin(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  try {
    const session = await requireOwnerSession();
    const body = (await request.json()) as {
      bookingRequestId?: string;
      action?: string;
    };

    const bookingRequestId = body.bookingRequestId?.trim() ?? "";
    const action = body.action?.trim() ?? "";

    if (!isValidUuid(bookingRequestId) || !validateReservationAction(action)) {
      return NextResponse.json({ error: "validation_failed" }, { status: 400 });
    }

    const result = await updateBookingRequestStatus(
      bookingRequestId,
      action as ReservationAction,
      session.owner,
    );

    if (result === "preview") {
      return NextResponse.json(
        { success: true, preview: true },
        { headers: ADMIN_NO_STORE_HEADERS },
      );
    }

    if (result === "conflict") {
      return NextResponse.json({ error: "dates_unavailable" }, { status: 409 });
    }

    if (result === "invalid") {
      return NextResponse.json({ error: "invalid_transition" }, { status: 400 });
    }

    if (result === "not_found") {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    if (result === "block_type_constraint") {
      return NextResponse.json(
        { error: "block_type_constraint", code: "23514" },
        { status: 503, headers: ADMIN_NO_STORE_HEADERS },
      );
    }

    if (result === "block_status_constraint") {
      return NextResponse.json(
        { error: "block_status_constraint", code: "23514" },
        { status: 503, headers: ADMIN_NO_STORE_HEADERS },
      );
    }

    if (result === "booking_status_constraint") {
      return NextResponse.json(
        { error: "booking_status_constraint", code: "23514" },
        { status: 503, headers: ADMIN_NO_STORE_HEADERS },
      );
    }

    if (typeof result === "object" && result.error === "server") {
      return NextResponse.json(
        { error: "update_failed", code: result.code ?? null },
        { status: 503, headers: ADMIN_NO_STORE_HEADERS },
      );
    }

    return NextResponse.json({ success: true }, { headers: ADMIN_NO_STORE_HEADERS });
  } catch (error) {
    if (error instanceof AdminAuthConfigError) {
      return configError(error);
    }
    if (error instanceof Error && error.message === "unauthenticated") {
      return unauthorized();
    }
    if (error instanceof Error && error.message === "supabase_clock_skew") {
      return NextResponse.json(
        { error: "supabase_clock_skew", message: "System clock is out of sync with Supabase." },
        { status: 503, headers: ADMIN_NO_STORE_HEADERS },
      );
    }
    if (error instanceof Error && error.message === "expire_owner_holds_failed") {
      return NextResponse.json(
        { error: "hold_cleanup_failed" },
        { status: 503, headers: ADMIN_NO_STORE_HEADERS },
      );
    }
    console.error("admin reservations PATCH failed");
    return NextResponse.json(
      { error: "update_failed" },
      { status: 503, headers: ADMIN_NO_STORE_HEADERS },
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isAllowedAdminOrigin(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  try {
    const session = await requireOwnerSession();
    const body = (await request.json()) as {
      startDate?: string;
      endDate?: string;
      reason?: string;
      note?: string | null;
    };

    const startDate = body.startDate?.trim() ?? "";
    const endDate = body.endDate?.trim() ?? "";
    const reason = body.reason?.trim() ?? "";
    const note = body.note?.trim() ?? null;

    if (!validateManualBlockReason(reason)) {
      return NextResponse.json({ error: "validation_failed" }, { status: 400 });
    }

    const validationError = validateManualBlockInput({ startDate, endDate, note });
    if (validationError) {
      return NextResponse.json(
        { error: "validation_failed", code: validationError },
        { status: 400 },
      );
    }

    const result = await createManualBlock({
      startDate,
      endDate,
      reason: reason as ManualBlockReason,
      note,
      owner: session.owner,
    });

    if (result === "preview") {
      return NextResponse.json(
        { success: true, preview: true },
        { headers: ADMIN_NO_STORE_HEADERS },
      );
    }

    if (result === "conflict") {
      return NextResponse.json({ error: "dates_unavailable" }, { status: 409 });
    }

    if (result === "invalid") {
      return NextResponse.json({ error: "validation_failed" }, { status: 400 });
    }

    return NextResponse.json({ success: true }, { headers: ADMIN_NO_STORE_HEADERS });
  } catch (error) {
    if (error instanceof AdminAuthConfigError) {
      return configError(error);
    }
    if (error instanceof Error && error.message === "unauthenticated") {
      return unauthorized();
    }
    console.error("admin reservations POST failed");
    return NextResponse.json(
      { error: "create_failed" },
      { status: 503, headers: ADMIN_NO_STORE_HEADERS },
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAllowedAdminOrigin(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  try {
    const session = await requireOwnerSession();
    const body = (await request.json()) as { blockId?: string };
    const blockId = body.blockId?.trim() ?? "";

    if (!isValidUuid(blockId)) {
      return NextResponse.json({ error: "validation_failed" }, { status: 400 });
    }

    const result = await deactivateManualBlock(blockId, session.owner);

    if (result === "preview") {
      return NextResponse.json(
        { success: true, preview: true },
        { headers: ADMIN_NO_STORE_HEADERS },
      );
    }

    if (result === "invalid") {
      return NextResponse.json({ error: "invalid_block" }, { status: 400 });
    }

    if (result === "not_found") {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { headers: ADMIN_NO_STORE_HEADERS });
  } catch (error) {
    if (error instanceof AdminAuthConfigError) {
      return configError(error);
    }
    if (error instanceof Error && error.message === "unauthenticated") {
      return unauthorized();
    }
    console.error("admin reservations DELETE failed");
    return NextResponse.json(
      { error: "delete_failed" },
      { status: 503, headers: ADMIN_NO_STORE_HEADERS },
    );
  }
}
