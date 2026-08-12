import { compareIsoDates } from "./costa-rica-dates";

export const RIU_HOUSE_PROPERTY_SLUG = "riu-house";
export const ACTIVE_BLOCK_STATUS = "active";
export const INACTIVE_BLOCK_STATUS = "inactive";
export const AVAILABILITY_HORIZON_DAYS = 90;

export interface BlockedRange {
  /** First blocked calendar night (inclusive), YYYY-MM-DD. */
  start: string;
  /** First available calendar night after the block (exclusive). */
  end: string;
}

export function isBlockedNight(night: string, ranges: BlockedRange[]): boolean {
  return ranges.some(
    (range) =>
      compareIsoDates(night, range.start) >= 0 &&
      compareIsoDates(night, range.end) < 0,
  );
}

export function sanitizeBlockedRanges(rows: BlockedRange[]): BlockedRange[] {
  return rows
    .filter(
      (range) =>
        /^\d{4}-\d{2}-\d{2}$/.test(range.start) &&
        /^\d{4}-\d{2}-\d{2}$/.test(range.end) &&
        compareIsoDates(range.end, range.start) > 0,
    )
    .map((range) => ({ start: range.start, end: range.end }));
}
