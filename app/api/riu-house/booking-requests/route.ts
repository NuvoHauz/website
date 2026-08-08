import { NextResponse, type NextRequest } from "next/server";
import type { OutsideVisitors, TripReason } from "../../../i18n/riu-house/booking/types";
import {
  ACTIVE_BLOCK_STATUS,
  RIU_HOUSE_PROPERTY_SLUG,
  sanitizeBlockedRanges,
} from "../../../lib/booking/blocked-ranges";
import {
  isStayRangeValid,
  mapOutsideVisitorsToDatabase,
  mapTripReasonToDatabase,
  validateBookingRequestPayload,
  type BookingRequestPayload,
} from "../../../lib/booking/server-validation";
import { getSupabaseAdmin } from "../../../lib/supabase/server";
import { getTodayInCostaRica } from "../../../lib/booking/costa-rica-dates";
import { getAvailabilityHorizonEnd } from "../../../lib/booking/server-validation";

export const dynamic = "force-dynamic";

const IDEMPOTENCY_HEADER = "idempotency-key";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

function successResponse(requestReference: string) {
  return NextResponse.json({
    success: true,
    requestReference,
  });
}

function isAllowedOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host = request.headers.get("host");
  if (!host) return false;
  try {
    const originHost = new URL(origin).host;
    return originHost === host;
  } catch {
    return false;
  }
}

async function loadBlockedRanges() {
  const supabase = getSupabaseAdmin();
  const horizonStart = getTodayInCostaRica();
  const horizonEnd = getAvailabilityHorizonEnd();

  const { data, error } = await supabase
    .from("availability_blocks")
    .select("start_date, end_date")
    .eq("property_slug", RIU_HOUSE_PROPERTY_SLUG)
    .eq("status", ACTIVE_BLOCK_STATUS)
    .lt("start_date", horizonEnd)
    .gt("end_date", horizonStart);

  if (error) {
    throw new Error("availability lookup failed");
  }

  return sanitizeBlockedRanges(
    (data ?? []).map((row) => ({
      start: row.start_date,
      end: row.end_date,
    })),
  );
}

export async function POST(request: NextRequest) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const idempotencyKey = request.headers.get(IDEMPOTENCY_HEADER)?.trim();
  if (!idempotencyKey || !isValidUuid(idempotencyKey)) {
    return NextResponse.json({ error: "invalid_idempotency_key" }, { status: 400 });
  }

  let body: BookingRequestPayload;
  try {
    body = (await request.json()) as BookingRequestPayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();

    const { data: existing, error: existingError } = await supabase
      .from("booking_requests")
      .select("request_reference")
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();

    if (existingError) {
      console.error("booking_requests idempotency lookup failed");
      return NextResponse.json({ error: "submit_failed" }, { status: 503 });
    }

    if (existing?.request_reference) {
      return successResponse(existing.request_reference);
    }

    const blockedRanges = await loadBlockedRanges();
    const validation = validateBookingRequestPayload(body, blockedRanges);

    if (!validation.ok) {
      if (validation.errors.includes("spamDetected")) {
        return NextResponse.json({ error: "spam_detected" }, { status: 400 });
      }
      return NextResponse.json(
        { error: "validation_failed", fields: validation.errors },
        { status: 400 },
      );
    }

    const data = validation.data;

    if (!isStayRangeValid(data.checkIn, data.checkOut, blockedRanges)) {
      return NextResponse.json(
        { error: "validation_failed", fields: ["invalidStayRange"] },
        { status: 409 },
      );
    }

    const insertRow = {
      idempotency_key: idempotencyKey,
      property_slug: RIU_HOUSE_PROPERTY_SLUG,
      check_in: data.checkIn,
      check_out: data.checkOut,
      adults: data.adults,
      children: data.children,
      child_ages: data.childAges,
      full_name: data.fullName,
      email: data.email,
      phone_whatsapp: data.phone,
      country_of_residence: data.country,
      trip_reason: mapTripReasonToDatabase(data.tripReason as TripReason),
      outside_visitors: mapOutsideVisitorsToDatabase(
        data.outsideVisitors as OutsideVisitors,
      ),
      guest_message: data.message,
      agreed_to_rules: data.agreedHouseRules,
      acknowledged_request_only: data.agreedRequest,
    };

    const { data: inserted, error: insertError } = await supabase
      .from("booking_requests")
      .insert(insertRow)
      .select("request_reference")
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        const { data: raced } = await supabase
          .from("booking_requests")
          .select("request_reference")
          .eq("idempotency_key", idempotencyKey)
          .maybeSingle();

        if (raced?.request_reference) {
          return successResponse(raced.request_reference);
        }
      }

      console.error("booking_requests insert failed");
      return NextResponse.json({ error: "submit_failed" }, { status: 503 });
    }

    if (!inserted?.request_reference) {
      console.error("booking_requests insert missing request_reference");
      return NextResponse.json({ error: "submit_failed" }, { status: 503 });
    }

    return successResponse(inserted.request_reference);
  } catch {
    console.error("booking-requests route error");
    return NextResponse.json({ error: "submit_failed" }, { status: 503 });
  }
}
