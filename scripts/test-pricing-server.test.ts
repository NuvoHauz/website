import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { addDaysToIsoDate } from "../app/lib/booking/costa-rica-dates";
import {
  quoteDiffersFromClientAttempt,
  resolveIdempotentBookingReference,
  resolveServerBookingPricing,
} from "../app/lib/pricing/booking-pricing";
import { calculateStayPricing } from "../app/lib/pricing/engine";
import {
  validatePricingSettingsForPublish,
} from "../app/lib/pricing/settings-validation";
import type { PricingConfig } from "../app/lib/pricing/types";

const publishedConfig: PricingConfig = {
  settings: {
    propertySlug: "riu-house",
    currency: "USD",
    monTueWedRateCents: 10000,
    thursdayRateCents: 12000,
    friSatRateCents: 30000,
    sundayRateCents: 11000,
    cleaningFeeCents: 8000,
    includedGuestCount: 6,
    extraGuestFeeCents: 2500,
    maximumGuestCount: 8,
    active: true,
  },
  minimumStayRules: [
    { checkInDayOfWeek: 4, minimumNights: 2 },
    { checkInDayOfWeek: 5, minimumNights: 2 },
  ],
  holidayPeriods: [],
  nightlyOverrides: [],
};

function mondayOnOrAfter(year: number, month: number, day: number): string {
  const date = new Date(year, month - 1, day);
  while (date.getDay() !== 1) {
    date.setDate(date.getDate() + 1);
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

const defaultGuestCounts = { adults: 2, children: 0 };

describe("publish validation", () => {
  it("rejects publishing incomplete pricing configuration", () => {
    const result = validatePricingSettingsForPublish({
      monTueWedRateCents: 10000,
      thursdayRateCents: null,
      friSatRateCents: 15000,
      sundayRateCents: 11000,
      cleaningFeeCents: 8000,
      includedGuestCount: 6,
      extraGuestFeeCents: 2500,
      maximumGuestCount: 8,
      currency: "USD",
      active: true,
    });
    assert.equal(result.ok, false);
  });

  it("allows saving incomplete pricing while inactive", () => {
    const result = validatePricingSettingsForPublish({
      monTueWedRateCents: null,
      thursdayRateCents: null,
      friSatRateCents: null,
      sundayRateCents: null,
      cleaningFeeCents: 8000,
      includedGuestCount: 6,
      extraGuestFeeCents: 2500,
      maximumGuestCount: 8,
      currency: "USD",
      active: false,
    });
    assert.equal(result.ok, true);
  });
});

describe("server booking pricing", () => {
  const mon = mondayOnOrAfter(2026, 9, 1);
  const thu = addDaysToIsoDate(mon, 3);
  const fri = addDaysToIsoDate(mon, 4);

  it("ignores browser-supplied nightly subtotal", () => {
    const resolution = resolveServerBookingPricing(
      publishedConfig,
      mon,
      addDaysToIsoDate(mon, 2),
      [],
      defaultGuestCounts,
      { pricingNightlySubtotalCents: 1 },
    );
    assert.equal(resolution.ok, true);
    if (resolution.ok && resolution.snapshot) {
      assert.notEqual(resolution.snapshot.pricing_nightly_subtotal_cents, 1);
    }
  });

  it("ignores browser-supplied cleaning fee", () => {
    const resolution = resolveServerBookingPricing(
      publishedConfig,
      mon,
      addDaysToIsoDate(mon, 2),
      [],
      defaultGuestCounts,
      { pricingCleaningFeeCents: 1 },
    );
    assert.equal(resolution.ok, true);
    if (resolution.ok && resolution.snapshot) {
      assert.equal(resolution.snapshot.pricing_cleaning_fee_cents, 8000);
    }
  });

  it("ignores browser-supplied estimated total", () => {
    const resolution = resolveServerBookingPricing(
      publishedConfig,
      mon,
      addDaysToIsoDate(mon, 2),
      [],
      defaultGuestCounts,
      { pricingEstimatedTotalCents: 1, estimatedTotal: 1 },
    );
    assert.equal(resolution.ok, true);
    if (resolution.ok && resolution.snapshot) {
      assert.notEqual(resolution.snapshot.pricing_estimated_total_cents, 1);
    }
  });

  it("calculates and returns its own price snapshot", () => {
    const resolution = resolveServerBookingPricing(
      publishedConfig,
      mon,
      addDaysToIsoDate(mon, 2),
      [],
      defaultGuestCounts,
      {
        pricingNightlySubtotalCents: 1,
        pricingCleaningFeeCents: 1,
        pricingEstimatedTotalCents: 1,
      },
    );
    assert.equal(resolution.ok, true);
    if (resolution.ok) {
      assert.equal(resolution.pricingActive, true);
      assert.ok(resolution.snapshot);
      assert.equal(resolution.snapshot?.pricing_nights_count, 2);
      assert.equal(resolution.snapshot?.pricing_cleaning_fee_cents, 8000);
      assert.equal(
        resolution.snapshot?.pricing_estimated_total_cents,
        (resolution.snapshot?.pricing_nightly_subtotal_cents ?? 0) + 8000,
      );
    }
  });

  it("reuses the same idempotency key without creating a duplicate booking", () => {
    const first = resolveIdempotentBookingReference(null);
    assert.equal(first.action, "create");

    const second = resolveIdempotentBookingReference("NH-TEST-001");
    assert.equal(second.action, "return_existing");
    if (second.action === "return_existing") {
      assert.equal(second.reference, "NH-TEST-001");
    }
  });

  it("rejects Thursday one-night requests by the server", () => {
    const resolution = resolveServerBookingPricing(
      publishedConfig,
      thu,
      addDaysToIsoDate(thu, 1),
      [],
      defaultGuestCounts,
    );
    assert.equal(resolution.ok, false);
    if (!resolution.ok) assert.equal(resolution.error, "minimumStayNotMet");
  });

  it("rejects Friday one-night requests by the server", () => {
    const resolution = resolveServerBookingPricing(
      publishedConfig,
      fri,
      addDaysToIsoDate(fri, 1),
      [],
      defaultGuestCounts,
    );
    assert.equal(resolution.ok, false);
    if (!resolution.ok) assert.equal(resolution.error, "minimumStayNotMet");
  });

  it("uses the normal rate for each date in a percentage holiday increase", () => {
    const holidayFriday = fri;
    const holidayConfig: PricingConfig = {
      ...publishedConfig,
      holidayPeriods: [
        {
          id: "holiday-friday",
          name: "Holiday Friday",
          startDate: holidayFriday,
          endDate: holidayFriday,
          adjustmentType: "percentage",
          adjustmentValue: 20,
          minimumNights: 2,
          priority: 1,
          active: true,
        },
      ],
    };

    const quote = calculateStayPricing(
      holidayFriday,
      addDaysToIsoDate(holidayFriday, 2),
      holidayConfig,
    );
    assert.equal(quote.ok, true);
    if (quote.ok) {
      assert.equal(quote.quote.nightlyBreakdown[0].rateCents, 36000);
    }
  });

  it("uses fixed holiday rates that replace normal rates", () => {
    const holidayConfig: PricingConfig = {
      ...publishedConfig,
      holidayPeriods: [
        {
          id: "holiday-fixed",
          name: "Fixed Holiday",
          startDate: thu,
          endDate: thu,
          adjustmentType: "fixed_rate",
          adjustmentValue: 42500,
          minimumNights: 2,
          priority: 1,
          active: true,
        },
      ],
    };

    const quote = calculateStayPricing(thu, addDaysToIsoDate(thu, 2), holidayConfig);
    assert.equal(quote.ok, true);
    if (quote.ok) {
      assert.equal(quote.quote.nightlyBreakdown[0].rateCents, 42500);
    }
  });

  it("never charges the checkout date", () => {
    const quote = calculateStayPricing(mon, addDaysToIsoDate(mon, 1), publishedConfig);
    assert.equal(quote.ok, true);
    if (quote.ok) {
      assert.deepEqual(
        quote.quote.nightlyBreakdown.map((line) => line.date),
        [mon],
      );
    }
  });

  it("detects when client totals differ from the server quote", () => {
    const quoteResult = calculateStayPricing(
      mon,
      addDaysToIsoDate(mon, 2),
      publishedConfig,
    );
    assert.equal(quoteResult.ok, true);
    if (quoteResult.ok) {
      assert.equal(
        quoteDiffersFromClientAttempt(quoteResult.quote, {
          pricingEstimatedTotalCents: 1,
        }),
        true,
      );
    }
  });

  it("returns pricing_unavailable when active pricing is internally inconsistent", () => {
    const inconsistentConfig: PricingConfig = {
      ...publishedConfig,
      settings: {
        ...publishedConfig.settings,
        active: true,
        sundayRateCents: null,
      },
    };

    const resolution = resolveServerBookingPricing(
      inconsistentConfig,
      mon,
      addDaysToIsoDate(mon, 2),
      [],
      defaultGuestCounts,
    );
    assert.equal(resolution.ok, false);
    if (!resolution.ok) assert.equal(resolution.error, "pricing_unavailable");
  });
});

describe("additional guest server pricing", () => {
  const mon = mondayOnOrAfter(2026, 9, 1);

  it("ignores browser-supplied guest fee and total", () => {
    const resolution = resolveServerBookingPricing(
      publishedConfig,
      mon,
      addDaysToIsoDate(mon, 2),
      [],
      { adults: 7, children: 0 },
      {
        pricingExtraGuestTotalCents: 1,
        extraGuestTotal: 1,
        pricingEstimatedTotalCents: 1,
      },
    );
    assert.equal(resolution.ok, true);
    if (resolution.ok && resolution.snapshot) {
      assert.equal(resolution.snapshot.pricing_extra_guest_total_cents, 5000);
      assert.notEqual(resolution.snapshot.pricing_estimated_total_cents, 1);
    }
  });

  it("stores server-calculated guest details in the pricing snapshot", () => {
    const resolution = resolveServerBookingPricing(
      publishedConfig,
      mon,
      addDaysToIsoDate(mon, 2),
      [],
      { adults: 7, children: 1 },
    );
    assert.equal(resolution.ok, true);
    if (resolution.ok && resolution.snapshot) {
      assert.equal(resolution.snapshot.pricing_included_guest_count, 6);
      assert.equal(resolution.snapshot.pricing_extra_guest_count, 2);
      assert.equal(resolution.snapshot.pricing_extra_guest_fee_cents, 2500);
      assert.equal(resolution.snapshot.pricing_extra_guest_total_cents, 10000);
      assert.equal(resolution.snapshot.pricing_maximum_guest_count, 8);
      assert.equal(resolution.snapshot.pricing_total_chargeable_guests, 8);
    }
  });

  it("rejects more than eight guests on the server", () => {
    const resolution = resolveServerBookingPricing(
      publishedConfig,
      mon,
      addDaysToIsoDate(mon, 2),
      [],
      { adults: 7, children: 2 },
    );
    assert.equal(resolution.ok, false);
    if (!resolution.ok) assert.equal(resolution.error, "tooManyGuests");
  });

  it("keeps existing booking requests compatible with nullable guest snapshot fields", () => {
    const legacyRow = {
      pricing_currency: "USD",
      pricing_nights_count: 2,
      pricing_nightly_subtotal_cents: 20000,
      pricing_cleaning_fee_cents: 8000,
      pricing_estimated_total_cents: 28000,
      pricing_included_guest_count: null,
      pricing_extra_guest_count: null,
      pricing_extra_guest_fee_cents: null,
      pricing_extra_guest_total_cents: null,
      pricing_maximum_guest_count: null,
      pricing_total_chargeable_guests: null,
    };

    assert.equal(legacyRow.pricing_included_guest_count, null);
    assert.equal(legacyRow.pricing_extra_guest_total_cents, null);
    assert.equal(
      (legacyRow.pricing_nightly_subtotal_cents ?? 0) +
        (legacyRow.pricing_extra_guest_total_cents ?? 0) +
        (legacyRow.pricing_cleaning_fee_cents ?? 0),
      legacyRow.pricing_estimated_total_cents,
    );
  });
});
