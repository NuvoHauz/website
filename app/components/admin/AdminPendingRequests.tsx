"use client";

import { useState } from "react";
import { isPendingStatus } from "../../lib/admin/reservation-labels";
import type { AdminBookingRequest, ReservationAction } from "../../lib/admin/reservation-types";

type AdminPendingRequestsProps = {
  requests: AdminBookingRequest[];
  onAction: (
    bookingRequestId: string,
    action: ReservationAction,
  ) => Promise<string | null>;
};

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function AdminPendingRequests({
  requests,
  onAction,
}: AdminPendingRequestsProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<ReservationAction | null>(null);
  const [feedback, setFeedback] = useState<{
    text: string;
    kind: "success" | "error";
  } | null>(null);

  const pendingRequests = requests.filter(
    (request) =>
      isPendingStatus(request.status) ||
      request.status === "approved_hold" ||
      request.status === "confirmed",
  );

  const selected =
    pendingRequests.find((request) => request.id === selectedId) ?? null;

  async function runAction(action: ReservationAction) {
    if (!selected) return;

    const destructive = action === "decline" || action === "cancel";
    const labels: Record<ReservationAction, string> = {
      approve_hold: "approve this request with a 48-hour hold",
      confirm: "confirm this reservation",
      decline: "decline this request",
      cancel: "cancel this reservation",
    };

    if (
      destructive &&
      !window.confirm(`Are you sure you want to ${labels[action]}?`)
    ) {
      return;
    }

    setBusyAction(action);
    setFeedback(null);
    const error = await onAction(selected.id, action);
    setBusyAction(null);

    if (error) {
      setFeedback({ text: error, kind: "error" });
      return;
    }

    setFeedback({ text: "Reservation updated.", kind: "success" });
    setSelectedId(null);
  }

  return (
    <section className="rounded-2xl border border-[#111111]/10 bg-white p-4 sm:p-6">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-[#C69C6D]">
          Requests
        </p>
        <h2 className="mt-2 font-serif text-2xl font-light text-[#111111]">
          Pending & active reservations
        </h2>
      </div>

      {feedback ? (
        <p
          className={`mt-4 rounded-xl px-4 py-3 text-sm ${
            feedback.kind === "error"
              ? "bg-red-50 text-red-700"
              : "bg-[#1B3D32]/5 text-[#1B3D32]"
          }`}
        >
          {feedback.text}
        </p>
      ) : null}

      <div className="mt-5 space-y-3">
        {pendingRequests.length === 0 ? (
          <p className="text-sm text-[#111111]/65">No active requests right now.</p>
        ) : (
          pendingRequests.map((request) => (
            <button
              key={request.id}
              type="button"
              onClick={() => setSelectedId(request.id)}
              className={`w-full rounded-2xl border px-4 py-4 text-left transition-colors ${
                selectedId === request.id
                  ? "border-[#C69C6D] bg-[#FFF9F2]"
                  : "border-[#111111]/10 hover:border-[#111111]/20"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-[#111111]">{request.fullName}</p>
                  <p className="mt-1 text-sm text-[#111111]/65">
                    {request.requestReference} · {request.statusLabel}
                  </p>
                </div>
                <p className="text-sm text-[#111111]/65">
                  {request.checkIn} → {request.checkOut}
                </p>
              </div>
            </button>
          ))
        )}
      </div>

      {selected ? (
        <div className="mt-6 rounded-2xl border border-[#111111]/10 bg-[#FCFAF7] p-4 sm:p-5">
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <Detail label="Reference" value={selected.requestReference} />
            <Detail label="Status" value={selected.statusLabel} />
            <Detail label="Check-in" value={selected.checkIn} />
            <Detail label="Check-out" value={selected.checkOut} />
            <Detail label="Nights" value={String(selected.nights)} />
            <Detail label="Guests" value={`${selected.adults} adults, ${selected.children} children`} />
            <Detail label="Child ages" value={selected.childAges.join(", ") || "—"} />
            <Detail label="Email" value={selected.email} />
            <Detail label="WhatsApp" value={selected.phoneWhatsapp} />
            <Detail label="Country" value={selected.countryOfResidence} />
            <Detail label="Trip reason" value={selected.tripReason} />
            <Detail label="Outside visitors" value={selected.outsideVisitors} />
            <Detail label="Submitted" value={formatDateTime(selected.submittedAt)} />
            <Detail label="Reviewed by" value={selected.reviewedBy ?? "—"} />
            <Detail label="Reviewed at" value={formatDateTime(selected.reviewedAt)} />
            <Detail label="Hold expires" value={formatDateTime(selected.holdExpiresAt)} />
          </div>
          {selected.guestMessage ? (
            <div className="mt-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[#111111]/45">
                Guest message
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[#111111]/80">
                {selected.guestMessage}
              </p>
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-2">
            {selected.status !== "approved_hold" && selected.status !== "confirmed" ? (
              <ActionButton
                label="Approve with 48-hour hold"
                busy={busyAction === "approve_hold"}
                onClick={() => runAction("approve_hold")}
              />
            ) : null}
            {selected.status === "approved_hold" ? (
              <ActionButton
                label="Confirm reservation"
                busy={busyAction === "confirm"}
                onClick={() => runAction("confirm")}
              />
            ) : null}
            {selected.status !== "confirmed" ? (
              <ActionButton
                label="Decline request"
                busy={busyAction === "decline"}
                onClick={() => runAction("decline")}
                variant="danger"
              />
            ) : null}
            {selected.status === "confirmed" || selected.status === "approved_hold" ? (
              <ActionButton
                label="Cancel reservation"
                busy={busyAction === "cancel"}
                onClick={() => runAction("cancel")}
                variant="danger"
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.18em] text-[#111111]/45">{label}</p>
      <p className="mt-1 text-[#111111]/80">{value}</p>
    </div>
  );
}

function ActionButton({
  label,
  busy,
  onClick,
  variant = "primary",
}: {
  label: string;
  busy: boolean;
  onClick: () => void;
  variant?: "primary" | "danger";
}) {
  const classes =
    variant === "danger"
      ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
      : "border-[#1B3D32] bg-[#1B3D32] text-white hover:bg-[#163329]";

  return (
    <button
      type="button"
      disabled={busy}
      onClick={onClick}
      className={`inline-flex min-h-[44px] items-center rounded-full border px-4 py-2 text-sm disabled:opacity-60 ${classes}`}
    >
      {busy ? "Working..." : label}
    </button>
  );
}
