import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { AdminSessionPayload, OwnerName } from "./reservation-types";
import { OWNER_NAMES } from "./reservation-types";

export const OWNER_SESSION_COOKIE = "nuvohauz_owner_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

export class AdminAuthConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminAuthConfigError";
  }
}

function normalizeEnvValue(value: string): string {
  return value.replace(/\r/g, "").trim();
}

function getSessionSecret(): string {
  const secret = normalizeEnvValue(process.env.OWNER_SESSION_SECRET ?? "");
  if (!secret || secret.length < 32) {
    throw new AdminAuthConfigError(
      "OWNER_SESSION_SECRET is missing or too short in the server environment (minimum 32 characters).",
    );
  }
  return secret;
}

function getDashboardPassword(): string {
  const password = normalizeEnvValue(process.env.OWNER_DASHBOARD_PASSWORD ?? "");
  if (!password || password.length < 12) {
    throw new AdminAuthConfigError(
      "OWNER_DASHBOARD_PASSWORD is missing or too short in the server environment (minimum 12 characters).",
    );
  }
  return password;
}

export function isPreviewModeEnabled(): boolean {
  return process.env.NUVOHAUZ_PREVIEW_MODE === "1";
}

export function constantTimeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) {
    timingSafeEqual(leftBuffer, leftBuffer);
    return false;
  }
  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function verifyDashboardPassword(candidate: string): boolean {
  return constantTimeEqual(candidate, getDashboardPassword());
}

function signPayload(payload: string): string {
  return createHmac("sha256", getSessionSecret()).update(payload).digest("base64url");
}

export function createOwnerSession(owner: OwnerName): string {
  const payload: AdminSessionPayload = {
    owner,
    exp: Date.now() + SESSION_TTL_MS,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = signPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function parseOwnerSession(raw: string | undefined | null): AdminSessionPayload | null {
  if (!raw) return null;

  const [encodedPayload, signature] = raw.split(".");
  if (!encodedPayload || !signature) return null;

  const expectedSignature = signPayload(encodedPayload);
  if (!constantTimeEqual(signature, expectedSignature)) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as AdminSessionPayload;

    if (!OWNER_NAMES.includes(payload.owner)) return null;
    if (typeof payload.exp !== "number" || payload.exp <= Date.now()) return null;

    return payload;
  } catch {
    return null;
  }
}

export async function getOwnerSession(): Promise<AdminSessionPayload | null> {
  const cookieStore = await cookies();
  return parseOwnerSession(cookieStore.get(OWNER_SESSION_COOKIE)?.value);
}

export function getSessionCookieOptions(isProduction: boolean) {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict" as const,
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  };
}

export function assertOwnerName(value: string): value is OwnerName {
  return OWNER_NAMES.includes(value as OwnerName);
}

export { getDashboardPassword, getSessionSecret };
