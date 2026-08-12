import { redirect } from "next/navigation";
import AdminDashboard from "../components/admin/AdminDashboard";
import { fetchAdminReservations } from "../lib/admin/reservation-service";
import {
  AdminAuthConfigError,
  getOwnerSession,
} from "../lib/admin/session";

export default async function AdminPage() {
  let session = null;

  try {
    session = await getOwnerSession();
  } catch (error) {
    if (error instanceof AdminAuthConfigError) {
      redirect("/admin/login");
    }
    throw error;
  }

  if (!session) {
    redirect("/admin/login");
  }

  try {
    const initialData = await fetchAdminReservations(session.owner);

    return (
      <AdminDashboard initialOwner={session.owner} initialData={initialData} />
    );
  } catch (error) {
    if (error instanceof Error && error.message === "supabase_clock_skew") {
      return (
        <main className="min-h-screen bg-[#F8F6F2] px-4 py-10 sm:px-6">
          <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
            <h1 className="font-serif text-2xl font-light">Dashboard unavailable</h1>
            <p className="mt-3 text-sm leading-relaxed">
              Supabase rejected the server connection because the computer clock
              appears to be ahead of real time (error PGRST303: JWT issued at future).
            </p>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm">
              <li>Open Windows Settings → Time &amp; language → Date &amp; time</li>
              <li>Turn on <strong>Set time automatically</strong></li>
              <li>Click <strong>Sync now</strong></li>
              <li>Restart <code className="rounded bg-red-100 px-1">npm run dev</code></li>
            </ol>
          </div>
        </main>
      );
    }

    throw error;
  }
}
