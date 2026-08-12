"use client";

import { useMemo, useState } from "react";
import {
  buildMonthGrid,
  formatAdminMonthLabel,
  getBlockTone,
  getInitialMonthStart,
  getTodayInCostaRica,
  shiftMonthStart,
} from "../../lib/admin/calendar";
import type { AdminAvailabilityBlock } from "../../lib/admin/reservation-types";

type AdminCalendarProps = {
  blocks: AdminAvailabilityBlock[];
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function AdminCalendar({ blocks }: AdminCalendarProps) {
  const [monthStart, setMonthStart] = useState(getInitialMonthStart());
  const today = useMemo(() => getTodayInCostaRica(), []);
  const grid = useMemo(
    () => buildMonthGrid(monthStart, blocks, today),
    [blocks, monthStart, today],
  );

  return (
    <section className="rounded-2xl border border-[#111111]/10 bg-white p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-[#C69C6D]">
            Calendar
          </p>
          <h2 className="mt-2 font-serif text-2xl font-light text-[#111111]">
            {formatAdminMonthLabel(monthStart)}
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMonthStart((current) => shiftMonthStart(current, -1))}
            className="rounded-full border border-[#111111]/15 px-4 py-2 text-sm"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => setMonthStart(getInitialMonthStart())}
            className="rounded-full border border-[#111111]/15 px-4 py-2 text-sm"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setMonthStart((current) => shiftMonthStart(current, 1))}
            className="rounded-full border border-[#111111]/15 px-4 py-2 text-sm"
          >
            Next
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-7 gap-1 text-center text-xs font-medium uppercase tracking-wide text-[#111111]/50 sm:gap-2">
        {WEEKDAYS.map((day) => (
          <div key={day} className="py-2">
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{day.slice(0, 1)}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {grid.map((cell, index) => (
          <div
            key={`${cell.iso ?? "empty"}-${index}`}
            className={`min-h-[72px] rounded-xl border p-1.5 sm:min-h-[96px] sm:p-2 ${
              cell.inCurrentMonth
                ? cell.isToday
                  ? "border-[#C69C6D] bg-[#FFF9F2]"
                  : "border-[#111111]/10 bg-[#FCFAF7]"
                : "border-transparent bg-transparent"
            }`}
          >
            {cell.iso ? (
              <>
                <div className="text-xs font-medium text-[#111111]/70">
                  {cell.iso.slice(-2)}
                </div>
                <div className="mt-1 space-y-1">
                  {cell.blocks.slice(0, 2).map((block) => (
                    <div
                      key={block.id}
                      className={`truncate rounded-md px-1.5 py-1 text-[10px] leading-tight sm:text-[11px] ${getBlockTone(block.blockType)}`}
                      title={block.guestLabel ?? block.blockLabel}
                    >
                      {block.guestLabel ?? block.blockLabel}
                    </div>
                  ))}
                  {cell.blocks.length > 2 ? (
                    <div className="text-[10px] text-[#111111]/50">
                      +{cell.blocks.length - 2} more
                    </div>
                  ) : null}
                </div>
              </>
            ) : null}
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-3 text-xs text-[#111111]/70">
        {[
          ["Confirmed", "bg-[#1B3D32]"],
          ["Approval hold", "bg-[#C69C6D]"],
          ["Owner stay", "bg-[#4A6741]"],
          ["Maintenance", "bg-[#8B7355]"],
          ["Other", "bg-[#6B7280]"],
        ].map(([label, colorClass]) => (
          <span key={label} className="inline-flex items-center gap-2">
            <span className={`h-3 w-3 rounded-full ${colorClass}`} />
            {label}
          </span>
        ))}
      </div>
    </section>
  );
}
