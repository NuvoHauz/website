"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import AdminCalendar from "./AdminCalendar";
import AdminManualBlockForm from "./AdminManualBlockForm";
import AdminPendingRequests from "./AdminPendingRequests";
import AdminPricingSection from "./AdminPricingSection";
import { reservationPatchErrorMessage } from "../../lib/admin/rpc-errors";
import type {
  AdminReservationsResponse,
  OwnerName,
  ReservationAction,
} from "../../lib/admin/reservation-types";

type AdminDashboardProps = {
  initialOwner: OwnerName;
  initialData: AdminReservationsResponse;
};

export default function AdminDashboard({
  initialOwner,
  initialData,
}: AdminDashboardProps) {
  const router = useRouter();
  const [data, setData] = useState<AdminReservationsResponse>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/reservations", {
        cache: "no-store",
      });

      if (response.status === 401) {
        router.push("/admin/login");
        router.refresh();
        return;
      }

      const payload = (await response.json()) as AdminReservationsResponse & {
        error?: string;
        message?: string;
      };

      if (!response.ok) {
        setError(payload.message ?? "Unable to load reservations.");
        return;
      }

      setData(payload);
    } catch {
      setError("Unable to load reservations.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  async function handleSignOut() {
    await fetch("/api/admin/session", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  }

  async function handleReservationAction(
    bookingRequestId: string,
    action: ReservationAction,
  ): Promise<string | null> {
    const response = await fetch("/api/admin/reservations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingRequestId, action }),
    });

    const payload = (await response.json()) as {
      error?: string;
      code?: string;
      preview?: boolean;
    };

    if (!response.ok) {
      return reservationPatchErrorMessage(payload);
    }

    if (payload.preview) {
      return "Preview mode: no production data was changed.";
    }

    await loadData();
    return null;
  }

  async function handleCreateBlock(input: {
    startDate: string;
    endDate: string;
    reason: "owner_stay" | "maintenance" | "other";
    note: string;
  }): Promise<string | null> {
    const response = await fetch("/api/admin/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    const payload = (await response.json()) as { error?: string; preview?: boolean };

    if (response.status === 409) {
      return "Those dates overlap an existing block.";
    }

    if (!response.ok) {
      return "Unable to create this block.";
    }

    if (payload.preview) {
      return "Preview mode: no production data was changed.";
    }

    await loadData();
    return null;
  }

  async function handleRemoveBlock(blockId: string): Promise<string | null> {
    const response = await fetch("/api/admin/reservations", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blockId }),
    });

    const payload = (await response.json()) as { error?: string; preview?: boolean };

    if (!response.ok) {
      return "Unable to remove this block.";
    }

    if (payload.preview) {
      return "Preview mode: no production data was changed.";
    }

    await loadData();
    return null;
  }

  async function handleRetryGuestEmail(
    bookingRequestId: string,
    eventType: string,
  ): Promise<string | null> {
    const response = await fetch("/api/admin/guest-notifications/retry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingRequestId, eventType }),
    });

    if (response.status === 409) {
      return "This guest email is not eligible for retry.";
    }

    if (!response.ok) {
      return "Unable to retry this guest email.";
    }

    await loadData();
    return null;
  }

  const owner = data.owner ?? initialOwner;

  return (
    <div className="min-h-screen bg-[#F8F6F2]">
      <header className="border-b border-white/10 bg-[#1B3D32] text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-10">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-[#C69C6D]">
              NuvoHauz
            </p>
            <h1 className="mt-1 font-serif text-2xl font-light sm:text-3xl">
              Owner Portal
            </h1>
            <p className="mt-2 text-sm text-white/75">
              Signed in as {owner} · {data.propertyName}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href="/admin/bookkeeping"
              className="inline-flex min-h-[44px] items-center rounded-full border border-white/20 px-5 py-2.5 text-sm text-white transition-colors hover:bg-white/10"
            >
              Bookkeeping
            </a>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex min-h-[44px] items-center rounded-full border border-white/20 px-5 py-2.5 text-sm text-white transition-colors hover:bg-white/10"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        {loading ? (
          <p className="text-sm text-[#111111]/65">Refreshing dashboard...</p>
        ) : null}

        {error ? (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Pending requests", data.summary.pendingRequests],
            ["Approval holds", data.summary.approvalHolds],
            ["Confirmed reservations", data.summary.confirmedReservations],
            ["Upcoming stays", data.summary.upcomingStays],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-2xl border border-[#111111]/10 bg-white p-5"
            >
              <p className="text-xs uppercase tracking-[0.22em] text-[#111111]/45">
                {label}
              </p>
              <p className="mt-3 font-serif text-3xl font-light text-[#111111]">
                {value}
              </p>
            </div>
          ))}
        </section>

        <AdminCalendar blocks={data.availabilityBlocks} />

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <AdminPendingRequests
            requests={data.bookingRequests}
            onAction={handleReservationAction}
            onRetryGuestEmail={handleRetryGuestEmail}
          />
          <AdminManualBlockForm
            blocks={data.availabilityBlocks}
            onCreate={handleCreateBlock}
            onRemove={handleRemoveBlock}
          />
        </div>

        <AdminPricingSection />
      </main>
    </div>
  );
}
