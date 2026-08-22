import { redirect } from "next/navigation";
import Link from "next/link";
import BookkeepingWorkspace from "../../components/admin/bookkeeping/BookkeepingWorkspace";
import {
  AdminAuthConfigError,
  getOwnerSession,
} from "../../lib/admin/session";

export default async function AdminBookkeepingPage() {
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

  return (
    <div className="min-h-screen bg-[#F8F6F2]">
      <header className="border-b border-white/10 bg-[#1B3D32] text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-10">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-[#C69C6D]">
              NuvoHauz
            </p>
            <h1 className="mt-1 font-serif text-2xl font-light sm:text-3xl">
              Bookkeeper · Alfa Renovations
            </h1>
            <p className="mt-2 text-sm text-white/75">
              Signed in as {session.owner} · QBO Chart of Accounts batches &amp; CPA docs
            </p>
          </div>
          <Link
            href="/admin"
            className="inline-flex min-h-[44px] items-center rounded-full border border-white/20 px-5 py-2.5 text-sm text-white transition-colors hover:bg-white/10"
          >
            Back to portal
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <BookkeepingWorkspace />
      </main>
    </div>
  );
}
