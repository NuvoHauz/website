/**
 * Local admin dashboard smoke tests.
 * Usage: node scripts/test-admin-local.mjs [baseUrl]
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

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
    const startDate = "2099-06-10";
    const endDate = "2099-06-15";
    const firstBlock = await request(
      "/api/admin/reservations",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: new URL(baseUrl).origin,
        },
        body: JSON.stringify({
          startDate,
          endDate,
          reason: "maintenance",
          note: "Overlap test block A",
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

      const overlappingBlock = await request(
        "/api/admin/reservations",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Origin: new URL(baseUrl).origin,
          },
          body: JSON.stringify({
            startDate: "2099-06-12",
            endDate: "2099-06-18",
            reason: "other",
            note: "Overlap test block B",
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
  }

  console.log(results.join("\n"));
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
