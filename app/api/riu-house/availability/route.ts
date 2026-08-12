import { NextResponse } from "next/server";
import { getTodayInCostaRica } from "../../../lib/booking/costa-rica-dates";
import { getAvailabilityHorizonEnd } from "../../../lib/booking/server-validation";
import {
  ACTIVE_BLOCK_STATUS,
  RIU_HOUSE_PROPERTY_SLUG,
  sanitizeBlockedRanges,
} from "../../../lib/booking/blocked-ranges";
import { getSupabaseAdmin } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const horizonStart = getTodayInCostaRica();
    const horizonEnd = getAvailabilityHorizonEnd();

    const primaryResult = await supabase
      .from("availability_blocks")
      .select("start_date, end_date, block_expires_at")
      .eq("property_slug", RIU_HOUSE_PROPERTY_SLUG)
      .eq("status", ACTIVE_BLOCK_STATUS)
      .lt("start_date", horizonEnd)
      .gt("end_date", horizonStart)
      .order("start_date", { ascending: true });

    let data = primaryResult.data;
    let error = primaryResult.error;

    if (error?.code === "42703") {
      const fallbackResult = await supabase
        .from("availability_blocks")
        .select("start_date, end_date")
        .eq("property_slug", RIU_HOUSE_PROPERTY_SLUG)
        .eq("status", ACTIVE_BLOCK_STATUS)
        .lt("start_date", horizonEnd)
        .gt("end_date", horizonStart)
        .order("start_date", { ascending: true });
      data = fallbackResult.data?.map((row) => ({ ...row, block_expires_at: null })) ?? null;
      error = fallbackResult.error;
    }

    if (error) {
      console.error("availability_blocks query failed", error.code, error.message);
      return NextResponse.json({ error: "availability_unavailable" }, { status: 503 });
    }

    const nowIso = new Date().toISOString();
    const blocks = sanitizeBlockedRanges(
      (data ?? [])
        .filter((row) => !row.block_expires_at || row.block_expires_at > nowIso)
        .map((row) => ({
          start: row.start_date,
          end: row.end_date,
        })),
    ).map((range) => ({
      startDate: range.start,
      endDate: range.end,
    }));

    return NextResponse.json(
      { blocks },
      {
        headers: {
          "Cache-Control": "private, max-age=60",
        },
      },
    );
  } catch {
    console.error("availability route configuration error");
    return NextResponse.json({ error: "availability_unavailable" }, { status: 503 });
  }
}
