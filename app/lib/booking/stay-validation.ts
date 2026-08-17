import "server-only";

import type { PricingConfig } from "../pricing/types";
import {
  calculateStayPricing,
  isStayDurationValid,
  isStayRangeAvailable,
} from "../pricing/engine";

export interface MinimumStayContext {
  minimumStayRules: PricingConfig["minimumStayRules"];
  holidayPeriods: PricingConfig["holidayPeriods"];
  nightlyOverrides: PricingConfig["nightlyOverrides"];
}

export function isStayRangeValidWithMinimumStay(
  checkIn: string,
  checkOut: string,
  blockedRanges: Parameters<typeof isStayRangeAvailable>[2],
  minimumStayContext: MinimumStayContext,
): boolean {
  if (!checkIn || !checkOut) return false;
  if (!isStayDurationValid(checkIn, checkOut, minimumStayContext)) return false;
  return isStayRangeAvailable(checkIn, checkOut, blockedRanges);
}

export { calculateStayPricing, isStayDurationValid, isStayRangeAvailable };
