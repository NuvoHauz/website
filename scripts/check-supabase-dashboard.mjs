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
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(".env.local");

const url = process.env.SUPABASE_URL ?? "";
const secretKey = process.env.SUPABASE_SECRET_KEY ?? "";
const projectRef = url.match(/^https:\/\/([^.]+)\.supabase\.co/i)?.[1] ?? "unknown";

if (!url || !secretKey) {
  console.log(JSON.stringify({ error: "supabase_env_missing", projectRef }));
  process.exit(1);
}

const supabase = createClient(url, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function probeRpc(name) {
  const { data, error } = await supabase.rpc(name);
  return {
    name,
    ok: !error,
    code: error?.code ?? null,
    message: error?.message ?? null,
    dataType: data === null ? "null" : typeof data,
  };
}

const [ownerHolds, legacyHolds, bookingColumns, blockColumns, adminUpdate] =
  await Promise.all([
    probeRpc("expire_owner_holds"),
    probeRpc("expire_elapsed_approval_holds"),
    supabase.from("booking_requests").select("hold_expires_at, reviewed_at, reviewed_by").limit(1),
    supabase
      .from("availability_blocks")
      .select("booking_request_id, block_expires_at, created_by")
      .limit(1),
    probeRpc("admin_update_booking_request", {
      p_booking_request_id: "00000000-0000-4000-8000-000000000999",
      p_action: "confirm",
      p_owner: "Louie",
    }),
  ]);

console.log(
  JSON.stringify(
    {
      projectRef,
      environmentHint: "production",
      rpc: {
        expire_owner_holds: ownerHolds,
        expire_elapsed_approval_holds: legacyHolds,
        admin_update_booking_request_probe: {
          ok: !adminUpdate.error || adminUpdate.error.code !== "PGRST202",
          code: adminUpdate.error?.code ?? null,
          message: adminUpdate.error?.message ?? null,
        },
      },
      columns: {
        booking_requests_dashboard_fields:
          !bookingColumns.error || bookingColumns.error.code !== "42703",
        booking_requests_error: bookingColumns.error?.code ?? null,
        availability_blocks_dashboard_fields:
          !blockColumns.error || blockColumns.error.code !== "42703",
        availability_blocks_error: blockColumns.error?.code ?? null,
      },
      migrationAppliedLikely:
        ownerHolds.ok &&
        !legacyHolds.ok &&
        legacyHolds.code === "PGRST202" &&
        !bookingColumns.error &&
        !blockColumns.error,
    },
    null,
    2,
  ),
);
