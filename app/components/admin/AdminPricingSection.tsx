"use client";

import { useCallback, useEffect, useState } from "react";
import { formatCentsAsUsd } from "../../lib/pricing/engine";
import type {
  HolidayPricingPeriod,
  NightlyOverride,
  PropertyPricingSettings,
} from "../../lib/pricing/types";

type MinimumStayRuleView = {
  checkInDayOfWeek: number;
  minimumNights: number;
  label: string;
};

type AdminPricingResponse = {
  settings: PropertyPricingSettings;
  minimumStayRules: MinimumStayRuleView[];
  holidayPeriods: HolidayPricingPeriod[];
  nightlyOverrides: NightlyOverride[];
};

const inputClassName =
  "mt-1 w-full min-h-[44px] rounded-xl border border-[#111111]/10 bg-white px-3 py-2 text-sm";

function centsToInput(cents: number | null): string {
  return cents == null ? "" : String(cents / 100);
}

export default function AdminPricingSection() {
  const [data, setData] = useState<AdminPricingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [monTueWedRate, setMonTueWedRate] = useState("");
  const [thursdayRate, setThursdayRate] = useState("");
  const [friSatRate, setFriSatRate] = useState("");
  const [sundayRate, setSundayRate] = useState("");
  const [cleaningFee, setCleaningFee] = useState("80");
  const [includedGuestCount, setIncludedGuestCount] = useState("6");
  const [extraGuestFee, setExtraGuestFee] = useState("25");
  const [maximumGuestCount, setMaximumGuestCount] = useState("8");
  const [active, setActive] = useState(false);

  const [holidayName, setHolidayName] = useState("");
  const [holidayStart, setHolidayStart] = useState("");
  const [holidayEnd, setHolidayEnd] = useState("");
  const [holidayType, setHolidayType] = useState<"fixed_rate" | "percentage">("fixed_rate");
  const [holidayValue, setHolidayValue] = useState("");
  const [holidayMinNights, setHolidayMinNights] = useState("3");

  const [overrideDate, setOverrideDate] = useState("");
  const [overrideRate, setOverrideRate] = useState("");
  const [overrideMinNights, setOverrideMinNights] = useState("");
  const [overrideReason, setOverrideReason] = useState("");

  const loadPricing = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/pricing", { cache: "no-store" });
      if (!response.ok) throw new Error("load failed");
      const payload = (await response.json()) as AdminPricingResponse;
      setData(payload);
      setMonTueWedRate(centsToInput(payload.settings.monTueWedRateCents));
      setThursdayRate(centsToInput(payload.settings.thursdayRateCents));
      setFriSatRate(centsToInput(payload.settings.friSatRateCents));
      setSundayRate(centsToInput(payload.settings.sundayRateCents));
      setCleaningFee(centsToInput(payload.settings.cleaningFeeCents));
      setIncludedGuestCount(String(payload.settings.includedGuestCount));
      setExtraGuestFee(centsToInput(payload.settings.extraGuestFeeCents));
      setMaximumGuestCount(String(payload.settings.maximumGuestCount));
      setActive(payload.settings.active);
    } catch {
      setError("Unable to load pricing settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/admin/pricing", { cache: "no-store" });
        if (!response.ok) throw new Error("load failed");
        const payload = (await response.json()) as AdminPricingResponse;
        if (cancelled) return;
        setData(payload);
        setMonTueWedRate(centsToInput(payload.settings.monTueWedRateCents));
        setThursdayRate(centsToInput(payload.settings.thursdayRateCents));
        setFriSatRate(centsToInput(payload.settings.friSatRateCents));
        setSundayRate(centsToInput(payload.settings.sundayRateCents));
        setCleaningFee(centsToInput(payload.settings.cleaningFeeCents));
        setIncludedGuestCount(String(payload.settings.includedGuestCount));
        setExtraGuestFee(centsToInput(payload.settings.extraGuestFeeCents));
        setMaximumGuestCount(String(payload.settings.maximumGuestCount));
        setActive(payload.settings.active);
      } catch {
        if (!cancelled) setError("Unable to load pricing settings.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function saveSettings() {
    setMessage(null);
    const response = await fetch("/api/admin/pricing", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        monTueWedRate,
        thursdayRate,
        friSatRate,
        sundayRate,
        cleaningFee,
        includedGuestCount: Number(includedGuestCount),
        extraGuestFee,
        maximumGuestCount: Number(maximumGuestCount),
        active,
      }),
    });
    if (response.status === 400) {
      const payload = (await response.json()) as { error?: string };
      if (payload.error === "incomplete_rates") {
        setMessage(
          "All four nightly rates must be greater than zero before publishing.",
        );
        return;
      }
    }
    if (!response.ok) {
      setMessage("Unable to save pricing settings.");
      return;
    }
    setMessage("Pricing settings saved.");
    await loadPricing();
  }

  async function addHoliday() {
    setMessage(null);
    const response = await fetch("/api/admin/pricing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "holiday",
        name: holidayName,
        startDate: holidayStart,
        endDate: holidayEnd,
        adjustmentType: holidayType,
        adjustmentValue: holidayValue,
        minimumNights: Number(holidayMinNights),
        priority: 0,
        active: true,
      }),
    });
    if (response.status === 409) {
      setMessage("Holiday periods with the same priority cannot overlap.");
      return;
    }
    if (!response.ok) {
      setMessage("Unable to add holiday period.");
      return;
    }
    setHolidayName("");
    setHolidayStart("");
    setHolidayEnd("");
    setHolidayValue("");
    setMessage("Holiday period added.");
    await loadPricing();
  }

  async function addOverride() {
    setMessage(null);
    const response = await fetch("/api/admin/pricing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "override",
        overrideDate,
        nightlyRate: overrideRate,
        minimumNights: overrideMinNights ? Number(overrideMinNights) : null,
        internalReason: overrideReason,
        active: true,
      }),
    });
    if (!response.ok) {
      setMessage("Unable to add nightly override.");
      return;
    }
    setOverrideDate("");
    setOverrideRate("");
    setOverrideMinNights("");
    setOverrideReason("");
    setMessage("Nightly override added.");
    await loadPricing();
  }

  async function toggleHoliday(id: string, nextActive: boolean) {
    await fetch("/api/admin/pricing", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "holiday", id, active: nextActive }),
    });
    await loadPricing();
  }

  async function removeHoliday(id: string) {
    await fetch("/api/admin/pricing", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "holiday", id }),
    });
    await loadPricing();
  }

  async function toggleOverride(id: string, nextActive: boolean) {
    await fetch("/api/admin/pricing", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "override", id, active: nextActive }),
    });
    await loadPricing();
  }

  return (
    <section className="rounded-2xl border border-[#111111]/10 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[#111111]/45">
            Pricing
          </p>
          <h2 className="mt-2 font-serif text-2xl font-light text-[#111111]">
            Rates & minimum stay
          </h2>
        </div>
      </div>

      {loading ? <p className="mt-4 text-sm text-[#111111]/65">Loading pricing…</p> : null}
      {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}
      {message ? <p className="mt-4 text-sm text-[#1B3D32]">{message}</p> : null}

      {!loading && !error && data ? (
        <div className="mt-6 space-y-8">
          <div>
            <h3 className="text-sm font-medium text-[#111111]">Standard rates (USD)</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <label className="text-sm text-[#111111]/75">
                Mon–Wed
                <input
                  type="text"
                  inputMode="decimal"
                  value={monTueWedRate}
                  onChange={(event) => setMonTueWedRate(event.target.value)}
                  className={inputClassName}
                  placeholder="Required before publishing"
                />
              </label>
              <label className="text-sm text-[#111111]/75">
                Thursday
                <input
                  type="text"
                  inputMode="decimal"
                  value={thursdayRate}
                  onChange={(event) => setThursdayRate(event.target.value)}
                  className={inputClassName}
                />
              </label>
              <label className="text-sm text-[#111111]/75">
                Fri–Sat
                <input
                  type="text"
                  inputMode="decimal"
                  value={friSatRate}
                  onChange={(event) => setFriSatRate(event.target.value)}
                  className={inputClassName}
                />
              </label>
              <label className="text-sm text-[#111111]/75">
                Sunday
                <input
                  type="text"
                  inputMode="decimal"
                  value={sundayRate}
                  onChange={(event) => setSundayRate(event.target.value)}
                  className={inputClassName}
                />
              </label>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-sm text-[#111111]/75">
                Cleaning fee
                <input
                  type="text"
                  inputMode="decimal"
                  value={cleaningFee}
                  onChange={(event) => setCleaningFee(event.target.value)}
                  className={inputClassName}
                />
              </label>
              <label className="text-sm text-[#111111]/75">
                Included guest count
                <input
                  type="number"
                  min={1}
                  value={includedGuestCount}
                  onChange={(event) => setIncludedGuestCount(event.target.value)}
                  className={inputClassName}
                />
              </label>
              <label className="text-sm text-[#111111]/75">
                Additional guest fee (per guest per night)
                <input
                  type="text"
                  inputMode="decimal"
                  value={extraGuestFee}
                  onChange={(event) => setExtraGuestFee(event.target.value)}
                  className={inputClassName}
                />
              </label>
              <label className="text-sm text-[#111111]/75">
                Maximum guest count
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={maximumGuestCount}
                  onChange={(event) => setMaximumGuestCount(event.target.value)}
                  className={inputClassName}
                />
              </label>
              <label className="mt-6 flex min-h-[44px] items-center gap-3 text-sm text-[#111111]/75">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(event) => setActive(event.target.checked)}
                  className="h-4 w-4 accent-[#C69C6D]"
                />
                Publish rates on the booking calendar
              </label>
              <p className="text-xs text-[#111111]/60">
                All four nightly rates must be greater than zero before publishing.
                Included guest count must be at least 1, maximum guest count cannot
                exceed 8, and maximum must be greater than or equal to included.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void saveSettings()}
              className="mt-4 inline-flex min-h-[44px] items-center rounded-full bg-[#1B3D32] px-6 py-2.5 text-sm text-white"
            >
              Save rates
            </button>
          </div>

          <div>
            <h3 className="text-sm font-medium text-[#111111]">Minimum stay by check-in day</h3>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {data.minimumStayRules.map((rule) => (
                <li
                  key={rule.checkInDayOfWeek}
                  className="rounded-xl bg-[#F8F6F2] px-4 py-3 text-sm text-[#111111]/75"
                >
                  <span className="font-medium text-[#111111]">{rule.label}</span>
                  <span className="ml-2">
                    {rule.minimumNights} night{rule.minimumNights === 1 ? "" : "s"}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-medium text-[#111111]">Holiday periods</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <input
                type="text"
                placeholder="Holiday name"
                value={holidayName}
                onChange={(event) => setHolidayName(event.target.value)}
                className={inputClassName}
              />
              <input
                type="date"
                value={holidayStart}
                onChange={(event) => setHolidayStart(event.target.value)}
                className={inputClassName}
              />
              <input
                type="date"
                value={holidayEnd}
                onChange={(event) => setHolidayEnd(event.target.value)}
                className={inputClassName}
              />
              <select
                value={holidayType}
                onChange={(event) =>
                  setHolidayType(event.target.value as "fixed_rate" | "percentage")
                }
                className={inputClassName}
              >
                <option value="fixed_rate">Fixed nightly rate (USD)</option>
                <option value="percentage">Percent increase over normal rate</option>
              </select>
              <input
                type="text"
                placeholder={
                  holidayType === "fixed_rate"
                    ? "Fixed rate in USD"
                    : "Percent increase (20 = +20%)"
                }
                value={holidayValue}
                onChange={(event) => setHolidayValue(event.target.value)}
                className={inputClassName}
                aria-describedby="holiday-adjustment-help"
              />
              <p id="holiday-adjustment-help" className="text-xs text-[#111111]/60 md:col-span-2">
                {holidayType === "percentage"
                  ? "Enter 20 for a 20% increase over the normal rate for each date. A holiday Friday uses the Friday/Saturday rate as its base."
                  : "Fixed holiday pricing replaces the normal nightly rate for each date in the period."}
              </p>
              <input
                type="number"
                min={1}
                value={holidayMinNights}
                onChange={(event) => setHolidayMinNights(event.target.value)}
                className={inputClassName}
                placeholder="Minimum nights"
              />
            </div>
            <button
              type="button"
              onClick={() => void addHoliday()}
              className="mt-4 inline-flex min-h-[44px] items-center rounded-full border border-[#111111]/15 px-6 py-2.5 text-sm"
            >
              Add holiday period
            </button>
            <ul className="mt-4 space-y-3">
              {data.holidayPeriods.map((period) => (
                <li
                  key={period.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#111111]/10 px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-[#111111]">{period.name}</p>
                    <p className="text-[#111111]/65">
                      {period.startDate} → {period.endDate} · min {period.minimumNights} nights ·
                      priority {period.priority}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void toggleHoliday(period.id, !period.active)}
                      className="rounded-full border px-3 py-1.5 text-xs"
                    >
                      {period.active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeHoliday(period.id)}
                      className="rounded-full border px-3 py-1.5 text-xs text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-medium text-[#111111]">Nightly overrides</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <input
                type="date"
                value={overrideDate}
                onChange={(event) => setOverrideDate(event.target.value)}
                className={inputClassName}
              />
              <input
                type="text"
                placeholder="Rate in USD"
                value={overrideRate}
                onChange={(event) => setOverrideRate(event.target.value)}
                className={inputClassName}
              />
              <input
                type="number"
                min={1}
                placeholder="Optional min nights"
                value={overrideMinNights}
                onChange={(event) => setOverrideMinNights(event.target.value)}
                className={inputClassName}
              />
              <input
                type="text"
                placeholder="Internal reason"
                value={overrideReason}
                onChange={(event) => setOverrideReason(event.target.value)}
                className={inputClassName}
              />
            </div>
            <button
              type="button"
              onClick={() => void addOverride()}
              className="mt-4 inline-flex min-h-[44px] items-center rounded-full border border-[#111111]/15 px-6 py-2.5 text-sm"
            >
              Add override
            </button>
            <ul className="mt-4 space-y-3">
              {data.nightlyOverrides.map((override) => (
                <li
                  key={override.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#111111]/10 px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-[#111111]">{override.overrideDate}</p>
                    <p className="text-[#111111]/65">
                      {formatCentsAsUsd(override.nightlyRateCents)}
                      {override.minimumNights
                        ? ` · min ${override.minimumNights} nights`
                        : ""}
                      {override.internalReason ? ` · ${override.internalReason}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void toggleOverride(override.id, !override.active)}
                    className="rounded-full border px-3 py-1.5 text-xs"
                  >
                    {override.active ? "Deactivate" : "Activate"}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </section>
  );
}
