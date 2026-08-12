/**
 * Read-only production preflight for owner dashboard migration.
 * Usage: node scripts/preflight-owner-dashboard.mjs
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

function isoRangesOverlap(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}

loadEnvFile(".env.local");

const url = process.env.SUPABASE_URL ?? "";
const secretKey = process.env.SUPABASE_SECRET_KEY ?? "";
const projectRef = url.match(/^https:\/\/([^.]+)\.supabase\.co/i)?.[1] ?? "unknown";

if (!url || !secretKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function exactCount(table, filters = []) {
  let query = supabase.from(table).select("*", { count: "exact", head: true });
  for (const [column, value] of filters) {
    query = query.eq(column, value);
  }
  const { count, error } = await query;
  if (error) throw new Error(`${table} count failed: ${error.code} ${error.message}`);
  return count ?? 0;
}

async function fetchAll(table, select, filters = []) {
  const pageSize = 1000;
  const rows = [];
  let from = 0;

  while (true) {
    let query = supabase.from(table).select(select).range(from, from + pageSize - 1);
    for (const [column, value] of filters) {
      query = query.eq(column, value);
    }
    const { data, error } = await query;
    if (error) throw new Error(`${table} select failed: ${error.code} ${error.message}`);
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return rows;
}

async function probeRpcExists(name, args = undefined) {
  const { error } = args ? await supabase.rpc(name, args) : await supabase.rpc(name);
  if (!error) {
    return { exists: true, code: null, message: null };
  }
  if (error.code === "PGRST202") {
    return { exists: false, code: error.code, message: error.message };
  }
  return { exists: true, code: error.code, message: error.message };
}

async function fetchOpenApiFunctions() {
  const response = await fetch(`${url}/rest/v1/`, {
    headers: {
      apikey: secretKey,
      Authorization: `Bearer ${secretKey}`,
      Accept: "application/openapi+json",
    },
  });
  if (!response.ok) {
    return { ok: false, status: response.status };
  }
  const schema = await response.json();
  const paths = schema.paths ?? {};
  const adminPaths = Object.keys(paths).filter((path) =>
    path.includes("admin_") || path.includes("expire_") || path.includes("claim_booking"),
  );
  return { ok: true, adminPaths, definitions: schema.definitions ?? schema.components?.schemas ?? {} };
}

function findOverlapPairs(blocks) {
  const pairs = [];
  for (let i = 0; i < blocks.length; i += 1) {
    for (let j = i + 1; j < blocks.length; j += 1) {
      const a = blocks[i];
      const b = blocks[j];
      if (a.property_slug !== b.property_slug) continue;
      if (
        isoRangesOverlap(a.start_date, a.end_date, b.start_date, b.end_date)
      ) {
        pairs.push({
          propertySlug: a.property_slug,
          blockA: { id: a.id, start: a.start_date, end: a.end_date, type: a.block_type },
          blockB: { id: b.id, start: b.start_date, end: b.end_date, type: b.block_type },
        });
      }
    }
  }
  return pairs;
}

function inspectBookingLinks(blocks) {
  const knownColumns = new Set();
  for (const block of blocks.slice(0, 5)) {
    Object.keys(block).forEach((key) => knownColumns.add(key));
  }

  const populated = {};
  for (const key of knownColumns) {
    populated[key] = blocks.filter((row) => row[key] != null && row[key] !== "").length;
  }

  const uuidLike = /[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;
  const noteMatches = blocks
    .filter((row) => typeof row.internal_note === "string" && uuidLike.test(row.internal_note))
    .map((row) => ({ id: row.id, internal_note: row.internal_note }));

  return { knownColumns: [...knownColumns].sort(), populated, noteMatches };
}

const [
  bookingRequestCount,
  activeBlockCount,
  activeBlocks,
  sampleBooking,
  sampleBlock,
  openapi,
  expireOwnerHolds,
  expireLegacy,
  adminUpdateExists,
  adminCreateExists,
  adminDeactivateExists,
  claimBookingExists,
] = await Promise.all([
  exactCount("booking_requests"),
  exactCount("availability_blocks", [["status", "active"]]),
  fetchAll(
    "availability_blocks",
    "id, property_slug, start_date, end_date, block_type, status, internal_note, created_at, updated_at",
    [["status", "active"]],
  ),
  supabase.from("booking_requests").select("*").limit(1),
  supabase.from("availability_blocks").select("*").limit(1),
  fetchOpenApiFunctions(),
  probeRpcExists("expire_owner_holds"),
  probeRpcExists("expire_elapsed_approval_holds"),
  probeRpcExists("admin_update_booking_request", {
    p_booking_request_id: "00000000-0000-4000-8000-000000000999",
    p_action: "confirm",
    p_owner: "Louie",
  }),
  probeRpcExists("admin_create_manual_block"),
  probeRpcExists("admin_deactivate_manual_block"),
  probeRpcExists("claim_booking_notification", {
    p_idempotency_key: "00000000-0000-4000-8000-000000000999",
  }),
]);

const overlapPairs = findOverlapPairs(activeBlocks);
const bookingLinks = inspectBookingLinks(activeBlocks);

const bookingColumns = sampleBooking.error
  ? { error: sampleBooking.error.code, message: sampleBooking.error.message }
  : Object.keys(sampleBooking.data?.[0] ?? {}).sort();

const blockColumns = sampleBlock.error
  ? { error: sampleBlock.error.code, message: sampleBlock.error.message }
  : Object.keys(sampleBlock.data?.[0] ?? {}).sort();

const dashboardColumnsPresent = {
  booking_requests: {
    hold_expires_at: bookingColumns.includes?.("hold_expires_at") ?? false,
    reviewed_at: bookingColumns.includes?.("reviewed_at") ?? false,
    reviewed_by: bookingColumns.includes?.("reviewed_by") ?? false,
  },
  availability_blocks: {
    booking_request_id: blockColumns.includes?.("booking_request_id") ?? false,
    block_expires_at: blockColumns.includes?.("block_expires_at") ?? false,
    created_by: blockColumns.includes?.("created_by") ?? false,
  },
};

console.log(
  JSON.stringify(
    {
      projectRef,
      environment: "production",
      counts: {
        booking_requests: bookingRequestCount,
        active_availability_blocks: activeBlockCount,
      },
      overlap: {
        halfOpenRule: "[start_date, end_date)",
        overlappingActivePairs: overlapPairs.length,
        pairs: overlapPairs.slice(0, 20),
      },
      bookingRequestLinks: bookingLinks,
      schema: {
        booking_requests_columns: bookingColumns,
        availability_blocks_columns: blockColumns,
        dashboard_columns_present: dashboardColumnsPresent,
      },
      rpcPresence: {
        expire_owner_holds: expireOwnerHolds,
        expire_elapsed_approval_holds: expireLegacy,
        admin_update_booking_request: adminUpdateExists,
        admin_create_manual_block: adminCreateExists,
        admin_deactivate_manual_block: adminDeactivateExists,
        claim_booking_notification: claimBookingExists,
      },
      postgrestOpenApi: openapi,
    },
    null,
    2,
  ),
);
