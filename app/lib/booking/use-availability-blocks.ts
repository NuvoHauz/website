"use client";

import { useCallback, useEffect, useState } from "react";
import type { BlockedRange } from "./blocked-ranges";
import type { PricingSource } from "../pricing/types";

export type CalendarDayAvailability = {
  date: string;
  availability: "available" | "blocked" | "past" | "beyond_horizon";
  nightlyRateCents: number | null;
  currency: string;
  minimumNightsOnCheckIn: number;
  pricingSource: PricingSource | null;
  holidayName: string | null;
};

type AvailabilityBlockResponse = {
  startDate: string;
  endDate: string;
};

type AvailabilityResponse = {
  blocks: AvailabilityBlockResponse[];
  days?: CalendarDayAvailability[];
  pricingConfigured?: boolean;
  cleaningFeeCents?: number;
  currency?: string;
  includedGuestCount?: number;
  extraGuestFeeCents?: number;
  maximumGuestCount?: number;
};

function toBlockedRanges(blocks: AvailabilityBlockResponse[]): BlockedRange[] {
  return blocks.map((block) => ({
    start: block.startDate,
    end: block.endDate,
  }));
}

async function fetchAvailability(): Promise<{
  blocks: BlockedRange[];
  days: CalendarDayAvailability[];
  pricingConfigured: boolean;
  cleaningFeeCents: number;
  currency: string;
  includedGuestCount: number;
  extraGuestFeeCents: number;
  maximumGuestCount: number;
}> {
  const response = await fetch("/api/riu-house/availability", {
    method: "GET",
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("availability fetch failed");
  }
  const data = (await response.json()) as AvailabilityResponse;
  return {
    blocks: toBlockedRanges(data.blocks ?? []),
    days: data.days ?? [],
    pricingConfigured: Boolean(data.pricingConfigured),
    cleaningFeeCents: data.cleaningFeeCents ?? 8000,
    currency: data.currency ?? "USD",
    includedGuestCount: data.includedGuestCount ?? 6,
    extraGuestFeeCents: data.extraGuestFeeCents ?? 2500,
    maximumGuestCount: data.maximumGuestCount ?? 8,
  };
}

export function useAvailabilityBlocks() {
  const [blocks, setBlocks] = useState<BlockedRange[]>([]);
  const [days, setDays] = useState<CalendarDayAvailability[]>([]);
  const [pricingConfigured, setPricingConfigured] = useState(false);
  const [cleaningFeeCents, setCleaningFeeCents] = useState(8000);
  const [currency, setCurrency] = useState("USD");
  const [includedGuestCount, setIncludedGuestCount] = useState(6);
  const [extraGuestFeeCents, setExtraGuestFeeCents] = useState(2500);
  const [maximumGuestCount, setMaximumGuestCount] = useState(8);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const applyAvailability = useCallback(
    (next: Awaited<ReturnType<typeof fetchAvailability>>) => {
      setBlocks(next.blocks);
      setDays(next.days);
      setPricingConfigured(next.pricingConfigured);
      setCleaningFeeCents(next.cleaningFeeCents);
      setCurrency(next.currency);
      setIncludedGuestCount(next.includedGuestCount);
      setExtraGuestFeeCents(next.extraGuestFeeCents);
      setMaximumGuestCount(next.maximumGuestCount);
    },
    [],
  );

  const reload = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const next = await fetchAvailability();
      applyAvailability(next);
    } catch {
      setError(true);
      setBlocks([]);
      setDays([]);
      setPricingConfigured(false);
    } finally {
      setLoading(false);
    }
  }, [applyAvailability]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const next = await fetchAvailability();
        if (!cancelled) {
          applyAvailability(next);
        }
      } catch {
        if (!cancelled) {
          setError(true);
          setBlocks([]);
          setDays([]);
          setPricingConfigured(false);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [applyAvailability]);

  return {
    blocks,
    days,
    pricingConfigured,
    cleaningFeeCents,
    currency,
    includedGuestCount,
    extraGuestFeeCents,
    maximumGuestCount,
    loading,
    error,
    reload,
  };
}
