import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { addDaysToIsoDate } from "../app/lib/booking/costa-rica-dates";
import {
  calculateStayPricing,
  findEqualPriorityHolidayOverlaps,
  getMinimumNightsForCheckIn,
  resolveNightlyRate,
} from "../app/lib/pricing/engine";
import type { PricingConfig } from "../app/lib/pricing/types";

const baseConfig: PricingConfig = {
  settings: {
    propertySlug: "riu-house",
    currency: "USD",
    monTueWedRateCents: 10000,
    thursdayRateCents: 12000,
    friSatRateCents: 15000,
    sundayRateCents: 11000,
    cleaningFeeCents: 8000,
    includedGuestCount: 6,
    extraGuestFeeCents: 2500,
    maximumGuestCount: 8,
    active: true,
  },
  minimumStayRules: [
    { checkInDayOfWeek: 0, minimumNights: 1 },
    { checkInDayOfWeek: 1, minimumNights: 1 },
    { checkInDayOfWeek: 2, minimumNights: 1 },
    { checkInDayOfWeek: 3, minimumNights: 1 },
    { checkInDayOfWeek: 4, minimumNights: 2 },
    { checkInDayOfWeek: 5, minimumNights: 2 },
    { checkInDayOfWeek: 6, minimumNights: 2 },
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

describe("minimum stay rules", () => {
  const mon = mondayOnOrAfter(2026, 9, 1);
  const tue = addDaysToIsoDate(mon, 1);
  const wed = addDaysToIsoDate(mon, 2);
  const thu = addDaysToIsoDate(mon, 3);
  const fri = addDaysToIsoDate(mon, 4);
  const sat = addDaysToIsoDate(mon, 5);
  const sun = addDaysToIsoDate(mon, 6);

  it("allows Monday one-night stay", () => {
    assert.equal(calculateStayPricing(mon, addDaysToIsoDate(mon, 1), baseConfig).ok, true);
  });

  it("allows Tuesday one-night stay", () => {
    assert.equal(calculateStayPricing(tue, addDaysToIsoDate(tue, 1), baseConfig).ok, true);
  });

  it("allows Wednesday one-night stay", () => {
    assert.equal(calculateStayPricing(wed, addDaysToIsoDate(wed, 1), baseConfig).ok, true);
  });

  it("rejects Thursday one-night stay", () => {
    const result = calculateStayPricing(thu, addDaysToIsoDate(thu, 1), baseConfig);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error.code, "minimumStayNotMet");
  });

  it("allows Thursday two-night stay", () => {
    assert.equal(calculateStayPricing(thu, addDaysToIsoDate(thu, 2), baseConfig).ok, true);
  });

  it("rejects Friday one-night stay", () => {
    const result = calculateStayPricing(fri, addDaysToIsoDate(fri, 1), baseConfig);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error.code, "minimumStayNotMet");
  });

  it("allows Friday two-night stay", () => {
    assert.equal(calculateStayPricing(fri, addDaysToIsoDate(fri, 2), baseConfig).ok, true);
  });

  it("rejects Saturday one-night stay", () => {
    const result = calculateStayPricing(sat, addDaysToIsoDate(sat, 1), baseConfig);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error.code, "minimumStayNotMet");
  });

  it("allows Saturday two-night stay", () => {
    assert.equal(calculateStayPricing(sat, addDaysToIsoDate(sat, 2), baseConfig).ok, true);
  });

  it("allows Sunday one-night stay", () => {
    assert.equal(calculateStayPricing(sun, addDaysToIsoDate(sun, 1), baseConfig).ok, true);
  });
});

describe("pricing engine", () => {
  const mon = mondayOnOrAfter(2026, 9, 1);
  const fri = addDaysToIsoDate(mon, 4);
  const sun = addDaysToIsoDate(mon, 6);

  it("does not charge checkout date", () => {
    const quote = calculateStayPricing(mon, addDaysToIsoDate(mon, 1), baseConfig);
    assert.equal(quote.ok, true);
    if (quote.ok) {
      assert.equal(quote.quote.nightsCount, 1);
      assert.deepEqual(quote.quote.nightlyBreakdown.map((line) => line.date), [mon]);
    }
  });

  it("applies weekday, Thursday, weekend, and Sunday rates", () => {
    const monQuote = calculateStayPricing(mon, addDaysToIsoDate(mon, 6), baseConfig);
    assert.equal(monQuote.ok, true);
    if (monQuote.ok) {
      assert.equal(monQuote.quote.nightlyBreakdown[0].rateCents, 10000);
      assert.equal(monQuote.quote.nightlyBreakdown[3].rateCents, 12000);
      assert.equal(monQuote.quote.nightlyBreakdown[4].rateCents, 15000);
      assert.equal(monQuote.quote.nightlyBreakdown[5].rateCents, 15000);
    }

    const sunOnly = resolveNightlyRate(sun, baseConfig);
    assert.equal(sunOnly.rateCents, 11000);
    assert.equal(sunOnly.source, "sunday");
  });

  it("applies a 20% holiday increase from the normal rate for that date", () => {
    const fridayHolidayConfig: PricingConfig = {
      ...baseConfig,
      settings: {
        ...baseConfig.settings,
        friSatRateCents: 30000,
      },
      holidayPeriods: [
        {
          id: "holiday-friday",
          name: "Holiday Weekend",
          startDate: fri,
          endDate: fri,
          adjustmentType: "percentage",
          adjustmentValue: 20,
          minimumNights: 2,
          priority: 1,
          active: true,
        },
      ],
    };

    const rate = resolveNightlyRate(fri, fridayHolidayConfig);
    assert.equal(rate.rateCents, 36000);
    assert.equal(rate.source, "holiday");
  });

  it("applies fixed holiday rate override and minimum stay", () => {
    const config: PricingConfig = {
      ...baseConfig,
      holidayPeriods: [
        {
          id: "holiday-1",
          name: "New Year",
          startDate: "2026-12-30",
          endDate: "2027-01-02",
          adjustmentType: "fixed_rate",
          adjustmentValue: 25000,
          minimumNights: 3,
          priority: 10,
          active: true,
        },
      ],
    };

    const rate = resolveNightlyRate("2026-12-31", config);
    assert.equal(rate.rateCents, 25000);
    assert.equal(rate.source, "holiday");

    assert.equal(getMinimumNightsForCheckIn("2026-12-30", config), 3);
    assert.equal(calculateStayPricing("2026-12-30", "2027-01-01", config).ok, false);
    assert.equal(calculateStayPricing("2026-12-30", "2027-01-02", config).ok, true);
  });

  it("applies manual nightly override with highest priority", () => {
    const config: PricingConfig = {
      ...baseConfig,
      holidayPeriods: [
        {
          id: "holiday-1",
          name: "Peak",
          startDate: "2026-10-10",
          endDate: "2026-10-12",
          adjustmentType: "fixed_rate",
          adjustmentValue: 22000,
          minimumNights: 2,
          priority: 5,
          active: true,
        },
      ],
      nightlyOverrides: [
        {
          id: "override-1",
          overrideDate: "2026-10-11",
          nightlyRateCents: 30000,
          minimumNights: 4,
          internalReason: "Special event",
          active: true,
        },
      ],
    };

    const overrideRate = resolveNightlyRate("2026-10-11", config);
    assert.equal(overrideRate.rateCents, 30000);
    assert.equal(overrideRate.source, "override");
    assert.equal(getMinimumNightsForCheckIn("2026-10-11", config), 4);
  });

  it("charges cleaning fee once", () => {
    const quote = calculateStayPricing(mon, addDaysToIsoDate(mon, 3), baseConfig);
    assert.equal(quote.ok, true);
    if (quote.ok) {
      assert.equal(quote.quote.cleaningFeeCents, 8000);
      assert.equal(
        quote.quote.estimatedTotalCents,
        quote.quote.nightlySubtotalCents + 8000,
      );
    }
  });

  it("rejects invalid or reversed ranges", () => {
    assert.equal(calculateStayPricing("2026-09-10", "2026-09-10", baseConfig).ok, false);
    assert.equal(calculateStayPricing("2026-09-11", "2026-09-10", baseConfig).ok, false);
  });

  it("rejects blocked dates", () => {
    const result = calculateStayPricing("2026-09-08", "2026-09-10", baseConfig, [
      { start: "2026-09-09", end: "2026-09-10" },
    ]);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error.code, "blockedDates");
  });

  it("rejects equal-priority overlapping holiday rules", () => {
    const overlaps = findEqualPriorityHolidayOverlaps([
      {
        id: "a",
        name: "A",
        startDate: "2026-12-20",
        endDate: "2026-12-27",
        adjustmentType: "fixed_rate",
        adjustmentValue: 20000,
        minimumNights: 3,
        priority: 1,
        active: true,
      },
      {
        id: "b",
        name: "B",
        startDate: "2026-12-24",
        endDate: "2026-12-31",
        adjustmentType: "fixed_rate",
        adjustmentValue: 25000,
        minimumNights: 3,
        priority: 1,
        active: true,
      },
    ]);
    assert.equal(overlaps.length, 1);
  });

  it("fails closed when pricing is active but incomplete", () => {
    const inconsistentConfig: PricingConfig = {
      ...baseConfig,
      settings: {
        ...baseConfig.settings,
        active: true,
        sundayRateCents: null,
      },
    };

    const result = calculateStayPricing(mon, addDaysToIsoDate(mon, 1), inconsistentConfig);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error.code, "pricingInconsistent");
  });
});

describe("legacy booking compatibility", () => {
  it("allows stays when pricing is inactive", () => {
    const inactiveConfig: PricingConfig = {
      ...baseConfig,
      settings: {
        ...baseConfig.settings,
        active: false,
        monTueWedRateCents: null,
      },
    };
    const result = calculateStayPricing("2026-09-08", "2026-09-09", inactiveConfig);
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.quote.nightlyBreakdown.length, 0);
      assert.equal(result.quote.estimatedTotalCents, 0);
    }
  });
});

describe("additional guest pricing", () => {
  const mon = mondayOnOrAfter(2026, 9, 1);

  it("charges no additional-guest fee for six guests", () => {
    const result = calculateStayPricing(
      mon,
      addDaysToIsoDate(mon, 2),
      baseConfig,
      [],
      { adults: 4, children: 2 },
    );
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.quote.extraGuestCount, 0);
      assert.equal(result.quote.extraGuestTotalCents, 0);
      assert.equal(
        result.quote.estimatedTotalCents,
        result.quote.nightlySubtotalCents + result.quote.cleaningFeeCents,
      );
    }
  });

  it("adds $25 per occupied night for seven guests", () => {
    const result = calculateStayPricing(
      mon,
      addDaysToIsoDate(mon, 2),
      baseConfig,
      [],
      { adults: 5, children: 2 },
    );
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.quote.extraGuestCount, 1);
      assert.equal(result.quote.extraGuestTotalCents, 5000);
      assert.equal(
        result.quote.estimatedTotalCents,
        result.quote.nightlySubtotalCents + 5000 + result.quote.cleaningFeeCents,
      );
    }
  });

  it("adds $50 per occupied night for eight guests", () => {
    const result = calculateStayPricing(
      mon,
      addDaysToIsoDate(mon, 2),
      baseConfig,
      [],
      { adults: 6, children: 2 },
    );
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.quote.extraGuestCount, 2);
      assert.equal(result.quote.extraGuestTotalCents, 10000);
    }
  });

  it("multiplies additional-guest fees by occupied nights", () => {
    const result = calculateStayPricing(
      mon,
      addDaysToIsoDate(mon, 3),
      baseConfig,
      [],
      { adults: 7, children: 0 },
    );
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.quote.nightsCount, 3);
      assert.equal(result.quote.extraGuestCount, 1);
      assert.equal(result.quote.extraGuestTotalCents, 7500);
    }
  });

  it("does not charge the checkout date for additional guests", () => {
    const result = calculateStayPricing(
      mon,
      addDaysToIsoDate(mon, 1),
      baseConfig,
      [],
      { adults: 7, children: 0 },
    );
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.quote.nightsCount, 1);
      assert.equal(result.quote.extraGuestTotalCents, 2500);
    }
  });

  it("charges the cleaning fee once regardless of guest count", () => {
    const sixGuests = calculateStayPricing(
      mon,
      addDaysToIsoDate(mon, 2),
      baseConfig,
      [],
      { adults: 6, children: 0 },
    );
    const eightGuests = calculateStayPricing(
      mon,
      addDaysToIsoDate(mon, 2),
      baseConfig,
      [],
      { adults: 8, children: 0 },
    );
    assert.equal(sixGuests.ok, true);
    assert.equal(eightGuests.ok, true);
    if (sixGuests.ok && eightGuests.ok) {
      assert.equal(sixGuests.quote.cleaningFeeCents, 8000);
      assert.equal(eightGuests.quote.cleaningFeeCents, 8000);
    }
  });

  it("rejects more than eight guests", () => {
    const result = calculateStayPricing(
      mon,
      addDaysToIsoDate(mon, 2),
      baseConfig,
      [],
      { adults: 7, children: 2 },
    );
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error.code, "tooManyGuests");
  });
});
