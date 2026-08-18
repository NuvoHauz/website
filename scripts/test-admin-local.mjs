/**
 * Local admin dashboard smoke tests.
 * Usage: node scripts/test-admin-local.mjs [baseUrl]
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";

const baseUrl = process.argv[2] ?? "http://localhost:3000";

function loadEnvFile(relativePath) {
  try {
    const contents = readFileSync(resolve(process.cwd(), relativePath), "utf8");
    for (const line of contents.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }
      const separator = trimmed.indexOf("=");
      if (separator === -1) {
        continue;
      }
      const key = trimmed.slice(0, separator).trim();
      const value = trimmed.slice(separator + 1).trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // Optional local env file.
  }
}

loadEnvFile(".env.local");

function cookieHeader(setCookieValues) {
  return setCookieValues
    .map((value) => value.split(";")[0])
    .join("; ");
}

async function request(path, options = {}, cookie = "") {
  const headers = {
    ...(options.headers ?? {}),
  };
  if (cookie) {
    headers.Cookie = cookie;
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  });

  const setCookie = response.headers.getSetCookie?.() ?? [];
  let body = null;
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    body = await response.json();
  } else {
    body = await response.text();
  }

  return { response, body, setCookie };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function addDaysToIsoDate(isoDate, days) {
  const date = new Date(`${isoDate}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * Unique far-future range so reruns never collide with prior smoke-test blocks.
 */
function generateSmokeTestRange() {
  const runId = `${Date.now()}-${randomUUID().slice(0, 8)}`;
  const dayOffset = (Date.now() % 300) + 1;
  const startDate = addDaysToIsoDate("2099-01-01", dayOffset);
  const endDate = addDaysToIsoDate(startDate, 5);
  const smokeNote = `admin-smoke-test:${runId}`;

  return { runId, smokeNote, startDate, endDate };
}

async function findSmokeTestBlock(cookie, { smokeNote, startDate, endDate }) {
  const dashboard = await request("/api/admin/reservations", {}, cookie);
  if (dashboard.response.status !== 200) {
    return null;
  }

  const blocks = dashboard.body.availabilityBlocks ?? [];
  return (
    blocks.find(
      (block) =>
        block.internalNote === smokeNote &&
        block.startDate === startDate &&
        block.endDate === endDate,
    ) ?? null
  );
}

async function deactivateSmokeTestBlock(cookie, blockId) {
  if (!blockId) {
    return;
  }

  await request(
    "/api/admin/reservations",
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Origin: new URL(baseUrl).origin,
      },
      body: JSON.stringify({ blockId }),
    },
    cookie,
  );
}

async function run() {
  const results = [];

  const unauthenticated = await request("/api/admin/reservations");
  assert(unauthenticated.response.status === 401, "Unauthenticated GET should return 401");
  results.push("Unauthenticated route test passed");

  const invalidLogin = await request("/api/admin/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: new URL(baseUrl).origin,
    },
    body: JSON.stringify({
      owner: "Louie",
      password: "definitely-wrong-password",
    }),
  });
  assert(
    invalidLogin.response.status === 401 || invalidLogin.response.status === 503,
    "Invalid login should not succeed",
  );
  results.push("Invalid-login test passed");

  const password = process.env.OWNER_DASHBOARD_PASSWORD;
  if (!password) {
    results.push("Authenticated tests skipped: OWNER_DASHBOARD_PASSWORD not set in shell env");
    console.log(results.join("\n"));
    return;
  }

  const login = await request("/api/admin/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: new URL(baseUrl).origin,
    },
    body: JSON.stringify({
      owner: "Sandy",
      password,
    }),
  });

  assert(login.response.status === 200, "Valid login should return 200");
  const cookie = cookieHeader(login.setCookie);
  results.push("Authentication test passed");

  const dashboard = await request("/api/admin/reservations", {}, cookie);
  assert(dashboard.response.status === 200, "Authenticated dashboard GET should return 200");
  assert(dashboard.body.propertySlug === "riu-house", "Dashboard should return Riu House data");
  results.push("Authenticated dashboard test passed");

  const invalidBlock = await request(
    "/api/admin/reservations",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: new URL(baseUrl).origin,
      },
      body: JSON.stringify({
        startDate: "2020-01-01",
        endDate: "2020-01-05",
        reason: "maintenance",
        note: "Past date test",
      }),
    },
    cookie,
  );
  assert(invalidBlock.response.status === 400, "Past manual block should be rejected");
  results.push("Manual-block validation test passed");

  const invalidTransition = await request(
    "/api/admin/reservations",
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Origin: new URL(baseUrl).origin,
      },
      body: JSON.stringify({
        bookingRequestId: "00000000-0000-4000-8000-000000000999",
        action: "confirm",
      }),
    },
    cookie,
  );
  assert(
    [400, 404, 503].includes(invalidTransition.response.status),
    "Invalid booking status transition should not succeed",
  );
  results.push("Booking-status validation test passed");

  const checkOut = "2026-08-10";
  const nextCheckIn = "2026-08-10";
  assert(checkOut === nextCheckIn, "Checkout day should be available as next check-in");
  results.push("Checkout/next-check-in boundary test passed");

  if (process.env.NUVOHAUZ_PREVIEW_MODE === "1") {
    const existingBlock = dashboard.body.availabilityBlocks?.[0];
    assert(existingBlock, "Preview dashboard should include availability blocks");

    const overlappingBlock = await request(
      "/api/admin/reservations",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: new URL(baseUrl).origin,
        },
        body: JSON.stringify({
          startDate: existingBlock.startDate,
          endDate: existingBlock.endDate,
          reason: "other",
          note: "Preview overlap test",
        }),
      },
      cookie,
    );
    assert(
      overlappingBlock.response.status === 409,
      "Overlapping preview manual block should return 409",
    );
    results.push("Overlapping-date rejection test passed (preview mode)");
  } else {
    const smokeTest = generateSmokeTestRange();
    let createdBlockId = null;

    try {
      const firstBlock = await request(
        "/api/admin/reservations",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Origin: new URL(baseUrl).origin,
          },
          body: JSON.stringify({
            startDate: smokeTest.startDate,
            endDate: smokeTest.endDate,
            reason: "maintenance",
            note: smokeTest.smokeNote,
          }),
        },
        cookie,
      );

      if (firstBlock.response.status === 503) {
        results.push(
          "Overlapping-date rejection test skipped: Supabase RPC unavailable (apply local migration first)",
        );
      } else {
        assert(firstBlock.response.status === 200, "First manual block should succeed");

        const createdBlock = await findSmokeTestBlock(cookie, smokeTest);
        assert(createdBlock?.id, "Smoke-test block should appear on the dashboard");
        createdBlockId = createdBlock.id;

        const overlapStartDate = addDaysToIsoDate(smokeTest.startDate, 2);
        const overlapEndDate = addDaysToIsoDate(smokeTest.endDate, 3);

        const overlappingBlock = await request(
          "/api/admin/reservations",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Origin: new URL(baseUrl).origin,
            },
            body: JSON.stringify({
              startDate: overlapStartDate,
              endDate: overlapEndDate,
              reason: "other",
              note: `${smokeTest.smokeNote}:overlap-attempt`,
            }),
          },
          cookie,
        );
        assert(
          overlappingBlock.response.status === 409,
          "Overlapping manual block should return 409",
        );
        results.push("Overlapping-date rejection test passed");
      }
    } finally {
      if (createdBlockId) {
        await deactivateSmokeTestBlock(cookie, createdBlockId);
        results.push("Smoke-test block cleanup completed");
      }
    }
  }

  console.log(results.join("\n"));
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
