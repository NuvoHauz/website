"use client";

import { useCallback, useMemo, useState } from "react";
import type { RiuHouseBookingTranslations } from "../../../i18n/riu-house/booking/types";
import {
  addMonthsToMonthStart,
  compareIsoDates,
  formatDisplayDate,
  formatMonthYear,
  getDaysInMonth,
  getMonthStart,
  getTodayInCostaRica,
  getWeekdayIndex,
} from "../../../lib/booking/costa-rica-dates";
import {
  canCheckInOn,
  isDateSelectable,
  isPastDate,
  isStayRangeValid,
} from "../../../lib/booking/availability";
import { getPrototypeHorizonEnd } from "../../../data/riu-house-booking.mock";

type AvailabilityCalendarProps = {
  bt: RiuHouseBookingTranslations;
  locale: string;
  checkIn: string;
  checkOut: string;
  onSelectCheckIn: (date: string) => void;
  onSelectCheckOut: (date: string) => void;
  onRangeError?: () => void;
};

function getDayState(
  iso: string,
  checkIn: string,
  checkOut: string,
): "past" | "unavailable" | "available" | "selected" {
  if (isPastDate(iso)) return "past";
  if (!isDateSelectable(iso)) return "unavailable";

  if (
    checkIn &&
    checkOut &&
    compareIsoDates(iso, checkIn) >= 0 &&
    compareIsoDates(iso, checkOut) <= 0
  ) {
    return "selected";
  }
  if (checkIn && !checkOut && iso === checkIn) return "selected";

  if (!checkIn) {
    return canCheckInOn(iso) ? "available" : "unavailable";
  }

  if (compareIsoDates(iso, checkIn) <= 0) {
    return canCheckInOn(iso) ? "available" : "unavailable";
  }

  return "available";
}

export default function AvailabilityCalendar({
  bt,
  locale,
  checkIn,
  checkOut,
  onSelectCheckIn,
  onSelectCheckOut,
  onRangeError,
}: AvailabilityCalendarProps) {
  const today = getTodayInCostaRica();
  const horizonEnd = getPrototypeHorizonEnd();
  const [monthStart, setMonthStart] = useState(() => getMonthStart(today));

  const monthLabel = formatMonthYear(monthStart, locale);
  const daysInMonth = getDaysInMonth(monthStart);
  const firstWeekday = getWeekdayIndex(monthStart);

  const { y, m } = useMemo(() => {
    const parts = monthStart.split("-").map(Number);
    return { y: parts[0], m: parts[1] };
  }, [monthStart]);

  const canGoPrev = compareIsoDates(monthStart, getMonthStart(today)) > 0;
  const canGoNext =
    compareIsoDates(getMonthStart(addMonthsToMonthStart(monthStart, 1)), horizonEnd) <= 0;

  const handleDayClick = useCallback(
    (iso: string) => {
      if (isPastDate(iso) || !isDateSelectable(iso)) return;

      if (!checkIn || (checkIn && checkOut)) {
        if (!canCheckInOn(iso)) return;
        onSelectCheckIn(iso);
        return;
      }

      if (compareIsoDates(iso, checkIn) <= 0) {
        if (!canCheckInOn(iso)) return;
        onSelectCheckIn(iso);
        return;
      }

      if (isStayRangeValid(checkIn, iso)) {
        onSelectCheckOut(iso);
      } else {
        onRangeError?.();
      }
    },
    [checkIn, checkOut, onSelectCheckIn, onSelectCheckOut, onRangeError],
  );

  const dayButtons = useMemo(() => {
    const buttons = [];
    for (let i = 0; i < firstWeekday; i += 1) {
      buttons.push(<div key={`pad-${i}`} aria-hidden className="h-10" />);
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      const iso = `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const state = getDayState(iso, checkIn, checkOut);
      const disabled = state === "past" || state === "unavailable";

      buttons.push(
        <button
          key={iso}
          type="button"
          disabled={disabled}
          onClick={() => handleDayClick(iso)}
          aria-label={formatDisplayDate(iso, locale)}
          aria-pressed={state === "selected"}
          className={`flex h-10 min-w-[2.5rem] items-center justify-center rounded-lg text-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C69C6D] ${
            state === "past"
              ? "cursor-not-allowed text-[#111111]/25"
              : state === "unavailable"
                ? "cursor-not-allowed bg-[#111111]/5 text-[#111111]/35 line-through"
                : state === "selected"
                  ? "bg-[#C69C6D] font-medium text-white"
                  : "text-[#111111]/80 hover:bg-[#111111]/5"
          }`}
        >
          {day}
        </button>,
      );
    }
    return buttons;
  }, [
    firstWeekday,
    daysInMonth,
    y,
    m,
    checkIn,
    checkOut,
    locale,
    handleDayClick,
  ]);

  return (
    <div className="min-w-0">
      <p className="text-sm text-[#111111]/70">
        {!checkIn
          ? bt.calendarSelectCheckIn
          : !checkOut
            ? bt.calendarSelectCheckOut
            : `${formatDisplayDate(checkIn, locale)} → ${formatDisplayDate(checkOut, locale)}`}
      </p>

      <div className="mt-4 flex items-center justify-between gap-2">
        <button
          type="button"
          disabled={!canGoPrev}
          onClick={() => setMonthStart(addMonthsToMonthStart(monthStart, -1))}
          aria-label={bt.calendarPrevMonth}
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-[#111111]/10 bg-white text-[#111111]/70 transition-colors hover:border-[#C69C6D]/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C69C6D] disabled:cursor-not-allowed disabled:opacity-40"
        >
          ‹
        </button>
        <p className="font-serif text-lg font-light text-[#111111]">{monthLabel}</p>
        <button
          type="button"
          disabled={!canGoNext}
          onClick={() => setMonthStart(addMonthsToMonthStart(monthStart, 1))}
          aria-label={bt.calendarNextMonth}
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-[#111111]/10 bg-white text-[#111111]/70 transition-colors hover:border-[#C69C6D]/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C69C6D] disabled:cursor-not-allowed disabled:opacity-40"
        >
          ›
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] uppercase tracking-wide text-[#111111]/50">
        {bt.calendarWeekdays.map((label: string) => (
          <div key={label} className="py-1">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">{dayButtons}</div>

      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-[#111111]/60">
        <li className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-white ring-1 ring-[#111111]/10" />
          {bt.calendarLegendAvailable}
        </li>
        <li className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-[#111111]/5" />
          {bt.calendarLegendUnavailable}
        </li>
        <li className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-[#C69C6D]" />
          {bt.calendarLegendSelected}
        </li>
        <li className="flex items-center gap-2">
          <span className="h-3 w-3 rounded bg-[#111111]/10" />
          {bt.calendarLegendPast}
        </li>
      </ul>
    </div>
  );
}
