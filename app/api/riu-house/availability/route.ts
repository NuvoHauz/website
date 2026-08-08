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

    const { data, error } = await supabase
      .from("availability_blocks")
      .select("start_date, end_date")
      .eq("property_slug", RIU_HOUSE_PROPERTY_SLUG)
      .eq("status", ACTIVE_BLOCK_STATUS)
      .lt("start_date", horizonEnd)
      .gt("end_date", horizonStart)
      .order("start_date", { ascending: true });

    if (error) {
      console.error("availability_blocks query failed", error.code, error.message);
      return NextResponse.json({ error: "availability_unavailable" }, { status: 503 });
    }

    const blocks = sanitizeBlockedRanges(
      (data ?? []).map((row) => ({
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
