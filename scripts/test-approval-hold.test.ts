import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import {
  APPROVAL_HOLD_MS,
  computeApprovalHoldExpiresAt,
} from "../app/lib/admin/approval-hold";

describe("approval hold duration", () => {
  it("expires approximately one hour after approval", () => {
    const approvedAt = new Date("2026-08-17T15:30:00.000Z");
    const expiresAt = computeApprovalHoldExpiresAt(approvedAt);
    assert.equal(expiresAt.getTime() - approvedAt.getTime(), APPROVAL_HOLD_MS);
    assert.equal(APPROVAL_HOLD_MS, 60 * 60 * 1000);
  });

  it("migration sets admin approval hold to one hour", () => {
    const sql = readFileSync(
      resolve(
        process.cwd(),
        "supabase/migrations/20260817210000_update_approval_hold_to_one_hour.sql",
      ),
      "utf8",
    );
    assert.match(sql, /interval '1 hour'/);
    assert.match(sql, /1-hour approval hold/);
    assert.doesNotMatch(sql, /interval '48 hours'/);
  });
});
