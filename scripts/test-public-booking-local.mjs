/**
 * Read-only public booking/availability smoke tests (no booking inserts).
 * Usage: node scripts/test-public-booking-local.mjs [baseUrl]
 */

const baseUrl = process.argv[2] ?? "http://localhost:3000";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const contentType = response.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json")
    ? await response.json()
    : await response.text();
  return { response, body };
}

async function run() {
  const results = [];

  const availability = await request("/api/riu-house/availability");
  assert(availability.response.status === 200, "Availability GET should return 200");
  assert(Array.isArray(availability.body.blocks), "Availability should return blocks array");
  results.push("Availability GET passed");

  const missingIdempotency = await request("/api/riu-house/booking-requests", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: new URL(baseUrl).origin,
    },
    body: JSON.stringify({}),
  });
  assert(
    missingIdempotency.response.status === 400,
    "Booking POST without idempotency key should return 400",
  );
  results.push("Booking validation (missing idempotency) passed");

  const invalidIdempotency = await request("/api/riu-house/booking-requests", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: new URL(baseUrl).origin,
      "idempotency-key": "not-a-uuid",
    },
    body: JSON.stringify({}),
  });
  assert(
    invalidIdempotency.response.status === 400,
    "Booking POST with invalid idempotency key should return 400",
  );
  results.push("Booking validation (invalid idempotency) passed");

  console.log(results.join("\n"));
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
