/**
 * Diagnose approve_hold failure for a booking request reference.
 * Usage: node scripts/diagnose-approve-hold.mjs [baseUrl] [requestReference]
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(relativePath) {
  const contents = readFileSync(resolve(process.cwd(), relativePath), "utf8");
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

function cookieHeader(setCookieValues) {
  return setCookieValues.map((value) => value.split(";")[0]).join("; ");
}

loadEnvFile(".env.local");

const baseUrl = process.argv[2] ?? "http://localhost:3000";
const requestReference = process.argv[3] ?? "NH-D8C1E3E0C5";
const password = process.env.OWNER_DASHBOARD_PASSWORD;

const url = process.env.SUPABASE_URL ?? "";
const secretKey = process.env.SUPABASE_SECRET_KEY ?? "";
const supabase = createClient(url, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function fetchOpenApiRpcPaths() {
  const response = await fetch(`${url}/rest/v1/`, {
    headers: {
      apikey: secretKey,
      Authorization: `Bearer ${secretKey}`,
      Accept: "application/openapi+json",
    },
  });
  if (!response.ok) return [];
  const schema = await response.json();
  return Object.keys(schema.paths ?? {}).filter((path) => path.startsWith("/rpc/"));
}

const bookingRow = await supabase
  .from("booking_requests")
  .select("id, request_reference, status, check_in, check_out, property_slug")
  .eq("request_reference", requestReference)
  .maybeSingle();

const rpcPaths = await fetchOpenApiRpcPaths();

const rpcProbes = {};
for (const name of [
  "admin_update_booking_request",
  "admin_set_booking_status",
  "expire_owner_holds",
]) {
  const exists = rpcPaths.includes(`/rpc/${name}`);
  let probe = { exposedInOpenApi: exists, error: null };
  if (exists && bookingRow.data?.id) {
    const { error } = await supabase.rpc(name, {
      p_booking_request_id: bookingRow.data.id,
      p_action: "approve_hold",
      p_owner: "Louie",
    });
    probe.error = error
      ? { code: error.code, message: error.message, details: error.details, hint: error.hint }
      : null;
  }
  rpcProbes[name] = probe;
}

let patchResult = null;
if (password) {
  const login = await fetch(`${baseUrl}/api/admin/session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: new URL(baseUrl).origin,
    },
    body: JSON.stringify({ owner: "Louie", password }),
  });
  const setCookie = login.headers.getSetCookie?.() ?? [];
  const cookie = cookieHeader(setCookie);

  if (bookingRow.data?.id) {
    const patch = await fetch(`${baseUrl}/api/admin/reservations`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Origin: new URL(baseUrl).origin,
        Cookie: cookie,
      },
      body: JSON.stringify({
        bookingRequestId: bookingRow.data.id,
        action: "approve_hold",
      }),
    });
    patchResult = {
      status: patch.status,
      body: await patch.json(),
    };
  }
}

console.log(
  JSON.stringify(
    {
      requestReference,
      bookingRow: bookingRow.data,
      bookingLookupError: bookingRow.error?.code ?? null,
      rpcPaths: rpcPaths.filter((path) => path.includes("admin") || path.includes("expire")),
      rpcProbes,
      patchResult,
    },
    null,
    2,
  ),
);
