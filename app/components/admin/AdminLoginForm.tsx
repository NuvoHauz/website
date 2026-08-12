"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OWNER_NAMES, type OwnerName } from "../../lib/admin/reservation-types";

type AdminLoginFormProps = {
  configError: string | null;
};

export default function AdminLoginForm({ configError }: AdminLoginFormProps) {
  const router = useRouter();
  const [owner, setOwner] = useState<OwnerName>("Louie");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(configError);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner, password }),
      });

      const payload = (await response.json()) as {
        error?: string;
        message?: string;
      };

      if (!response.ok) {
        if (payload.error === "admin_not_configured") {
          setError(payload.message ?? "Dashboard is not configured.");
        } else if (response.status === 401) {
          setError("Invalid password. Please try again.");
        } else {
          setError("Unable to sign in right now.");
        }
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("Unable to sign in right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-[#111111]/10 bg-white p-6 shadow-sm sm:p-8"
    >
      <label className="block text-sm font-medium text-[#111111]">
        Sign in as
        <select
          value={owner}
          onChange={(event) => setOwner(event.target.value as OwnerName)}
          className="mt-2 w-full rounded-xl border border-[#111111]/15 bg-white px-4 py-3 text-sm outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C69C6D]"
        >
          {OWNER_NAMES.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </label>

      <label className="mt-5 block text-sm font-medium text-[#111111]">
        Dashboard password
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-2 w-full rounded-xl border border-[#111111]/15 bg-white px-4 py-3 text-sm outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C69C6D]"
          required
        />
      </label>

      {error ? (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="mt-6 inline-flex min-h-[44px] w-full items-center justify-center rounded-full bg-[#1B3D32] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#163329] disabled:opacity-60"
      >
        {loading ? "Signing in..." : "Enter Owner Portal"}
      </button>
    </form>
  );
}
