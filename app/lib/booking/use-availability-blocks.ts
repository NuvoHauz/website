"use client";

import { useCallback, useEffect, useState } from "react";
import type { BlockedRange } from "./blocked-ranges";

type AvailabilityBlockResponse = {
  startDate: string;
  endDate: string;
};

type AvailabilityResponse = {
  blocks: AvailabilityBlockResponse[];
};

function toBlockedRanges(blocks: AvailabilityBlockResponse[]): BlockedRange[] {
  return blocks.map((block) => ({
    start: block.startDate,
    end: block.endDate,
  }));
}

async function fetchAvailabilityBlocks(): Promise<BlockedRange[]> {
  const response = await fetch("/api/riu-house/availability", {
    method: "GET",
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("availability fetch failed");
  }
  const data = (await response.json()) as AvailabilityResponse;
  return toBlockedRanges(data.blocks ?? []);
}

export function useAvailabilityBlocks() {
  const [blocks, setBlocks] = useState<BlockedRange[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const nextBlocks = await fetchAvailabilityBlocks();
      setBlocks(nextBlocks);
    } catch {
      setError(true);
      setBlocks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const nextBlocks = await fetchAvailabilityBlocks();
        if (!cancelled) {
          setBlocks(nextBlocks);
        }
      } catch {
        if (!cancelled) {
          setError(true);
          setBlocks([]);
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
  }, []);

  return { blocks, loading, error, reload };
}
