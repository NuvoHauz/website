"use client";

import { useState } from "react";
import type { AdminAvailabilityBlock } from "../../lib/admin/reservation-types";

type AdminManualBlockFormProps = {
  blocks: AdminAvailabilityBlock[];
  onCreate: (input: {
    startDate: string;
    endDate: string;
    reason: "owner_stay" | "maintenance" | "other";
    note: string;
  }) => Promise<string | null>;
  onRemove: (blockId: string) => Promise<string | null>;
};

export default function AdminManualBlockForm({
  blocks,
  onCreate,
  onRemove,
}: AdminManualBlockFormProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState<"owner_stay" | "maintenance" | "other">(
    "owner_stay",
  );
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const manualBlocks = blocks.filter((block) => !block.bookingRequestId);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const error = await onCreate({ startDate, endDate, reason, note });
    setBusy(false);
    if (error) {
      setMessage(error);
      return;
    }
    setStartDate("");
    setEndDate("");
    setNote("");
    setMessage("Manual block added.");
  }

  async function handleRemove(blockId: string) {
    if (!window.confirm("Remove this manual block and release the dates?")) {
      return;
    }
    setBusy(true);
    setMessage(null);
    const error = await onRemove(blockId);
    setBusy(false);
    setMessage(error ?? "Manual block removed.");
  }

  return (
    <section className="rounded-2xl border border-[#111111]/10 bg-white p-4 sm:p-6">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-[#C69C6D]">
          Manual blocks
        </p>
        <h2 className="mt-2 font-serif text-2xl font-light text-[#111111]">
          Add blocked dates
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          Start date
          <input
            type="date"
            required
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className="mt-2 w-full rounded-xl border border-[#111111]/15 px-4 py-3"
          />
        </label>
        <label className="block text-sm">
          End date
          <input
            type="date"
            required
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            className="mt-2 w-full rounded-xl border border-[#111111]/15 px-4 py-3"
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          Reason
          <select
            value={reason}
            onChange={(event) =>
              setReason(event.target.value as "owner_stay" | "maintenance" | "other")
            }
            className="mt-2 w-full rounded-xl border border-[#111111]/15 px-4 py-3"
          >
            <option value="owner_stay">Owner or family stay</option>
            <option value="maintenance">Maintenance</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="block text-sm sm:col-span-2">
          Private note
          <textarea
            value={note}
            maxLength={500}
            onChange={(event) => setNote(event.target.value)}
            className="mt-2 min-h-[96px] w-full rounded-xl border border-[#111111]/15 px-4 py-3"
            placeholder="Visible only in the owner dashboard"
          />
        </label>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex min-h-[44px] rounded-full bg-[#1B3D32] px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {busy ? "Saving..." : "Add blocked dates"}
          </button>
        </div>
      </form>

      {message ? (
        <p className="mt-4 rounded-xl bg-[#1B3D32]/5 px-4 py-3 text-sm text-[#1B3D32]">
          {message}
        </p>
      ) : null}

      <div className="mt-6 space-y-3">
        {manualBlocks.length === 0 ? (
          <p className="text-sm text-[#111111]/65">No manual blocks yet.</p>
        ) : (
          manualBlocks.map((block) => (
            <div
              key={block.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-[#111111]/10 px-4 py-4"
            >
              <div>
                <p className="font-medium text-[#111111]">{block.blockLabel}</p>
                <p className="mt-1 text-sm text-[#111111]/65">
                  {block.startDate} → {block.endDate}
                </p>
                {block.internalNote ? (
                  <p className="mt-2 text-sm text-[#111111]/70">{block.internalNote}</p>
                ) : null}
                {block.createdBy ? (
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[#111111]/45">
                    Added by {block.createdBy}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => handleRemove(block.id)}
                className="rounded-full border border-red-200 px-4 py-2 text-sm text-red-700"
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
