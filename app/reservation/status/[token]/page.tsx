import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReservationStatusView from "../../../components/guest/ReservationStatusView";
import { getGuestStatusTranslations } from "../../../i18n/guest-status";
import { loadGuestReservationById } from "../../../lib/guest-status/load-reservation";
import { verifyGuestStatusToken } from "../../../lib/guest-status/token";
import { processExpiredOwnerHolds } from "../../../lib/admin/expire-owner-holds";
import { getSupabaseAdmin } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";

type ReservationStatusPageProps = {
  params: Promise<{ token: string }>;
};

export default async function ReservationStatusPage({
  params,
}: ReservationStatusPageProps) {
  const { token } = await params;
  const decodedToken = decodeURIComponent(token);
  const verified = verifyGuestStatusToken(decodedToken);
  if (!verified) {
    notFound();
  }

  const supabase = getSupabaseAdmin();
  await processExpiredOwnerHolds(supabase);
  const reservation = await loadGuestReservationById(supabase, verified.bookingId);
  if (!reservation) {
    notFound();
  }

  return <ReservationStatusView reservation={reservation} />;
}

export async function generateMetadata({
  params,
}: ReservationStatusPageProps): Promise<Metadata> {
  const { token } = await params;
  const verified = verifyGuestStatusToken(decodeURIComponent(token));
  if (!verified) {
    return {
      title: "Reservation not found",
      robots: { index: false, follow: false },
    };
  }

  const supabase = getSupabaseAdmin();
  await processExpiredOwnerHolds(supabase);
  const reservation = await loadGuestReservationById(supabase, verified.bookingId);
  const locale = reservation?.locale ?? "en";
  const t = getGuestStatusTranslations(locale);

  return {
    title: `${t.pageTitle} · ${t.propertyName}`,
    robots: { index: false, follow: false },
  };
}
