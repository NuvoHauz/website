import { redirect } from "next/navigation";
import AdminLoginForm from "../../components/admin/AdminLoginForm";
import {
  AdminAuthConfigError,
  getOwnerSession,
} from "../../lib/admin/session";

export default async function AdminLoginPage() {
  let configError: string | null = null;

  try {
    const session = await getOwnerSession();
    if (session) {
      redirect("/admin");
    }
  } catch (error) {
    if (error instanceof AdminAuthConfigError) {
      configError = error.message;
    } else {
      throw error;
    }
  }

  return (
    <main className="min-h-screen bg-[#F8F6F2] px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-[#C69C6D]">
            NuvoHauz
          </p>
          <h1 className="mt-3 font-serif text-3xl font-light text-[#111111]">
            Private Owner Portal
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[#111111]/70">
            Sign in to review Riu House booking requests, holds, and calendar
            blocks.
          </p>
        </div>
        <AdminLoginForm configError={configError} />
      </div>
    </main>
  );
}
