import {
  addDaysToIsoDate,
  addMonthsToMonthStart,
  compareIsoDates,
  formatMonthYear,
  getDaysInMonth,
  getMonthStart,
  getTodayInCostaRica,
  getWeekdayIndex,
  toIsoDate,
} from "../booking/costa-rica-dates";
import type { AdminAvailabilityBlock } from "./reservation-types";

export type CalendarDayCell = {
  iso: string | null;
  inCurrentMonth: boolean;
  isToday: boolean;
  blocks: AdminAvailabilityBlock[];
};

export function buildMonthGrid(
  monthStart: string,
  blocks: AdminAvailabilityBlock[],
  today: string,
): CalendarDayCell[] {
  const { y, m } = parseMonthStart(monthStart);
  const daysInMonth = getDaysInMonth(monthStart);
  const leadingEmpty = getWeekdayIndex(monthStart);
  const cells: CalendarDayCell[] = [];

  for (let i = 0; i < leadingEmpty; i += 1) {
    cells.push({
      iso: null,
      inCurrentMonth: false,
      isToday: false,
      blocks: [],
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const iso = toIsoDate(y, m, day);
    cells.push({
      iso,
      inCurrentMonth: true,
      isToday: iso === today,
      blocks: blocksForDate(iso, blocks),
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push({
      iso: null,
      inCurrentMonth: false,
      isToday: false,
      blocks: [],
    });
  }

  return cells;
}

function parseMonthStart(monthStart: string): { y: number; m: number } {
  const [y, m] = monthStart.split("-").map(Number);
  return { y, m };
}

export function blocksForDate(
  iso: string,
  blocks: AdminAvailabilityBlock[],
): AdminAvailabilityBlock[] {
  return blocks.filter(
    (block) =>
      block.status === "active" &&
      compareIsoDates(iso, block.startDate) >= 0 &&
      compareIsoDates(iso, block.endDate) < 0,
  );
}

export function getInitialMonthStart(): string {
  return getMonthStart(getTodayInCostaRica());
}

export function shiftMonthStart(monthStart: string, delta: number): string {
  let cursor = monthStart;
  const step = delta >= 0 ? 1 : -1;
  for (let i = 0; i < Math.abs(delta); i += 1) {
    cursor = addMonthsToMonthStart(cursor, step);
  }
  return cursor;
}

export function formatAdminMonthLabel(monthStart: string): string {
  return formatMonthYear(monthStart, "en-US");
}

export function getBlockTone(blockType: string): string {
  switch (blockType) {
    case "confirmed_reservation":
      return "bg-[#1B3D32] text-white";
    case "approval_hold":
      return "bg-[#C69C6D] text-[#111111]";
    case "owner_stay":
      return "bg-[#4A6741] text-white";
    case "maintenance":
      return "bg-[#8B7355] text-white";
    default:
      return "bg-[#6B7280] text-white";
  }
}

export function isCheckoutBoundaryAvailable(
  checkOut: string,
  nextCheckIn: string,
): boolean {
  return compareIsoDates(checkOut, nextCheckIn) === 0;
}

export { addDaysToIsoDate, getTodayInCostaRica };
