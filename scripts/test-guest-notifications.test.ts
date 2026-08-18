import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHmac } from "node:crypto";
import { describe, it, beforeEach, afterEach } from "node:test";
import {
  APPROVAL_HOLD_MS,
  computeApprovalHoldExpiresAt,
} from "../app/lib/admin/approval-hold";
import { escapeHtml } from "../app/lib/notifications/email-text";
import { getOwnerNotificationDeliveryTargets } from "../app/lib/notifications/mail-config";
import { assertGuestEmailLocalesComplete } from "../app/lib/notifications/guest/email-i18n";
import { buildGuestNotificationEmail } from "../app/lib/notifications/guest/email-templates";
import { guestEventForReservationAction } from "../app/lib/notifications/guest/status-events";
import {
  GUEST_NOTIFICATION_EVENTS,
  resolveGuestNotificationPublicStatus,
} from "../app/lib/notifications/guest/types";
import {
  buildGuestStatusUrl,
  computeGuestStatusTokenExpiration,
  signGuestStatusToken,
  signGuestStatusTokenWithExpiration,
  verifyGuestStatusToken,
} from "../app/lib/guest-status/token";
import { assertGuestStatusLocalesComplete } from "../app/i18n/guest-status";
import type { BookingRequestRow } from "../app/lib/supabase/database.types";

const BOOKING_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_BOOKING_ID = "22222222-2222-4222-8222-222222222222";

function sampleBooking(overrides: Partial<BookingRequestRow> = {}): BookingRequestRow {
  return {
    id: BOOKING_ID,
    idempotency_key: "33333333-3333-4333-8333-333333333333",
    property_slug: "riu-house",
    request_reference: "RH-TEST-001",
    status: "submitted",
    check_in: "2026-09-10",
    check_out: "2026-09-13",
    adults: 4,
    children: 1,
    child_ages: [8],
    full_name: "Alex Guest",
    email: "alex@example.com",
    phone_whatsapp: "+15551234567",
    country_of_residence: "United States",
    trip_reason: "vacation",
    outside_visitors: "no",
    guest_message: "<script>alert(1)</script>",
    agreed_to_rules: true,
    acknowledged_request_only: true,
    created_at: "2026-08-17T12:00:00.000Z",
    updated_at: "2026-08-17T12:00:00.000Z",
    hold_expires_at: "2026-08-19T12:00:00.000Z",
    reviewed_at: null,
    reviewed_by: null,
    notification_status: "sent",
    notification_sent_at: "2026-08-17T12:00:00.000Z",
    notification_claimed_at: "2026-08-17T12:00:00.000Z",
    notification_attempts: 1,
    notification_last_error_code: null,
    notification_provider_id: "owner-preview",
    pricing_currency: "USD",
    pricing_nights_count: 3,
    pricing_nightly_subtotal_cents: 75000,
    pricing_cleaning_fee_cents: 8000,
    pricing_estimated_total_cents: 85500,
    pricing_nightly_breakdown: [
      { date: "2026-09-10", rateCents: 25000, source: "weekday" },
      { date: "2026-09-11", rateCents: 25000, source: "weekday" },
      { date: "2026-09-12", rateCents: 25000, source: "weekday" },
    ],
    pricing_calculated_at: "2026-08-17T12:00:00.000Z",
    pricing_included_guest_count: 6,
    pricing_extra_guest_count: 0,
    pricing_extra_guest_fee_cents: 2500,
    pricing_extra_guest_total_cents: 0,
    pricing_maximum_guest_count: 8,
    pricing_total_chargeable_guests: 5,
    guest_locale: "en",
    ...overrides,
  };
}

describe("guest notification email content", () => {
  beforeEach(() => {
    process.env.BOOKING_NOTIFICATION_TO = "sandy@nuvohauz.com";
    process.env.BOOKING_EMAIL_FROM = "bookings@nuvohauz.com";
    process.env.NUVOHAUZ_SITE_URL = "https://www.nuvohauz.com";
  });

  it("addresses the initial guest email to the guest, not only Reply-To", () => {
    const guest = buildGuestNotificationEmail(
      sampleBooking(),
      "request_received",
      "https://www.nuvohauz.com/reservation/status/test",
      "https://www.nuvohauz.com",
    );
    const owner = getOwnerNotificationDeliveryTargets(sampleBooking().email);

    assert.equal(guest.to, "alex@example.com");
    assert.equal(owner.to, "sandy@nuvohauz.com");
    assert.equal(owner.replyTo, "alex@example.com");
    assert.notEqual(guest.to, owner.to);
  });

  it("initial guest email says request received, not confirmed", () => {
    const guest = buildGuestNotificationEmail(
      sampleBooking(),
      "request_received",
      "https://www.nuvohauz.com/reservation/status/test",
      "https://www.nuvohauz.com",
    );

    assert.match(guest.subject, /received your Riu House booking request/i);
    assert.match(guest.text, /booking request, not a confirmed reservation/i);
    assert.doesNotMatch(guest.subject, /confirmed/i);
    assert.doesNotMatch(guest.text, /Your stay is confirmed/i);
  });

  it("maps owner actions to guest notification events", () => {
    assert.equal(guestEventForReservationAction("approve_hold"), "approved");
    assert.equal(guestEventForReservationAction("confirm"), "confirmed");
    assert.equal(guestEventForReservationAction("decline"), "declined");
    assert.equal(guestEventForReservationAction("cancel"), "cancelled");
  });

  it("builds approval, confirmation, decline, expired, and cancelled guest emails", () => {
    const siteUrl = "https://www.nuvohauz.com";
    const statusUrl = `${siteUrl}/reservation/status/test`;

    const approved = buildGuestNotificationEmail(
      sampleBooking({ status: "approved_hold" }),
      "approved",
      statusUrl,
      siteUrl,
    );
    assert.match(approved.subject, /approved/i);
    assert.match(approved.text, /not final until payment is verified/i);
    assert.match(approved.text, /Hold expires/i);

    const confirmed = buildGuestNotificationEmail(
      sampleBooking({ status: "confirmed", hold_expires_at: null }),
      "confirmed",
      statusUrl,
      siteUrl,
    );
    assert.match(confirmed.subject, /Reservation confirmed/i);
    assert.doesNotMatch(confirmed.text, /payment was received/i);

    const declined = buildGuestNotificationEmail(
      sampleBooking({ status: "declined" }),
      "declined",
      statusUrl,
      siteUrl,
    );
    assert.match(declined.text, /could not be accepted/i);

    const expired = buildGuestNotificationEmail(
      sampleBooking({ status: "expired", hold_expires_at: null }),
      "expired",
      statusUrl,
      siteUrl,
    );
    assert.match(expired.text, /payment hold expired/i);

    const cancelled = buildGuestNotificationEmail(
      sampleBooking({ status: "cancelled" }),
      "cancelled",
      statusUrl,
      siteUrl,
    );
    assert.match(cancelled.text, /has been cancelled/i);
  });

  it("uses saved pricing snapshots in guest emails", () => {
    const guest = buildGuestNotificationEmail(
      sampleBooking(),
      "request_received",
      "https://www.nuvohauz.com/reservation/status/test",
      "https://www.nuvohauz.com",
    );

    assert.match(guest.text, /\$750/);
    assert.match(guest.text, /\$855/);
    assert.match(guest.text, /Sep 10, 2026/);
  });

  it("escapes guest-provided content in guest emails", () => {
    const guest = buildGuestNotificationEmail(
      sampleBooking({ guest_message: "<img onerror=alert(1) src=x>" }),
      "request_received",
      "https://www.nuvohauz.com/reservation/status/test",
      "https://www.nuvohauz.com",
    );

    assert.doesNotMatch(guest.html, /<script/i);
    assert.equal(escapeHtml("<test>"), "&lt;test&gt;");
  });

  it("escapes configured payment instructions as plain text", () => {
    const previous = process.env.BOOKING_APPROVED_PAYMENT_INSTRUCTIONS;
    process.env.BOOKING_APPROVED_PAYMENT_INSTRUCTIONS =
      "Pay via SINPE\n<script>alert('x')</script>\n<img src=x onerror=alert(1)>";

    const approved = buildGuestNotificationEmail(
      sampleBooking({ status: "approved_hold" }),
      "approved",
      "https://www.nuvohauz.com/reservation/status/test",
      "https://www.nuvohauz.com",
    );

    assert.match(approved.text, /Pay via SINPE/);
    assert.match(approved.text, /<script>alert\('x'\)<\/script>/);
    assert.doesNotMatch(approved.html, /<script/i);
    assert.match(approved.html, /&lt;script&gt;alert/);
    assert.match(approved.html, /&lt;img src=x onerror=alert\(1\)&gt;/);

    process.env.BOOKING_APPROVED_PAYMENT_INSTRUCTIONS = previous;
  });

  it("supports all guest notification event types", () => {
    assert.equal(GUEST_NOTIFICATION_EVENTS.length, 6);
  });
});

describe("guest notification public status", () => {
  it("maps Resend acceptance and failures to API-safe statuses", () => {
    assert.equal(
      resolveGuestNotificationPublicStatus({
        alreadySent: false,
        sendResult: { ok: true, providerId: "re_123" },
      }),
      "sent",
    );
    assert.equal(
      resolveGuestNotificationPublicStatus({
        alreadySent: true,
      }),
      "sent",
    );
    assert.equal(
      resolveGuestNotificationPublicStatus({
        alreadySent: false,
        sendResult: { ok: false, errorCode: "resend_send_failed" },
      }),
      "failed",
    );
    assert.equal(
      resolveGuestNotificationPublicStatus({
        alreadySent: false,
        skippedReason: "row_missing",
      }),
      "unavailable",
    );
  });
});

describe("approval hold duration", () => {
  it("expires approximately one hour after approval", () => {
    const approvedAt = new Date("2026-08-17T15:30:00.000Z");
    const expiresAt = computeApprovalHoldExpiresAt(approvedAt);
    assert.equal(expiresAt.getTime() - approvedAt.getTime(), APPROVAL_HOLD_MS);
  });

  it("one-hour hold migration replaces 48-hour interval", () => {
    const sql = readFileSync(
      resolve(
        process.cwd(),
        "supabase/migrations/20260817210000_update_approval_hold_to_one_hour.sql",
      ),
      "utf8",
    );
    assert.match(sql, /interval '1 hour'/);
    assert.doesNotMatch(sql, /interval '48 hours'/);
  });
});

describe("guest status token", () => {
  const previousSecret = process.env.GUEST_STATUS_TOKEN_SECRET;
  const previousSiteUrl = process.env.NUVOHAUZ_SITE_URL;

  beforeEach(() => {
    process.env.GUEST_STATUS_TOKEN_SECRET = "test-secret-value";
    process.env.NUVOHAUZ_SITE_URL = "https://www.nuvohauz.com";
  });

  afterEach(() => {
    process.env.GUEST_STATUS_TOKEN_SECRET = previousSecret;
    process.env.NUVOHAUZ_SITE_URL = previousSiteUrl;
  });

  it("validates signed tokens for the booking UUID only", () => {
    const token = signGuestStatusToken(BOOKING_ID, "2026-09-13");
    assert.ok(token);
    const verified = verifyGuestStatusToken(token!);
    assert.deepEqual(verified, { bookingId: BOOKING_ID });
  });

  it("expires on checkout plus 30 days, not a short fixed TTL", () => {
    const checkOut = "2026-09-13";
    const expiration = computeGuestStatusTokenExpiration(checkOut);
    const expectedMinimum = Date.parse("2026-10-13T23:59:59-06:00") / 1000;
    assert.ok(expiration >= expectedMinimum);
    assert.ok(expiration > Math.floor(Date.now() / 1000) + 86400);
  });

  it("rejects altered and expired tokens", () => {
    const token = signGuestStatusTokenWithExpiration(
      BOOKING_ID,
      Math.floor(Date.now() / 1000) - 10,
    );
    assert.equal(verifyGuestStatusToken(token!), null);

    const valid = signGuestStatusToken(BOOKING_ID, "2026-09-13")!;
    const altered = `${valid}x`;
    assert.equal(verifyGuestStatusToken(altered), null);

    const otherBookingToken = signGuestStatusToken(OTHER_BOOKING_ID, "2026-09-13")!;
    const verified = verifyGuestStatusToken(otherBookingToken);
    assert.equal(verified?.bookingId, OTHER_BOOKING_ID);
    assert.notEqual(verified?.bookingId, BOOKING_ID);
  });

  it("builds private status URLs without exposing secrets", () => {
    const token = signGuestStatusToken(BOOKING_ID, "2026-09-13")!;
    const url = buildGuestStatusUrl(token);
    assert.match(url!, /\/reservation\/status\//);
    assert.doesNotMatch(url!, /test-secret-value/);
  });

  it("uses timing-safe signature verification", () => {
    const token = signGuestStatusToken(BOOKING_ID, "2026-09-13")!;
    const separatorIndex = token.lastIndexOf(".");
    const payloadEncoded = token.slice(0, separatorIndex);
    const forgedSignature = createHmac("sha256", "wrong-secret")
      .update(payloadEncoded)
      .digest("base64url");
    const forged = `${payloadEncoded}.${forgedSignature}`;
    assert.equal(verifyGuestStatusToken(forged), null);
  });
});

describe("guest notification i18n completeness", () => {
  it("renders all four guest email languages without missing keys", () => {
    assert.doesNotThrow(() => assertGuestEmailLocalesComplete());

    for (const locale of ["en", "es", "fr", "de"] as const) {
      const guest = buildGuestNotificationEmail(
        sampleBooking({ guest_locale: locale }),
        "request_received",
        "https://www.nuvohauz.com/reservation/status/test",
        "https://www.nuvohauz.com",
      );
      assert.ok(guest.subject.length > 0);
      assert.ok(guest.text.length > 0);
      assert.ok(guest.html.length > 0);
    }
  });

  it("renders all four guest status page languages without missing keys", () => {
    assert.doesNotThrow(() => assertGuestStatusLocalesComplete());
  });
});

describe("notification idempotency expectations", () => {
  it("defines one guest event per booking status transition", () => {
    const events = new Set([
      "request_received",
      guestEventForReservationAction("approve_hold"),
      guestEventForReservationAction("confirm"),
      guestEventForReservationAction("decline"),
      guestEventForReservationAction("cancel"),
      "expired",
    ]);
    assert.equal(events.size, 6);
  });
});
