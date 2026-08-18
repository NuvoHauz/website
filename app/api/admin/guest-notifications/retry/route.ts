import { NextResponse, type NextRequest } from "next/server";
import {
  ADMIN_NO_STORE_HEADERS,
  isAllowedAdminOrigin,
  requireOwnerSession,
} from "../../../../lib/admin/auth";
import { AdminAuthConfigError } from "../../../../lib/admin/session";
import { retryGuestNotification } from "../../../../lib/notifications/guest/guest-notification-service";
import type { GuestNotificationEvent } from "../../../../lib/notifications/guest/types";
import { getSupabaseAdmin } from "../../../../lib/supabase/server";
import { isValidUuid } from "../../../../lib/admin/validation";
import { GUEST_NOTIFICATION_EVENTS } from "../../../../lib/notifications/guest/types";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json(
    { error: "unauthorized" },
    { status: 401, headers: ADMIN_NO_STORE_HEADERS },
  );
}

function isGuestNotificationEvent(value: string): value is GuestNotificationEvent {
  return (GUEST_NOTIFICATION_EVENTS as readonly string[]).includes(value);
}

export async function POST(request: NextRequest) {
  if (!isAllowedAdminOrigin(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  try {
    await requireOwnerSession();
    const body = (await request.json()) as {
      bookingRequestId?: string;
      eventType?: string;
    };

    const bookingRequestId = body.bookingRequestId?.trim() ?? "";
    const eventType = body.eventType?.trim() ?? "";

    if (!isValidUuid(bookingRequestId) || !isGuestNotificationEvent(eventType)) {
      return NextResponse.json({ error: "validation_failed" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const result = await retryGuestNotification(
      supabase,
      bookingRequestId,
      eventType,
    );

    if (result === "not_found") {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    if (result === "not_retryable") {
      return NextResponse.json({ error: "not_retryable" }, { status: 409 });
    }

    return NextResponse.json({ success: true }, { headers: ADMIN_NO_STORE_HEADERS });
  } catch (error) {
    if (error instanceof AdminAuthConfigError) {
      return NextResponse.json(
        { error: "admin_not_configured", message: error.message },
        { status: 503, headers: ADMIN_NO_STORE_HEADERS },
      );
    }
    if (error instanceof Error && error.message === "unauthenticated") {
      return unauthorized();
    }
    console.error("guest notification retry failed");
    return NextResponse.json(
      { error: "retry_failed" },
      { status: 503, headers: ADMIN_NO_STORE_HEADERS },
    );
  }
}
