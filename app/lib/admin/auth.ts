import "server-only";

import type { NextRequest } from "next/server";
import { getOwnerSession } from "./session";
import type { AdminSessionPayload } from "./reservation-types";

export async function requireOwnerSession(): Promise<AdminSessionPayload> {
  const session = await getOwnerSession();
  if (!session) {
    throw new Error("unauthenticated");
  }
  return session;
}

function normalizeSiteHost(host: string): string {
  return host.trim().toLowerCase().replace(/^www\./, "");
}

export function isAllowedAdminOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host = request.headers.get("host");
  if (!host) return false;

  try {
    return (
      normalizeSiteHost(new URL(origin).host) === normalizeSiteHost(host)
    );
  } catch {
    return false;
  }
}

export const ADMIN_NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store",
};
