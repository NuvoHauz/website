import { addDaysToIsoDate, parseIsoDate } from "../booking/costa-rica-dates";
import { createHmac, timingSafeEqual } from "node:crypto";

const TOKEN_SEPARATOR = ".";
const STATUS_GRACE_DAYS_AFTER_CHECKOUT = 30;
/** Costa Rica is UTC−6 year-round (no DST). */
const COSTA_RICA_UTC_OFFSET = "-06:00";

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8")
    .toString("base64url");
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function getGuestStatusTokenSecret(): string | null {
  return process.env.GUEST_STATUS_TOKEN_SECRET?.trim() || null;
}

/**
 * Status links remain valid through checkout plus 30 calendar days (end of that day in Costa Rica).
 */
export function computeGuestStatusTokenExpiration(checkOut: string): number {
  const expiryDate = addDaysToIsoDate(checkOut, STATUS_GRACE_DAYS_AFTER_CHECKOUT);
  const { y, m, d } = parseIsoDate(expiryDate);
  const endOfGraceDayMs = Date.parse(
    `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}T23:59:59${COSTA_RICA_UTC_OFFSET}`,
  );
  const minimumExpiration = Math.floor(Date.now() / 1000) + 3600;
  return Math.max(Math.floor(endOfGraceDayMs / 1000), minimumExpiration);
}

export function signGuestStatusToken(
  bookingId: string,
  checkOut: string,
): string | null {
  const secret = getGuestStatusTokenSecret();
  if (!secret || !checkOut.trim()) return null;

  return signGuestStatusTokenWithExpiration(
    bookingId,
    computeGuestStatusTokenExpiration(checkOut),
  );
}

export function signGuestStatusTokenWithExpiration(
  bookingId: string,
  expiresAtUnix: number,
): string | null {
  const secret = getGuestStatusTokenSecret();
  if (!secret) return null;

  const payload = `${bookingId}:${expiresAtUnix}`;
  const payloadEncoded = base64UrlEncode(payload);
  const signature = createHmac("sha256", secret)
    .update(payloadEncoded)
    .digest("base64url");

  return `${payloadEncoded}${TOKEN_SEPARATOR}${signature}`;
}

export function verifyGuestStatusToken(
  token: string,
): { bookingId: string } | null {
  const secret = getGuestStatusTokenSecret();
  if (!secret || !token.includes(TOKEN_SEPARATOR)) return null;

  const separatorIndex = token.lastIndexOf(TOKEN_SEPARATOR);
  const payloadEncoded = token.slice(0, separatorIndex);
  const providedSignature = token.slice(separatorIndex + 1);
  if (!payloadEncoded || !providedSignature) return null;

  const expectedSignature = createHmac("sha256", secret)
    .update(payloadEncoded)
    .digest("base64url");

  const providedBuffer = Buffer.from(providedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    return null;
  }

  let payload: string;
  try {
    payload = base64UrlDecode(payloadEncoded);
  } catch {
    return null;
  }

  const parts = payload.split(":");
  if (parts.length !== 2) return null;

  const [bookingId, expiresAtRaw] = parts;
  const expiresAt = Number.parseInt(expiresAtRaw, 10);
  if (!bookingId || !Number.isFinite(expiresAt)) return null;
  if (expiresAt <= Math.floor(Date.now() / 1000)) return null;

  return { bookingId };
}

export function buildGuestStatusUrl(token: string): string | null {
  const siteUrl = process.env.NUVOHAUZ_SITE_URL?.trim().replace(/\/+$/, "");
  if (!siteUrl) return null;
  return `${siteUrl}/reservation/status/${encodeURIComponent(token)}`;
}
